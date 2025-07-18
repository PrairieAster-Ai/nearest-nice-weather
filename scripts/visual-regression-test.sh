#!/bin/bash
# =============================================================================
# VISUAL REGRESSION TESTING SCRIPT
# =============================================================================
# Purpose: Compare screenshots before/after deployment to detect visual issues
# Usage: ./scripts/visual-regression-test.sh [ENVIRONMENT] [THRESHOLD]
# Exit codes: 0 = pass, 1 = visual regression detected, 2 = setup error
# Last updated: 2025-07-18
#
# VISUAL REGRESSION DETECTION:
# - Takes baseline screenshot before deployment
# - Takes comparison screenshot after deployment
# - Calculates pixel difference percentage
# - Alerts if difference exceeds threshold (default 5%)
# - Stores screenshots with timestamps for manual review
# =============================================================================

set -e

# Configuration
ENVIRONMENT=${1:-"preview"}
THRESHOLD=${2:-5}  # Default 5% pixel difference threshold
BROWSERTOOLS_URL="http://localhost:3025"
SCREENSHOT_DIR="/home/robertspeer/Projects/screenshots"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

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
        exit 2
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

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check ImageMagick for image comparison
    if ! command -v compare &> /dev/null; then
        error "ImageMagick 'compare' command not found"
        log "Install with: sudo apt-get install imagemagick"
        exit 2
    fi
    
    # Check BrowserToolsMCP
    if ! curl -s --max-time 5 "$BROWSERTOOLS_URL/identity" >/dev/null 2>&1; then
        error "BrowserToolsMCP server not available at $BROWSERTOOLS_URL"
        log "Start with: ./dev-startup.sh"
        exit 2
    fi
    
    success "Dependencies checked"
}

# Take screenshot using BrowserToolsMCP
take_screenshot() {
    local filename="$1"
    local description="$2"
    
    log "$description"
    
    # Navigate to URL first
    local nav_result=$(curl -s -X POST "$BROWSERTOOLS_URL/mcp/navigate" \
        -H "Content-Type: application/json" \
        -d '{"url":"'$TARGET_URL'"}' 2>/dev/null)
    
    # Wait for page to load
    sleep 3
    
    # Take screenshot
    local screenshot_result=$(curl -s -X POST "$BROWSERTOOLS_URL/mcp/screenshot" \
        -H "Content-Type: application/json" \
        -d '{"filename":"'$filename'"}' 2>/dev/null)
    
    if echo "$screenshot_result" | jq -e '.success' >/dev/null 2>&1; then
        success "Screenshot saved: $filename"
        return 0
    else
        error "Failed to take screenshot: $filename"
        return 1
    fi
}

# Calculate visual difference percentage
calculate_diff() {
    local baseline="$1"
    local comparison="$2"
    local diff_output="$3"
    
    log "Calculating visual difference..."
    
    # Use ImageMagick compare to calculate difference
    local diff_result=$(compare -metric AE "$baseline" "$comparison" "$diff_output" 2>&1 || true)
    
    # Get total pixels in baseline image
    local total_pixels=$(identify -ping -format "%[fx:w*h]" "$baseline")
    
    # Calculate percentage
    local diff_pixels=$diff_result
    local diff_percentage=$(echo "scale=2; $diff_pixels * 100 / $total_pixels" | bc -l)
    
    echo "$diff_percentage"
}

# Main visual regression test
main() {
    log "🔍 Starting Visual Regression Test"
    log "Environment: $ENV_NAME ($TARGET_URL)"
    log "Threshold: $THRESHOLD%"
    log "Screenshot Directory: $SCREENSHOT_DIR"
    echo
    
    check_dependencies
    
    # Generate filenames
    local baseline_file="$SCREENSHOT_DIR/baseline-$ENVIRONMENT-$TIMESTAMP.png"
    local comparison_file="$SCREENSHOT_DIR/comparison-$ENVIRONMENT-$TIMESTAMP.png"
    local diff_file="$SCREENSHOT_DIR/diff-$ENVIRONMENT-$TIMESTAMP.png"
    
    # Check if baseline exists from previous run
    local latest_baseline=$(ls -t "$SCREENSHOT_DIR"/baseline-$ENVIRONMENT-*.png 2>/dev/null | head -1)
    
    if [[ -z "$latest_baseline" ]]; then
        # No baseline exists, create one
        log "📸 No baseline found - creating baseline screenshot"
        take_screenshot "baseline-$ENVIRONMENT-$TIMESTAMP.png" "Taking baseline screenshot"
        
        success "Baseline created successfully"
        success "Run this script again after deployment to compare"
        exit 0
    else
        # Baseline exists, take comparison screenshot
        log "📸 Baseline found: $(basename "$latest_baseline")"
        take_screenshot "comparison-$ENVIRONMENT-$TIMESTAMP.png" "Taking comparison screenshot"
        
        # Calculate difference
        local diff_percentage=$(calculate_diff "$latest_baseline" "$comparison_file" "$diff_file")
        
        log "📊 Visual Difference Analysis"
        log "Baseline: $(basename "$latest_baseline")"
        log "Comparison: $(basename "$comparison_file")"
        log "Difference: $diff_percentage%"
        log "Threshold: $THRESHOLD%"
        echo
        
        # Compare against threshold
        if (( $(echo "$diff_percentage > $THRESHOLD" | bc -l) )); then
            error "VISUAL REGRESSION DETECTED!"
            error "Difference ($diff_percentage%) exceeds threshold ($THRESHOLD%)"
            log "📂 Files for review:"
            log "   Baseline: $latest_baseline"
            log "   Comparison: $comparison_file"
            log "   Diff: $diff_file"
            echo
            log "🔍 Possible causes:"
            log "   • Deployment broke visual layout"
            log "   • React app failing to render"
            log "   • CSS/styling changes"
            log "   • Missing static assets"
            log "   • JavaScript runtime errors"
            exit 1
        else
            success "VISUAL REGRESSION TEST PASSED"
            success "Difference ($diff_percentage%) within acceptable threshold ($THRESHOLD%)"
            log "📂 Screenshots saved for future reference"
            exit 0
        fi
    fi
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Visual Regression Testing Script"
    echo "Usage: $0 [ENVIRONMENT] [THRESHOLD]"
    echo
    echo "Environments:"
    echo "  localhost        Test http://localhost:3001"
    echo "  preview          Test https://p.nearestniceweather.com"
    echo "  production       Test https://nearestniceweather.com"
    echo
    echo "Threshold:"
    echo "  Default: 5 (5% pixel difference)"
    echo "  Range: 0-100 (percentage of different pixels)"
    echo
    echo "Examples:"
    echo "  $0 preview              # Test preview with 5% threshold"
    echo "  $0 preview 10           # Test preview with 10% threshold"
    echo "  $0 localhost 1          # Test localhost with 1% threshold"
    echo
    echo "Workflow:"
    echo "  1. Run before deployment to create baseline"
    echo "  2. Deploy changes"
    echo "  3. Run again to compare and detect regressions"
    echo
    echo "Exit codes:"
    echo "  0 = No regression detected"
    echo "  1 = Visual regression detected"
    echo "  2 = Setup error (dependencies/configuration)"
    exit 0
fi

# Run main function
main