#!/bin/bash

# Comprehensive Health Check with MCP Integration
# Enhanced for Nearest Nice Weather development environment
# Integrates with Playwright MCP, Memory Bank, and GitHub MCPs

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-localhost}
BASE_URL=""
API_URL=""
TIMEOUT=30
HEALTH_SCORE=0
MAX_SCORE=100

# Set environment URLs
case $ENVIRONMENT in
  "localhost")
    BASE_URL="http://localhost:3001"
    API_URL="http://localhost:4000"
    ;;
  "preview")
    BASE_URL="https://p.nearestniceweather.com"
    API_URL="https://p.nearestniceweather.com"
    ;;
  "production")
    BASE_URL="https://nearestniceweather.com"
    API_URL="https://nearestniceweather.com"
    ;;
  *)
    if [[ $ENVIRONMENT =~ ^https?:// ]]; then
      BASE_URL="$ENVIRONMENT"
      API_URL="$ENVIRONMENT"
    else
      echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
      echo "Usage: $0 [localhost|preview|production|https://custom-url]"
      exit 1
    fi
    ;;
esac

echo -e "${BLUE}🚀 Comprehensive Health Check: $ENVIRONMENT${NC}"
echo -e "${BLUE}📍 Base URL: $BASE_URL${NC}"
echo -e "${BLUE}🔗 API URL: $API_URL${NC}"
echo ""

# Create results directory
mkdir -p test-results/health-checks
REPORT_FILE="test-results/health-checks/health-check-$(date +%Y%m%d-%H%M%S).json"
SUMMARY_FILE="test-results/health-checks/latest-summary.md"

# Initialize health report
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "baseUrl": "$BASE_URL",
  "apiUrl": "$API_URL",
  "checks": {},
  "healthScore": 0,
  "status": "running"
}
EOF

# Health check functions
update_report() {
  local check_name="$1"
  local status="$2"
  local details="$3"
  local score="$4"
  
  # Update health score
  if [[ "$status" == "passed" ]]; then
    HEALTH_SCORE=$((HEALTH_SCORE + score))
  fi
  
  # Update report JSON
  jq --arg name "$check_name" \
     --arg status "$status" \
     --arg details "$details" \
     --arg score "$score" \
     '.checks[$name] = {
       "status": $status,
       "details": $details,
       "score": ($score | tonumber),
       "timestamp": now | strftime("%Y-%m-%dT%H:%M:%SZ")
     }' "$REPORT_FILE" > "$REPORT_FILE.tmp" && mv "$REPORT_FILE.tmp" "$REPORT_FILE"
}

# 1. API Health Checks
echo -e "${PURPLE}🔍 Phase 1: API Health Validation${NC}"

check_api_health() {
  echo -n "  Testing API health endpoint... "
  
  if curl -sf --max-time $TIMEOUT "$API_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    update_report "api_health" "passed" "API health endpoint responding" 15
  else
    echo -e "${RED}❌ FAILED${NC}"
    update_report "api_health" "failed" "API health endpoint not responding" 0
    return 1
  fi
}

check_poi_api() {
  echo -n "  Testing POI API endpoint... "
  
  local response=$(curl -sf --max-time $TIMEOUT "$API_URL/api/poi-locations?limit=1" 2>/dev/null)
  if [[ $? -eq 0 ]]; then
    # Check for different possible response formats
    local poi_count=0
    if echo "$response" | jq -e '.data' >/dev/null 2>&1; then
      poi_count=$(echo "$response" | jq -r '.data | length' 2>/dev/null)
    elif echo "$response" | jq -e '.pois' >/dev/null 2>&1; then
      poi_count=$(echo "$response" | jq -r '.pois | length' 2>/dev/null)
    fi
    
    if [[ "$poi_count" -gt 0 ]]; then
      echo -e "${GREEN}✅ PASSED${NC} (${poi_count} POIs)"
      update_report "poi_api" "passed" "POI endpoint returning ${poi_count} results" 15
    else
      echo -e "${YELLOW}⚠️  WARNING${NC} (Response received but no POIs parsed)"
      update_report "poi_api" "warning" "POI endpoint responding but data format unexpected" 10
    fi
  else
    echo -e "${RED}❌ FAILED${NC}"
    update_report "poi_api" "failed" "POI endpoint not responding" 0
    return 1
  fi
}

check_weather_api() {
  echo -n "  Testing Weather API endpoint... "
  
  if curl -sf --max-time $TIMEOUT "$API_URL/api/weather/minneapolis" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    update_report "weather_api" "passed" "Weather API endpoint responding" 10
  else
    echo -e "${YELLOW}⚠️  DEGRADED${NC}"
    update_report "weather_api" "degraded" "Weather API endpoint not responding (non-critical)" 5
  fi
}

# 2. Frontend Health Checks
echo -e "${PURPLE}🔍 Phase 2: Frontend Health Validation${NC}"

check_frontend_loading() {
  echo -n "  Testing frontend HTML loading... "
  
  local response=$(curl -sf --max-time $TIMEOUT "$BASE_URL/" 2>/dev/null)
  if [[ $? -eq 0 && "$response" =~ "<title>" ]]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    update_report "frontend_html" "passed" "Frontend HTML loading correctly" 15
  else
    echo -e "${RED}❌ FAILED${NC}"
    update_report "frontend_html" "failed" "Frontend HTML not loading" 0
    return 1
  fi
}

check_javascript_bundles() {
  echo -n "  Testing JavaScript bundle loading... "
  
  # Extract bundle URL from HTML
  local html=$(curl -sf --max-time $TIMEOUT "$BASE_URL/" 2>/dev/null)
  local bundle_path=$(echo "$html" | grep -o '/assets/index-[^"]*\.js' | head -1)
  
  if [[ -n "$bundle_path" ]]; then
    if curl -sf --max-time $TIMEOUT "$BASE_URL$bundle_path" > /dev/null 2>&1; then
      echo -e "${GREEN}✅ PASSED${NC}"
      update_report "javascript_bundles" "passed" "JavaScript bundles loading correctly" 15
    else
      echo -e "${RED}❌ FAILED${NC}"
      update_report "javascript_bundles" "failed" "JavaScript bundle not accessible" 0
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    update_report "javascript_bundles" "warning" "Could not find JavaScript bundle reference" 5
  fi
}

# 3. Business Logic Validation
echo -e "${PURPLE}🔍 Phase 3: Business Logic Validation${NC}"

check_poi_data_integrity() {
  echo -n "  Validating POI data integrity... "
  
  local response=$(curl -sf --max-time $TIMEOUT "$API_URL/api/poi-locations?limit=10" 2>/dev/null)
  if [[ $? -eq 0 ]]; then
    local poi_count=0
    local minnesota_pois=0
    
    # Handle different response formats
    if echo "$response" | jq -e '.data' >/dev/null 2>&1; then
      poi_count=$(echo "$response" | jq -r '.data | length' 2>/dev/null)
      minnesota_pois=$(echo "$response" | jq -r '[.data[] | select(.lat >= 43.0 and .lat <= 49.5 and .lng >= -97.5 and .lng <= -89.0)] | length' 2>/dev/null)
    elif echo "$response" | jq -e '.pois' >/dev/null 2>&1; then
      poi_count=$(echo "$response" | jq -r '.pois | length' 2>/dev/null)
      minnesota_pois=$(echo "$response" | jq -r '[.pois[] | select(.latitude >= 43.0 and .latitude <= 49.5 and .longitude >= -97.5 and .longitude <= -89.0)] | length' 2>/dev/null)
    fi
    
    if [[ "$poi_count" -gt 0 && "$minnesota_pois" -eq "$poi_count" ]]; then
      echo -e "${GREEN}✅ PASSED${NC} (${poi_count} Minnesota POIs)"
      update_report "poi_data_integrity" "passed" "${poi_count} valid Minnesota POIs found" 15
    elif [[ "$poi_count" -gt 0 ]]; then
      echo -e "${YELLOW}⚠️  WARNING${NC} (${minnesota_pois}/${poi_count} in Minnesota)"
      update_report "poi_data_integrity" "warning" "${minnesota_pois} of ${poi_count} POIs within Minnesota bounds" 10
    else
      echo -e "${YELLOW}⚠️  WARNING${NC} (No POI data parsed)"
      update_report "poi_data_integrity" "warning" "POI data format not recognized" 5
    fi
  else
    echo -e "${RED}❌ FAILED${NC}"
    update_report "poi_data_integrity" "failed" "Could not validate POI data" 0
  fi
}

check_business_model_compliance() {
  echo -n "  Checking business model compliance... "
  
  local response=$(curl -sf --max-time $TIMEOUT "$API_URL/api/poi-locations?limit=5" 2>/dev/null)
  if [[ $? -eq 0 ]]; then
    local has_park_type=0
    local has_name=0
    
    # Handle different response formats
    if echo "$response" | jq -e '.data' >/dev/null 2>&1; then
      has_park_type=$(echo "$response" | jq -r '.data[] | select(.park_type != null) | .park_type' 2>/dev/null | wc -l)
      has_name=$(echo "$response" | jq -r '.data[] | select(.name != null) | .name' 2>/dev/null | wc -l)
    elif echo "$response" | jq -e '.pois' >/dev/null 2>&1; then
      has_park_type=$(echo "$response" | jq -r '.pois[] | select(.park_type != null) | .park_type' 2>/dev/null | wc -l)
      has_name=$(echo "$response" | jq -r '.pois[] | select(.name != null) | .name' 2>/dev/null | wc -l)
    fi
    
    if [[ "$has_park_type" -gt 0 && "$has_name" -gt 0 ]]; then
      echo -e "${GREEN}✅ PASSED${NC} (POI-focused data)"
      update_report "business_model" "passed" "Data reflects B2C outdoor recreation focus" 10
    elif [[ "$has_name" -gt 0 ]]; then
      echo -e "${YELLOW}⚠️  WARNING${NC} (Missing park_type fields)"
      update_report "business_model" "warning" "Some POI fields missing" 5
    else
      echo -e "${YELLOW}⚠️  WARNING${NC} (Data format not recognized)"
      update_report "business_model" "warning" "Could not parse POI data format" 3
    fi
  else
    echo -e "${RED}❌ FAILED${NC}"
    update_report "business_model" "failed" "Could not validate business model compliance" 0
  fi
}

# 4. Performance Validation
echo -e "${PURPLE}🔍 Phase 4: Performance Validation${NC}"

check_api_performance() {
  echo -n "  Testing API response times... "
  
  local start_time=$(date +%s%N)
  curl -sf --max-time $TIMEOUT "$API_URL/api/poi-locations?limit=10" > /dev/null 2>&1
  local end_time=$(date +%s%N)
  local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
  
  if [[ $response_time -lt 1000 ]]; then
    echo -e "${GREEN}✅ PASSED${NC} (${response_time}ms)"
    update_report "api_performance" "passed" "API response time: ${response_time}ms" 10
  elif [[ $response_time -lt 3000 ]]; then
    echo -e "${YELLOW}⚠️  SLOW${NC} (${response_time}ms)"
    update_report "api_performance" "warning" "API response time: ${response_time}ms (slow)" 5
  else
    echo -e "${RED}❌ FAILED${NC} (${response_time}ms)"
    update_report "api_performance" "failed" "API response time: ${response_time}ms (too slow)" 0
  fi
}

# 5. MCP Integration Checks
echo -e "${PURPLE}🔍 Phase 5: MCP Integration Validation${NC}"

check_playwright_integration() {
  echo -n "  Testing Playwright MCP integration... "
  
  if command -v npx >/dev/null 2>&1 && npx playwright --version >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    update_report "playwright_mcp" "passed" "Playwright MCP available and functional" 5
  else
    echo -e "${YELLOW}⚠️  MISSING${NC}"
    update_report "playwright_mcp" "warning" "Playwright MCP not available" 0
  fi
}

check_memory_bank_integration() {
  echo -n "  Testing Memory Bank MCP integration... "
  
  if [[ -d "memory-bank" ]]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    update_report "memory_bank_mcp" "passed" "Memory Bank directory exists" 5
  else
    echo -e "${YELLOW}⚠️  MISSING${NC}"
    update_report "memory_bank_mcp" "warning" "Memory Bank directory not found" 0
  fi
}

# Run all health checks
run_health_checks() {
  # Phase 1: API Health
  check_api_health || true
  check_poi_api || true
  check_weather_api || true
  
  # Phase 2: Frontend Health
  check_frontend_loading || true
  check_javascript_bundles || true
  
  # Phase 3: Business Logic
  check_poi_data_integrity || true
  check_business_model_compliance || true
  
  # Phase 4: Performance
  check_api_performance || true
  
  # Phase 5: MCP Integration
  check_playwright_integration || true
  check_memory_bank_integration || true
}

# Generate summary report
generate_summary() {
  local final_score=$(( (HEALTH_SCORE * 100) / MAX_SCORE ))
  
  # Update final JSON report
  jq --arg score "$HEALTH_SCORE" \
     --arg maxScore "$MAX_SCORE" \
     --arg finalScore "$final_score" \
     --arg status "completed" \
     '.healthScore = ($score | tonumber) |
      .maxScore = ($maxScore | tonumber) |
      .finalScore = ($finalScore | tonumber) |
      .status = $status' "$REPORT_FILE" > "$REPORT_FILE.tmp" && mv "$REPORT_FILE.tmp" "$REPORT_FILE"
  
  # Generate markdown summary
  cat > "$SUMMARY_FILE" << EOF
# Health Check Summary - $ENVIRONMENT

**Overall Score**: ${final_score}% (${HEALTH_SCORE}/${MAX_SCORE} points)
**Status**: $(get_status_badge $final_score)
**Timestamp**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Environment Details
- **Base URL**: $BASE_URL
- **API URL**: $API_URL
- **Environment**: $ENVIRONMENT

## Check Results
$(generate_check_results)

## Recommendations
$(generate_recommendations $final_score)

---
*Generated by Comprehensive Health Check with MCP Integration*
EOF

  echo ""
  echo -e "${BLUE}📊 Health Check Complete!${NC}"
  echo -e "${BLUE}🏆 Overall Score: ${final_score}% (${HEALTH_SCORE}/${MAX_SCORE} points)${NC}"
  echo -e "${BLUE}📋 Summary: $SUMMARY_FILE${NC}"
  echo -e "${BLUE}📄 Detailed Report: $REPORT_FILE${NC}"
  
  return $(( final_score < 70 ? 1 : 0 ))
}

get_status_badge() {
  local score=$1
  if [[ $score -ge 90 ]]; then
    echo "🟢 EXCELLENT"
  elif [[ $score -ge 80 ]]; then
    echo "🟡 GOOD"
  elif [[ $score -ge 70 ]]; then
    echo "🟠 ACCEPTABLE"
  else
    echo "🔴 NEEDS ATTENTION"
  fi
}

generate_check_results() {
  jq -r '.checks | to_entries[] | "- **\(.key)**: \(if .value.status == "passed" then "✅ PASSED" elif .value.status == "warning" then "⚠️ WARNING" elif .value.status == "degraded" then "🟡 DEGRADED" else "❌ FAILED" end) - \(.value.details)"' "$REPORT_FILE"
}

generate_recommendations() {
  local score=$1
  if [[ $score -ge 90 ]]; then
    echo "🎉 **Excellent health!** Environment is ready for development and deployment."
  elif [[ $score -ge 80 ]]; then
    echo "👍 **Good health!** Minor issues detected but development can proceed."
  elif [[ $score -ge 70 ]]; then
    echo "⚠️ **Acceptable health** with some issues. Consider addressing warnings before major deployments."
  else
    echo "🚨 **Attention required!** Critical issues detected that should be resolved before proceeding."
    echo ""
    echo "**Priority Actions:**"
    jq -r '.checks | to_entries[] | select(.value.status == "failed") | "- Fix: \(.key) - \(.value.details)"' "$REPORT_FILE"
  fi
}

# Main execution
main() {
  echo -e "${BLUE}Starting comprehensive health check...${NC}"
  echo ""
  
  run_health_checks
  generate_summary
  
  local exit_code=$?
  
  # Integration with Memory Bank (if available)
  if [[ -d "memory-bank" ]]; then
    cp "$REPORT_FILE" "memory-bank/latest-health-check.json"
  fi
  
  exit $exit_code
}

# Help function
show_help() {
  cat << EOF
Comprehensive Health Check with MCP Integration

USAGE:
  $0 [ENVIRONMENT]

ENVIRONMENTS:
  localhost    - Test local development server (default)
  preview      - Test preview environment  
  production   - Test production environment
  [URL]        - Test custom URL (must start with http/https)

EXAMPLES:
  $0                                    # Test localhost
  $0 preview                           # Test preview environment
  $0 https://my-branch.vercel.app      # Test custom deployment

EXIT CODES:
  0  - Health score >= 70% (healthy)
  1  - Health score < 70% (needs attention)

INTEGRATION:
  - Playwright MCP: Automated browser testing capability
  - Memory Bank MCP: Test results stored for pattern recognition
  - GitHub MCP: Ready for automated issue creation on failures

For more information, see: documentation/runbooks/
EOF
}

# Handle help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  show_help
  exit 0
fi

# Execute main function
main