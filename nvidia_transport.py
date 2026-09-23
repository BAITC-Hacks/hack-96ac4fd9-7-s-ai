"""NVIDIA Chat Completions adapter for the agent's small Responses contract."""
from __future__ import annotations

import json
import math
import socket
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from ai_transport import AIProviderError

NVIDIA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"


def _text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list) and all(
        isinstance(part, dict) and part.get("type") in ("input_text", "output_text", "text")
        and isinstance(part.get("text"), str) for part in content
    ):
        return "\n".join(part["text"] for part in content)
    raise AIProviderError("invalid_response")


def _chat_payload(payload, model):
    messages = []
    for item in payload["input"]:
        kind = item.get("type")
        if kind == "function_call":
            call = {"id": item["call_id"], "type": "function", "function": {
                "name": item["name"], "arguments": item["arguments"]}}
            if messages and messages[-1].get("tool_calls"):
                messages[-1]["tool_calls"].append(call)
            else:
                messages.append({"role": "assistant", "content": None, "tool_calls": [call]})
        elif kind == "function_call_output":
            messages.append({"role": "tool", "tool_call_id": item["call_id"],
                             "content": _text(item["output"])})
        elif item.get("role") in ("system", "developer", "user", "assistant"):
            role = "system" if item["role"] == "developer" else item["role"]
            content = _text(item["content"])
            if role == "assistant" and messages and messages[-1].get("tool_calls"):
                # Responses separates text and calls from one model turn; Chat
                # requires their tool results immediately after that same turn.
                previous = messages[-1].get("content")
                messages[-1]["content"] = previous + "\n" + content if previous else content
            else:
                messages.append({"role": role, "content": content})
        else:
            raise AIProviderError("invalid_response")
    body = {"model": model, "messages": messages, "stream": False,
            "max_tokens": payload.get("max_output_tokens", 650), "temperature": 0,
            "chat_template_kwargs": {"enable_thinking": False}}
    tools = payload.get("tools", [])
    if tools:
        if any(tool.get("type") != "function" for tool in tools):
            raise AIProviderError("invalid_response")
        body["tools"] = [{"type": "function", "function": {
            key: tool[key] for key in ("name", "description", "parameters") if key in tool
        }} for tool in tools]
    choice = payload.get("tool_choice")
    if isinstance(choice, dict):
        if choice.get("type") != "function":
            raise AIProviderError("invalid_response")
        # The sole allowed tool plus required mirrors NVIDIA's documented example.
        body["tools"] = [tool for tool in body.get("tools", [])
                         if tool["function"]["name"] == choice["name"]]
        if len(body["tools"]) != 1:
            raise AIProviderError("invalid_response")
        body["tool_choice"] = "required"
    elif choice is not None:
        body["tool_choice"] = choice
    if "parallel_tool_calls" in payload:
        body["parallel_tool_calls"] = payload["parallel_tool_calls"]
    output_format = payload.get("text", {}).get("format", {})
    if output_format.get("type") == "json_schema":
        # JSON mode is supported across NIM backends; the agent validates the schema
        # and every selected evidence index itself before composing an explanation.
        body["response_format"] = {"type": "json_object"}
        messages.insert(0, {"role": "system", "content":
            "Return only a JSON object matching this exact JSON Schema: "
            + json.dumps(output_format["schema"], ensure_ascii=False, allow_nan=False)})
    return body


def _responses_result(result):
    if not isinstance(result, dict) or result.get("error"):
        raise AIProviderError("invalid_response")
    choices = result.get("choices")
    if not isinstance(choices, list) or len(choices) != 1:
        raise AIProviderError("invalid_response")
    choice = choices[0]
    if not isinstance(choice, dict) or choice.get("finish_reason") not in ("stop", "tool_calls"):
        raise AIProviderError("invalid_response")
    message = choice.get("message")
    if not isinstance(message, dict) or message.get("refusal"):
        raise AIProviderError("invalid_response")
    if message.get("role", "assistant") != "assistant":
        raise AIProviderError("invalid_response")
    calls, output = message.get("tool_calls"), []
    if calls is None:
        calls = []
    if not isinstance(calls, list):
        raise AIProviderError("invalid_response")
    for call in calls:
        if not isinstance(call, dict) or call.get("type") != "function":
            raise AIProviderError("invalid_response")
        function = call.get("function")
        if not isinstance(function, dict) or not all(isinstance(value, str) and value.strip()
                for value in (call.get("id"), function.get("name"), function.get("arguments"))):
            raise AIProviderError("invalid_response")
        output.append({"type": "function_call", "name": function["name"],
                       "call_id": call["id"], "arguments": function["arguments"]})
    content = message.get("content")
    if content is not None:
        content = _text(content)
        if content.strip():
            output.append({"type": "message", "role": "assistant",
                           "content": [{"type": "output_text", "text": content}]})
    if not output or (choice["finish_reason"] == "tool_calls" and not calls):
        raise AIProviderError("invalid_response")
    return {"id": result.get("id", ""), "output": output}


class NVIDIATransport:
    provider = "nvidia"

    def __init__(self, api_key="", model=NVIDIA_MODEL, base_url=NVIDIA_BASE_URL):
        self._api_key = api_key.strip()
        self.model = model or NVIDIA_MODEL
        self.configured = bool(self._api_key)
        self._base_url = base_url or NVIDIA_BASE_URL

    def __call__(self, payload, timeout_seconds):
        if not self.configured:
            raise AIProviderError("not_configured")
        if (isinstance(timeout_seconds, bool) or not isinstance(timeout_seconds, (int, float))
                or not math.isfinite(timeout_seconds) or timeout_seconds <= 0):
            raise AIProviderError("timeout")
        try:
            request = Request(self._base_url.rstrip("/") + "/chat/completions",
                data=json.dumps(_chat_payload(payload, self.model), ensure_ascii=False,
                                allow_nan=False).encode("utf-8"),
                headers={"Authorization": "Bearer " + self._api_key,
                         "Content-Type": "application/json", "User-Agent": "Firebird-Hackathon/1.0"},
                method="POST")
            with urlopen(request, timeout=timeout_seconds) as response:
                raw = response.read(1_048_577)
                if len(raw) > 1_048_576:
                    raise AIProviderError("invalid_response")
                return _responses_result(json.loads(raw.decode("utf-8")))
        except HTTPError as error:
            code = "authentication" if error.code in (401, 403) else "rate_limit" if error.code == 429 else "provider_error"
            raise AIProviderError(code) from None
        except (TimeoutError, socket.timeout):
            raise AIProviderError("timeout") from None
        except URLError as error:
            code = "timeout" if isinstance(error.reason, (TimeoutError, socket.timeout)) else "connection"
            raise AIProviderError(code) from None
        except (ValueError, UnicodeError, TypeError, KeyError, AttributeError):
            raise AIProviderError("invalid_response") from None
        except OSError:
            raise AIProviderError("connection") from None
