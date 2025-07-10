#!/bin/bash
# Development Environment Startup Script
# This script handles common localhost setup issues and serves as documentation

set -e  # Exit on error

echo "🚀 Starting Nearest Nice Weather Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from nearest-nice-weather/"
    exit 1
fi

print_info "Step 1: Environment validation"
# Check for required environment file
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    if [ -f ".env.example" ]; then
        print_info "Copying .env.example to .env"
        cp .env.example .env
        print_warning "Please edit .env with your database credentials"
    else
        print_error ".env.example not found. Please create .env manually"
        exit 1
    fi
else
    print_status ".env file exists"
fi

print_info "Step 2: Dependency health check"
# Check for common dependency issues
if ! npm ls @vercel/node > /dev/null 2>&1; then
    print_warning "Dependency issues detected, running npm install"
    npm install
fi

print_info "Step 3: Process cleanup"
# Kill any existing dev servers (common issue after crashes)
pkill -f "vite --port" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Clean up any stuck processes on the dev port
lsof -ti:${DEV_PORT:-3001} | xargs kill -9 2>/dev/null || true

print_status "Cleaned up existing processes"

print_info "Step 3.5: Docker localhost health check"
# Test if localhost binding works (common issue after restart)
if ! timeout 3 bash -c "</dev/tcp/127.0.0.1/22" 2>/dev/null; then
    print_warning "Localhost binding may be impaired - likely Docker networking conflict"
    if systemctl is-active docker >/dev/null 2>&1; then
        print_info "Docker is running and may be causing localhost conflicts"
        echo ""
        echo "🔧 To fix localhost development servers, Docker needs to restart."
        echo "   This requires sudo access to run: systemctl restart docker"
        echo ""
        read -p "Restart Docker now? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Restarting Docker to fix localhost networking..."
            if sudo systemctl restart docker 2>/dev/null; then
                print_status "Docker restarted successfully"
                sleep 2
                # Test localhost again after Docker restart
                if timeout 3 bash -c "</dev/tcp/127.0.0.1/22" 2>/dev/null; then
                    print_status "Localhost binding fixed!"
                else
                    print_warning "Localhost still impaired after Docker restart"
                fi
            else
                print_error "Failed to restart Docker"
            fi
        else
            print_warning "Skipping Docker restart - localhost may not work for development servers"
            echo "💡 You can manually restart Docker later with: sudo systemctl restart docker"
        fi
    else
        print_warning "Docker not running, but localhost binding still impaired"
    fi
else
    print_status "Localhost binding healthy"
fi
print_status "Docker localhost check completed"

print_info "Step 4: Build validation"
# Quick build test to catch major issues early
if ! npm run build > /dev/null 2>&1; then
    print_error "Build failed. Running diagnostic..."
    npm run build
    exit 1
fi
print_status "Build validation passed"

print_info "Step 5: Development server configuration"
# Set environment variables for stable WebSocket connections
export DEV_PORT=${DEV_PORT:-3001}
export VITE_DEV_PORT=$DEV_PORT
export VITE_HMR_PORT=$DEV_PORT
export VITE_DEV_HOST="0.0.0.0"

print_status "Environment configured: Port $DEV_PORT, HMR $VITE_HMR_PORT"

print_info "Step 6: Starting development server"
echo ""
echo "🌐 Development server will start on http://localhost:$DEV_PORT"
echo "📝 Common issues and solutions:"
echo "   • WebSocket errors: Hard refresh browser (Ctrl+F5)"
echo "   • Port conflicts: This script cleans up automatically"
echo "   • Dependency issues: Run 'npm install' if imports fail"
echo "   • Database errors: Check .env DATABASE_URL"
echo ""
echo "🔧 Development commands:"
echo "   • npm run build      - Test production build"
echo "   • npm run lint       - Check code style"
echo "   • npm run type-check - TypeScript validation"
echo "   • npm test           - Run complete test suite (28 tests)"
echo "   • npm run test:coverage - Test coverage report"
echo "   • npm run test:watch - Live test feedback during development"
echo "   • npm run dev:full   - Start dev server + live testing"
echo ""
echo "⚠️  Known issues:"
echo "   • aria-hidden warnings: Material-UI modal behavior (safe to ignore)"
echo "   • Frontend tests skipped: React 19 compatibility (non-blocking)"
echo "   • npm audit warnings: Development dependencies only"
echo ""
echo "🛑 To stop: Ctrl+C or run 'pkill -f \"vite --port $VITE_DEV_PORT\"'"
echo ""

# Start the development server
cd apps/web
exec npm run dev

# Note: exec replaces the shell process, so anything after this won't run