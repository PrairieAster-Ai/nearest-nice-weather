#!/bin/bash
# Database Migration Helper Script
# Usage: ./scripts/migrate.sh [up|down] [migration-name] [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIGRATIONS_DIR="database/migrations"
LOCALHOST_URL="http://localhost:4000/api/db-migrate"
PREVIEW_URL="https://p.nearestniceweather.com/api/db-migrate"
PRODUCTION_URL="https://www.nearestniceweather.com/api/db-migrate"

# Functions
print_usage() {
    echo -e "${BLUE}Database Migration Helper${NC}"
    echo ""
    echo "Usage: $0 [up|down] [migration-name] [environment]"
    echo ""
    echo "Parameters:"
    echo "  up|down        - Migration direction"
    echo "  migration-name - Name of migration (without -up.sql/-down.sql)"
    echo "  environment    - localhost|preview|production"
    echo ""
    echo "Examples:"
    echo "  $0 up 2025-07-25-add-user-preferences localhost"
    echo "  $0 down 2025-07-25-add-user-preferences preview"
}

validate_params() {
    if [[ "$1" != "up" && "$1" != "down" ]]; then
        echo -e "${RED}Error: Direction must be 'up' or 'down'${NC}"
        print_usage
        exit 1
    fi

    if [[ -z "$2" ]]; then
        echo -e "${RED}Error: Migration name is required${NC}"
        print_usage
        exit 1
    fi

    if [[ "$3" != "localhost" && "$3" != "preview" && "$3" != "production" ]]; then
        echo -e "${RED}Error: Environment must be localhost|preview|production${NC}"
        print_usage
        exit 1
    fi
}

get_api_url() {
    case "$1" in
        "localhost") echo "$LOCALHOST_URL" ;;
        "preview") echo "$PREVIEW_URL" ;;
        "production") echo "$PRODUCTION_URL" ;;
    esac
}

apply_migration() {
    local direction=$1
    local migration_name=$2
    local environment=$3

    local sql_file="${MIGRATIONS_DIR}/${migration_name}-${direction}.sql"
    local api_url=$(get_api_url "$environment")

    # Check if SQL file exists
    if [[ ! -f "$sql_file" ]]; then
        echo -e "${RED}Error: Migration file not found: $sql_file${NC}"
        exit 1
    fi

    echo -e "${BLUE}📊 Applying Migration${NC}"
    echo -e "  Direction: ${YELLOW}$direction${NC}"
    echo -e "  Migration: ${YELLOW}$migration_name${NC}"
    echo -e "  Environment: ${YELLOW}$environment${NC}"
    echo -e "  File: ${YELLOW}$sql_file${NC}"
    echo ""

    # Read SQL file
    local migration_sql=$(cat "$sql_file")

    # Confirmation for production
    if [[ "$environment" == "production" ]]; then
        echo -e "${RED}⚠️  WARNING: This will modify the PRODUCTION database!${NC}"
        echo -e "${RED}⚠️  Preview and production share the same database.${NC}"
        echo ""
        read -p "Type 'APPLY-TO-PRODUCTION' to continue: " confirm
        if [[ "$confirm" != "APPLY-TO-PRODUCTION" ]]; then
            echo -e "${YELLOW}Migration cancelled${NC}"
            exit 1
        fi
    fi

    # Apply migration
    echo -e "${BLUE}🚀 Executing migration...${NC}"

    # Create JSON payload properly
    local json_payload=$(jq -n \
        --arg sql "$migration_sql" \
        --arg name "$migration_name" \
        --arg dir "$direction" \
        '{migration_sql: $sql, migration_name: $name, direction: $dir}')

    local response=$(curl -s -X POST "$api_url" \
        -H "Content-Type: application/json" \
        -d "$json_payload")

    # Parse response
    local success=$(echo "$response" | jq -r '.success // false')

    if [[ "$success" == "true" ]]; then
        echo -e "${GREEN}✅ Migration applied successfully!${NC}"
        echo "$response" | jq .
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        echo "$response" | jq .
        exit 1
    fi
}

# Main execution
if [[ $# -lt 3 ]]; then
    print_usage
    exit 1
fi

validate_params "$1" "$2" "$3"
apply_migration "$1" "$2" "$3"
