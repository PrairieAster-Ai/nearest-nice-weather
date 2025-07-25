#!/bin/bash
# Environment Variables Cleanup Script
# Removes unused/redundant database environment variables from Vercel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Environment Variables Cleanup${NC}"
echo ""

# List of variables to remove (unused legacy Postgres/Prisma variables)
VARS_TO_REMOVE=(
    "POSTGRES_POSTGRES_URL"
    "POSTGRES_POSTGRES_PRISMA_URL"
    "POSTGRES_DATABASE_URL_UNPOOLED"
    "POSTGRES_POSTGRES_URL_NON_POOLING"
    "POSTGRES_PGHOST"
    "POSTGRES_POSTGRES_USER"
    "POSTGRES_POSTGRES_PASSWORD"
    "POSTGRES_POSTGRES_DATABASE"
    "POSTGRES_PGPASSWORD"
    "POSTGRES_PGDATABASE"
    "POSTGRES_PGHOST_UNPOOLED"
    "POSTGRES_PGUSER"
    "POSTGRES_POSTGRES_URL_NO_SSL"
    "POSTGRES_POSTGRES_HOST"
    "POSTGRES_NEON_PROJECT_ID"
)

# Variables to keep (actually used by code)
VARS_TO_KEEP=(
    "DATABASE_URL"
    "CLAUDE_CODE_ACCESS_TOKEN"
)

echo -e "${YELLOW}Variables to REMOVE (unused legacy variables):${NC}"
for var in "${VARS_TO_REMOVE[@]}"; do
    echo "  ❌ $var"
done

echo ""
echo -e "${GREEN}Variables to KEEP (actively used by code):${NC}"
for var in "${VARS_TO_KEEP[@]}"; do
    echo "  ✅ $var"
done

echo ""
echo -e "${RED}⚠️  WARNING: This will permanently delete environment variables from Vercel!${NC}"
echo -e "${RED}⚠️  Make sure you have backups of any important connection strings.${NC}"
echo ""
read -p "Type 'CLEANUP-ENV-VARS' to continue: " confirm

if [[ "$confirm" != "CLEANUP-ENV-VARS" ]]; then
    echo -e "${YELLOW}Cleanup cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Removing unused environment variables...${NC}"

# Remove each unused variable
for var in "${VARS_TO_REMOVE[@]}"; do
    echo -e "${BLUE}Removing: $var${NC}"
    vercel env rm "$var" --yes 2>/dev/null || echo -e "${YELLOW}  (Variable not found or already removed)${NC}"
done

echo ""
echo -e "${GREEN}✅ Environment variables cleanup complete!${NC}"
echo ""
echo -e "${BLUE}📊 Current essential variables:${NC}"
vercel env ls | grep -E "(DATABASE_URL|CLAUDE_CODE_ACCESS_TOKEN)"

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify DATABASE_URL has correct connection string for preview/production"
echo "2. Test database connection: curl https://p.nearestniceweather.com/api/test-db"
echo "3. Update localhost .env to remove WEATHERDB_URL redundancy"