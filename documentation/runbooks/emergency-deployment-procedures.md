# Emergency Deployment Procedures

## Overview
Critical procedures for emergency deployments, rollbacks, and incident response based on real-world deployment challenges and solutions.

## 🚀 Primary Response: VercelMCP Integration
**All emergency deployments prioritize VercelMCP for maximum speed and reliability:**
- **Instant Deployment**: Deploy fixes directly from Claude conversations
- **Real-time Monitoring**: Track deployment status without context switching
- **Automated Validation**: Built-in environment validation and health checks
- **Rollback Capability**: Quick reversion using VercelMCP tools

## Emergency Response Team
**Primary**: Development Lead
**Secondary**: DevOps Engineer
**Escalation**: CTO/Technical Director

## Incident Classification

### 🔴 P0 - Critical Production Down
- Production site completely inaccessible
- Authentication system broken
- Data loss or corruption risk
- **Response Time**: Immediate (5 minutes)

### 🟡 P1 - Major Functionality Broken
- Key features not working
- API endpoints failing
- Performance severely degraded
- **Response Time**: 15 minutes

### 🟢 P2 - Minor Issues
- Non-critical feature problems
- Cosmetic issues
- Performance slightly degraded
- **Response Time**: 2 hours

## Emergency Deployment Flowchart

```
Incident Detected
        ↓
Is Production Down? → YES → P0 Response
        ↓ NO
Are Core Features Broken? → YES → P1 Response
        ↓ NO
Is It User-Facing? → YES → P2 Response
        ↓ NO
Schedule Regular Fix
```

## P0 Critical Response (5 minutes)

### Step 1: Immediate Assessment (1 minute)
```bash
# Quick production health check
curl -f https://www.nearestniceweather.com/ || echo "SITE DOWN"
curl -f https://www.nearestniceweather.com/health.json || echo "API DOWN"

# Check Vercel status
vercel ls | head -5

# Check recent deployments
vercel ls | grep "Production"
```

### Step 2: Emergency Rollback (2 minutes)
```bash
# Get last known good deployment
LAST_GOOD=$(vercel ls | grep "● Ready.*Production" | head -1 | awk '{print $2}')

# Emergency rollback
vercel alias $LAST_GOOD www.nearestniceweather.com

# Verify rollback worked
curl -f https://www.nearestniceweather.com/ && echo "✅ ROLLBACK SUCCESS"
```

### Step 3: Communication (1 minute)
```bash
# Immediate status update
echo "🚨 P0 INCIDENT: Production rollback completed. Site restored. Investigating root cause."

# Log incident
echo "$(date): P0 Incident - Emergency rollback to $LAST_GOOD" >> incident-log.txt
```

### Step 4: Root Cause Analysis (1 minute)
```bash
# Check failed deployment logs
FAILED_DEPLOY=$(vercel ls | grep "● Error.*Production" | head -1 | awk '{print $2}')
vercel inspect $FAILED_DEPLOY --logs > incident-logs.txt

# Quick diagnosis
grep -i "error\|failed\|exception" incident-logs.txt
```

## P1 Major Issue Response (15 minutes)

### Step 1: Issue Validation (3 minutes)
```bash
# Reproduce issue
npm run dev
# Test specific functionality

# Check error rates
curl -s https://www.nearestniceweather.com/health.json | jq '.status'

# Review recent changes
git log --oneline -10
```

### Step 2: Hot Fix Assessment (5 minutes)
```bash
# Can we hot fix?
if [ "SIMPLE_FIX" = "true" ]; then
  # Apply minimal fix
  # Test locally
  # Deploy directly
else
  # Proceed to rollback
fi
```

### Step 3: Deployment Strategy (7 minutes)
```bash
# Option A: Hot Fix Deploy
npm run lint && npm run type-check && npm run build
npm run deploy:preview  # Test in preview first
# If preview works:
npm run deploy:prod -- --confirm

# Option B: Rollback to stable
vercel alias $LAST_GOOD_DEPLOYMENT www.nearestniceweather.com
```

## Hot Fix Deployment Process

### Prerequisites Check
```bash
# Verify fix is minimal and safe
- [ ] Single file or function change
- [ ] No dependency updates
- [ ] No database schema changes
- [ ] No breaking API changes
```

### Rapid Deploy Pipeline (10 minutes)
```bash
# 1. Quick fix implementation
git checkout -b hotfix/emergency-$(date +%s)

# 2. Minimal testing (local only)
npm run lint
npm run type-check
npm run build

# 3. Preview deployment first
npm run deploy:preview

# 4. Manual verification of preview
echo "🔍 Test preview URL manually before production"

# 5. Production deployment
npm run deploy:prod -- --confirm

# 6. Immediate verification
curl -f https://www.nearestniceweather.com/health.json
```

## Rollback Procedures

### Automatic Rollback (2 minutes)
```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 Emergency Rollback Initiated"

# Get last successful production deployment
LAST_GOOD=$(vercel ls | grep "● Ready.*Production" | head -1 | awk '{print $2}')

if [ -z "$LAST_GOOD" ]; then
  echo "❌ No good deployment found"
  exit 1
fi

echo "Rolling back to: $LAST_GOOD"

# Execute rollback
vercel alias $LAST_GOOD www.nearestniceweather.com

# Verify rollback
if curl -f https://www.nearestniceweather.com/ >/dev/null 2>&1; then
  echo "✅ Rollback successful"
  echo "$(date): Emergency rollback to $LAST_GOOD" >> rollback-log.txt
else
  echo "❌ Rollback failed - escalate immediately"
  exit 1
fi
```

### Manual Rollback Steps
```bash
# 1. Identify target deployment
vercel ls | grep "Production"

# 2. Select known good deployment
TARGET_DEPLOYMENT="web-abc123-roberts-projects.vercel.app"

# 3. Update production alias
vercel alias $TARGET_DEPLOYMENT www.nearestniceweather.com

# 4. Verify rollback
curl -f https://www.nearestniceweather.com/
curl -f https://www.nearestniceweather.com/health.json

# 5. Document rollback
git tag emergency-rollback-$(date +%Y%m%d-%H%M%S)
```

## Build Issues & Recovery

### Common Build Failures

#### npm install failures
```bash
# Clear everything and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# If still failing, use different Node.js version
nvm use 20.18.0
npm install
```

#### Cache-related build issues
```bash
# Force deploy without cache
vercel --prod --force

# Clear Vercel build cache
vercel env rm BUILD_CACHE 2>/dev/null || true
```

#### Dependency conflicts
```bash
# Use legacy peer deps
npm install --legacy-peer-deps

# Update Vercel build command
# In vercel.json: "npm install --legacy-peer-deps"
```

### Authentication Issues

#### Vercel login expired
```bash
# Re-authenticate
vercel logout
vercel login

# Verify access
vercel whoami
vercel ls
```

#### Permission denied
```bash
# Check team permissions
vercel teams ls
vercel switch [team-name]

# Verify project access
vercel link
```

## Monitoring & Alerting

### Health Check Endpoints
```bash
# Primary health check
curl -f https://www.nearestniceweather.com/health.json

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-07-10T...",
  "version": "production"
}
```

### Automated Monitoring
```bash
# Simple uptime monitoring
#!/bin/bash
# monitor.sh
while true; do
  if ! curl -f https://www.nearestniceweather.com/ >/dev/null 2>&1; then
    echo "🚨 SITE DOWN: $(date)" | tee -a alerts.log
    # Send alert (email, Slack, etc.)
  fi
  sleep 300  # Check every 5 minutes
done
```

### Alert Thresholds
- **Response time > 5 seconds**: Warning
- **Error rate > 1%**: Warning
- **Response time > 10 seconds**: Critical
- **Site unreachable**: Critical

## Communication Templates

### P0 Incident Initial Response
```
🚨 PRODUCTION INCIDENT
Status: Investigating
Impact: Site unavailable
ETA: Rollback in progress (~2 min)
Updates: Every 5 minutes
```

### P0 Incident Resolution
```
✅ INCIDENT RESOLVED
Action: Emergency rollback completed
Duration: X minutes downtime
Root Cause: Under investigation
Next Steps: Post-mortem scheduled
```

### Planned Emergency Maintenance
```
🔧 EMERGENCY MAINTENANCE
Scope: Hot fix deployment
Duration: 5-10 minutes
Impact: Brief service interruption
Status: Starting now
```

## Post-Incident Procedures

### Immediate Actions (30 minutes)
1. **Confirm resolution** - Site fully functional
2. **Document timeline** - What happened when
3. **Preserve evidence** - Logs, error messages, screenshots
4. **Initial communication** - Stakeholders informed

### Follow-up Actions (24 hours)
1. **Root cause analysis** - Why did this happen?
2. **Process improvements** - How do we prevent recurrence?
3. **Documentation updates** - Update runbooks based on learnings
4. **Team debrief** - What went well, what didn't?

### Post-Mortem Template
```markdown
# Incident Post-Mortem: [DATE]

## Summary
- **Duration**: X minutes
- **Impact**: [Describe user impact]
- **Root Cause**: [Technical cause]

## Timeline
- T+0: Incident detected
- T+2: Response initiated
- T+5: Resolution deployed
- T+X: Service fully restored

## Root Cause Analysis
[Detailed technical explanation]

## Action Items
- [ ] Immediate fix: [Description]
- [ ] Process improvement: [Description]
- [ ] Monitoring enhancement: [Description]

## Lessons Learned
[What we learned and how we'll improve]
```

## Prevention Strategies

### Deployment Safeguards
```bash
# Enhanced deployment safety
npm run ci:quality  # Lint + type-check + test + build
npm run deploy:preview  # Always test preview first
# Manual verification required
npm run deploy:prod -- --confirm  # Explicit confirmation
```

### Canary Deployments
```bash
# Deploy to percentage of traffic
vercel --prod --regions=iad1  # Single region first
# Monitor for issues
# Scale to all regions if successful
```

### Feature Flags
```javascript
// Implement feature flags for risky changes
const FEATURE_ENABLED = process.env.FEATURE_FLAG_NEW_FEATURE === 'true';

if (FEATURE_ENABLED) {
  // New risky feature
} else {
  // Stable fallback
}
```

## Tools & Scripts

### Emergency Response Kit
```bash
# Quick setup for emergency response
git clone emergency-scripts
cd emergency-scripts
chmod +x *.sh

# Available tools:
./emergency-rollback.sh
./health-check.sh
./deployment-status.sh
./logs-collector.sh
```

### Deployment Validation
```bash
#!/bin/bash
# validate-deployment.sh

echo "🔍 Validating deployment..."

# Test critical paths
curl -f https://www.nearestniceweather.com/ || exit 1
curl -f https://www.nearestniceweather.com/health.json || exit 1

# Check for JavaScript errors (basic)
if curl -s https://www.nearestniceweather.com/ | grep -i "error\|exception"; then
  echo "⚠️ Potential JavaScript errors detected"
fi

echo "✅ Deployment validation passed"
```

## Related Documentation

- [Cache Busting Implementation Guide](cache-busting-implementation-guide.md)
- [Docker Networking Troubleshooting](docker-networking-troubleshooting.md)
- [Node.js Migration Checklist](nodejs-migration-checklist.md)

## Emergency Contacts

**Development Team**: [Contact Info]
**Infrastructure Team**: [Contact Info]
**On-Call Engineer**: [Contact Info]
**Escalation Manager**: [Contact Info]

**Incident Response Time SLA**:
- P0: 5 minutes
- P1: 15 minutes
- P2: 2 hours

Remember: **Speed over perfection in emergencies**. Restore service first, investigate root cause second.
