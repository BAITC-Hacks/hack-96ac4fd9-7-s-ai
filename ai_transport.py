"""Small OpenAI Responses client; standard library only, credentials stay server-side."""
from __future__ import annotations

import json
import os
import socket
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DEFAULT_MODEL = "gpt-4.1-mini-2025-04-14"


class AIProviderError(RuntimeError):
    """Safe failure code. Never expose a provider response or credentials."""

    def __init__(self, code):
        self.code = code
        super().__init__(code)


def _local_settings(root):
    """Read only relevant literal .env settings, without executing shell syntax."""
    values = {}
    for path in (Path(root) / "backend" / ".env", Path(root) / ".env"):
        try:
            lines = path.read_text(encoding="utf-8-sig").splitlines()
        except (OSError, UnicodeError):
            continue
        for line in lines:
            key, separator, value = line.strip().removeprefix("export ").partition("=")
            if separator and key.strip() in ("OPENAI_API_KEY", "OPENAI_MODEL"):
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                values[key.strip()] = value
    return values


class OpenAITransport:
    def __init__(self, api_key="", model=DEFAULT_MODEL):
        self._api_key = api_key.strip()
        self.model = model or DEFAULT_MODEL
        self.configured = bool(self._api_key)

    @classmethod
    def from_environment(cls, root):
        local = _local_settings(root)
        return cls(os.environ.get("OPENAI_API_KEY") or local.get("OPENAI_API_KEY", ""),
                   os.environ.get("OPENAI_MODEL") or local.get("OPENAI_MODEL", DEFAULT_MODEL))

    def __call__(self, payload, timeout_seconds):
        if not self.configured:
            raise AIProviderError("not_configured")
        if timeout_seconds <= 0:
            raise AIProviderError("timeout")
        body = dict(payload, model=self.model, store=False)
        request = Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps(body, ensure_ascii=False, allow_nan=False).encode("utf-8"),
            headers={"Authorization": "Bearer " + self._api_key,
                     "Content-Type": "application/json", "User-Agent": "Firebird-Hackathon/1.0"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=timeout_seconds) as response:
                raw = response.read(1_048_577)
                if len(raw) > 1_048_576:
                    raise AIProviderError("invalid_response")
                result = json.loads(raw.decode("utf-8"))
                if not isinstance(result, dict) or result.get("error"):
                    raise AIProviderError("invalid_response")
                return result
        except HTTPError as error:
            code = "authentication" if error.code in (401, 403) else "rate_limit" if error.code == 429 else "provider_error"
            raise AIProviderError(code) from None
        except (TimeoutError, socket.timeout):
            raise AIProviderError("timeout") from None
        except URLError as error:
            code = "timeout" if isinstance(error.reason, (TimeoutError, socket.timeout)) else "connection"
            raise AIProviderError(code) from None
        except (ValueError, UnicodeError):
            raise AIProviderError("invalid_response") from None
