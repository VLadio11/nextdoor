#!/usr/bin/env bash
# start-local.sh — Run backend (mock data, no DB) + frontend locally
# Usage: ./start-local.sh
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$REPO_ROOT/backend"
FRONTEND="$REPO_ROOT/frontend"

# ── 1. Python venv + backend ─────────────────────────────────────────────────
echo "▶ Setting up Python virtual environment..."
cd "$BACKEND"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo "▶ Starting backend on http://localhost:8000 ..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

deactivate

# ── 2. Frontend ───────────────────────────────────────────────────────────────
echo "▶ Installing frontend dependencies..."
cd "$FRONTEND"
npm install --silent

echo "▶ Starting frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

# ── Cleanup on exit ───────────────────────────────────────────────────────────
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" INT TERM

echo ""
echo "✅ Stack running:"
echo "   Frontend  → http://localhost:5173"
echo "   Backend   → http://localhost:8000"
echo "   API docs  → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop everything."
wait $BACKEND_PID $FRONTEND_PID
