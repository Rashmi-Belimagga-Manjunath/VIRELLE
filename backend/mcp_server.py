"""Hospitality Operations MCP server.

Exposes the Virelle Dublin's operational capabilities as structured tools over
the MCP protocol. Agents reach the hotel database only through this controlled
interface. Runs over stdio.

Run standalone:  python backend/mcp_server.py
"""
import json
import asyncio

from mcp.server.lowlevel import Server
from mcp.server.stdio import stdio_server
from mcp_types import (
    CallToolRequestParams,
    CallToolResult,
    ListToolsResult,
    PaginatedRequestParams,
    TextContent,
    Tool,
)

import hotel_db
import live_sheets
from config import GOOGLE_SHEET_URL

TOOLS = [
    Tool(
        name="get_hotel_status",
        description="Return the Virelle Dublin hotel profile, location, room count and facilities.",
        input_schema={"type": "object", "properties": {}},
    ),
    Tool(
        name="get_room_availability",
        description="Return the current room inventory: every room type, its rates and operational status.",
        input_schema={"type": "object", "properties": {}},
    ),
    Tool(
        name="get_available_inventory",
        description="Return how many rooms remain unsold per night for the next N nights.",
        input_schema={
            "type": "object",
            "properties": {"days": {"type": "integer", "description": "Number of nights ahead (default 14)"}},
        },
    ),
    Tool(
        name="get_spa_capacity",
        description="Return the Vitalis spa's capacity and current utilisation.",
        input_schema={"type": "object", "properties": {}},
    ),
    Tool(
        name="get_restaurant_capacity",
        description="Return the Solas restaurant's capacity and current utilisation.",
        input_schema={"type": "object", "properties": {}},
    ),
    Tool(
        name="get_rooftop_bar_capacity",
        description="Return the Aerie rooftop bar's capacity and current utilisation.",
        input_schema={"type": "object", "properties": {}},
    ),
    Tool(
        name="get_facility_utilisation",
        description="Return utilisation across all hotel facilities (spa, restaurant, bar, private dining, chauffeur).",
        input_schema={"type": "object", "properties": {}},
    ),
    Tool(
        name="get_historical_performance",
        description="Return weekly occupancy, ADR, RevPAR, revenue and segment demand indices.",
        input_schema={"type": "object", "properties": {"weeks": {"type": "integer", "description": "Weeks of history (default 12)"}}},
    ),
    Tool(
        name="get_packages",
        description="Return the hotel's currently active packages and their economics.",
        input_schema={"type": "object", "properties": {}},
    ),
    Tool(
        name="calculate_package_economics",
        description="Evaluate the economics of a proposed package: revenue, delivery cost, contribution and margin.",
        input_schema={
            "type": "object",
            "properties": {
                "price": {"type": "number"},
                "cost": {"type": "number"},
                "capacity": {"type": "integer"},
                "sold": {"type": "integer"},
            },
            "required": ["price", "cost", "capacity", "sold"],
        },
    ),
    Tool(
        name="create_booking",
        description="Create a confirmed booking for a guest and return the booking reference.",
        input_schema={
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "string"},
                "experience": {"type": "string"},
                "stay_date": {"type": "string"},
                "guests": {"type": "integer"},
                "price": {"type": "number"},
            },
            "required": ["name", "email", "experience", "stay_date", "guests", "price"],
        },
    ),
    Tool(
        name="recent_bookings",
        description="Return the most recent confirmed bookings for context.",
        input_schema={"type": "object", "properties": {"limit": {"type": "integer"}}},
    ),
    Tool(
        name="get_hotel_sheet",
        description="Query the hotel's live Google Sheet for rooms, inventory, packages, facilities or historical data. Returns the current spreadsheet data — not a cached snapshot. The sheet is human-editable and changes are visible to agents immediately.",
        input_schema={
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Published CSV URL of the Google Sheet tab (optional — uses default if not provided)"},
            },
        },
    ),
]

HANDLERS = {
    "get_hotel_status": hotel_db.get_hotel_status,
    "get_room_availability": hotel_db.get_room_availability,
    "get_available_inventory": lambda **kw: hotel_db.get_available_inventory(days=int(kw.get("days", 14))),
    "get_spa_capacity": hotel_db.get_spa_capacity,
    "get_restaurant_capacity": hotel_db.get_restaurant_capacity,
    "get_rooftop_bar_capacity": hotel_db.get_rooftop_bar_capacity,
    "get_facility_utilisation": hotel_db.get_facility_utilisation,
    "get_historical_performance": lambda **kw: hotel_db.get_historical_performance(weeks=int(kw.get("weeks", 12))),
    "get_packages": hotel_db.get_packages,
    "calculate_package_economics": lambda **kw: hotel_db.calculate_package_economics(
        price=float(kw["price"]), cost=float(kw["cost"]),
        capacity=int(kw["capacity"]), sold=int(kw["sold"]),
    ),
    "create_booking": lambda **kw: hotel_db.create_booking(
        name=str(kw["name"]), email=str(kw["email"]), experience=str(kw["experience"]),
        stay_date=str(kw["stay_date"]), guests=int(kw.get("guests", 2)),
        price=float(kw.get("price", 0)),
    ),
    "recent_bookings": lambda **kw: hotel_db.recent_bookings(limit=int(kw.get("limit", 20))),
    "get_hotel_sheet": lambda **kw: live_sheets.fetch_hotel_sheet(kw.get("url") or GOOGLE_SHEET_URL),
}


def _d(obj) -> str:
    return json.dumps(obj, default=str, ensure_ascii=False)


async def on_list_tools(ctx, params: PaginatedRequestParams | None) -> ListToolsResult:
    return ListToolsResult(tools=TOOLS)


async def on_call_tool(ctx, params: CallToolRequestParams) -> CallToolResult:
    name = params.name
    args = dict(params.arguments or {})
    try:
        if name not in HANDLERS:
            return CallToolResult(content=[TextContent(type="text", text=f"Unknown tool: {name}")], is_error=True)
        result = HANDLERS[name](**args)
        return CallToolResult(
            content=[TextContent(type="text", text=_d(result))],
            structured_content=result,
        )
    except Exception as exc:  # noqa: BLE001
        return CallToolResult(
            content=[TextContent(type="text", text=f"Tool error: {type(exc).__name__}: {exc}")],
            is_error=True,
        )


server = Server(
    "hospitality-operations",
    on_list_tools=on_list_tools,
    on_call_tool=on_call_tool,
)


async def main() -> None:
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
