#!/bin/bash

# ========================================================================
# NEAREST NICE WEATHER - OPTIMIZED UNIFIED DEVELOPMENT STARTUP
# ========================================================================
#
# 📋 PURPOSE: Single source of truth for development environment startup
# 🎯 GOALS: Reliability, visibility, maintainability, speed
# 🔧 FEATURES: Auto-recovery, visual feedback, flexible options, monitoring
#
# USAGE: ./dev-startup-optimized.sh [options]
# OPTIONS:
#   --quick         Fast startup, skip all optional features
#   --no-monitor    Start services but disable continuous monitoring
#   --clean         Clean start (remove caches, logs, temp files)
#   --verbose       Show detailed output and keep logs visible
#   --skip-tests    Skip smoke tests and validation
#   --pm2           Use PM2 for process management (requires global PM2)
#   --help          Show this help message
#
# ========================================================================

set -e  # Exit on error

# ========================================================================
# CONFIGURATION
# ========================================================================

SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
LOG_DIR="$PROJECT_ROOT/logs"
PID_DIR="$PROJECT_ROOT/.pids"
TEMP_DIR="$PROJECT_ROOT/.tmp"

# ========================================================================
# SERVICE PORTS - STANDARD DEVELOPMENT CONFIGURATION
# ========================================================================
#
# 🚨 ZOMBIE PROCESS WARNING:
# If you see the frontend running on ports 3002, 3003, 3004, etc., this is a
# KEY INDICATOR that zombie Vite processes are blocking port 3001.
#
# SOLUTION: Kill zombie processes and restart clean
#   lsof -ti:3001 | xargs kill -9
#   ./kill-zombies-and-restart.sh
#
# Port 3001 is the STANDARD for Vite development servers.
# Any deviation indicates process management issues that need cleanup.
# ========================================================================

API_PORT=${API_PORT:-4000}
FRONTEND_PORT=${DEV_PORT:-3001}    # Standard Vite dev port - deviations indicate zombies
PLAYWRIGHT_PORT=${PLAYWRIGHT_PORT:-3026}
DASHBOARD_PORT=${DASHBOARD_PORT:-3099}

# Timing configuration
STARTUP_TIMEOUT=30
SERVICE_CHECK_INTERVAL=30
RETRY_ATTEMPTS=3

# ========================================================================
# COLOR CODES & UNICODE SYMBOLS
# ========================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK_MARK="✅"
CROSS_MARK="❌"
WARNING_SIGN="⚠️"
INFO_SIGN="ℹ️"
ROCKET="🚀"
WRENCH="🔧"
SPARKLES="✨"
FIRE="🔥"
CLOCK="⏱️"
PACKAGE="📦"

# ========================================================================
# PARSE COMMAND LINE ARGUMENTS
# ========================================================================

QUICK_MODE=false
NO_MONITOR=false
CLEAN_START=false
VERBOSE=false
SKIP_TESTS=false
USE_PM2=false
SHOW_HELP=false

for arg in "$@"; do
    case $arg in
        --quick) QUICK_MODE=true ;;
        --no-monitor) NO_MONITOR=true ;;
        --clean) CLEAN_START=true ;;
        --verbose) VERBOSE=true ;;
        --skip-tests) SKIP_TESTS=true ;;
        --pm2) USE_PM2=true ;;
        --help) SHOW_HELP=true ;;
        *) echo "Unknown option: $arg. Use --help for usage." ;;
    esac
done

# ========================================================================
# HELP MESSAGE
# ========================================================================

if [ "$SHOW_HELP" = true ]; then
    echo -e "${BOLD}${BLUE}NEAREST NICE WEATHER - Development Startup${NC}"
    echo -e "${BOLD}Usage:${NC} $SCRIPT_NAME [options]"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  --quick         Fast startup, skip optional features"
    echo "  --no-monitor    Start services but disable monitoring"
    echo "  --clean         Clean start (remove caches and logs)"
    echo "  --verbose       Show detailed output"
    echo "  --skip-tests    Skip smoke tests"
    echo "  --pm2           Use PM2 process manager"
    echo "  --help          Show this help message"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  $SCRIPT_NAME                    # Standard startup"
    echo "  $SCRIPT_NAME --quick            # Fast startup for development"
    echo "  $SCRIPT_NAME --clean --verbose  # Clean restart with details"
    echo ""
    exit 0
fi

# ========================================================================
# LOGGING FUNCTIONS
# ========================================================================

# Create log directory
mkdir -p "$LOG_DIR" "$PID_DIR" "$TEMP_DIR"

# Log file for this session
SESSION_LOG="$LOG_DIR/startup-$(date +%Y%m%d-%H%M%S).log"

# Logging functions
log() {
    local message="$1"
    local timestamp=$(date '+%H:%M:%S')
    echo -e "${BLUE}[${timestamp}]${NC} $message" | tee -a "$SESSION_LOG"
}

success() {
    local message="$1"
    echo -e "${GREEN}${CHECK_MARK} $message${NC}" | tee -a "$SESSION_LOG"
}

warning() {
    local message="$1"
    echo -e "${YELLOW}${WARNING_SIGN}  $message${NC}" | tee -a "$SESSION_LOG"
}

error() {
    local message="$1"
    echo -e "${RED}${CROSS_MARK} $message${NC}" | tee -a "$SESSION_LOG"
}

info() {
    local message="$1"
    echo -e "${PURPLE}${INFO_SIGN}  $message${NC}" | tee -a "$SESSION_LOG"
}

debug() {
    if [ "$VERBOSE" = true ]; then
        local message="$1"
        echo -e "${GRAY}    → $message${NC}" | tee -a "$SESSION_LOG"
    fi
}

# ========================================================================
# UTILITY FUNCTIONS
# ========================================================================

# Check for zombie processes blocking standard ports
detect_zombie_processes() {
    local zombies_found=false

    # Check if anything is running on port 3001 (standard Vite port)
    if lsof -ti:3001 >/dev/null 2>&1; then
        warning "🧟‍♂️ ZOMBIE PROCESS DETECTED: Something is blocking port 3001"
        warning "   This will cause Vite to use port 3002+ which indicates zombie processes"
        warning "   Run: ./kill-zombies-and-restart.sh to fix this issue"
        zombies_found=true
    fi

    # Check for multiple Vite processes (another zombie indicator)
    local vite_count=$(ps aux | grep -c "[n]ode.*vite" || echo "0")
    if [ "$vite_count" -gt 1 ]; then
        warning "🧟‍♂️ MULTIPLE VITE PROCESSES: Found $vite_count Vite processes running"
        warning "   This indicates zombie processes from previous sessions"
        warning "   Run: pkill -f 'node.*vite' to clean up"
        zombies_found=true
    fi

    if [ "$zombies_found" = true ]; then
        warning ""
        warning "⚡ RECOMMENDED ACTION: Run './kill-zombies-and-restart.sh' for clean startup"
        warning ""
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if port is in use
port_in_use() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

# Get process using port
get_port_pid() {
    local port=$1
    lsof -ti :$port 2>/dev/null | head -1
}

# Free a port with enhanced zombie process detection
free_port() {
    local port=$1
    local service=$2

    if port_in_use $port; then
        local pid=$(get_port_pid $port)
        if [ -n "$pid" ]; then
            # Get process info for contextual debugging
            local process_info=$(ps -p $pid -o pid,ppid,etime,cpu,command --no-headers 2>/dev/null || echo "Process info unavailable")
            local process_name=$(ps -p $pid -o comm --no-headers 2>/dev/null || echo "unknown")

            warning "Port $port in use by PID $pid, freeing for $service..."

            # Check for common zombie process patterns
            if [[ "$process_info" == *"chrome"* ]] || [[ "$process_info" == *"chromium"* ]]; then
                warning "🧟 ZOMBIE CHROME DETECTED: $process_name (PID: $pid)"
                warning "📊 Process details: $process_info"
                if [[ "$process_info" == *"presentation"* ]] || [[ "$process_info" == *"screenshot"* ]]; then
                    warning "🖼️  Likely stale screenshot/presentation process from previous session"
                fi

                # Kill all related Chrome processes for this session
                local chrome_pids=$(pgrep -f "chrome.*$port" 2>/dev/null || true)
                if [ -n "$chrome_pids" ]; then
                    warning "🔧 Killing related Chrome processes: $chrome_pids"
                    echo "$chrome_pids" | xargs -r kill -KILL 2>/dev/null || true
                fi
            elif [[ "$process_info" == *"node"* ]] || [[ "$process_info" == *"npm"* ]] || [[ "$process_info" == *"vite"* ]]; then
                warning "🟢 NODE/VITE PROCESS: $process_name (PID: $pid)"
                warning "📊 Process details: $process_info"
                if [[ "$process_info" == *"days"* ]] || [[ "$process_info" == *"hours"* ]]; then
                    warning "⏰ Long-running process detected - likely from previous session"
                fi
            else
                warning "❓ UNKNOWN PROCESS: $process_name (PID: $pid)"
                warning "📊 Process details: $process_info"
            fi

            # Attempt graceful termination first
            kill -TERM $pid 2>/dev/null || true
            sleep 2

            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                warning "🔨 Process $pid didn't respond to TERM, using KILL signal"
                kill -KILL $pid 2>/dev/null || true
                sleep 1
            fi

            # Verify port is free
            if port_in_use $port; then
                error "❌ Failed to free port $port - may require manual intervention"
                error "💡 Manual fix: sudo fuser -k $port/tcp or sudo lsof -ti:$port | xargs kill -9"
                return 1
            else
                success "✅ Port $port freed successfully"
                return 0
            fi
        fi
    fi
    return 0
}

# Save PID to file
save_pid() {
    local service=$1
    local pid=$2
    echo $pid > "$PID_DIR/$service.pid"
}

# Get saved PID
get_saved_pid() {
    local service=$1
    local pid_file="$PID_DIR/$service.pid"
    if [ -f "$pid_file" ]; then
        cat "$pid_file"
    fi
}

# Check if service is running
is_service_running() {
    local service=$1
    local pid=$(get_saved_pid "$service")
    if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
        return 0
    fi
    return 1
}

# ========================================================================
# CLEANUP & SIGNAL HANDLING
# ========================================================================

# Track all child PIDs
declare -a CHILD_PIDS=()

# Cleanup function
cleanup() {
    log "${FIRE} Shutting down development environment..."

    # Stop monitoring
    if [ -f "$PID_DIR/monitor.pid" ]; then
        local monitor_pid=$(cat "$PID_DIR/monitor.pid")
        kill -TERM $monitor_pid 2>/dev/null || true
    fi

    # Stop services gracefully
    local services=("frontend" "api" "playwright" "dashboard")
    for service in "${services[@]}"; do
        if is_service_running "$service"; then
            local pid=$(get_saved_pid "$service")
            debug "Stopping $service (PID: $pid)"
            kill -TERM $pid 2>/dev/null || true
        fi
    done

    # Wait for graceful shutdown
    sleep 2

    # Force kill remaining processes
    for pid in "${CHILD_PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            kill -KILL $pid 2>/dev/null || true
        fi
    done

    # Clean pattern-based processes
    pkill -f "node.*vite.*$FRONTEND_PORT" 2>/dev/null || true
    pkill -f "dev-api-server.js" 2>/dev/null || true
    pkill -f "playwright" 2>/dev/null || true

    success "Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

# ========================================================================
# ENVIRONMENT VALIDATION
# ========================================================================

validate_environment() {
    log "${WRENCH} Validating development environment..."

    # Check Node.js
    if ! command_exists node; then
        error "Node.js is not installed"
        exit 1
    fi

    local node_version=$(node -v)
    success "Node.js version: $node_version"

    # Check npm
    if ! command_exists npm; then
        error "npm is not installed"
        exit 1
    fi

    # Check project structure
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "Not in project root directory"
        exit 1
    fi

    # Check .env file
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            warning ".env file missing, copying from .env.example"
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        else
            warning ".env file missing - some features may not work"
        fi
    fi

    # Check PM2 if requested
    if [ "$USE_PM2" = true ]; then
        if ! command_exists pm2; then
            error "PM2 not installed. Install with: npm install -g pm2"
            exit 1
        fi
    fi

    # Validate node_modules
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        warning "node_modules missing, running npm install..."
        npm install
    fi

    success "Environment validation complete"
}

# ========================================================================
# CLEAN START
# ========================================================================

perform_clean_start() {
    log "${SPARKLES} Performing clean start..."

    # Stop any running services
    cleanup 2>/dev/null || true

    # Clear logs
    rm -rf "$LOG_DIR"/*
    success "Logs cleared"

    # Clear PIDs
    rm -rf "$PID_DIR"/*
    success "PID files cleared"

    # Clear temp files
    rm -rf "$TEMP_DIR"/*
    success "Temp files cleared"

    # Clear node cache
    rm -rf "$PROJECT_ROOT/node_modules/.cache"
    rm -rf "$PROJECT_ROOT/apps/web/.parcel-cache"
    rm -rf "$PROJECT_ROOT/apps/web/dist"
    success "Build caches cleared"

    # Recreate directories
    mkdir -p "$LOG_DIR" "$PID_DIR" "$TEMP_DIR"
}

# ========================================================================
# SERVICE STARTUP
# ========================================================================

start_service() {
    local name=$1
    local command=$2
    local port=$3
    local health_url=$4
    local log_file="$LOG_DIR/${name}.log"

    log "Starting $name..."

    # Check if already running
    if is_service_running "$name"; then
        local pid=$(get_saved_pid "$name")
        success "$name already running (PID: $pid)"
        return 0
    fi

    # Free port if needed
    if [ -n "$port" ]; then
        free_port $port "$name" || return 1
    fi

    # Start service
    if [ "$VERBOSE" = true ]; then
        eval "$command" 2>&1 | tee "$log_file" &
    else
        eval "$command" > "$log_file" 2>&1 &
    fi

    local pid=$!
    CHILD_PIDS+=($pid)
    save_pid "$name" $pid

    # Wait for service to be ready
    if [ -n "$health_url" ] && [ "$QUICK_MODE" = false ]; then
        local attempts=0
        while [ $attempts -lt 30 ]; do
            if curl -s "$health_url" >/dev/null 2>&1; then
                success "$name started (PID: $pid)"
                return 0
            fi
            sleep 1
            ((attempts++))
        done
        error "$name failed to respond at $health_url"
        return 1
    else
        # Quick mode - just check process is running
        sleep 2
        if kill -0 $pid 2>/dev/null; then
            success "$name started (PID: $pid)"
            return 0
        else
            error "$name failed to start"
            return 1
        fi
    fi
}

# ========================================================================
# MAIN STARTUP SEQUENCE
# ========================================================================

main() {
    # Header
    echo
    echo -e "${PURPLE}${ROCKET} NEAREST NICE WEATHER - OPTIMIZED DEVELOPMENT STARTUP${NC}"
    echo -e "${BLUE}========================================================${NC}"
    echo

    # 🧟‍♂️ Check for zombie processes early (prevents port conflicts)
    detect_zombie_processes

    # Show configuration
    if [ "$VERBOSE" = true ]; then
        echo -e "${BOLD}Configuration:${NC}"
        echo "  Quick Mode: $QUICK_MODE"
        echo "  Monitoring: $([ "$NO_MONITOR" = true ] && echo "Disabled" || echo "Enabled")"
        echo "  Clean Start: $CLEAN_START"
        echo "  Skip Tests: $SKIP_TESTS"
        echo "  Process Manager: $([ "$USE_PM2" = true ] && echo "PM2" || echo "Native")"
        echo
    fi

    # Clean start if requested
    if [ "$CLEAN_START" = true ]; then
        perform_clean_start
    fi

    # Validate environment
    validate_environment

    # Start core services
    echo
    log "${ROCKET} Starting core services..."

    # API Server
    if ! start_service "api" \
        "cd '$PROJECT_ROOT' && node dev-api-server.js" \
        "$API_PORT" \
        "http://localhost:$API_PORT/api/health"; then
        error "Failed to start API server"
        exit 1
    fi

    # Frontend Server
    if ! start_service "frontend" \
        "cd '$PROJECT_ROOT/apps/web' && npm run dev" \
        "$FRONTEND_PORT" \
        "http://localhost:$FRONTEND_PORT"; then
        error "Failed to start frontend server"
        exit 1
    fi

    # Optional services (unless quick mode)
    if [ "$QUICK_MODE" = false ]; then
        # PlaywrightMCP (optional)
        if command_exists npx && npx playwright --version >/dev/null 2>&1; then
            start_service "playwright" \
                "npx @modelcontextprotocol/server-playwright" \
                "$PLAYWRIGHT_PORT" \
                "" || warning "PlaywrightMCP not available"
        fi
    fi

    # Health checks
    if [ "$QUICK_MODE" = false ] && [ "$SKIP_TESTS" = false ]; then
        echo
        log "${PACKAGE} Running health checks..."

        # API Health
        if curl -s "http://localhost:$API_PORT/api/health" | grep -q "success"; then
            success "API health check passed"
        else
            warning "API health check failed"
        fi

        # Frontend Health
        if curl -s "http://localhost:$FRONTEND_PORT" | grep -q "html"; then
            success "Frontend health check passed"
        else
            warning "Frontend health check failed"
        fi

        # API Proxy
        if curl -s "http://localhost:$FRONTEND_PORT/api/health" >/dev/null 2>&1; then
            success "API proxy working"
        else
            warning "API proxy not working"
        fi
    fi

    # Start monitoring (unless disabled)
    if [ "$NO_MONITOR" = false ]; then
        log "${CLOCK} Starting service monitor..."
        "$SCRIPT_DIR/scripts/service-monitor.sh" &
        save_pid "monitor" $!
        success "Service monitoring enabled"
    fi

    # Final summary
    echo
    echo -e "${GREEN}${CHECK_MARK} DEVELOPMENT ENVIRONMENT READY!${NC}"
    echo
    echo -e "${BOLD}${BLUE}📊 Service URLs:${NC}"
    echo -e "  ${WRENCH} API Server:  ${GREEN}http://localhost:$API_PORT${NC}"
    echo -e "  ${SPARKLES} Frontend:    ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    if is_service_running "playwright"; then
        echo -e "  🧪 Playwright:  ${GREEN}Port $PLAYWRIGHT_PORT${NC}"
    fi
    echo
    echo -e "${BOLD}${BLUE}🛠️  Commands:${NC}"
    echo -e "  ${YELLOW}Ctrl+C${NC}              Stop all services"
    echo -e "  ${YELLOW}npm start --quick${NC}   Fast restart"
    echo -e "  ${YELLOW}npm start --clean${NC}   Clean restart"
    echo -e "  ${YELLOW}tail -f logs/*.log${NC}  View logs"
    echo

    # Keep running unless no-monitor
    if [ "$NO_MONITOR" = false ]; then
        log "Monitoring services... Press Ctrl+C to stop"
        wait
    else
        log "Services started. Run 'npm start' to enable monitoring."
    fi
}

# ========================================================================
# RUN MAIN FUNCTION
# ========================================================================

main "$@"
