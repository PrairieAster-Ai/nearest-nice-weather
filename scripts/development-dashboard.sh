#!/bin/bash
# Development Environment Dashboard
# Real-time status of all development components

clear
echo "🚀 Nearest Nice Weather - Development Dashboard"
echo "=============================================="
echo "Updated: $(date)"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

status_icon() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}●${NC}"
    else
        echo -e "${RED}●${NC}"
    fi
}

warning_icon() {
    echo -e "${YELLOW}●${NC}"
}

# System Information
echo "📊 System Status"
echo "----------------"

# Node.js
NODE_VERSION=$(node --version 2>/dev/null || echo "N/A")
if [ "$NODE_VERSION" = "v20.18.0" ]; then
    echo -e "$(status_icon 0) Node.js: $NODE_VERSION (LTS)"
else
    echo -e "$(status_icon 1) Node.js: $NODE_VERSION (Expected: v20.18.0)"
fi

# Docker
if systemctl is-active --quiet docker; then
    echo -e "$(status_icon 0) Docker: Running"
else
    echo -e "$(status_icon 1) Docker: Stopped"
fi

# Memory Usage
if command -v free >/dev/null 2>&1; then
    MEM_USAGE=$(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
    echo -e "$(status_icon 0) Memory: $MEM_USAGE used"
fi

# Disk Space
DISK_USAGE=$(df -h . | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "$(status_icon 0) Disk: ${DISK_USAGE}% used"
else
    echo -e "$(warning_icon) Disk: ${DISK_USAGE}% used (High)"
fi

echo ""

# Network Status
echo "🌐 Network Status"
echo "----------------"

# Port availability
PORTS=(3001 3002 3999)
for port in "${PORTS[@]}"; do
    if nc -z localhost $port 2>/dev/null; then
        echo -e "$(warning_icon) Port $port: In use"
    else
        echo -e "$(status_icon 0) Port $port: Available"
    fi
done

# Localhost binding test
if timeout 3 node -e "const http = require('http'); const server = http.createServer().listen(3998, '127.0.0.1', () => server.close());" 2>/dev/null; then
    echo -e "$(status_icon 0) Localhost binding: OK"
else
    echo -e "$(status_icon 1) Localhost binding: Failed"
fi

echo ""

# Project Status
echo "📁 Project Status"
echo "----------------"

# Dependencies
if [ -d "node_modules" ]; then
    echo -e "$(status_icon 0) Root dependencies: Installed"
else
    echo -e "$(status_icon 1) Root dependencies: Missing"
fi

if [ -d "apps/web/node_modules" ]; then
    echo -e "$(status_icon 0) Web dependencies: Installed"
else
    echo -e "$(status_icon 1) Web dependencies: Missing"
fi

# Environment file
if [ -f "apps/web/.env" ]; then
    echo -e "$(status_icon 0) Environment: Configured"
else
    echo -e "$(status_icon 1) Environment: Missing .env file"
fi

# Git status
if git status >/dev/null 2>&1; then
    BRANCH=$(git branch --show-current)
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED" -eq 0 ]; then
        echo -e "$(status_icon 0) Git: Clean ($BRANCH)"
    else
        echo -e "$(warning_icon) Git: $UNCOMMITTED uncommitted changes ($BRANCH)"
    fi
else
    echo -e "$(status_icon 1) Git: Not a repository"
fi

echo ""

# Services Status
echo "🔧 Services Status"
echo "-----------------"

# Check if development server is running
if curl -f http://localhost:3001/ >/dev/null 2>&1; then
    echo -e "$(status_icon 0) Dev server: Running (http://localhost:3001)"
    
    # Check health endpoint
    if curl -f http://localhost:3001/health.json >/dev/null 2>&1; then
        echo -e "$(status_icon 0) Health endpoint: OK"
    else
        echo -e "$(warning_icon) Health endpoint: Not responding"
    fi
else
    echo -e "$(status_icon 1) Dev server: Not running"
fi

# Quick build test (only if no server running)
if ! curl -f http://localhost:3001/ >/dev/null 2>&1; then
    echo -n "🔨 Build test: "
    cd apps/web 2>/dev/null
    if timeout 15 npm run build >/dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}Failed${NC}"
    fi
    cd ../.. 2>/dev/null
fi

echo ""

# Recent Activity
echo "📈 Recent Activity"
echo "-----------------"

# Git commits
if git log >/dev/null 2>&1; then
    echo "Last 3 commits:"
    git log --oneline -3 | sed 's/^/  /'
fi

echo ""

# Quick Actions
echo "⚡ Quick Actions"
echo "---------------"
echo "  npm run dev          - Start development server"
echo "  ./scripts/localhost-health-check.sh - Full health check"
echo "  ./apply-docker-fix.sh - Fix Docker networking"
echo "  npm run build        - Test build process"
echo "  npm run deploy:preview - Deploy to preview"

echo ""

# Auto-refresh option
if [ "$1" = "--watch" ]; then
    echo "Press Ctrl+C to stop watching..."
    sleep 5
    exec $0 --watch
fi