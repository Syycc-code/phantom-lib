#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo
echo "========================================================"
echo "      P H A N T O M   L I B R A R Y   S Y S T E M"
echo "========================================================"
echo "[*] Initializing Cognitive Engine..."

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm not found. Please install Node.js first."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] python3 not found. Please install Python 3 first."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[*] node_modules not found, installing frontend dependencies..."
  npm install
fi

PYTHON_BIN="python3"
UVICORN_BIN="uvicorn"

if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
  PYTHON_BIN="$ROOT_DIR/.venv/bin/python"
fi

if [ -x "$ROOT_DIR/.venv/bin/uvicorn" ]; then
  UVICORN_BIN="$ROOT_DIR/.venv/bin/uvicorn"
fi

if ! command -v "$UVICORN_BIN" >/dev/null 2>&1 && [ ! -x "$UVICORN_BIN" ]; then
  echo "[*] uvicorn not found, installing backend dependencies..."
  "$PYTHON_BIN" -m pip install -r "$ROOT_DIR/backend/requirements.txt"
  if [ -x "$ROOT_DIR/.venv/bin/uvicorn" ]; then
    UVICORN_BIN="$ROOT_DIR/.venv/bin/uvicorn"
  fi
fi

echo "[*] Launching Backend Node (Port 8000)..."
(
  cd "$ROOT_DIR/backend"
  exec "$UVICORN_BIN" main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

sleep 3

echo "[*] Launching Frontend Interface (Port 5173)..."
npm run dev &
FRONTEND_PID=$!

cleanup() {
  echo
  echo "[*] Shutting down services..."
  kill "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo
echo "[!] SYSTEM ONLINE."
echo "[!] Access the Palace at: http://localhost:5173"
echo "[!] Press Ctrl+C to stop both services."
echo

wait "$FRONTEND_PID" "$BACKEND_PID"
