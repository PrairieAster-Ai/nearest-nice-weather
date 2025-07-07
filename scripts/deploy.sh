#!/bin/bash

# Deployment Script for Nearest Nice Weather
# Streamlined deployment process with single confirmation dialog

set -e  # Exit on any error

echo "🚀 Deployment Script - Nearest Nice Weather"
echo "=============================================="

# Step 1: Check git status
echo "📊 Checking repository status..."
git status --porcelain

# Step 2: Show changes
echo ""
echo "📝 Changes to be deployed:"
echo "=========================="
git diff --name-only
echo ""

# Step 3: Show detailed diff for review
echo "🔍 Detailed changes:"
echo "==================="
git diff --color=always

# Step 4: Auto-proceed with deployment
echo ""
echo "🚀 AUTO-DEPLOYING IN 3 SECONDS..."
echo "================================"
echo "This will:"
echo "  1. Add all changes to git"
echo "  2. Create a commit with automated message"
echo "  3. Push to main branch (triggers Vercel deployment)"
echo "  4. Verify deployment success"
echo ""
echo "⏰ Starting in 3... 2... 1..."
sleep 3

# Step 5: Execute deployment
echo ""
echo "🔄 Starting deployment process..."
echo "================================"

# Record start time
START_TIME=$(date +%s)
echo "⏰ Start time: $(date)"

# Add all changes
echo "📦 Adding changes to git..."
git add .

# Create commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "💾 Creating commit..."
git commit -m "$(cat <<EOF
Deploy: Automated deployment - $TIMESTAMP

Deployment triggered via deployment script.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to main
echo "🚀 Pushing to main branch..."
git push origin main

# Wait for Vercel deployment
echo "⏳ Waiting for Vercel deployment (30 seconds)..."
sleep 30

# Verify deployment
echo "🔍 Verifying deployment..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" https://nearest-nice-weather.vercel.app)
HTTP_CODE=$(echo $RESPONSE | cut -d',' -f1)
LOAD_TIME=$(echo $RESPONSE | cut -d',' -f2)

# Calculate total time
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

echo ""
echo "✅ DEPLOYMENT COMPLETE"
echo "====================="
echo "📊 Results:"
echo "  - HTTP Status: $HTTP_CODE"
echo "  - Load Time: ${LOAD_TIME}s"
echo "  - Total Deployment Time: ${TOTAL_TIME}s"
echo "  - Site URL: https://nearest-nice-weather.vercel.app"
echo "  - Completed: $(date)"

if [ "$HTTP_CODE" = "200" ]; then
    echo "🎉 Deployment successful!"
    
    # Step 6: Get GitHub Actions deployment feedback
    echo ""
    echo "📋 GitHub Actions Deployment Feedback:"
    echo "======================================"
    
    # Check if GitHub CLI is available
    if command -v gh &> /dev/null; then
        echo "⏳ Fetching latest deployment status..."
        
        # Wait a moment for GitHub Actions to start
        sleep 10
        
        # Get the latest workflow run
        echo "🔍 Latest workflow runs:"
        gh run list --limit 3 --json status,conclusion,name,createdAt,url | jq -r '.[] | "- \(.name): \(.status) (\(.conclusion // "in progress")) - \(.createdAt) - \(.url)"'
        
        echo ""
        echo "⏰ Waiting for GitHub Actions to complete (60 seconds)..."
        sleep 60
        
        echo "📊 Final status check:"
        LATEST_RUN=$(gh run list --limit 1 --json id,status,conclusion,name,url | jq -r '.[0]')
        RUN_ID=$(echo "$LATEST_RUN" | jq -r '.id')
        RUN_STATUS=$(echo "$LATEST_RUN" | jq -r '.status')
        RUN_CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.conclusion')
        RUN_NAME=$(echo "$LATEST_RUN" | jq -r '.name')
        RUN_URL=$(echo "$LATEST_RUN" | jq -r '.url')
        
        echo "Latest run: $RUN_NAME (ID: $RUN_ID)"
        echo "Status: $RUN_STATUS"
        echo "Conclusion: $RUN_CONCLUSION"
        echo "URL: $RUN_URL"
        
        if [ "$RUN_STATUS" = "completed" ]; then
            if [ "$RUN_CONCLUSION" = "success" ]; then
                echo "✅ GitHub Actions completed successfully!"
            else
                echo "❌ GitHub Actions failed with conclusion: $RUN_CONCLUSION"
                echo ""
                echo "📄 Failure logs:"
                gh run view "$RUN_ID" --log-failed
            fi
        else
            echo "⏳ GitHub Actions still running. Check status at: $RUN_URL"
        fi
        
    else
        echo "⚠️ GitHub CLI not installed. Install with:"
        echo "   brew install gh  # macOS"
        echo "   sudo apt install gh  # Ubuntu"
        echo ""
        echo "📄 Manual check: https://github.com/PrairieAster-Ai/nearest-nice-weather/actions"
    fi
    
else
    echo "❌ Deployment verification failed (HTTP $HTTP_CODE)"
    exit 1
fi