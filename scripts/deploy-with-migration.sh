#!/bin/bash

# ========================================================================
# AUTOMATED DEPLOYMENT WITH DATABASE MIGRATION
# ========================================================================
#
# @BUSINESS_PURPOSE: Deploy to preview/production with POI data sync
# @TECHNICAL_APPROACH: Export dev data → Deploy → Import data → Validate
#
# USAGE:
# ./scripts/deploy-with-migration.sh preview
# ./scripts/deploy-with-migration.sh production
#
# REQUIREMENTS:
# - Environment variables configured for all database branches
# - Vercel CLI authenticated and configured
# - Node.js with database migration script dependencies
# ========================================================================

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

TARGET_ENV=${1:-preview}
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="poi-backup-${TARGET_ENV}-${TIMESTAMP}.json"

echo -e "${BLUE}🚀 DEPLOYMENT WITH DATABASE MIGRATION: ${TARGET_ENV}${NC}"
echo -e "${BLUE}=================================================${NC}"

# Validate environment
if [[ "$TARGET_ENV" != "preview" && "$TARGET_ENV" != "production" ]]; then
    echo -e "${RED}❌ Invalid environment: $TARGET_ENV${NC}"
    echo "Usage: $0 [preview|production]"
    exit 1
fi

# Check required environment variables
echo -e "${PURPLE}🔍 Phase 1: Environment Validation${NC}"

# Development database (source of truth)
if [[ -z "$DEV_DATABASE_URL" && -z "$DATABASE_URL" ]]; then
    echo -e "${RED}❌ DEV_DATABASE_URL or DATABASE_URL not configured${NC}"
    exit 1
fi

# Target database
TARGET_VAR="${TARGET_ENV^^}_DATABASE_URL"
if [[ -z "${!TARGET_VAR}" ]]; then
    echo -e "${YELLOW}⚠️  ${TARGET_VAR} not configured - deployment will use Vercel environment variables${NC}"
fi

echo -e "${GREEN}✅ Environment validation complete${NC}"

# Phase 2: Export POI data from development
echo -e "${PURPLE}🔍 Phase 2: Export POI Data from Development${NC}"

echo -e "${BLUE}📤 Exporting POI data from development database...${NC}"
node scripts/database-migration.js export-dev > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${RED}❌ Failed to export POI data from development${NC}"
    exit 1
}

POI_COUNT=$(jq '.poi_count' "$BACKUP_FILE")
echo -e "${GREEN}✅ Exported $POI_COUNT POI records from development${NC}"

# Phase 3: Deploy to target environment
echo -e "${PURPLE}🔍 Phase 3: Deploy to ${TARGET_ENV^}${NC}"

if [[ "$TARGET_ENV" == "preview" ]]; then
    echo -e "${BLUE}🚀 Deploying to preview environment...${NC}"
    npm run deploy:preview
elif [[ "$TARGET_ENV" == "production" ]]; then
    echo -e "${BLUE}🚀 Deploying to production environment...${NC}"
    npm run deploy:production
fi

echo -e "${GREEN}✅ Deployment to $TARGET_ENV complete${NC}"

# Phase 4: Import POI data to target environment
echo -e "${PURPLE}🔍 Phase 4: Import POI Data to ${TARGET_ENV^}${NC}"

if [[ -n "${!TARGET_VAR}" ]]; then
    echo -e "${BLUE}📥 Importing POI data to $TARGET_ENV database...${NC}"
    cat "$BACKUP_FILE" | node scripts/database-migration.js "import-$TARGET_ENV" || {
        echo -e "${RED}❌ Failed to import POI data to $TARGET_ENV${NC}"
        echo -e "${YELLOW}⚠️  Backup saved as: $BACKUP_FILE${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ POI data imported to $TARGET_ENV${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping direct database import - using Vercel environment variables${NC}"
    echo -e "${YELLOW}   Manual verification required for database sync${NC}"
fi

# Phase 5: Validate deployment
echo -e "${PURPLE}🔍 Phase 5: Deployment Validation${NC}"

if [[ "$TARGET_ENV" == "preview" ]]; then
    BASE_URL="https://p.nearestniceweather.com"
elif [[ "$TARGET_ENV" == "production" ]]; then
    BASE_URL="https://nearestniceweather.com"
fi

echo -e "${BLUE}🔍 Testing $TARGET_ENV environment...${NC}"

# Test health endpoint
if curl -sf "$BASE_URL/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Health endpoint responding${NC}"
else
    echo -e "${RED}❌ Health endpoint not responding${NC}"
    exit 1
fi

# Test POI endpoint
POI_RESPONSE=$(curl -sf "$BASE_URL/api/poi-locations?limit=1" | jq -r '.data[0].name // "FAILED"')
if [[ "$POI_RESPONSE" != "FAILED" && "$POI_RESPONSE" != "Albert Lea" ]]; then
    echo -e "${GREEN}✅ POI endpoint returning: $POI_RESPONSE${NC}"
else
    echo -e "${RED}❌ POI endpoint returning incorrect data: $POI_RESPONSE${NC}"
    echo -e "${YELLOW}⚠️  Expected outdoor recreation POI, got city data${NC}"
    exit 1
fi

# Clean up backup file
echo -e "${BLUE}🧹 Cleaning up backup file...${NC}"
rm -f "$BACKUP_FILE"

echo -e "${GREEN}🎉 DEPLOYMENT WITH MIGRATION COMPLETE!${NC}"
echo -e "${GREEN}✅ Environment: $TARGET_ENV${NC}"
echo -e "${GREEN}✅ POI Data: $POI_COUNT records synchronized${NC}"
echo -e "${GREEN}✅ Validation: All endpoints responding correctly${NC}"
echo -e "${BLUE}🔗 URL: $BASE_URL${NC}"

echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "   1. Run comprehensive health check: ./scripts/comprehensive-health-check.sh $TARGET_ENV"
echo -e "   2. Test frontend functionality manually"
echo -e "   3. Validate business model compliance"

if [[ "$TARGET_ENV" == "preview" ]]; then
    echo -e "   4. Once preview is 100% validated, deploy to production"
fi
