# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Nearest Nice Weather" project - a weather intelligence platform connecting outdoor enthusiasts with optimal weather conditions. 

**Core Business Philosophy**: [The Innovation Infrastructure Advantage](documentation/business-plan/innovation-velocity-principles.md) - we optimize technical architecture for rapid experimentation and learning speed, creating competitive advantage through faster market discovery.

**🚀 RAPID DEVELOPMENT WORKFLOW**: [Optimized for High-Speed Experimentation](RAPID-DEVELOPMENT.md) - Idea to production in 2-5 minutes with automated quality gates and instant rollback capabilities.

**Target Market**: Minnesota tourism operators (ice fishing guides, BWCA outfitters, resorts) and outdoor recreation enthusiasts.

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
  - `localhost-health-check.sh` - Comprehensive environment validation
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

### **Database Schema Validation**
- **Always verify table structure** before deploying API changes
- **Required tables**: `locations`, `weather_conditions`, `tourism_operators`
- **Test with known good data** before production deployment

**Development Environment** (ROBUST STARTUP - Prevents Connection Issues):
```bash
# RECOMMENDED: Use the robust startup script
./dev-startup.sh

# This script automatically:
# - Cleans up existing processes
# - Starts API server (port 4000)
# - Starts frontend server (port 3001)
# - Tests all connections
# - Verifies environment configuration

# Alternative: Manual startup
cd apps/web && npm run dev  # Frontend on port 3001
node dev-api-server.js      # API on port 4000

# Production-style process management (optional)
npm install -g pm2
pm2 start ecosystem.config.js  # Starts both servers with auto-restart
pm2 logs                       # View logs
pm2 restart all               # Restart all services
```

**Environment Setup** (SIMPLIFIED - Environment Variables):
```bash
# 1. Copy environment template and configure
cp .env.example .env

# 2. Edit .env with your Neon database URL (get from Neon Dashboard)
# DATABASE_URL="postgresql://[username]:[password]@[hostname]/weather?sslmode=require"

# 3. Run development environment
./dev-startup.sh

# The development server will proxy API calls to localhost:4000 automatically
# All configuration via .env files

# Optional: Set custom development port
export DEV_PORT=3001  # Default port if not specified
cd apps/web && npm run dev
```

**Deployment Commands** (PRODUCTION SAFETY):
```bash
# Preview deployment (safe, no confirmation needed)
npm run deploy:preview

# Production deployment (requires explicit confirmation)
npm run deploy:prod                    # Shows deployment info, requires --confirm flag
npm run deploy:prod -- --confirm       # Deploys to production after safety checks

# Legacy deploy command (disabled for safety)
npm run deploy                         # Returns error message with correct commands
```

**Deployment Safety Features**:
- 🛡️ **Confirmation Required**: Production deployments require explicit `--confirm` flag
- 📋 **Pre-deployment Info**: Shows git status, commit details, and recent deployments
- ⚠️ **Uncommitted Changes Warning**: Alerts if there are uncommitted changes
- 🔍 **Pre-deployment Checks**: Runs lint, type-check, and build before deployment
- 🚫 **Accidental Deployment Prevention**: Legacy `npm run deploy` command disabled

**Environment Variables** (Required):
- `DATABASE_URL`: Neon PostgreSQL connection string
- `POSTGRES_URL`: Alternative name for Vercel compatibility
- Development vs production managed automatically

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

**Revenue Model**: B2B SaaS for tourism operators ($200-500/month) + B2C subscriptions ($15-50/month)

**Key Features** (planned):
- Weather-destination matching algorithm
- Tourism operator dashboard for weather-related business decisions  
- Consumer interface for activity optimization
- Predictive weather intelligence for trip planning

**Geographic Focus**: Initial Minnesota market, expanding to Upper Midwest

## Development Status Update

**TECHNICAL FOUNDATION COMPLETED** ✅ (December 2024):
1. ✅ **Technical Foundation**: FastAPI + PostGIS + Redis infrastructure validated
2. ✅ **Database Implementation**: Sample Minnesota locations and tourism operators loaded
3. ✅ **API Development**: Infrastructure validation endpoints operational  
4. ✅ **Frontend Dashboard**: Real-time infrastructure monitoring interface

**NEXT DEVELOPMENT PRIORITIES**:
1. **Weather API Integration**: Connect OpenWeather, Weather API, NOAA services
2. **Core Algorithm**: Weather-activity matching for Minnesota conditions  
3. **Tourism Operator Features**: B2B dashboard and workflow optimization
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
- Sample Minnesota tourism data (locations + operators)

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

- Always quickly verify localhost sites are available in the browser before indicating they are done and/or ready for review

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