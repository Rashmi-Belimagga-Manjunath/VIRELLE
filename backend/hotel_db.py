"""The Virelle Dublin - real queryable hotel database (SQLite).

Synthetic business data lives in a real database and is queried at runtime.
The Hospitality MCP exposes controlled views over this data.
"""
import json
import sqlite3
from datetime import date, datetime, timedelta

from config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS hotel (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    profile TEXT,
    city TEXT,
    lat REAL,
    lon REAL,
    room_count INTEGER,
    facilities TEXT
);
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY,
    hotel_id INTEGER,
    name TEXT NOT NULL,
    room_type TEXT,
    base_rate REAL,
    weekend_rate REAL,
    status TEXT
);
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY,
    booking_ref TEXT,
    stay_date TEXT,
    room_type TEXT,
    guest_segment TEXT,
    revenue REAL,
    source TEXT,
    status TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS facilities (
    id INTEGER PRIMARY KEY,
    name TEXT,
    kind TEXT,
    capacity INTEGER,
    utilisation INTEGER,
    opening_hours TEXT,
    notes TEXT
);
CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    cost REAL,
    price REAL,
    capacity INTEGER,
    sold INTEGER,
    status TEXT
);
CREATE TABLE IF NOT EXISTS historical_performance (
    id INTEGER PRIMARY KEY,
    period TEXT,
    occupancy REAL,
    adr REAL,
    revpar REAL,
    revenue REAL,
    couple_demand_index REAL,
    business_demand_index REAL,
    leisure_demand_index REAL
);
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY,
    stay_date TEXT,
    available INTEGER,
    rooms_total INTEGER,
    category TEXT,
    recomputed_at TEXT
);
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT,
    created_at TEXT
);
"""


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with _conn() as c:
        c.executescript(SCHEMA)


# --------------------------------------------------------------------------
# Queries (used by the Hospitality MCP tools)
# --------------------------------------------------------------------------

def get_hotel_status() -> dict:
    with _conn() as c:
        hotel = c.execute("SELECT * FROM hotel WHERE id = 1").fetchone()
        total_rooms = c.execute("SELECT COUNT(*) FROM rooms").fetchone()[0]
        return {
            "hotel": dict(hotel),
            "total_rooms": total_rooms,
            "as_of": datetime.now().isoformat(timespec="seconds"),
        }


def get_room_availability() -> dict:
    with _conn() as c:
        rooms = [dict(r) for r in c.execute("SELECT * FROM rooms")]
        return {"rooms": rooms, "as_of": datetime.now().isoformat(timespec="seconds")}


def get_available_inventory(days: int = 14) -> dict:
    today = date.today()
    with _conn() as c:
        rows = []
        for i in range(days):
            d = today + timedelta(days=i)
            row = c.execute(
                "SELECT * FROM inventory WHERE stay_date = ?", (d.isoformat(),)
            ).fetchone()
            if row:
                rows.append(dict(row))
        return {"inventory": rows, "as_of": datetime.now().isoformat(timespec="seconds")}


def get_facility_utilisation() -> dict:
    with _conn() as c:
        facilities = [dict(r) for r in c.execute("SELECT * FROM facilities")]
        return {"facilities": facilities, "as_of": datetime.now().isoformat(timespec="seconds")}


def get_spa_capacity() -> dict:
    with _conn() as c:
        spa = c.execute("SELECT * FROM facilities WHERE kind = 'spa'").fetchone()
        return dict(spa) if spa else {}


def get_restaurant_capacity() -> dict:
    with _conn() as c:
        r = c.execute("SELECT * FROM facilities WHERE kind = 'restaurant'").fetchone()
        return dict(r) if r else {}


def get_rooftop_bar_capacity() -> dict:
    with _conn() as c:
        r = c.execute("SELECT * FROM facilities WHERE kind = 'rooftop_bar'").fetchone()
        return dict(r) if r else {}


def get_historical_performance(weeks: int = 12) -> dict:
    with _conn() as c:
        rows = [dict(r) for r in c.execute(
            "SELECT * FROM historical_performance ORDER BY id DESC LIMIT ?",
            (weeks,),
        )]
        return {"history": rows, "as_of": datetime.now().isoformat(timespec="seconds")}


def get_packages() -> dict:
    with _conn() as c:
        packages = [dict(r) for r in c.execute("SELECT * FROM packages")]
        return {"packages": packages, "as_of": datetime.now().isoformat(timespec="seconds")}


def calculate_package_economics(price: float, cost: float, capacity: int, sold: int) -> dict:
    revenue = price * sold
    delivery_cost = cost * sold
    contribution = revenue - delivery_cost
    margin = (contribution / revenue * 100) if revenue else 0.0
    return {
        "price": price,
        "cost_per_unit": cost,
        "capacity": capacity,
        "sold": sold,
        "revenue": round(revenue, 2),
        "delivery_cost": round(delivery_cost, 2),
        "contribution": round(contribution, 2),
        "margin_pct": round(margin, 1),
        "as_of": datetime.now().isoformat(timespec="seconds"),
    }


def create_booking(name: str, email: str, experience: str, stay_date: str,
                   guests: int, price: float) -> dict:
    ref = "VR-" + datetime.now().strftime("%y%m%d%H%M%S") + "-" + str(guests)
    with _conn() as c:
        c.execute(
            "INSERT INTO bookings (booking_ref, stay_date, room_type, guest_segment, "
            "revenue, source, status, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (ref, stay_date, experience, "experience_package", price,
             "Dublin Afterglow Product", "confirmed", datetime.now().isoformat()),
        )
    mark_inventory_sold(stay_date)
    return {"booking_ref": ref, "status": "confirmed", "experience": experience,
            "stay_date": stay_date, "guests": guests, "price": price,
            "confirmed_at": datetime.now().isoformat(timespec="seconds")}


def mark_inventory_sold(stay_date: str, units: int = 1) -> dict:
    with _conn() as c:
        row = c.execute("SELECT * FROM inventory WHERE stay_date = ?", (stay_date,)).fetchone()
        if row:
            avail = max(0, row["available"] - units)
            c.execute("UPDATE inventory SET available = ?, recomputed_at = ? WHERE stay_date = ?",
                      (avail, datetime.now().isoformat(), stay_date))
            return {"stay_date": stay_date, "available_after": avail}
        return {"stay_date": stay_date, "available_after": None}


def recent_bookings(limit: int = 20) -> dict:
    with _conn() as c:
        rows = [dict(r) for r in c.execute(
            "SELECT * FROM bookings ORDER BY id DESC LIMIT ?", (limit,))]
        return {"bookings": rows}


def create_contact_inquiry(name: str, email: str, subject: str, message: str) -> dict:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO contact_inquiries (name, email, subject, message, created_at) "
            "VALUES (?,?,?,?,?)",
            (name, email, subject, message, datetime.now().isoformat()),
        )
        last_id = cur.lastrowid
    return {"id": last_id, "status": "received",
            "received_at": datetime.now().isoformat(timespec="seconds")}
