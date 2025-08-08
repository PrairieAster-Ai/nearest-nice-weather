#!/bin/bash

# Service Monitor for Development Environment
# Monitors running services and auto-restarts if needed

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$PROJECT_ROOT/.pids"
LOG_DIR="$PROJECT_ROOT/logs"
MONITOR_LOG="$LOG_DIR/monitor.log"

# Logging function
monitor_log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$MONITOR_LOG"
}

# Get service PID
get_service_pid() {
    local service=$1
    local pid_file="$PID_DIR/$service.pid"
    if [ -f "$pid_file" ]; then
        cat "$pid_file"
    fi
}

# Check if service is running
is_service_running() {
    local service=$1
    local pid=$(get_service_pid "$service")
    if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
        return 0
    fi
    return 1
}

# Restart service
restart_service() {
    local service=$1
    
    monitor_log "Restarting $service..."
    
    case $service in
        "api")
            cd "$PROJECT_ROOT"
            node dev-api-server.js > "$LOG_DIR/api.log" 2>&1 &
            echo $! > "$PID_DIR/api.pid"
            ;;
        "frontend")
            cd "$PROJECT_ROOT/apps/web"
            npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
            echo $! > "$PID_DIR/frontend.pid"
            ;;
    esac
    
    sleep 3
    
    if is_service_running "$service"; then
        monitor_log "✅ $service restarted successfully"
    else
        monitor_log "❌ Failed to restart $service"
    fi
}

# Main monitoring loop
monitor_log "🔍 Service monitoring started"

while true; do
    # Check API service
    if ! is_service_running "api"; then
        if curl -s "http://localhost:4000/api/health" >/dev/null 2>&1; then
            monitor_log "⚠️ API PID mismatch but service responding"
        else
            monitor_log "❌ API service down"
            restart_service "api"
        fi
    fi
    
    # Check Frontend service
    if ! is_service_running "frontend"; then
        if curl -s "http://localhost:3001" >/dev/null 2>&1; then
            monitor_log "⚠️ Frontend PID mismatch but service responding"
        else
            monitor_log "❌ Frontend service down"
            restart_service "frontend"
        fi
    fi
    
    # Wait before next check
    sleep 30
done