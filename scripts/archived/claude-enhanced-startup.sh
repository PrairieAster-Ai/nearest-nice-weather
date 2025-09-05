#!/bin/bash

# Claude AI Enhanced Development Environment
# Business Goal: Minimize productivity degradation through proactive monitoring
# Strategy: Provide Claude AI with rich contextual information for rapid issue resolution

echo "🤖 Claude AI Enhanced Development Environment Starting..."
echo "📊 Business Goal: Minimize productivity degradation"
echo "🎯 Strategy: Proactive monitoring + Rich context for Claude AI"
echo ""

# Create log directory
mkdir -p /tmp/claude-logs

# Function to log with Claude AI context
log_claude_context() {
    local event="$1"
    local message="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    echo "[$timestamp] [$event] $message" | tee -a /tmp/claude-logs/startup.log
}

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    log_claude_context "SETUP" "Installing PM2 for process management..."
    npm install -g pm2
fi

# Stop any existing PM2 processes
log_claude_context "CLEANUP" "Stopping existing PM2 processes..."
pm2 kill 2>/dev/null || true

# Clean up any orphaned processes
log_claude_context "CLEANUP" "Cleaning up orphaned processes..."
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "node.*dev-api-server" 2>/dev/null || true
pkill -f "claude-context-monitor" 2>/dev/null || true

# Wait for cleanup
sleep 2

# Start services with PM2 and Claude AI context
log_claude_context "STARTUP" "Starting development services with PM2..."
pm2 start pm2-claude-context.config.js

# Start Claude AI context monitor
log_claude_context "MONITORING" "Starting Claude AI context monitor..."
nohup node claude-context-monitor.js > /tmp/claude-logs/monitor.log 2>&1 &

# Wait for services to initialize
log_claude_context "STARTUP" "Waiting for services to initialize..."
sleep 5

# Health check with Claude AI context
log_claude_context "HEALTH_CHECK" "Performing comprehensive health check..."

# Check PM2 status
PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[].pm2_env.status' 2>/dev/null | grep -c "online" || echo "0")
log_claude_context "HEALTH_CHECK" "PM2 processes online: $PM2_STATUS"

# Check API server
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/health" 2>/dev/null || echo "000")
log_claude_context "HEALTH_CHECK" "API server status: $API_STATUS"

# Check frontend server
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/" 2>/dev/null || echo "000")
log_claude_context "HEALTH_CHECK" "Frontend server status: $FRONTEND_STATUS"

# Check API proxy
PROXY_STATUS=$(curl -s "http://localhost:3001/api/weather-locations?limit=1" 2>/dev/null | jq -r '.success' 2>/dev/null || echo "false")
log_claude_context "HEALTH_CHECK" "API proxy status: $PROXY_STATUS"

# Generate Claude AI context summary
CONTEXT_FILE="/tmp/claude-dev-context.json"
cat > "$CONTEXT_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "businessGoal": "minimize_productivity_degradation",
  "environment": {
    "pm2Processes": $PM2_STATUS,
    "apiServer": {
      "status": "$API_STATUS",
      "url": "http://localhost:4000",
      "healthy": $([ "$API_STATUS" = "200" ] && echo "true" || echo "false")
    },
    "frontendServer": {
      "status": "$FRONTEND_STATUS",
      "url": "http://localhost:3001",
      "healthy": $([ "$FRONTEND_STATUS" = "200" ] && echo "true" || echo "false")
    },
    "apiProxy": {
      "status": "$PROXY_STATUS",
      "healthy": $([ "$PROXY_STATUS" = "true" ] && echo "true" || echo "false")
    }
  },
  "quickDiagnostics": {
    "pm2Logs": "pm2 logs",
    "apiLogs": "tail -f /tmp/weather-api.log",
    "frontendLogs": "tail -f /tmp/weather-frontend.log",
    "aggregatedLogs": "cat /tmp/claude-aggregated-logs.json"
  },
  "businessImpact": "$([ "$PM2_STATUS" -gt "0" ] && [ "$API_STATUS" = "200" ] && [ "$FRONTEND_STATUS" = "200" ] && echo "none" || echo "high")",
  "recommendations": [
    $([ "$PM2_STATUS" -eq "0" ] && echo "\"Start PM2 processes: pm2 start pm2-claude-context.config.js\"," || echo "")
    $([ "$API_STATUS" != "200" ] && echo "\"Check API server: pm2 restart weather-api\"," || echo "")
    $([ "$FRONTEND_STATUS" != "200" ] && echo "\"Check frontend: pm2 restart weather-frontend\"," || echo "")
    $([ "$PROXY_STATUS" != "true" ] && echo "\"Check proxy configuration in vite.config.ts\"," || echo "")
    "Monitor with: pm2 monit"
  ]
}
EOF

# Display results
echo ""
echo "🎉 Claude AI Enhanced Development Environment Ready!"
echo ""
echo "📊 Business Context:"
echo "   Goal: Minimize productivity degradation"
echo "   Focus: Development velocity optimization"
echo ""
echo "🔍 Service Status:"
echo "   PM2 Processes: $PM2_STATUS online"
echo "   API Server: $API_STATUS (http://localhost:4000)"
echo "   Frontend: $FRONTEND_STATUS (http://localhost:3001)"
echo "   API Proxy: $PROXY_STATUS"
echo ""
echo "🤖 Claude AI Context Files:"
echo "   Development Status: $CONTEXT_FILE"
echo "   Aggregated Logs: /tmp/claude-aggregated-logs.json"
echo "   Startup Log: /tmp/claude-logs/startup.log"
echo ""
echo "🛠️ Management Commands:"
echo "   pm2 list              # View all processes"
echo "   pm2 logs              # View live logs"
echo "   pm2 monit             # Real-time monitoring"
echo "   pm2 restart all       # Restart all services"
echo "   pm2 stop all          # Stop all services"
echo ""
echo "🔄 Quick Diagnostics:"
echo "   cat $CONTEXT_FILE | jq '.businessImpact'"
echo "   cat $CONTEXT_FILE | jq '.recommendations[]'"
echo ""

# Final business impact assessment
BUSINESS_IMPACT=$(cat "$CONTEXT_FILE" | jq -r '.businessImpact')
if [ "$BUSINESS_IMPACT" = "none" ]; then
    echo "✅ All systems operational - optimal development velocity"
else
    echo "⚠️ Business impact: $BUSINESS_IMPACT - review recommendations"
fi
