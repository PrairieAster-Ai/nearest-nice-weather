#!/bin/bash
# =============================================================================
# BLANK SCREEN DIAGNOSTIC SCRIPT
# =============================================================================
# Purpose: Diagnose and fix blank screen issues in Vercel deployments
# Usage: ./scripts/blank-screen-diagnostic.sh [ENVIRONMENT]
# Last updated: 2025-07-18
#
# COMMON BLANK SCREEN CAUSES:
# 1. Preview domain alias pointing to wrong deployment
# 2. Build timestamp mismatch between HTML and deployment
# 3. JavaScript bundle compatibility issues
# 4. React initialization failures
# 5. ES module vs CommonJS compatibility problems
# =============================================================================

set -e

# Configuration
ENVIRONMENT=${1:-"preview"}
BROWSERTOOLS_URL="http://localhost:3025"

# Environment URL mapping
case "$ENVIRONMENT" in
    "localhost"|"local")
        TARGET_URL="http://localhost:3001"
        ENV_NAME="Localhost"
        ;;
    "preview"|"p")
        TARGET_URL="https://p.nearestniceweather.com"
        ENV_NAME="Preview"
        ;;
    "production"|"prod")
        TARGET_URL="https://nearestniceweather.com"
        ENV_NAME="Production"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: localhost, preview, production"
        exit 1
        ;;
esac

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# =============================================================================
# BLANK SCREEN DIAGNOSTIC FUNCTIONS
# =============================================================================

check_deployment_alias() {
    log "🔍 Step 1: Checking deployment alias mapping"

    if [[ "$ENVIRONMENT" == "preview" ]]; then
        log "Getting recent deployments..."
        local deployments=$(vercel ls 2>/dev/null | head -10)
        echo "$deployments"

        local latest_deployment=$(echo "$deployments" | grep "Ready.*Preview" | head -1 | awk '{print $3}')
        if [[ -n "$latest_deployment" ]]; then
            success "Latest preview deployment: $latest_deployment"

            log "Checking current alias..."
            local current_html=$(curl -s "$TARGET_URL/" | head -20)
            local build_timestamp=$(echo "$current_html" | grep -o 'build-timestamp.*content="[^"]*"' | cut -d'"' -f2)
            local deployment_id=$(echo "$current_html" | grep -o 'deployment-id.*content="[^"]*"' | cut -d'"' -f2)

            log "Current build timestamp: $build_timestamp"
            log "Current deployment ID: $deployment_id"

            # Check if alias needs updating
            if [[ "$deployment_id" == "local-"* ]]; then
                error "Deployment ID shows local build - alias may be pointing to wrong deployment"
                warning "Consider running: vercel alias set $latest_deployment p.nearestniceweather.com"
                return 1
            else
                success "Deployment ID looks correct"
            fi
        else
            error "No recent preview deployments found"
            return 1
        fi
    else
        log "Skipping alias check for $ENVIRONMENT environment"
    fi

    return 0
}

check_html_structure() {
    log "🔍 Step 2: Checking HTML structure and asset loading"

    local html_content=$(curl -s "$TARGET_URL/")

    # Check for root div
    if echo "$html_content" | grep -q '<div id="root">'; then
        success "Root div found in HTML"
    else
        error "No root div found - HTML structure issue"
        return 1
    fi

    # Check for JavaScript bundle references
    local js_bundles=$(echo "$html_content" | grep -o 'assets/[^"]*\.js' | head -3)
    if [[ -n "$js_bundles" ]]; then
        success "JavaScript bundles found in HTML:"
        echo "$js_bundles" | while read bundle; do
            log "  • $bundle"
        done
    else
        error "No JavaScript bundles found in HTML"
        return 1
    fi

    return 0
}

check_javascript_bundles() {
    log "🔍 Step 3: Checking JavaScript bundle execution"

    local html_content=$(curl -s "$TARGET_URL/")
    local main_bundle=$(echo "$html_content" | grep -o 'assets/index-[^"]*\.js' | head -1)

    if [[ -n "$main_bundle" ]]; then
        log "Testing main bundle: $main_bundle"

        # Check if bundle is accessible
        local bundle_status=$(curl -s -w "%{http_code}" -o /dev/null "$TARGET_URL/$main_bundle")
        if [[ "$bundle_status" == "200" ]]; then
            success "Main bundle accessible (HTTP 200)"

            # Check for React render call
            local bundle_tail=$(curl -s "$TARGET_URL/$main_bundle" | tail -20)
            if echo "$bundle_tail" | grep -q "createRoot.*render"; then
                success "React render call found in bundle"
            else
                error "No React render call found - bundle may be incomplete"
                return 1
            fi
        else
            error "Main bundle not accessible (HTTP $bundle_status)"
            return 1
        fi
    else
        error "No main bundle found in HTML"
        return 1
    fi

    return 0
}

check_react_initialization() {
    log "🔍 Step 4: Checking React initialization"

    # Check if BrowserToolsMCP is available for DOM inspection
    if curl -s --max-time 5 "$BROWSERTOOLS_URL/identity" >/dev/null 2>&1; then
        success "BrowserToolsMCP available for DOM inspection"

        # Try to get current state
        local console_logs=$(curl -s "$BROWSERTOOLS_URL/mcp/console-logs/all?limit=5" 2>/dev/null)
        if echo "$console_logs" | jq -e '.logs[]' >/dev/null 2>&1; then
            warning "Console logs detected - may indicate runtime errors"
            echo "$console_logs" | jq -r '.logs[].message' | head -3
        else
            success "No console errors detected"
        fi
    else
        warning "BrowserToolsMCP not available - cannot check DOM state"
    fi

    return 0
}

fix_preview_alias() {
    log "🔧 Attempting to fix preview alias..."

    if [[ "$ENVIRONMENT" == "preview" ]]; then
        local latest_deployment=$(vercel ls 2>/dev/null | grep "Ready.*Preview" | head -1 | awk '{print $3}')

        if [[ -n "$latest_deployment" ]]; then
            log "Updating alias to point to: $latest_deployment"
            vercel alias set "$latest_deployment" p.nearestniceweather.com

            success "Alias updated! Waiting 10 seconds for DNS propagation..."
            sleep 10

            # Re-test the environment
            local new_html=$(curl -s "$TARGET_URL/" | head -10)
            if echo "$new_html" | grep -q '<div id="root">'; then
                success "Fix successful - HTML structure now loading"
                return 0
            else
                error "Fix may not have worked - HTML still problematic"
                return 1
            fi
        else
            error "No suitable deployment found for alias update"
            return 1
        fi
    else
        log "Alias fix only applies to preview environment"
        return 0
    fi
}

# =============================================================================
# MAIN DIAGNOSTIC WORKFLOW
# =============================================================================

main() {
    log "🚀 Starting Blank Screen Diagnostic for $ENV_NAME"
    log "Target URL: $TARGET_URL"
    echo

    local issues=0

    # Run diagnostic steps
    if ! check_deployment_alias; then
        ((issues++))
    fi
    echo

    if ! check_html_structure; then
        ((issues++))
    fi
    echo

    if ! check_javascript_bundles; then
        ((issues++))
    fi
    echo

    check_react_initialization
    echo

    # Attempt fix if issues found
    if [[ $issues -gt 0 ]]; then
        log "⚠️  $issues issues detected - attempting fix..."

        if fix_preview_alias; then
            success "🎉 Fix successful! The app should now be working."
            log "Manual verification recommended: Check $TARGET_URL in browser"
        else
            error "🔥 Fix failed - manual intervention required"
            log "Check Vercel deployment logs: vercel logs"
        fi
    else
        success "🎉 No issues detected - app should be working correctly"
        log "If you're still seeing a blank screen, check browser cache or try incognito mode"
    fi

    return $issues
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Blank Screen Diagnostic Script"
    echo "Usage: $0 [ENVIRONMENT]"
    echo
    echo "Environments:"
    echo "  localhost        Test http://localhost:3001"
    echo "  preview          Test https://p.nearestniceweather.com"
    echo "  production       Test https://nearestniceweather.com"
    echo
    echo "This script diagnoses and fixes common blank screen issues:"
    echo "  • Preview domain alias pointing to wrong deployment"
    echo "  • Build timestamp mismatches"
    echo "  • JavaScript bundle loading failures"
    echo "  • React initialization problems"
    echo
    echo "Example: $0 preview"
    exit 0
fi

# Run main function
main
