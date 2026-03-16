#!/usr/bin/env bash
# start-local.sh — Run backend (Node.js) + frontend locally
# Usage: ./start-local.sh
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$REPO_ROOT/backend"
FRONTEND="$REPO_ROOT/frontend"

# ── 1. Backend (Node.js) ──────────────────────────────────────────────────────
echo "▶ Installing backend dependencies..."
cd "$BACKEND"
npm install --silent

echo "▶ Starting backend on http://localhost:8000 ..."
npm run dev &
BACKEND_PID=$!

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
echo "   API docs  → http://localhost:8000/api/system/status"
echo ""
echo "Press Ctrl+C to stop everything."
wait $BACKEND_PID $FRONTEND_PID
