"""Firebird HTTP application. Python standard library; no installation step."""
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from matcher import load_catalog, metadata, recommend

ROOT = Path(__file__).resolve().parent
MAX_BODY_BYTES = 32_768


def demo_queries():
    host = dict(city="Алматы", category="Ведущий", event_format="корпоратив",
                budget_kzt=1_000_000, language="русский", duration_hours=4,
                preferences="")
    florist = dict(city="Алматы", category="Флорист", event_format="свадьба",
                   budget_kzt=300_000, language="русский", duration_hours=None,
                   preferences="")
    return [
        {"id": "corporate", "label": {"kk": "Корпоратив · 9 қазан", "ru": "Корпоратив · 9 октября"},
         "query": dict(host, date="2026-10-09")},
        {"id": "another-date", "label": {"kk": "Басқа күн · 10 қазан", "ru": "Другая дата · 10 октября"},
         "query": dict(host, date="2026-10-10")},
        {"id": "florist", "label": {"kk": "Флорист · 2 нұсқа", "ru": "Флорист · 2 варианта"},
         "query": dict(florist, date="2026-10-09")},
        {"id": "all-busy", "label": {"kk": "Барлығы бос емес", "ru": "Все заняты"},
         "query": dict(florist, date="2026-10-01")},
        {"id": "budget", "label": {"kk": "Бюджет жеткіліксіз", "ru": "Недостаточный бюджет"},
         "query": dict(host, date="2026-10-16", budget_kzt=400_000)},
        {"id": "no-category", "label": {"kk": "Қалада санат жоқ", "ru": "В городе нет категории"},
         "query": dict(city="Астана", category="Декоратор", date="2026-10-09",
                       event_format="корпоратив", budget_kzt=3_000_000,
                       language="русский", duration_hours=None, preferences="")},
    ]


def date_comparison(catalog, current, previous_query):
    """Explain only calendar changes that are confirmed by source busy_dates."""
    if not isinstance(previous_query, dict):
        return None
    try:
        previous = recommend(catalog, previous_query)
    except (ValueError, TypeError):
        return None
    a, b = previous["query"], current["query"]
    fields = ("city", "category", "event_format", "budget_kzt", "language",
              "duration_hours", "preferences")
    if a.get("date") == b.get("date") or any(a.get(k) != b.get(k) for k in fields):
        return None
    by_id = {row["id"]: row for row in catalog}
    unavailable, newly_available = [], []
    for card in previous["cards"]:
        row = by_id[card["id"]]
        if b["date"] in row["busy_dates"]:
            unavailable.append(dict(id=card["id"], name=card["name"], reason="busy_date"))
    for card in current["cards"]:
        row = by_id[card["id"]]
        if a["date"] in row["busy_dates"]:
            newly_available.append(dict(id=card["id"], name=card["name"]))
    return dict(previous_date=a["date"], current_date=b["date"],
                unavailable=unavailable, newly_available=newly_available)


def create_server(host="127.0.0.1", port=8000, catalog_path=None, static_dir=None):
    source = Path(catalog_path) if catalog_path else ROOT / "data" / "catalog.csv"
    public = (Path(static_dir) if static_dir else ROOT / "static").resolve()
    catalog = load_catalog(source)
    catalog_version = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    info = dict(metadata(catalog), demos=demo_queries(), catalog_version=catalog_version)

    class Handler(BaseHTTPRequestHandler):
        server_version = "Firebird/1.0"

        def send_json(self, status, payload):
            body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        def do_GET(self):
            path = unquote(urlsplit(self.path).path)
            if path in ("/api/health", "/health"):
                return self.send_json(200, {"status": "ok", "profiles": len(catalog),
                                            "catalog_version": catalog_version})
            if path == "/api/meta":
                return self.send_json(200, info)
            if path.startswith("/api/"):
                return self.send_json(404, {"error": "Not found"})
            relative = "index.html" if path in ("", "/") else path.lstrip("/")
            file = (public / relative).resolve()
            if not file.is_relative_to(public) or not file.is_file():
                return self.send_json(404, {"error": "Not found"})
            if file.suffix.lower() not in {".html", ".css", ".js", ".svg", ".png", ".ico", ".webp"}:
                return self.send_json(404, {"error": "Not found"})
            body = file.read_bytes()
            mime = mimetypes.guess_type(str(file))[0] or "application/octet-stream"
            if file.suffix.lower() == ".js":
                mime = "text/javascript"
            if mime.startswith("text/") or mime == "image/svg+xml":
                mime += "; charset=utf-8"
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-cache")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        def do_HEAD(self):
            self.do_GET()

        def do_POST(self):
            if urlsplit(self.path).path != "/api/recommend":
                return self.send_json(404, {"error": "Not found"})
            started = time.perf_counter()
            try:
                content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip()
                if content_type != "application/json":
                    return self.send_json(415, {"error": "Сұранысты JSON форматында жіберіңіз."})
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > MAX_BODY_BYTES:
                    return self.send_json(413, {"error": "Сұраныс көлемі жарамсыз."})
                request = json.loads(self.rfile.read(length).decode("utf-8"))
                if not isinstance(request, dict):
                    raise ValueError("Сұраныс JSON объектісі болуы керек.")
                previous_query = request.pop("previous_query", None)
                result = recommend(catalog, request)
                result["date_change"] = date_comparison(catalog, result, previous_query)
                result["catalog_version"] = catalog_version
                result["elapsed_ms"] = round((time.perf_counter() - started) * 1000, 2)
                self.send_json(200, result)
            except (ValueError, UnicodeError, TypeError) as error:
                self.send_json(400, {"error": str(error) or "Сұранысты тексеріңіз."})
            except (BrokenPipeError, ConnectionResetError):
                pass
            except Exception:
                self.log_error("Unexpected recommendation error")
                self.send_json(500, {"error": "Іріктеу кезінде қате болды. Қайта көріңіз."})

        def log_message(self, fmt, *args):
            # Avoid logging request bodies or free-form user preferences.
            super().log_message(fmt, *args)

    server = ThreadingHTTPServer((host, int(port)), Handler)
    server.daemon_threads = True
    return server


def main():
    parser = argparse.ArgumentParser(description="Firebird contractor matching")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")))
    options = parser.parse_args()
    server = create_server(options.host, options.port)
    print(f"Firebird: http://{options.host}:{server.server_port}", flush=True)
    print("Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
