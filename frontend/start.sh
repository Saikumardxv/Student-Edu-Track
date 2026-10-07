#!/bin/bash

# Exit on any error
set -e

# Clear console
clear

echo "============================================="
echo "🎓 Starting EduTrack Student Management System"
echo "============================================="
echo ""

# Store root directory path
ROOT_DIR=$(pwd)

echo "📦 [1/4] Installing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install

echo ""
echo "🗄️ [2/4] Running database migrations & seeding..."
npx prisma migrate dev --name init

echo ""
echo "📦 [3/4] Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install

echo ""
echo "🚀 [4/4] Starting servers concurrently..."
echo "------------------------------------------------"
echo "👉 Backend API will be available at: http://localhost:5000"
echo "👉 Frontend UI will be available at: http://localhost:5173"
echo "------------------------------------------------"
echo "Press Ctrl+C to terminate both servers."
echo ""

# Start backend in background
cd "$ROOT_DIR/backend"
npm run dev &
BACKEND_PID=$!

# Start frontend in background
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Setup trap to kill child processes on script exit or interrupt (Ctrl+C)
trap 'echo -e "\n🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT TERM EXIT

# Wait for background processes to keep start script alive
wait
