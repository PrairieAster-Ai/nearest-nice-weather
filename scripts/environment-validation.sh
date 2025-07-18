#!/bin/bash
# =============================================================================
# ENVIRONMENT VALIDATION SCRIPT
# =============================================================================
# Purpose: Comprehensive validation of any environment deployment
# Usage: ./scripts/environment-validation.sh [ENVIRONMENT]
# Environments: localhost, preview, production, [custom-url]
# Exit codes: 0 = success, 1 = API issues, 2 = frontend issues, 3 = both
# Last updated: 2025-07-18
#
# COMMON ISSUE PATTERNS:
# - API works but frontend shows blank screen (static asset deployment failure)
# - Preview domain alias not updated (API 404s but frontend loads)
# - Database connection issues (API 500s)
# - Console errors preventing app initialization
# - Localhost proxy issues (API server not running)
# - Production authentication blocking API access
#
# BLANK SCREEN DIAGNOSTIC PROCEDURE:
# 1. Check deployment alias mapping: `vercel ls` and `vercel alias list`
# 2. Verify build timestamps match deployment ID in HTML meta tags
# 3. Test direct deployment URLs vs aliased domains
# 4. Compare JavaScript bundle hashes between working and broken environments
# 5. Check for ES module compatibility issues in older deployments
# 6. Validate React initialization by examining bundle execution order
# =============================================================================

# set -e  # Exit on any error

# Handle help flag first
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Environment Validation Script"
    echo "Usage: ./scripts/environment-validation.sh [ENVIRONMENT] [options]"
    echo
    echo "Environments:"
    echo "  localhost, local     Test http://localhost:3001"
    echo "  preview, p          Test https://p.nearestniceweather.com"
    echo "  production, prod    Test https://nearestniceweather.com"
    echo "  [custom-url]        Test any custom URL"
    echo
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  --diagnostics       Show diagnostic guidance after test failures"
    echo
    echo "Examples:"
    echo "  ./scripts/environment-validation.sh localhost                          # Test localhost"
    echo "  ./scripts/environment-validation.sh preview                            # Test preview environment"
    echo "  ./scripts/environment-validation.sh https://my-branch.vercel.app       # Test custom deployment"
    echo "  ./scripts/environment-validation.sh production --diagnostics           # Test production with diagnostics"
    echo
    echo "Exit codes:"
    echo "  0 = All tests passed"
    echo "  1 = API issues detected"
    echo "  2 = Frontend issues detected"
    echo "  3 = Both API and frontend issues detected"
    exit 0
fi

# Environment configuration
ENVIRONMENT=${1:-"preview"}
BROWSERTOOLS_URL="http://localhost:3025"
TIMEOUT=30
LOG_FILE="/tmp/environment-validation-$(date +%Y%m%d-%H%M%S).log"

# Environment URL mapping
case "$ENVIRONMENT" in
    "localhost"|"local")
        TARGET_URL="http://localhost:3001"
        ENV_NAME="Localhost Development"
        ;;
    "preview"|"p")
        TARGET_URL="https://p.nearestniceweather.com"
        ENV_NAME="Preview Environment"
        ;;
    "production"|"prod")
        TARGET_URL="https://nearestniceweather.com"
        ENV_NAME="Production Environment"
        ;;
    http*|https*)
        TARGET_URL="$ENVIRONMENT"
        ENV_NAME="Custom Environment"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: localhost, preview, production, or custom URL"
        exit 1
        ;;
esac

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
API_TESTS_PASSED=0
API_TESTS_TOTAL=0
FRONTEND_TESTS_PASSED=0
FRONTEND_TESTS_TOTAL=0
CRITICAL_ISSUES=()

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    CRITICAL_ISSUES+=("$1")
}

test_api_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_field="$3"
    
    ((API_TESTS_TOTAL++))
    log "Testing API: $description"
    
    # Test with timeout and capture both status and response
    local response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$TARGET_URL$endpoint" 2>/dev/null)
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [[ "$http_code" == "200" ]]; then
        if [[ -n "$expected_field" ]]; then
            if echo "$body" | jq -e ".$expected_field" >/dev/null 2>&1; then
                success "$description - Response valid"
                ((API_TESTS_PASSED++))
            else
                error "$description - Missing expected field: $expected_field"
            fi
        else
            success "$description - HTTP 200 OK"
            ((API_TESTS_PASSED++))
        fi
    else
        error "$description - HTTP $http_code"
        log "Response body: $body"
    fi
}

test_frontend_asset() {
    local asset_path="$1"
    local description="$2"
    
    ((FRONTEND_TESTS_TOTAL++))
    log "Testing Frontend: $description"
    
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$TARGET_URL$asset_path")
    
    if [[ "$http_code" == "200" ]]; then
        success "$description - Asset loaded"
        ((FRONTEND_TESTS_PASSED++))
    else
        error "$description - HTTP $http_code"
    fi
}

# =============================================================================
# MAIN VALIDATION TESTS
# =============================================================================

main() {
    log "🚀 Starting $ENV_NAME Validation"
    log "Target URL: $TARGET_URL"
    log "Environment: $ENVIRONMENT"
    log "Log file: $LOG_FILE"
    echo

    # =============================================================================
    # PHASE 1: API VALIDATION
    # =============================================================================
    log "📡 Phase 1: API Endpoint Validation"
    
    # Test 1: Health check - Most basic API test
    test_api_endpoint "/api/health" "Health Check" "success"
    
    # Test 2: Weather locations - Database connectivity
    test_api_endpoint "/api/weather-locations?limit=3" "Weather Locations" "data"
    
    # Test 3: Feedback system - Database write operations (skip for production)
    if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "prod" ]]; then
        local feedback_payload='{"feedback":"Validation test '$ENVIRONMENT'","rating":5,"category":"general"}'
        log "Testing API: Feedback Submission"
        ((API_TESTS_TOTAL++))
        
        local feedback_response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT \
            -X POST "$TARGET_URL/api/feedback" \
            -H "Content-Type: application/json" \
            -d "$feedback_payload" 2>/dev/null)
        
        local feedback_code="${feedback_response: -3}"
        if [[ "$feedback_code" == "200" ]]; then
            success "Feedback Submission - POST successful"
            ((API_TESTS_PASSED++))
        else
            error "Feedback Submission - HTTP $feedback_code"
        fi
    else
        warning "Feedback Submission - Skipped for production environment"
    fi
    
    echo
    
    # =============================================================================
    # PHASE 2: FRONTEND VALIDATION
    # =============================================================================
    log "🎨 Phase 2: Frontend Asset Validation"
    
    # Test 4: Main HTML page
    log "Testing Frontend: Main HTML Page"
    ((FRONTEND_TESTS_TOTAL++))
    
    local html_response=$(curl -s --max-time $TIMEOUT "$TARGET_URL/")
    if echo "$html_response" | grep -q "<!doctype html>" && echo "$html_response" | grep -q "Nearest Nice Weather"; then
        success "Main HTML Page - HTML structure valid"
        ((FRONTEND_TESTS_PASSED++))
    else
        error "Main HTML Page - Invalid HTML or missing title"
        log "HTML Response Preview: $(echo "$html_response" | head -5)"
    fi
    
    # Test 5: Static assets (favicon, manifest)
    test_frontend_asset "/favicon.ico" "Favicon"
    test_frontend_asset "/manifest.json" "PWA Manifest"
    
    # Test 6: Check for JavaScript bundle loading
    log "Testing Frontend: JavaScript Bundle Detection"
    ((FRONTEND_TESTS_TOTAL++))
    
    if echo "$html_response" | grep -q "assets.*\.js"; then
        success "JavaScript Bundle - References found in HTML"
        ((FRONTEND_TESTS_PASSED++))
    else
        error "JavaScript Bundle - No JS references found"
    fi
    
    echo
    
    # =============================================================================
    # PHASE 3: BROWSER VALIDATION (if BrowserToolsMCP available)
    # =============================================================================
    log "🌐 Phase 3: Browser Validation"
    
    # Test 7: BrowserToolsMCP availability
    if curl -s --max-time 5 "$BROWSERTOOLS_URL/identity" >/dev/null 2>&1; then
        success "BrowserToolsMCP - Server available"
        
        # Test 8: Console error detection
        log "Testing Browser: Console Error Detection"
        local console_logs=$(curl -s --max-time 10 "$BROWSERTOOLS_URL/mcp/console-logs/all?limit=10" 2>/dev/null)
        
        if echo "$console_logs" | jq -e '.logs[]' >/dev/null 2>&1; then
            warning "Console logs detected - Manual review recommended"
        else
            success "Console Error Detection - No errors found"
        fi
        
        # Test 9: Screenshot capture attempt
        log "Testing Browser: Screenshot Capability"
        local screenshot_result=$(curl -s -X POST "$BROWSERTOOLS_URL/mcp/screenshot" \
            -H "Content-Type: application/json" \
            -d '{"url":"'$TARGET_URL'","filename":"validation-'$ENVIRONMENT'-test.png"}' 2>/dev/null)
        
        if echo "$screenshot_result" | jq -e '.success' >/dev/null 2>&1; then
            success "Screenshot Capability - Available for manual verification"
        else
            warning "Screenshot Capability - May require manual browser navigation"
        fi
        
        # Test 10: Manual verification warning
        warning "IMPORTANT: Automated tests cannot detect React runtime failures"
        warning "MANUAL VERIFICATION REQUIRED: Check $TARGET_URL in browser for blank screen"
        log "Common blank screen causes:"
        log "  • JavaScript bundle loads but React fails to initialize"
        log "  • Runtime errors after page load"
        log "  • CSS/styling issues hiding content"
        log "  • React hydration mismatches"
    else
        warning "BrowserToolsMCP - Server not available (optional)"
    fi
    
    echo
    
    # =============================================================================
    # PHASE 4: COMPREHENSIVE ANALYSIS
    # =============================================================================
    log "📊 Phase 4: Results Analysis"
    
    # Calculate scores
    local api_score=0
    local frontend_score=0
    
    if [[ $API_TESTS_TOTAL -gt 0 ]]; then
        api_score=$((API_TESTS_PASSED * 100 / API_TESTS_TOTAL))
    fi
    
    if [[ $FRONTEND_TESTS_TOTAL -gt 0 ]]; then
        frontend_score=$((FRONTEND_TESTS_PASSED * 100 / FRONTEND_TESTS_TOTAL))
    fi
    
    # Report results
    log "API Tests: $API_TESTS_PASSED/$API_TESTS_TOTAL passed ($api_score%)"
    log "Frontend Tests: $FRONTEND_TESTS_PASSED/$FRONTEND_TESTS_TOTAL passed ($frontend_score%)"
    
    # Determine overall status
    if [[ $api_score -ge 80 && $frontend_score -ge 80 ]]; then
        success "OVERALL STATUS: HEALTHY - Preview environment fully operational"
        exit 0
    elif [[ $api_score -ge 80 && $frontend_score -lt 80 ]]; then
        error "OVERALL STATUS: FRONTEND ISSUES - API working but frontend problems detected"
        exit 2
    elif [[ $api_score -lt 80 && $frontend_score -ge 80 ]]; then
        error "OVERALL STATUS: API ISSUES - Frontend working but API problems detected"
        exit 1
    else
        error "OVERALL STATUS: CRITICAL ISSUES - Both API and frontend problems detected"
        exit 3
    fi
}

# =============================================================================
# DIAGNOSTIC SECTION
# =============================================================================

show_diagnostics() {
    if [[ ${#CRITICAL_ISSUES[@]} -gt 0 ]]; then
        echo
        log "🔍 DIAGNOSTIC GUIDANCE"
        echo
        
        for issue in "${CRITICAL_ISSUES[@]}"; do
            case "$issue" in
                *"frontend"*|*"HTML"*|*"JavaScript"*)
                    log "FRONTEND ISSUE DETECTED:"
                    log "  • Check if latest deployment included frontend build"
                    log "  • Verify Vercel build logs: vercel logs"
                    log "  • Check if alias points to correct deployment"
                    log "  • Manual test: curl -s $TARGET_URL/ | head -20"
                    log ""
                    log "BLANK SCREEN SPECIFIC DIAGNOSTICS:"
                    log "  • Check deployment list: vercel ls"
                    log "  • Check build timestamp: curl -s $TARGET_URL/ | grep build-timestamp"
                    log "  • Test direct deployment URL vs aliased domain"
                    log "  • Compare JS bundle hashes with working environment"
                    log "  • Check for React render call in bundle: curl -s [JS_BUNDLE_URL] | tail -20"
                    ;;
                *"API"*|*"500"*|*"404"*)
                    log "API ISSUE DETECTED:"
                    if [[ "$ENVIRONMENT" == "localhost" || "$ENVIRONMENT" == "local" ]]; then
                        log "  • Check if API server is running: curl http://localhost:4000/api/health"
                        log "  • Start development environment: ./dev-startup.sh"
                        log "  • Check proxy configuration in vite.config.ts"
                    else
                        log "  • Verify domain alias: vercel alias list"
                        log "  • Check API functions in apps/web/api/ directory"
                        log "  • Verify environment variables in Vercel dashboard"
                        log "  • Manual test: curl -s $TARGET_URL/api/health"
                    fi
                    ;;
                *"timeout"*)
                    log "TIMEOUT ISSUE DETECTED:"
                    if [[ "$ENVIRONMENT" == "localhost" || "$ENVIRONMENT" == "local" ]]; then
                        log "  • Check if development servers are running"
                        log "  • Verify no port conflicts: netstat -tuln | grep :3001"
                    else
                        log "  • Check deployment status: vercel ls"
                        log "  • Verify DNS resolution: nslookup $TARGET_URL"
                    fi
                    log "  • Test with longer timeout: curl --max-time 60"
                    ;;
            esac
            echo
        done
        
        log "ENVIRONMENT-SPECIFIC FIXES:"
        case "$ENVIRONMENT" in
            "localhost"|"local")
                log "  1. Restart development environment: ./dev-startup.sh"
                log "  2. Check port availability: netstat -tuln | grep :3001"
                log "  3. Verify proxy configuration in vite.config.ts"
                ;;
            "preview"|"p")
                log "  1. Re-run alias command: vercel alias set [DEPLOYMENT-URL] p.nearestniceweather.com"
                log "  2. Check recent deployments: vercel ls"
                log "  3. View detailed logs: vercel logs --follow"
                ;;
            "production"|"prod")
                log "  1. Check production deployment: vercel ls --prod"
                log "  2. Verify custom domain configuration"
                log "  3. Check authentication settings"
                ;;
        esac
        log "  4. Manual screenshot: Use BrowserToolsMCP to capture current state"
        echo
    fi
}

# =============================================================================
# EXECUTION
# =============================================================================

# Run main validation
main

# Show diagnostics if requested or if there are issues
if [[ "$2" == "--diagnostics" || ${#CRITICAL_ISSUES[@]} -gt 0 ]]; then
    show_diagnostics
fi