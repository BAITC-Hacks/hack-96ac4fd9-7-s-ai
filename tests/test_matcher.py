"""Meaningful matching gates. Run after integration, using only stdlib unittest."""

import copy
import unittest
from pathlib import Path

from matcher import load_catalog, recommend


ROOT = Path(__file__).resolve().parents[1]


def query(**changes):
    value = {
        "city": "Алматы", "date": "2026-10-09", "event_format": "корпоратив",
        "category": "Ведущий", "budget_kzt": 1_000_000, "language": "русский",
        "duration_hours": 4, "preferences": "", "ui_language": "kk",
    }
    value.update(changes)
    return value


class MatcherTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog(ROOT / "data" / "catalog.csv")
        cls.by_id = {row["id"]: row for row in cls.catalog}

    def make_profile(self, **changes):
        row = copy.deepcopy(self.by_id["HK-88430"])
        row.update(id="TEST-001", anon_name="Тестовый ведущий", price_from_kzt=100_000,
                   max_hours=4, busy_dates=[], synthetic=True, city_imputed=False,
                   price_imputed=False, description="Ведущий корпоративов с живой импровизацией.")
        row.update(changes)
        return row

    def test_real_dense_dates_have_expected_counts_and_change_top_three(self):
        first = recommend(self.catalog, query())
        second = recommend(self.catalog, query(date="2026-10-10"))
        expected_a = {"HK-44733", "HK-88430", "HK-35215", "HK-77838"}
        expected_b = {"HK-88430", "HK-77838", "HK-27222", "HK-29829"}
        for result, expected in ((first, expected_a), (second, expected_b)):
            self.assertEqual(result["outcome"], "matches")
            self.assertEqual(result["summary"]["total_candidates"], 10)
            self.assertEqual(result["summary"]["eligible_count"], 4)
            self.assertEqual(result["summary"]["shown_count"], 3)
            self.assertEqual(len(result["cards"]), 3)
            self.assertTrue({card["id"] for card in result["cards"]}.issubset(expected))
        self.assertNotEqual({card["id"] for card in first["cards"]},
                            {card["id"] for card in second["cards"]})

    def test_repeated_query_has_identical_order_and_no_duplicate_ids(self):
        outputs = [recommend(self.catalog, query()) for _ in range(3)]
        expected = [card["id"] for card in outputs[0]["cards"]]
        self.assertEqual(len(expected), len(set(expected)))
        for output in outputs[1:]:
            self.assertEqual([card["id"] for card in output["cards"]], expected)

    def test_busy_venues_are_excluded_like_people(self):
        venue = self.make_profile(id="TEST-VENUE", categories=["Банкетный зал"],
                                  busy_dates=["2026-10-09"],
                                  description="Банкетный зал для корпоративных мероприятий.")
        result = recommend([venue], query(category="Банкетный зал"))
        self.assertEqual(result["outcome"], "no_eligible_candidates")
        self.assertEqual(result["cards"], [])
        self.assertEqual(result["summary"]["excluded_counts"]["busy_date"], 1)
        available = recommend([venue], query(category="Банкетный зал", date="2026-10-10"))
        self.assertEqual([card["id"] for card in available["cards"]], ["TEST-VENUE"])

    def test_budget_boundary_is_inclusive_per_event(self):
        profile = self.make_profile()
        at_boundary = recommend([profile], query(budget_kzt=100_000))
        below = recommend([profile], query(budget_kzt=99_999))
        self.assertEqual(at_boundary["outcome"], "matches")
        self.assertEqual(at_boundary["cards"][0]["price_from_kzt"], 100_000)
        self.assertEqual(below["outcome"], "no_eligible_candidates")
        self.assertEqual(below["summary"]["excluded_counts"]["budget"], 1)

    def test_duration_boundary_and_null_presence_semantics(self):
        timed = self.make_profile(max_hours=4)
        self.assertEqual(recommend([timed], query(duration_hours=4))["outcome"], "matches")
        self.assertEqual(recommend([timed], query(duration_hours=4.5))["outcome"], "no_eligible_candidates")
        florist = self.make_profile(categories=["Флорист"], max_hours=None,
                                    description="Цветочное оформление корпоративных мероприятий.")
        result = recommend([florist], query(category="Флорист", duration_hours=12))
        self.assertEqual(result["outcome"], "matches")
        self.assertIsNone(result["cards"][0]["max_hours"])

    def test_invalid_calendar_dates_raise_value_error(self):
        for invalid in ("2026-09-22", "2027-01-01", "2026-02-30", "09.10.2026", ""):
            with self.subTest(date=invalid), self.assertRaises(ValueError):
                recommend(self.catalog, query(date=invalid))

    def test_rare_and_empty_fixtures_distinguish_all_outcomes(self):
        florist_query = query(category="Флорист", event_format="свадьба", budget_kzt=300_000,
                              duration_hours=None)
        rare = recommend(self.catalog, florist_query)
        self.assertEqual(rare["outcome"], "matches")
        self.assertEqual(rare["summary"]["eligible_count"], 2)
        self.assertEqual({card["id"] for card in rare["cards"]}, {"HK-39372", "HK-90001"})
        busy = recommend(self.catalog, dict(florist_query, date="2026-10-01"))
        self.assertEqual(busy["outcome"], "no_eligible_candidates")
        self.assertEqual(busy["summary"]["total_candidates"], 2)
        self.assertEqual(busy["summary"]["excluded_counts"]["busy_date"], 2)
        missing = recommend(self.catalog, query(city="Астана", category="Декоратор",
                                               budget_kzt=3_000_000, duration_hours=None))
        self.assertEqual(missing["outcome"], "no_category_in_city")
        self.assertEqual(missing["summary"]["total_candidates"], 0)
        for empty in (busy, missing):
            self.assertEqual(empty["cards"], [])
            self.assertTrue(empty["summary"]["message"].strip())

    def test_budget_relaxation_is_minimum_with_other_constraints_held(self):
        current = query(date="2026-10-16", budget_kzt=400_000)
        empty = recommend(self.catalog, current)
        self.assertEqual(empty["outcome"], "no_eligible_candidates")
        candidates = [suggestion for suggestion in empty["suggestions"] if suggestion["type"] == "budget"]
        self.assertTrue(candidates, "The valid 500000 budget relaxation should be offered")
        patch = candidates[0]["query_patch"]
        self.assertEqual(patch, {"budget_kzt": 500_000})
        for budget in (400_000, 499_999):
            self.assertEqual(recommend(self.catalog, dict(current, budget_kzt=budget))["cards"], [])
        relaxed = recommend(self.catalog, dict(current, **patch))
        self.assertEqual([card["id"] for card in relaxed["cards"]], ["HK-88430"])

    def test_cards_preserve_exact_source_evidence_and_provenance(self):
        requests = (query(), query(category="Флорист", event_format="свадьба", budget_kzt=300_000,
                                   duration_hours=None))
        for request in requests:
            result = recommend(self.catalog, request)
            self.assertLessEqual(len(result["cards"]), 3)
            for card in result["cards"]:
                source = self.by_id[card["id"]]
                with self.subTest(id=card["id"]):
                    self.assertEqual(card["name"], source["anon_name"])
                    self.assertEqual(card["city"], source["city"])
                    self.assertEqual(card["price_from_kzt"], source["price_from_kzt"])
                    self.assertEqual(card["languages"], source["languages"])
                    self.assertNotIn(request["date"], source["busy_dates"])
                    self.assertLessEqual(card["price_from_kzt"], request["budget_kzt"])
                    for flag in ("synthetic", "city_imputed", "price_imputed"):
                        self.assertEqual(card[flag], source[flag])
                    self.assertIn(source["description"], [item["text"] for item in card["evidence"]])
                    self.assertTrue(card["explanation"].strip())

    def test_positive_preference_explanation_quotes_exact_matching_source(self):
        result = recommend(self.catalog, query(preferences="импровизация", ui_language="ru"))
        cards = {card["id"]: card for card in result["cards"]}
        self.assertIn("HK-77838", cards)
        card = cards["HK-77838"]
        excerpt = card["preference_match"]["source_excerpt"]
        self.assertTrue(excerpt)
        self.assertLessEqual(len(excerpt), 200)
        self.assertIn("импровиза", excerpt.casefold())
        self.assertIn(excerpt, self.by_id["HK-77838"]["description"])
        self.assertIn(excerpt, card["explanation"])
        self.assertEqual(card["evidence"][1]["text"], excerpt)
        self.assertEqual(card["evidence"][0]["text"], self.by_id["HK-77838"]["description"])

    def test_affirmative_mne_is_not_negation_but_ne_nuzhna_is(self):
        improviser = self.make_profile(id="TEST-IMPROV", anon_name="Импровизатор",
                                      description="Ведущий корпоративных мероприятий с импровизацией.")
        scripted = self.make_profile(id="TEST-SCRIPT", anon_name="Ведущий по программе",
                                    description="Ведущий корпоративных мероприятий с точной программой.")
        catalog = [improviser, scripted]
        positive = recommend(catalog, query(preferences="мне нравится импровизация"))
        self.assertEqual(positive["cards"][0]["id"], improviser["id"])
        card = positive["cards"][0]
        proof = card["preference_match"]
        self.assertEqual(proof["query_fragment"], "импровизация")
        self.assertIn(proof["source_excerpt"], improviser["description"])
        self.assertIn(proof["source_excerpt"], card["explanation"])
        self.assertEqual(card["evidence"][1]["text"], proof["source_excerpt"])

        negative = recommend(catalog, query(preferences="не нужна импровизация"))
        self.assertEqual(negative["cards"][0]["id"], scripted["id"])
        for card in negative["cards"]:
            self.assertNotIn("preference_match", card)
            self.assertNotIn("Қалауға сәйкес дерек", [item["label"] for item in card["evidence"]])


if __name__ == "__main__":
    unittest.main()
