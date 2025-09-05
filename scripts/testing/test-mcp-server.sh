#!/bin/bash

# Test GitHub Project Manager MCP Server
echo "🧪 Testing GitHub Project Manager MCP Server"
echo "============================================"
echo ""

# Check if environment variables are set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN is not set"
    echo "Please run: source ./setup-mcp-environment.sh"
    exit 1
fi

echo "🔍 Testing server connectivity..."
echo "Environment:"
echo "  GITHUB_TOKEN: $(echo $GITHUB_TOKEN | head -c 10)..."
echo "  GITHUB_OWNER: $GITHUB_OWNER"
echo "  GITHUB_REPO: $GITHUB_REPO"
echo ""

# Test 1: Basic server startup
echo "Test 1: Basic server startup (5 seconds)"
echo "-----------------------------------------"
timeout 5s mcp-github-project-manager \
    --owner="$GITHUB_OWNER" \
    --repo="$GITHUB_REPO" \
    --verbose 2>&1 | head -20

echo ""
echo "Test 2: Check server with help flag"
echo "-----------------------------------"
mcp-github-project-manager --help

echo ""
echo "✅ MCP Server tests completed"
echo ""
echo "If no errors above, the server is configured correctly!"
echo ""
echo "Next steps:"
echo "1. The server runs as a daemon for MCP clients"
echo "2. In Claude Desktop, add this server to MCP settings"
echo "3. Use functions like generate_prd, parse_prd, analyze_task_complexity"
