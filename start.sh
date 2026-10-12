#!/usr/bin/env bash
# Notes2TeX - Startup Script
# Launches both FastAPI Backend and Vite Frontend concurrently

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "=========================================================="
echo "Notes2TeX — Notes & Whiteboards to Compiled LaTeX"
echo "=========================================================="

# Check Python venv
if [ ! -d "$DIR/venv" ]; then
    echo "[ERROR] Virtual environment not found in $DIR/venv."
    exit 1
fi

echo "Starting FastAPI Backend on http://127.0.0.1:8008..."
source "$DIR/venv/bin/activate"
python3 -m uvicorn main:app --app-dir "$DIR/backend" --host 127.0.0.1 --port 8008 --reload &
BACKEND_PID=$!

echo "Starting Vite Frontend on http://localhost:5555..."
cd "$DIR/frontend"
npm run dev -- --port 5555 &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

echo ""
echo "Both services running:"
echo "   - Web App UI:  http://localhost:5555"
echo "   - API Docs:    http://127.0.0.1:8008/docs"
echo ""
echo "Press Ctrl+C to terminate both servers."

wait
