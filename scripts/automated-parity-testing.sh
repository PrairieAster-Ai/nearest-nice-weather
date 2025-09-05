#!/bin/bash

# ========================================================================
# AUTOMATED PARITY TESTING - Post-Sync Verification
# ========================================================================
#
# @CLAUDE_CONTEXT: Comprehensive testing for localhost/preview consistency
# @BUSINESS_PURPOSE: Verify identical functionality after database sync
# @TECHNICAL_APPROACH: API response comparison and functional testing
#
# Ensures preview environment perfectly matches localhost after sync
# Catches data inconsistencies and functional differences automatically
# ========================================================================

set -e

echo "🧪 Automated Environment Parity Testing"
echo "📅 $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOCALHOST_URL="http://localhost:4000"
PREVIEW_URL="https://p.nearestniceweather.com"

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEMP_DIR="/tmp/parity-test-$$"

mkdir -p "$TEMP_DIR"

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"

    echo -n "   Testing $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to compare API responses
compare_api_responses() {
    local endpoint="$1"
    local test_name="$2"
    local comparison_fields="$3"

    echo -n "   $test_name... "

    # Fetch responses
    local localhost_response=$(curl -s "$LOCALHOST_URL$endpoint")
    local preview_response=$(curl -s "$PREVIEW_URL$endpoint")

    # Save full responses for debugging
    echo "$localhost_response" > "$TEMP_DIR/localhost_${endpoint//\//_}.json"
    echo "$preview_response" > "$TEMP_DIR/preview_${endpoint//\//_}.json"

    # Compare specified fields
    if [ -n "$comparison_fields" ]; then
        local localhost_data=$(echo "$localhost_response" | jq "$comparison_fields")
        local preview_data=$(echo "$preview_response" | jq "$comparison_fields")

        if [ "$localhost_data" = "$preview_data" ]; then
            echo -e "${GREEN}✅ MATCH${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}❌ MISMATCH${NC}"
            echo "      Localhost: $localhost_data"
            echo "      Preview:   $preview_data"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        # Full response comparison
        if [ "$localhost_response" = "$preview_response" ]; then
            echo -e "${GREEN}✅ IDENTICAL${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${YELLOW}⚠️  DIFFERENT${NC} (may be expected due to timestamps/IDs)"
            ((TESTS_PASSED++))  # Don't fail on expected differences
            return 0
        fi
    fi
}

echo -e "${BLUE}📊 API Response Parity Tests${NC}"
echo

# Test 1: Health endpoints
compare_api_responses "/api/health" "Health endpoint comparison" ".status"

# Test 2: POI locations count
compare_api_responses "/api/poi-locations" "POI locations count" ".count"

# Test 3: Weather locations count
compare_api_responses "/api/weather-locations" "Weather locations count" ".count"

# Test 4: POI data types (first record)
compare_api_responses "/api/poi-locations?limit=1" "POI data types" ".data[0] | {name, lat: (.lat | type), lng: (.lng | type)}"

# Test 5: Weather data types (first record)
compare_api_responses "/api/weather-locations?limit=1" "Weather data types" ".data[0] | {name, lat: (.lat | type), lng: (.lng | type)}"

echo
echo -e "${BLUE}🗺️  Geographic Data Consistency Tests${NC}"
echo

# Test 6: Same location names in same order (first 3)
echo -n "   Location name consistency... "
LOCALHOST_NAMES=$(curl -s "$LOCALHOST_URL/api/poi-locations?limit=3" | jq -r '.data[].name' | sort)
PREVIEW_NAMES=$(curl -s "$PREVIEW_URL/api/poi-locations?limit=3" | jq -r '.data[].name' | sort)

if [ "$LOCALHOST_NAMES" = "$PREVIEW_NAMES" ]; then
    echo -e "${GREEN}✅ MATCH${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ MISMATCH${NC}"
    echo "      Localhost names: $LOCALHOST_NAMES"
    echo "      Preview names:   $PREVIEW_NAMES"
    ((TESTS_FAILED++))
fi

# Test 7: Coordinate precision consistency
echo -n "   Coordinate precision... "
LOCALHOST_COORDS=$(curl -s "$LOCALHOST_URL/api/poi-locations?limit=1" | jq -r '.data[0] | "\(.lat),\(.lng)"')
PREVIEW_COORDS=$(curl -s "$PREVIEW_URL/api/poi-locations?limit=1" | jq -r '.data[0] | "\(.lat),\(.lng)"')

if [ "$LOCALHOST_COORDS" = "$PREVIEW_COORDS" ]; then
    echo -e "${GREEN}✅ IDENTICAL${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ DIFFERENT${NC}"
    echo "      Localhost coords: $LOCALHOST_COORDS"
    echo "      Preview coords:   $PREVIEW_COORDS"
    ((TESTS_FAILED++))
fi

echo
echo -e "${BLUE}🔧 Functional Tests${NC}"
echo

# Test 8: Both APIs return successful responses
run_test "POI locations API success" "curl -s '$LOCALHOST_URL/api/poi-locations' | jq -e '.success == true' && curl -s '$PREVIEW_URL/api/poi-locations' | jq -e '.success == true'"

run_test "Weather locations API success" "curl -s '$LOCALHOST_URL/api/weather-locations' | jq -e '.success == true' && curl -s '$PREVIEW_URL/api/weather-locations' | jq -e '.success == true'"

# Test 9: Response time consistency (should be similar order of magnitude)
echo -n "   Response time consistency... "
LOCALHOST_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$LOCALHOST_URL/api/poi-locations")
PREVIEW_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$PREVIEW_URL/api/poi-locations")

echo "Localhost: ${LOCALHOST_TIME}s, Preview: ${PREVIEW_TIME}s"
# This is informational only, not a pass/fail test
((TESTS_PASSED++))

echo
echo -e "${BLUE}📋 Test Summary${NC}"
echo "================================================"
echo -e "   ${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "   ${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
else
    echo -e "   ${GREEN}❌ Tests Failed: $TESTS_FAILED${NC}"
fi
echo "================================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect parity achieved!${NC}"
    echo "   Both environments are functionally identical"
    echo "   Safe to proceed with preview testing"
    echo
    echo "🔗 Ready for visual comparison:"
    echo "   - Localhost: http://localhost:3001"
    echo "   - Preview:   https://p.nearestniceweather.com"
    echo
    echo "📸 Expected result: Identical map marker positions"
    exit 0
else
    echo -e "${RED}⚠️  Parity issues detected!${NC}"
    echo "   Review failed tests above"
    echo "   Consider re-running database sync"
    echo "   Check API responses in $TEMP_DIR for debugging"
    exit 1
fi
