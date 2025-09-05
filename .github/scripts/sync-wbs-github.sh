#!/bin/bash

# WBS-GitHub Synchronization Script
# Keeps MVP-WBS.html presentation in sync with GitHub Issues progress

echo "🔄 WBS-GitHub Synchronization for MVP Development"
echo ""

# Configuration
REPO_OWNER="PrairieAster-Ai"
REPO_NAME="nearest-nice-weather"
API_BASE="https://api.github.com"
WBS_FILE="apps/web/public/presentation/MVP-WBS.html"
SYNC_REPORT="WBS-GITHUB-SYNC-$(date +%Y%m%d-%H%M%S).md"

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN required for API access"
    echo "Set with: export GITHUB_TOKEN='your_token_here'"
    exit 1
fi

echo "✅ GitHub token found"
echo "📂 Repository: $REPO_OWNER/$REPO_NAME"
echo "📄 WBS File: $WBS_FILE"
echo ""

# Function to get sprint issues
get_sprint_issues() {
    local sprint_number="$1"
    echo "📊 Fetching Sprint $sprint_number issues..."

    local issues=$(curl -s \
        -H "Authorization: token $GITHUB_TOKEN" \
        "$API_BASE/repos/$REPO_OWNER/$REPO_NAME/issues?labels=sprint-$sprint_number&state=all&per_page=100")

    echo "$issues"
}

# Function to calculate sprint progress
calculate_sprint_progress() {
    local sprint_number="$1"
    local issues=$(get_sprint_issues "$sprint_number")

    local total_points=0
    local completed_points=0
    local total_issues=0
    local completed_issues=0

    echo "🔢 Calculating Sprint $sprint_number progress..."

    # Parse issues and extract story points
    while IFS= read -r issue; do
        if [ "$issue" != "null" ] && [ -n "$issue" ]; then
            local state=$(echo "$issue" | jq -r '.state')
            local title=$(echo "$issue" | jq -r '.title')
            local body=$(echo "$issue" | jq -r '.body // ""')

            # Extract story points from issue body
            local points=$(echo "$body" | grep -i "story points" | grep -o '[0-9]\+' | head -n1)
            if [ -z "$points" ]; then
                points=0
            fi

            total_points=$((total_points + points))
            total_issues=$((total_issues + 1))

            if [ "$state" = "closed" ]; then
                completed_points=$((completed_points + points))
                completed_issues=$((completed_issues + 1))
            fi

            echo "  📝 $title: $points points ($state)"
        fi
    done < <(echo "$issues" | jq -c '.[]')

    local completion_percentage=0
    if [ $total_points -gt 0 ]; then
        completion_percentage=$(( (completed_points * 100) / total_points ))
    fi

    echo ""
    echo "📊 Sprint $sprint_number Summary:"
    echo "  Story Points: $completed_points/$total_points ($completion_percentage%)"
    echo "  Issues: $completed_issues/$total_issues"
    echo ""

    # Return values via global variables
    SPRINT_TOTAL_POINTS=$total_points
    SPRINT_COMPLETED_POINTS=$completed_points
    SPRINT_COMPLETION_PERCENTAGE=$completion_percentage
    SPRINT_TOTAL_ISSUES=$total_issues
    SPRINT_COMPLETED_ISSUES=$completed_issues
}

# Function to update WBS status
update_wbs_status() {
    local sprint_number="$1"
    local completion_percentage="$2"

    echo "📝 Updating WBS presentation for Sprint $sprint_number..."

    # Determine status emoji based on completion
    local status_emoji="📅"
    local status_text="PLANNED"

    if [ $completion_percentage -gt 0 ] && [ $completion_percentage -lt 100 ]; then
        status_emoji="🔄"
        status_text="IN PROGRESS"
    elif [ $completion_percentage -eq 100 ]; then
        status_emoji="✅"
        status_text="COMPLETED"
    fi

    echo "  Status: $status_emoji $status_text ($completion_percentage%)"

    # Note: Actual WBS file updates would require HTML parsing and modification
    # For now, we'll generate a report that can be manually applied
    echo "⚠️  WBS file update requires manual application (HTML modification)"
}

# Function to generate sync report
generate_sync_report() {
    echo "📋 Generating synchronization report..."

    cat > "$SYNC_REPORT" << EOF
# WBS-GitHub Synchronization Report

**Generated**: $(date)
**Repository**: $REPO_OWNER/$REPO_NAME
**WBS File**: $WBS_FILE

## Sprint Progress Summary

EOF

    # Process each sprint
    for sprint in {1..4}; do
        calculate_sprint_progress "$sprint"

        cat >> "$SYNC_REPORT" << EOF
### Sprint $sprint Status

- **Story Points**: $SPRINT_COMPLETED_POINTS/$SPRINT_TOTAL_POINTS ($SPRINT_COMPLETION_PERCENTAGE%)
- **Issues**: $SPRINT_COMPLETED_ISSUES/$SPRINT_TOTAL_ISSUES
- **Status**: $([ $SPRINT_COMPLETION_PERCENTAGE -eq 100 ] && echo "✅ COMPLETED" || ([ $SPRINT_COMPLETION_PERCENTAGE -gt 0 ] && echo "🔄 IN PROGRESS" || echo "📅 PLANNED"))

EOF
    done

    cat >> "$SYNC_REPORT" << EOF

## Recommended WBS Updates

Based on GitHub Issues progress, the following updates are recommended for MVP-WBS.html:

EOF

    # Add specific update recommendations
    for sprint in {1..4}; do
        calculate_sprint_progress "$sprint"
        if [ $SPRINT_COMPLETION_PERCENTAGE -ne 0 ]; then
            cat >> "$SYNC_REPORT" << EOF
- **Sprint $sprint**: Update status to $SPRINT_COMPLETION_PERCENTAGE% complete
EOF
        fi
    done

    cat >> "$SYNC_REPORT" << EOF

## File References Validation

The following file references from issues should be validated:

EOF

    # Get all issues with file references
    local all_issues=$(curl -s \
        -H "Authorization: token $GITHUB_TOKEN" \
        "$API_BASE/repos/$REPO_OWNER/$REPO_NAME/issues?state=all&per_page=100")

    echo "$all_issues" | jq -r '.[] | select(.body | contains("apps/web/")) | "- Issue #\(.number): \(.title)"' >> "$SYNC_REPORT"

    cat >> "$SYNC_REPORT" << EOF

## Next Steps

1. Review and apply WBS status updates manually
2. Validate file references in codebase
3. Update SPRINT-ALIGNMENT-COMPLETED.md with latest progress
4. Schedule next synchronization run

---

*Generated by WBS-GitHub Synchronization Script*
EOF

    echo "✅ Sync report generated: $SYNC_REPORT"
}

# Function to validate file references
validate_file_references() {
    echo "🔍 Validating file references in issues..."

    local all_issues=$(curl -s \
        -H "Authorization: token $GITHUB_TOKEN" \
        "$API_BASE/repos/$REPO_OWNER/$REPO_NAME/issues?state=all&per_page=100")

    local validation_errors=0

    while IFS= read -r issue; do
        if [ "$issue" != "null" ] && [ -n "$issue" ]; then
            local issue_number=$(echo "$issue" | jq -r '.number')
            local title=$(echo "$issue" | jq -r '.title')
            local body=$(echo "$issue" | jq -r '.body // ""')

            # Extract file paths from issue body
            local file_refs=$(echo "$body" | grep -o '`[^`]*\.\(js\|ts\|tsx\|jsx\|md\|sql\)`' | sed 's/`//g')

            if [ -n "$file_refs" ]; then
                echo "  📝 Issue #$issue_number: $title"
                while IFS= read -r file_path; do
                    if [ -f "$file_path" ]; then
                        echo "    ✅ $file_path"
                    else
                        echo "    ❌ $file_path (NOT FOUND)"
                        validation_errors=$((validation_errors + 1))
                    fi
                done <<< "$file_refs"
            fi
        fi
    done < <(echo "$all_issues" | jq -c '.[]')

    echo ""
    if [ $validation_errors -eq 0 ]; then
        echo "✅ All file references validated successfully"
    else
        echo "⚠️  Found $validation_errors invalid file references"
    fi
}

# Main execution
echo "🏃 Running WBS-GitHub Synchronization..."
echo ""

# Validate file references
validate_file_references

echo ""

# Generate comprehensive sync report
generate_sync_report

echo ""
echo "🎉 Synchronization Complete!"
echo ""
echo "📋 Generated Reports:"
echo "  - $SYNC_REPORT (comprehensive sync report)"
echo ""
echo "🔗 Next Actions:"
echo "1. Review sync report for recommended updates"
echo "2. Apply WBS presentation status changes manually"
echo "3. Update SPRINT-ALIGNMENT-COMPLETED.md"
echo "4. Commit documentation updates"
echo ""
echo "🔄 Schedule regular sync runs to maintain alignment"
