#!/bin/bash

echo "🧟 Killing zombie processes blocking port 3001..."

# Kill any processes using port 3001
ZOMBIE_PIDS=$(lsof -ti:3001 2>/dev/null)
if [ -n "$ZOMBIE_PIDS" ]; then
    echo "   Found zombie processes: $ZOMBIE_PIDS"
    kill -9 $ZOMBIE_PIDS
    echo "   ☠️  Killed zombie processes"
else
    echo "   ✅ No zombies found on port 3001"
fi

# Kill any vite processes
echo "🔍 Cleaning up any remaining vite processes..."
pkill -f "node.*vite" || true
pkill -f "sh.*vite" || true

# Kill API server too for clean restart
echo "🔍 Cleaning up API server processes..."
pkill -f "dev-api-server" || true

# Wait for processes to fully terminate
echo "⏳ Waiting for processes to terminate..."
sleep 3

# Verify port 3001 is free
if lsof -ti:3001 >/dev/null 2>&1; then
    echo "❌ Port 3001 still blocked! Manual intervention needed."
    echo "   Run: lsof -ti:3001 | xargs kill -9"
    exit 1
else
    echo "✅ Port 3001 is free!"
fi

echo ""
echo "🚀 Starting clean development environment..."
echo "   🔌 API Server will start on: http://localhost:4000"
echo "   🌐 Frontend will start on: http://localhost:3001"
echo "   🔧 WebSocket HMR will use: ws://localhost:3001"
echo ""

# Start the unified development environment
exec npm start
