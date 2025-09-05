#!/bin/bash
# ========================================================================
# POI DATA IMPORT RUNNER - 1000+ Minnesota Parks
# ========================================================================
#
# Automated script to run the POI data pipeline with proper environment setup
# Handles API keys, database connections, and multi-environment deployment
#
# Usage:
#   ./scripts/run-poi-import.sh                    # Import to development only
#   ./scripts/run-poi-import.sh --all-environments # Import to dev/preview/prod
#   ./scripts/run-poi-import.sh --dry-run          # Test without database changes
# ========================================================================

set -e  # Exit on any error

# Get script directory for relative paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 POI Data Import Runner"
echo "========================"
echo "Project: $PROJECT_DIR"
echo "Script: $SCRIPT_DIR"

# Check for required dependencies
echo "🔍 Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "📄 Loading .env file..."
    set -a  # Automatically export all variables
    source "$PROJECT_DIR/.env"
    set +a
else
    echo "⚠️  No .env file found, using system environment variables"
fi

# Validate required environment variables
echo "🔐 Validating environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is required"
    echo "Please set DATABASE_URL in .env file or environment"
    exit 1
fi

echo "✅ DATABASE_URL configured"

# Optional API keys (with warnings)
if [ -z "$NPS_API_KEY" ]; then
    echo "⚠️  NPS_API_KEY not found - National Parks data will be skipped"
    echo "   Get API key from: https://www.nps.gov/subjects/digital/nps-data-api.htm"
fi

if [ -z "$RIDB_API_KEY" ]; then
    echo "⚠️  RIDB_API_KEY not found - Recreation.gov data will be skipped"
    echo "   Get API key from: https://ridb.recreation.gov/"
fi

# Parse command line arguments
DRY_RUN=false
ALL_ENVIRONMENTS=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            echo "🧪 DRY RUN MODE: No database changes will be made"
            shift
            ;;
        --all-environments)
            ALL_ENVIRONMENTS=true
            echo "🌍 ALL ENVIRONMENTS MODE: Will sync to dev/preview/prod"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --dry-run             Test run without database changes"
            echo "  --all-environments    Sync to all database branches"
            echo "  -h, --help           Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DATABASE_URL         Required: Primary database connection"
            echo "  DATABASE_URL_PREVIEW Optional: Preview environment database"
            echo "  DATABASE_URL_PRODUCTION Optional: Production environment database"
            echo "  NPS_API_KEY          Optional: National Park Service API key"
            echo "  RIDB_API_KEY         Optional: Recreation.gov API key"
            exit 0
            ;;
        *)
            echo "❌ Unknown argument: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Install required dependencies
echo "📦 Installing/checking required packages..."
cd "$PROJECT_DIR"
npm install @neondatabase/serverless node-fetch --silent

if [ "$DRY_RUN" = true ]; then
    echo "🧪 DRY RUN: Would execute POI data pipeline now"
    echo "   - Fetch data from APIs"
    echo "   - Normalize to standard schema"
    echo "   - Create/update poi_locations_expanded table"
    if [ "$ALL_ENVIRONMENTS" = true ]; then
        echo "   - Sync to development database"
        echo "   - Sync to preview database"
        echo "   - Sync to production database"
    else
        echo "   - Sync to development database only"
    fi
    echo "🧪 DRY RUN COMPLETE"
    exit 0
fi

# Execute the POI data pipeline
echo "🎯 Executing POI Data Pipeline..."
cd "$PROJECT_DIR"

if [ "$ALL_ENVIRONMENTS" = true ]; then
    echo "🌍 Multi-environment sync enabled"
    export SYNC_ALL_ENVIRONMENTS=true
fi

# Run the pipeline
node scripts/poi-data-pipeline.js

# Verify results
echo "✅ POI Import Complete!"
echo ""
echo "📊 Next Steps:"
echo "1. Verify data in your database"
echo "2. Test API endpoints: /api/poi-locations"
echo "3. Check frontend map display"
echo "4. Monitor for any data quality issues"
echo ""
echo "🔍 Quick verification commands:"
echo "   # Check record count"
echo "   curl 'http://localhost:4000/api/poi-locations?limit=5' | jq '.count'"
echo ""
echo "   # View sample records"
echo "   curl 'http://localhost:4000/api/poi-locations?limit=3' | jq '.data[].name'"

echo ""
echo "🎉 POI Data Import Runner Complete!"
