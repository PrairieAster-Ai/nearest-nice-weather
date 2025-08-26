#!/bin/bash

# Debug Token Setup Script
echo "🔍 Debug: GitHub Token Environment Setup"
echo "========================================"
echo ""

# Check current environment
echo "Step 1: Current Environment Check"
echo "---------------------------------"
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ GITHUB_TOKEN is set: $(echo $GITHUB_TOKEN | head -c 15)..."
else
    echo "❌ GITHUB_TOKEN not found"
fi

if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "✅ GITHUB_PERSONAL_ACCESS_TOKEN is set: $(echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 15)..."
else
    echo "❌ GITHUB_PERSONAL_ACCESS_TOKEN not found"
fi

echo ""
echo "Step 2: Check for .env file"
echo "---------------------------"
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "Contents (tokens will be hidden):"
    sed 's/=.*/=[HIDDEN]/' .env
else
    echo "❌ No .env file found"
fi

echo ""
echo "Step 3: Check for ~/.github_token file"
echo "--------------------------------------"
if [ -f ~/.github_token ]; then
    echo "✅ ~/.github_token file exists"
    echo "Content preview: $(head -c 15 ~/.github_token)..."
else
    echo "❌ No ~/.github_token file found"
fi

echo ""
echo "Step 4: Environment Variable Persistence Check"
echo "----------------------------------------------"
echo "Current shell: $SHELL"
echo "Session type: $-"

echo ""
echo "🔧 Solutions to try:"
echo "==================="
echo ""
echo "Option 1: Create .env file in project (recommended)"
echo "---------------------------------------------------"
echo "echo 'GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here' > .env"
echo "chmod 600 .env"
echo "source .env"
echo "export GITHUB_TOKEN=\"\$GITHUB_PERSONAL_ACCESS_TOKEN\""
echo ""

echo "Option 2: Create persistent file"
echo "--------------------------------"
echo "echo 'your_token_here' > ~/.github_token"
echo "chmod 600 ~/.github_token"
echo "export GITHUB_PERSONAL_ACCESS_TOKEN=\$(cat ~/.github_token)"
echo "export GITHUB_TOKEN=\"\$GITHUB_PERSONAL_ACCESS_TOKEN\""
echo ""

echo "Option 3: Add to shell profile"
echo "------------------------------"
echo "echo 'export GITHUB_PERSONAL_ACCESS_TOKEN=\"your_token_here\"' >> ~/.bashrc"
echo "echo 'export GITHUB_TOKEN=\"\$GITHUB_PERSONAL_ACCESS_TOKEN\"' >> ~/.bashrc"
echo "source ~/.bashrc"
echo ""

echo "🧪 Test after setting:"
echo "======================"
echo "echo \"GITHUB_TOKEN set: \$(echo \$GITHUB_TOKEN | head -c 15)...\""
echo "./validate-github-mcp-token.sh"