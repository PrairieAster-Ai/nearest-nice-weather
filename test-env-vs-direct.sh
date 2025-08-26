#!/bin/bash

echo "🔍 Testing Environment Variable vs Direct Token"
echo "=============================================="
echo ""

# Hardcoded token
HARDCODED="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"

echo "1. Testing with hardcoded token:"
RESPONSE=$(curl -s -H "Authorization: token $HARDCODED" https://api.github.com/user)
LOGIN=$(echo "$RESPONSE" | jq -r '.login')
echo "   Result: $LOGIN"
echo ""

echo "2. Testing with .env file:"
source .env
echo "   Token from .env: ${GITHUB_PERSONAL_ACCESS_TOKEN:0:20}..."
RESPONSE2=$(curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user)
LOGIN2=$(echo "$RESPONSE2" | jq -r '.login')
echo "   Result: $LOGIN2"
echo ""

echo "3. Comparing tokens:"
if [ "$HARDCODED" = "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "   ✅ Tokens match exactly"
else
    echo "   ❌ Tokens don't match!"
    echo "   Hardcoded length: ${#HARDCODED}"
    echo "   From .env length: ${#GITHUB_PERSONAL_ACCESS_TOKEN}"
fi

echo ""
echo "4. Repository access test with hardcoded:"
REPO=$(curl -s -H "Authorization: token $HARDCODED" https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather | jq -r '.full_name')
echo "   Can access: $REPO"

echo ""
echo "✅ SOLUTION: Use hardcoded token in MCP config until env issue is resolved"