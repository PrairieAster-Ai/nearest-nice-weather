#!/bin/bash

echo "🔐 Update Local Environment with New GitHub Token"
echo "================================================"
echo ""
echo "Please paste your new GitHub token below:"
echo "(It starts with github_pat_ and is 93 characters long)"
echo ""
read -s NEW_TOKEN

if [ -z "$NEW_TOKEN" ]; then
    echo "❌ No token entered"
    exit 1
fi

# Backup existing .env
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Created backup of .env"

# Update .env with new token
echo "GITHUB_PERSONAL_ACCESS_TOKEN=$NEW_TOKEN" > .env
chmod 600 .env

echo ""
echo "✅ Token updated in .env"
echo "   Token preview: ${NEW_TOKEN:0:20}...${NEW_TOKEN: -10}"
echo ""

# Test the new token
echo "🧪 Testing new token..."
source .env
export GITHUB_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"

# Test basic authentication
AUTH_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
LOGIN=$(echo "$AUTH_RESPONSE" | jq -r '.login')

if [ "$LOGIN" != "null" ] && [ -n "$LOGIN" ]; then
    echo "✅ Authentication successful!"
    echo "   Logged in as: $LOGIN"
    
    # Test repository access
    echo ""
    echo "Testing repository access..."
    REPO_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather)
    REPO_NAME=$(echo "$REPO_RESPONSE" | jq -r '.full_name')
    
    if [ "$REPO_NAME" = "PrairieAster-Ai/nearest-nice-weather" ]; then
        echo "✅ Repository access successful!"
        echo "   Can access: $REPO_NAME"
        
        # Check permissions
        PERMISSIONS=$(echo "$REPO_RESPONSE" | jq -r '.permissions')
        echo "   Permissions: $PERMISSIONS"
    else
        echo "⚠️ Could not access repository"
        echo "   Response: $(echo $REPO_RESPONSE | jq -r '.message' 2>/dev/null || echo 'Unknown error')"
    fi
else
    echo "❌ Authentication failed"
    echo "   Please check that you copied the entire token"
fi

echo ""
echo "Next steps:"
echo "1. If authentication succeeded, update Vercel: vercel env add GITHUB_PERSONAL_ACCESS_TOKEN"
echo "2. Test MCP server: ./test-mcp-with-token.sh"