"""Offline gates for the real Responses tool loop and deterministic fallback."""

import copy
import json
import unittest
from pathlib import Path

from ai_agent import run_agent
from matcher import load_catalog, recommend


ROOT = Path(__file__).resolve().parents[1]


def base_query(**changes):
    query = {
        "city": "Алматы", "date": "2026-10-09", "event_format": "корпоратив",
        "category": "Ведущий", "budget_kzt": 1_000_000, "language": "русский",
        "duration_hours": 4, "preferences": "", "ui_language": "kk",
    }
    query.update(changes)
    return query


def agent_payload(query=None, message="Алматыда 9 қазанға корпоратив жүргізушісі керек, бюджет 1 миллион."):
    return {"message": message, "query": query or base_query(), "ui_language": "kk"}


class ScriptedTransport:
    """Responses-shaped fake; never connects to any external service."""

    model = "gpt-4.1-mini-2025-04-14"

    def __init__(self, parsed_query=None, *, configured=True, fail_at=None, mutate=None,
                 evidence_index=0, tool_name="search_contractors"):
        self.configured = configured
        self.parsed_query = parsed_query or base_query()
        self.fail_at = fail_at
        self.mutate = mutate
        self.evidence_index = evidence_index
        self.tool_name = tool_name
        self.calls = []

    def __call__(self, request, timeout_seconds):
        self.calls.append((copy.deepcopy(request), timeout_seconds))
        if not self.configured:
            raise AssertionError("Unconfigured transport must never be called")
        if self.fail_at == len(self.calls):
            raise TimeoutError("provider failure: do-not-expose-token")
        if len(self.calls) == 1:
            return {"id": "resp_first", "output": [{
                "type": "function_call", "name": self.tool_name, "call_id": "call_search",
                "arguments": json.dumps(self.parsed_query, ensure_ascii=False),
            }]}
        outputs = [item for item in request["input"] if item.get("type") == "function_call_output"]
        if len(outputs) != 1:
            raise AssertionError("Second API call must include one actual search result")
        result = json.loads(outputs[0]["output"])
        selections = [{"id": item["id"], "evidence_index": self.evidence_index}
                      for item in reversed(result["candidates"])]
        if self.mutate:
            selections = self.mutate(selections)
        return {"id": "resp_second", "output": [{
            "type": "message", "role": "assistant",
            "content": [{"type": "output_text", "text": json.dumps({"selections": selections})}],
        }]}


class AgentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog(ROOT / "data" / "catalog.csv")
        cls.by_id = {row["id"]: row for row in cls.catalog}

    def assert_same_selection(self, result, query):
        baseline = recommend(self.catalog, query)
        self.assertEqual(result["query"], baseline["query"])
        self.assertEqual(result["outcome"], baseline["outcome"])
        self.assertEqual(result["summary"], baseline["summary"])
        self.assertEqual([card["id"] for card in result["cards"]],
                         [card["id"] for card in baseline["cards"]])
        self.assertLessEqual(len(result["cards"]), 3)
        for card, original in zip(result["cards"], baseline["cards"]):
            for key in ("id", "name", "category", "city", "price_from_kzt", "languages",
                        "max_hours", "synthetic", "city_imputed", "price_imputed"):
                self.assertEqual(card[key], original[key])
            source = self.by_id[card["id"]]
            self.assertNotIn(result["query"]["date"], source["busy_dates"])
            self.assertLessEqual(card["price_from_kzt"], result["query"]["budget_kzt"])
            self.assertIn(result["query"]["event_format"], source["event_formats"])
            self.assertEqual(card["evidence"][0]["text"], source["description"])
        return baseline

    def test_actual_two_stage_tool_loop_preserves_hard_filters_and_order(self):
        transport = ScriptedTransport()
        result = run_agent(self.catalog, agent_payload(), transport)
        self.assert_same_selection(result, base_query())
        self.assertEqual(result["agent"]["mode"], "ai")
        self.assertEqual(result["agent"]["input_source"], "interpreted")
        self.assertEqual(result["agent"]["tool_calls"], 1)
        self.assertEqual(result["agent"]["request_ids"], ["resp_first", "resp_second"])
        self.assertEqual(len(transport.calls), 2)
        first, second = transport.calls[0][0], transport.calls[1][0]
        self.assertEqual(first["tool_choice"], {"type": "function", "name": "search_contractors"})
        tool = next(item for item in first["tools"] if item["name"] == "search_contractors")
        self.assertIs(tool["strict"], True)
        output = next(item for item in second["input"] if item.get("type") == "function_call_output")
        self.assertEqual(output["call_id"], "call_search")
        search_result = json.loads(output["output"])
        self.assertEqual([item["id"] for item in search_result["candidates"]],
                         [card["id"] for card in result["cards"]])
        self.assertTrue(all(0 < timeout <= 9 for _, timeout in transport.calls))
        self.assertEqual([step["step"] for step in result["agent"]["trace"]],
                         ["interpret", "search_contractors", "explain"])
        self.assertTrue(all(step["status"] == "ok" for step in result["agent"]["trace"]))

    def test_selected_source_evidence_is_grounded_in_original_catalog(self):
        transport = ScriptedTransport(evidence_index=1)
        result = run_agent(self.catalog, agent_payload(), transport)
        self.assertEqual(result["agent"]["mode"], "ai")
        second = transport.calls[1][0]
        output = next(item for item in second["input"] if item.get("type") == "function_call_output")
        candidates = {item["id"]: item for item in json.loads(output["output"])["candidates"]}
        for card in result["cards"]:
            option = next(option for option in candidates[card["id"]]["evidence_options"] if option["index"] == 1)
            self.assertIn(option["text"], self.by_id[card["id"]]["description"])
            self.assertIn(option["text"], card["explanation"])

    def test_malicious_or_incomplete_evidence_selection_is_rejected(self):
        parsed = base_query(date="2026-10-10")
        mutations = {
            "unknown_id": lambda rows: [dict(rows[0], id="invented-contractor"), *rows[1:]],
            "invalid_index": lambda rows: [dict(rows[0], evidence_index=9999), *rows[1:]],
            "bool_index": lambda rows: [dict(rows[0], evidence_index=True), *rows[1:]],
            "duplicate_id": lambda rows: [rows[0], rows[0], *rows[2:]],
            "missing_card": lambda rows: rows[:-1],
        }
        for name, mutate in mutations.items():
            with self.subTest(attack=name):
                result = run_agent(self.catalog, agent_payload(), ScriptedTransport(parsed, mutate=mutate))
                baseline = self.assert_same_selection(result, parsed)
                self.assertEqual(result["cards"], baseline["cards"])
                self.assertEqual(result["agent"]["mode"], "fallback")
                self.assertTrue(result["agent"]["fallback_reason"])

    def test_first_stage_failure_falls_back_to_original_valid_form(self):
        transport = ScriptedTransport(base_query(date="2026-10-10"), fail_at=1)
        result = run_agent(self.catalog, agent_payload(), transport)
        baseline = self.assert_same_selection(result, base_query())
        self.assertEqual(result["cards"], baseline["cards"])
        self.assertEqual(result["agent"]["mode"], "fallback")
        self.assertEqual(result["agent"]["input_source"], "form")
        self.assertEqual(result["agent"]["tool_calls"], 0)
        self.assertEqual(len(transport.calls), 1)
        self.assertNotIn("do-not-expose-token", json.dumps(result))

    def test_second_stage_failure_keeps_successfully_parsed_query(self):
        parsed = base_query(date="2026-10-10")
        result = run_agent(self.catalog, agent_payload(), ScriptedTransport(parsed, fail_at=2))
        baseline = self.assert_same_selection(result, parsed)
        self.assertEqual(result["cards"], baseline["cards"])
        self.assertEqual(result["agent"]["mode"], "fallback")
        self.assertEqual(result["agent"]["input_source"], "interpreted")
        self.assertEqual(result["agent"]["tool_calls"], 1)

    def test_no_key_returns_honest_fallback_without_transport_call(self):
        transport = ScriptedTransport(configured=False)
        result = run_agent(self.catalog, agent_payload(), transport)
        self.assert_same_selection(result, base_query())
        self.assertEqual(result["agent"]["mode"], "fallback")
        self.assertEqual(result["agent"]["fallback_reason"], "not_configured")
        self.assertEqual(result["agent"]["input_source"], "form")
        self.assertEqual(transport.calls, [])

    def test_unsupported_interpreted_constraints_are_rejected(self):
        for changes in ({"city": "unsupported-city"}, {"date": "2027-01-01"},
                        {"language": "unsupported-language"}, {"budget_kzt": -1}):
            with self.subTest(changes=changes):
                transport = ScriptedTransport(base_query(**changes))
                result = run_agent(self.catalog, agent_payload(), transport)
                baseline = self.assert_same_selection(result, base_query())
                self.assertEqual(result["cards"], baseline["cards"])
                self.assertEqual(result["agent"]["input_source"], "form")
                self.assertEqual(result["agent"]["fallback_reason"], "invalid_interpretation")
                self.assertEqual(len(transport.calls), 1)

    def test_no_candidates_remains_empty_after_model_response(self):
        parsed = base_query(budget_kzt=1)
        transport = ScriptedTransport(parsed)
        result = run_agent(self.catalog, agent_payload(), transport)
        self.assert_same_selection(result, parsed)
        self.assertEqual(result["outcome"], "no_eligible_candidates")
        self.assertEqual(result["cards"], [])
        self.assertLessEqual(len(transport.calls), 2)

    def test_invalid_message_is_rejected_before_any_model_request(self):
        for message in ("", "   ", None, 42, "x" * 2001):
            transport = ScriptedTransport()
            with self.subTest(message_type=type(message).__name__), self.assertRaises(ValueError):
                run_agent(self.catalog, agent_payload(message=message), transport)
            self.assertEqual(transport.calls, [])

    def test_unexpected_model_tool_is_never_executed(self):
        transport = ScriptedTransport(tool_name="delete_catalog")
        result = run_agent(self.catalog, agent_payload(), transport)
        self.assert_same_selection(result, base_query())
        self.assertEqual(result["agent"]["mode"], "fallback")
        self.assertEqual(result["agent"]["tool_calls"], 0)
        self.assertEqual(len(transport.calls), 1)


if __name__ == "__main__":
    unittest.main()
