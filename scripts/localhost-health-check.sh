#!/bin/bash
# Localhost Health Check Script
# Comprehensive validation of development environment

set -e

echo "🏥 Localhost Development Environment Health Check"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Test 1: Node.js Version
echo ""
echo "📋 Test 1: Node.js Version Validation"
echo "-------------------------------------"

EXPECTED_NODE="v20.18.0"
CURRENT_NODE=$(node --version 2>/dev/null || echo "not found")

if [ "$CURRENT_NODE" = "$EXPECTED_NODE" ]; then
    print_status 0 "Node.js version: $CURRENT_NODE"
else
    print_status 1 "Node.js version mismatch. Expected: $EXPECTED_NODE, Got: $CURRENT_NODE"
    print_info "Fix: nvm use 20.18.0"
fi

# Test 2: npm Version
NPM_VERSION=$(npm --version 2>/dev/null || echo "not found")
if [ "$NPM_VERSION" != "not found" ]; then
    print_status 0 "npm version: $NPM_VERSION"
else
    print_status 1 "npm not available"
fi

# Test 3: Docker Status
echo ""
echo "📋 Test 2: Docker Service Status"
echo "--------------------------------"

if systemctl is-active --quiet docker; then
    print_status 0 "Docker service is running"

    # Docker version
    DOCKER_VERSION=$(docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//')
    print_status 0 "Docker version: $DOCKER_VERSION"
else
    print_status 1 "Docker service is not running"
    print_info "Fix: sudo systemctl start docker"
fi

# Test 4: Docker Configuration
echo ""
echo "📋 Test 3: Docker Configuration"
echo "-------------------------------"

if [ -f "/etc/docker/daemon.json" ]; then
    print_status 0 "Docker daemon.json exists"

    # Check if our custom configuration is applied
    if grep -q "172.31.0.1" /etc/docker/daemon.json 2>/dev/null; then
        print_status 0 "Custom Docker networking configuration applied"
    else
        print_status 1 "Custom Docker networking configuration missing"
        print_info "Fix: Run ./apply-docker-fix.sh"
    fi
else
    print_status 1 "Docker daemon.json not found"
    print_info "Fix: Run ./apply-docker-fix.sh"
fi

# Test 5: Port Availability
echo ""
echo "📋 Test 4: Port Availability"
echo "----------------------------"

PORTS=(3001 3002 3999)
for port in "${PORTS[@]}"; do
    if nc -z localhost $port 2>/dev/null; then
        print_warning "Port $port is in use"
    else
        print_status 0 "Port $port is available"
    fi
done

# Test 6: Localhost Binding Test
echo ""
echo "📋 Test 5: Localhost Binding Test"
echo "---------------------------------"

# Test localhost binding capability
timeout 10 node -e "
const http = require('http');
const server = http.createServer((req, res) => res.end('OK'));
server.listen(3999, '127.0.0.1', () => {
  console.log('Localhost binding test successful');
  server.close();
}).on('error', (err) => {
  console.log('Localhost binding failed:', err.message);
  process.exit(1);
});" 2>/dev/null

if [ $? -eq 0 ]; then
    print_status 0 "Localhost binding test passed"
else
    print_status 1 "Localhost binding test failed"
    print_info "Fix: ./apply-docker-fix.sh or sudo systemctl restart docker"
fi

# Test 7: Project Dependencies
echo ""
echo "📋 Test 6: Project Dependencies"
echo "-------------------------------"

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        print_status 0 "Root dependencies installed"
    else
        print_status 1 "Root dependencies missing"
        print_info "Fix: npm install"
    fi

    # Check web app dependencies
    if [ -f "apps/web/package.json" ]; then
        if [ -d "apps/web/node_modules" ]; then
            print_status 0 "Web app dependencies installed"
        else
            print_status 1 "Web app dependencies missing"
            print_info "Fix: cd apps/web && npm install"
        fi
    fi
else
    print_warning "Not in project root directory"
fi

# Test 8: Environment File
echo ""
echo "📋 Test 7: Environment Configuration"
echo "------------------------------------"

if [ -f "apps/web/.env" ]; then
    print_status 0 "Environment file exists"

    # Check for basic environment variables
    if grep -q "DATABASE_URL" apps/web/.env 2>/dev/null; then
        print_status 0 "Database URL configured"
    else
        print_warning "DATABASE_URL not found in .env"
    fi
else
    print_status 1 "Environment file missing"
    print_info "Fix: cp apps/web/.env.example apps/web/.env"
fi

# Test 9: Development Server Test
echo ""
echo "📋 Test 8: Development Server Test"
echo "----------------------------------"

print_info "Testing development server startup..."

# Change to web app directory for testing
cd apps/web 2>/dev/null || {
    print_status 1 "Cannot access apps/web directory"
    exit 1
}

# Start dev server in background and test
timeout 15 npm run dev >/dev/null 2>&1 &
DEV_PID=$!

# Wait for server to start
sleep 5

# Test if server is responding
if curl -f http://localhost:3001/ >/dev/null 2>&1; then
    print_status 0 "Development server starts and responds"

    # Test health endpoint
    if curl -f http://localhost:3001/health.json >/dev/null 2>&1; then
        print_status 0 "Health endpoint accessible"
    else
        print_warning "Health endpoint not accessible"
    fi
else
    print_status 1 "Development server not responding"
    print_info "Check: npm run dev for error messages"
fi

# Clean up dev server
if kill -0 $DEV_PID 2>/dev/null; then
    kill $DEV_PID
fi

cd ../..

# Test 10: Build Process Test
echo ""
echo "📋 Test 9: Build Process Test"
echo "-----------------------------"

cd apps/web 2>/dev/null

print_info "Testing build process..."
if timeout 30 npm run build >/dev/null 2>&1; then
    print_status 0 "Build process completes successfully"

    # Check if build output exists
    if [ -d "dist" ]; then
        print_status 0 "Build output directory created"

        # Check for key files
        if [ -f "dist/index.html" ]; then
            print_status 0 "Built HTML file exists"
        else
            print_warning "Built HTML file missing"
        fi
    else
        print_warning "Build output directory missing"
    fi
else
    print_status 1 "Build process failed"
    print_info "Check: npm run build for error messages"
fi

cd ../..

# Summary
echo ""
echo "🎯 Health Check Summary"
echo "======================"

# Count passed/failed tests
TOTAL_TESTS=9
echo "Environment validation completed"
echo ""

# Recommendations
echo "💡 Recommendations:"
echo ""

# Check if any major issues exist
if ! systemctl is-active --quiet docker; then
    echo "🔧 Critical: Start Docker service"
fi

if [ "$(node --version 2>/dev/null)" != "v20.18.0" ]; then
    echo "🔧 Important: Switch to Node.js 20.18.0 LTS"
fi

if ! timeout 5 node -e "const http = require('http'); const server = http.createServer().listen(3999, '127.0.0.1', () => server.close());" 2>/dev/null; then
    echo "🔧 Critical: Fix Docker networking (run ./apply-docker-fix.sh)"
fi

echo ""
echo "🚀 Quick Start Commands:"
echo "  npm run dev     - Start development server"
echo "  npm run build   - Build for production"
echo "  npm run test    - Run test suite"
echo "  npm run deploy:preview - Deploy to preview"
echo ""
echo "🆘 If issues persist, see documentation/runbooks/ for detailed troubleshooting"
