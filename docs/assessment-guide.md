# VIRELLE — Assessment & presentation guide

How to present VIRELLE to an assessor in 10 minutes, and the technical depth
behind every claim. Use the **demo script** as your walkthrough and the
**technical talking points** as your defence.

---

## 1. The elevator pitch (30 seconds)

> "VIRELLE is an autonomous AI organisation for a luxury hotel. I gave five AI
> agents — Researcher, Designer, Maker, Communicator and Manager — real tools and
> real live data, and they run a complete business operation: find an opportunity,
> design an experience, build a working bookable product, launch it, and sign a
> business decision. Everything is grounded — every claim they make is backed by
> evidence they gathered themselves with real tools, from a live events feed, a
> live weather API, live destination data, and the hotel's own database via a
> Model Context Protocol server."

## 2. Running the live app (the assessor's one click)

Everything runs from the repository in a **GitHub Codespace** — no localhost, no
installation on the assessor's machine.

1. Open the repo on GitHub → green **Code → Codespaces → Create codespace on main**.
2. Wait 1–3 minutes while the workspace installs dependencies and starts the server automatically.
3. In the **Ports** panel, click the globe icon on port **8000** (public URL).
4. The full app opens: landing, chat, live data, operations, booking, music.

Fallback: the static showcase is always live at
`https://rashmi-belimagga-manjunath.github.io/VIRELLE/` (design only — GitHub
Pages cannot run servers, which is why the live app lives in the Codespace).

## 3. The demo script (8–10 minutes)

| # | Action | What the assessor sees |
|---|--------|------------------------|
| 1 | Land on the **home page** | Motion hero banner, live-inventory card ("31 unsold rooms · Saturday"), pipeline preview. |
| 2 | Click the **music** button (bottom-left) | Generative ambient soundscape — created live with the Web Audio API, no audio files. |
| 3 | Click **"Ask me anything"** (bottom-right) and type a mission: *"We have unsold rooms on Saturday. Find us an opportunity."* | The chatbot starts a real operation — agent status pills stream in order: Eleanor → Sofia → Julian → Amelia → Alexander. |
| 4 | Open **VIRELLE Operations** | Live pipeline: agents light up one by one, evidence items appear for **every tool call**, SSE streaming in real time. |
| 5 | Open **VIRELLE Intelligence** | **Live connections** — all five sources probed in real time (events, weather, destination, MCP, hotel DB) with real values and timestamps; live weather photo, real event photos pulled from the live Fáilte Ireland feed. |
| 6 | Open **VIRELLE Experiences** | The product the agents built — a real bookable package with a **working booking flow**. |
| 7 | Book it (enter a name + email) | A real booking is written to the hotel's SQLite database through the **MCP server** — booking reference returned (e.g. `VR-260814001640-2`). |
| 8 | Open **VIRELLE Launch** | The campaign with media plan and budget. |
| 9 | Open **VIRELLE Executive** | The signed decision — confidence score, verified economics, **LAUNCH_APPROVED**. |
| 10 | Open **The VIRELLE Team** | The five agents with their roles, tools and personalities. |

## 4. Technical talking points (defence material)

### The pipeline is a strict chain
The five agents run **sequentially**: each one's JSON output becomes the next
agent's prompt (see `backend/pipeline.py`). Research must happen before design,
design before build, build before demand, and everything before the decision.
No stage can be skipped.

### Every tool call is evidence
Every MCP call and live query is recorded as timestamped evidence with the tool
name, arguments, result summary and source (see `backend/toolkit.py`). The
evidence board in Intelligence renders it all. This is auditable — you can trace
**why** the final decision was made.

### Real MCP server, not a mock
`backend/mcp_server.py` is a genuine **Model Context Protocol** server exposing
12 hotel tools over a real SQLite database (room inventory, facility
utilisation, historical performance, package economics, booking engine).
`backend/mcp_client.py` connects to it over stdio. The booking demo writes a
real row to the database.

### Live data, never cached
Events, weather and destination interest are fetched **at the moment of use**
(see `backend/live_data.py`). The UI shows the exact query time. If the
assessor asks "is that real?", yes — the Big Grill Festival listing and the
Dublin forecast come from live Fáilte Ireland and Open-Meteo APIs right now.

### The decision is verified, not assumed
The Manager (Alexander) is instructed to **re-calculate the package economics
himself** via the `calculate_package_economics` tool before signing. The
Executive page shows his verified numbers. The agents can also **kill** a weak
opportunity — the sign-off is earned.

### Data honesty
The hotel is fictional and its operational data is synthetic (see
`docs/synthetic-data.md` and the snapshots in `docs/data/`), but the destination
data is real and fetched live. The system never hides this — it's documented in
the repo.

## 5. Likely questions and answers

**"How do the agents communicate?"**
Through strict JSON contracts. Each agent outputs a typed JSON object; the next
agent receives it as a handoff in its prompt.

**"What happens if a tool fails?"**
The Toolkit has a fallback path (direct database query) and records which
channel was used — the evidence shows whether it went through MCP or directly.

**"Could this scale to other hotels?"**
Yes — the hotel profile, room inventory, packages and seed are all
configuration/data. The pipeline, agents and tools are hotel-agnostic.

**"Is the chat a hardcoded script?"**
No — chat sessions hit the same LLM + pipeline as Operations. It runs a real
operation and streams the result back into the conversation.

**"Why did it pick that opportunity?"**
Because of evidence: e.g. 31 unsold rooms on Saturday (hotel DB via MCP) + a
real food festival in Dublin that weekend (live events feed) + suitable weather
(live forecast). Each market signal on the Intelligence page cites its source.

## 6. Repository map for assessors

```
backend/
  main.py            FastAPI — REST + SSE API, serves the built frontend
  pipeline.py        Operation orchestrator, connection monitor, live probes
  agents.py          The five agents — prompts, personalities, JSON contracts
  llm.py             OpenAI / Anthropic abstraction (gpt-4o)
  mcp_server.py      Real MCP server: 12 hotel tools over SQLite
  mcp_client.py      MCP stdio client
  live_data.py       Events / weather / destination clients (no caching)
  hotel_db.py        SQLite schema + queries
  seed.py            Deterministic seed (84 rooms, dates relative to today)
  toolkit.py         Tool executor that records timestamped evidence
  chat.py            VIRELLE Command streaming orchestration
frontend/
  src/views/         Command, Operations, Intelligence, Experiences, Launch,
                     Executive, Team, Landing
  src/components/    ChatWidget (Ask me), MusicPlayer (Web Audio), CinematicImage
docs/
  synthetic-data.md  The real-vs-synthetic data ledger
  data/              Frozen snapshots of the seeded hotel database
  architecture.md    Deep architecture write-up
  examples/          Two real operation outputs (products, campaigns, decisions)
```
