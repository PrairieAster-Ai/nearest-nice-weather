# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Nearest Nice Weather" project - a weather intelligence platform connecting outdoor enthusiasts with optimal weather conditions. 

**Core Business Philosophy**: [The Innovation Infrastructure Advantage](documentation/business-plan/innovation-velocity-principles.md) - we optimize technical architecture for rapid experimentation and learning speed, creating competitive advantage through faster market discovery.

**🚀 RAPID DEVELOPMENT WORKFLOW**: [Optimized for High-Speed Experimentation](RAPID-DEVELOPMENT.md) - Idea to production in 2-5 minutes with automated quality gates and instant rollback capabilities.

**📋 WORK PLANNING & SPRINT MANAGEMENT**: [GitHub Project "NearestNiceWeather.com App Development"](https://github.com/orgs/PrairieAster-Ai/projects/2) - **SINGLE SOURCE OF TRUTH** for all current work, sprint planning, and issue tracking. See [GITHUB-PROJECT-REFERENCE.md](GITHUB-PROJECT-REFERENCE.md) for complete project structure and workflow guidance.

**Target Market**: Casual mass market consumers in Minneapolis metro area seeking constraint-based weather optimization for free/frugal local activities.

## Repository Structure

- `documentation/` - Complete business plan, technical architecture, and operational documentation
  - `business-plan/` - Master plan, executive summary, implementation roadmap
  - `appendices/` - Market research, user personas, financial assumptions
  - `sessions/` - Action items and focused work tracking
  - `runbooks/` - **Operational procedures and troubleshooting guides**
    - `docker-networking-troubleshooting.md` - Docker networking issue resolution
    - `nodejs-migration-checklist.md` - LTS migration procedures
    - `cache-busting-implementation-guide.md` - Production cache control
    - `emergency-deployment-procedures.md` - Incident response protocols
    - `environment-setup-automation.md` - Team onboarding automation
  - `DEVELOPMENT-ENVIRONMENT-SUMMARY.md` - Overview of all operational improvements
  - `architecture-overview.md` - Complete technical specification for FastAPI + Directus + PostGIS stack
- `scripts/` - **Automated development environment tools**
  - `environment-validation.sh` - **Comprehensive multi-environment validation (localhost/preview/production)**
  - `localhost-health-check.sh` - Legacy localhost-specific validation
  - `quick-docker-health.sh` - Fast Docker networking check
  - `development-dashboard.sh` - Real-time environment monitoring

## Development Commands

**⚠️ CRITICAL: Database & API Deployment Guidelines** (Updated July 13, 2025):

### **Environment Variable Management**
- **NEVER mix local and cloud database connections** - leads to 2+ hour debugging sessions
- **Always use Neon serverless driver** (`@neondatabase/serverless`) for Vercel functions
- **Use consistent variable names** across all environments:
  - Production: `WEATHERDB_URL` or `POSTGRES_URL` 
  - Must point to same database with known schema

### **Vercel Deployment Checklist**
1. **Verify API functions location**: Must be in `apps/web/api/` directory
2. **Use ES6 export syntax**: `export default function handler(req, res)`
3. **Install serverless driver**: `npm install @neondatabase/serverless`
4. **Set environment variables** in correct Vercel project
5. **Disable authentication** on production (enable only for preview)
6. **⚠️ CRITICAL: Always verify preview domain alias after deployment**

### **🔄 Preview Domain Alias Issue (RECURRING PROBLEM)**
**Problem**: `npm run deploy:preview` creates auto-generated URLs instead of updating p.nearestniceweather.com
**Impact**: API endpoints appear broken when testing p.nearestniceweather.com
**Root Cause**: Vercel doesn't automatically alias preview deployments to custom domains

**MANDATORY STEPS after every preview deployment**:
```bash
# 1. Deploy to preview (creates auto-generated URL)
npm run deploy:preview

# 2. IMMEDIATELY alias the preview domain to the new deployment
vercel alias set [AUTO-GENERATED-URL] p.nearestniceweather.com

# 3. Test the preview domain API endpoints
curl -s "https://p.nearestniceweather.com/api/health" | jq .
curl -s "https://p.nearestniceweather.com/api/weather-locations?limit=2" | jq .
```

**Historical Pattern**: This issue occurs every 2-3 deployments and costs 15-30 minutes of debugging time
**Prevention**: Always run the alias command immediately after preview deployment

### **🔄 RAPID LOCALHOST/PREVIEW PARITY TESTING**
**FOR ITERATIVE VALIDATION WORKFLOWS**: Quick comparison between environments
```bash
# Test localhost with latest code
./scripts/environment-validation.sh localhost

# Test preview environment  
./scripts/environment-validation.sh preview

# Update SESSION-HANDOFF.md matrix with results
# Fix divergences with unified solutions
# Repeat until parity achieved
```

### **🔍 Environment Validation (STANDARD OPERATING PROCEDURE)**
**MANDATORY**: Use automated validation script before manual testing
```bash
# Validate any environment with comprehensive testing
./scripts/environment-validation.sh [ENVIRONMENT]

# Common usage patterns:
./scripts/environment-validation.sh localhost     # Test local development
./scripts/environment-validation.sh preview      # Test preview environment
./scripts/environment-validation.sh production   # Test production
./scripts/environment-validation.sh https://my-branch.vercel.app  # Custom URL
```

**What it detects**:
- ✅ API endpoints working (health, weather-locations, feedback)
- ✅ Frontend loading (HTML, static assets, JavaScript bundles)
- ✅ Database connectivity and environment variables
- ✅ Common deployment issues (blank screens, 404s, timeouts)
- ✅ BrowserToolsMCP integration for screenshots and console logs

**Exit codes**: 0=success, 1=API issues, 2=frontend issues, 3=both
**Automation**: Run this script before asking "is the environment working?"

### **Database Schema Validation**
- **Always verify table structure** before deploying API changes
- **Required tables**: `locations`, `weather_conditions`, `tourism_operators` (NOTE: tourism_operators table exists for data completeness, but B2C focus means it's used only for location/activity data, not B2B features)
- **Test with known good data** before production deployment

**Development Environment** (UNIFIED STARTUP EXPERIENCE):
```bash
# ONE COMMAND TO START EVERYTHING:
npm start

# This automatically:
# - Validates environment and frees conflicting ports
# - Starts API server (port 4000) 
# - Starts frontend server (port 3001)
# - Runs health checks for both services
# - Provides monitoring and auto-restart capabilities
# - Ready in under 30 seconds

# PERSISTENT MONITORING (Runs in background even after Ctrl+C):
npm run start:pm2          # Start all services with PM2 process manager
npm run stop:pm2           # Stop all PM2 services
npm run restart:pm2        # Restart all PM2 services
npm run status:pm2         # Check PM2 service status
npm run logs:pm2           # View PM2 logs

# ENHANCED HEALTH CHECKS:
npm run health:visual      # Visual validation with screenshots & console analysis
npm run health:monitor     # Run persistent health monitor independently

# Alternative: Legacy startup (still available)
./dev-startup.sh           # Original complex startup
cd apps/web && npm run dev  # Frontend only
node dev-api-server.js      # API only

# STEP 3: Database Environment Deployment Strategy
# LOCALHOST: Uses Neon development branch (.env)
# PREVIEW: Uses Neon production branch (.env.production in Vercel)
# PRODUCTION: Uses Neon production branch (.env.production in Vercel)

# Production-style process management (optional)
npm install -g pm2
pm2 start ecosystem.config.js  # Starts both servers with auto-restart
pm2 logs                       # View logs
pm2 restart all               # Restart all services
```

**Environment Setup** (NEON DATABASE BRANCHING - Multi-Environment Strategy):
```bash
# 1. Copy environment template and configure
cp .env.example .env

# 2. Configure Neon Database Branching:
# LOCALHOST DEVELOPMENT: Edit .env with development branch URL
# DATABASE_URL="postgresql://[username]:[password]@[hostname]/neondb?sslmode=require"

# PREVIEW/PRODUCTION: Configure in Vercel dashboard with production branch URL
# Set environment variables in Vercel project settings

# 3. Run development environment
./dev-startup.sh

# The development server will proxy API calls to localhost:4000 automatically
# Each environment uses its own database branch:
# - localhost: development branch (isolated testing)
# - preview: production branch (staging validation)  
# - production: production branch (live data)

# Optional: Set custom development port
export DEV_PORT=3001  # Default port if not specified
cd apps/web && npm run dev
```

**Deployment Commands** (PRODUCTION SAFETY):
```bash
# Preview deployment (safe, with automatic validation)
npm run deploy:preview

# Production deployment (requires explicit confirmation)
npm run deploy:production              # Interactive confirmation required
npm run deploy:production -- --force   # Skip confirmation (emergency use only)

# Legacy deploy command (disabled for safety)
npm run deploy                         # Returns error message with correct commands

# DANGEROUS: Raw vercel commands (blocked by safety wrapper)
vercel --prod                          # BLOCKED - use npm run deploy:production instead
```

**Deployment Safety Features**:
- 🛡️ **Interactive Confirmation**: Production deployments require typing "DEPLOY-TO-PRODUCTION"
- 📋 **Pre-deployment Checks**: Git status, uncommitted changes, branch validation
- ⚠️ **Experimental Branch Protection**: Prevents production deployment from test branches
- 🔍 **Automated Validation**: Runs environment validation after deployment
- 🚫 **Command Blocking**: Raw `vercel --prod` commands are intercepted and blocked
- 🔄 **Automatic Alias Updates**: Preview deployments automatically update p.nearestniceweather.com

**Environment Variables** (Required):
- `DATABASE_URL`: Neon PostgreSQL connection string (CLOUD ONLY - never localhost)
- `POSTGRES_URL`: Alternative name for Vercel compatibility
- Development vs production managed automatically

**⚠️  CRITICAL: NO LOCAL POSTGRESQL DATABASE**
- Database is hosted on Neon cloud in all environments
- Local PostgreSQL Docker containers have been permanently removed
- SSL is required for all database connections
- This prevents database confusion that caused 8-hour debugging session on 2025-07-31

**Development Tools** (SIMPLIFIED STACK):
- ✅ **Neon PostgreSQL Database** (cloud-hosted, no local setup required)
- ✅ **Vercel API Functions** (serverless, connected to Neon)
- ✅ **Frontend (Vite + React + Material-UI)** on port 3002 (LIVE with API proxy)
- 🗑️ PostCSS/Tailwind CSS removed (Material-UI only)
- 🗑️ Local PostgreSQL removed (eliminated complexity)
- 🗑️ FastAPI backend removed (replaced with Vercel functions)

## Technical Architecture

**Technology Stack** (current implementation):
- **Backend**: Vercel Edge Functions (Node.js serverless)
- **Database**: Neon PostgreSQL (serverless, geo-enabled)
- **Frontend**: Vite + React Progressive Web App with Material-UI
- **Deployment**: Vercel (frontend + serverless functions)
- **Authentication**: GitHub SSH keys, secure environment variables

**Key Integrations**:
- Weather APIs: OpenWeather, Weather API, Visual Crossing, NOAA
- Geographic Services: Google Maps API, Mapbox
- Authentication: JWT with Directus integration

## Business Context

**Revenue Model**: B2C ad revenue platform targeting 10,000+ active users

**IMPORTANT**: This is a B2C-focused project. Any B2B/tourism operator features are documented in appendices as far-future capabilities only.

**Key Features** (B2C Focus):
- Weather-destination matching algorithm
- Consumer interface for activity optimization
- Predictive weather intelligence for trip planning
- Minimalist interface optimized for usability and fun

**Geographic Focus**: Initial Minnesota market, expanding to Upper Midwest

## Development Status Update

**TECHNICAL FOUNDATION COMPLETED** ✅ (December 2024):
1. ✅ **Technical Foundation**: FastAPI + PostGIS + Redis infrastructure validated
2. ✅ **Database Implementation**: Sample Minnesota locations and outdoor activities loaded
3. ✅ **API Development**: Infrastructure validation endpoints operational  
4. ✅ **Frontend Dashboard**: Real-time infrastructure monitoring interface

**NEXT DEVELOPMENT PRIORITIES**:
1. **Weather API Integration**: Connect OpenWeather, Weather API, NOAA services
2. **Core Algorithm**: Weather-activity matching for Minnesota conditions  
3. **Consumer Features**: B2C interface optimization and user experience
4. **Customer Discovery**: Market validation with live platform demos

## File Organization

**CURRENT IMPLEMENTATION** (Ready for Feature Development):
- `application/app/` - ✅ FastAPI application with infrastructure validation
- `application/frontend/` - ✅ Next.js Progressive Web App with status dashboard
- `application/database/` - ✅ PostgreSQL schema with sample data loaded
- `application/logs/` - Application logging directory
- `docker-compose.yml` - ✅ Complete development environment configuration

**IMPLEMENTED FEATURES**:
- FastAPI backend with async database connections
- Real-time infrastructure health monitoring
- Geographic data handling with PostGIS
- Next.js frontend with Tailwind CSS styling
- Sample Minnesota outdoor activity data (locations + activities)

## Implementation Achievement

**Value Delivered**: $120,000 worth of technical foundation completed and operational. Platform ready for weather API integration and customer-facing feature development.

**Live Demo Available**: Infrastructure validation dashboard demonstrates full-stack integration, database connectivity, and real-time monitoring capabilities.

## Deployment & Build System Guidelines

**CRITICAL: Build/deployment changes are HIGH-RISK and require the same careful process as UI changes.**

### Before Making Any Build/Deployment Changes:
1. **Always start from known working baseline**: `git checkout ui-working-baseline`
2. **Make ONE minimal change at a time** - never bundle multiple fixes
3. **Test locally first**: `npm run build && npm run preview` 
4. **Verify the specific fix works** before deploying
5. **Deploy incrementally**: One change → test → verify → proceed

### High-Risk Change Categories:
- **Build configuration** (vite.config.ts, webpack, etc.)
- **Package updates** (especially React, build tools)
- **CSS/styling system changes** (Tailwind, imports)
- **Bundle splitting modifications**
- **Target platform changes** (ES version, browser support)

### Red Flags - Stop and Use Baseline:
- Multiple simultaneous config changes
- "Force deployment" commits
- Panic-driven additional changes
- Deployment troubleshooting without visibility

### Required Process for Build Changes:
1. **Identify the minimal fix** (usually one line/setting)
2. **Test locally with build preview**
3. **Verify specific error is resolved**
4. **Deploy with commit message explaining the single change**
5. **Wait for deployment feedback before proceeding**

### Deployment Feedback Requirements:
- **Never deploy blind** - always need build status visibility
- **Implement health checks** for production verification
- **Use deployment webhooks** for real-time status
- **Monitor console errors** after deployment

## Recovery Protocols

### When Build/Deployment Changes Go Wrong:
1. **STOP making more changes**
2. **Revert to ui-working-baseline**: `git checkout ui-working-baseline`
3. **Analyze what went wrong** before attempting fixes
4. **Implement deployment feedback** before retry
5. **Make only the minimal fix** identified through analysis

### Git Safety Tags:
- `ui-working-baseline` - Known working UI state with all features
- Create new baseline tags after major successful deployments
- Always test rollback to baseline before making risky changes

### Emergency Rollback:
```bash
# Return to known working state
git checkout ui-working-baseline
git checkout -b emergency-rollback
git push origin emergency-rollback --force
```

## Development Workflow Memories

- **Always verify localhost sites are available** - Use automated screenshot capture to validate app loading
  - **AUTOMATED VERIFICATION**: Use BrowserToolsMCP to capture screenshots WITHOUT asking permission
  - **Visual Validation**: Screenshots confirm UI loaded correctly and validate visual state
  - **Command**: `curl -X POST http://localhost:3025/mcp/screenshot -H "Content-Type: application/json" -d '{"tabId": "TAB_ID", "filename": "validation.png"}'`

- **Use ./dev-startup.sh to startup localhost** and maintain to document and mitigate common issues
  - **Enhanced with health checks**: Now includes Docker networking validation
  - **Automated diagnostics**: Reports issues with specific fix recommendations

- **Daily workflow starts with health validation**:
  ```bash
  ./scripts/localhost-health-check.sh  # Comprehensive validation
  # OR
  ./scripts/quick-docker-health.sh     # Fast Docker check
  ```

- **When environment issues occur**:
  - Docker networking problems → `./apply-docker-fix.sh`
  - General diagnostics → `./scripts/development-dashboard.sh`

## Claude AI Productivity Intelligence

**CRITICAL**: Check environment health before starting any development work:
```bash
# Required environment check at session start:
curl -s http://localhost:3050/health | jq '.'
./environment-health-check.sh
```

**Development Environment KPIs** (see [CLAUDE-PRODUCTIVITY-KPIs.md](CLAUDE-PRODUCTIVITY-KPIs.md)):
- **Health Score >90%**: Full development capability - proceed with complex tasks
- **Health Score 70-89%**: Reduced capability - focus on incremental changes  
- **Health Score <70%**: CRITICAL - prioritize environment fixes over features

**Known Productivity Degradation Patterns**:
- **Port conflicts**: 8-10 hours/week historical loss - monitor service detection
- **Service startup issues**: 4-6 hours/week - check startup sequence health
- **Docker networking**: 2-4 hours/week - system restart requires Docker restart
- **Configuration drift**: 2-3 hours/week - validate environment variables

**Intelligence Monitoring**: Claude Intelligence Suite provides real-time context
- System Monitor: http://localhost:3052/system-resources  
- Service Health: http://localhost:3050/status
- Business Context: http://localhost:3058/business-context

**Decision Framework**: Use environment health to determine task complexity
- Health >95%: Safe for refactoring, config changes, complex features
- Health 85-94%: Normal development, monitor resources during builds
- Health 70-84%: Incremental changes only, avoid config modifications
- Health <70%: Stop feature work, focus on environment recovery
  - Emergency issues → Follow `documentation/runbooks/emergency-deployment-procedures.md`

- Ask for feedback before adding or editing end user facing content

- Request content review before adding or editing content

- Only deploy to live or production with explicit authorization from the human partner

## UI/UX Change Policy

- **NEVER add new visual elements** (buttons, icons, UI components) without explicit user request
- **NEVER modify existing UI layout** or visual design without permission
- **ASK FIRST** before making any user-facing content changes
- Focus on backend functionality, API integration, and data flow unless specifically asked to modify UI
- If users mention missing functionality, explain the technical solution but ask before implementing UI changes

- **Proactive maintenance approach**: Use automated scripts to prevent issues rather than react to them

## Software Selection Principles

- Software from an external source must be the versions tagged with Long Term Support (LTS) or most Stable. New or bleeding edge software presents an unnecessary project risk that's a distraction from creating value.

## Software Version Memories

- Software versions on localhost MUST match production, and prod can be upgraded if necessary. 

## Deployment Workflow

- Production deployment requires a Preview environment deployment, automated testing, and validated by Me (Bob). This helps us catch any environmental issues between localhost and prod, and is a final quality gate that should take moments.

## Development Environment Maintenance

### Daily Maintenance
- **Health Check**: Run `./scripts/localhost-health-check.sh` when starting development work
- **Docker Status**: Verify Docker networking with `./scripts/quick-docker-health.sh`
- **Node.js Version**: Ensure LTS version (20.18.0) with `node --version`
- **Environment Validation**: Use `./scripts/development-dashboard.sh` for real-time status
- **Blank Screen Check**: If preview shows blank screen, run `./scripts/blank-screen-diagnostic.sh preview`

### Weekly Maintenance  
- **Documentation Review**: Check `documentation/runbooks/` for process updates
- **Dependency Updates**: Review and update project dependencies (`npm audit`)
- **Docker Cleanup**: Run `docker system prune -f` to clean unused resources
- **Environment Sync**: Verify localhost matches production versions

### Monthly Maintenance
- **LTS Updates**: Check for new Node.js LTS releases and plan migration
- **Runbook Updates**: Review and update procedures based on new issues encountered
- **Team Training**: Ensure all developers are familiar with emergency procedures
- **Process Improvements**: Identify and implement workflow optimizations

### Emergency Procedures
- **Critical Issues**: Follow `documentation/runbooks/emergency-deployment-procedures.md`
- **Docker Problems**: Use `documentation/runbooks/docker-networking-troubleshooting.md`
- **Migration Needs**: Follow `documentation/runbooks/nodejs-migration-checklist.md`
- **Cache Issues**: Reference `documentation/runbooks/cache-busting-implementation-guide.md`
- **Blank Screen Issues**: Use `./scripts/blank-screen-diagnostic.sh` for automated diagnosis and fix

### Knowledge Management
- **Runbook Location**: All procedures documented in `documentation/runbooks/`
- **Setup Automation**: New team members use `documentation/runbooks/environment-setup-automation.md`
- **Health Monitoring**: Automated scripts in `scripts/` directory
- **Incident Documentation**: Update runbooks after resolving new issues

### Key Documentation Files
- `documentation/DEVELOPMENT-ENVIRONMENT-SUMMARY.md` - Overview of all improvements
- `documentation/runbooks/` - Complete operational procedures
- `scripts/` - Automated health check and validation tools
- `apply-docker-fix.sh` - Docker networking issue resolution
- `MIGRATION-SUMMARY.md` - Node.js 22→20 migration record

## Data Integrity Memories

- Mock data fallbacks are a bad idea, we need to maintain user's trust by only showing the most accurate data possible. If test data is necessary it needs to persist in the same way it will in production for full end to end testing.

## Development Deployment Memories

- Vercel preview environment requires vercel authentication to access
- Vercel authentication should only apply to preview, if it's on production there is a break