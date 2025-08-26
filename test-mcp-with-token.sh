#!/bin/bash

# Test MCP server with the new token
echo "🧪 Testing MCP Server with New Token"
echo "===================================="

# Load token from .env
source .env

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "❌ Token not found in .env"
    exit 1
fi

# Set required environment variables
export GITHUB_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"
export GITHUB_OWNER="PrairieAster-Ai"
export GITHUB_REPO="nearest-nice-weather"

echo "Configuration:"
echo "  Token: $(echo $GITHUB_TOKEN | head -c 20)..."
echo "  Owner: $GITHUB_OWNER"
echo "  Repo: $GITHUB_REPO"
echo ""

echo "Testing MCP server startup..."
echo "------------------------------"

# Test with timeout
timeout 5s mcp-github-project-manager --verbose 2>&1 | head -20

echo ""
echo "If you see 'Server initialized' or similar, the MCP server is working!"
echo "If you see SSO errors, you need to disable SSO in the organization settings."