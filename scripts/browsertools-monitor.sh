#!/bin/bash

# BrowserToolsMCP Server Monitor and Auto-Restart
# Ensures BrowserToolsMCP server stays running and accessible

set -e

# Configuration
SERVER_PORT=3025
SERVER_HOST="localhost"
SERVER_SCRIPT="browsertools-mcp-server.js"
MONITOR_INTERVAL=30  # Check every 30 seconds
MAX_RESTART_ATTEMPTS=3
RESTART_DELAY=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1"
}

# Check if server is running
is_server_running() {
    local pid=$(pgrep -f "$SERVER_SCRIPT" || echo "")
    if [[ -n "$pid" ]]; then
        echo "$pid"
        return 0
    else
        return 1
    fi
}

# Check if server is responding
is_server_responding() {
    local response=$(curl -s -m 5 "http://$SERVER_HOST:$SERVER_PORT/health" 2>/dev/null || echo "")
    if echo "$response" | grep -q "healthy"; then
        return 0
    else
        return 1
    fi
}

# Check if server identity is correct
validate_server_identity() {
    local response=$(curl -s -m 5 "http://$SERVER_HOST:$SERVER_PORT/identity" 2>/dev/null || echo "")
    if echo "$response" | grep -q "mcp-browser-connector-24x7"; then
        return 0
    else
        return 1
    fi
}

# Start the server
start_server() {
    log "${GREEN}Starting BrowserToolsMCP server...${NC}"
    
    # Kill any existing server
    pkill -f "$SERVER_SCRIPT" 2>/dev/null || true
    sleep 2
    
    # Start new server
    cd "$(dirname "$0")/.."
    node "$SERVER_SCRIPT" > /tmp/browsertools-server.log 2>&1 &
    local pid=$!
    
    # Wait for server to start
    sleep 3
    
    # Verify server started
    if is_server_running > /dev/null && is_server_responding; then
        log "${GREEN}✅ BrowserToolsMCP server started successfully (PID: $pid)${NC}"
        return 0
    else
        log "${RED}❌ Failed to start BrowserToolsMCP server${NC}"
        return 1
    fi
}

# Stop the server
stop_server() {
    log "${YELLOW}Stopping BrowserToolsMCP server...${NC}"
    pkill -f "$SERVER_SCRIPT" 2>/dev/null || true
    sleep 2
    log "${GREEN}✅ BrowserToolsMCP server stopped${NC}"
}

# Restart the server
restart_server() {
    log "${YELLOW}Restarting BrowserToolsMCP server...${NC}"
    stop_server
    sleep $RESTART_DELAY
    start_server
}

# Monitor server health
monitor_server() {
    local restart_count=0
    
    log "${GREEN}🔍 Starting BrowserToolsMCP server monitoring...${NC}"
    log "Monitor interval: ${MONITOR_INTERVAL}s"
    log "Max restart attempts: ${MAX_RESTART_ATTEMPTS}"
    
    while true; do
        if is_server_running > /dev/null; then
            local pid=$(is_server_running)
            
            if is_server_responding && validate_server_identity; then
                log "${GREEN}✅ Server healthy (PID: $pid)${NC}"
                restart_count=0
            else
                log "${RED}❌ Server not responding or invalid identity${NC}"
                
                if [[ $restart_count -lt $MAX_RESTART_ATTEMPTS ]]; then
                    ((restart_count++))
                    log "${YELLOW}🔄 Restarting server (attempt $restart_count/$MAX_RESTART_ATTEMPTS)${NC}"
                    restart_server
                else
                    log "${RED}💥 Max restart attempts reached. Manual intervention required.${NC}"
                    break
                fi
            fi
        else
            log "${RED}❌ Server not running${NC}"
            
            if [[ $restart_count -lt $MAX_RESTART_ATTEMPTS ]]; then
                ((restart_count++))
                log "${YELLOW}🔄 Starting server (attempt $restart_count/$MAX_RESTART_ATTEMPTS)${NC}"
                start_server
            else
                log "${RED}💥 Max restart attempts reached. Manual intervention required.${NC}"
                break
            fi
        fi
        
        sleep $MONITOR_INTERVAL
    done
}

# Show server status
show_status() {
    echo "=== BrowserToolsMCP Server Status ==="
    
    if is_server_running > /dev/null; then
        local pid=$(is_server_running)
        echo "Process: Running (PID: $pid)"
        
        if is_server_responding; then
            echo "Health: Responding"
            
            if validate_server_identity; then
                echo "Identity: Valid"
                echo "Status: ✅ Healthy"
            else
                echo "Identity: Invalid"
                echo "Status: ❌ Identity problem"
            fi
        else
            echo "Health: Not responding"
            echo "Status: ❌ Not responding"
        fi
    else
        echo "Process: Not running"
        echo "Status: ❌ Stopped"
    fi
    
    echo ""
    echo "Server URL: http://$SERVER_HOST:$SERVER_PORT"
    echo "Identity: http://$SERVER_HOST:$SERVER_PORT/identity"
    echo "Health: http://$SERVER_HOST:$SERVER_PORT/health"
}

# Chrome extension diagnostics
diagnose_chrome_extension() {
    echo "=== Chrome Extension Diagnostics ==="
    
    # Check if Chrome extension directory exists
    if [[ -d "chrome-extension" ]]; then
        echo "✅ Chrome extension directory exists"
        
        # Check manifest
        if [[ -f "chrome-extension/manifest.json" ]]; then
            echo "✅ Chrome extension manifest exists"
            
            # Check if extension is expecting correct server
            if grep -q "localhost:3025" chrome-extension/background.js; then
                echo "✅ Extension configured for localhost:3025"
            else
                echo "❌ Extension may not be configured for localhost:3025"
            fi
        else
            echo "❌ Chrome extension manifest missing"
        fi
    else
        echo "❌ Chrome extension directory missing"
    fi
    
    echo ""
    echo "Chrome Extension Testing:"
    echo "1. Open Chrome Developer Tools"
    echo "2. Go to Extensions tab"
    echo "3. Check BrowserToolsMCP extension is enabled"
    echo "4. Check console for connection errors"
    echo "5. Test server connection manually:"
    echo "   curl http://localhost:3025/identity"
}

# Main command handling
case "${1:-status}" in
    "start")
        start_server
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        restart_server
        ;;
    "monitor")
        monitor_server
        ;;
    "status")
        show_status
        ;;
    "diagnose")
        show_status
        echo ""
        diagnose_chrome_extension
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|monitor|status|diagnose}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the BrowserToolsMCP server"
        echo "  stop     - Stop the BrowserToolsMCP server"
        echo "  restart  - Restart the BrowserToolsMCP server"
        echo "  monitor  - Start monitoring with auto-restart"
        echo "  status   - Show current server status"
        echo "  diagnose - Full diagnostic information"
        exit 1
        ;;
esac