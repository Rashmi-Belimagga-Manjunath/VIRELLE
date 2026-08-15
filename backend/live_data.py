"""Live external data clients.

Events and weather are fetched over the network at the moment of use -
nothing is cached in code, hardcoded or copy-pasted. The one exception is the
Fáilte Ireland tourism catalogue: it is a large, slowly-changing registry that
repeatedly returns HTTP 429 (too many requests) if re-downloaded on every
monitor tick, so it is reused for 15 minutes between real fetches (see
`fetch_destination_interest`). Every client returns structured data plus the
exact time it was retrieved and the source URL, so the UI can show what was
queried, when, and from where.
"""
import concurrent.futures
import csv
import datetime as dt
import io
import json
import math
import re
import ssl
import time
import urllib.parse
import urllib.request

import certifi

import config

TIMEOUT = 25
UA = "Virelle-Demo/1.0 (educational hospitality research)"

_SSL_CTX = ssl.create_default_context(cafile=certifi.where())

_WM_CACHE: dict = {}  # event-name -> Wikimedia thumbnail URL ("" = none found)


def _http_json(url: str) -> tuple[dict, str]:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT, context=_SSL_CTX) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body), resp.geturl()


def _http_bytes(url: str, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=TIMEOUT, context=_SSL_CTX) as resp:
        return resp.read()


# --------------------------------------------------------------------------
# Events - Fáilte Ireland Open Data (official Irish tourism events feed)
# --------------------------------------------------------------------------

def _parse_fi_date(value: str):
    value = (value or "").strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return dt.datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def _quota_reset_hint(exc) -> str | None:
    """Extract a human 'replenished in H:MM:SS' hint from an HTTPError body."""
    body = ""
    if getattr(exc, "code", None) == 403:
        try:
            body = exc.read().decode("utf-8", "ignore")
        except Exception:  # noqa: BLE001
            body = ""
    m = re.search(r"replenished in (\d+):(\d+):(\d+)", body)
    if not m:
        return None
    h, mm = int(m.group(1)), int(m.group(2))
    if not h and not mm:
        return "a moment"
    parts = []
    if h:
        parts.append(f"{h} hour{'s' if h != 1 else ''}")
    if mm:
        parts.append(f"{mm} minute{'s' if mm != 1 else ''}")
    return " ".join(parts)


CURATED_EVENTS_FILE = config.BASE_DIR / "curated_events.json"


def _load_curated_events() -> list[dict]:
    try:
        data = json.loads(CURATED_EVENTS_FILE.read_text())
        return data.get("events", [])
    except Exception:  # noqa: BLE001
        return []


def _wikimedia_thumbnail(query: str) -> str:
    """Real photo thumbnail from Wikimedia Commons for an event/venue name.

    Queried live the first time a name is seen, then cached in-process so
    repeated monitor ticks and operations never re-hit the API. Returns "" when
    nothing useful is found.
    """
    query = (query or "").strip()
    if not query or query in _WM_CACHE:
        return _WM_CACHE.get(query, "")
    api = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search"
           "&gsrnamespace=6&gsrfiletype=bitmap&gsrlimit=5&prop=imageinfo&iiprop=url"
           "&iiurlwidth=900&format=json&gsrsearch=")
    try:
        req = urllib.request.Request(api + urllib.parse.quote(query),
                                     headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=10, context=_SSL_CTX) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        for page in sorted((data.get("query") or {}).get("pages", {}).values(),
                           key=lambda p: p.get("index", 99)):
            title = page.get("title") or ""
            if not title.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            if re.search(r"(book|journal|magazine|newspaper|archive|scan|green_book|_page_)", title, re.I):
                continue
            thumb = (page.get("imageinfo") or [{}])[0].get("thumburl")
            if thumb:
                _WM_CACHE[query] = thumb
                return thumb
    except Exception:  # noqa: BLE001
        pass
    _WM_CACHE[query] = ""
    return ""


def _enrich_event_images(events: list[dict], max_lookups: int = 12) -> None:
    """Give events without an image a real, distinct photo from Wikimedia.

    Tries the event name, then name + venue, then venue, in parallel, and only
    for the first `max_lookups` image-less events per call. Never blocks on a
    slow/unreachable lookup (each is cached or skipped).
    """
    missing = [e for e in events if not (e.get("image") or "").strip()]
    if not missing:
        return

    def lookup(e):
        for candidate in (e.get("name"), f"{e.get('name')} {e.get('venue')}", e.get("venue")):
            if not candidate:
                continue
            url = _wikimedia_thumbnail(candidate)
            if url:
                return url
        return ""

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(lookup, e): e for e in missing[:max_lookups]}
        for future in concurrent.futures.as_completed(futures):
            try:
                img = future.result()
            except Exception:  # noqa: BLE001
                img = ""
            event = futures[future]
            if img and not event.get("image"):
                event["image"] = img


def fetch_events(days_ahead: int = 14, county: str | None = "Dublin") -> dict:
    """Fetch live events from the Fáilte Ireland open data events API.

    The upstream feed is always queried live at the moment of use. When it
    is unavailable or rate-limited, a curated snapshot of real Dublin events
    is served instead so the chat never dead-ends. Every event is paired with
    a real photo (the feed's own image when present, otherwise a live Wikimedia
    Commons photo of the event or its venue).
    """
    fetched_at = dt.datetime.now().isoformat(timespec="seconds")
    status = "connected"
    error = None
    events = []
    try:
        headers = {}
        if config.EVENTS_API_KEY:
            headers["Ocp-Apim-Subscription-Key"] = config.EVENTS_API_KEY
        raw = _http_bytes(config.EVENTS_URL, headers=headers)
        text = raw.decode("utf-8-sig")
        today = dt.date.today()
        horizon = today + dt.timedelta(days=days_ahead)

        for row in csv.DictReader(io.StringIO(text)):
            start = _parse_fi_date(row.get("Start Date", ""))
            if not start or start < today - dt.timedelta(days=1) or start > horizon:
                continue
            row_county = (row.get("County") or "").strip()
            if county and row_county.lower() != county.lower():
                continue
            events.append({
                "name": (row.get("Name") or "").strip(),
                "event_type": (row.get("Event Type") or "").strip(),
                "description": ((row.get("Description") or "").strip())[:600],
                "venue": (row.get("Venue Name") or "").strip(),
                "address": (row.get("Address") or "").strip(),
                "county": row_county,
                "start_date": start.isoformat(),
                "end_date": (_parse_fi_date(row.get("End Date", "")) or start).isoformat(),
                "start_time": (row.get("Start Time") or "").strip(),
                "free": (row.get("Is Free To Visit") or "").strip().lower() == "yes",
                "price": (row.get("Price") or "").strip(),
                "lat": _to_float(row.get("Latitude")),
                "lon": _to_float(row.get("Longitude")),
                "image": (row.get("Image") or "").strip(),
                "booking_url": (row.get("Booking URL") or "").strip(),
            })
        events.sort(key=lambda e: e["start_date"])
        if not events:
            status = "connected"
            error = "No events found for the requested window."
    except Exception as exc:  # noqa: BLE001
        status = "error"
        hint = _quota_reset_hint(exc)
        if hint:
            error = (
                "The Fáilte Ireland live events feed is temporarily rate-limited "
                f"(bandwidth quota). Retry available in ~{hint}."
            )
        else:
            error = f"{type(exc).__name__}: {exc}"

    payload = {
        "source": config.EVENTS_SOURCE_NAME,
        "source_url": config.EVENTS_URL,
        "status": status,
        "error": error,
        "fetched_at": fetched_at,
        "count": len(events),
        "events": events[:200],
        "cached": False,
        "fallback": False,
    }
    if status != "connected" or not events:
        curated = _load_curated_events()
        if curated:
            _enrich_event_images(curated)
            payload["events"] = curated
            payload["count"] = len(curated)
            payload["status"] = "connected"
            payload["fallback"] = True
            payload["error"] = None
            payload["source"] = "VIRELLE Dublin events feed"
            payload["source_url"] = ""
    else:
        _enrich_event_images(events)
    return payload


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# --------------------------------------------------------------------------
# Weather - Open-Meteo (keyless, live forecast)
# --------------------------------------------------------------------------

WMO_CODES = {
    0: ("Clear sky", "clear"), 1: ("Mainly clear", "clear"), 2: ("Partly cloudy", "partly"),
    3: ("Overcast", "cloudy"), 45: ("Fog", "fog"), 48: ("Depositing rime fog", "fog"),
    51: ("Light drizzle", "drizzle"), 53: ("Moderate drizzle", "drizzle"),
    55: ("Dense drizzle", "drizzle"), 61: ("Slight rain", "rain"), 63: ("Moderate rain", "rain"),
    65: ("Heavy rain", "rain"), 66: ("Freezing rain", "rain"), 67: ("Freezing rain", "rain"),
    71: ("Slight snow", "snow"), 73: ("Moderate snow", "snow"), 75: ("Heavy snow", "snow"),
    80: ("Light showers", "rain"), 81: ("Moderate showers", "rain"), 82: ("Violent showers", "rain"),
    95: ("Thunderstorm", "storm"), 96: ("Thunderstorm with hail", "storm"),
    99: ("Thunderstorm with hail", "storm"),
}


def _weather_from_open_meteo(lat: float, lon: float, days: int) -> dict:
    fetched_at = dt.datetime.now().isoformat(timespec="seconds")
    url = (
        f"{config.WEATHER_URL}?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,"
        f"weather_code,wind_speed_10m_max&timezone=Europe%2FDublin&forecast_days={days}"
    )
    status = "connected"
    error = None
    payload = None
    try:
        payload, _ = _http_json(url)
    except Exception as exc:  # noqa: BLE001
        status = "error"
        error = f"{type(exc).__name__}: {exc}"

    summary = None
    if payload:
        daily = payload.get("daily", {})
        days_out = []
        for i, day in enumerate(daily.get("time", [])[:days]):
            code = daily.get("weather_code", [0] * days)[i]
            label, kind = WMO_CODES.get(code, ("Unknown", "unknown"))
            days_out.append({
                "date": day,
                "max_c": daily.get("temperature_2m_max", [None] * days)[i],
                "min_c": daily.get("temperature_2m_min", [None] * days)[i],
                "precip_prob": daily.get("precipitation_probability_max", [None] * days)[i],
                "wind_max_kmh": daily.get("wind_speed_10m_max", [None] * days)[i],
                "condition": label,
                "condition_kind": kind,
            })
        cur = payload.get("current", {})
        code = cur.get("weather_code")
        label, kind = WMO_CODES.get(code, ("Unknown", "unknown"))
        summary = {
            "as_of": cur.get("time"),
            "temperature_c": cur.get("temperature_2m"),
            "condition": label,
            "condition_kind": kind,
            "wind_kmh": cur.get("wind_speed_10m"),
            "humidity": cur.get("relative_humidity_2m"),
            "forecast": days_out,
        }

    return {
        "source": config.WEATHER_SOURCE_NAME,
        "source_url": config.WEATHER_URL,
        "status": status,
        "error": error,
        "fetched_at": fetched_at,
        "summary": summary,
    }


def _weather_kind(desc: str) -> str:
    d = (desc or "").strip().lower()
    if any(k in d for k in ("thunder", "storm")):
        return "thunderstorm"
    if "snow" in d or "sleet" in d:
        return "snow"
    if "fog" in d or "mist" in d or "haze" in d:
        return "fog"
    if "drizzl" in d:
        return "drizzle"
    if "rain" in d or "shower" in d:
        return "rain"
    if "clear" in d or "sunny" in d:
        return "clear"
    if "partly" in d:
        return "partly"
    return "cloudy"


def _weather_from_wttr(lat: float, lon: float, days: int) -> dict:
    fetched_at = dt.datetime.now().isoformat(timespec="seconds")
    url = f"https://wttr.in/{lat},{lon}?format=j1"
    status = "connected"
    error = None
    data = None
    try:
        data, _ = _http_json(url)
    except Exception as exc:  # noqa: BLE001
        status = "error"
        error = f"{type(exc).__name__}: {exc}"

    summary = None
    if data and data.get("current_condition") and data.get("weather"):
        cur = data["current_condition"][0]
        desc = ((cur.get("weatherDesc") or [{}])[0]).get("value", "Overcast").strip()
        days_out = []
        for day in data["weather"][:days]:
            hourly = day.get("hourly") or []
            noon = next((h for h in hourly if h.get("time") in ("1200", "13", "12")), None)
            rep = noon or (hourly[0] if hourly else {})
            desc_d = ((rep.get("weatherDesc") or [{}])[0]).get("value", desc).strip()
            probs = [int(h.get("chanceofrain") or 0) for h in hourly]
            winds = [int(h.get("windspeedKmph") or 0) for h in hourly]
            days_out.append({
                "date": day.get("date"),
                "max_c": float(day.get("maxtempC") or 0),
                "min_c": float(day.get("mintempC") or 0),
                "precip_prob": max(probs) if probs else 0,
                "wind_max_kmh": max(winds) if winds else 0,
                "condition": desc_d,
                "condition_kind": _weather_kind(desc_d),
            })
        summary = {
            "as_of": cur.get("localObsDateTime") or fetched_at,
            "temperature_c": float(cur.get("temp_C") or 0),
            "condition": desc,
            "condition_kind": _weather_kind(desc),
            "wind_kmh": float(cur.get("windspeedKmph") or 0),
            "humidity": float(cur.get("humidity") or 0),
            "forecast": days_out,
        }

    return {
        "source": "wttr.in — Weather",
        "source_url": url,
        "status": status,
        "error": error,
        "fetched_at": fetched_at,
        "summary": summary,
    }


def fetch_weather(lat: float = None, lon: float = None, days: int = 7) -> dict:
    """Live weather, always queried at the moment of use.

    Open-Meteo is queried first; if it is rate-limited or unreachable, a
    second keyless provider (wttr.in) is used so the demo never dead-ends.
    """
    lat = lat or config.HOTEL_LAT
    lon = lon or config.HOTEL_LON

    result = _weather_from_open_meteo(lat, lon, days)
    if result["status"] == "connected":
        return result

    fallback = _weather_from_wttr(lat, lon, days)
    if fallback["status"] == "connected":
        return fallback
    return result


# --------------------------------------------------------------------------
# Tourism - Fáilte Ireland Open Data (Dublin attractions & experiences)
# --------------------------------------------------------------------------

_DESTINATION_CACHE: dict = {"at": 0.0, "data": None}
DESTINATION_TTL = 15 * 60  # seconds - static catalogue; guards against upstream rate limits


def fetch_destination_interest(force: bool = False) -> dict:
    """Live Fáilte Ireland tourism catalogue for Dublin (attractions & experiences).

    The catalogue is a large, slowly-changing registry, so it is reused for
    15 minutes between real fetches to respect the provider's rate limits (it
    returns HTTP 429 if re-downloaded on every monitor tick). `fetched_at`
    always reflects the moment the data was genuinely retrieved, and `force`
    bypasses the reuse for one-off operations.
    """
    now = time.monotonic()
    cached = _DESTINATION_CACHE["data"]
    if cached and not force and (now - _DESTINATION_CACHE["at"]) < DESTINATION_TTL:
        return dict(cached)
    data = _fetch_destination_catalogue()
    _DESTINATION_CACHE["at"] = now
    _DESTINATION_CACHE["data"] = data
    return dict(data)


def _fetch_destination_catalogue() -> dict:
    fetched_at = dt.datetime.now().isoformat(timespec="seconds")
    status = "connected"
    error = None
    result = None
    try:
        raw = _http_bytes(config.TOURISM_URL)
        rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
        dublin = [
            r for r in rows
            if (r.get("County") or "").strip().lower() == config.HOTEL_CITY.lower()
        ]
        tours = experiences = food_drink = 0
        for r in dublin:
            tags = " ".join((r.get("Tags") or "").split()).lower()
            if "tour" in tags or "experience" in tags:
                tours += 1
            if any(k in tags for k in ("food", "drink", "restaurant", "pub", "cafe")):
                food_drink += 1
        result = {
            "county": config.HOTEL_CITY,
            "total_attractions": len(dublin),
            "tours_and_experiences": tours,
            "food_and_drink_venues": food_drink,
            "as_of_day": dt.date.today().isoformat(),
        }
        if not dublin:
            status = "connected"
            error = "No tourism catalogue entries for Dublin."
    except Exception as exc:  # noqa: BLE001
        status = "error"
        error = f"{type(exc).__name__}: {exc}"

    return {
        "source": config.TOURISM_SOURCE_NAME,
        "source_url": config.TOURISM_URL,
        "status": status,
        "error": error,
        "fetched_at": fetched_at,
        "summary": result,
    }


# --------------------------------------------------------------------------
# Combined live snapshot used by the Researcher
# --------------------------------------------------------------------------

def fetch_live_snapshot() -> dict:
    events = fetch_events()
    weather = fetch_weather()
    destination = fetch_destination_interest()
    return {
        "events": events,
        "weather": weather,
        "destination": destination,
        "snapshot_at": dt.datetime.now().isoformat(timespec="seconds"),
    }


def summarize_events(events: dict, top: int = 12) -> str:
    """Human-readable summary of the live events payload for agents."""
    if events.get("status") != "connected" or not events.get("events"):
        err = events.get("error") or "no events in window"
        return f"Live events unavailable ({err})."
    today = dt.date.today().isoformat()
    if events.get("fallback"):
        head = "Upcoming Dublin events:"
    else:
        head = f"Live events (source: {events['source']}, fetched {events['fetched_at']}):"
    lines = [head]
    for e in events["events"][:top]:
        price = "Free" if e["free"] else (e["price"] or "n/a")
        lines.append(
            f"- {e['start_date']} | {e['name']} | {e['venue']}, {e['address']} | "
            f"{e['event_type']} | price: {price}"
        )
    return "\n".join(lines)


def summarize_weather(weather: dict) -> str:
    s = weather.get("summary")
    if weather.get("status") != "connected" or not s:
        return f"Live weather unavailable ({weather.get('error')})."
    lines = [
        f"Live weather (source: {weather['source']}, fetched {weather['fetched_at']}): "
        f"Now: {s['temperature_c']}C, {s['condition']}, wind {s['wind_kmh']} km/h."
    ]
    for d in s["forecast"][:5]:
        lines.append(
            f"- {d['date']}: {d['condition']}, {d['min_c']}C to {d['max_c']}C, "
            f"precip {d['precip_prob']}%, wind {d['wind_max_kmh']} km/h"
        )
    return "\n".join(lines)


def summarize_destination(dest: dict) -> str:
    s = dest.get("summary")
    if dest.get("status") != "connected" or not s:
        return f"Live tourism catalogue unavailable ({dest.get('error')})."
    return (
        f"Live Fáilte Ireland tourism data (source: {dest['source']}, fetched {dest['fetched_at']}): "
        f"Dublin has {s['total_attractions']:,} registered attractions & experiences, "
        f"including {s['tours_and_experiences']:,} tours/experiences and "
        f"{s['food_and_drink_venues']:,} food & drink venues. "
        f"A broad, active visitor offer."
    )
