"""Offline NVIDIA adapter and provider-selection gates; no real credentials."""

import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from ai_agent import run_agent
from ai_transport import AIProviderError, create_transport
from matcher import load_catalog, recommend
from nvidia_transport import NVIDIATransport
from test_ai_agent import ROOT, agent_payload, base_query


def chat_response(message, response_id="chatcmpl-test-1"):
    return io.BytesIO(json.dumps({
        "id": response_id, "object": "chat.completion",
        "choices": [{"index": 0, "message": message,
                     "finish_reason": "tool_calls" if message.get("tool_calls") else "stop"}],
    }, ensure_ascii=False).encode("utf-8"))


class NVIDIATransportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog(ROOT / "data" / "catalog.csv")

    def test_function_tool_request_and_response_are_normalized(self):
        arguments = json.dumps(base_query(), ensure_ascii=False)
        message = {"role": "assistant", "content": None, "tool_calls": [{
            "id": "call_nvidia", "type": "function",
            "function": {"name": "search_contractors", "arguments": arguments},
        }]}
        payload = {
            "instructions": "Use the catalog tool.",
            "input": [{"role": "user", "content": "Find a host."}],
            "tools": [{"type": "function", "name": "search_contractors", "strict": True,
                       "description": "Search", "parameters": {"type": "object", "properties": {}}}],
            "tool_choice": {"type": "function", "name": "search_contractors"},
        }
        with patch("nvidia_transport.urlopen", return_value=chat_response(message)) as request:
            result = NVIDIATransport("fake-nvidia-key")(payload, 2.5)
        request.assert_called_once()
        sent = request.call_args.args[0]
        body = json.loads(sent.data)
        self.assertEqual(sent.full_url, "https://integrate.api.nvidia.com/v1/chat/completions")
        self.assertEqual(sent.get_header("Authorization"), "Bearer fake-nvidia-key")
        self.assertNotIn("fake-nvidia-key", sent.data.decode())
        self.assertEqual(request.call_args.kwargs["timeout"], 2.5)
        self.assertEqual(body["model"], "nvidia/nemotron-3-ultra-550b-a55b")
        self.assertEqual(body["tools"][0]["function"]["name"], "search_contractors")
        self.assertEqual(body["tools"][0]["function"]["parameters"], payload["tools"][0]["parameters"])
        if body["tool_choice"] == "required":
            self.assertEqual([tool["function"]["name"] for tool in body["tools"]], ["search_contractors"])
        else:
            self.assertEqual(body["tool_choice"], {"type": "function", "function": {"name": "search_contractors"}})
        self.assertEqual(result["id"], "chatcmpl-test-1")
        call = result["output"][0]
        self.assertEqual((call["type"], call["name"], call["call_id"]),
                         ("function_call", "search_contractors", "call_nvidia"))
        self.assertEqual(json.loads(call["arguments"]), base_query())

    def test_real_candidate_tool_loop_preserves_order_filters_and_grounding(self):
        parsed = base_query(date="2026-10-10", preferences="импровизация")
        baseline = recommend(self.catalog, parsed)
        seen = []
        chosen = {}

        def respond(request, timeout):
            body = json.loads(request.data)
            seen.append(body)
            if len(seen) == 1:
                return chat_response({"role": "assistant", "content": "I will search the catalog.", "tool_calls": [{
                    "id": "call_catalog", "type": "function", "function": {
                        "name": "search_contractors", "arguments": json.dumps(parsed, ensure_ascii=False),
                    },
                }]}, "chatcmpl-live-shaped-first")
            tools = [message for message in body["messages"] if message["role"] == "tool"]
            self.assertEqual(len(tools), 1)
            self.assertEqual(tools[0]["tool_call_id"], "call_catalog")
            tool_index = body["messages"].index(tools[0])
            self.assertGreater(tool_index, 0)
            preceding = body["messages"][tool_index - 1]
            self.assertEqual(preceding["role"], "assistant")
            self.assertEqual(preceding["content"], "I will search the catalog.")
            self.assertEqual(preceding["tool_calls"][0]["id"], "call_catalog")
            earlier = [message for message in body["messages"] if message.get("tool_calls")]
            self.assertEqual(earlier[-1]["tool_calls"][0]["id"], "call_catalog")
            tool_result = json.loads(tools[0]["content"])
            self.assertEqual(tool_result["query"], baseline["query"])
            self.assertEqual([item["id"] for item in tool_result["candidates"]],
                             [card["id"] for card in baseline["cards"]])
            selections = []
            for item in reversed(tool_result["candidates"]):
                option = next(value for value in item["evidence_options"] if value["index"] == 1)
                chosen[item["id"]] = option["text"]
                selections.append({"id": item["id"], "evidence_index": 1})
            return chat_response({"role": "assistant", "content": json.dumps({"selections": selections})},
                                 "chatcmpl-live-shaped-second")

        with patch("nvidia_transport.urlopen", side_effect=respond) as request:
            result = run_agent(self.catalog, agent_payload(), NVIDIATransport("fake-key"))
        self.assertEqual(request.call_count, 2)
        self.assertEqual(result["agent"]["mode"], "ai")
        self.assertEqual(result["agent"]["input_source"], "interpreted")
        self.assertEqual(result["agent"]["tool_calls"], 1)
        self.assertEqual(result["agent"]["request_ids"],
                         ["chatcmpl-live-shaped-first", "chatcmpl-live-shaped-second"])
        self.assertEqual(result["query"], baseline["query"])
        self.assertEqual(result["summary"], baseline["summary"])
        self.assertLessEqual(len(result["cards"]), 3)
        self.assertEqual([card["id"] for card in result["cards"]], [card["id"] for card in baseline["cards"]])
        sources = {row["id"]: row for row in self.catalog}
        for card, original in zip(result["cards"], baseline["cards"]):
            for field in ("id", "city", "category", "price_from_kzt", "languages", "max_hours"):
                self.assertEqual(card[field], original[field])
            self.assertNotIn(parsed["date"], sources[card["id"]]["busy_dates"])
            self.assertEqual(card["evidence"][0]["text"], sources[card["id"]]["description"])
            self.assertIn(chosen[card["id"]], sources[card["id"]]["description"])
            self.assertIn(chosen[card["id"]], card["explanation"])

    def test_function_call_looking_prose_is_not_executed(self):
        message = {"role": "assistant", "content": json.dumps({
            "name": "search_contractors", "arguments": base_query(date="2026-10-10"),
        })}
        with patch("nvidia_transport.urlopen", return_value=chat_response(message)) as request:
            result = run_agent(self.catalog, agent_payload(), NVIDIATransport("fake-key"))
        request.assert_called_once()
        self.assertEqual(result["agent"]["mode"], "fallback")
        self.assertEqual(result["agent"]["tool_calls"], 0)
        self.assertEqual(result["query"], recommend(self.catalog, base_query())["query"])

    def test_http_failures_are_redacted_without_retry(self):
        for status, expected in ((429, "rate_limit"), (401, "authentication"),
                                 (403, "authentication"), (500, "provider_error")):
            with self.subTest(status=status):
                error = HTTPError("https://integrate.api.nvidia.com/v1/chat/completions", status,
                                  "fake-secret-status", {}, io.BytesIO(b"fake-secret-body"))
                with patch("nvidia_transport.urlopen", side_effect=error) as request:
                    with self.assertRaises(AIProviderError) as caught:
                        NVIDIATransport("fake-secret-key")({"input": []}, 2)
                request.assert_called_once()
                self.assertEqual(str(caught.exception), expected)
                self.assertNotIn("fake-secret", repr(caught.exception))

    def test_timeouts_are_redacted_without_retry(self):
        for error in (TimeoutError("fake-secret"), URLError(TimeoutError("fake-secret"))):
            with self.subTest(kind=type(error).__name__):
                with patch("nvidia_transport.urlopen", side_effect=error) as request:
                    with self.assertRaises(AIProviderError) as caught:
                        NVIDIATransport("fake-key")({"input": []}, 2)
                request.assert_called_once()
                self.assertEqual(str(caught.exception), "timeout")

    def test_missing_key_or_expired_deadline_never_calls_provider(self):
        for transport, timeout, expected in ((NVIDIATransport(), 2, "not_configured"),
                                             (NVIDIATransport("fake-key"), 0, "timeout")):
            with self.subTest(expected=expected):
                with patch("nvidia_transport.urlopen") as request:
                    with self.assertRaisesRegex(AIProviderError, expected):
                        transport({"input": []}, timeout)
                request.assert_not_called()

    def test_factory_prefers_nvidia_and_literal_environment_over_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "backend").mkdir()
            (root / "backend" / ".env").write_text(
                'NVIDIA_API_KEY=backend-fake-key\nNVIDIA_MODEL=backend-model\n', encoding="utf-8")
            (root / ".env").write_text(
                'NVIDIA_API_KEY="root-fake-key"\nNVIDIA_MODEL=root-model\nOPENAI_API_KEY=fake-openai\n',
                encoding="utf-8")
            with patch.dict("os.environ", {}, clear=True):
                transport = create_transport(root)
                self.assertEqual(transport.provider, "nvidia")
                self.assertTrue(transport.configured)
                self.assertEqual(transport.model, "root-model")
            with patch.dict("os.environ", {"NVIDIA_API_KEY": "env-fake-key", "NVIDIA_MODEL": "env-model",
                                            "OPENAI_API_KEY": "env-fake-openai"}, clear=True):
                transport = create_transport(root)
                self.assertEqual(transport.provider, "nvidia")
                self.assertEqual(transport.model, "env-model")

    def test_factory_selects_openai_or_unconfigured_without_nvidia(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.dict("os.environ", {"OPENAI_API_KEY": "fake-openai"}, clear=True):
                transport = create_transport(directory)
                self.assertEqual(transport.provider, "openai")
                self.assertTrue(transport.configured)
            with patch.dict("os.environ", {}, clear=True):
                transport = create_transport(directory)
                self.assertFalse(transport.configured)


if __name__ == "__main__":
    unittest.main()
