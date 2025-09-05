#!/bin/bash
# Quick Docker Health Check
# Fast validation of Docker networking for localhost development

echo "🐳 Quick Docker Health Check"
echo "============================"

# Test 1: Docker Service Status
if systemctl is-active --quiet docker; then
    echo "✅ Docker service: Running"
else
    echo "❌ Docker service: Stopped"
    echo "   Fix: sudo systemctl start docker"
    exit 1
fi

# Test 2: Docker Daemon Configuration
if [ -f "/etc/docker/daemon.json" ]; then
    if grep -q "172.31.0.1" /etc/docker/daemon.json 2>/dev/null; then
        echo "✅ Docker config: Custom networking applied"
    else
        echo "⚠️ Docker config: Default configuration"
        echo "   Recommendation: Apply custom networking"
    fi
else
    echo "⚠️ Docker config: No daemon.json found"
    echo "   Recommendation: Apply custom networking"
fi

# Test 3: Localhost Binding Test
echo -n "🧪 Testing localhost binding... "
if timeout 5 node -e "
const http = require('http');
const server = http.createServer();
server.listen(3999, '127.0.0.1', () => {
  server.close();
  process.exit(0);
}).on('error', () => process.exit(1));
" 2>/dev/null; then
    echo "✅ OK"
else
    echo "❌ Failed"
    echo "   Fix: ./apply-docker-fix.sh"
    exit 1
fi

# Test 4: Port Availability
PORTS=(3001 3002)
for port in "${PORTS[@]}"; do
    if nc -z localhost $port 2>/dev/null; then
        echo "⚠️ Port $port: In use"
    else
        echo "✅ Port $port: Available"
    fi
done

echo ""
echo "🎯 Docker environment ready for development"
