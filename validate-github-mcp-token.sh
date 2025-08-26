#!/bin/bash

# GitHub Token Validation for MCP Server
echo "🔍 GitHub Token Validation for MCP Server"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if token is set
echo "Step 1: Environment Variable Check"
echo "---------------------------------"

if [ -z "$GITHUB_TOKEN" ] && [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ No GitHub token found in environment${NC}"
    echo ""
    echo "Please run first:"
    echo "  ./setup-mcp-environment-secure.sh"
    exit 1
fi

# Use GITHUB_TOKEN if set, otherwise use GITHUB_PERSONAL_ACCESS_TOKEN
if [ -n "$GITHUB_TOKEN" ]; then
    TOKEN_VAR="GITHUB_TOKEN"
    TOKEN_VALUE="$GITHUB_TOKEN"
elif [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    TOKEN_VAR="GITHUB_PERSONAL_ACCESS_TOKEN"
    TOKEN_VALUE="$GITHUB_PERSONAL_ACCESS_TOKEN"
fi

echo -e "${GREEN}✅ Token found: $TOKEN_VAR${NC}"
echo -e "   Preview: $(echo $TOKEN_VALUE | head -c 20)...${NC}"

# Step 2: Validate token format
echo ""
echo "Step 2: Token Format Validation"
echo "-------------------------------"

if [[ $TOKEN_VALUE =~ ^github_pat_[A-Za-z0-9_]+ ]]; then
    echo -e "${GREEN}✅ Token format is correct (github_pat_...)${NC}"
else
    echo -e "${YELLOW}⚠️  Token format doesn't match expected pattern${NC}"
    echo "   Expected: github_pat_..."
    echo "   Got: $(echo $TOKEN_VALUE | head -c 15)..."
    echo "   This might still work, continuing validation..."
fi

# Step 3: Test GitHub API access
echo ""
echo "Step 3: GitHub API Access Test"
echo "------------------------------"

# Test basic API access
API_RESPONSE=$(curl -s -H "Authorization: token $TOKEN_VALUE" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user)

if echo "$API_RESPONSE" | grep -q '"login"'; then
    USERNAME=$(echo "$API_RESPONSE" | grep '"login"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ GitHub API access successful${NC}"
    echo -e "   Authenticated as: ${BLUE}$USERNAME${NC}"
else
    echo -e "${RED}❌ GitHub API access failed${NC}"
    echo "   Response: $(echo $API_RESPONSE | head -c 100)..."
    echo ""
    echo "Common issues:"
    echo "   - Token expired or revoked"
    echo "   - Insufficient permissions"
    echo "   - Network connectivity issues"
    exit 1
fi

# Step 4: Check repository access
echo ""
echo "Step 4: Repository Access Test"
echo "------------------------------"

REPO_RESPONSE=$(curl -s -H "Authorization: token $TOKEN_VALUE" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather)

if echo "$REPO_RESPONSE" | grep -q '"full_name"'; then
    echo -e "${GREEN}✅ Repository access successful${NC}"
    echo -e "   Repository: ${BLUE}PrairieAster-Ai/nearest-nice-weather${NC}"
    
    # Check if issues access works
    ISSUES_RESPONSE=$(curl -s -H "Authorization: token $TOKEN_VALUE" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather/issues?per_page=1)
    
    if echo "$ISSUES_RESPONSE" | grep -q '\[' || echo "$ISSUES_RESPONSE" | grep -q '"number"'; then
        echo -e "${GREEN}✅ Issues access successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Issues access limited or failed${NC}"
    fi
else
    echo -e "${RED}❌ Repository access failed${NC}"
    echo "   Response: $(echo $REPO_RESPONSE | head -c 100)..."
    echo ""
    echo "Possible issues:"
    echo "   - Repository doesn't exist or is private"
    echo "   - Token lacks repository permissions"
    exit 1
fi

# Step 5: Check required token scopes
echo ""
echo "Step 5: Token Permissions Check"
echo "-------------------------------"

# Get token scopes from API response headers
SCOPES_RESPONSE=$(curl -s -I -H "Authorization: token $TOKEN_VALUE" \
  https://api.github.com/user)

if echo "$SCOPES_RESPONSE" | grep -i "x-oauth-scopes"; then
    SCOPES=$(echo "$SCOPES_RESPONSE" | grep -i "x-oauth-scopes" | cut -d: -f2 | tr -d ' \r\n')
    echo -e "${GREEN}✅ Token scopes detected:${NC} $SCOPES"
    
    # Check for required scopes
    REQUIRED_SCOPES=("repo" "workflow")
    for scope in "${REQUIRED_SCOPES[@]}"; do
        if echo "$SCOPES" | grep -q "$scope"; then
            echo -e "   ✅ ${GREEN}$scope${NC} - Available"
        else
            echo -e "   ❌ ${RED}$scope${NC} - Missing (required for MCP server)"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Could not determine token scopes${NC}"
    echo "   Token appears valid but scope information unavailable"
fi

# Step 6: Test MCP server startup
echo ""
echo "Step 6: MCP Server Startup Test"
echo "-------------------------------"

# Set environment variables for MCP server
export GITHUB_TOKEN="$TOKEN_VALUE"
export GITHUB_OWNER="PrairieAster-Ai"  
export GITHUB_REPO="nearest-nice-weather"

echo "Testing MCP server startup (5-second test)..."

# Test server startup with timeout
MCP_OUTPUT=$(timeout 5s mcp-github-project-manager --verbose 2>&1 || true)

if echo "$MCP_OUTPUT" | grep -q "Server.*initialized\|Server.*starting\|Listening.*protocol"; then
    echo -e "${GREEN}✅ MCP server started successfully${NC}"
    echo "   Server appears to be working correctly"
elif echo "$MCP_OUTPUT" | grep -q "Authentication.*failed\|401\|403"; then
    echo -e "${RED}❌ MCP server authentication failed${NC}"
    echo "   Token has API access but insufficient permissions for MCP operations"
elif echo "$MCP_OUTPUT" | grep -q "Error.*GITHUB_TOKEN\|required"; then
    echo -e "${RED}❌ MCP server environment configuration issue${NC}"
    echo "   Check environment variable setup"
else
    echo -e "${YELLOW}⚠️  MCP server test inconclusive${NC}"
    echo "   Output: $(echo $MCP_OUTPUT | head -c 150)..."
fi

# Summary
echo ""
echo "🎯 Validation Summary"
echo "===================="

if echo "$API_RESPONSE" | grep -q '"login"' && echo "$REPO_RESPONSE" | grep -q '"full_name"'; then
    echo -e "${GREEN}✅ GitHub token is valid and working${NC}"
    echo -e "${GREEN}✅ Repository access confirmed${NC}"
    echo -e "${GREEN}✅ Ready for MCP server usage${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Token is properly configured"
    echo "2. Use MCP functions like generate_prd, parse_prd, etc."
    echo "3. Create AI-powered PRDs for your capabilities"
else
    echo -e "${RED}❌ GitHub token validation failed${NC}"
    echo ""
    echo "Required actions:"
    echo "1. Verify token is correct and not expired"
    echo "2. Check token has 'repo' and 'workflow' permissions" 
    echo "3. Ensure repository access is available"
fi

echo ""
echo "Token validation complete!"