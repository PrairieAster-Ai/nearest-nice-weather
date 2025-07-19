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

# Cleanup function for graceful exit
cleanup() {
    log "🛑 Shutting down development environment..."
    
    # Kill background processes
    if [[ -n $API_PID ]]; then
        kill $API_PID 2>/dev/null || true
        success "API server stopped"
    fi
    
    if [[ -n $FRONTEND_PID ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
        success "Frontend server stopped"
    fi
    
    # Stop any other development processes
    pkill -f "dev-api-server.js" 2>/dev/null || true
    pkill -f "vite.*3001" 2>/dev/null || true
    
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

# Start API server
log "Starting API server on port $API_PORT..."
cd "$PROJECT_ROOT"
node dev-api-server.js &
API_PID=$!

# Wait for API to be ready
log "Waiting for API server..."
for i in {1..10}; do
    if curl -s "http://localhost:$API_PORT/api/health" >/dev/null 2>&1; then
        success "API server ready on http://localhost:$API_PORT"
        break
    fi
    sleep 1
    if [[ $i -eq 10 ]]; then
        error "API server failed to start"
        cleanup
        exit 1
    fi
done

# Start frontend
log "Starting frontend on port $FRONTEND_PORT..."
cd "$PROJECT_ROOT/apps/web"
npm run dev &
FRONTEND_PID=$!

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

# Quick health check
if curl -s "http://localhost:$API_PORT/api/health" | grep -q "success.*true"; then
    success "API Health Check: PASSED"
else
    warning "API Health Check: FAILED"
fi

if curl -s "http://localhost:$FRONTEND_PORT" | grep -q "Nearest Nice Weather"; then
    success "Frontend Health Check: PASSED"
else
    warning "Frontend Health Check: FAILED"
fi

echo
log "🔄 Monitoring services (Ctrl+C to stop)..."

# Service monitoring loop
while true; do
    sleep 30
    
    # Check if services are still running
    if ! kill -0 $API_PID 2>/dev/null; then
        warning "API server stopped unexpectedly, restarting..."
        cd "$PROJECT_ROOT"
        node dev-api-server.js &
        API_PID=$!
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        warning "Frontend stopped unexpectedly, restarting..."
        cd "$PROJECT_ROOT/apps/web"
        npm run dev &
        FRONTEND_PID=$!
    fi
done