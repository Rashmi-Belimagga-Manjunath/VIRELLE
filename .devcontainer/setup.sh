#!/usr/bin/env bash
# One-time setup for the VIRELLE Codespace: installs backend + frontend deps.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "==> Installing backend dependencies"
python3 -m venv "$ROOT/backend/.venv"
"$ROOT/backend/.venv/bin/pip" install -q --upgrade pip
"$ROOT/backend/.venv/bin/pip" install -q -r "$ROOT/backend/requirements.txt"

echo "==> Installing frontend dependencies"
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install
fi
npm run build

echo "==> Setup complete. The server will start automatically on port 8000."
