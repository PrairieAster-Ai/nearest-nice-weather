#!/bin/bash

# Start all Claude Intelligence Suite tools
echo "🧠 Starting additional intelligence tools..."

# Check if master suite is running
if ! curl -s http://localhost:3050/health >/dev/null 2>&1; then
    echo "❌ Claude Intelligence Suite master not running"
    echo "Run: ./dev-startup.sh to start the development environment"
    exit 1
fi

echo "✅ Master intelligence suite detected"

# Start Git Intelligence (with timeout handling)
echo "🔄 Starting Git Intelligence tool..."
timeout 10 curl -X POST http://localhost:3050/start?tool=git >/dev/null 2>&1 &
sleep 2

# Start Context API
echo "🔄 Starting Context API tool..."
timeout 10 curl -X POST http://localhost:3050/start?tool=context >/dev/null 2>&1 &
sleep 2

# Wait a moment for tools to initialize
sleep 3

# Check final status
echo "📊 Final intelligence suite status:"
curl -s http://localhost:3050/health | jq .

echo ""
echo "🎯 Intelligence tools ready for enhanced Claude AI collaboration"
echo "   📊 Dashboard: http://localhost:3050"
echo "   💻 System Monitor: http://localhost:3052/system-resources"
echo "   🔀 Git Intelligence: http://localhost:3056/collaboration-analysis"
echo "   🧠 Context API: http://localhost:3058/business-context"
