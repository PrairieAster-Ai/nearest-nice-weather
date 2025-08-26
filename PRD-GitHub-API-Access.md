# Product Requirements Document: GitHub API Access Resolution

**Issue ID**: PRD-001  
**Created**: 2025-01-27  
**Status**: ✅ RESOLVED  
**Priority**: P0 - Critical Blocker  
**Owner**: Bob Speer  

## Executive Summary

GitHub API access is completely blocked despite multiple token creation attempts and various troubleshooting approaches. This prevents using GitHub Project Manager MCP for sprint planning, issue creation, and AI-powered project management capabilities. The issue manifests as persistent 401 "Bad credentials" errors even with newly created tokens.

## Problem Statement

### Current Situation
- **Impact**: Cannot access PrairieAster-Ai/nearest-nice-weather repository via GitHub API
- **Symptoms**: All API calls return 401 "Bad credentials" errors
- **Duration**: 3+ hours of debugging across multiple sessions
- **Business Impact**: Blocking sprint planning, issue creation, and project automation

### Root Cause Analysis (Current Understanding)
1. **NOT SSO**: GitHub Teams subscription doesn't include SSO features
2. **NOT Token Format**: Tokens have correct format (github_pat_, 93 characters)
3. **NOT Environment Variables**: Both local and Vercel have been updated
4. **UNKNOWN**: Why valid tokens immediately fail authentication

## Attempted Solutions Log

### Token Creation Attempts
1. **Token #1**: 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
   - Result: 401 errors, appeared to be missing repository permissions
   
2. **Token #2**: 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
   - Result: 401 errors, basic /user endpoint worked initially then failed
   
3. **Token #3**: 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
   - Source: Pulled from Vercel environment variables
   - Result: 401 errors
   
4. **Token #4**: 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
   - Created with: All repositories, proper permissions selected
   - Result: 401 "Bad credentials"

### Environment Configuration Verified
- ✅ Local `.env` file updated multiple times
- ✅ Vercel environment variables updated (confirmed via `vercel env pull`)
- ✅ Token format validated (correct prefix, correct length)
- ✅ No trailing spaces or hidden characters

### API Testing Results
```bash
# All tests return same result:
curl -H "Authorization: token $TOKEN" https://api.github.com/user
# Result: 401 "Bad credentials"

# Even with Bearer format:
curl -H "Authorization: Bearer $TOKEN" https://api.github.com/user  
# Result: 401 "Bad credentials"
```

### SSO Investigation (Ruled Out)
- GitHub Teams subscription confirmed (doesn't include SSO)
- No SSO provider configured
- SSO headers in API responses are misleading
- Organization settings show no SSO configuration

## Technical Requirements

### Success Criteria
1. GitHub API authentication succeeds with personal access token
2. Can access PrairieAster-Ai/nearest-nice-weather repository via API
3. GitHub Project Manager MCP server connects successfully
4. Can create issues and manage project programmatically

### Acceptance Tests
```bash
# Test 1: Basic authentication
curl -H "Authorization: token $TOKEN" https://api.github.com/user
# Expected: Returns user profile JSON

# Test 2: Repository access  
curl -H "Authorization: token $TOKEN" https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather
# Expected: Returns repository details

# Test 3: Issue creation
curl -X POST -H "Authorization: token $TOKEN" \
  https://api.github.com/repos/PrairieAster-Ai/nearest-nice-weather/issues \
  -d '{"title":"Test Issue"}'
# Expected: Creates issue successfully
```

## Current Hypothesis

### Most Likely Causes (To Investigate)
1. **Account-Level Issue**: Something specific to the rhspeer account or PrairieAster-Ai organization
2. **Token Creation UI Bug**: GitHub UI might be creating tokens incorrectly
3. **Permissions Not Saving**: Selected permissions not actually being applied to token
4. **Organization Settings**: Hidden configuration blocking API access

### Next Debugging Steps
1. Test with a classic personal access token (not fine-grained)
2. Create token via GitHub CLI instead of web UI
3. Test API access to personal repositories (not organization)
4. Check GitHub account security settings for API restrictions
5. Contact GitHub support if issue persists

## Resources & Documentation

### Configuration Files
- `/home/robertspeer/Projects/GitRepo/nearest-nice-weather/.env` - Local token storage
- Vercel Project Settings - Production token storage
- `.vscode/mcp-settings.json` - MCP server configuration

### Validation Scripts Created
- `validate-github-token-fixed.sh` - Comprehensive token validation
- `test-token-directly.sh` - Direct token testing without variables
- `diagnose-token-issue.sh` - Token diagnosis tool
- `update-local-env.sh` - Token update utility

### GitHub Documentation Reviewed
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [API Authentication](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api)
- [Organization Repository Access](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories)

## Timeline

- **Session 1**: Security issue discovered (exposed token in config), fixed
- **Session 2**: SSO investigation, multiple token creation attempts
- **Session 3**: Environment variable synchronization (Vercel ↔ Local)
- **Current**: Creating PRD to document systematic approach

## Decision Log

1. **Decision**: Rule out SSO as root cause
   - **Rationale**: GitHub Teams doesn't include SSO features
   
2. **Decision**: Focus on token creation and permissions
   - **Rationale**: 401 errors indicate authentication failure, not authorization

3. **Decision**: Document all attempts for GitHub support escalation
   - **Rationale**: Systematic failure suggests platform issue

## Risk Assessment

- **High Risk**: Continued blocking of all GitHub integration features
- **Medium Risk**: May need to migrate to different automation approach
- **Low Risk**: Security exposure (tokens are failing, not working with wrong scope)

## Next Actions

1. [ ] Try creating a classic personal access token (not fine-grained)
2. [ ] Test API access to a personal repository (not organization)
3. [ ] Create minimal test case for GitHub support
4. [ ] Consider alternative: GitHub App instead of personal token
5. [ ] Escalate to GitHub support with this PRD as evidence

## Support Ticket Template (If Needed)

```
Subject: Fine-grained Personal Access Tokens Failing with 401 Despite Correct Configuration

Environment:
- Account: rhspeer  
- Organization: PrairieAster-Ai
- Repository: nearest-nice-weather
- Plan: GitHub Teams

Issue:
All fine-grained personal access tokens immediately fail with 401 "Bad credentials" even when:
- Created with full repository permissions
- Tested immediately after creation
- Used with correct Authorization header format

Attempted Solutions:
- Created 4 different tokens with various permission combinations
- Verified no SSO configuration (Teams plan)
- Tested both Bearer and token authorization formats
- Confirmed token format (github_pat_, 93 characters)

Request:
Please investigate why fine-grained tokens for this account/organization are failing authentication.
```

---

## ✅ **RESOLUTION (2025-01-27)**

**Root Cause**: Environment variable handling issue in validation scripts, NOT token problems.

**Solution Applied**:
1. **Token was valid all along** - Direct testing confirmed authentication works
2. **Validation scripts had bash context issues** - Token works with direct curl calls
3. **MCP server connects successfully** - GitHub Project Manager MCP operational
4. **Wiki management works via git** - Can create/edit wiki pages programmatically

**Current Status**:
- ✅ GitHub API access: WORKING
- ✅ Repository access: WORKING  
- ✅ MCP server: OPERATIONAL
- ✅ Wiki management: OPERATIONAL via git clone/push

**Lessons Learned**:
- Test tokens directly before assuming failure
- Environment variable handling can be misleading in complex bash contexts
- GitHub Wiki uses separate .wiki.git repository, accessible via standard git operations
- Fine-grained tokens work correctly when properly configured

**Final State**: All GitHub integration capabilities are now fully operational.