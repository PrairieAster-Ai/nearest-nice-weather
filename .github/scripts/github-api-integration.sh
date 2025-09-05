#!/bin/bash

# Direct GitHub API Integration for NearestNiceWeather.com MVP
# Creates GitHub issues using REST API without requiring GitHub CLI installation

echo "🚀 GitHub API Integration for MVP Development"
echo ""

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN environment variable not set"
    echo ""
    echo "Please set up your GitHub Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens?type=beta"
    echo "2. Click 'Generate new token (fine-grained)'"
    echo "3. Select PrairieAster-Ai/nearest-nice-weather repository"
    echo "4. Set permissions:"
    echo "   - Issues: Read and write"
    echo "   - Metadata: Read"
    echo "   - Projects: Read and write"
    echo "5. Copy the token and run:"
    echo "   export GITHUB_TOKEN='your_token_here'"
    echo ""
    exit 1
fi

# Configuration
REPO_OWNER="PrairieAster-Ai"
REPO_NAME="nearest-nice-weather"
API_BASE="https://api.github.com"

echo "✅ GitHub token found"
echo "📂 Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Test API access
echo "🧪 Testing GitHub API access..."
REPO_CHECK=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "$API_BASE/repos/$REPO_OWNER/$REPO_NAME" | jq -r '.name // "error"')

if [ "$REPO_CHECK" = "error" ] || [ "$REPO_CHECK" = "null" ]; then
    echo "❌ Cannot access repository. Check token permissions."
    exit 1
fi

echo "✅ Repository access confirmed: $REPO_CHECK"

# Function to create GitHub issue
create_github_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"

    echo "📝 Creating issue: $title"

    # Create issue via API
    local response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "$API_BASE/repos/$REPO_OWNER/$REPO_NAME/issues" \
        -d @- << EOF
{
    "title": "$title",
    "body": $(echo "$body" | jq -Rs .),
    "labels": $(echo "$labels" | jq -Rs 'split(",") | map(gsub("^ +| +$"; ""))')
}
EOF
    )

    local issue_number=$(echo "$response" | jq -r '.number // "error"')
    local issue_url=$(echo "$response" | jq -r '.html_url // "error"')

    if [ "$issue_number" = "error" ] || [ "$issue_number" = "null" ]; then
        echo "❌ Failed to create issue"
        echo "Error: $(echo "$response" | jq -r '.message // "Unknown error"')"
        return 1
    else
        echo "✅ Created issue #$issue_number: $issue_url"
        return 0
    fi
}

# Function to add issue to project
add_to_project() {
    local issue_number="$1"
    local project_url="https://github.com/orgs/PrairieAster-Ai/projects/2"

    echo "📋 Adding issue #$issue_number to project..."

    # Note: Adding to projects requires GraphQL API
    # This is a placeholder for the functionality
    echo "⚠️  Project addition requires manual step or GraphQL API"
    echo "   Add manually: $project_url"
}

echo ""
echo "🏗️  Creating Sprint 3 Issues..."
echo ""

# Create Feature Issue
FEATURE_BODY=$(cat .github/issues/sprint-3-feature.md)
if create_github_issue \
    "Feature: Live Weather Data Integration - Sprint 3 Critical Path" \
    "$FEATURE_BODY" \
    "epic,sprint-3,in-progress,revenue-critical"; then

    FEATURE_NUMBER=$issue_number
    echo "💾 Feature issue created: #$FEATURE_NUMBER"
fi

echo ""

# Create Database Epic
DATABASE_BODY=$(cat .github/issues/database-schema-epic.md)
if create_github_issue \
    "Epic: Database Schema Production Deployment" \
    "$DATABASE_BODY" \
    "epic,database,sprint-3,production"; then

    DATABASE_NUMBER=$issue_number
    echo "💾 Database epic created: #$DATABASE_NUMBER"
fi

echo ""

# Create Weather API Epic
WEATHER_BODY=$(cat .github/issues/weather-api-epic.md)
if create_github_issue \
    "Epic: Weather API Integration - Real-Time Data Pipeline" \
    "$WEATHER_BODY" \
    "epic,weather-api,sprint-3,openweather"; then

    WEATHER_NUMBER=$issue_number
    echo "💾 Weather API epic created: #$WEATHER_NUMBER"
fi

echo ""
echo "🎉 Sprint 3 Issues Created Successfully!"
echo ""
echo "📋 Created Issues:"
if [ -n "$FEATURE_NUMBER" ]; then
    echo "  Feature: #$FEATURE_NUMBER - Live Weather Data Integration"
fi
if [ -n "$DATABASE_NUMBER" ]; then
    echo "  Epic: #$DATABASE_NUMBER - Database Schema"
fi
if [ -n "$WEATHER_NUMBER" ]; then
    echo "  Epic: #$WEATHER_NUMBER - Weather API Integration"
fi

echo ""
echo "🔗 Next Steps:"
echo "1. Add issues to project: https://github.com/orgs/PrairieAster-Ai/projects/2"
echo "2. Set custom field values (Sprint: Sprint 3, Story Points, etc.)"
echo "3. Link epic issues to feature issue as sub-issues"
echo "4. Start Sprint 3 execution!"
echo ""
echo "📖 View issues: https://github.com/$REPO_OWNER/$REPO_NAME/issues"
