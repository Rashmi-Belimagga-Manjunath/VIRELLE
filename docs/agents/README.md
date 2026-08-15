# The Five VIRELLE Agents

VIRELLE is an agentic AI organisation of **exactly five agents**, run in strict
sequence: **Researcher → Designer → Maker → Communicator → Manager**. Each agent
has its own personality, philosophy, expertise, tool access and a strict JSON
output contract that becomes the next agent's input.

| # | Agent | Title | Role | Guiding question | File |
|---|-------|-------|------|------------------|------|
| 01 | Eleanor Hayes | Research & Intelligence Director | Identify the opportunity | *Is there an opportunity?* | [`01-researcher.md`](01-researcher.md) |
| 02 | Sofia Laurent | Experience Design Director | Create the solution | *What should we create?* | [`02-designer.md`](02-designer.md) |
| 03 | Julian Mercer | Product & Prototyping Director | Build the product | *Can we make it tangible?* | [`03-maker.md`](03-maker.md) |
| 04 | Amelia Bennett | Brand & Growth Director | Get the customers | *How do we create demand?* | [`04-communicator.md`](04-communicator.md) |
| 05 | Alexander Sterling | Executive Director | Run the business | *Should the business actually do it?* | [`05-manager.md`](05-manager.md) |

## The sequence

```
Researcher → Designer → Maker → Communicator → Manager
```

- **Eleanor** investigates the live destination and hotel and finds the
  opportunity (with real, timestamped evidence).
- **Sofia** turns the opportunity into an extraordinary experience design.
- **Julian** builds it into a bookable, customer-facing product.
- **Amelia** campaigns it to the right guests.
- **Alexander** verifies the economics and signs — or kills — the idea.

Every conclusion is grounded in the Hotel Operations MCP (the hotel's real
SQLite database) and, for Eleanor, the live Fáilte Ireland events, weather and
tourism data. See [`pipeline.md`](../pipeline.md) for how the sequence is
orchestrated and how evidence is recorded.
