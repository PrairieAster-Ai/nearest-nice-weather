#!/bin/bash

# Issue Context Lookup Script
# Provides complete contextual information for any GitHub issue

ISSUE_NUMBER="$1"
REPO_OWNER="PrairieAster-Ai"
REPO_NAME="nearest-nice-weather"
API_BASE="https://api.github.com"

if [ -z "$ISSUE_NUMBER" ]; then
    echo "Usage: $0 <issue_number>"
    echo "Example: $0 123"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN required"
    echo "Set with: export GITHUB_TOKEN='your_token_here'"
    exit 1
fi

echo "🔍 Getting context for GitHub Issue #$ISSUE_NUMBER"
echo ""

# Fetch issue details
ISSUE_DATA=$(curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    "$API_BASE/repos/$REPO_OWNER/$REPO_NAME/issues/$ISSUE_NUMBER")

if [ "$(echo "$ISSUE_DATA" | jq -r '.message // "none"')" != "none" ]; then
    echo "❌ Issue #$ISSUE_NUMBER not found or access denied"
    exit 1
fi

# Extract issue information
TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
STATE=$(echo "$ISSUE_DATA" | jq -r '.state')
BODY=$(echo "$ISSUE_DATA" | jq -r '.body // ""')
LABELS=$(echo "$ISSUE_DATA" | jq -r '.labels[].name' | tr '\n' ',' | sed 's/,$//')
ASSIGNEES=$(echo "$ISSUE_DATA" | jq -r '.assignees[].login' | tr '\n' ',' | sed 's/,$//')
URL=$(echo "$ISSUE_DATA" | jq -r '.html_url')

echo "📝 Issue Details:"
echo "  Title: $TITLE"
echo "  State: $STATE"
echo "  Labels: $LABELS"
echo "  Assignees: $ASSIGNEES"
echo "  URL: $URL"
echo ""

# Extract contextual information from issue body
echo "🧭 Contextual References:"

# WBS Reference
WBS_REF=$(echo "$BODY" | grep -o 'MVP-WBS\.html[^)]*' | head -n1)
if [ -n "$WBS_REF" ]; then
    echo "  📊 WBS Presentation: $WBS_REF"
    # Extract slide number
    SLIDE_NUM=$(echo "$WBS_REF" | grep -o '#/[0-9]*' | tr -d '#/')
    if [ -n "$SLIDE_NUM" ]; then
        echo "  📄 WBS Slide: $SLIDE_NUM"
        
        # Map slide to sprint
        case $SLIDE_NUM in
            3) echo "  🏃 Sprint Context: Sprint 1 - Core Weather Intelligence" ;;
            4) echo "  🏃 Sprint Context: Sprint 2 - Basic POI Discovery" ;;
            5) echo "  🏃 Sprint Context: Sprint 3 - Map Interface Foundation" ;;
            6) echo "  🏃 Sprint Context: Sprint 4 - MVP Polish and User Testing" ;;
        esac
    fi
fi

# Business Documentation References
BUSINESS_REFS=$(echo "$BODY" | grep -o 'documentation/business-plan/[^)]*' | head -n3)
if [ -n "$BUSINESS_REFS" ]; then
    echo "  💼 Business Documentation:"
    while IFS= read -r ref; do
        echo "    - $ref"
    done <<< "$BUSINESS_REFS"
fi

# File References
FILE_REFS=$(echo "$BODY" | grep -o '`[^`]*\.\(js\|ts\|tsx\|jsx\|md\|sql\)`' | sed 's/`//g' | head -n5)
if [ -n "$FILE_REFS" ]; then
    echo "  📁 Code File References:"
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            echo "    ✅ $file"
        else
            echo "    ❌ $file (NOT FOUND)"
        fi
    done <<< "$FILE_REFS"
fi

# Story Points
STORY_POINTS=$(echo "$BODY" | grep -i "story points" | grep -o '[0-9]\+' | head -n1)
if [ -n "$STORY_POINTS" ]; then
    echo "  📊 Story Points: $STORY_POINTS"
fi

# Sprint Information from Labels
SPRINT_LABEL=$(echo "$LABELS" | grep -o 'sprint-[0-9]')
if [ -n "$SPRINT_LABEL" ]; then
    SPRINT_NUM=$(echo "$SPRINT_LABEL" | tr -d 'sprint-')
    echo "  🏃 Sprint Assignment: Sprint $SPRINT_NUM"
fi

# Business Value from Labels  
BUSINESS_VALUE=$(echo "$LABELS" | grep -E '(revenue|infrastructure|ux)')
if [ -n "$BUSINESS_VALUE" ]; then
    echo "  💰 Business Value: $BUSINESS_VALUE"
fi

echo ""

# Find related issues
echo "🔗 Related Issues:"

# Parent issues (this issue referenced in others)
PARENT_ISSUES=$(curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    "$API_BASE/search/issues?q=repo:$REPO_OWNER/$REPO_NAME+%23$ISSUE_NUMBER" | \
    jq -r '.items[] | select(.number != '$ISSUE_NUMBER') | "#\(.number): \(.title)"' | head -n3)

if [ -n "$PARENT_ISSUES" ]; then
    echo "  📈 Referenced in:"
    while IFS= read -r parent; do
        echo "    $parent"
    done <<< "$PARENT_ISSUES"
fi

# Child issues (issues this one references)
CHILD_REFS=$(echo "$BODY" | grep -o '#[0-9]\+' | sort -u | head -n5)
if [ -n "$CHILD_REFS" ]; then
    echo "  📉 References:"
    for ref in $CHILD_REFS; do
        if [ "$ref" != "#$ISSUE_NUMBER" ]; then
            # Get referenced issue title
            REF_NUM=$(echo "$ref" | tr -d '#')
            REF_TITLE=$(curl -s \
                -H "Authorization: token $GITHUB_TOKEN" \
                "$API_BASE/repos/$REPO_OWNER/$REPO_NAME/issues/$REF_NUM" | \
                jq -r '.title // "Not found"')
            echo "    $ref: $REF_TITLE"
        fi
    done
fi

echo ""

# Documentation Navigation
echo "📚 Quick Navigation:"

# Local presentation URL
if [ -n "$WBS_REF" ]; then
    echo "  🖥️  WBS Presentation: http://localhost:3001/presentation/$WBS_REF"
fi

# Documentation files
if [ -f "SPRINT-ALIGNMENT-COMPLETED.md" ]; then
    echo "  📋 Sprint Alignment: ./SPRINT-ALIGNMENT-COMPLETED.md"
fi

if [ -f "PROJECT_CHARTER.md" ]; then
    echo "  📜 Project Charter: ./PROJECT_CHARTER.md"
fi

if [ -f "CLAUDE.md" ]; then
    echo "  🤖 Claude Context: ./CLAUDE.md"
fi

# Business plan navigation
if [ -d "documentation/business-plan" ]; then
    echo "  💼 Business Plan: ./documentation/business-plan/"
fi

echo ""

# Implementation Status
echo "⚡ Implementation Status:"

# Check if referenced files exist and get basic info
if [ -n "$FILE_REFS" ]; then
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            LINES=$(wc -l < "$file" 2>/dev/null || echo "0")
            MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
            echo "  📄 $file: $LINES lines, modified $MODIFIED"
        fi
    done <<< "$FILE_REFS"
fi

# Sprint progress context
if [ -n "$SPRINT_NUM" ]; then
    echo "  🏃 Sprint $SPRINT_NUM Progress: Check with ./.github/scripts/sync-wbs-github.sh"
fi

echo ""
echo "🎯 Context Summary Complete!"
echo ""
echo "💡 Next Actions:"
echo "1. Review WBS presentation slide for complete context"
echo "2. Check file references for implementation details"  
echo "3. Follow related issues for full scope understanding"
echo "4. Validate business impact and sprint alignment"