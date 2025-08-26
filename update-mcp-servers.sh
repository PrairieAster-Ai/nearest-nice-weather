#!/bin/bash

echo "🔄 Updating MCP Servers"
echo "======================="
echo ""

echo "1. Updating Docker image for official GitHub MCP server..."
docker pull ghcr.io/github/github-mcp-server:latest
echo "✅ Official server updated"
echo ""

echo "2. Current mcp-github-project-manager version:"
npm list -g mcp-github-project-manager 2>/dev/null | grep mcp-github || echo "Not installed"
echo ""

echo "3. Alternative MCP servers available:"
echo "   - @andrebuzeli/github-mcp-v2 (v6.0.4) - 15 tools, better auth handling"
echo "   - jaegis-github-mcp-server (v3.1.0) - AI-powered, 45+ tools"
echo "   - github-mcp-server (v1.8.7) - 29 Git operations"
echo ""

echo "Would you like to try an alternative MCP server? (y/n)"
read -p "> " choice

if [ "$choice" = "y" ]; then
    echo ""
    echo "Installing @andrebuzeli/github-mcp-v2..."
    npm install -g @andrebuzeli/github-mcp-v2
    
    echo ""
    echo "✅ Alternative server installed"
    echo ""
    echo "To use it, update .vscode/mcp-settings.json:"
    echo '  "github-v2": {'
    echo '    "command": "github-mcp-v2",'
    echo '    "env": {'
    echo '      "GITHUB_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"'
    echo '    }'
    echo '  }'
fi

echo ""
echo "4. Testing authentication with updated server..."
echo ""

# Test with classic token format
echo "Testing with classic token (if you have one):"
echo "Enter a classic token (starts with ghp_) or press Enter to skip:"
read -s CLASSIC_TOKEN

if [ -n "$CLASSIC_TOKEN" ]; then
    echo ""
    RESPONSE=$(curl -s -H "Authorization: token $CLASSIC_TOKEN" https://api.github.com/user)
    LOGIN=$(echo "$RESPONSE" | jq -r '.login')
    
    if [ "$LOGIN" != "null" ] && [ -n "$LOGIN" ]; then
        echo "✅ Classic token works! User: $LOGIN"
        echo "Updating .env with working token..."
        echo "GITHUB_PERSONAL_ACCESS_TOKEN=$CLASSIC_TOKEN" > .env
        echo "✅ Token saved"
    else
        echo "❌ Classic token also failed"
    fi
fi

echo ""
echo "Done! If tokens still fail, try:"
echo "1. Create a GitHub App instead"
echo "2. Use alternative MCP server with better auth"
echo "3. Contact GitHub support"