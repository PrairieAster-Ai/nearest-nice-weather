#!/bin/bash

# Guide for configuring token SSO authorization
echo "🔐 GitHub Token SSO Configuration Guide"
echo "======================================"
echo ""

echo "Current token info:"
source .env
echo "  Token: $(echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 20)..."
echo "  Organization: PrairieAster-Ai"
echo "  Repository: nearest-nice-weather"
echo ""

echo "📋 Step-by-step SSO authorization:"
echo "1. Open this URL in your browser:"
echo "   https://github.com/settings/tokens"
echo ""
echo "2. Find your token in the list:"
echo "   - Look for token starting with: $(echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 20)..."
echo "   - It should be listed as 'Fine-grained personal access token'"
echo ""
echo "3. Look for 'Configure SSO' button/link next to your token"
echo ""
echo "4. If you see 'Configure SSO':"
echo "   - Click it"
echo "   - Look for PrairieAster-Ai organization"
echo "   - Click 'Authorize' next to it"
echo ""
echo "5. If you DON'T see 'Configure SSO' or can't authorize:"
echo "   - The organization has SSO misconfigured"
echo "   - Use the fork workaround instead: ./fork-to-personal-setup.sh"
echo ""

echo "🧪 Test after configuration:"
echo "Run this command to verify the fix:"
echo "   ./validate-github-token-fixed.sh"
echo ""

echo "Press Enter to open the token settings page in your browser..."
read -p ""

# Try to open browser (works on most Linux systems)
if command -v xdg-open > /dev/null; then
    xdg-open "https://github.com/settings/tokens"
elif command -v google-chrome > /dev/null; then
    google-chrome "https://github.com/settings/tokens"
elif command -v firefox > /dev/null; then
    firefox "https://github.com/settings/tokens"
else
    echo "Please manually open: https://github.com/settings/tokens"
fi