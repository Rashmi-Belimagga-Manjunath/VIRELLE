# VIRELLE — Architecture

## What VIRELLE is

VIRELLE is an **agentic AI organisation** for luxury hospitality. Five
specialised AI agents work in a fixed sequence — **Researcher → Designer →
Maker → Communicator → Manager** — to convert a mission (a business objective
from a hotelier) into three tangible outputs:

1. **VIRELLE Experiences** — a working, bookable luxury product.
2. **VIRELLE Launch** — a complete go-to-market campaign.
3. **VIRELLE Executive** — a signed business decision with verified economics.

Every step is grounded in **live data** (queried at the moment of use) and in
**real operational tools** exposed over the **Model Context Protocol (MCP)**.
Every query and tool call is recorded as timestamped **evidence**.

## The core loop

```
user mission
   │
   ▼
┌────────────────────────── VIRELLE Command (chat) ──────────────────────────┐
│  natural-language front door; also triggers the operation directly         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
┌────────────────────────── Pipeline orchestrator ───────────────────────────┐
│  for each agent in order:                                                  │
│    1. gather live evidence (external APIs + MCP tools)                     │
│    2. build prompt = system instructions + previous agent's output         │
│    3. LLM chat loop with tool calling (up to 5 rounds)                     │
│    4. parse strict JSON output contract                                    │
│    5. hand output to the next agent                                       │
│  stream every step over SSE to the browser                                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ▼
                  product  ·  campaign  ·  decision
```

## Runtime topology

```
Browser (React SPA)  ── HTTP/SSE ──▶  FastAPI (backend/main.py)
                                      │
                                      ├──▶ pipeline.py  (orchestrator)
                                      │       │
                                      │       ├──▶ agents.py      (5 agents)
                                      │       ├──▶ llm.py         (OpenAI/Anthropic)
                                      │       ├──▶ live_data.py   (3 live sources)
                                      │       └──▶ toolkit.py     (tool executor)
                                      │               │
                                      │               ▼
                                      ├──▶ mcp_client.py  ──stdio──▶  mcp_server.py
                                      │                                     │
                                      │                                     ▼
                                      │                           hotel_db.py  (SQLite)
                                      │
                                      └──▶ frontend/dist/  (static SPA, served at /)
```

## Process model

- The FastAPI process runs the MCP server as a **child process over stdio**.
  `McpClient` (in `mcp_client.py`) holds a persistent session.
- Operations run as **asyncio tasks**. Progress is pushed into a per-operation
  `asyncio.Queue`, which SSE endpoints drain and stream to the browser.
- Agent LLM calls run inside `asyncio.to_thread` so the event loop is never
  blocked by a synchronous network call.

## Technology stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.14, FastAPI, uvicorn |
| LLM providers | `openai` (Chat Completions), `anthropic` (Messages) |
| MCP | `mcp` 2.0.0 low-level server + stdio client |
| Live data | `urllib` + `certifi` (SSL on macOS), built-in `csv` |
| Database | SQLite via `sqlite3` |
| Frontend | Vite 5, React 18, Tailwind CSS 3.4, framer-motion, lucide-react |
| Design | Dark-luxury gold system (see [`frontend.md`](frontend.md)) |

## Reliability decisions

- **MCP fallback**: if the MCP server is unreachable, `toolkit.py` falls back
  to querying the SQLite database directly, so the organisation keeps working.
- **Live-data resilience**: each live client returns a structured payload with a
  `status` (`connected`/`error`) and an `error` message; the pipeline records
  the outcome either way and agents are told live data is unavailable rather
  than failing hard.
- **JSON discipline**: every agent must respond with exactly one JSON object.
  If parsing fails, the pipeline asks the agent once to re-issue a valid object.
- **Connection monitor**: `ConnectionMonitor` records the live status and last
  query time of every source for the UI (see [`pipeline.md`](pipeline.md)).

## Directory layout

```
virelle/
├── README.md
├── docs/                 # this documentation
├── examples/             # real operation outputs (JSON)
├── backend/
│   ├── main.py           # FastAPI app, REST + SSE, static hosting
│   ├── pipeline.py       # orchestrator + connection monitor
│   ├── agents.py         # the five agents + tool schemas
│   ├── llm.py            # provider abstraction + JSON extraction
│   ├── toolkit.py        # tool executor + evidence + fallback
│   ├── live_data.py      # events / weather / destination clients
│   ├── mcp_server.py     # Hospitality Operations MCP server (stdio)
│   ├── mcp_client.py     # MCP client used by the pipeline
│   ├── hotel_db.py       # SQLite schema + queries
│   ├── seed.py           # dynamic seed (regenerated relative to today)
│   ├── chat.py           # VIRELLE Command chat orchestration
│   ├── config.py         # environment config
│   ├── requirements.txt
│   └── run.sh
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/              # React app (see frontend.md)
```
