#!/bin/bash

# Fixed GitHub Token Validation Script
echo "🔍 GitHub Token Validation (Fixed Version)"
echo "=========================================="
echo ""

# We know from the screenshot:
# - Repository: PrairieAster-Ai/nearest-nice-weather
# - User: rhspeer has Admin access
# - Repository exists and user is a collaborator

echo "Known Configuration:"
echo "-------------------"
echo "Repository: PrairieAster-Ai/nearest-nice-weather"
echo "User: rhspeer (Robert W. Speer) - Admin role"
echo ""

echo "Step 1: Testing token with different methods..."
echo "----------------------------------------------"

# Method 1: Try with Bearer token format
echo "Testing Bearer token format..."
BEARER_TEST=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather)

if echo "$BEARER_TEST" | grep -q '"full_name"'; then
    echo "✅ Bearer token format works!"
    echo "   Repository accessible with Bearer auth"
else
    echo "❌ Bearer format failed"
fi

# Method 2: Check if it's an organization SSO issue
echo ""
echo "Testing organization SSO requirements..."
SSO_CHECK=$(curl -sI -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather | grep -i "x-github-sso")

if [ -n "$SSO_CHECK" ]; then
    echo "⚠️  Organization requires SSO authorization!"
    echo "   $SSO_CHECK"
    echo ""
    echo "   To fix:"
    echo "   1. Go to https://github.com/settings/tokens"
    echo "   2. Find your token"
    echo "   3. Click 'Configure SSO'"
    echo "   4. Authorize for PrairieAster-Ai organization"
else
    echo "✅ No SSO requirements detected"
fi

# Method 3: Test with GraphQL API (sometimes works when REST doesn't)
echo ""
echo "Testing GraphQL API access..."
GRAPHQL_TEST=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -X POST \
  -d '{"query":"{ repository(owner:\"PrairieAster-Ai\", name:\"nearest-nice-weather\") { name } }"}' \
  https://api.github.com/graphql)

if echo "$GRAPHQL_TEST" | grep -q '"nearest-nice-weather"'; then
    echo "✅ GraphQL API access works!"
else
    echo "❌ GraphQL access failed"
fi

# Method 4: Check token scopes in detail
echo ""
echo "Checking token scopes..."
SCOPES_HEADER=$(curl -sI -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user | grep -i "x-oauth-scopes:")

echo "Token scopes: $SCOPES_HEADER"

# Extract just the scopes
SCOPES=$(echo "$SCOPES_HEADER" | cut -d: -f2 | tr -d ' \r\n')

# Check for required scopes
for scope in "repo" "workflow" "read:org"; do
    if echo "$SCOPES" | grep -q "$scope"; then
        echo "  ✅ $scope - present"
    else
        echo "  ❌ $scope - MISSING (may be required)"
    fi
done

# Method 5: Direct test bypassing organization
echo ""
echo "Testing direct user repositories..."
USER_REPOS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user/repos | grep -c '"full_name"')

echo "Can access $USER_REPOS repositories with this token"

echo ""
echo "🔧 Diagnosis & Solutions:"
echo "========================"

if echo "$BEARER_TEST" | grep -q '"full_name"'; then
    echo "✅ Token works with Bearer format!"
    echo "   Update MCP server to use Bearer authentication"
elif [ -n "$SSO_CHECK" ]; then
    echo "⚠️  SSO Authorization Required!"
    echo ""
    echo "To fix:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Find your token (starts with github_pat_)"
    echo "3. Click 'Configure SSO' button"
    echo "4. Click 'Authorize' next to PrairieAster-Ai"
    echo "5. Re-run this validation"
else
    echo "⚠️  Token issue detected"
    echo ""
    echo "Since you have Admin access (confirmed via screenshot),"
    echo "the issue is likely:"
    echo ""
    echo "1. Token needs 'repo' scope for private org repos"
    echo "2. Organization requires SSO authorization"
    echo "3. Token might need to be regenerated"
    echo ""
    echo "Recommended fix:"
    echo "1. Create a new Personal Access Token"
    echo "2. Select ALL of these scopes:"
    echo "   - repo (Full control)"
    echo "   - workflow"
    echo "   - write:org"
    echo "   - read:org"
    echo "3. If PrairieAster-Ai uses SSO, authorize the token"
fi

echo ""
echo "📝 MCP Server Workaround:"
echo "========================"
echo "If the token works with your user but not the org,"
echo "you can configure MCP server for your personal repos:"
echo ""
echo "export GITHUB_OWNER=\"rhspeer\""
echo "export GITHUB_REPO=\"nearest-nice-weather\""
echo ""
echo "Or fork the repository to your personal account."