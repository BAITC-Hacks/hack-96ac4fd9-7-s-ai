import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

from ai_transport import AIProviderError, OpenAITransport


class TransportTests(unittest.TestCase):
    def test_credentials_stay_in_authorization_header(self):
        seen = {}

        def open_request(request, timeout):
            seen.update(request=request, timeout=timeout)
            return io.BytesIO(b'{"id":"resp_test","output":[]}')

        with patch("ai_transport.urlopen", side_effect=open_request):
            result = OpenAITransport("test-secret", "test-model")({"input": "hello"}, 2.5)
        self.assertEqual(result["id"], "resp_test")
        request = seen["request"]
        body = json.loads(request.data)
        self.assertEqual(request.full_url, "https://api.openai.com/v1/responses")
        self.assertEqual(request.get_header("Authorization"), "Bearer test-secret")
        self.assertNotIn("test-secret", request.data.decode())
        self.assertFalse(body["store"])
        self.assertEqual(body["model"], "test-model")
        self.assertEqual(seen["timeout"], 2.5)

    def test_provider_error_is_redacted(self):
        error = HTTPError("https://api.openai.com/v1/responses", 401,
                          "sensitive provider text", {}, io.BytesIO(b"test-secret"))
        with patch("ai_transport.urlopen", side_effect=error):
            with self.assertRaises(AIProviderError) as caught:
                OpenAITransport("test-secret")({}, 2)
        self.assertEqual(str(caught.exception), "authentication")

    def test_missing_key_never_calls_provider(self):
        with patch("ai_transport.urlopen") as request:
            with self.assertRaisesRegex(AIProviderError, "not_configured"):
                OpenAITransport()({}, 2)
        request.assert_not_called()

    def test_quota_errors_are_distinct_and_redacted(self):
        for code in ("insufficient_quota", "credit_balance_exhausted"):
            with self.subTest(code=code):
                body = json.dumps({"error": {"code": code,
                    "message": "sensitive provider text: fake-body-secret"}}).encode()
                error = HTTPError("https://api.openai.com/v1/responses", 429,
                                  "fake-status-secret", {}, io.BytesIO(body))
                with patch("ai_transport.urlopen", side_effect=error):
                    with self.assertRaises(AIProviderError) as caught:
                        OpenAITransport("fake-key-secret")({}, 2)
                self.assertEqual(str(caught.exception), "quota_exceeded")
                for secret in ("fake-body-secret", "fake-status-secret", "fake-key-secret"):
                    self.assertNotIn(secret, str(caught.exception))
                    self.assertNotIn(secret, repr(caught.exception))

    def test_temporary_rate_limit_is_distinct_and_redacted(self):
        body = json.dumps({"error": {"code": "rate_limit_exceeded",
            "message": "sensitive provider text: fake-body-secret"}}).encode()
        error = HTTPError("https://api.openai.com/v1/responses", 429,
                          "fake-status-secret", {}, io.BytesIO(body))
        with patch("ai_transport.urlopen", side_effect=error):
            with self.assertRaises(AIProviderError) as caught:
                OpenAITransport("fake-key-secret")({}, 2)
        self.assertEqual(str(caught.exception), "rate_limit")
        for secret in ("fake-body-secret", "fake-status-secret", "fake-key-secret"):
            self.assertNotIn(secret, str(caught.exception))
            self.assertNotIn(secret, repr(caught.exception))

    def test_dotenv_is_literal_and_environment_has_priority(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, ".env").write_text(
                'OPENAI_API_KEY="file-test-secret"\nOPENAI_MODEL=test-model\nUNRELATED=value\n',
                encoding="utf-8")
            with patch.dict("os.environ", {}, clear=True):
                client = OpenAITransport.from_environment(directory)
                self.assertTrue(client.configured)
                self.assertEqual(client.model, "test-model")
            with patch.dict("os.environ", {"OPENAI_API_KEY": "env-test-secret", "OPENAI_MODEL": "env-model"}, clear=True):
                client = OpenAITransport.from_environment(directory)
                self.assertEqual(client._api_key, "env-test-secret")
                self.assertEqual(client.model, "env-model")


if __name__ == "__main__":
    unittest.main()
