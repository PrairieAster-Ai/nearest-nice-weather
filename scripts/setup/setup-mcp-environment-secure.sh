#!/bin/bash

# Secure GitHub Project Manager MCP Environment Setup
echo "🔒 Secure GitHub Project Manager MCP Environment Setup"
echo "====================================================="
echo ""

# Check if token is already set
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "GitHub Personal Access Token not found in environment"
    echo ""
    echo "Choose secure setup method:"
    echo "1) Enter token interactively (recommended)"
    echo "2) Load from .env file"
    echo "3) Load from ~/.github_token file"
    echo ""
    read -p "Enter choice [1-3]: " choice
    
    case $choice in
        1)
            echo ""
            echo "Enter your GitHub Personal Access Token:"
            echo "(Token will not be displayed on screen)"
            read -s GITHUB_PERSONAL_ACCESS_TOKEN
            export GITHUB_PERSONAL_ACCESS_TOKEN
            echo ""
            echo "✅ Token set securely"
            ;;
        2)
            if [ -f .env ]; then
                source .env
                echo "✅ Token loaded from .env file"
            else
                echo "❌ .env file not found"
                echo "Create .env file with: GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here"
                exit 1
            fi
            ;;
        3)
            if [ -f ~/.github_token ]; then
                export GITHUB_PERSONAL_ACCESS_TOKEN=$(cat ~/.github_token)
                echo "✅ Token loaded from ~/.github_token"
            else
                echo "❌ ~/.github_token file not found"
                echo "Create file with: echo 'your_token_here' > ~/.github_token && chmod 600 ~/.github_token"
                exit 1
            fi
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
else
    echo "✅ GITHUB_PERSONAL_ACCESS_TOKEN already set in environment"
fi

# Validate token format
if [[ $GITHUB_PERSONAL_ACCESS_TOKEN =~ ^github_pat_[A-Za-z0-9_]+ ]]; then
    echo "✅ Token format looks valid"
else
    echo "⚠️  Token format doesn't match expected pattern (github_pat_...)"
    echo "   Proceeding anyway, but verify your token is correct"
fi

# Set derived environment variables
export GITHUB_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"
export GITHUB_OWNER="PrairieAster-Ai"
export GITHUB_REPO="nearest-nice-weather"

echo ""
echo "✅ Environment configured securely:"
echo "   GITHUB_TOKEN: [HIDDEN - $(echo $GITHUB_TOKEN | head -c 10)...]"
echo "   GITHUB_OWNER: $GITHUB_OWNER"  
echo "   GITHUB_REPO: $GITHUB_REPO"
echo ""

# Optional: AI configuration check
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ℹ️  AI features will be limited without API keys"
    echo "   To enable AI features, set one of:"
    echo "   - OPENAI_API_KEY for OpenAI GPT models"
    echo "   - ANTHROPIC_API_KEY for Claude models"
    echo "   - Set AI_PROVIDER=openai or AI_PROVIDER=anthropic"
else
    echo "✅ AI provider configured for enhanced features"
fi

echo ""
echo "🚀 Ready to test MCP server!"
echo "Run: ./test-mcp-server.sh"
echo ""
echo "🔒 Security reminder:"
echo "   - Your token is not stored in shell history"
echo "   - Run 'unset GITHUB_PERSONAL_ACCESS_TOKEN GITHUB_TOKEN' when done"
echo "   - Token remains secure in Vercel environment variables"