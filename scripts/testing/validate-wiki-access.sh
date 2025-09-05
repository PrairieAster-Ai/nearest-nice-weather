#!/bin/bash

echo "🔍 Validating GitHub Wiki Access"
echo "================================="
echo ""

# Check if wiki is enabled
echo "1. Checking wiki status..."
WIKI_ENABLED=$(gh api repos/PrairieAster-Ai/nearest-nice-weather --jq '.has_wiki')
if [ "$WIKI_ENABLED" = "true" ]; then
    echo "   ✅ Wiki is enabled for the repository"
else
    echo "   ❌ Wiki is not enabled"
    exit 1
fi
echo ""

# Check GitHub CLI authentication
echo "2. Checking GitHub CLI authentication..."
if gh auth status > /dev/null 2>&1; then
    echo "   ✅ GitHub CLI is authenticated"
    USER=$(gh api user --jq '.login')
    echo "   Logged in as: $USER"
else
    echo "   ❌ GitHub CLI not authenticated"
    exit 1
fi
echo ""

# Test API access to repository
echo "3. Testing repository access..."
REPO_NAME=$(gh api repos/PrairieAster-Ai/nearest-nice-weather --jq '.full_name')
if [ "$REPO_NAME" = "PrairieAster-Ai/nearest-nice-weather" ]; then
    echo "   ✅ Can access repository: $REPO_NAME"
else
    echo "   ❌ Cannot access repository"
    exit 1
fi
echo ""

# Create wiki deployment instructions
echo "4. Wiki Management Options:"
echo ""
echo "   Option A: Manual Web Interface (Recommended)"
echo "   --------------------------------------------"
echo "   1. Go to: https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki"
echo "   2. Click 'Create the first page' or 'New Page'"
echo "   3. Copy content from wiki-deployment/*.md files"
echo "   4. Paste and save each page"
echo ""

echo "   Option B: Git Clone Method (if git is properly configured)"
echo "   ----------------------------------------------------------"
echo "   # First, ensure git is properly configured:"
echo "   git config --global credential.helper store"
echo "   git config --global user.name \"$USER\""
echo "   git config --global user.email \"$USER@users.noreply.github.com\""
echo ""
echo "   # Then clone and push wiki pages:"
echo "   git clone https://github.com/PrairieAster-Ai/nearest-nice-weather.wiki.git"
echo "   cp wiki-deployment/*.md nearest-nice-weather.wiki/"
echo "   cd nearest-nice-weather.wiki"
echo "   git add ."
echo "   git commit -m 'Add wiki pages'"
echo "   git push"
echo ""

echo "   Option C: Use GitHub CLI to create issues with wiki content"
echo "   -----------------------------------------------------------"
echo "   # Since wiki API is limited, create documentation as issues:"
echo "   gh issue create --title \"Wiki: Home\" --body \"@wiki-deployment/Home.md\""
echo ""

echo "5. Wiki Pages Ready for Deployment:"
ls -la wiki-deployment/*.md 2>/dev/null | awk '{print "   - " $9}'
echo ""

echo "✅ Summary:"
echo "   - Wiki is enabled and accessible"
echo "   - GitHub CLI has proper authentication"
echo "   - Wiki pages are prepared in wiki-deployment/"
echo "   - Manual deployment via web interface is recommended"
echo ""
echo "⚠️  Note: Wiki pages cannot be created via API, only through:"
echo "   1. Web interface (easiest)"
echo "   2. Git clone/push (requires git configuration)"