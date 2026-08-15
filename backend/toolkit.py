"""Tool executor for the agent pipeline.

Routes tool calls to the Hospitality MCP (hotel operations) or to the live
external data clients (events / weather / destination), and records every call
as timestamped evidence for the operation.
"""
import datetime as dt

import live_data

HOTEL_TOOL_NAMES = {
    "get_hotel_status", "get_room_availability", "get_available_inventory",
    "get_spa_capacity", "get_restaurant_capacity", "get_rooftop_bar_capacity",
    "get_facility_utilisation", "get_historical_performance", "get_packages",
    "calculate_package_economics", "create_booking", "recent_bookings",
}

LIVE_TOOL_NAMES = {"query_live_events", "query_live_weather", "query_destination_interest"}


class Toolkit:
    def __init__(self, mcp_client):
        self.mcp_client = mcp_client

    async def execute(self, name: str, arguments: dict, evidence: list) -> dict:
        args = dict(arguments or {})
        started = dt.datetime.now().isoformat(timespec="seconds")

        if name in LIVE_TOOL_NAMES:
            return await self._live(name, args, evidence, started)
        if name in HOTEL_TOOL_NAMES:
            return await self._hotel(name, args, evidence, started)
        raise ValueError(f"Unknown tool: {name}")

    async def _hotel(self, name, args, evidence, started) -> dict:
        used_mcp = True
        try:
            result = await self.mcp_client.call(name, args)
            channel = "Hospitality MCP"
        except Exception:  # noqa: BLE001
            used_mcp = False
            result = _hotel_fallback(name, args)
            channel = "Hotel database (direct)"
        evidence.append({
            "tool": name,
            "channel": channel,
            "source": "The Virelle Dublin — Hospitality Operations MCP" if used_mcp else "The Virelle Dublin — hotel database",
            "fetched_at": dt.datetime.now().isoformat(timespec="seconds"),
            "args": {k: v for k, v in args.items()},
            "summary": _summarize_hotel_result(name, result),
        })
        return {"name": name, "args": args, "result": result, "channel": channel,
                "fetched_at": started}

    async def _live(self, name, args, evidence, started) -> dict:
        if name == "query_live_events":
            payload = live_data.fetch_events(days_ahead=int(args.get("days_ahead", 14)))
            summary = live_data.summarize_events(payload, top=10)
            source = payload["source"]
        elif name == "query_live_weather":
            payload = live_data.fetch_weather()
            summary = live_data.summarize_weather(payload)
            source = payload["source"]
        else:
            payload = live_data.fetch_destination_interest(force=True)
            summary = live_data.summarize_destination(payload)
            source = payload["source"]

        evidence.append({
            "tool": name,
            "channel": "Live API",
            "source": source,
            "fetched_at": dt.datetime.now().isoformat(timespec="seconds"),
            "args": {k: v for k, v in args.items()},
            "summary": summary,
        })
        return {"name": name, "args": args, "result": payload, "channel": "Live API",
                "fetched_at": started}


def _summarize_hotel_result(name: str, result: dict) -> str:
    try:
        if name == "get_available_inventory":
            rows = result.get("inventory", [])
            bits = "; ".join(f"{r['stay_date']}: {r['available']} unsold" for r in rows[:5])
            return f"Inventory next {len(rows)} nights. {bits}"
        if name == "get_facility_utilisation":
            facs = result.get("facilities", [])
            bits = "; ".join(f"{f['name']} {f['utilisation']}% of {f['capacity']}" for f in facs)
            return f"Facilities: {bits}"
        if name in ("get_spa_capacity", "get_restaurant_capacity", "get_rooftop_bar_capacity"):
            return f"{result.get('name')}: {result.get('utilisation')}% of {result.get('capacity')} capacity"
        if name == "get_historical_performance":
            h = result.get("history", [])
            if h:
                w = h[0]
                return (f"Latest week occupancy {w['occupancy']}, ADR €{w['adr']}, "
                        f"RevPAR €{w['revpar']}, couples demand index {w['couple_demand_index']}")
            return "No history"
        if name == "get_hotel_status":
            h = result.get("hotel", {})
            return f"{h.get('name')}: {h.get('room_count')} rooms, {h.get('city')}. {h.get('profile','')[:80]}"
        if name == "get_room_availability":
            rooms = result.get("rooms", [])
            return f"{len(rooms)} operational rooms across 6 categories, weekday €285-€1100, weekend €340-€1320."
        if name == "get_packages":
            pkgs = result.get("packages", [])
            return "; ".join(f"{p['name']} @ €{p['price']} ({p['sold']}/{p['capacity']} sold)" for p in pkgs)
        if name == "calculate_package_economics":
            return (f"Revenue €{result['revenue']}, delivery cost €{result['delivery_cost']}, "
                    f"contribution €{result['contribution']} ({result['margin_pct']}% margin) "
                    f"for {result['sold']}/{result['capacity']} sold @ €{result['price']}")
        if name == "create_booking":
            return f"Booking {result['booking_ref']} confirmed for {result['stay_date']} (€{result['price']})."
        if name == "recent_bookings":
            return f"{len(result.get('bookings', []))} recent bookings returned."
        return str(result)[:300]
    except Exception:  # noqa: BLE001
        return str(result)[:300]


def _hotel_fallback(name: str, args: dict) -> dict:
    """Direct database fallback if the MCP server is unreachable."""
    import hotel_db

    if name == "get_available_inventory":
        return hotel_db.get_available_inventory(days=int(args.get("days", 14)))
    if name == "get_facility_utilisation":
        return hotel_db.get_facility_utilisation()
    if name == "get_spa_capacity":
        return hotel_db.get_spa_capacity()
    if name == "get_restaurant_capacity":
        return hotel_db.get_restaurant_capacity()
    if name == "get_rooftop_bar_capacity":
        return hotel_db.get_rooftop_bar_capacity()
    if name == "get_historical_performance":
        return hotel_db.get_historical_performance(weeks=int(args.get("weeks", 12)))
    if name == "get_hotel_status":
        return hotel_db.get_hotel_status()
    if name == "get_room_availability":
        return hotel_db.get_room_availability()
    if name == "get_packages":
        return hotel_db.get_packages()
    if name == "calculate_package_economics":
        return hotel_db.calculate_package_economics(
            float(args["price"]), float(args["cost"]),
            int(args["capacity"]), int(args["sold"]),
        )
    if name == "create_booking":
        return hotel_db.create_booking(
            args.get("name", ""), args.get("email", ""), args.get("experience", ""),
            args.get("stay_date", ""), int(args.get("guests", 2)), float(args.get("price", 0)),
        )
    if name == "recent_bookings":
        return hotel_db.recent_bookings(limit=int(args.get("limit", 20)))
    return {}
