#!/bin/bash

# Wiki Deployment Verification Script
# This script checks if wiki pages have been deployed successfully

echo "🔍 Wiki Deployment Verification"
echo "================================"
echo ""

REPO="PrairieAster-Ai/nearest-nice-weather"
BASE_URL="https://github.com/$REPO/wiki"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a wiki page exists
check_wiki_page() {
    local page_name="$1"
    local page_url="$2"
    
    # Use curl to check if page exists (200 status)
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$page_url")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ $page_name exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $page_name not found (HTTP $status_code)${NC}"
        return 1
    fi
}

# Check if wiki is enabled
echo "Checking if wiki is enabled for repository..."
wiki_enabled=$(gh api repos/$REPO --jq '.has_wiki')

if [ "$wiki_enabled" = "true" ]; then
    echo -e "${GREEN}✅ Wiki is enabled${NC}"
else
    echo -e "${RED}❌ Wiki is not enabled${NC}"
    echo "Please enable wiki in repository settings"
    exit 1
fi

echo ""
echo "Checking wiki pages..."
echo "----------------------"

# Check each wiki page
pages_found=0
total_pages=5

# Home page
check_wiki_page "Home Page" "$BASE_URL"
((pages_found+=$?==0?1:0))

# Developer Quick Start Guide
check_wiki_page "Developer Quick Start Guide" "$BASE_URL/Developer-Quick-Start-Guide"
((pages_found+=$?==0?1:0))

# API Reference
check_wiki_page "API Reference" "$BASE_URL/API-Reference"
((pages_found+=$?==0?1:0))

# Frontend Architecture
check_wiki_page "Frontend Architecture" "$BASE_URL/Frontend-Architecture"
((pages_found+=$?==0?1:0))

# Database Schema
check_wiki_page "Database Schema" "$BASE_URL/Database-Schema"
((pages_found+=$?==0?1:0))

echo ""
echo "Deployment Status"
echo "-----------------"

if [ $pages_found -eq $total_pages ]; then
    echo -e "${GREEN}✅ All wiki pages deployed successfully! ($pages_found/$total_pages)${NC}"
    echo ""
    echo "Wiki is available at: $BASE_URL"
else
    echo -e "${YELLOW}⚠️ Partial deployment: $pages_found/$total_pages pages found${NC}"
    echo ""
    echo "To complete deployment:"
    echo "1. Go to: $BASE_URL"
    echo "2. Click 'New Page' for each missing page"
    echo "3. Copy content from wiki-deployment/ directory"
    echo "4. Follow instructions in WIKI-DEPLOYMENT-GUIDE.md"
fi

echo ""
echo "Staged Content Location"
echo "-----------------------"
echo "Your wiki content is staged in: ./wiki-deployment/"
echo ""
ls -lh wiki-deployment/*.md | awk '{print "  - " $NF " (" $5 ")"}'

echo ""
echo "Quick Copy Commands"
echo "-------------------"
echo "To view content for manual copying:"
echo ""
echo "  cat wiki-deployment/Home.md                        # For Home page"
echo "  cat wiki-deployment/Developer-Quick-Start-Guide.md # For Developer guide"
echo "  cat wiki-deployment/API-Reference.md               # For API docs"
echo "  cat wiki-deployment/Frontend-Architecture.md       # For Frontend guide"
echo "  cat wiki-deployment/Database-Schema.md             # For Database docs"