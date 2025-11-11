# Claude Code Configuration for Nearest Nice Weather

This directory contains Claude Code configuration optimized for the Nearest Nice Weather project.

## SessionStart Hook

### Purpose
Automatically validates your development environment and loads critical business context when you start a Claude Code session on the web.

### What It Does

**On Every Session Start:**

1. **Loads Business Context**
   - Business model: B2C outdoor recreation platform
   - Primary data source: `poi_locations` table (Minnesota parks/trails)
   - Geographic scope: Minnesota only
   - Red flags to watch for

2. **Checks Environment Health**
   - Reads latest health check from `memory-bank/latest-health-check.json`
   - Provides health score (0-100)
   - Determines session readiness:
     - **90-100**: ✅ EXCELLENT - Full development capability
     - **70-89**: ⚠️ DEGRADED - Incremental changes only
     - **<70**: ❌ CRITICAL - Environment fixes required

3. **Verifies Development Tools**
   - Confirms critical scripts are available
   - Provides quick command reference
   - Shows deployment workflow

4. **Displays Deployment Information**
   - VercelMCP conversation templates
   - Environment URLs (localhost, preview, production)
   - Quick commands for common tasks

### Health Score Impact

The session health score determines your development capability:

| Score | Status | Recommended Actions |
|-------|--------|---------------------|
| 90-100 | ✅ EXCELLENT | Safe for complex tasks, refactoring, deployments |
| 70-89 | ⚠️ DEGRADED | Incremental changes only, avoid config modifications |
| <70 | ❌ CRITICAL | Prioritize environment recovery over features |

### Files

- **`.claude/settings.json`** - Hook configuration
- **`.claude/hooks/session-start.sh`** - Session initialization script

### Testing the Hook

```bash
# Manual test (simulates what happens on session start)
./.claude/hooks/session-start.sh

# Verify configuration
node scripts/verify-claude-config.js  # If available
```

### Updating Health Status

The hook reads from `memory-bank/latest-health-check.json`. To update:

```bash
# Run comprehensive health check (updates latest-health-check.json)
./scripts/comprehensive-health-check.sh localhost

# Now when you start a new session, the latest status will be loaded
```

### Context Provided to Claude

On session start, Claude receives:

- ✅ Business model and focus (B2C, POI-centric)
- ✅ Current environment health score
- ✅ Red flags to watch for
- ✅ Deployment workflow (VercelMCP first)
- ✅ Quick command reference
- ✅ Session readiness assessment

### Benefits

**Time Savings:**
- No manual context sharing required
- Automatic environment validation
- Instant business model alignment

**Prevents Common Issues:**
- Building B2B features (project is B2C only)
- Using wrong database table (locations vs poi_locations)
- Deploying without health checks
- Missing critical environment issues

**Innovation Velocity:**
- Supports 2-5 minute idea-to-production cycles
- Aligns with your competitive advantage
- Reduces context-switching overhead

### Web vs Terminal

This hook works in **both** environments:

- **Terminal**: Full color output with detailed diagnostics
- **Web**: Optimized JSON output for Claude context
- Auto-detects environment via `CLAUDE_CODE_REMOTE` variable

### Troubleshooting

**Hook not running?**
- Verify `.claude/settings.json` exists
- Check hook script is executable: `chmod +x .claude/hooks/session-start.sh`
- Test manually: `./.claude/hooks/session-start.sh`

**Health check data missing?**
- Run: `./scripts/comprehensive-health-check.sh localhost`
- Verify `memory-bank/latest-health-check.json` exists

**Want more verbose output?**
- Edit `.claude/hooks/session-start.sh`
- Add diagnostic echo statements
- Test with: `./.claude/hooks/session-start.sh`

## Quick Reference

**Essential Commands:**
```bash
# Start development environment
npm start

# Comprehensive health check
./scripts/comprehensive-health-check.sh localhost

# Validate environment
./scripts/environment-validation.sh [localhost|preview|production]

# QA gate before deployment
npm run qa:deployment-gate

# Deploy (VercelMCP conversations preferred)
"Deploy current code to preview environment"
"Deploy to production with safety validation"
```

**Essential Context:**
- Primary table: `poi_locations` (NOT locations)
- Business focus: B2C outdoor recreation (NOT B2B tourism)
- Geographic scope: Minnesota only
- Revenue model: Ad revenue targeting 10,000+ users

## Learn More

- [GitHub Wiki](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki) - Complete documentation
- [Memory Bank](../memory-bank/) - Business context and patterns
- [CLAUDE.md](../CLAUDE.md) - Project-specific Claude instructions
