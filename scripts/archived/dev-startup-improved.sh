#!/bin/bash

# ========================================================================
# NEAREST NICE WEATHER - IMPROVED DEVELOPMENT STARTUP SCRIPT
# ========================================================================
#
# 📋 PURPOSE: Reliable startup for development environment with health monitoring
# 🔧 FEATURES: Service management, health checks, auto-recovery, debugging tools
# 🎯 IMPROVEMENTS: PlaywrightMCP integration, better error handling, visual feedback
#
# USAGE: ./dev-startup-improved.sh [options]
# OPTIONS:
#   --skip-tests     Skip PlaywrightMCP test suite
#   --no-monitor     Disable continuous monitoring
#   --verbose        Show detailed output
#   --clean          Clean start (remove all caches)
#
# ========================================================================

# Color codes for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
LOG_DIR="$PROJECT_ROOT/logs"
PID_DIR="$PROJECT_ROOT/.pids"

# Parse command line arguments
SKIP_TESTS=false
NO_MONITOR=false
VERBOSE=false
CLEAN_START=false

for arg in "$@"; do
    case $arg in
        --skip-tests) SKIP_TESTS=true ;;
        --no-monitor) NO_MONITOR=true ;;
        --verbose) VERBOSE=true ;;
        --clean) CLEAN_START=true ;;
    esac
done

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
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

# Create necessary directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to free a port
free_port() {
    local port=$1
    local service=$2

    if check_port $port; then
        warning "Port $port in use, attempting to free it for $service..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1

        if check_port $port; then
            error "Could not free port $port"
            return 1
        else
            success "Port $port freed"
            return 0
        fi
    fi
    return 0
}

# Function to start service with enhanced monitoring
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local log_file="$LOG_DIR/${name// /_}.log"
    local pid_file="$PID_DIR/${name// /_}.pid"
    local max_retries=3
    local retry=0

    # Check if already running
    if [ -f "$pid_file" ] && kill -0 $(cat "$pid_file") 2>/dev/null; then
        local pid=$(cat "$pid_file")
        success "$name already running (PID: $pid)"
        return 0
    fi

    # Free port if needed
    if [ -n "$port" ]; then
        free_port $port "$name" || return 1
    fi

    while [ $retry -lt $max_retries ]; do
        log "Starting $name (attempt $((retry + 1))/$max_retries)..."

        # Start service with logging
        if [ "$VERBOSE" = true ]; then
            eval "$command" 2>&1 | tee "$log_file" &
        else
            eval "$command" > "$log_file" 2>&1 &
        fi

        local pid=$!
        echo $pid > "$pid_file"

        # Wait for service to start
        local wait_time=0
        local max_wait=10

        while [ $wait_time -lt $max_wait ]; do
            if [ -n "$port" ] && check_port $port; then
                success "$name started successfully (PID: $pid)"
                return 0
            elif kill -0 $pid 2>/dev/null; then
                sleep 1
                wait_time=$((wait_time + 1))
            else
                break
            fi
        done

        error "$name failed to start (see $log_file)"
        retry=$((retry + 1))
    done

    error "Failed to start $name after $max_retries attempts"
    return 1
}

# Function to perform health check
health_check() {
    local name=$1
    local url=$2
    local expected=$3

    if curl -s "$url" 2>/dev/null | grep -q "$expected"; then
        success "$name health check passed"
        return 0
    else
        error "$name health check failed"
        return 1
    fi
}

# Main startup sequence
echo -e "${PURPLE}🚀 NEAREST NICE WEATHER - IMPROVED DEVELOPMENT STARTUP${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Phase 1: Environment preparation
log "🔍 Phase 1: Environment Preparation"

# Clean start if requested
if [ "$CLEAN_START" = true ]; then
    warning "Performing clean start..."
    rm -rf "$LOG_DIR"/* "$PID_DIR"/* node_modules/.cache .parcel-cache
    success "Caches cleared"
fi

# Kill existing processes
log "Cleaning up existing processes..."
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "node.*dev-api-server" 2>/dev/null || true
pkill -f "playwright" 2>/dev/null || true
pkill -f "simple-server" 2>/dev/null || true
pkill -f "claude-intelligence" 2>/dev/null || true
sleep 2

# Check Node.js version
NODE_VERSION=$(node -v)
log "Node.js version: $NODE_VERSION"

# Phase 2: Core services startup
echo ""
log "🚀 Phase 2: Core Services Startup"

# Start API server
if ! start_service "API Server" "node dev-api-server.js" "4000"; then
    error "Critical: API server failed to start"
    exit 1
fi

# Start frontend development server
cd "$PROJECT_ROOT/apps/web" || exit 1
if ! start_service "Frontend Server" "npm run dev" "3001"; then
    error "Critical: Frontend server failed to start"
    exit 1
fi
cd "$PROJECT_ROOT" || exit 1

# Start PlaywrightMCP server
log "Starting PlaywrightMCP server..."
info "PlaywrightMCP enables advanced browser automation and testing"
if ! start_service "PlaywrightMCP Server" "npx @modelcontextprotocol/server-playwright" "3026"; then
    warning "PlaywrightMCP server not available - testing capabilities limited"
fi

# Phase 3: Health checks
echo ""
log "🏥 Phase 3: Health Checks"
sleep 3

# API health check
health_check "API Server" "http://localhost:4000/api/health" "success"

# Frontend health check
health_check "Frontend Server" "http://localhost:3001/" "html"

# API proxy check
health_check "API Proxy" "http://localhost:3001/api/weather-locations?limit=1" "success"

# PlaywrightMCP check
if check_port 3026; then
    success "PlaywrightMCP server is running"
else
    warning "PlaywrightMCP server not detected"
fi

# Database check (if using cloud database)
log "Checking database connectivity..."
if curl -s "http://localhost:4000/api/test-db" | grep -q "success"; then
    success "Database connection verified"
else
    warning "Database connection issues - check .env configuration"
fi

# Phase 4: Optional services
echo ""
log "🔧 Phase 4: Optional Services"

# Environment validation
if [ -f ".env" ]; then
    success ".env file exists"

    # Check critical environment variables
    if grep -q "DATABASE_URL\|POSTGRES_URL" .env; then
        success "Database URL configured"
    else
        warning "Database URL not found in .env"
    fi
else
    error ".env file missing - copy .env.example to .env"
fi

# Phase 5: Run tests if not skipped
if [ "$SKIP_TESTS" = false ] && check_port 3026; then
    echo ""
    log "🧪 Phase 5: Running Playwright Tests"
    info "Running basic smoke tests..."

    # Run a simple smoke test
    cat > "$PROJECT_ROOT/smoke-test.spec.js" << 'EOF'
import { test, expect } from '@playwright/test';

test('smoke test', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page).toHaveTitle(/Nearest Nice Weather/);
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });
  console.log('✅ Application loaded successfully');
});
EOF

    if npx playwright test smoke-test.spec.js --reporter=list 2>/dev/null; then
        success "Smoke tests passed"
    else
        warning "Smoke tests failed - application may have issues"
    fi

    rm -f smoke-test.spec.js
fi

# Phase 6: Continuous monitoring setup
if [ "$NO_MONITOR" = false ]; then
    echo ""
    log "📊 Phase 6: Setting up continuous monitoring"

    # Create monitoring script
    cat > "$PID_DIR/monitor.sh" << 'EOF'
#!/bin/bash
while true; do
    # Check API server
    if ! curl -s "http://localhost:4000/api/health" >/dev/null 2>&1; then
        echo "[$(date +'%H:%M:%S')] API server down, restarting..."
        node dev-api-server.js >> logs/API_Server.log 2>&1 &
    fi

    # Check frontend
    if ! curl -s "http://localhost:3001/" >/dev/null 2>&1; then
        echo "[$(date +'%H:%M:%S')] Frontend down, restarting..."
        cd apps/web && npm run dev >> ../../logs/Frontend_Server.log 2>&1 &
        cd ../..
    fi

    sleep 30
done
EOF

    chmod +x "$PID_DIR/monitor.sh"
    nohup "$PID_DIR/monitor.sh" > "$LOG_DIR/monitor.log" 2>&1 &
    echo $! > "$PID_DIR/monitor.pid"
    success "Monitoring service started"
fi

# Final summary
echo ""
echo -e "${GREEN}🎉 DEVELOPMENT ENVIRONMENT READY!${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo "  🔧 API Server:       ${GREEN}http://localhost:4000${NC}"
echo "  🎨 Frontend:         ${GREEN}http://localhost:3001${NC}"
echo "  🧪 PlaywrightMCP:    ${GREEN}Port 3026${NC} (if available)"
echo ""
echo -e "${BLUE}🛠️  Quick Commands:${NC}"
echo "  ${YELLOW}npm run test:location${NC}    Run location estimation tests"
echo "  ${YELLOW}npm run validate${NC}         Validate all environments"
echo "  ${YELLOW}tail -f logs/*.log${NC}       View all logs"
echo "  ${YELLOW}./dev-startup-improved.sh --clean${NC}  Clean restart"
echo ""
echo -e "${BLUE}🔍 Debugging:${NC}"
echo "  API Health:     ${PURPLE}curl http://localhost:4000/api/health | jq${NC}"
echo "  Frontend Check: ${PURPLE}curl -I http://localhost:3001${NC}"
echo "  View Logs:      ${PURPLE}ls -la logs/${NC}"
echo "  Stop All:       ${PURPLE}pkill -f 'node.*vite|dev-api-server|playwright'${NC}"
echo ""

# Show any warnings
if [ -f "$LOG_DIR/warnings.log" ]; then
    warning "Some warnings were generated during startup:"
    cat "$LOG_DIR/warnings.log"
fi

# Exit with appropriate code
if health_check "Core Services" "http://localhost:3001/api/weather-locations?limit=1" "success" >/dev/null 2>&1; then
    exit 0
else
    error "Some services may not be working correctly"
    exit 1
fi
