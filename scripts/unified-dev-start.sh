#!/bin/bash
# =============================================================================
# UNIFIED DEVELOPMENT STARTUP SCRIPT
# =============================================================================
# Purpose: One command to start entire development environment
# Usage: npm start (from project root)
# Target: Sub-30-second startup, auto-healing, unified dashboard
# =============================================================================

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_PORT=${DEV_PORT:-3001}
API_PORT=4000
DASHBOARD_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Track all child PIDs for proper cleanup
CHILD_PIDS=()

# Enhanced cleanup function for graceful exit with proper signal propagation
cleanup() {
    log "🛑 Shutting down development environment..."

    # Send SIGTERM to all tracked child processes first
    for pid in "${CHILD_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            log "Sending SIGTERM to PID $pid"
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    # Wait a moment for graceful shutdown
    sleep 2

    # Send SIGKILL to any remaining processes
    for pid in "${CHILD_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            warning "Force killing PID $pid"
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done

    # Kill tracked background processes by PID variables
    if [[ -n $API_PID ]]; then
        if kill -0 "$API_PID" 2>/dev/null; then
            kill -TERM "$API_PID" 2>/dev/null || true
            sleep 1
            kill -KILL "$API_PID" 2>/dev/null || true
        fi
        success "API server stopped"
    fi

    if [[ -n $FRONTEND_PID ]]; then
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            kill -TERM "$FRONTEND_PID" 2>/dev/null || true
            sleep 1
            kill -KILL "$FRONTEND_PID" 2>/dev/null || true
        fi
        success "Frontend server stopped"
    fi

    if [[ -n $BROWSERTOOLS_PID ]]; then
        if kill -0 "$BROWSERTOOLS_PID" 2>/dev/null; then
            kill -TERM "$BROWSERTOOLS_PID" 2>/dev/null || true
            sleep 1
            kill -KILL "$BROWSERTOOLS_PID" 2>/dev/null || true
        fi
        success "BrowserToolsMCP server stopped"
    fi

    # Comprehensive cleanup by process pattern (fallback)
    pkill -TERM -f "dev-api-server.js" 2>/dev/null || true
    pkill -TERM -f "vite.*3001" 2>/dev/null || true
    pkill -TERM -f "browsertools-mcp-server" 2>/dev/null || true
    pkill -TERM -f "browsertools-monitor" 2>/dev/null || true

    # Final cleanup after grace period
    sleep 2
    pkill -KILL -f "dev-api-server.js" 2>/dev/null || true
    pkill -KILL -f "vite.*3001" 2>/dev/null || true
    pkill -KILL -f "browsertools-mcp-server" 2>/dev/null || true
    pkill -KILL -f "browsertools-monitor" 2>/dev/null || true

    log "Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Header
echo
echo -e "${PURPLE}🚀 NEAREST NICE WEATHER - UNIFIED DEVELOPMENT STARTUP${NC}"
echo -e "${BLUE}=================================================${NC}"
echo

# Phase 1: Environment Validation
log "🔍 Phase 1: Environment Validation"

# Check Node.js version
NODE_VERSION=$(node --version)
log "Node.js version: $NODE_VERSION"

# Check if ports are available
check_port() {
    local port=$1
    local service=$2

    if lsof -i :$port >/dev/null 2>&1; then
        warning "Port $port already in use (for $service)"
        log "Attempting to free port $port..."

        # Try to kill existing processes on port
        PID=$(lsof -ti :$port)
        if [[ -n $PID ]]; then
            kill $PID 2>/dev/null || true
            sleep 2

            # Check if port is now free
            if lsof -i :$port >/dev/null 2>&1; then
                error "Could not free port $port for $service"
                return 1
            else
                success "Port $port freed for $service"
            fi
        fi
    else
        success "Port $port available for $service"
    fi
}

check_port $API_PORT "API Server"
check_port $FRONTEND_PORT "Frontend"
check_port $DASHBOARD_PORT "Development Dashboard"

# Check working directory
log "Working directory: $PROJECT_ROOT"
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    error "Not in project root directory"
    exit 1
fi

success "Environment validation complete"
echo

# Phase 2: Service Startup
log "🚀 Phase 2: Service Startup"

# Enhanced service startup with retry logic
start_service_with_retry() {
    local service_name=$1
    local start_command=$2
    local test_url=$3
    local max_retries=3
    local pid_var=$4

    for attempt in $(seq 1 $max_retries); do
        log "Starting $service_name (attempt $attempt/$max_retries)..."

        # Start the service
        eval "$start_command" &
        local pid=$!
        eval "$pid_var=$pid"

        # Track PID for cleanup
        CHILD_PIDS+=("$pid")

        # Wait with exponential backoff
        local wait_time=$((attempt * 2))
        sleep $wait_time

        # Test if service is responding
        for i in {1..10}; do
            if curl -s "$test_url" >/dev/null 2>&1; then
                success "$service_name ready (PID: $pid)"
                return 0
            fi
            sleep 1
        done

        # Service failed, kill and retry
        warning "$service_name failed to start, killing PID $pid"
        kill $pid 2>/dev/null || true

        if [[ $attempt -eq $max_retries ]]; then
            error "$service_name failed after $max_retries attempts"
            cleanup
            exit 1
        fi

        warning "Retrying $service_name in 3 seconds..."
        sleep 3
    done
}

# Start BrowserToolsMCP server first (dependency for validation)
if [[ -f "$PROJECT_ROOT/browsertools-mcp-server.js" ]]; then
    log "Starting BrowserToolsMCP server..."
    start_service_with_retry "BrowserToolsMCP" \
        "cd '$PROJECT_ROOT' && node browsertools-mcp-server.js" \
        "http://localhost:3025/identity" \
        "BROWSERTOOLS_PID"

    # Start BrowserToolsMCP monitor
    if [[ -f "$PROJECT_ROOT/scripts/browsertools-monitor.sh" ]]; then
        log "Starting BrowserToolsMCP monitor..."
        "$PROJECT_ROOT/scripts/browsertools-monitor.sh" monitor >/dev/null 2>&1 &
        success "BrowserToolsMCP monitor started"
    fi
else
    warning "BrowserToolsMCP server not found, skipping"
fi

# Start API server with retry logic
start_service_with_retry "API Server" \
    "cd '$PROJECT_ROOT' && node dev-api-server.js" \
    "http://localhost:$API_PORT/api/health" \
    "API_PID"

# Start frontend
log "Starting frontend on port $FRONTEND_PORT..."
cd "$PROJECT_ROOT/apps/web"
npm run dev &
FRONTEND_PID=$!

# Track frontend PID for cleanup
CHILD_PIDS+=("$FRONTEND_PID")

# Wait for frontend to be ready
log "Waiting for frontend..."
for i in {1..15}; do
    if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
        success "Frontend ready on http://localhost:$FRONTEND_PORT"
        break
    fi
    sleep 1
    if [[ $i -eq 15 ]]; then
        error "Frontend failed to start"
        cleanup
        exit 1
    fi
done

echo

# Phase 3: Development Dashboard
log "🎯 Phase 3: Development Environment Ready"

echo
echo -e "${GREEN}🎉 DEVELOPMENT ENVIRONMENT READY!${NC}"
echo
echo -e "${BLUE}📊 Service Status:${NC}"
echo -e "  🔧 API Server:     ${GREEN}http://localhost:$API_PORT${NC}"
echo -e "  🎨 Frontend:       ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  📋 Health Check:   ${GREEN}http://localhost:$FRONTEND_PORT/health.json${NC}"
echo
echo -e "${BLUE}🛠️  Quick Commands:${NC}"
echo -e "  ${YELLOW}Ctrl+C${NC}            Stop all services"
echo -e "  ${YELLOW}npm run validate:localhost${NC}  Test environment"
echo -e "  ${YELLOW}npm run deploy:preview${NC}      Deploy to preview"
echo
echo -e "${BLUE}🔍 Validation:${NC}"

# Comprehensive service validation
log "🔍 Running comprehensive service validation..."

# Test BrowserToolsMCP connectivity (if available)
if [[ -n $BROWSERTOOLS_PID ]]; then
    if curl -s "http://localhost:3025/identity" | grep -q "mcp-browser-connector"; then
        success "BrowserToolsMCP: PASSED"
    else
        warning "BrowserToolsMCP: FAILED - Server not responding correctly"
    fi
fi

# Test API server health
if curl -s "http://localhost:$API_PORT/api/health" | grep -q "success.*true"; then
    success "API Health Check: PASSED"
else
    warning "API Health Check: FAILED"
fi

# Test API data endpoints (deeper validation)
if curl -s "http://localhost:$API_PORT/api/weather-locations?limit=1" | grep -q "success"; then
    success "API Data Endpoints: PASSED"
else
    warning "API Data Endpoints: FAILED - Database connectivity issues"
fi

# Test frontend loading (enhanced validation)
FRONTEND_CHECK_RESULT=""
if curl -s --max-time 5 "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
    # Basic connectivity works, now check content
    FRONTEND_CONTENT=$(curl -s --max-time 5 "http://localhost:$FRONTEND_PORT" || echo "")
    if echo "$FRONTEND_CONTENT" | grep -q -E "(Nearest Nice Weather|react|vite|<!DOCTYPE html>)"; then
        success "Frontend Loading: PASSED"
        FRONTEND_CHECK_RESULT="PASSED"
    else
        warning "Frontend Loading: FAILED - Content check failed"
        FRONTEND_CHECK_RESULT="CONTENT_FAILED"
    fi
else
    error "Frontend Loading: FAILED - Connection refused"
    FRONTEND_CHECK_RESULT="CONNECTION_FAILED"
fi

# Enhanced browser validation (if BrowserToolsMCP available)
if [[ -n $BROWSERTOOLS_PID && "$FRONTEND_CHECK_RESULT" == "PASSED" ]]; then
    log "🌐 Performing browser validation..."
    sleep 2  # Give browser time to load

    # Take screenshot for visual validation
    SCREENSHOT_RESULT=$(curl -s --max-time 10 "http://localhost:3025/mcp/screenshot" \
        -H "Content-Type: application/json" \
        -d '{"url": "http://localhost:'$FRONTEND_PORT'", "filename": "startup-validation.png"}' 2>/dev/null || echo "")

    if echo "$SCREENSHOT_RESULT" | grep -q "success"; then
        success "Browser Visual Validation: PASSED"
        info "Screenshot saved: startup-validation.png"
    else
        warning "Browser Visual Validation: FAILED - Could not capture screenshot"
    fi
fi

# Test API proxy through frontend (critical integration test)
if curl -s "http://localhost:$FRONTEND_PORT/api/weather-locations?limit=1" | grep -q "success"; then
    success "API Proxy Integration: PASSED"
else
    warning "API Proxy Integration: FAILED - Frontend/API connection broken"
fi

# Test database connectivity (if PostgreSQL container available)
if command -v docker >/dev/null 2>&1; then
    if docker ps | grep -q "weather-postgres\|postgres"; then
        if docker exec $(docker ps --format "table {{.Names}}" | grep postgres | head -1) psql -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
            success "Database Connectivity: PASSED"
        else
            warning "Database Connectivity: FAILED - PostgreSQL not responding"
        fi
    else
        info "Database Connectivity: SKIPPED - No PostgreSQL container found"
    fi
else
    info "Database Connectivity: SKIPPED - Docker not available"
fi

echo

# Check if we should run in monitoring mode or just start services
if [[ "$1" == "--no-monitor" ]]; then
    log "🎯 Services started successfully! Use Ctrl+C to stop monitoring mode."
    log "🔄 To monitor services, run: npm start (without --no-monitor)"

    # Just wait for interrupt signal
    while true; do
        sleep 30
    done
else
    log "🔄 Monitoring services (Ctrl+C to stop)..."

    # Service monitoring loop with comprehensive health checking
    while true; do
        sleep 30

    # Check if services are still running and restart if needed
    if ! kill -0 $API_PID 2>/dev/null; then
        warning "API server stopped unexpectedly, restarting..."
        cd "$PROJECT_ROOT"
        node dev-api-server.js &
        API_PID=$!
        sleep 3

        # Validate restart worked
        if curl -s "http://localhost:$API_PORT/api/health" >/dev/null 2>&1; then
            success "API server restarted successfully"
        else
            error "API server restart failed"
        fi
    fi

    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        warning "Frontend stopped unexpectedly, restarting..."
        cd "$PROJECT_ROOT/apps/web"
        npm run dev &
        FRONTEND_PID=$!
        sleep 5

        # Validate restart worked
        if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
            success "Frontend restarted successfully"
        else
            error "Frontend restart failed"
        fi
    fi

    # Check BrowserToolsMCP if it was started
    if [[ -n $BROWSERTOOLS_PID ]] && ! kill -0 $BROWSERTOOLS_PID 2>/dev/null; then
        warning "BrowserToolsMCP stopped unexpectedly, restarting..."
        cd "$PROJECT_ROOT"
        node browsertools-mcp-server.js &
        BROWSERTOOLS_PID=$!
        sleep 2

        # Validate restart worked
        if curl -s "http://localhost:3025/identity" >/dev/null 2>&1; then
            success "BrowserToolsMCP restarted successfully"
        else
            error "BrowserToolsMCP restart failed"
        fi
    fi
    done
fi
