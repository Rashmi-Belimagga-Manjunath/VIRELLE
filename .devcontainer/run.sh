#!/usr/bin/env bash
# Starts the VIRELLE backend (which also serves the built frontend) on every
# Codespace start. Port 8000 is forwarded publicly by Codespaces.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="${CODESPACES_LOGS_DIR:-/tmp}/virelle.log"

if python3 -c "import socket; s=socket.socket(); s.settimeout(0.2); s.connect(('127.0.0.1',8000)); s.close()" 2>/dev/null; then
  echo "==> VIRELLE already running on port 8000"
  exit 0
fi

echo "==> Starting VIRELLE backend on port 8000"
cd "$ROOT/backend"
nohup .venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 >"$LOG" 2>&1 &
sleep 3

if python3 -c "import socket; s=socket.socket(); s.settimeout(0.2); s.connect(('127.0.0.1',8000)); s.close()" 2>/dev/null; then
  echo "==> VIRELLE is live. Forwarded public URL available in the Ports panel."
else
  echo "==> VIRELLE failed to start. See log: $LOG"
  tail -30 "$LOG" || true
  exit 1
fi
