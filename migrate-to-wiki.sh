#!/bin/bash

# GitHub Wiki Migration Script for Nearest Nice Weather
# This script organizes documentation for GitHub wiki migration

echo "🚀 Starting GitHub Wiki Migration for Nearest Nice Weather"

# Create wiki content directory structure
mkdir -p wiki-content/{
    developer-onboarding,
    technical-architecture,
    api-reference,
    frontend-guide,
    deployment-operations,
    troubleshooting,
    business-context
}

echo "📁 Created wiki content structure"

# Copy and organize core developer documentation
echo "📋 Organizing core developer documentation..."

# 1. Developer Onboarding (Essential for new developers)
cp documentation/technical/ACTUAL-ARCHITECTURE-2025.md wiki-content/developer-onboarding/
cp documentation/guides/DEV-WORKFLOW.md wiki-content/developer-onboarding/
cp documentation/DEVELOPMENT-ENVIRONMENT-SUMMARY.md wiki-content/developer-onboarding/
cp CLAUDE.md wiki-content/developer-onboarding/
cp README.md wiki-content/developer-onboarding/

# 2. Technical Architecture
cp documentation/technical/current-database-schema.md wiki-content/technical-architecture/
cp documentation/technical/architecture-overview-updated.md wiki-content/technical-architecture/

# 3. API Reference  
cp dev-api-server.js wiki-content/api-reference/
cp -r apps/web/api/ wiki-content/api-reference/production-apis/

# 4. Frontend Guide
cp -r apps/web/src/components/ wiki-content/frontend-guide/components/
cp -r apps/web/src/hooks/ wiki-content/frontend-guide/hooks/
cp -r apps/web/src/services/ wiki-content/frontend-guide/services/

# 5. Deployment & Operations
cp documentation/guides/DEPLOYMENT-GUIDE.md wiki-content/deployment-operations/
cp documentation/guides/DEPLOYMENT-SAFETY.md wiki-content/deployment-operations/
cp documentation/runbooks/*.md wiki-content/deployment-operations/runbooks/

# 6. Troubleshooting
cp documentation/guides/REACT-19-TESTING-ISSUES.md wiki-content/troubleshooting/
cp documentation/runbooks/blank-screen-troubleshooting.md wiki-content/troubleshooting/
cp documentation/runbooks/docker-networking-troubleshooting.md wiki-content/troubleshooting/

# 7. Business Context
cp documentation/business-plan/*.md wiki-content/business-context/
cp documentation/summaries/REFINED-BUSINESS-GOALS-2025.md wiki-content/business-context/

echo "✅ Documentation organized for wiki migration"
echo "📦 Content prepared in wiki-content/ directory"
echo ""
echo "Next steps:"
echo "1. Create GitHub wiki pages manually from wiki-content/ structure"
echo "2. Verify all critical documentation is migrated"
echo "3. Test new developer onboarding with wiki"
echo "4. Remove documentation/ folder after successful migration"