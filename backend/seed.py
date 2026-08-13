"""Seeds the Virelle Dublin hotel database with synthetic business data.

The data is synthetic in nature but lives in a real SQLite database and is
regenerated relative to the current date on every start, so occupancy,
inventory, historical performance and facility utilisation are always
internally consistent with "today".
"""
import random
import sqlite3
from datetime import date, datetime, timedelta

from config import DB_PATH, HOTEL_LAT, HOTEL_LON
from hotel_db import _conn, init_db

random.seed(2026)

ROOM_TYPES = [
    ("Classic Room", "classic", 285.0, 340.0),
    ("Deluxe Room", "deluxe", 360.0, 430.0),
    ("Junior Suite", "junior_suite", 480.0, 575.0),
    ("Signature Suite", "signature_suite", 620.0, 745.0),
    ("Rooftop Duplex", "duplex", 810.0, 965.0),
    ("Ambassador Suite", "ambassador", 1100.0, 1320.0),
]

FACILITIES = [
    ("The Vitalis Spa", "spa", 30, 42, "08:00 - 21:00",
     "Hydrotherapy pool, sauna, steam, 6 treatment suites. 42% utilisation midweek."),
    ("Solas Restaurant", "restaurant", 80, 38, "07:00 - 23:00",
     "Michelin-adjacent fine dining. 38% utilisation midweek, higher on weekends."),
    ("The Aerie Rooftop Bar", "rooftop_bar", 60, 66, "16:00 - 02:00",
     "Signature cocktails with Dublin skyline views."),
    ("The Cellar Private Dining", "private_dining", 16, 20, "18:00 - 23:00",
     "Chef's table experience, 16 covers."),
    ("Chauffeur Service", "chauffeur", 2, 55, "24h",
     "Two Mercedes S-Class transfers within Dublin."),
]

SEGMENTS = ["couples", "business", "leisure", "family"]
SEGMENT_WEIGHTS = [0.46, 0.22, 0.19, 0.13]


def _revenue_for(segment: str, base: float) -> float:
    mult = {"couples": 1.15, "business": 1.0, "leisure": 0.92, "family": 1.05}
    return round(base * mult.get(segment, 1.0), 2)


def seed_database() -> None:
    init_db()
    random.seed(2026)
    today = date.today()

    with _conn() as c:
        c.execute("DELETE FROM bookings")
        c.execute("DELETE FROM inventory")
        c.execute("DELETE FROM historical_performance")
        c.execute("DELETE FROM packages")
        c.execute("DELETE FROM facilities")
        c.execute("DELETE FROM rooms")
        c.execute("DELETE FROM hotel")

        c.execute(
            "INSERT INTO hotel (id, name, brand, profile, city, lat, lon, room_count, facilities)"
            " VALUES (1, ?, ?, ?, ?, ?, ?, 84, ?)",
            (
                "The Virelle Dublin",
                "VIRELLE",
                "A five-star boutique hotel in Dublin city centre. 84 rooms, premium "
                "suites, a luxury spa, fine-dining restaurant, rooftop bar, private "
                "dining and chauffeur service. Known for discreet luxury and "
                "highly-personalised stays.",
                "Dublin",
                HOTEL_LAT,
                HOTEL_LON,
                "spa,restaurant,rooftop_bar,private_dining,chauffeur,concierge",
            ),
        )

        ROOM_COUNTS = {
            "Classic Room": 30, "Deluxe Room": 24, "Junior Suite": 10,
            "Signature Suite": 10, "Rooftop Duplex": 6, "Ambassador Suite": 4,
        }
        for name, rtype, base, wknd in ROOM_TYPES:
            count = ROOM_COUNTS[name]
            for i in range(count):
                c.execute(
                    "INSERT INTO rooms (hotel_id, name, room_type, base_rate, weekend_rate, status)"
                    " VALUES (1, ?, ?, ?, ?, 'operational')",
                    (name, rtype, base, wknd),
                )

        for name, kind, cap, util, hours, notes in FACILITIES:
            c.execute(
                "INSERT INTO facilities (name, kind, capacity, utilisation, opening_hours, notes)"
                " VALUES (?,?,?,?,?,?)",
                (name, kind, cap, util, hours, notes),
            )

        # Historical performance - last 16 weeks with a strong weekend/couples pattern
        start = today - timedelta(weeks=16)
        for i in range(16):
            week_start = start + timedelta(weeks=i)
            occ = round(random.uniform(0.58, 0.86), 3)
            adr = round(random.uniform(280, 360), 0)
            revpar = round(occ * adr, 2)
            revenue = round(revpar * 84 * 7, 0)
            c.execute(
                "INSERT INTO historical_performance "
                "(period, occupancy, adr, revpar, revenue, couple_demand_index, "
                "business_demand_index, leisure_demand_index) VALUES (?,?,?,?,?,?,?,?)",
                (
                    week_start.isoformat(),
                    occ,
                    adr,
                    revpar,
                    revenue,
                    round(random.uniform(0.7, 0.95), 2),
                    round(random.uniform(0.35, 0.6), 2),
                    round(random.uniform(0.4, 0.7), 2),
                ),
            )

        # Inventory for the next 21 days - Saturday is the critical under-sold night
        for i in range(21):
            d = today + timedelta(days=i)
            wd = d.weekday()
            if wd == 5:      # Saturday
                available = 31
            elif wd == 4:    # Friday
                available = 24
            elif wd == 6:    # Sunday
                available = 38
            elif wd in (0, 1, 2, 3):
                available = 12 + (i % 5)
            c.execute(
                "INSERT INTO inventory (stay_date, available, rooms_total, category, recomputed_at)"
                " VALUES (?,?,84,'standard',?)",
                (d.isoformat(), available, datetime.now().isoformat()),
            )

        # Bookings - past 90 days, dynamic segments + an upcoming Saturday pattern
        refs = []
        for i in range(720):
            d = today - timedelta(days=random.randint(0, 90))
            segment = random.choices(SEGMENTS, SEGMENT_WEIGHTS)[0]
            rtype, _, base, wknd = random.choice(ROOM_TYPES)
            wd = d.weekday()
            rate = wknd if wd >= 5 else base
            refs.append((
                f"VR-HIST-{1000+i}", d.isoformat(), rtype, segment,
                _revenue_for(segment, rate), "direct/ota", "completed",
                datetime.now().isoformat(),
            ))
        for i, row in enumerate(refs):
            c.execute(
                "INSERT INTO bookings (booking_ref, stay_date, room_type, guest_segment, "
                "revenue, source, status, created_at) VALUES (?,?,?,?,?,?,?,?)", row
            )

        # Existing packages (no event-led experience yet)
        c.execute(
            "INSERT INTO packages (name, description, cost, price, capacity, sold, status)"
            " VALUES (?,?,?,?,?,?,?)",
            ("Spa Day Retreat", "Half-day Vitalis spa journey with lunch.", 120.0, 249.0,
             10, 4, "active"),
        )
        c.execute(
            "INSERT INTO packages (name, description, cost, price, capacity, sold, status)"
            " VALUES (?,?,?,?,?,?,?)",
            ("Culinary Evening", "Six-course tasting menu in Solas with wine pairing.", 145.0,
             310.0, 8, 5, "active"),
        )
        c.execute(
            "INSERT INTO packages (name, description, cost, price, capacity, sold, status)"
            " VALUES (?,?,?,?,?,?,?)",
            ("City Uncovered", "Private half-day Dublin experience with a chauffeur.", 260.0,
             495.0, 6, 2, "active"),
        )


if __name__ == "__main__":
    seed_database()
    print(f"Seeded {DB_PATH}")
