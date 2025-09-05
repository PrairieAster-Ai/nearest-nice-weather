#!/bin/bash

# New Developer Onboarding Test Script
# Tests that a new developer can successfully set up and contribute using wiki documentation only

echo "🧪 Testing New Developer Onboarding with GitHub Wiki Documentation"
echo "=================================================================="

# Test prerequisites
echo "📋 1. Testing Prerequisites..."
node_version=$(node --version 2>/dev/null || echo "NOT INSTALLED")
npm_version=$(npm --version 2>/dev/null || echo "NOT INSTALLED")

echo "   Node.js: $node_version"
echo "   npm: $npm_version"

if [[ $node_version == "NOT INSTALLED" || $npm_version == "NOT INSTALLED" ]]; then
    echo "❌ Prerequisites missing - refer to Developer Quick Start Guide"
    exit 1
fi

# Test environment setup
echo ""
echo "🔧 2. Testing Environment Setup..."

if [[ ! -f .env ]]; then
    echo "⚠️  No .env file found - copying from .env.example"
    if [[ -f .env.example ]]; then
        cp .env.example .env
        echo "✅ Environment template created"
    else
        echo "❌ No .env.example found - create manually"
    fi
else
    echo "✅ Environment file exists"
fi

# Test dependency installation
echo ""
echo "📦 3. Testing Dependency Installation..."
if [[ -d node_modules ]]; then
    echo "✅ Dependencies already installed"
else
    echo "⚠️  Installing dependencies..."
    npm install --silent
    if [[ $? -eq 0 ]]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Dependency installation failed"
        exit 1
    fi
fi

# Test database connectivity
echo ""
echo "🗄️  4. Testing Database Connectivity..."
if [[ -n "$DATABASE_URL" || -f .env ]]; then
    # Try to connect to database
    node -e "
        require('dotenv').config();
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT COUNT(*) FROM poi_locations')
            .then(result => {
                console.log('✅ Database connected - POI count:', result.rows[0].count);
                process.exit(0);
            })
            .catch(error => {
                console.log('❌ Database connection failed:', error.message);
                console.log('⚠️  Check DATABASE_URL in .env file');
                process.exit(1);
            });
    " 2>/dev/null
else
    echo "⚠️  No DATABASE_URL configured - check .env file"
fi

# Test API server startup
echo ""
echo "🔌 5. Testing API Server Startup..."
echo "   Starting dev API server (5 second test)..."

# Start API server in background
timeout 5s node dev-api-server.js &
api_pid=$!
sleep 2

# Test API health endpoint
api_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health 2>/dev/null || echo "000")

if [[ $api_health == "200" ]]; then
    echo "✅ API server responding - health check passed"
else
    echo "❌ API server not responding (status: $api_health)"
fi

# Cleanup background process
kill $api_pid 2>/dev/null || true

# Test frontend build
echo ""
echo "⚛️  6. Testing Frontend Build..."
cd apps/web
npm run build --silent > /dev/null 2>&1

if [[ $? -eq 0 ]]; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed - check TypeScript errors"
fi

cd ../..

# Test script execution
echo ""
echo "📜 7. Testing Development Scripts..."

if [[ -x "./scripts/environment-validation.sh" ]]; then
    echo "✅ Environment validation script available"
else
    echo "⚠️  Environment validation script not executable"
fi

# Test documentation access
echo ""
echo "📚 8. Testing Documentation Access..."

wiki_files=(
    "WIKI-HOME.md"
    "WIKI-DEVELOPER-QUICKSTART.md"
    "WIKI-API-REFERENCE.md"
    "WIKI-FRONTEND-ARCHITECTURE.md"
    "WIKI-DATABASE-SCHEMA.md"
)

missing_docs=0
for doc in "${wiki_files[@]}"; do
    if [[ -f "$doc" ]]; then
        echo "✅ $doc available"
    else
        echo "❌ $doc missing"
        ((missing_docs++))
    fi
done

# Final assessment
echo ""
echo "🎯 Onboarding Test Results:"
echo "=========================="

if [[ $missing_docs -eq 0 ]]; then
    echo "✅ All documentation available"
else
    echo "⚠️  $missing_docs documentation files missing"
fi

echo ""
echo "📋 New Developer Checklist:"
echo "============================"
echo "□ Can access GitHub wiki documentation"
echo "□ Can clone repository and install dependencies"
echo "□ Can configure environment variables"
echo "□ Can connect to database"
echo "□ Can start development server"
echo "□ Can build frontend application"
echo "□ Can access troubleshooting guides"
echo ""
echo "🚀 Next Steps for New Developer:"
echo "1. Follow Developer Quick Start Guide in GitHub wiki"
echo "2. Explore Frontend Architecture for component patterns"
echo "3. Review API Reference for backend integration"
echo "4. Check Database Schema for data model understanding"
echo ""
echo "📞 If issues persist, check:"
echo "- GitHub wiki: https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki"
echo "- Environment validation: ./scripts/environment-validation.sh localhost"
echo "- API health: curl http://localhost:4000/api/health"
