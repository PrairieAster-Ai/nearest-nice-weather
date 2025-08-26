#!/bin/bash

echo "🔍 Direct Token Test"
echo "==================="
echo ""
echo "Paste your GitHub token directly from GitHub's page:"
echo "(This ensures no copy/paste issues)"
echo ""
read -s TEST_TOKEN

echo ""
echo "Testing token..."
echo "Token length: ${#TEST_TOKEN}"
echo "Token preview: ${TEST_TOKEN:0:20}...${TEST_TOKEN: -10}"

# Direct test without any variable substitution issues
RESPONSE=$(curl -s -H "Authorization: token $TEST_TOKEN" https://api.github.com/user)
LOGIN=$(echo "$RESPONSE" | jq -r '.login')

if [ "$LOGIN" != "null" ] && [ -n "$LOGIN" ]; then
    echo "✅ Token works! Authenticated as: $LOGIN"
    echo ""
    echo "Testing organization repository access..."
    REPO_TEST=$(curl -s -H "Authorization: token $TEST_TOKEN" https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather | jq -r '.full_name')
    
    if [ "$REPO_TEST" = "PrairieAster-Ai/nearest-nice-weather" ]; then
        echo "✅ Can access organization repository!"
    else
        echo "❌ Cannot access organization repository"
        curl -s -I -H "Authorization: token $TEST_TOKEN" https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather | grep -i "x-github-sso"
    fi
    
    echo ""
    echo "Saving working token to .env..."
    echo "GITHUB_PERSONAL_ACCESS_TOKEN=$TEST_TOKEN" > .env
    echo "✅ Token saved to .env"
else
    echo "❌ Token authentication failed"
    echo "Error: $(echo $RESPONSE | jq -r '.message')"
    echo ""
    echo "Common causes:"
    echo "1. Token not fully copied (should be 93 characters)"
    echo "2. Extra spaces or characters added"
    echo "3. Token was revoked after creation"
fi