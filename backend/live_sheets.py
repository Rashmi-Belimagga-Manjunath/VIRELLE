"""Fetch live data from a Google Sheet published as CSV.

The Google Sheet acts as a live, human-editable data source that the agents
can query at runtime — satisfying the "spreadsheet you control" requirement.

Usage:
    Set GOOGLE_SHEET_URL in config.py (or .env) to the published CSV URL.
    The sheet should have tabs: Hotel, Rooms, Inventory, Packages, Facilities, Historical.
"""
import csv
import io
import urllib.request
from datetime import date, datetime


def _fetch_csv(url: str) -> list[dict]:
    """Fetch a Google Sheet published URL and return rows as dicts."""
    resp = urllib.request.urlopen(url, timeout=15)
    text = resp.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    return [dict(row) for row in reader]


def fetch_hotel_sheet(sheet_url: str) -> dict:
    """Fetch all tabs from a multi-sheet Google Sheets publication.

    The published URL format is:
    https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}

    For a single-sheet export ( gid=0 ), the URL is:
    https://docs.google.com/spreadsheets/d/{SHEET_ID}/pub?output=csv

    This function fetches the base URL and returns all available data.
    If the sheet has multiple tabs, the user should publish each tab separately
    and provide the URL for the tab they want queried.
    """
    try:
        rows = _fetch_csv(sheet_url)
        if not rows:
            return {"status": "empty", "rows": [], "as_of": datetime.now().isoformat(timespec="seconds")}

        # Detect which tab this is based on column headers
        headers = set(rows[0].keys()) if rows else set()
        tab = _detect_tab(headers)

        return {
            "status": "ok",
            "tab": tab,
            "rows": rows,
            "row_count": len(rows),
            "columns": list(rows[0].keys()) if rows else [],
            "source": f"Google Sheet — {tab}",
            "as_of": datetime.now().isoformat(timespec="seconds"),
        }
    except Exception as exc:
        return {
            "status": "error",
            "error": str(exc),
            "rows": [],
            "as_of": datetime.now().isoformat(timespec="seconds"),
        }


def _detect_tab(headers: set) -> str:
    """Identify which hotel data tab this is based on column headers."""
    h = {col.lower().strip() for col in headers}
    if "weekday rate (eur)" in h or "weekend rate (eur)" in h:
        return "Rooms"
    if "available (unsold)" in h or "stay date" in h and "total rooms" in h:
        return "Inventory"
    if "cost (eur)" in h and "price (eur)" in h and "capacity" in h:
        return "Packages"
    if "utilisation %" in h or "opening hours" in h:
        return "Facilities"
    if "revpar (eur)" in h or "occupancy %" in h:
        return "Historical Performance"
    if "total rooms" in h and "hotel name" in h:
        return "Hotel"
    return "Unknown"


def summarize_sheet_data(data: dict) -> str:
    """Produce a one-line summary of the fetched sheet data for evidence."""
    tab = data.get("tab", "Unknown")
    rows = data.get("rows", [])
    n = len(rows)

    if tab == "Rooms":
        types = set(r.get("Room Type", r.get("room_type", "?")) for r in rows)
        return f"Google Sheet: {n} rooms across {len(types)} types ({', '.join(sorted(types))})"
    if tab == "Inventory":
        dates = [r.get("Stay Date", r.get("stay_date", "?")) for r in rows[:3]]
        unsold = [r.get("Available (Unsold)", r.get("available", "?")) for r in rows[:3]]
        bits = "; ".join(f"{d}: {u} unsold" for d, u in zip(dates, unsold))
        return f"Google Sheet: {n} nights inventory. {bits}"
    if tab == "Packages":
        names = [r.get("Package Name", r.get("name", "?")) for r in rows]
        prices = [r.get("Price (EUR)", r.get("price", "?")) for r in rows]
        bits = "; ".join(f"{n} @ €{p}" for n, p in zip(names, prices))
        return f"Google Sheet: {n} packages — {bits}"
    if tab == "Facilities":
        bits = "; ".join(f"{r.get('Facility Name', r.get('name', '?'))} ({r.get('Utilisation %', r.get('utilisation', '?'))}%)" for r in rows)
        return f"Google Sheet: {n} facilities — {bits}"
    if tab == "Historical Performance":
        return f"Google Sheet: {n} weeks of historical performance data"
    if tab == "Hotel":
        name = rows[0].get("Hotel Name", rows[0].get("name", "?")) if rows else "?"
        return f"Google Sheet: {name} — {n} row(s)"
    return f"Google Sheet: {n} rows (tab: {tab})"
