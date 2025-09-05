# Vercel Preview Domain Alias Troubleshooting

**Issue**: Preview deployments not automatically pointing to p.nearestniceweather.com
**Frequency**: Every 2-3 deployments
**Time Cost**: 15-30 minutes debugging per occurrence
**Last Updated**: 2025-07-18

## Problem Description

When deploying to preview with `npm run deploy:preview`, Vercel creates auto-generated URLs instead of updating the custom preview domain `p.nearestniceweather.com`. This leads to confusion when testing API endpoints.

### Symptoms
- ✅ Auto-generated preview URL works (e.g., `https://nearest-nice-weather-abc123.vercel.app`)
- ❌ `https://p.nearestniceweather.com/api/health` returns 404 or old deployment
- ❌ API endpoints appear broken when testing preview domain
- ❌ Frontend loads but API calls fail

## Root Cause

Vercel's preview deployment process:
1. Creates new deployment with auto-generated URL
2. Does NOT automatically update custom domain aliases
3. `p.nearestniceweather.com` continues pointing to previous deployment

## Solution

### Immediate Fix (2 minutes)
```bash
# 1. Get the auto-generated URL from deployment output
# Example: https://nearest-nice-weather-35ic2i2fu-roberts-projects-3488152a.vercel.app

# 2. Create alias to point preview domain to new deployment
cd apps/web
vercel alias set [AUTO-GENERATED-URL] p.nearestniceweather.com

# 3. AUTOMATED VALIDATION (RECOMMENDED)
./scripts/environment-validation.sh preview

# 4. Manual verification (if needed)
curl -s "https://p.nearestniceweather.com/api/health" | jq .
curl -s "https://p.nearestniceweather.com/api/weather-locations?limit=2" | jq .
```

### Prevention Workflow
```bash
# Standard preview deployment workflow
cd apps/web

# 1. Deploy to preview
npm run deploy:preview

# 2. IMMEDIATELY copy the auto-generated URL from output
# 3. IMMEDIATELY run alias command
vercel alias set [COPY-URL-HERE] p.nearestniceweather.com

# 4. Test endpoints
curl -s "https://p.nearestniceweather.com/api/health" | jq .
```

## Verification Steps

After running the alias command, verify:
- [ ] `https://p.nearestniceweather.com/api/health` returns success
- [ ] `https://p.nearestniceweather.com/api/weather-locations?limit=2` returns data
- [ ] Frontend loads without console errors
- [ ] API calls from frontend work correctly

## Common Mistakes

1. **Forgetting to run alias command** - Most common cause
2. **Using wrong URL format** - Copy exact URL from deployment output
3. **Not waiting for DNS propagation** - Usually takes 30-60 seconds
4. **Testing before alias is set** - Always alias first, then test

## Automation Opportunities

### Script Integration
Could create a post-deployment script that:
1. Extracts the auto-generated URL from vercel output
2. Automatically runs the alias command
3. Waits for DNS propagation
4. Runs verification tests

### Package.json Script
```json
{
  "scripts": {
    "deploy:preview:complete": "npm run deploy:preview && node scripts/alias-preview.js"
  }
}
```

## Historical Incidents

- **2025-07-18**: API relocation experiment - 15 minutes lost debugging
- **Previous occasions**: Multiple instances documented in session handoffs
- **Pattern**: Occurs especially after major API changes or new deployments

## Related Documentation

- `CLAUDE.md` - Vercel Deployment Checklist section
- `vercel-deployment-troubleshooting.md` - General Vercel issues
- `emergency-deployment-procedures.md` - Rollback procedures

## Commands Reference

```bash
# Check current aliases
vercel alias list

# Set new alias
vercel alias set [SOURCE-URL] [TARGET-DOMAIN]

# Remove alias
vercel alias remove [DOMAIN]

# Check deployment status
vercel ls

# Test API endpoints
curl -s "https://p.nearestniceweather.com/api/health" | jq .
curl -s "https://p.nearestniceweather.com/api/weather-locations?limit=2" | jq .
curl -s "https://p.nearestniceweather.com/api/feedback" -X POST -d '{"feedback":"test"}' -H "Content-Type: application/json"
```

## Success Criteria

- [ ] Preview domain alias updated within 2 minutes of deployment
- [ ] API endpoints respond correctly on preview domain
- [ ] No debugging time lost to alias issues
- [ ] Clear documentation prevents future occurrences
