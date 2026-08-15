import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "hotel.db"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Hotel location (Dublin city centre) - used by live weather lookups
HOTEL_LAT = 53.3498
HOTEL_LON = -6.2603
HOTEL_CITY = "Dublin"

# ---- Live external data sources (all queried at runtime) ----
EVENTS_URL = os.getenv(
    "VIRELLE_EVENTS_URL",
    "https://failteireland.azure-api.net/opendata-api/v2/events/csv",
)
EVENTS_SOURCE_NAME = "Fáilte Ireland Open Data — Events"
EVENTS_API_KEY = os.getenv("VIRELLE_EVENTS_API_KEY", "")
WEATHER_URL = os.getenv(
    "VIRELLE_WEATHER_URL",
    "https://api.open-meteo.com/v1/forecast",
)
WEATHER_SOURCE_NAME = "Open-Meteo — Weather"
TOURISM_URL = os.getenv(
    "VIRELLE_TOURISM_URL",
    "https://failteireland.azure-api.net/opendata-api/v2/attractions/csv",
)
TOURISM_SOURCE_NAME = "Fáilte Ireland Open Data — Attractions & Experiences"

# ---- LLM configuration ----
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_MODEL = os.getenv("VIRELLE_OPENAI_MODEL", "gpt-4o")
ANTHROPIC_MODEL = os.getenv("VIRELLE_ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
VIRELLE_MODEL = os.getenv("VIRELLE_MODEL", "")

HOTEL_NAME = "The Virelle Dublin"

def active_provider() -> str | None:
    if VIRELLE_MODEL:
        return VIRELLE_MODEL
    if OPENAI_API_KEY:
        return OPENAI_MODEL
    if ANTHROPIC_API_KEY:
        return ANTHROPIC_MODEL
    return None
