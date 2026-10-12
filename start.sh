#!/usr/bin/env bash
# Notes2TeX - Startup Script
# Automatically sets up dependencies and launches both FastAPI Backend and Vite Frontend concurrently.

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "=========================================================="
echo "Notes2TeX — Notes & Whiteboards to Compiled LaTeX"
echo "=========================================================="

# 1. Ensure Python virtual environment and dependencies
if [ ! -d "$DIR/venv" ]; then
    echo "[SETUP] Creating Python virtual environment in $DIR/venv..."
    python3 -m venv "$DIR/venv"
    source "$DIR/venv/bin/activate"
    echo "[SETUP] Installing Python dependencies from requirements.txt..."
    pip install --quiet --upgrade pip
    pip install --quiet -r "$DIR/requirements.txt"
else
    source "$DIR/venv/bin/activate"
fi

# 2. Ensure frontend dependencies
if [ ! -d "$DIR/frontend/node_modules" ]; then
    echo "[SETUP] Installing frontend node_modules..."
    (cd "$DIR/frontend" && npm install --silent)
fi

# 3. Create .env if missing
if [ ! -f "$DIR/.env" ]; then
    touch "$DIR/.env"
fi

echo ""
echo "Starting FastAPI Backend on http://127.0.0.1:8008..."
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
