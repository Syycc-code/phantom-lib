#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "[*] Starting backend on 127.0.0.1:8000 ..."
(
  cd "$ROOT_DIR/backend"
  ENABLE_RAG=false ../.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
) &
BACKEND_PID=$!

cleanup() {
  echo
  echo "[*] Stopping backend..."
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

sleep 2

echo "[*] Starting frontend on 127.0.0.1:5173 ..."
echo "[*] If npm is not found, run: source ~/.nvm/nvm.sh"
npm run dev -- --host 127.0.0.1 --port 5173
