#!/bin/bash

# Quick setup to use personal fork instead of organization repository
echo "🍴 Setting up Personal Fork Workaround"
echo "====================================="
echo ""

echo "Step 1: Fork the repository to your personal account"
echo "Go to: https://github.com/PrairieAster-Ai/nearest-nice-weather"
echo "Click the 'Fork' button in the top-right corner"
echo "Select your personal account (rhspeer) as the destination"
echo ""
echo "Press Enter when you've completed the fork..."
read -p ""

echo ""
echo "Step 2: Update MCP configuration for personal repository"

# Create new configuration
cat > .mcp-personal-config.json << EOF
{
  "github": {
    "owner": "rhspeer",
    "repo": "nearest-nice-weather",
    "token": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
EOF

echo "✅ Created personal repository configuration"
echo ""

# Export environment variables
export GITHUB_OWNER="rhspeer"
export GITHUB_REPO="nearest-nice-weather"

echo "Environment updated:"
echo "  GITHUB_OWNER: $GITHUB_OWNER"
echo "  GITHUB_REPO: $GITHUB_REPO"
echo ""

echo "Step 3: Test with personal repository"
echo "Running validation with personal repository..."
echo ""

./validate-github-token-fixed.sh

echo ""
echo "If validation passes, your MCP server will work with your personal fork!"
echo "All GitHub Project Manager features will be available without SSO issues."