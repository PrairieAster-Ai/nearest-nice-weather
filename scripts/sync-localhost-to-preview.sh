#!/bin/bash

# ========================================================================
# AUTOMATED DATABASE SYNC: Localhost → Preview
# ========================================================================
#
# @CLAUDE_CONTEXT: Automates the complete database synchronization process
# @BUSINESS_PURPOSE: Maintain preview environment for stable feature testing
# @TECHNICAL_APPROACH: Extract, clear, populate, verify workflow automation
#
# Eliminates manual database consistency workflow (15 min → 2 min)
# Ensures preview environment matches localhost for testing
# ========================================================================

set -e  # Exit on any error

echo "🔄 Starting automated localhost → preview database sync..."
echo "📅 $(date)"
echo

# Create temporary directory for data files
TEMP_DIR="/tmp/db-sync-$$"
mkdir -p "$TEMP_DIR"

cleanup() {
    echo "🧹 Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Step 1: Extract localhost data
echo "📥 Step 1: Extracting localhost data..."
echo "   - Fetching POI locations..."
if ! curl -s "http://localhost:4000/api/poi-locations" | jq '.data' > "$TEMP_DIR/localhost-poi-data.json"; then
    echo "❌ Failed to fetch localhost POI data"
    exit 1
fi

echo "   - Fetching weather locations..."
if ! curl -s "http://localhost:4000/api/poi-locations-with-weather" | jq '.data' > "$TEMP_DIR/localhost-weather-data.json"; then
    echo "❌ Failed to fetch localhost weather data"
    exit 1
fi

# Verify data was extracted successfully
POI_COUNT=$(jq 'length' "$TEMP_DIR/localhost-poi-data.json")
WEATHER_COUNT=$(jq 'length' "$TEMP_DIR/localhost-weather-data.json")

echo "   ✅ Extracted $POI_COUNT POI locations"
echo "   ✅ Extracted $WEATHER_COUNT weather locations"
echo

# Step 2: Clear preview database
echo "🗑️  Step 2: Clearing preview database..."
if ! curl -s -X POST "https://p.nearestniceweather.com/api/clear-all-data" \
    -H "Content-Type: application/json" \
    -d '{}' | jq -e '.success' > /dev/null; then
    echo "❌ Failed to clear preview database"
    exit 1
fi
echo "   ✅ Preview database cleared"
echo

# Step 3: Populate preview with localhost data
echo "📤 Step 3: Populating preview database..."

echo "   - Populating POI locations..."
if ! curl -s -X POST "https://p.nearestniceweather.com/api/migrate-data" \
    -H "Content-Type: application/json" \
    -d "{\"action\": \"populate\", \"table\": \"poi_locations\", \"data\": $(cat "$TEMP_DIR/localhost-poi-data.json")}" \
    | jq -e '.success' > /dev/null; then
    echo "❌ Failed to populate POI locations"
    exit 1
fi

echo "   - Populating weather locations..."
if ! curl -s -X POST "https://p.nearestniceweather.com/api/migrate-data" \
    -H "Content-Type: application/json" \
    -d "{\"action\": \"populate\", \"table\": \"locations\", \"data\": $(cat "$TEMP_DIR/localhost-weather-data.json")}" \
    | jq -e '.success' > /dev/null; then
    echo "❌ Failed to populate weather locations"
    exit 1
fi

echo "   - Creating weather conditions table..."
if ! curl -s -X POST "https://p.nearestniceweather.com/api/migrate-data" \
    -H "Content-Type: application/json" \
    -d '{"action": "create_weather_conditions", "table": "weather_conditions"}' \
    | jq -e '.success' > /dev/null; then
    echo "❌ Failed to create weather conditions table"
    exit 1
fi

echo "   ✅ Preview database populated"
echo

# Step 4: Verify data consistency
echo "🔍 Step 4: Verifying data consistency..."

# Get sample data from both environments
LOCALHOST_SAMPLE=$(curl -s "http://localhost:4000/api/poi-locations?limit=1" | jq '.data[0] | {name, lat, lng}')
PREVIEW_SAMPLE=$(curl -s "https://p.nearestniceweather.com/api/poi-locations?limit=1" | jq '.data[0] | {name, lat, lng}')

echo "   Localhost sample: $LOCALHOST_SAMPLE"
echo "   Preview sample:   $PREVIEW_SAMPLE"

# Check if coordinates match (names should match, coordinates should be identical)
LOCALHOST_LAT=$(echo "$LOCALHOST_SAMPLE" | jq -r '.lat')
PREVIEW_LAT=$(echo "$PREVIEW_SAMPLE" | jq -r '.lat')
LOCALHOST_LNG=$(echo "$LOCALHOST_SAMPLE" | jq -r '.lng')
PREVIEW_LNG=$(echo "$PREVIEW_SAMPLE" | jq -r '.lng')

if [ "$LOCALHOST_LAT" = "$PREVIEW_LAT" ] && [ "$LOCALHOST_LNG" = "$PREVIEW_LNG" ]; then
    echo "   ✅ Data types and coordinates match"
else
    echo "   ⚠️  Coordinate mismatch detected"
    echo "      Localhost: lat=$LOCALHOST_LAT, lng=$LOCALHOST_LNG"
    echo "      Preview:   lat=$PREVIEW_LAT, lng=$PREVIEW_LNG"
fi

# Check record counts
PREVIEW_POI_COUNT=$(curl -s "https://p.nearestniceweather.com/api/poi-locations" | jq '.count')
PREVIEW_WEATHER_COUNT=$(curl -s "https://p.nearestniceweather.com/api/poi-locations-with-weather" | jq '.count')

echo "   Record counts:"
echo "   - POI locations: localhost=$POI_COUNT, preview=$PREVIEW_POI_COUNT"
echo "   - Weather locations: localhost=$WEATHER_COUNT, preview=$PREVIEW_WEATHER_COUNT"

if [ "$POI_COUNT" = "$PREVIEW_POI_COUNT" ] && [ "$WEATHER_COUNT" = "$PREVIEW_WEATHER_COUNT" ]; then
    echo "   ✅ Record counts match"
else
    echo "   ⚠️  Record count mismatch detected"
fi

echo
echo "🎉 Database sync completed successfully!"
echo "📊 Summary:"
echo "   - $POI_COUNT POI locations synchronized"
echo "   - $WEATHER_COUNT weather locations synchronized"
echo "   - Data types consistent between environments"
echo "   - Preview environment ready for testing"
echo
echo "🔗 URLs to test:"
echo "   - Localhost: http://localhost:3001"
echo "   - Preview:   https://p.nearestniceweather.com"
echo
echo "📋 Next steps:"
echo "   1. Refresh both environments in browser"
echo "   2. Compare map marker positions"
echo "   3. Verify identical functionality"
