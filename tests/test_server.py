"""Local HTTP integration gates; binds one server to an OS-assigned test port."""

import json
import threading
import unittest
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from server import create_server


VALID_QUERY = {
    "city": "Алматы", "date": "2026-10-09", "event_format": "корпоратив",
    "category": "Ведущий", "budget_kzt": 1_000_000, "language": "русский",
    "duration_hours": 4, "preferences": "", "ui_language": "kk",
}


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = create_server(host="127.0.0.1", port=0)
        cls.base_url = f"http://127.0.0.1:{cls.server.server_address[1]}"
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)

    def post(self, body):
        request = Request(self.base_url + "/api/recommend", data=body,
                          headers={"Content-Type": "application/json"}, method="POST")
        return urlopen(request, timeout=10)

    def recommend(self, query):
        with self.post(json.dumps(query, ensure_ascii=False).encode("utf-8")) as response:
            self.assertEqual(response.status, 200)
            return json.load(response)

    def test_health_metadata_and_frontend_are_served(self):
        with urlopen(self.base_url + "/api/health", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(json.load(response)["status"], "ok")
        with urlopen(self.base_url + "/api/meta", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertIsInstance(json.load(response), dict)
        with urlopen(self.base_url + "/", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertIn("text/html", response.headers.get("Content-Type", ""))
            self.assertIn("firebird", response.read().decode("utf-8").lower())

    def test_post_returns_live_catalog_matches(self):
        result = self.recommend(VALID_QUERY)
        self.assertEqual(result["outcome"], "matches")
        self.assertEqual(result["summary"]["eligible_count"], 4)
        self.assertEqual(len(result["cards"]), 3)
        self.assertTrue({card["id"] for card in result["cards"]}.issubset(
            {"HK-44733", "HK-88430", "HK-35215", "HK-77838"}))

    def test_date_change_explains_only_calendar_confirmed_transitions(self):
        first = self.recommend(VALID_QUERY)
        second = self.recommend(dict(VALID_QUERY, date="2026-10-10", previous_query=VALID_QUERY))
        first_ids = {card["id"] for card in first["cards"]}
        second_ids = {card["id"] for card in second["cards"]}
        changes = second["date_change"]
        self.assertEqual(changes["previous_date"], "2026-10-09")
        self.assertEqual(changes["current_date"], "2026-10-10")
        unavailable_ids = {row["id"] for row in changes["unavailable"]}
        new_ids = {row["id"] for row in changes["newly_available"]}
        self.assertEqual(unavailable_ids, first_ids & {"HK-44733", "HK-35215"})
        self.assertEqual(new_ids, second_ids & {"HK-27222", "HK-29829"})
        self.assertTrue(unavailable_ids)
        self.assertTrue(new_ids)
        self.assertTrue(all(row["reason"] == "busy_date" for row in changes["unavailable"]))

    def test_invalid_query_and_malformed_json_are_client_errors(self):
        invalid_query = json.dumps(dict(VALID_QUERY, date="2027-01-01")).encode("utf-8")
        for body in (invalid_query, b"{not-json"):
            with self.subTest(body=body), self.assertRaises(HTTPError) as caught:
                self.post(body)
            self.assertEqual(caught.exception.code, 400)
            self.assertIsInstance(json.loads(caught.exception.read()), dict)

    def test_unknown_path_is_not_a_successful_page(self):
        with self.assertRaises(HTTPError) as caught:
            urlopen(self.base_url + "/does-not-exist", timeout=3)
        self.assertEqual(caught.exception.code, 404)

    def test_product_pages_and_catalog_api_are_served(self):
        for path in ("/catalog", "/contractor/HK-39372", "/saved", "/compare", "/history"):
            with self.subTest(path=path), urlopen(self.base_url + path, timeout=3) as response:
                self.assertEqual(response.status, 200)
                self.assertIn("text/html", response.headers.get("Content-Type", ""))
                self.assertIn("firebird", response.read().decode("utf-8").lower())
        params = urlencode({"city": "Алматы", "category": "Ведущий", "page_size": "4"})
        with urlopen(self.base_url + "/api/catalog?" + params, timeout=3) as response:
            result = json.load(response)
        self.assertEqual(result["total"], 10)
        self.assertEqual(len(result["items"]), 4)
        self.assertTrue(all(item["city"] == "Алматы" and "Ведущий" in item["categories"]
                            for item in result["items"]))

    def test_profile_api_preserves_data_and_unknown_id_returns_404(self):
        with urlopen(self.base_url + "/api/contractors/HK-39372", timeout=3) as response:
            profile = json.load(response)
        self.assertEqual(profile["id"], "HK-39372")
        self.assertEqual(profile["price_from_kzt"], 200_000)
        self.assertIs(profile["price_imputed"], True)
        self.assertTrue(profile["description"])
        self.assertIn("2026-10-01", profile["busy_dates"])
        with self.assertRaises(HTTPError) as caught:
            urlopen(self.base_url + "/api/contractors/NOT-A-CATALOG-ID", timeout=3)
        self.assertEqual(caught.exception.code, 404)

    def test_comparison_api_preserves_order_and_rejects_duplicates(self):
        params = urlencode({"ids": "HK-27222,HK-44733", "date": "2026-10-09"})
        with urlopen(self.base_url + "/api/compare?" + params, timeout=3) as response:
            result = json.load(response)
        self.assertEqual([item["id"] for item in result["items"]], ["HK-27222", "HK-44733"])
        self.assertEqual([item["available_on_date"] for item in result["items"]], [False, True])
        duplicates = urlencode({"ids": "HK-88430,HK-88430"})
        with self.assertRaises(HTTPError) as caught:
            urlopen(self.base_url + "/api/compare?" + duplicates, timeout=3)
        self.assertEqual(caught.exception.code, 400)


if __name__ == "__main__":
    unittest.main()
