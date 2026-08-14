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
    "live data and begin the operation. Keep replies concise and luxurious.\n\n"
    "GROUNDING RULES:\n"
    "- When asked about the hotel's own services — dining, restaurant, spa, "
    "rooftop bar, facilities, opening hours, packages, prices, room availability, "
    "contact details, or the weather and cultural events in Dublin — ALWAYS retrieve the real "
    "data with the available tools and answer only from what they return.\n"
    "- When asked what experiences, packages, rooms or offers are available, "
    "answer with the real list from the database. Only speak of creating "
    "something brand new if the customer explicitly asks to design one.\n"
    "- If a request is outside what VIRELLE can retrieve (for example ordering "
    "food from an external delivery service like Domino's, booking taxis or "
    "flights, or anything with no tool), decline politely and honestly: explain "
    "VIRELLE answers from the hotel's live database and live Dublin data, then "
    "offer a real alternative from the retrieved data (e.g. the hotel's own "
    "restaurant or bar, an experience package, or what's on in Dublin tonight).\n"
    "- NEVER invent phone numbers, prices, events, opening hours or services. "
    "If a tool returns nothing or errors, say so plainly."
)

CONCIERGE_TOOLS = [
    {
        "name": "hotel_services",
        "description": "Query The Virelle Dublin's real facilities from the hotel database — restaurant, spa, rooftop bar — including opening hours, capacity and current utilisation. Use for dining, spa, bar and facility questions.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "experience_packages",
        "description": "Query the real experience packages designed by VIRELLE, with prices. Use when asked what experiences, packages or offers are available.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "hotel_contact",
        "description": "Return The Virelle Dublin's address, concierge phone and email from the hotel profile.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "room_availability",
        "description": "Query real room availability for The Virelle Dublin from the hotel database, by number of days ahead. Use for any question about staying, nights, rooms or availability.",
        "parameters": {"type": "object", "properties": {
            "days": {"type": "integer", "description": "Days ahead to check, default 7"},
        }},
    },
    {
        "name": "live_weather",
        "description": "Fetch the current weather in Dublin live from Open-Meteo. Use for any weather, temperature or what-to-wear question.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "city_events",
        "description": "Fetch live cultural events happening in Dublin from Fáilte Ireland. Use for 'what's on', concerts, events or things to do questions.",
        "parameters": {"type": "object", "properties": {}},
    },
]

TRIGGER_PATTERNS = [
    r"opportunit",
    r"unsold|empty rooms|rooms left|occupancy",
    r"revenue|profit|demand|boost|grow|increase",
    r"launch|create (a|an|the|a new )?[a-z\- ]{0,30}(experience|offer|package|deal)",
    r"fill.{0,15}(room|seat|bed)|sell.{0,15}(room|experience|package)",
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


def _run_concierge_tool(name: str, args: dict) -> str:
    import hotel_db
    import live_data

    try:
        if name == "hotel_services":
            r = hotel_db.get_facility_utilisation()
            lines = [
                f"- {f['name']} ({f['kind']}): capacity {f['capacity']}, "
                f"{f['utilisation']}% utilised, hours {f['opening_hours'] or 'varies'}"
                for f in r.get("facilities", [])
            ]
            return "\n".join(lines) or "No facilities found."
        if name == "experience_packages":
            r = hotel_db.get_packages()
            lines = [
                f"- {p['name']}: €{p['price']} per guest (cost €{p['cost']}, "
                f"capacity {p['capacity']}, {p['sold']} sold, status {p['status']})"
                for p in r.get("packages", [])
            ]
            return "\n".join(lines) or "No packages found."
        if name == "hotel_contact":
            r = hotel_db.get_hotel_status()
            h = r.get("hotel", {})
            return (
                f"{h.get('name', 'The Virelle Dublin')} — {h.get('profile', '')} "
                f"Address: 4 College Green, Dublin 2, Ireland. "
                f"Concierge: +353 1 555 0147. Email: concierge@virelle.ie."
            )
        if name == "room_availability":
            days = int(args.get("days", 7))
            r = hotel_db.get_available_inventory(days=days)
            lines = []
            for i in r.get("inventory", []):
                total = i["rooms_total"]
                avail = i["available"]
                weekday = dt.date.fromisoformat(i["stay_date"]).strftime("%A")
                lines.append(
                    f"- {i['stay_date']} ({weekday}): {avail}/{total} rooms available "
                    f"({total - avail} booked, "
                    f"{round((total - avail) / total * 100)}% occupied)"
                )
            return "\n".join(lines) or f"No inventory recorded for the next {days} days."
        if name == "live_weather":
            return live_data.summarize_weather(live_data.fetch_weather())
        if name == "city_events":
            return live_data.summarize_events(live_data.fetch_events())
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: could not retrieve live data ({exc})"
    return f"Unknown tool: {name}"


async def _concierge_reply(history: list[dict]) -> str:
    messages = list(history)
    for _ in range(3):
        resp = await asyncio.to_thread(
            llm.chat, COMMAND_PERSONA, messages, CONCIERGE_TOOLS, False, temperature=0.5
        )
        if not resp.tool_calls:
            return resp.text or "How can VIRELLE help the hotel today?"
        messages.append({
            "role": "assistant",
            "content": resp.text or None,
            "tool_calls": [
                {"id": t.id, "name": t.name, "arguments": t.arguments} for t in resp.tool_calls
            ],
        })
        for tc in resp.tool_calls:
            result = await asyncio.to_thread(_run_concierge_tool, tc.name, tc.arguments)
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})
    return (
        "I could not retrieve that from the live systems. "
        "Try a full operation — I can coordinate the entire organisation on request."
    )


async def chat_stream(sid: str, user_text: str) -> None:
    """Async generator yielding SSE-ready dicts."""
    if not sid or sid not in SESSIONS:
        yield {"type": "error", "text": "Unknown session. Refresh to start a new conversation."}
        return

    _add(sid, "user", user_text)

    if user_text.strip().startswith("/operate"):
        mission = user_text.strip()[len("/operate"):].strip()
        mission = mission or "Find a high-value opportunity to increase weekend revenue."
        async for ev in _run_operation_silent(sid, mission):
            yield ev
        return

    if user_text.strip().startswith("/reset"):
        SESSIONS[sid] = []
        yield {"type": "assistant", "text": "Conversation reset. How can VIRELLE help the hotel today?"}
        return

    if _should_operate(user_text):
        async for ev in _run_operation_silent(sid, user_text):
            yield ev
        return

    try:
        history = SESSIONS[sid][-12:]
        text = await _concierge_reply(history)
        _add(sid, "assistant", text)
        yield {"type": "assistant", "text": text}
    except Exception as exc:  # noqa: BLE001
        yield {"type": "error", "text": f"The concierge service is unavailable: {exc}"}


async def _run_operation_silent(sid: str, mission: str) -> None:
    """Run the full organisation in the background and reply once, plainly.

    The customer sees nothing of the machinery — just the typing indicator,
    then a single clean answer with the experience that was designed.
    """
    op = Operation(mission)
    pipeline.OPS[op.id] = op
    yield {"type": "operation_started", "operation_id": op.id, "mission": mission}

    task = asyncio.create_task(run_operation(op))
    while not task.done():
        await asyncio.sleep(0.5)

    if op.status == "failed":
        yield {"type": "assistant",
               "text": "I couldn't pull that together, I'm afraid. Could you tell me a little more about what you're looking for?"}
        return

    answer = _customer_answer(op)
    _add(sid, "assistant", answer)
    yield {"type": "assistant", "text": answer}
    yield {"type": "operation_done", "operation_id": op.id}


def _customer_answer(op: Operation) -> str:
    product = op.product or {}
    bc = product.get("booking_config") or {}
    name = product.get("experience_name") or "a new experience"
    stay_date = bc.get("date") or product.get("stay_date")
    price = bc.get("price") or product.get("price")
    verdict = (op.decision or {}).get("verdict") if op.decision else None

    lines = ["Wonderful — we've arranged something for you:"]
    lines.append(f"• {name}")
    if stay_date:
        lines.append(f"• {stay_date}")
    if price:
        lines.append(f"• €{price} per guest")
    if verdict:
        lines.append(f"• {verdict}")
    lines.append("")
    lines.append("Shall I reserve it for you?")
    return "\n".join(lines)
