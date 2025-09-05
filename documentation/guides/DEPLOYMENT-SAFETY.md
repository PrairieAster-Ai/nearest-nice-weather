# DEPLOYMENT SAFETY PROTOCOLS

## CRITICAL: Production Deployment Prevention

### ❌ NEVER RUN THESE COMMANDS
```bash
# DANGEROUS - Direct production deployments
vercel --prod
vercel --target production

# DANGEROUS - Root-level deployments without confirmation
cd ../.. && vercel --prod
```

### ✅ ONLY USE THESE SAFE COMMANDS

**Preview Deployments** (Safe):
```bash
cd apps/web
npm run deploy:preview
```

**Production Deployments** (Requires Explicit Confirmation):
```bash
cd apps/web
npm run deploy:prod              # Shows info, requires --confirm
npm run deploy:prod -- --confirm # Actually deploys after validation
```

## Deployment Safety Features

### 1. Built-in Confirmation Required
- `npm run deploy:prod` requires explicit `--confirm` flag
- Shows git status, recent commits, and deployment info first
- Runs quality checks before deployment

### 2. Directory-Based Safety
- **ONLY deploy from `apps/web` directory**
- Root-level deployments have different configuration
- `apps/web` has proper function paths and build configuration

### 3. Alias Management for Preview
```bash
# After successful preview deployment:
vercel alias set <deployment-url> p.nearestniceweather.com
```

## Emergency Prevention

### If Production Deploy Accidentally Started:
1. **DO NOT** cancel or stop it - let it fail naturally
2. **Monitor** Vercel dashboard for deployment status
3. **Check** production domain to verify no changes
4. **Document** what went wrong for prevention

### Configuration Errors Are Protection:
- Root `vercel.json` configuration mismatches protect against accidental deploys
- Failed deployments don't affect live production
- Always validate deployment succeeded before assuming changes are live

## Recovery Protocols

### If Production Accidentally Updated:
1. **Immediate rollback**: `vercel rollback <previous-deployment-id>`
2. **Verify rollback**: Check production health endpoints
3. **Update team**: Notify of accidental deployment and recovery
4. **Root cause analysis**: Document and prevent recurrence

## Workflow Enforcement

### Required Commands Only:
- **Preview**: `npm run deploy:preview`
- **Production**: `npm run deploy:prod -- --confirm`
- **Domain Updates**: `vercel alias set <url> p.nearestniceweather.com`

### Forbidden Commands:
- Any `vercel --prod` without going through npm scripts
- Any deployments from project root (`../..`)
- Any production deployments without explicit user authorization

This prevents accidental production deployments while maintaining safe preview deployment workflows.
