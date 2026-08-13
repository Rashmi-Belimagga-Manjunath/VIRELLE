"""VIRELLE - FastAPI application.

Serves the REST + SSE API (operations, live connections, chat, product
booking) and the built frontend.
"""
import asyncio
import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import agents
import chat
import config
import llm
import pipeline
from mcp_client import default_mcp_client
from pipeline import OPS, Operation, run_operation
from seed import seed_database

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    mcp = default_mcp_client()
    await mcp.connect()
    pipeline.init_pipeline(mcp)
    pipeline.CONNECTIONS.set("Hospitality Operations MCP",
                             "connected" if mcp.connected else "error",
                             detail=mcp.error)
    pipeline.CONNECTIONS.set("Hotel Database (SQLite)", "connected")
    app.state.mcp = mcp
    yield
    await mcp.close()


app = FastAPI(title="VIRELLE", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

class StartRequest(BaseModel):
    mission: str = ""


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "provider": llm.provider_name() if _provider_available() else "none",
        "model": llm.model_name() if _provider_available() else "none",
        "mcp_connected": getattr(app.state, "mcp", None) is not None and app.state.mcp.connected,
        "time": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    }


def _provider_available() -> bool:
    try:
        llm.provider_name()
        return True
    except RuntimeError:
        return False


@app.get("/api/connections")
async def connections():
    conns = pipeline.CONNECTIONS.get()
    if not conns:
        conns = [
            {"name": n, "status": "idle", "fetched_at": None}
            for n in pipeline.LIVE_CONNECTION_NAMES
        ]
    return {"connections": conns}


@app.get("/api/organisation")
async def organisation():
    return {"agents": [
        {k: v for k, v in a.items() if k not in ("system_prompt", "tools")}
        for a in agents.AGENTS.values()
    ]}


@app.post("/api/operation/start")
async def start_operation(req: StartRequest):
    if not _provider_available():
        raise HTTPException(status_code=503, detail="No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in backend/.env")
    op = Operation(req.mission.strip() or None)
    OPS[op.id] = op
    task = asyncio.create_task(run_operation(op))
    return {"operation_id": op.id, "mission": op.mission, "status": "started"}


def _operation_payload(op: Operation) -> dict:
    return {
        "id": op.id,
        "mission": op.mission,
        "status": op.status,
        "error": op.error,
        "created_at": op.created_at,
        "finished_at": op.finished_at,
        "agents": [op.agents[a] for a in pipeline.agents.AGENT_ORDER],
        "evidence": op.evidence,
        "log": op.log,
        "product": op.product,
        "campaign": op.campaign,
        "decision": op.decision,
    }


@app.get("/api/operation/{op_id}")
async def get_operation(op_id: str):
    op = OPS.get(op_id)
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")
    return _operation_payload(op)


@app.get("/api/operation/{op_id}/stream")
async def stream_operation(op_id: str):
    op = OPS.get(op_id)
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")

    async def gen():
        yield "retry: 2000\n\n"
        snapshot = _operation_payload(op)
        yield f"event: snapshot\ndata: {json.dumps(snapshot)}\n\n"
        while True:
            if op.status in ("complete", "failed") and op.queue.empty():
                break
            try:
                event = await asyncio.wait_for(op.queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue
            yield f"data: {json.dumps(event)}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


class BookRequest(BaseModel):
    name: str
    email: str
    guests: int = 2


@app.post("/api/product/book")
async def book_product(req: BookRequest):
    latest_op = None
    for o in reversed(list(OPS.values())):
        if o.product:
            latest_op = o
            break
    if not latest_op or not latest_op.product:
        raise HTTPException(status_code=404, detail="No live product to book yet. Run an operation first.")
    product = latest_op.product
    cfg = product.get("booking_config", {})
    price = float(cfg.get("price", product.get("price", 695)))
    date = cfg.get("date", product.get("stay_date"))
    mcp = getattr(app.state, "mcp", None)
    if mcp and mcp.connected:
        booking = await mcp.call("create_booking", {
            "name": req.name, "email": req.email, "experience": product.get("experience_name", "VIRELLE Experience"),
            "stay_date": date, "guests": req.guests, "price": price,
        })
    else:
        import hotel_db
        booking = hotel_db.create_booking(req.name, req.email, product.get("experience_name", "VIRELLE Experience"),
                                          date, req.guests, price)
    return {"booking": booking, "product": {"experience_name": product.get("experience_name"),
                                            "stay_date": date, "price": price}}


@app.get("/api/product/latest")
async def latest_product():
    for o in reversed(list(OPS.values())):
        if o.product:
            return {"product": o.product, "operation_id": o.id}
    return {"product": None}


@app.post("/api/chat")
async def chat_stream_endpoint():
    sid = chat._new_session()
    return {"session_id": sid}


@app.post("/api/chat/message")
async def chat_message(body: dict):
    sid = body.get("session_id", "")
    user_text = body.get("message", "")
    if not sid or sid not in chat.SESSIONS:
        sid = chat._new_session()
        chat.SESSIONS[sid] = []

    async def gen():
        yield "retry: 2000\n\n"
        async for ev in chat.chat_stream(sid, user_text):
            yield f"data: {json.dumps(ev)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Frontend (static build)
# ---------------------------------------------------------------------------

if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
