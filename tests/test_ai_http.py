"""Agent HTTP integration through an injected offline Responses transport."""

import json
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from server import create_server
from test_ai_agent import ScriptedTransport, agent_payload


class AgentHTTPTests(unittest.TestCase):
    def setUp(self):
        self.transport = ScriptedTransport()
        self.server = create_server(host="127.0.0.1", port=0, agent_transport=self.transport)
        self.base = f"http://127.0.0.1:{self.server.server_address[1]}"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)

    def post(self, body):
        request = Request(self.base + "/api/agent", data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
                          headers={"Content-Type": "application/json"}, method="POST")
        return urlopen(request, timeout=10)

    def test_status_and_live_endpoint_use_injected_transport(self):
        with urlopen(self.base + "/api/agent/status", timeout=3) as response:
            self.assertEqual(response.status, 200)
            status = json.load(response)
        self.assertIs(status["configured"], True)
        self.assertEqual(status["model"], self.transport.model)
        self.assertEqual(self.transport.calls, [], "Status must not make an external model request")
        with self.post(agent_payload()) as response:
            self.assertEqual(response.status, 200)
            result = json.load(response)
        self.assertEqual(result["agent"]["mode"], "ai")
        self.assertEqual(result["summary"]["eligible_count"], 4)
        self.assertEqual(len(result["cards"]), 3)
        self.assertEqual(len(self.transport.calls), 2)

    def test_invalid_message_returns_400_without_calling_provider(self):
        with self.assertRaises(HTTPError) as caught:
            self.post(agent_payload(message=""))
        self.assertEqual(caught.exception.code, 400)
        self.assertTrue(json.loads(caught.exception.read())["error"])
        self.assertEqual(self.transport.calls, [])

    def test_provider_failure_returns_200_with_explicit_fallback(self):
        self.transport.fail_at = 1
        with self.post(agent_payload()) as response:
            self.assertEqual(response.status, 200)
            result = json.load(response)
        self.assertEqual(result["agent"]["mode"], "fallback")
        self.assertTrue(result["agent"]["fallback_reason"])
        self.assertEqual(result["summary"]["eligible_count"], 4)
        self.assertNotIn("do-not-expose-token", json.dumps(result))


if __name__ == "__main__":
    unittest.main()
