# Blank Screen Troubleshooting Guide

## Overview
This runbook provides systematic procedures for diagnosing and fixing blank screen issues in the Nearest Nice Weather application, particularly in Vercel preview environments.

## Common Symptoms
- ✅ API endpoints respond correctly (`/api/health`, `/api/weather-locations`)
- ✅ HTML page loads with correct structure
- ✅ JavaScript bundles are referenced in HTML
- ❌ App renders as blank white screen
- ❌ React components don't initialize

## Root Causes (Priority Order)

### 1. Preview Domain Alias Mismatch (Most Common)
**Problem**: Preview domain `p.nearestniceweather.com` points to wrong deployment
**Symptoms**: 
- Build timestamp shows `local-` prefix
- Deployment ID doesn't match recent deployment
- Direct deployment URL works but aliased domain doesn't

**Diagnosis**:
```bash
# Check recent deployments
vercel ls

# Check current alias target
curl -s https://p.nearestniceweather.com/ | grep -E "(build-timestamp|deployment-id)"

# Compare with direct deployment URL
curl -s https://[LATEST-DEPLOYMENT-URL]/ | grep -E "(build-timestamp|deployment-id)"
```

**Fix**:
```bash
# Update alias to latest deployment
vercel alias set [LATEST-DEPLOYMENT-URL] p.nearestniceweather.com

# Wait for DNS propagation
sleep 10

# Verify fix
curl -s https://p.nearestniceweather.com/ | grep build-timestamp
```

### 2. JavaScript Bundle Compatibility Issues
**Problem**: ES module vs CommonJS compatibility problems
**Symptoms**:
- Bundle loads but React doesn't initialize
- No console errors visible
- Bundle contains React render call but doesn't execute

**Diagnosis**:
```bash
# Check bundle contents
curl -s https://p.nearestniceweather.com/assets/index-[HASH].js | tail -20 | grep -E "(createRoot|render)"

# Compare with working localhost bundle
curl -s http://localhost:3001/assets/index-[HASH].js | tail -20 | grep -E "(createRoot|render)"
```

**Fix**:
```bash
# Force fresh build and deployment
cd apps/web
npm run build
vercel --prod  # Deploy to ensure fresh bundle
```

### 3. Build Artifact Corruption
**Problem**: Build process created malformed bundles
**Symptoms**:
- Bundle HTTP 200 but contains incomplete JavaScript
- React components missing from bundle
- Build timestamp mismatch

**Diagnosis**:
```bash
# Check bundle size and structure
curl -s -I https://p.nearestniceweather.com/assets/index-[HASH].js | grep Content-Length
curl -s https://p.nearestniceweather.com/assets/index-[HASH].js | wc -l

# Verify bundle integrity
curl -s https://p.nearestniceweather.com/assets/index-[HASH].js | grep "export\|import\|createRoot"
```

**Fix**:
```bash
# Clean build and redeploy
cd apps/web
rm -rf dist/
npm run build
vercel
```

### 4. React Hydration/Initialization Failures
**Problem**: React app fails to mount to DOM
**Symptoms**:
- Empty `<div id="root"></div>` in browser
- No React DevTools detection
- Bundle executes but no DOM changes

**Diagnosis**:
```bash
# Check for React initialization in bundle
curl -s https://p.nearestniceweather.com/assets/index-[HASH].js | grep -o "createRoot.*render"

# Use BrowserToolsMCP if available
curl -s "http://localhost:3025/mcp/console-logs/all?limit=10"
```

**Fix**:
```bash
# Check for dependency conflicts
cd apps/web
npm audit
npm ls react react-dom

# Rebuild with clean dependencies
rm -rf node_modules
npm install
npm run build
```

## Automated Diagnostic Tool

Use the automated diagnostic script for faster troubleshooting:

```bash
# Run full diagnostic
./scripts/blank-screen-diagnostic.sh preview

# Get help
./scripts/blank-screen-diagnostic.sh --help
```

The script will:
1. Check deployment alias mapping
2. Verify HTML structure and asset loading
3. Test JavaScript bundle execution
4. Attempt automatic fixes

## Prevention Strategies

### 1. Deployment Validation
```bash
# Always validate after deployment
npm run deploy:preview
./scripts/environment-validation.sh preview
```

### 2. Alias Management
```bash
# Immediately update alias after deployment
vercel alias set [AUTO-GENERATED-URL] p.nearestniceweather.com
```

### 3. Build Consistency
```bash
# Use consistent build process
npm run build  # Uses health-check and cache-busting
```

### 4. Visual Regression Testing
```bash
# Take screenshots before and after deployment
./scripts/visual-regression-test.sh preview
```

## Escalation Procedures

### If Automated Fix Fails
1. **Check Vercel logs**: `vercel logs --follow`
2. **Test direct deployment URL**: Bypass alias entirely
3. **Compare with working localhost**: Identify environmental differences
4. **Examine build artifacts**: Look for missing or corrupted files

### If Issue Persists
1. **Rollback to previous working deployment**
2. **Check for Vercel platform issues**: https://vercel-status.com/
3. **Clear browser cache completely**
4. **Test in incognito/private browsing mode**

## Success Metrics
- ✅ Environment validation script returns 0 exit code
- ✅ Visual regression test shows <5% difference
- ✅ BrowserToolsMCP shows no console errors
- ✅ Manual browser test confirms app functionality

## Related Documentation
- [Environment Validation Script](../../scripts/environment-validation.sh)
- [Visual Regression Testing](../../scripts/visual-regression-test.sh)
- [Vercel Preview Alias Troubleshooting](vercel-preview-alias-troubleshooting.md)
- [Emergency Deployment Procedures](emergency-deployment-procedures.md)

## Change Log
- **2025-07-18**: Initial creation based on preview deployment blank screen incident
- **2025-07-18**: Added automated diagnostic script and prevention strategies