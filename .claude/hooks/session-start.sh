#!/bin/bash

# SessionStart Hook for Nearest Nice Weather
# Optimized for Claude Code on the web
# Auto-validates environment and loads critical business context

set -e

# Detect if running in web environment
IS_WEB=${CLAUDE_CODE_REMOTE:-false}

# Color codes (only for terminal)
if [ "$IS_WEB" = "true" ]; then
    RED=''; GREEN=''; YELLOW=''; BLUE=''; NC=''
else
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
fi

# Initialize context
CONTEXT_OUTPUT=""
HEALTH_SCORE=0
WARNINGS=()
ERRORS=()
READY_FOR_WORK="unknown"

echo -e "${BLUE}🚀 Nearest Nice Weather - Session Initialization${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to add context
add_context() {
    CONTEXT_OUTPUT="${CONTEXT_OUTPUT}$1\n"
}

# 1. Load Business Model Quick Reference
echo -e "${BLUE}📋 Loading Business Context...${NC}"
if [ -f "memory-bank/quick-reference.json" ]; then
    BUSINESS_FOCUS=$(cat memory-bank/quick-reference.json | grep -o '"businessFocus": "[^"]*"' | cut -d'"' -f4)
    PRIMARY_TABLE=$(cat memory-bank/quick-reference.json | grep -o '"primaryTable": "[^"]*"' | cut -d'"' -f4)

    add_context "## Business Model"
    add_context "- Focus: $BUSINESS_FOCUS"
    add_context "- Primary Data: $PRIMARY_TABLE table (Minnesota parks/trails)"
    add_context "- Geographic Scope: Minnesota only"
    add_context "- Revenue Model: B2C ad revenue targeting 10,000+ users"
    echo -e "${GREEN}✓ Business context loaded${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 10))
else
    WARNINGS+=("Memory Bank quick reference not found")
    echo -e "${YELLOW}⚠ Quick reference not available${NC}"
fi

# 2. Check Latest Health Status
echo -e "${BLUE}🏥 Checking Environment Health...${NC}"
if [ -f "memory-bank/latest-health-check.json" ]; then
    LAST_HEALTH_SCORE=$(cat memory-bank/latest-health-check.json | grep -o '"healthScore": [0-9]*' | grep -o '[0-9]*')
    LAST_CHECK_TIME=$(cat memory-bank/latest-health-check.json | grep -o '"timestamp": "[^"]*"' | cut -d'"' -f4)

    add_context ""
    add_context "## Environment Health"
    add_context "- Last Health Score: $LAST_HEALTH_SCORE/100"
    add_context "- Last Checked: $LAST_CHECK_TIME"

    if [ "$LAST_HEALTH_SCORE" -ge 90 ]; then
        add_context "- Status: ✅ EXCELLENT - Full development capability"
        READY_FOR_WORK="excellent"
        echo -e "${GREEN}✓ Health Score: $LAST_HEALTH_SCORE/100 (Excellent)${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 30))
    elif [ "$LAST_HEALTH_SCORE" -ge 70 ]; then
        add_context "- Status: ⚠️ DEGRADED - Incremental changes recommended"
        READY_FOR_WORK="degraded"
        echo -e "${YELLOW}⚠ Health Score: $LAST_HEALTH_SCORE/100 (Degraded)${NC}"
        WARNINGS+=("Environment health degraded - avoid complex changes")
        HEALTH_SCORE=$((HEALTH_SCORE + 15))
    else
        add_context "- Status: ❌ CRITICAL - Environment fixes required"
        READY_FOR_WORK="critical"
        echo -e "${RED}❌ Health Score: $LAST_HEALTH_SCORE/100 (Critical)${NC}"
        ERRORS+=("Environment health critical - prioritize fixes")
        HEALTH_SCORE=$((HEALTH_SCORE + 5))
    fi
else
    WARNINGS+=("Latest health check not available - run ./scripts/comprehensive-health-check.sh")
    echo -e "${YELLOW}⚠ No recent health check found${NC}"
    READY_FOR_WORK="unknown"
fi

# 3. Verify Critical Scripts
echo -e "${BLUE}🔧 Verifying Development Tools...${NC}"
CRITICAL_SCRIPTS=(
    "scripts/comprehensive-health-check.sh"
    "dev-startup-optimized.sh"
    "scripts/environment-validation.sh"
)

SCRIPTS_OK=true
for script in "${CRITICAL_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo -e "${GREEN}✓ $script${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 5))
    else
        echo -e "${RED}✗ $script missing${NC}"
        ERRORS+=("Missing critical script: $script")
        SCRIPTS_OK=false
    fi
done

if [ "$SCRIPTS_OK" = true ]; then
    add_context ""
    add_context "## Development Tools"
    add_context "- Health Check: \`./scripts/comprehensive-health-check.sh [environment]\`"
    add_context "- Startup: \`npm start\` (unified dev environment)"
    add_context "- Validation: \`./scripts/environment-validation.sh [environment]\`"
    add_context "- QA Gate: \`npm run qa:deployment-gate\`"
fi

# 4. Check Red Flags
echo -e "${BLUE}🚨 Scanning for Red Flags...${NC}"
add_context ""
add_context "## Red Flags to Watch For"
add_context "- ❌ Cities appearing instead of parks/trails"
add_context "- ❌ Blank screen on any environment"
add_context "- ❌ API querying \`locations\` table (should use \`poi_locations\`)"
add_context "- ❌ B2B tourism features being developed"
add_context "- ❌ POIs outside Minnesota geographic bounds"

# 5. Deployment Readiness
echo -e "${BLUE}🚀 Deployment Information...${NC}"
add_context ""
add_context "## Deployment Workflow"
add_context "- **Primary**: VercelMCP conversations (30-second cycles)"
add_context "  - 'Deploy current code to preview environment'"
add_context "  - 'Update p.nearestniceweather.com alias to latest preview'"
add_context "  - 'Deploy to production with safety validation'"
add_context "- **Backup**: \`npm run deploy:preview\` or \`npm run deploy:production\`"
add_context "- **Environments**:"
add_context "  - Preview: https://p.nearestniceweather.com"
add_context "  - Production: https://nearestniceweather.com"
add_context "  - Localhost: http://localhost:3002 (frontend), http://localhost:4000 (API)"

# 6. Quick Commands Reference
add_context ""
add_context "## Quick Commands"
add_context "\`\`\`bash"
add_context "# Start development environment"
add_context "npm start"
add_context ""
add_context "# Comprehensive health check"
add_context "./scripts/comprehensive-health-check.sh localhost"
add_context ""
add_context "# Run QA gate before deployment"
add_context "npm run qa:deployment-gate"
add_context ""
add_context "# Test with Playwright MCP"
add_context "npm run test:mcp:smoke"
add_context "\`\`\`"

# 7. Session Readiness Summary
echo ""
echo -e "${BLUE}================================================${NC}"
if [ "$READY_FOR_WORK" = "excellent" ]; then
    echo -e "${GREEN}✅ SESSION READY - Full development capability${NC}"
    add_context ""
    add_context "## Session Status: ✅ READY FOR WORK"
    add_context "Health score >90% - Safe for complex tasks, refactoring, and deployments"
elif [ "$READY_FOR_WORK" = "degraded" ]; then
    echo -e "${YELLOW}⚠️ SESSION DEGRADED - Incremental changes only${NC}"
    add_context ""
    add_context "## Session Status: ⚠️ DEGRADED"
    add_context "Health score 70-89% - Focus on incremental changes, avoid config modifications"
elif [ "$READY_FOR_WORK" = "critical" ]; then
    echo -e "${RED}❌ SESSION CRITICAL - Environment fixes required${NC}"
    add_context ""
    add_context "## Session Status: ❌ CRITICAL"
    add_context "Health score <70% - Prioritize environment recovery over features"
else
    echo -e "${YELLOW}⚠️ SESSION STATUS UNKNOWN - Run health check${NC}"
    add_context ""
    add_context "## Session Status: ⚠️ UNKNOWN"
    add_context "Run \`./scripts/comprehensive-health-check.sh localhost\` to assess environment"
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Warnings: ${#WARNINGS[@]}${NC}"
    add_context ""
    add_context "### Warnings:"
    for warning in "${WARNINGS[@]}"; do
        echo -e "${YELLOW}  ⚠ $warning${NC}"
        add_context "- $warning"
    done
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
    echo -e "${RED}Errors: ${#ERRORS[@]}${NC}"
    add_context ""
    add_context "### Errors:"
    for error in "${ERRORS[@]}"; do
        echo -e "${RED}  ✗ $error${NC}"
        add_context "- $error"
    done
fi

echo -e "${BLUE}================================================${NC}"
echo ""

# Output JSON for Claude Code
cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "$(echo -e "$CONTEXT_OUTPUT" | sed 's/"/\\"/g')",
    "sessionHealthScore": $HEALTH_SCORE,
    "readyForWork": "$READY_FOR_WORK",
    "warningCount": ${#WARNINGS[@]},
    "errorCount": ${#ERRORS[@]}
  }
}
EOF

exit 0
