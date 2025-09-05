#!/bin/bash

# GitHub Project Manager MCP Environment Setup
echo "🔧 Setting up GitHub Project Manager MCP Environment"
echo "==================================================="
echo ""

# Check if GITHUB_PERSONAL_ACCESS_TOKEN is set (from Vercel)
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "⚠️  GITHUB_PERSONAL_ACCESS_TOKEN is not set"
    echo "Please set it first:"
    echo "  export GITHUB_PERSONAL_ACCESS_TOKEN='your_token_here'"
    echo ""
    exit 1
else
    echo "✅ GITHUB_PERSONAL_ACCESS_TOKEN is set"
    echo "   Token starts with: $(echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 10)..."
fi

# Set GITHUB_TOKEN to match what the MCP server expects
export GITHUB_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"
export GITHUB_OWNER="PrairieAster-Ai"
export GITHUB_REPO="nearest-nice-weather"

echo "✅ Environment variables configured:"
echo "   GITHUB_TOKEN: $(echo $GITHUB_TOKEN | head -c 10)..."
echo "   GITHUB_OWNER: $GITHUB_OWNER"
echo "   GITHUB_REPO: $GITHUB_REPO"
echo ""

# Optional: AI configuration
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ℹ️  AI features will be limited without API keys"
    echo "   To enable AI features, set one of:"
    echo "   export OPENAI_API_KEY='your_openai_key'"
    echo "   export ANTHROPIC_API_KEY='your_claude_key'"
    echo "   export AI_PROVIDER='openai'  # or 'anthropic'"
else
    echo "✅ AI provider configured for enhanced features"
fi

echo ""
echo "🚀 Ready to test MCP server!"
echo "Run: mcp-github-project-manager --verbose"