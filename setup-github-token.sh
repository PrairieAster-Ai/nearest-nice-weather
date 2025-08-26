#!/bin/bash

# GitHub Token Setup Script
# This script helps set up the GitHub Personal Access Token environment variable

echo "GitHub Personal Access Token Setup"
echo "=================================="
echo ""
echo "This script will help you set up your GitHub token as an environment variable."
echo ""
echo "IMPORTANT: Never paste your actual token in any file or chat!"
echo ""
echo "To set up your token, run this command in your terminal:"
echo ""
echo "  export GITHUB_PERSONAL_ACCESS_TOKEN='your_token_here'"
echo ""
echo "To make it permanent, add it to your shell profile:"
echo ""
echo "  echo 'export GITHUB_PERSONAL_ACCESS_TOKEN=\"your_token_here\"' >> ~/.bashrc"
echo "  source ~/.bashrc"
echo ""
echo "Or for zsh users:"
echo ""
echo "  echo 'export GITHUB_PERSONAL_ACCESS_TOKEN=\"your_token_here\"' >> ~/.zshrc"
echo "  source ~/.zshrc"
echo ""
echo "To verify it's set:"
echo ""
echo "  echo \$GITHUB_PERSONAL_ACCESS_TOKEN | head -c 10"
echo ""
echo "This should show the first 10 characters of your token."
echo ""
echo "Environment Variables Status:"
echo "=============================="

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "❌ GITHUB_PERSONAL_ACCESS_TOKEN is NOT set"
    echo "   Please set it using the commands above"
else
    echo "✅ GITHUB_PERSONAL_ACCESS_TOKEN is set"
    echo "   Token starts with: $(echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 10)..."
fi

echo ""
echo "Vercel Configuration:"
echo "===================="
echo "✅ You've already added GITHUB_PERSONAL_ACCESS_TOKEN to Vercel"
echo "   This will be available in your Vercel functions as:"
echo "   process.env.GITHUB_PERSONAL_ACCESS_TOKEN"