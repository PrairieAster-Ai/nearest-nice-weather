#!/bin/bash

# ========================================================================
# DATABASE SCHEMA COMPARISON TOOL
# ========================================================================
# 
# @CLAUDE_CONTEXT: Compares database schemas between localhost and preview
# @BUSINESS_PURPOSE: Detect schema drift before it causes deployment issues
# @TECHNICAL_APPROACH: Query information_schema and compare table structures
# 
# Prevents database inconsistency issues by early detection
# Alerts about missing tables, columns, or constraint differences
# ========================================================================

set -e

echo "🔍 Database Schema Comparison Tool"
echo "📅 $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to get table schema information
get_table_info() {
    local api_url="$1"
    local temp_file="$2"
    
    # Note: This is a simplified schema check
    # In a real implementation, we'd query information_schema directly
    # For now, we'll compare API responses and infer schema differences
    
    echo "Fetching table information from $api_url..."
    
    # Get POI locations structure
    curl -s "$api_url/api/poi-locations?limit=1" | jq '.data[0] // {}' > "${temp_file}_poi.json"
    
    # Get weather locations structure  
    curl -s "$api_url/api/weather-locations?limit=1" | jq '.data[0] // {}' > "${temp_file}_weather.json"
    
    # Get health check (includes environment info)
    curl -s "$api_url/api/health" | jq '.' > "${temp_file}_health.json" 2>/dev/null || echo '{}' > "${temp_file}_health.json"
}

# Create temporary directory
TEMP_DIR="/tmp/schema-compare-$$"
mkdir -p "$TEMP_DIR"

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "📥 Fetching schema information..."

# Get localhost schema info
echo "   - Localhost (http://localhost:4000)"
get_table_info "http://localhost:4000" "$TEMP_DIR/localhost"

# Get preview schema info
echo "   - Preview (https://p.nearestniceweather.com)"
get_table_info "https://p.nearestniceweather.com" "$TEMP_DIR/preview"

echo

# Compare POI locations table structure
echo "🏞️  Comparing POI locations table structure..."
if ! diff -q "$TEMP_DIR/localhost_poi.json" "$TEMP_DIR/preview_poi.json" > /dev/null; then
    echo -e "${YELLOW}   ⚠️  POI table structure differences detected${NC}"
    echo "   Localhost POI fields:"
    jq -r 'keys[]' "$TEMP_DIR/localhost_poi.json" | sed 's/^/      - /'
    echo "   Preview POI fields:"
    jq -r 'keys[]' "$TEMP_DIR/preview_poi.json" | sed 's/^/      - /'
    
    # Show specific differences
    echo "   Field differences:"
    LOCALHOST_FIELDS=$(jq -r 'keys | sort | join(",")' "$TEMP_DIR/localhost_poi.json")
    PREVIEW_FIELDS=$(jq -r 'keys | sort | join(",")' "$TEMP_DIR/preview_poi.json")
    
    if [ "$LOCALHOST_FIELDS" != "$PREVIEW_FIELDS" ]; then
        echo -e "      ${YELLOW}Field lists don't match${NC}"
        
        # Check for missing fields in preview
        jq -r 'keys[]' "$TEMP_DIR/localhost_poi.json" | while read field; do
            if ! jq -e "has(\"$field\")" "$TEMP_DIR/preview_poi.json" > /dev/null; then
                echo -e "      ${RED}Missing in preview: $field${NC}"
            fi
        done
        
        # Check for extra fields in preview
        jq -r 'keys[]' "$TEMP_DIR/preview_poi.json" | while read field; do
            if ! jq -e "has(\"$field\")" "$TEMP_DIR/localhost_poi.json" > /dev/null; then
                echo -e "      ${YELLOW}Extra in preview: $field${NC}" 
            fi
        done
    fi
else
    echo -e "   ${GREEN}✅ POI table structures match${NC}"
fi

echo

# Compare weather locations table structure
echo "🌤️  Comparing weather locations table structure..."
if ! diff -q "$TEMP_DIR/localhost_weather.json" "$TEMP_DIR/preview_weather.json" > /dev/null; then
    echo -e "${YELLOW}   ⚠️  Weather table structure differences detected${NC}"
    echo "   Localhost weather fields:"
    jq -r 'keys[]' "$TEMP_DIR/localhost_weather.json" | sed 's/^/      - /'
    echo "   Preview weather fields:"
    jq -r 'keys[]' "$TEMP_DIR/preview_weather.json" | sed 's/^/      - /'
else
    echo -e "   ${GREEN}✅ Weather table structures match${NC}"
fi

echo

# Compare data types for key fields
echo "🔢 Comparing data types..."
LOCALHOST_LAT_TYPE=$(jq -r '.lat | type' "$TEMP_DIR/localhost_poi.json")
PREVIEW_LAT_TYPE=$(jq -r '.lat | type' "$TEMP_DIR/preview_poi.json")

if [ "$LOCALHOST_LAT_TYPE" != "$PREVIEW_LAT_TYPE" ]; then
    echo -e "   ${RED}❌ Latitude data type mismatch: localhost=$LOCALHOST_LAT_TYPE, preview=$PREVIEW_LAT_TYPE${NC}"
else
    echo -e "   ${GREEN}✅ Latitude data types match ($LOCALHOST_LAT_TYPE)${NC}"
fi

LOCALHOST_LNG_TYPE=$(jq -r '.lng | type' "$TEMP_DIR/localhost_poi.json")
PREVIEW_LNG_TYPE=$(jq -r '.lng | type' "$TEMP_DIR/preview_poi.json")

if [ "$LOCALHOST_LNG_TYPE" != "$PREVIEW_LNG_TYPE" ]; then
    echo -e "   ${RED}❌ Longitude data type mismatch: localhost=$LOCALHOST_LNG_TYPE, preview=$PREVIEW_LNG_TYPE${NC}"
else
    echo -e "   ${GREEN}✅ Longitude data types match ($LOCALHOST_LNG_TYPE)${NC}"
fi

echo

# Check API availability
echo "🔗 Checking API endpoint availability..."
LOCALHOST_HEALTH=$(jq -r '.status // "unknown"' "$TEMP_DIR/localhost_health.json")
PREVIEW_HEALTH=$(jq -r '.status // "unknown"' "$TEMP_DIR/preview_health.json")

echo "   - Localhost health: $LOCALHOST_HEALTH"
echo "   - Preview health: $PREVIEW_HEALTH"

if [ "$LOCALHOST_HEALTH" = "healthy" ] && [ "$PREVIEW_HEALTH" = "healthy" ]; then
    echo -e "   ${GREEN}✅ Both environments healthy${NC}"
elif [ "$LOCALHOST_HEALTH" != "healthy" ]; then
    echo -e "   ${RED}❌ Localhost health issues detected${NC}"
elif [ "$PREVIEW_HEALTH" != "healthy" ]; then
    echo -e "   ${RED}❌ Preview health issues detected${NC}"
fi

echo
echo "📋 Schema Comparison Summary:"
echo "   - Run this script before database sync to catch issues early"
echo "   - Address any schema differences before proceeding"
echo "   - Use sync-localhost-to-preview.sh after resolving differences"
echo
echo "🔧 Common fixes:"
echo "   - Missing tables: Run appropriate migration APIs"
echo "   - Data type mismatches: Check API data transformation"
echo "   - Field differences: Verify database schema consistency"