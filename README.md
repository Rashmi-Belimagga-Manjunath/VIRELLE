# VIRELLE — The Intelligent Hospitality Organisation

[![Live Site](https://img.shields.io/badge/Live%20Site-GitHub%20Pages-gold)](https://rashmi-belimagga-manjunath.github.io/VIRELLE/)

A pitch-ready AI organisation for **The Virelle Dublin**, a fictional five-star
boutique hotel. Five specialised AI agents — Researcher → Designer → Maker →
Communicator → Manager — run a complete business operation from **live data to a
final signed decision**, powered by a real **MCP** (Model Context Protocol)
server over the hotel's actual database.

The website is fully interactive: a chatbot (**VIRELLE Command**), a live
pipeline workspace (**VIRELLE Operations**), a live data and evidence board
(**VIRELLE Intelligence**), a bookable product (**VIRELLE Experiences**), the
go-to-market (**VIRELLE Launch**), the signed business decision (**VIRELLE
Executive**) and the team itself (**The VIRELLE Team**).

## Architecture (submission setup)

```
GitHub Pages (submitted link)          Render (free web service)
https://…github.io/VIRELLE/    ──►     https://<service>.onrender.com
  static React frontend                 FastAPI + MCP + SQLite + live data
  (no keys, no backend)                 (OPENAI_API_KEY as a Render secret)
```

- The **frontend** is deployed to GitHub Pages and is the URL submitted.
- The **backend** is hosted on **Render** (free tier) and reached from the Pages
  site over the network. Every live feature — chat, live data connections,
  operations and booking — works from the submitted Pages URL.
- **No API keys are committed.** `OPENAI_API_KEY` lives only in Render's
  environment variables; `backend/.env` is gitignored and never in the repo.

## Deploying the backend to Render (one-time, ~5 minutes)

1. Create a free account at **https://render.com** (sign in with GitHub).
2. Click **New + → Blueprint**, select this repository — Render reads
   [`render.yaml`](render.yaml) and provisions the service automatically.
3. In the dashboard open the service → **Environment** → set `OPENAI_API_KEY`
   (it is stored as a Render secret).
4. **Deploy**. The service URL is `https://virelle-live.onrender.com` (Render
   may adjust the name if taken).
5. Set the GitHub repository variable so Pages is rebuilt to call it:
   `gh variable set VITE_API_BASE https://virelle-live.onrender.com`
   then re-run the "Deploy to GitHub Pages" workflow.

> The static Pages build shows a "STATIC PREVIEW" banner until the backend is
> reachable. Once Render is live, the banner disappears and all live features
> work from the Pages URL.

## Local development

For local work the FastAPI server serves both the API and the built frontend at
http://localhost:8000 — everything works out of the box:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add OPENAI_API_KEY
cd ../frontend && npm install && npm run build
cd ../backend && ./run.sh   # http://localhost:8000
```

## The five agents

| # | Agent | Title | Answers | Colour |
|---|-------|-------|---------|--------|
| 01 | Eleanor Hayes | Research & Intelligence Director | Is there an opportunity? | `#4facfe` |
| 02 | Sofia Laurent | Experience Design Director | What should we create? | `#f6c86a` |
| 03 | Julian Mercer | Product & Prototyping Director | Can we make it tangible? | `#5eead4` |
| 04 | Amelia Bennett | Brand & Growth Director | How do we create demand? | `#f472b6` |
| 05 | Alexander Sterling | Executive Director | Should the business actually do it? | `#c4b5fd` |

Each agent has its own personality, philosophy, tool access and a strict JSON
output contract. Every agent's output becomes the next agent's input, and every
tool call it makes is recorded as timestamped evidence.

## Live data (queried at runtime — never cached)

- **Fáilte Ireland Open Data** — live Dublin events feed (CSV)
- **Open-Meteo** — live Dublin weather forecast
- **Wikimedia** — live Dublin destination-interest signal
- **Hospitality Operations MCP** — 12 tools over the hotel's SQLite database
  (room inventory, facility utilisation, historical performance, package
  economics, booking engine)

## Architecture

```
frontend/           Vite + React 18 + Tailwind (dark-luxury gold design system)
backend/
  main.py           FastAPI app — REST + SSE API, static hosting
  pipeline.py       Operation orchestrator + connection monitor
  agents.py         The five agents (personalities, prompts, JSON contracts)
  llm.py            OpenAI / Anthropic provider abstraction
  mcp_server.py     Low-level MCP server exposing the 12 hotel tools
  mcp_client.py     MCP stdio client used by the pipeline
  live_data.py      Events / weather / destination-interest clients
  hotel_db.py       SQLite schema + query layer
  seed.py           Dynamic seed (84 rooms, real dates relative to today)
  toolkit.py        Tool executor that records evidence
  chat.py           VIRELLE Command — chat stream orchestration
```

## Quick start

```bash
# 1. Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add OPENAI_API_KEY or ANTHROPIC_API_KEY

# 2. Frontend (build once; the backend serves the static build)
cd ../frontend
npm install
npm run build

# 3. Run
cd ../backend
./run.sh                    # or: .venv/bin/uvicorn main:app --port 8000
```

Open **http://localhost:8000** — the FastAPI server serves the site and the API.

## Required configuration

At least one LLM key must be present in `backend/.env`:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Enables OpenAI (default model `gpt-4o`) |
| `ANTHROPIC_API_KEY` | Enables Anthropic (default model `claude-sonnet-4-20250514`) |
| `VIRELLE_MODEL` | Optional — override the model identifier entirely |

Without a key the site works (design, landing, team, chat welcome) but starting
an operation returns `503 No LLM provider configured`.

## How an operation flows

1. You give **VIRELLE Command** (or the Operations workspace) a mission, e.g.
   *"We have unsold rooms on Saturday. Find us an opportunity."*
2. **Eleanor** queries live events, weather, destination interest and the hotel's
   MCP — she scores the opportunity and produces an evidence-backed brief.
3. **Sofia** designs the experience from that brief and verifies what the hotel
   can physically deliver.
4. **Julian** builds the actual bookable product (shown in **VIRELLE
   Experiences** with a working booking flow that writes to the hotel DB via MCP).
5. **Amelia** writes the campaign (**VIRELLE Launch**).
6. **Alexander** re-verifies the package economics himself via
   `calculate_package_economics` and signs **LAUNCH_APPROVED** — or kills it.

All of this streams live to the browser via SSE.

## API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Provider, model, MCP status |
| `/api/connections` | GET | Live data source status + last query time |
| `/api/organisation` | GET | The five agents |
| `/api/operation/start` | POST | Start an operation `{mission}` → `{operation_id}` |
| `/api/operation/{id}` | GET | Full operation snapshot |
| `/api/operation/{id}/stream` | GET | SSE event stream (agents, evidence, log, product, decision) |
| `/api/product/book` | POST | Book the live product (writes to hotel DB via MCP) |
| `/api/product/latest` | GET | Latest product |
| `/api/chat` | POST | New chat session |
| `/api/chat/message` | POST | SSE chat stream `{session_id, message}` |

## Notes

- Python 3.14 on macOS: use `certifi` (already handled in `live_data.py`).
- The MCP client uses the `mcp` v2 low-level API (FastMCP is not bundled).
- The seed regenerates the hotel database relative to the current date, so the
  inventory story is always "live" for the coming weekend.
