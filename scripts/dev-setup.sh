#!/bin/bash

# Development Environment Setup Script
# Nearest Nice Weather - Weather Intelligence Platform

set -e

echo "🌤️  Setting up Nearest Nice Weather development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 22+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
        print_error "Python is not installed. Please install Python 3.11+"
        exit 1
    fi
    
    print_success "All dependencies found"
}

# Set up environment files
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env.local ]; then
        cp .env.development .env.local
        print_success "Created .env.local from development template"
    else
        print_warning ".env.local already exists, skipping"
    fi
    
    # Copy to individual apps
    if [ ! -f apps/web/.env ]; then
        cp .env.development apps/web/.env
        print_success "Created apps/web/.env"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    npm install
    print_success "Installed root dependencies"
    
    # Web app dependencies
    cd apps/web
    npm install
    cd ../..
    print_success "Installed web app dependencies"
    
    # API dependencies
    cd apps/api
    npm install
    cd ../..
    print_success "Installed API dependencies"
    
    # Backend dependencies
    cd application/app
    if [ -f requirements.txt ]; then
        pip install -r requirements.txt
        print_success "Installed Python dependencies"
    fi
    cd ../..
}

# Start infrastructure
start_infrastructure() {
    print_status "Starting infrastructure services..."
    
    # Start PostgreSQL and Redis
    docker compose up -d postgres redis
    
    # Wait for services to be ready
    print_status "Waiting for database to be ready..."
    timeout 60 bash -c 'until docker exec weather_postgres pg_isready -U postgres; do sleep 1; done'
    
    print_status "Waiting for Redis to be ready..."
    timeout 60 bash -c 'until docker exec weather_redis redis-cli ping; do sleep 1; done'
    
    print_success "Infrastructure services are ready"
}

# Run health checks
health_check() {
    print_status "Running health checks..."
    
    # Check if services are responding
    if docker exec weather_postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL is healthy"
    else
        print_error "PostgreSQL health check failed"
        return 1
    fi
    
    if docker exec weather_redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is healthy"
    else
        print_error "Redis health check failed"
        return 1
    fi
}

# Main setup flow
main() {
    echo ""
    echo "🌤️  Nearest Nice Weather - Development Setup"
    echo "============================================="
    echo ""
    
    check_dependencies
    setup_environment
    install_dependencies
    start_infrastructure
    health_check
    
    echo ""
    print_success "🎉 Development environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'npm run dev' to start all services"
    echo "  2. Visit http://localhost:3002 for the web app"
    echo "  3. Visit http://localhost:8000/docs for API docs"
    echo "  4. Visit http://localhost:4000 for Vercel functions"
    echo ""
    print_status "Happy coding! 🚀"
}

# Run main function
main