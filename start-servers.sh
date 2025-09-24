#!/bin/bash

echo "Starting Jules Dating App servers..."

# Kill any existing processes on ports 3002 and 4002
echo "Stopping existing processes on ports 3002 and 4002..."
lsof -ti:3002,4002 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Start backend server
echo "Starting backend server (port 4002)..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server (port 3002)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Servers started!"
echo "Backend: http://localhost:4002"
echo "Frontend: http://localhost:3002"
echo ""
echo "To stop servers, run: lsof -ti:3002,4002 | xargs kill -9"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
