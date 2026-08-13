"""The VIRELLE pipeline orchestrator.

Runs the five agents sequentially (Researcher -> Designer -> Maker ->
Communicator -> Manager). Each agent's structured output becomes the next
agent's input. Every live query and tool call is timestamped and recorded as
evidence. Progress is streamed to subscribers over asyncio queues.
"""
import asyncio
import datetime as dt
import json
import time
import uuid

import agents
import config
import llm
import live_data
from toolkit import Toolkit

OPERATION_GOAL = (
    "Increase weekend revenue at The Virelle Dublin by converting unsold inventory "
    "and under-utilised facilities into a premium, commercially-viable guest experience."
)


class ConnectionMonitor:
    """Tracks the live status of every external / MCP connection for the UI."""

    def __init__(self):
        self._state: dict[str, dict] = {}
        self.lock = asyncio.Lock()

    def set(self, name: str, status: str, fetched_at: str = None, detail: str = None):
        self._state[name] = {
            "name": name,
            "status": status,
            "fetched_at": fetched_at or dt.datetime.now().isoformat(timespec="seconds"),
            "detail": detail,
        }

    def get(self) -> list[dict]:
        return [self._state[k] for k in self._state]


CONNECTIONS = ConnectionMonitor()

OPS: dict[str, "Operation"] = {}

LIVE_CONNECTION_NAMES = {
    "Fáilte Ireland Events API": "events",
    "Open-Meteo Weather API": "weather",
    "Dublin Destination Signals": "destination",
}
MCP_CONNECTION_NAME = "Hospitality Operations MCP"
HOTEL_DB_CONNECTION_NAME = "Hotel Database (SQLite)"


class Operation:
    def __init__(self, mission: str):
        self.id = uuid.uuid4().hex[:12]
        self.mission = mission or OPERATION_GOAL
        self.created_at = dt.datetime.now().isoformat(timespec="seconds")
        self.finished_at = None
        self.status = "running"
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=500)
        self.agents: dict = {}
        self.log: list[dict] = []
        self.evidence: list[dict] = []
        self.product: dict | None = None
        self.campaign: dict | None = None
        self.decision: dict | None = None
        self.error: str | None = None
        for agent_id, meta in agents.AGENTS.items():
            self.agents[agent_id] = {
                "id": agent_id,
                "number": meta["number"],
                "name": meta["name"],
                "title": meta["title"],
                "status": "waiting",
                "output": None,
                "summary": None,
                "started_at": None,
                "finished_at": None,
            }

    async def emit(self, event: dict):
        await self.queue.put(event)

    async def log_line(self, message: str):
        entry = {"type": "log", "message": message,
                 "at": dt.datetime.now().isoformat(timespec="seconds")}
        self.log.append(entry)
        await self.emit(entry)

    async def set_agent_status(self, agent_id: str, status: str):
        self.agents[agent_id]["status"] = status
        if status == "working":
            self.agents[agent_id]["started_at"] = dt.datetime.now().isoformat(timespec="seconds")
        if status in ("done", "failed"):
            self.agents[agent_id]["finished_at"] = dt.datetime.now().isoformat(timespec="seconds")
        await self.emit({
            "type": "agent_status",
            "agent_id": agent_id,
            "status": status,
            "name": self.agents[agent_id]["name"],
        })

    async def add_evidence(self, item: dict):
        self.evidence.append(item)
        await self.emit({"type": "evidence", "evidence": item})

    async def publish_connection_status(self):
        state = {c["name"]: c for c in CONNECTIONS.get()}
        for name in LIVE_CONNECTION_NAMES:
            await self.emit({"type": "connection", "connection": {
                "name": name,
                "status": state.get(name, {}).get("status", "idle"),
                "fetched_at": state.get(name, {}).get("fetched_at"),
            }})
        await self.emit({"type": "connection", "connection": {
            "name": MCP_CONNECTION_NAME,
            "status": "connected" if toolkit_mcp and toolkit_mcp.connected else "connecting",
        }})
        await self.emit({"type": "connection", "connection": {
            "name": HOTEL_DB_CONNECTION_NAME, "status": "connected",
        }})


toolkit_mcp = None
toolkit = None


def init_pipeline(mcp_client) -> None:
    global toolkit_mcp, toolkit
    toolkit_mcp = mcp_client
    toolkit = Toolkit(mcp_client)


def _fmt_tool_args(args: dict) -> str:
    return ", ".join(f"{k}={v}" for k, v in args.items()) if args else ""


async def _gather_evidence(op: Operation, tool_name: str, args: dict) -> dict:
    """Run a tool, recording timestamped evidence on the operation."""
    result = await toolkit.execute(tool_name, args, op.evidence)
    ev = op.evidence[-1]
    await op.add_evidence(ev)
    await op.log_line(
        f"  ⚡ {tool_name}({_fmt_tool_args(args)}) → via {ev['channel']} ({ev['fetched_at']})"
    )
    return result


def _serialize(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2, default=str)


def _build_agent_prompt(agent_id: str, mission: str, prior: dict | None) -> str:
    agent = agents.AGENTS[agent_id]
    if prior is None:
        handoff = "This is the first operation. There is no prior agent output yet."
    else:
        handoff = f"=== HANDOFF: OUTPUT FROM THE PREVIOUS AGENT ({prior['name']}) ===\n{_serialize(prior['output'])}"
    return (
        f"# THE VIRELLE DUBLIN — OPERATION BRIEF\n\n"
        f"Mission from the user: {mission}\n\n"
        f"Organisation goal: {OPERATION_GOAL}\n\n"
        f"{handoff}\n\n"
        f"You are {agent['name']}, {agent['title']} of VIRELLE.\n"
        f"Follow your system instructions and OUTPUT CONTRACT exactly. "
        f"Respond with ONLY the JSON object."
    )


async def run_operation(op: Operation) -> None:
    try:
        await op.log_line(f"🟢 OPERATION STARTED — {op.mission}")
        await op.publish_connection_status()

        prior = None
        for agent_id in agents.AGENT_ORDER:
            agent = agents.AGENTS[agent_id]
            await op.set_agent_status(agent_id, "working")
            await op.log_line(
                f"▶ {agent['number']} {agent['name']} — {agent['title']} (ARCHETYPE: {agent['archetype']})"
            )

            try:
                await _run_single_agent(op, agent_id, agent, prior)
                prior = {"name": agent["name"], "output": op.agents[agent_id]["output"]}
                await op.set_agent_status(agent_id, "done")
            except Exception as exc:  # noqa: BLE001
                await op.set_agent_status(agent_id, "failed")
                await op.log_line(f"✖ {agent['name']} failed: {type(exc).__name__}: {exc}")
                raise

        op.status = "complete"
        op.finished_at = dt.datetime.now().isoformat(timespec="seconds")
        await op.log_line("🏁 OPERATION COMPLETE — final business decision delivered.")
        await op.emit({"type": "operation", "status": "complete"})
    except Exception as exc:  # noqa: BLE001
        op.status = "failed"
        op.error = f"{type(exc).__name__}: {exc}"
        op.finished_at = dt.datetime.now().isoformat(timespec="seconds")
        await op.log_line(f"✖ OPERATION FAILED — {op.error}")
        await op.emit({"type": "operation", "status": "failed", "error": op.error})


async def _run_single_agent(op: Operation, agent_id: str, agent: dict, prior: dict | None) -> None:
    if agent_id == "researcher":
        await _gather_researcher_data(op)
    elif agent_id == "designer":
        await _gather_designer_data(op)
    elif agent_id == "maker":
        await _gather_maker_data(op, prior)
    elif agent_id == "communicator":
        await _gather_communicator_data(op, prior)
    elif agent_id == "manager":
        await _gather_manager_data(op, prior)

    prompt = _build_agent_prompt(agent_id, op.mission, prior)
    messages = [{"role": "user", "content": prompt}]

    text, final = await _chat_with_tools(op, agent, messages)

    try:
        parsed = llm.extract_json(text)
    except Exception:
        await op.log_line(f"  ⚠ JSON parse failed — asking {agent['name']} to re-issue output.")
        retry_messages = messages + [
            {"role": "assistant", "content": text},
            {"role": "user", "content": "Your previous reply was not valid JSON. Respond with ONLY a single valid JSON object matching your OUTPUT CONTRACT exactly."},
        ]
        text2, _ = await _chat_with_tools(op, agent, retry_messages)
        parsed = llm.extract_json(text2)

    op.agents[agent_id]["output"] = parsed
    op.agents[agent_id]["summary"] = text[:2000]
    await op.log_line(f"  ✔ {agent['name']} delivered structured output.")
    await op.emit({"type": "agent_output", "agent_id": agent_id, "output": parsed})

    if agent_id == "maker":
        op.product = parsed.get("product") or parsed
        await op.emit({"type": "product", "product": op.product})
        await op.log_line("  📦 Product registered — booking flow live.")
    if agent_id == "communicator":
        op.campaign = parsed.get("campaign") or parsed
        await op.emit({"type": "campaign", "campaign": op.campaign})
    if agent_id == "manager":
        op.decision = parsed.get("decision") or parsed
        await op.emit({"type": "decision", "decision": op.decision})


async def _chat_with_tools(op: Operation, agent: dict, messages: list[dict]) -> tuple[str, dict]:
    tools = agent.get("tools", [])
    for _ in range(5):
        response = await asyncio.to_thread(
            llm.chat, agent["system_prompt"], messages, tools, False
        )
        if not response.tool_calls:
            return response.text, {}
        messages.append({
            "role": "assistant",
            "content": response.text or "",
            "tool_calls": [
                {"id": tc.id, "name": tc.name, "arguments": tc.arguments}
                for tc in response.tool_calls
            ],
        })
        for tc in response.tool_calls:
            await op.log_line(
                f"  🔧 {agent['name']} calls tool: {tc.name}({_fmt_tool_args(tc.arguments)})"
            )
            try:
                result = await toolkit.execute(tc.name, tc.arguments, op.evidence)
                await op.add_evidence(op.evidence[-1])
                content = json.dumps(result.get("result", {}), default=str, ensure_ascii=False)[:4000]
            except Exception as exc:  # noqa: BLE001
                content = f"tool error: {type(exc).__name__}: {exc}"
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "name": tc.name,
                "content": content,
            })
    return response.text, {}


# ---------------------------------------------------------------------------
# Per-agent data gathering (runtime queries, all recorded as evidence)
# ---------------------------------------------------------------------------

async def _gather_researcher_data(op: Operation) -> None:
    await op.log_line("  → Querying live external intelligence…")
    sources = [
        ("Fáilte Ireland Events API", "query_live_events", live_data.fetch_events(),
         lambda p: live_data.summarize_events(p, top=8)),
        ("Open-Meteo Weather API", "query_live_weather", live_data.fetch_weather(),
         live_data.summarize_weather),
        ("Dublin Destination Signals", "query_destination_interest",
         live_data.fetch_destination_interest(), live_data.summarize_destination),
    ]
    for conn_key, tool_name, payload, summarize in sources:
        CONNECTIONS.set(conn_key, payload["status"], payload["fetched_at"])
        op.evidence.append({
            "tool": tool_name,
            "channel": "Live API",
            "source": payload["source"],
            "fetched_at": payload["fetched_at"],
            "args": {},
            "summary": summarize(payload),
        })
        conn = next((c for c in CONNECTIONS.get() if c["name"] == conn_key), None)
        if conn:
            await op.emit({"type": "connection", "connection": conn})
        await op.log_line(
            f"  ⚡ {tool_name}() → via Live API ({payload['fetched_at']}) — {payload['status']}"
        )

    await _gather_hotel_inventory(op, days=14)
    await _gather_facilities(op)
    await _gather_history(op, weeks=12)


async def _gather_hotel_inventory(op: Operation, days: int) -> None:
    await _gather_evidence(op, "get_available_inventory", {"days": days})


async def _gather_facilities(op: Operation) -> None:
    await _gather_evidence(op, "get_facility_utilisation", {})


async def _gather_history(op: Operation, weeks: int) -> None:
    await _gather_evidence(op, "get_historical_performance", {"weeks": weeks})


async def _gather_designer_data(op: Operation) -> None:
    await _gather_evidence(op, "get_spa_capacity", {})
    await _gather_evidence(op, "get_restaurant_capacity", {})
    await _gather_evidence(op, "get_rooftop_bar_capacity", {})
    await _gather_evidence(op, "get_packages", {})
    await _gather_evidence(op, "get_available_inventory", {"days": 7})


async def _gather_maker_data(op: Operation, prior: dict | None) -> None:
    await _gather_evidence(op, "get_available_inventory", {"days": 7})
    await _gather_evidence(op, "get_facility_utilisation", {})
    if prior and prior.get("output", {}).get("solution_spec", {}).get("pricing"):
        p = prior["output"]["solution_spec"]["pricing"]
        await _gather_evidence(op, "calculate_package_economics", {
            "price": p.get("price_per_couple", 695), "cost": p.get("cost_per_unit", 265),
            "capacity": p.get("capacity", 12), "sold": int(p.get("capacity", 12) * 0.6),
        })


async def _gather_communicator_data(op: Operation, prior: dict | None) -> None:
    await _gather_evidence(op, "get_packages", {})
    await _gather_evidence(op, "get_hotel_status", {})


async def _gather_manager_data(op: Operation, prior: dict | None) -> None:
    product = op.product or {}
    price = product.get("price", 695)
    capacity = product.get("capacity", 12)
    sold = min(capacity, 12)
    cost = 265
    if prior and prior.get("output", {}).get("solution_spec", {}).get("pricing"):
        cost = prior["output"]["solution_spec"]["pricing"].get("cost_per_unit", 265)
    await _gather_evidence(op, "calculate_package_economics", {
        "price": price, "cost": cost, "capacity": capacity, "sold": sold,
    })
    await _gather_evidence(op, "get_historical_performance", {"weeks": 12})
    await _gather_evidence(op, "get_available_inventory", {"days": 14})
