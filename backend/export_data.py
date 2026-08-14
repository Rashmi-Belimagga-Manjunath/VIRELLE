"""Export the seeded hotel database to JSON snapshots under docs/data/.

The hotel database is synthetic business data (see docs/synthetic-data.md).
This script snapshots every table so the dataset is visible in the repository
without shipping the SQLite binary.

Usage:  .venv/bin/python export_data.py
"""
import json
import os
import sqlite3
from pathlib import Path

from config import DB_PATH

OUT_DIR = Path(__file__).resolve().parent.parent / "docs" / "data"
TABLES = [
    "hotel",
    "rooms",
    "facilities",
    "inventory",
    "historical_performance",
    "packages",
    "bookings",
    "contact_inquiries",
]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    manifest = {}
    for table in TABLES:
        try:
            rows = [dict(r) for r in conn.execute(f"SELECT * FROM {table}")]
        except sqlite3.OperationalError:
            rows = []
        dest = OUT_DIR / f"{table}.json"
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2, default=str)
        manifest[table] = len(rows)
        print(f"  {table}.json  ({len(rows)} rows)")
    with open(OUT_DIR / "manifest.json", "w", encoding="utf-8") as f:
        json.dump({"exported_at": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
                   "counts": manifest}, f, indent=2)
    print(f"Exported {sum(manifest.values())} rows to {OUT_DIR}")


if __name__ == "__main__":
    main()
