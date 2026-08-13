# VIRELLE — Documentation

Everything about VIRELLE, logged in full detail. Read the top-level
[`README.md`](../README.md) for the quick start; this folder is the deep
reference for every part of the system.

## Index

| Document | Covers |
|----------|--------|
| [`architecture.md`](architecture.md) | System overview, flow, technology stack, runtime topology |
| [`agents.md`](agents.md) | The five agents — personalities, philosophies, system prompts, tool access, output contracts |
| [`pipeline.md`](pipeline.md) | The operation orchestrator, evidence model, SSE event stream, connection monitor |
| [`mcp.md`](mcp.md) | The Hospitality Operations MCP server — all 12 tools, schemas, protocol |
| [`hotel-data.md`](hotel-data.md) | SQLite schema, seeding logic, the business storyline |
| [`live-data.md`](live-data.md) | The three live external sources — events, weather, destination interest |
| [`llm.md`](llm.md) | OpenAI / Anthropic provider abstraction, tool calling, JSON extraction |
| [`api.md`](api.md) | REST + SSE API reference with request/response examples |
| [`chat.md`](chat.md) | VIRELLE Command — the chat front door, triggers, session handling |
| [`frontend.md`](frontend.md) | React views, routing, design system, components, API client |
| [`setup.md`](setup.md) | Full local setup and run guide |
| [`end-to-end.md`](end-to-end.md) | Verified end-to-end results of two real LLM operations |

## Reference examples

The `../examples/` folder contains the **actual full output** of two live
operations run against the real LLM:

- [`../examples/operation-the-virelle-indulgence-escape.json`](../examples/operation-the-virelle-indulgence-escape.json)
- [`../examples/operation-cultural-connoisseurs-weekend.json`](../examples/operation-cultural-connoisseurs-weekend.json)

Each includes the product, campaign and executive decision exactly as the
organisation delivered them.
