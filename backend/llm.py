"""LLM provider abstraction with tool calling and structured JSON output.

Supports OpenAI and Anthropic. The active provider is chosen from the
environment (OPENAI_API_KEY / ANTHROPIC_API_KEY) and can be overridden with
VIRELLE_MODEL.
"""
import json
import re
from typing import Any

import config

MODELS = {
    "openai": config.OPENAI_MODEL,
    "anthropic": config.ANTHROPIC_MODEL,
}


class ToolCall:
    def __init__(self, call_id: str, name: str, arguments: dict):
        self.id = call_id
        self.name = name
        self.arguments = arguments

    def __repr__(self):
        return f"ToolCall({self.name}, {json.dumps(self.arguments)})"


class LLMResponse:
    def __init__(self, text: str = "", tool_calls: list[ToolCall] | None = None):
        self.text = text
        self.tool_calls = tool_calls or []


def _provider() -> tuple[str, str]:
    if config.VIRELLE_MODEL:
        for p, m in MODELS.items():
            pass
        return ("openai", config.VIRELLE_MODEL)
    if config.OPENAI_API_KEY:
        return ("openai", MODELS["openai"])
    if config.ANTHROPIC_API_KEY:
        return ("anthropic", MODELS["anthropic"])
    raise RuntimeError(
        "No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY "
        "in backend/.env (or as environment variables)."
    )


def provider_name() -> str:
    return _provider()[0]


def model_name() -> str:
    return _provider()[1]


# --------------------------------------------------------------------------
# Tool schema conversion
# --------------------------------------------------------------------------

def _to_openai_tools(tools: list[dict]) -> list[dict]:
    return [
        {"type": "function", "function": {
            "name": t["name"],
            "description": t.get("description", ""),
            "parameters": t.get("parameters", {"type": "object", "properties": {}}),
        }}
        for t in tools
    ]


def _normalize_openai_message(m: dict) -> dict:
    """Convert internal {role, content, tool_calls:[{id,name,arguments}]} messages
    into the OpenAI Chat Completions wire format (type + function envelope)."""
    role = m.get("role")
    if role == "assistant" and m.get("tool_calls"):
        calls = []
        for tc in m["tool_calls"]:
            args = tc.get("arguments")
            if not isinstance(args, str):
                args = json.dumps(args, ensure_ascii=False, default=str)
            calls.append({
                "id": tc["id"],
                "type": "function",
                "function": {"name": tc["name"], "arguments": args},
            })
        out = {"role": "assistant", "content": m.get("content") or None}
        if calls:
            out["tool_calls"] = calls
        return out
    if role == "tool":
        return {"role": "tool", "tool_call_id": m["tool_call_id"], "content": m.get("content", "")}
    return m


def _to_anthropic_tools(tools: list[dict]) -> list[dict]:
    return [
        {
            "name": t["name"],
            "description": t.get("description", ""),
            "input_schema": t.get("parameters", {"type": "object", "properties": {}}),
        }
        for t in tools
    ]


# --------------------------------------------------------------------------
# JSON extraction helpers
# --------------------------------------------------------------------------

def extract_json(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in model output")
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return json.loads(text[start : i + 1])
    raise ValueError("Unbalanced JSON in model output")


# --------------------------------------------------------------------------
# Chat
# --------------------------------------------------------------------------

def chat(
    system: str,
    messages: list[dict],
    tools: list[dict] | None = None,
    json_mode: bool = False,
    temperature: float = 0.4,
) -> LLMResponse:
    provider, model = _provider()
    if provider == "openai":
        return _chat_openai(system, messages, tools, json_mode, temperature, model)
    return _chat_anthropic(system, messages, tools, json_mode, temperature, model)


def _chat_openai(system, messages, tools, json_mode, temperature, model) -> LLMResponse:
    from openai import OpenAI

    client = OpenAI(api_key=config.OPENAI_API_KEY)
    wire_messages = [_normalize_openai_message(m) for m in messages]
    kwargs: dict = {
        "model": model,
        "temperature": temperature,
        "messages": [{"role": "system", "content": system}] + wire_messages,
    }
    if tools:
        kwargs["tools"] = _to_openai_tools(tools)
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    resp = client.chat.completions.create(**kwargs)
    choice = resp.choices[0].message
    tool_calls = []
    if getattr(choice, "tool_calls", None):
        for tc in choice.tool_calls:
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            tool_calls.append(ToolCall(tc.id, tc.function.name, args))
    return LLMResponse(text=choice.content or "", tool_calls=tool_calls)


def _chat_anthropic(system, messages, tools, json_mode, temperature, model) -> LLMResponse:
    from anthropic import Anthropic

    client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
    converted = []
    for m in messages:
        role = m["role"]
        content = m.get("content", "")
        if role == "tool":
            converted.append({
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": m.get("tool_call_id", ""),
                        "content": content,
                    }
                ],
            })
        elif role == "assistant" and m.get("tool_calls"):
            blocks = []
            if m.get("content"):
                blocks.append({"type": "text", "text": m["content"]})
            for tc in m["tool_calls"]:
                blocks.append({
                    "type": "tool_use",
                    "id": tc["id"],
                    "name": tc["name"],
                    "input": tc["arguments"],
                })
            converted.append({"role": "assistant", "content": blocks})
        else:
            converted.append({"role": role, "content": content})

    kwargs: dict = {
        "model": model,
        "max_tokens": 4096,
        "temperature": temperature,
        "system": system,
        "messages": converted,
    }
    if tools:
        kwargs["tools"] = _to_anthropic_tools(tools)

    resp = client.messages.create(**kwargs)
    text_parts = []
    tool_calls = []
    for block in resp.content:
        if block.type == "text":
            text_parts.append(block.text)
        elif block.type == "tool_use":
            tool_calls.append(ToolCall(block.id, block.name, dict(block.input)))
    return LLMResponse(text="".join(text_parts), tool_calls=tool_calls)
