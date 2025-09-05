#!/bin/bash

# GitHub Wiki Deployment Script
# This script helps deploy the comprehensive technical documentation to GitHub wiki

echo "🚀 Deploying Nearest Nice Weather Technical Documentation to GitHub Wiki"
echo "=================================================================="

# Create wiki deployment directory
mkdir -p wiki-deployment
cd wiki-deployment

echo "📋 Preparing wiki content for deployment..."

# Copy wiki files with proper naming for GitHub wiki
cp ../WIKI-HOME.md ./Home.md
cp ../WIKI-DEVELOPER-QUICKSTART.md ./Developer-Quick-Start-Guide.md
cp ../WIKI-API-REFERENCE.md ./API-Reference.md
cp ../WIKI-FRONTEND-ARCHITECTURE.md ./Frontend-Architecture.md
cp ../WIKI-DATABASE-SCHEMA.md ./Database-Schema.md

echo "✅ Wiki content prepared in wiki-deployment/ directory"
echo ""
echo "📚 GitHub Wiki Pages to Create:"
echo "================================"
echo "1. Home.md                     → Wiki home page with navigation"
echo "2. Developer-Quick-Start-Guide.md → 5-minute onboarding guide"
echo "3. API-Reference.md            → Complete API documentation"
echo "4. Frontend-Architecture.md    → React component guide"
echo "5. Database-Schema.md          → Database and data model"
echo ""
echo "🔧 Manual Deployment Steps:"
echo "==========================="
echo "1. Go to: https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki"
echo "2. Click 'New Page' for each wiki page"
echo "3. Copy content from wiki-deployment/ files"
echo "4. Set up proper navigation between pages"
echo ""
echo "📝 Wiki Page Structure:"
echo "======================="
echo "Home → Developer Quick Start → API Reference"
echo "  ↓                        ↓"
echo "Frontend Architecture → Database Schema"
echo ""
echo "✨ After deployment, test with: ./test-wiki-onboarding.sh"