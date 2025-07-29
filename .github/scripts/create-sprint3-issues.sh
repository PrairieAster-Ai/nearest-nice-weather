#!/bin/bash

# GitHub CLI Commands for Sprint 3 Issue Creation
# Run these commands to create all Sprint 3 issues directly

echo "🚀 Creating Sprint 3 GitHub Issues..."
echo "Make sure you have GitHub CLI installed and authenticated:"
echo "  gh auth status"
echo ""

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install it with:"
    echo "  brew install gh  # macOS"
    echo "  sudo apt install gh  # Ubuntu/Debian" 
    echo "  winget install GitHub.cli  # Windows"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Run:"
    echo "  gh auth login"
    exit 1
fi

echo "✅ GitHub CLI ready. Creating issues..."
echo ""

# Create the main Feature issue
echo "📝 Creating Feature: Live Weather Data Integration..."
FEATURE_ISSUE=$(gh issue create \
    --title "Feature: Live Weather Data Integration - Sprint 3 Critical Path" \
    --body-file .github/issues/sprint-3-feature.md \
    --label "epic,sprint-3,in-progress,revenue-critical" \
    --assignee @me \
    --project "NearestNiceWeather.com App Development")

FEATURE_NUMBER=$(echo $FEATURE_ISSUE | grep -o '#[0-9]*' | tr -d '#')
echo "✅ Created Feature issue #$FEATURE_NUMBER"

# Create Database Schema Epic
echo "📝 Creating Epic: Database Schema..."
DATABASE_ISSUE=$(gh issue create \
    --title "Epic: Database Schema Production Deployment" \
    --body-file .github/issues/database-schema-epic.md \
    --label "epic,database,sprint-3,production" \
    --assignee @me \
    --project "NearestNiceWeather.com App Development")

DATABASE_NUMBER=$(echo $DATABASE_ISSUE | grep -o '#[0-9]*' | tr -d '#')
echo "✅ Created Database Epic issue #$DATABASE_NUMBER"

# Create Weather API Epic  
echo "📝 Creating Epic: Weather API Integration..."
WEATHER_ISSUE=$(gh issue create \
    --title "Epic: Weather API Integration - Real-Time Data Pipeline" \
    --body-file .github/issues/weather-api-epic.md \
    --label "epic,weather-api,sprint-3,openweather" \
    --assignee @me \
    --project "NearestNiceWeather.com App Development")

WEATHER_NUMBER=$(echo $WEATHER_ISSUE | grep -o '#[0-9]*' | tr -d '#')
echo "✅ Created Weather API Epic issue #$WEATHER_NUMBER"

# Update parent references in sub-issues
echo ""
echo "🔗 Updating parent-child relationships..."

# Update Database Epic to reference Feature
gh issue edit $DATABASE_NUMBER --body "$(sed "s/#TBD (Live Weather Data Integration)/#$FEATURE_NUMBER/g" .github/issues/database-schema-epic.md)"

# Update Weather API Epic to reference Feature  
gh issue edit $WEATHER_NUMBER --body "$(sed "s/#TBD (Live Weather Data Integration)/#$FEATURE_NUMBER/g" .github/issues/weather-api-epic.md)"

# Update Feature to reference Epics
UPDATED_FEATURE_BODY=$(sed "s/Epic: Database Schema Production Deployment (8 story points) - #TBD/Epic: Database Schema Production Deployment (8 story points) - #$DATABASE_NUMBER/g; s/Epic: Weather API Integration (7 story points) - #TBD/Epic: Weather API Integration (7 story points) - #$WEATHER_NUMBER/g" .github/issues/sprint-3-feature.md)

gh issue edit $FEATURE_NUMBER --body "$UPDATED_FEATURE_BODY"

echo "✅ Updated parent-child relationships"
echo ""

# Add issues to project (if project exists)
echo "📋 Adding issues to project..."
gh project item-add "https://github.com/orgs/PrairieAster-Ai/projects/2" --url "https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/$FEATURE_NUMBER" 2>/dev/null || echo "⚠️  Project add failed - add manually"
gh project item-add "https://github.com/orgs/PrairieAster-Ai/projects/2" --url "https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/$DATABASE_NUMBER" 2>/dev/null || echo "⚠️  Project add failed - add manually"  
gh project item-add "https://github.com/orgs/PrairieAster-Ai/projects/2" --url "https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/$WEATHER_NUMBER" 2>/dev/null || echo "⚠️  Project add failed - add manually"

echo ""
echo "🎉 Sprint 3 issues created successfully!"
echo ""
echo "📋 Created Issues:"
echo "  Feature: #$FEATURE_NUMBER - Live Weather Data Integration"
echo "  Epic: #$DATABASE_NUMBER - Database Schema"  
echo "  Epic: #$WEATHER_NUMBER - Weather API Integration"
echo ""
echo "🔗 Next Steps:"
echo "1. Add these issues to your GitHub project: https://github.com/orgs/PrairieAster-Ai/projects/2"
echo "2. Set custom field values (Sprint: Sprint 3, Story Points, etc.)"
echo "3. Create user stories for each epic as needed"
echo "4. Start Sprint 3 execution!"
echo ""
echo "📖 View all issues: gh issue list --label sprint-3"