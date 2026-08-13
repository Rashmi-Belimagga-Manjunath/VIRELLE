"""VIRELLE command chat - the single front door to the organisation."""
import asyncio
import datetime as dt
import json
import re
import uuid

import agents
import config
import llm
import pipeline
from pipeline import Operation, run_operation

COMMAND_PERSONA = (
    "You are VIRELLE, the intelligent command interface for a five-agent AI "
    "hospitality organisation serving The Virelle Dublin, a five-star boutique "
    "hotel. You are elegant, precise and confident. You speak to hotel "
    "leadership.\n\n"
    "Your organisation: Eleanor Hayes (Researcher, opportunity intelligence), "
    "Sofia Laurent (Designer, experience design), Julian Mercer (Maker, "
    "customer-facing product), Amelia Bennett (Communicator, launch campaign) "
    "and Alexander Sterling (Executive Director, business decision).\n\n"
    "When a user asks you to find an opportunity, create an experience, sell "
    "unsold rooms or boost revenue, tell them the organisation will investigate "
    "live data and begin the operation. Keep replies concise and luxurious."
)

TRIGGER_PATTERNS = [
    r"opportunit",
    r"weekend",
    r"unsold|empty rooms|available rooms|vacancy|rooms left",
    r"experienc",
    r"find|create|launch|build|sell|boost|grow|increase",
    r"revenue|profit|demand|guests",
    r"recover|bookings|occupancy",
    r"what.{0,20}(happen|on|do)",
]

SESSIONS: dict[str, list[dict]] = {}


def _new_session() -> str:
    sid = uuid.uuid4().hex[:16]
    SESSIONS[sid] = []
    return sid


def _add(sid: str, role: str, content: str) -> None:
    SESSIONS.setdefault(sid, []).append({"role": role, "content": content})
    if len(SESSIONS[sid]) > 40:
        SESSIONS[sid] = SESSIONS[sid][-20:]


def _should_operate(text: str) -> bool:
    low = text.lower()
    if text.strip().startswith("/operate"):
        return True
    return any(re.search(p, low) for p in TRIGGER_PATTERNS)


async def chat_stream(sid: str, user_text: str) -> None:
    """Async generator yielding SSE-ready dicts."""
    if not sid or sid not in SESSIONS:
        yield {"type": "error", "text": "Unknown session. Refresh to start a new conversation."}
        return

    _add(sid, "user", user_text)

    if user_text.strip().startswith("/operate"):
        mission = user_text.strip()[len("/operate"):].strip()
        mission = mission or "Find a high-value opportunity to increase weekend revenue."
        async for ev in _run_operation_chat(sid, mission):
            yield ev
        return

    if user_text.strip().startswith("/reset"):
        SESSIONS[sid] = []
        yield {"type": "assistant", "text": "Conversation reset. How can VIRELLE help the hotel today?"}
        return

    if _should_operate(user_text):
        yield {"type": "assistant",
               "text": "Understood. I'm activating the organisation. Eleanor Hayes will first investigate live destination and hotel data — events, weather, occupancy, facility utilisation — before the chain moves to design, build, communicate and decide. Stand by for live intelligence."}
        async for ev in _run_operation_chat(sid, user_text):
            yield ev
        return

    try:
        history = SESSIONS[sid][-12:]
        reply = await asyncio.to_thread(
            llm.chat, COMMAND_PERSONA, history, None, False, temperature=0.7
        )
        text = reply.text or "How can VIRELLE help the hotel today?"
        _add(sid, "assistant", text)
        yield {"type": "assistant", "text": text}
    except Exception as exc:  # noqa: BLE001
        yield {"type": "error", "text": f"The concierge service is unavailable: {exc}"}


async def _run_operation_chat(sid: str, mission: str) -> None:
    op = Operation(mission)
    pipeline.OPS[op.id] = op
    yield {"type": "operation_started", "operation_id": op.id, "mission": mission}
    task = asyncio.create_task(run_operation(op))

    streamed_agents = set()
    while True:
        if task.done() and op.queue.empty():
            break
        try:
            event = await asyncio.wait_for(op.queue.get(), timeout=0.6)
        except asyncio.TimeoutError:
            continue
        if event["type"] == "agent_status":
            a = op.agents[event["agent_id"]]
            if event["status"] == "working":
                yield {"type": "agent", "text": f"{a['name']} — {a['title']} is now working.", "agent": event["agent_id"], "status": "working"}
            elif event["status"] == "done":
                yield {"type": "agent", "text": f"{a['name']} has completed their work.", "agent": event["agent_id"], "status": "done"}
        elif event["type"] == "agent_output" and event["agent_id"] == "manager":
            d = event.get("output", {}).get("decision", {})
            verdict = d.get("verdict", "DECISION DELIVERED")
            yield {"type": "assistant",
                   "text": f"The organisation has concluded.\n\nVerdict: {verdict}.\n\n{d.get('decision_summary', '')}",
                   "operation_id": op.id}
        elif event["type"] == "operation":
            if event.get("status") == "complete":
                yield {"type": "operation_done", "operation_id": op.id}
                return
            if event.get("status") == "failed":
                yield {"type": "error", "text": f"The operation failed: {event.get('error')}"}
                return

    yield {"type": "assistant",
           "text": "The organisation has completed its work. Open the Live Operation view to inspect the pipeline, evidence and the final business decision.",
           "operation_id": op.id}
