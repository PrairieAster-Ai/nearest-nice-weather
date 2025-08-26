#!/bin/bash

echo "🔍 GitHub Token Diagnosis (Not SSO Related)"
echo "==========================================="
echo ""

source .env

echo "1. Token Format Check:"
echo "   Prefix: ${GITHUB_PERSONAL_ACCESS_TOKEN:0:20}"
echo "   Length: ${#GITHUB_PERSONAL_ACCESS_TOKEN} characters"
echo "   Expected: 93 characters for fine-grained tokens"
echo ""

echo "2. Testing Basic Authentication:"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user)
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS")

echo "   HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "401" ]; then
    echo "   ❌ Authentication Failed: Bad Credentials"
    echo ""
    echo "   This means one of:"
    echo "   • Token has been revoked or deleted"
    echo "   • Token was incorrectly copied (extra/missing characters)"
    echo "   • Token has expired (fine-grained tokens can have expiration dates)"
    echo ""
    echo "3. Checking Response Headers for Clues:"
    curl -s -I -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user | grep -i "x-github\|www-authenticate" | head -5
    echo ""
    echo "4. Testing without Authentication (to verify API is reachable):"
    curl -s https://api.github.com/rate_limit | jq -r '.rate.limit'
    echo ""
    echo "📋 SOLUTION:"
    echo "============"
    echo "Since this is a 'Bad Credentials' error, not SSO:"
    echo ""
    echo "1. Generate a NEW token at:"
    echo "   https://github.com/settings/personal-access-tokens/new"
    echo ""
    echo "2. Select these permissions:"
    echo "   ✓ Repository access: All repositories or Selected (including PrairieAster-Ai/nearest-nice-weather)"
    echo "   ✓ Permissions:"
    echo "     - Contents: Read"
    echo "     - Issues: Write" 
    echo "     - Metadata: Read"
    echo "     - Pull requests: Write"
    echo ""
    echo "3. Copy the ENTIRE token (all 93 characters)"
    echo ""
    echo "4. Update both locations:"
    echo "   - Local .env file: Run ./update-local-env.sh"
    echo "   - Vercel environment: Update GITHUB_PERSONAL_ACCESS_TOKEN"
    echo ""
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Authentication successful!"
    USERNAME=$(echo "$BODY" | jq -r '.login')
    echo "   Logged in as: $USERNAME"
else
    echo "   ⚠️ Unexpected status: $HTTP_STATUS"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "5. Alternative Test - Using GitHub CLI (if installed):"
if command -v gh > /dev/null; then
    echo "   Testing with gh CLI..."
    GH_TOKEN=$GITHUB_PERSONAL_ACCESS_TOKEN gh auth status 2>&1 | head -5
else
    echo "   GitHub CLI not installed (optional)"
fi