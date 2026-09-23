"""Catalogue, profile and comparison gates for the product expansion."""

import unittest
from datetime import date, timedelta
from pathlib import Path

from catalog_service import browse_catalog, compare_contractors, contractor_detail
from matcher import load_catalog


ROOT = Path(__file__).resolve().parents[1]
CALENDAR = {"min": "2026-09-23", "max": "2026-12-31"}


class CatalogServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog(ROOT / "data" / "catalog.csv")
        cls.by_id = {row["id"]: row for row in cls.catalog}

    def test_city_category_filters_never_leak_other_profiles(self):
        result = browse_catalog(self.catalog, {
            "city": "Алматы", "category": "Ведущий", "page_size": "24",
        })
        self.assertEqual(result["total"], 10)
        self.assertEqual(len(result["items"]), 10)
        for item in result["items"]:
            with self.subTest(id=item["id"]):
                self.assertEqual(item["city"], "Алматы")
                self.assertIn("Ведущий", item["categories"])
        absent = browse_catalog(self.catalog, {"city": "Астана", "category": "Декоратор"})
        self.assertEqual(absent["items"], [])
        self.assertEqual(absent["total"], 0)
        self.assertEqual(absent["total_pages"], 0)

    def test_case_insensitive_search_finds_name_description_and_id(self):
        for term in ("чОпПеР", "SKYLUMEN", "hk-39372"):
            with self.subTest(term=term):
                result = browse_catalog(self.catalog, {"q": term, "page_size": "24"})
                self.assertIn("HK-39372", {item["id"] for item in result["items"]})
                for item in result["items"]:
                    source = self.by_id[item["id"]]
                    searchable = " ".join([source["id"], source["anon_name"], source["city"],
                                           *source["categories"], source["description"]]).casefold()
                    self.assertIn(term.casefold(), searchable)
        combined = browse_catalog(self.catalog, {"city": "Астана", "q": "HK-39372"})
        self.assertEqual(combined["total"], 0, "Search must not bypass the city filter")

    def test_pagination_is_stable_disjoint_and_price_sorted(self):
        first = browse_catalog(self.catalog, {"page": "1", "page_size": "4"})
        second = browse_catalog(self.catalog, {"page": "2", "page_size": "4"})
        combined = browse_catalog(self.catalog, {"page": "1", "page_size": "8"})
        ids_first = [item["id"] for item in first["items"]]
        ids_second = [item["id"] for item in second["items"]]
        self.assertEqual(first["total"], len(self.catalog))
        self.assertEqual(first["page"], 1)
        self.assertEqual(second["page"], 2)
        self.assertEqual(first["page_size"], 4)
        self.assertEqual(first["total_pages"], (len(self.catalog) + 3) // 4)
        self.assertEqual(len(ids_first), 4)
        self.assertEqual(len(ids_second), 4)
        self.assertFalse(set(ids_first) & set(ids_second))
        self.assertEqual(ids_first + ids_second, [item["id"] for item in combined["items"]])
        prices = [item["price_from_kzt"] for item in combined["items"]]
        self.assertEqual(prices, sorted(prices))
        repeated = browse_catalog(self.catalog, {"page": "2", "page_size": "4"})
        self.assertEqual(second, repeated)
        beyond = browse_catalog(self.catalog, {"page": "999", "page_size": "4"})
        self.assertEqual(beyond["page"], 999)
        self.assertEqual(beyond["items"], [])
        self.assertEqual(beyond["total"], len(self.catalog))

    def test_invalid_pagination_and_filter_values_are_rejected(self):
        invalid_queries = [
            {"page": "0"}, {"page": "-1"}, {"page": "1.5"}, {"page": True},
            {"page_size": "0"}, {"page_size": "25"}, {"page_size": "NaN"},
            {"city": "Not a catalog city"}, {"category": "Not a catalog category"},
            {"sort": "not-a-sort"}, {"ui_language": "invalid"},
        ]
        for params in invalid_queries:
            with self.subTest(params=params), self.assertRaises(ValueError):
                browse_catalog(self.catalog, params)

    def test_profile_detail_retains_exact_source_and_provenance(self):
        for profile_id in ("HK-39372", "HK-90001", "HK-77838"):
            source = self.by_id[profile_id]
            detail = contractor_detail(self.catalog, profile_id)
            with self.subTest(id=profile_id):
                self.assertEqual(detail["id"], source["id"])
                self.assertEqual(detail["name"], source["anon_name"])
                for field in ("description", "busy_dates", "event_formats", "languages",
                              "max_hours", "categories", "city", "price_from_kzt",
                              "synthetic", "city_imputed", "price_imputed"):
                    self.assertEqual(detail[field], source[field])
                self.assertEqual(detail["calendar"], CALENDAR)
                self.assertTrue(detail["summary"].strip())
                self.assertTrue(detail["data_notes"], "Source flags or known conflict must remain visible")
        self.assertIsNone(contractor_detail(self.catalog, "HK-90001")["max_hours"])

    def test_unknown_profile_is_rejected_in_detail_and_comparison(self):
        with self.assertRaises(KeyError):
            contractor_detail(self.catalog, "NOT-A-CATALOG-ID")
        with self.assertRaises((KeyError, ValueError)):
            compare_contractors(self.catalog, ["HK-88430", "NOT-A-CATALOG-ID"])

    def test_comparison_preserves_selected_order_and_has_no_undated_availability_claim(self):
        ids = ["HK-90001", "HK-88430", "HK-39372"]
        result = compare_contractors(self.catalog, ids)
        self.assertEqual([item["id"] for item in result["items"]], ids)
        self.assertIsNone(result["date"])
        self.assertEqual(result["calendar"], CALENDAR)
        self.assertTrue(all(item["available_on_date"] is None for item in result["items"]))
        comma_result = compare_contractors(self.catalog, ",".join(ids))
        self.assertEqual([item["id"] for item in comma_result["items"]], ids)
        self.assertEqual(compare_contractors(self.catalog, [])["items"], [])

    def test_comparison_limit_and_duplicate_rejection(self):
        invalid_lists = [
            ["HK-88430", "HK-44733", "HK-35215", "HK-77838"],
            ["HK-88430", "HK-88430"],
            ["HK-88430", 123],
        ]
        for ids in invalid_lists:
            with self.subTest(ids=ids), self.assertRaises(ValueError):
                compare_contractors(self.catalog, ids)

    def test_comparison_availability_changes_on_exact_known_dates(self):
        ids = ["HK-44733", "HK-27222", "HK-88430"]
        first = compare_contractors(self.catalog, ids, date_value="2026-10-09")
        second = compare_contractors(self.catalog, ids, date_value="2026-10-10")
        self.assertEqual(first["date"], "2026-10-09")
        self.assertEqual(second["date"], "2026-10-10")
        self.assertEqual([item["available_on_date"] for item in first["items"]], [True, False, True])
        self.assertEqual([item["available_on_date"] for item in second["items"]], [False, True, True])

    def test_venue_availability_uses_same_calendar_as_people(self):
        venue = next(row for row in self.catalog if "Банкетный зал" in row["categories"])
        busy_day = venue["busy_dates"][0]
        start = date.fromisoformat(CALENDAR["min"])
        free_day = next(str(start + timedelta(days=offset)) for offset in range(100)
                        if str(start + timedelta(days=offset)) not in venue["busy_dates"])
        busy = compare_contractors(self.catalog, [venue["id"]], date_value=busy_day)
        free = compare_contractors(self.catalog, [venue["id"]], date_value=free_day)
        self.assertIs(busy["items"][0]["available_on_date"], False)
        self.assertIs(free["items"][0]["available_on_date"], True)

    def test_comparison_rejects_invalid_or_outside_calendar_dates(self):
        for invalid in ("2026-09-22", "2027-01-01", "2026-02-30", "09.10.2026"):
            with self.subTest(date=invalid), self.assertRaises(ValueError):
                compare_contractors(self.catalog, ["HK-88430"], date_value=invalid)


if __name__ == "__main__":
    unittest.main()
