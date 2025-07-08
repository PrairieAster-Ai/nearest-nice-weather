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
pkill -f "vite --port 3002" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Clean up any stuck processes on port 3002
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

print_status "Cleaned up existing processes"

print_info "Step 4: Build validation"
# Quick build test to catch major issues early
if ! npm run build > /dev/null 2>&1; then
    print_error "Build failed. Running diagnostic..."
    npm run build
    exit 1
fi
print_status "Build validation passed"

print_info "Step 5: Starting development server"
echo ""
echo "🌐 Development server will start on http://localhost:3002"
echo "📝 Common issues and solutions:"
echo "   • WebSocket errors: Hard refresh browser (Ctrl+F5)"
echo "   • Port conflicts: This script cleans up automatically"
echo "   • Dependency issues: Run 'npm install' if imports fail"
echo "   • Database errors: Check .env DATABASE_URL"
echo ""
echo "🔧 Development commands:"
echo "   • npm run build     - Test production build"
echo "   • npm run lint      - Check code style"
echo "   • npm run type-check - TypeScript validation"
echo "   • npm test          - Run test suite"
echo ""
echo "⚠️  Known issues:"
echo "   • aria-hidden warnings: Material-UI modal behavior (safe to ignore)"
echo "   • Frontend tests skipped: React 19 compatibility (non-blocking)"
echo "   • npm audit warnings: Development dependencies only"
echo ""
echo "🛑 To stop: Ctrl+C or run 'pkill -f \"vite --port 3002\"'"
echo ""

# Start the development server
cd apps/web
exec npm run dev

# Note: exec replaces the shell process, so anything after this won't run