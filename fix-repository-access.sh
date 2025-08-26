#!/bin/bash

# Fix Repository Access Script
echo "🔧 Fixing Repository Access for MCP Server"
echo "=========================================="
echo ""

# Check current configuration
echo "Current Configuration:"
echo "---------------------"
echo "GITHUB_OWNER: PrairieAster-Ai"
echo "GITHUB_REPO: nearest-nice-weather"
echo "Repository URL: https://github.com/PrairieAster-Ai/nearest-nice-weather"
echo ""

# Test different access methods
echo "Testing Repository Access Methods:"
echo "---------------------------------"

# Method 1: Direct repository check
echo "1. Testing direct repository access..."
REPO_CHECK=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather)

if echo "$REPO_CHECK" | grep -q '"full_name"'; then
    echo "✅ Direct access successful"
else
    echo "❌ Direct access failed"
    echo "Response: $(echo $REPO_CHECK | head -c 100)..."
fi

# Method 2: Check organization access
echo ""
echo "2. Testing organization access..."
ORG_CHECK=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/orgs/PrairieAster-Ai)

if echo "$ORG_CHECK" | grep -q '"login"'; then
    echo "✅ Organization found: PrairieAster-Ai"
    
    # Check organization membership
    echo "   Checking your membership..."
    MEMBER_CHECK=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
      https://api.github.com/orgs/PrairieAster-Ai/members/rhspeer)
    
    if [ "$?" -eq 0 ]; then
        echo "   ✅ You are a member of PrairieAster-Ai"
    else
        echo "   ❌ You are not listed as a member"
        echo "   Note: You may need to accept an organization invitation"
    fi
else
    echo "❌ Cannot access organization"
    echo "Response: $(echo $ORG_CHECK | head -c 100)..."
fi

# Method 3: Check if repository is private
echo ""
echo "3. Checking repository visibility..."
PUBLIC_CHECK=$(curl -s https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather)

if echo "$PUBLIC_CHECK" | grep -q '"full_name"'; then
    echo "✅ Repository is public"
else
    echo "⚠️ Repository appears to be private"
    echo "   Your token needs 'repo' scope for private repository access"
fi

# Method 4: Check token scopes
echo ""
echo "4. Checking token permissions..."
SCOPES=$(curl -sI -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user | grep -i "x-oauth-scopes:" | cut -d: -f2 | tr -d ' \r\n')

echo "Current token scopes: $SCOPES"

if echo "$SCOPES" | grep -q "repo"; then
    echo "✅ Token has 'repo' scope"
else
    echo "❌ Token missing 'repo' scope (required for private repos)"
fi

# Method 5: Try alternative authentication
echo ""
echo "5. Testing with different API endpoint..."
ALT_CHECK=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather)

if echo "$ALT_CHECK" | grep -q '"full_name"'; then
    echo "✅ Alternative authentication method works"
else
    echo "❌ Alternative method also failed"
fi

echo ""
echo "🔍 Diagnosis:"
echo "============"

# Provide diagnosis
if echo "$PUBLIC_CHECK" | grep -q '"full_name"'; then
    echo "Repository is PUBLIC but your token can't access it."
    echo ""
    echo "Possible solutions:"
    echo "1. Organization membership not confirmed - check GitHub notifications for invitations"
    echo "2. Token needs to be authorized for this organization:"
    echo "   - Go to: https://github.com/settings/tokens"
    echo "   - Find your token and click 'Configure SSO'"
    echo "   - Authorize for PrairieAster-Ai organization"
else
    echo "Repository appears to be PRIVATE."
    echo ""
    echo "Required actions:"
    echo "1. Ensure your GitHub user has repository access"
    echo "2. Token needs 'repo' scope for private repository access"
    echo "3. Accept any pending organization invitations"
fi

echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. Check GitHub for any pending organization invitations"
echo "2. If using SSO, authorize your token for the organization"
echo "3. Verify you're listed as a collaborator on the repository"
echo "4. If still failing, create a new token with full 'repo' scope"