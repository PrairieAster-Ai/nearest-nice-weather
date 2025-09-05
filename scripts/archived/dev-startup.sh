#!/bin/bash

# Development Environment Startup Script
# Prevents frequent localhost connection issues

echo "🚀 Starting Nearest Nice Weather Development Environment..."

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port is in use"
        return 0
    else
        echo "Port $port is available"
        return 1
    fi
}

# Function to start service with retry logic
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local max_retries=3
    local retry=0

    while [ $retry -lt $max_retries ]; do
        echo "🔄 Starting $name (attempt $((retry + 1))/$max_retries)..."

        if [ -n "$port" ]; then
            if check_port $port; then
                echo "✅ $name already running on port $port"
                return 0
            fi
        fi

        eval $command &
        local pid=$!
        sleep 3

        if kill -0 $pid 2>/dev/null; then
            echo "✅ $name started successfully (PID: $pid)"
            return 0
        else
            echo "❌ $name failed to start, retrying..."
            retry=$((retry + 1))
        fi
    done

    echo "❌ Failed to start $name after $max_retries attempts"
    return 1
}

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "node.*dev-api-server" 2>/dev/null || true
pkill -f "playwright" 2>/dev/null || true
pkill -f "simple-server" 2>/dev/null || true
sleep 2

# Start PlaywrightMCP server (optional)
echo "🔧 Starting PlaywrightMCP server (optional)..."
if command -v npx &> /dev/null && npx @modelcontextprotocol/server-playwright --version &> /dev/null; then
    if ! start_service "PlaywrightMCP Server" "npx @modelcontextprotocol/server-playwright" "3026"; then
        echo "⚠️ PlaywrightMCP server not available - continuing without testing capabilities"
    fi
else
    echo "⚠️ PlaywrightMCP not installed - skipping"
fi

# Start API server
echo "🗄️ Starting API server..."
if ! start_service "API Server" "node dev-api-server.js" "4000"; then
    echo "❌ Failed to start API server"
    exit 1
fi

# Start frontend development server
echo "🌐 Starting frontend development server..."
if ! start_service "Frontend Server" "npm run dev" "3001"; then
    echo "❌ Failed to start frontend server"
    exit 1
fi

# Wait for servers to be ready
echo "⏳ Waiting for servers to be ready..."
sleep 5

# Test PlaywrightMCP connectivity (if available)
echo "🔍 Testing PlaywrightMCP connectivity..."
if check_port 3026; then
    echo "✅ PlaywrightMCP server is running on port 3026"
else
    echo "⚠️ PlaywrightMCP server not available (optional service)"
fi

# Test API connectivity
echo "🔍 Testing API connectivity..."
if curl -s "http://localhost:4000/api/weather-locations?limit=1" | grep -q "success"; then
    echo "✅ API server responding correctly"
else
    echo "❌ API server not responding"
fi

# Test frontend connectivity
echo "🔍 Testing frontend connectivity..."
if curl -s "http://localhost:3001/" | grep -q "html"; then
    echo "✅ Frontend server responding correctly"
else
    echo "❌ Frontend server not responding"
fi

# Test proxy connectivity
echo "🔍 Testing API proxy..."
if curl -s "http://localhost:3001/api/weather-locations?limit=1" | grep -q "success"; then
    echo "✅ API proxy working correctly"
else
    echo "❌ API proxy not working"
fi

# Test PostgreSQL database connectivity
echo "🔍 Testing local PostgreSQL database..."
if docker exec weather-postgres psql -U postgres -d weather_intelligence -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ PostgreSQL database responding correctly"
else
    echo "❌ PostgreSQL database not responding"
fi

# Start Claude Intelligence Suite if not running
echo "🧠 Starting Claude Intelligence Suite..."
if ! curl -s "http://localhost:3050/health" >/dev/null 2>&1; then
    echo "🔄 Starting intelligence monitoring..."
    cd /home/robertspeer/Projects/GitRepo/nearest-nice-weather
    DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/weather_intelligence}" \
    PROJECT_NAME="nearest-nice-weather" \
    node claude-intelligence-suite-portable.js >/dev/null 2>&1 &
    sleep 3

    if curl -s "http://localhost:3050/health" >/dev/null 2>&1; then
        echo "✅ Claude Intelligence Suite started successfully"
    else
        echo "❌ Claude Intelligence Suite failed to start"
    fi
else
    echo "✅ Claude Intelligence Suite already running"
fi

# Environment check
echo "🔍 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    if grep -q "VITE_API_PROXY_URL=http://localhost:4000" .env; then
        echo "✅ API proxy configured correctly"
    else
        echo "❌ API proxy configuration missing"
    fi
else
    echo "❌ .env file missing"
fi

echo ""
echo "🎉 Development environment ready!"
echo "📋 Available services:"
echo "   🌐 Frontend: http://localhost:3001/"
echo "   🗄️ API: http://localhost:4000/api/weather-locations"
echo "   🔗 Proxy: http://localhost:3001/api/weather-locations"
echo "   🧪 PlaywrightMCP: Port 3026 (if available)"
echo ""
echo "🛠️ Debugging tools:"
echo "   📊 API Health: curl http://localhost:4000/api/health"
echo "   🌤️ Weather data: curl http://localhost:3001/api/weather-locations?limit=5"
echo "   🧠 Intelligence: curl http://localhost:3050/health"
echo "   🧪 Run tests: npx playwright test"
echo "   📝 Logs: tail -f /tmp/vite.log"
echo ""
echo "🔄 To restart: ./dev-startup.sh"
echo "🛑 To stop: pkill -f \"node.*vite\" && pkill -f \"node.*dev-api-server\" && pkill -f \"playwright\" && pkill -f \"claude-intelligence\""
