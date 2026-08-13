#!/usr/bin/env bash
# VIRELLE — start the backend (seeds the hotel DB, connects the MCP server,
# serves the API and the built frontend).
set -euo pipefail
cd "$(dirname "$0")"

PY=.venv/bin/python
[ -x "$PY" ] || { echo "Missing backend/.venv. Run: python3 -m venv .venv && pip install -r requirements.txt" >&2; exit 1; }

DIST=../frontend/dist
if [ ! -f "$DIST/index.html" ]; then
  echo "Frontend not built. Run: cd ../frontend && npm install && npm run build" >&2
  exit 1
fi

exec "$PY" -m uvicorn main:app --host 0.0.0.0 --port 8000
