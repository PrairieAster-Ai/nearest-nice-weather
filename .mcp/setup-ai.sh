#!/bin/bash

# AI-Enhanced Project Manager MCP Setup Script
# Configures Anthropic API key for advanced AI features

set -e

MCP_DIR="/home/robertspeer/Projects/GitRepo/nearest-nice-weather/.mcp"
AI_ENV_FILE="$MCP_DIR/ai-env"

echo "🤖 Setting up AI-Enhanced Project Manager MCP"
echo "============================================="

# Function to prompt for API key
prompt_for_api_key() {
    echo ""
    echo "To enable AI features, you'll need an Anthropic API key:"
    echo "1. Go to https://console.anthropic.com/"
    echo "2. Create an account or sign in"
    echo "3. Navigate to 'API Keys'"
    echo "4. Create a new API key"
    echo ""
    echo "⚠️  Your API key will be stored locally in $AI_ENV_FILE"
    echo "⚠️  This file is excluded from git by .gitignore"
    echo ""
    
    read -p "Do you have an Anthropic API key? (y/n): " has_key
    
    if [[ $has_key =~ ^[Yy]$ ]]; then
        read -sp "Enter your Anthropic API key: " api_key
        echo ""
        
        if [[ $api_key =~ ^sk-ant- ]]; then
            echo "✅ Valid Anthropic API key format detected"
            return 0
        else
            echo "❌ Invalid API key format. Anthropic keys start with 'sk-ant-'"
            return 1
        fi
    else
        echo ""
        echo "📝 No API key provided. AI features will be disabled."
        echo "   You can run this script again later to add an API key."
        api_key=""
        return 0
    fi
}

# Create .mcp directory if it doesn't exist
mkdir -p "$MCP_DIR"

# Check if AI environment file already exists
if [[ -f "$AI_ENV_FILE" ]]; then
    echo "⚠️  AI environment file already exists: $AI_ENV_FILE"
    read -p "Do you want to recreate it? (y/n): " recreate
    
    if [[ ! $recreate =~ ^[Yy]$ ]]; then
        echo "✅ Keeping existing configuration"
        exit 0
    fi
fi

# Get API key from user
if prompt_for_api_key; then
    # Create AI environment file
    cat > "$AI_ENV_FILE" << EOF
# AI-Enhanced Project Manager MCP Configuration
# Generated: $(date)

# GitHub Configuration
GITHUB_TOKEN=${GITHUB_TOKEN}
GITHUB_OWNER=PrairieAster-Ai
GITHUB_REPO=nearest-nice-weather

# AI Configuration
ANTHROPIC_API_KEY=$api_key
AI_MODEL_PROVIDER=anthropic
AI_MODEL_NAME=claude-3-sonnet
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7

# MCP Server Configuration  
MCP_PORT=3002
MCP_LOG_LEVEL=info
MCP_ENABLE_WEBHOOK=true

# Business Context for AI insights
BUSINESS_REVENUE_TARGET=36000
BUSINESS_MARKET=Minnesota tourism operators
BUSINESS_MODEL=B2B SaaS + B2C subscriptions
EOF

    # Set secure permissions
    chmod 600 "$AI_ENV_FILE"
    
    echo ""
    echo "✅ AI environment configuration created: $AI_ENV_FILE"
    echo "🔒 File permissions set to 600 (owner read/write only)"
    
else
    echo "❌ AI setup cancelled"
    exit 1
fi

# Add to .gitignore if not already there
GITIGNORE_FILE="/home/robertspeer/Projects/GitRepo/nearest-nice-weather/.gitignore"
if ! grep -q "\.mcp/ai-env" "$GITIGNORE_FILE" 2>/dev/null; then
    echo "" >> "$GITIGNORE_FILE"
    echo "# AI environment files (contains API keys)" >> "$GITIGNORE_FILE"
    echo ".mcp/ai-env" >> "$GITIGNORE_FILE"
    echo "✅ Added .mcp/ai-env to .gitignore"
fi

echo ""
echo "🚀 Testing AI-enhanced MCP server..."

# Test the configuration
if [[ -n "$api_key" ]]; then
    echo "Loading environment from: $AI_ENV_FILE"
    set -a
    source "$AI_ENV_FILE"
    set +a
    
    # Test MCP server with AI enabled (timeout after 10 seconds)
    timeout 10s mcp-github-project-manager \
        --env-file "$AI_ENV_FILE" \
        --verbose 2>&1 | head -10 || true
    
    echo ""
    echo "✅ AI-enhanced Project Manager MCP is ready!"
    echo ""
    echo "🔧 Available npm commands:"
    echo "  npm run mcp:ai          - Start AI-enhanced MCP server"
    echo "  npm run mcp:test-ai     - Test AI features"
    echo ""
    echo "🖥️  Claude Desktop configuration:"
    echo "  Copy .mcp/claude-desktop-ai-config.json to your Claude Desktop config"
    echo ""
    echo "📝 VS Code configuration:"
    echo "  Use .vscode/mcp-ai-settings.json for VS Code MCP extension"
    
else
    echo "✅ Basic Project Manager MCP is ready (no AI features)"
    echo "   Run this script again to add AI capabilities"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Test: npm run mcp:ai"
echo "2. Use in Claude Desktop or VS Code"
echo "3. Try AI-powered sprint planning and PRD generation"