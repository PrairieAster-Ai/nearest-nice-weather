#!/bin/bash

# Script to securely update local .env file with new token
echo "🔄 Updating Local .env File with New Token"
echo "=========================================="
echo ""

# Backup existing .env if it exists
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ Created backup: .env.backup"
fi

echo ""
echo "Choose update method:"
echo "1) Enter new token interactively (recommended)"
echo "2) Copy from clipboard (if you have it copied)"
echo "3) Manual edit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "Enter your new GitHub Personal Access Token:"
        echo "(It will not be displayed on screen)"
        read -s NEW_TOKEN

        if [ -z "$NEW_TOKEN" ]; then
            echo "❌ No token entered"
            exit 1
        fi

        # Write to .env file
        echo "GITHUB_PERSONAL_ACCESS_TOKEN=$NEW_TOKEN" > .env
        chmod 600 .env
        echo ""
        echo "✅ Token updated in .env file"
        ;;

    2)
        echo ""
        echo "Paste your token and press Enter:"
        echo "(It will be hidden after entry)"
        read -s NEW_TOKEN

        if [ -z "$NEW_TOKEN" ]; then
            echo "❌ No token pasted"
            exit 1
        fi

        echo "GITHUB_PERSONAL_ACCESS_TOKEN=$NEW_TOKEN" > .env
        chmod 600 .env
        echo ""
        echo "✅ Token updated in .env file"
        ;;

    3)
        echo ""
        echo "Opening .env file for manual edit..."
        echo "Replace the token value with your new one from Vercel"
        ${EDITOR:-nano} .env
        chmod 600 .env
        echo "✅ Manual edit complete"
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Test the new token
echo ""
echo "Testing new token..."

# Load the token
source .env
export GITHUB_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"

# Quick authentication test
AUTH_TEST=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user 2>&1)

if echo "$AUTH_TEST" | grep -q '"login"'; then
    USERNAME=$(echo "$AUTH_TEST" | grep -o '"login":"[^"]*' | cut -d'"' -f4)
    echo "✅ Authentication successful!"
    echo "   Logged in as: $USERNAME"
    echo ""
    echo "Token preview: $(echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 20)..."
    echo ""
    echo "Next step: Run validation"
    echo "   ./validate-github-token-fixed.sh"
else
    echo "❌ Authentication failed"
    echo "   Please verify the token is correct"
    echo "   Response: $(echo $AUTH_TEST | head -c 100)"
fi
