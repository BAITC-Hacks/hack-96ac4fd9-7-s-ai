"""Event-team budget, assignment and calendar regression gates."""

import copy
import unittest
from pathlib import Path

from matcher import load_catalog
from planner import plan_event


ROOT = Path(__file__).resolve().parents[1]


def request(**changes):
    payload = {'city': 'Алматы', 'date': '2026-10-09', 'event_format': 'корпоратив',
               'categories': ['Ведущий', 'Флорист'], 'budget_kzt': 1_300_000,
               'language': '', 'duration_hours': None, 'preferences': '', 'ui_language': 'kk'}
    payload.update(changes)
    return payload


class PlannerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog(ROOT / 'data' / 'catalog.csv')
        cls.by_id = {profile['id']: profile for profile in cls.catalog}

    def profile(self, identifier, categories, price, **changes):
        profile = copy.deepcopy(self.by_id['HK-88430'])
        profile.update(id=identifier, anon_name=identifier, categories=categories,
                       price_from_kzt=price, max_hours=None, busy_dates=[],
                       event_formats=['корпоратив'], languages=['русский'],
                       description=f'{identifier} оформляет корпоративные мероприятия.',
                       synthetic=True, city_imputed=False, price_imputed=False)
        profile.update(changes)
        return profile

    def test_real_team_is_complete_with_distinct_members_and_total_budget(self):
        result = plan_event(self.catalog, request())
        self.assertEqual(result['outcome'], 'bundles')
        self.assertGreater(result['summary']['feasible_bundle_count'], 0)
        self.assertEqual(result['summary']['minimum_feasible_total_kzt'], 700_000)
        member_sets = []
        for bundle in result['bundles']:
            self.assertEqual([item['category'] for item in bundle['items']], ['Ведущий', 'Флорист'])
            ids = [item['id'] for item in bundle['items']]
            self.assertEqual(len(ids), len(set(ids)))
            member_sets.append(tuple(sorted(ids)))
            actual_total = sum(self.by_id[identifier]['price_from_kzt'] for identifier in ids)
            self.assertEqual(bundle['total_price_from_kzt'], actual_total)
            self.assertLessEqual(actual_total, 1_300_000)
            self.assertEqual(bundle['budget_remaining_kzt'], 1_300_000 - actual_total)
            for item in bundle['items']:
                self.assertNotIn('2026-10-09', self.by_id[item['id']]['busy_dates'])
                self.assertEqual(item['evidence'][0]['text'], self.by_id[item['id']]['description'])
        self.assertEqual(len(member_sets), len(set(member_sets)))
        self.assertLessEqual(len(member_sets), 3)
        self.assertEqual(result, plan_event(self.catalog, request()))

    def test_exact_assignment_avoids_greedy_shared_provider_error(self):
        shared = self.profile('SHARED', ['Ведущий', 'Флорист'], 100)
        host = self.profile('HOST', ['Ведущий'], 110)
        florist = self.profile('FLORIST', ['Флорист'], 500)
        result = plan_event([shared, host, florist], request(budget_kzt=210))
        self.assertEqual(result['summary']['minimum_feasible_total_kzt'], 210)
        self.assertEqual(result['summary']['feasible_bundle_count'], 1)
        self.assertEqual([item['id'] for item in result['bundles'][0]['items']], ['HOST', 'SHARED'])
        below = plan_event([shared, host, florist], request(budget_kzt=209))
        self.assertEqual(below['bundles'], [])
        self.assertEqual(below['summary']['minimum_feasible_total_kzt'], 210)
        self.assertIn('1 ₸', below['summary']['message'])

    def test_covered_roles_can_still_be_impossible_without_distinct_ids(self):
        shared = self.profile('SHARED', ['Ведущий', 'Флорист'], 100)
        result = plan_event([shared], request(budget_kzt=1_000))
        self.assertEqual(result['outcome'], 'no_complete_bundle')
        self.assertEqual(result['summary']['covered_categories'], 2)
        self.assertIsNone(result['summary']['minimum_feasible_total_kzt'])
        self.assertTrue(result['summary']['message'])
        self.assertTrue(all(not day['complete_bundle_possible'] and day['min_total_price_from_kzt'] is None
                            for day in result['date_radar']))

    def test_radar_changes_only_when_calendar_allows_complete_team(self):
        host = self.profile('HOST', ['Ведущий'], 100, busy_dates=['2026-10-09'])
        florist = self.profile('FLORIST', ['Флорист'], 200, busy_dates=['2026-10-11'])
        result = plan_event([host, florist], request(budget_kzt=300))
        self.assertEqual(result['bundles'], [])
        self.assertIsNone(result['summary']['minimum_feasible_total_kzt'])
        self.assertEqual(result['summary']['category_results'][0]['excluded_counts']['busy_date'], 1)
        next_day, blocked_day = result['date_radar'][:2]
        self.assertEqual(next_day['date'], '2026-10-10')
        self.assertEqual(next_day['min_total_price_from_kzt'], 300)
        self.assertTrue(next_day['within_budget'])
        self.assertEqual(blocked_day['date'], '2026-10-11')
        self.assertIsNone(blocked_day['min_total_price_from_kzt'])
        self.assertFalse(blocked_day['within_budget'])
        self.assertEqual(len(result['date_radar']), 14)
        end = plan_event([host, florist], request(date='2026-12-31', budget_kzt=300))
        self.assertEqual(end['date_radar'], [])

    def test_filter_failures_and_missing_city_category_are_truthful(self):
        host = self.profile('HOST', ['Ведущий'], 100, max_hours=3)
        florist = self.profile('FLORIST', ['Флорист'], 200, city='Астана')
        result = plan_event([host, florist], request(duration_hours=4, budget_kzt=1_000))
        self.assertEqual(result['summary']['covered_categories'], 0)
        self.assertEqual(result['summary']['category_results'][0]['excluded_counts']['duration'], 1)
        self.assertEqual(result['summary']['category_results'][1]['total_candidates'], 0)
        self.assertIsNone(result['summary']['minimum_feasible_total_kzt'])

    def test_same_member_set_in_different_roles_is_not_extra_bundle(self):
        first = self.profile('A', ['Ведущий', 'Флорист'], 100)
        second = self.profile('B', ['Ведущий', 'Флорист'], 200)
        result = plan_event([first, second], request(budget_kzt=300))
        self.assertEqual(result['summary']['feasible_bundle_count'], 1)
        self.assertEqual(len(result['bundles']), 1)

    def test_invalid_plan_inputs_are_rejected(self):
        invalid = [request(categories=[]), request(categories=['Ведущий'] * 2),
                   request(categories=['Ведущий', 'Флорист', 'Фотограф', 'Видеограф', 'Декоратор']),
                   request(categories='Ведущий'), request(categories=['Неизвестный']),
                   request(budget_kzt=True), request(budget_kzt='NaN'), request(budget_kzt=float('inf')),
                   request(date='2027-01-01'), request(date='2026-02-30')]
        for payload in invalid:
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                plan_event(self.catalog, payload)


if __name__ == '__main__':
    unittest.main()
