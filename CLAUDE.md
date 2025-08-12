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
  - `scripts/utilities/quick-docker-health.sh` - Fast Docker networking check
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
- ✅ Browser testing capabilities via Playwright MCP (in development)

**Exit codes**: 0=success, 1=API issues, 2=frontend issues, 3=both
**Automation**: Run this script before asking "is the environment working?"

### **Database Schema Validation**
- **Always verify table structure** before deploying API changes
- **Primary table**: `poi_locations` (138 Minnesota outdoor recreation destinations: parks, trails, forests, nature centers)
- **Deprecated tables**: `locations` (legacy cities/weather stations), `weather_conditions` (legacy weather data) - replaced by POI-centric architecture
- **Note**: tourism_operators table may exist for future data completeness, but B2C focus means outdoor recreation POIs are the primary data source
- **Test with known good data** before production deployment

**Development Environment** (OPTIMIZED UNIFIED STARTUP):
```bash
# ONE COMMAND TO START EVERYTHING:
npm start

# This automatically:
# - Validates environment and frees conflicting ports
# - Starts API server (port 4000) 
# - Starts frontend server (port 3001)
# - Runs health checks for both services
# - Provides monitoring and auto-restart capabilities
# - Ready in under 30 seconds with color-coded output

# STARTUP OPTIONS:
npm start                  # Standard startup with monitoring
npm run start:quick        # Fast startup, skip optional features  
npm run start:clean        # Clean restart (clear caches)
npm run start:verbose      # Detailed output for debugging
npm run start:no-monitor   # Start without continuous monitoring

# PERSISTENT MONITORING (PM2 option):
npm run start:pm2          # Start all services with PM2 process manager
npm run stop:pm2           # Stop all PM2 services
npm run restart:pm2        # Restart all PM2 services
npm run status:pm2         # Check PM2 service status
npm run logs:pm2           # View PM2 logs

# ALTERNATIVE STARTUP (if needed):
npm run start:legacy       # Archived unified-dev-start.sh
cd apps/web && npm run dev  # Frontend only
node dev-api-server.js      # API only

# STEP 3: Database Environment Deployment Strategy (UPDATED 2025-08-05)
# LOCALHOST: Uses Neon development branch (.env) - SOURCE OF TRUTH for POI data
# PREVIEW: Uses Neon preview branch (Vercel environment variables) - REQUIRES MIGRATION
# PRODUCTION: Uses Neon production branch (Vercel environment variables) - REQUIRES MIGRATION

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
npm start                   # Uses dev-startup-optimized.sh
# OR with options:
npm run start:quick         # Fast startup
npm run start:clean         # Clean restart

# The development server will proxy API calls to localhost:4000 automatically
# Each environment uses its own database branch:
# - localhost: development branch (source of truth - 138 POI records)
# - preview: preview branch (staging validation - requires POI migration)  
# - production: production branch (live data - requires POI migration)

# Optional: Set custom development port
export DEV_PORT=3001  # Default port if not specified
cd apps/web && npm run dev
```

**Deployment Commands** (🚀 VERCEL MCP FIRST - 30-SECOND CYCLES):

**🎯 PRIMARY DEPLOYMENT STRATEGY: VercelMCP Conversations**:

**ZERO COMMAND LINE DEPLOYMENT** - All operations via Claude conversations:
```
🚀 PRODUCTION-READY CONVERSATION-BASED DEPLOYMENT:

Preview Deployment:
"Deploy current code to preview environment"
→ Result: Deployment + automatic p.nearestniceweather.com alias + validation

Production Deployment:  
"Deploy current code to production with safety validation"
→ Result: Safety checks + deployment + endpoint validation + monitoring

Status & Monitoring:
"Show deployment status and logs"
→ Result: Real-time deployment status + recent logs + performance metrics

Emergency Operations:
"Rollback production to previous deployment"
→ Result: Immediate rollback + validation + status confirmation

Alias Management:
"Update p.nearestniceweather.com to latest preview"
→ Result: Instant domain alias update + validation
```

**🎯 EXPECTED PERFORMANCE: 30-second deployment cycles vs 5-minute manual process**

**🛠️ BACKUP COMMANDS** (for CI/CD and manual fallback):
```bash
# Fixed deployment commands (CI/CD compatible - no migration)
npm run deploy:preview              # Direct Vercel preview deployment
npm run deploy:production           # Direct Vercel production deployment  
npm run deploy:prod                 # Direct Vercel production deployment (alias)

# Enhanced deployment commands (includes POI data migration)
./scripts/deploy-with-migration.sh preview     # Preview + database sync
./scripts/deploy-with-migration.sh production  # Production + database sync

# VercelMCP usage examples (shows conversation templates)
npm run mcp:vercel:deploy           # Shows: "Deploy current code to production"
npm run mcp:vercel:preview          # Shows: "Deploy current code to preview environment"
npm run mcp:vercel:status           # Shows: "Show deployment status and logs"
npm run mcp:vercel:alias            # Shows: "Update p.nearestniceweather.com to latest preview"
npm run mcp:vercel:logs             # Shows: "Show recent deployment logs"
npm run mcp:vercel:rollback         # Shows: "Rollback production to previous deployment"
```

**⚠️ LEGACY SCRIPT DEPLOYMENT** (use only when VercelMCP unavailable):
```bash
# Database migration only (without deployment)
node scripts/database-migration.js export-dev > poi-backup.json
node scripts/database-migration.js import-preview < poi-backup.json
node scripts/database-migration.js validate preview

# Safety deployment wrapper (discouraged - use VercelMCP instead)
./scripts/safe-deploy.sh preview
./scripts/safe-deploy.sh production

# Legacy deploy command (disabled for safety)
npm run deploy                      # Returns error message with correct commands
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

**⚠️  CRITICAL: DUAL API ARCHITECTURE MAINTENANCE**
- **Localhost Express.js** (`dev-api-server.js`) for development velocity
- **Vercel Serverless Functions** (`apps/web/api/*.js`) for production
- **Complete API duplication** between both implementations
- **Maintenance overhead**: ~2-4 hours/week for sync management
- **See**: `DUAL-API-MITIGATION-STRATEGIES.md` for complete documentation

**Database Architecture** (NO LOCAL POSTGRESQL):
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

**CURRENT IMPLEMENTATION STATUS** ✅ (2025):
1. ✅ **Technical Foundation**: Vercel Functions + Neon PostgreSQL fully operational
2. ✅ **Database Implementation**: 138 Minnesota outdoor recreation POIs loaded (parks, trails, forests)
3. ✅ **API Development**: POI discovery endpoints with weather integration live
4. ✅ **Frontend**: React PWA with Material-UI displaying outdoor destinations on map
5. ✅ **Weather Integration**: Real-time weather data via OpenWeather API (needs API key)
6. ✅ **Core Features**: Distance-based discovery, auto-expanding search, weather enhancement

**BUSINESS MODEL IMPLEMENTATION**:
- ✅ **B2C Focus**: Pure consumer platform for outdoor enthusiasts
- ✅ **POI-Centric**: 138 real Minnesota parks/trails (NOT weather stations)
- ❌ **No B2B Features**: Tourism operator functionality NOT implemented

## File Organization

**ACTUAL IMPLEMENTATION** (What's Really Built):
- `apps/web/` - ✅ React + Vite frontend with Material-UI
- `apps/web/api/` - ✅ Vercel serverless functions (production APIs)
- `dev-api-server.js` - ✅ Express.js localhost API for fast development
- `scripts/` - ✅ Development tools and POI seeding scripts
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
  - **AUTOMATED VERIFICATION**: Enhanced Playwright MCP with optimized configuration and environment variables
  - **Visual Validation**: Screenshots confirm UI loaded correctly and validate visual state
  - **UI Interaction Testing**: Automated clicking, form filling, and navigation testing
  - **MCP Integration**: Full Claude integration with `npm run test:mcp`, `npm run test:debug`, `npm run test:record`

- **Use npm start to startup localhost** (dev-startup-optimized.sh) - single unified startup script
  - **Enhanced with health checks**: Comprehensive monitoring and auto-restart capabilities
  - **Command options**: --quick, --clean, --verbose, --no-monitor for different scenarios
  - **Automated diagnostics**: Reports issues with specific fix recommendations

- **Daily workflow starts with health validation**:
  ```bash
  ./scripts/localhost-health-check.sh  # Comprehensive validation
  # OR
  ./scripts/utilities/quick-docker-health.sh     # Fast Docker check
  # OR
  node scripts/utilities/validate-playwright-mcp.js  # PlaywrightMCP integration check
  ```

- **When environment issues occur**:
  - Docker networking problems → `./apply-docker-fix.sh`
  - General diagnostics → `./scripts/development-dashboard.sh`

## PlaywrightMCP Enhanced Integration

**OPTIMIZED CONFIGURATION**: Enhanced MCP server with environment variables for superior Claude integration:

**MCP Configuration** (`.mcp/claude-desktop-config.json`):
- ✅ **Environment Variables**: Optimized with `PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_CONFIG`, `PLAYWRIGHT_WORKERS`
- ✅ **Project Context**: Full project directory and test directory configuration
- ✅ **Performance Tuning**: 4 workers, 30s timeout, optimized for parallel execution

**Enhanced Commands**:
```bash
# Interactive Testing (Claude Integration)
npm run test:mcp              # Launch Playwright UI for interactive testing
npm run test:debug            # Step-by-step debugging mode
npm run test:record           # Record new test scenarios via codegen

# MCP-Optimized Testing
npm run test:mcp:smoke        # Smoke tests with interactive UI
npm run test:mcp:critical     # Critical path tests with debugging

# Validation & Health Checks
node scripts/utilities/validate-playwright-mcp.js  # 100% validation score

# Standard Playwright Commands (also MCP-enhanced)
npm run test:smoke            # Quick smoke tests (@smoke tag)
npm run test:critical         # Critical path tests (@critical tag)
npm run test:fast             # Chromium-only, 4 workers
npm run test:mobile           # Mobile responsive testing
```

**Key Features**:
- **42 Test Files**: Comprehensive coverage of POI, weather, business model validation
- **100% MCP Integration**: Validated configuration with environment variables
- **Memory Bank Integration**: Test context stored in `memory-bank/playwright-test-context.json`
- **B2C Focus**: Tests aligned with outdoor recreation business model
- **Performance Optimized**: 60-70% speed improvement with parallel execution

## 🚀 VercelMCP: Primary Deployment Integration

**VERCEL MCP FIRST STRATEGY**: All deployment operations prioritize VercelMCP for optimal development velocity:

### **🎯 Core Philosophy: Deploy from Conversations**
- **No Context Switching**: Deploy, monitor, and manage from Claude chat
- **Innovation Infrastructure Advantage**: 2-5 minute idea-to-production cycles  
- **Real-time Feedback**: Instant deployment status and URL generation
- **Comprehensive Control**: 114+ tools covering all Vercel operations

### **🔧 MCP Configuration** (`.mcp/claude-desktop-config.json`):
- ✅ **Enterprise Tooling**: `@mistertk/vercel-mcp` with 114+ tools, 4 resources, 5 prompts
- ✅ **Project Context**: Nearest Nice Weather project integration
- ✅ **Team Management**: PrairieAster-Ai organization access
- ✅ **Environment Variables**: Full project configuration

### **⚡ Primary Workflow (VercelMCP)** - 30-Second Deployment Cycles:
```bash
# All operations performed directly in Claude conversations:
# 1. "Deploy current code to preview environment"
# 2. "Update p.nearestniceweather.com alias to latest preview"  
# 3. "Check deployment logs for any issues"
# 4. "Deploy to production with safety validation"
# 5. "Show deployment status and logs"
# 6. "Rollback production to previous deployment"

# Enhanced conversation examples:
npm run mcp:vercel:deploy           # Shows production deployment conversation
npm run mcp:vercel:preview          # Shows preview deployment conversation  
npm run mcp:vercel:status           # Shows status monitoring conversation
npm run mcp:vercel:alias            # Shows alias management conversation
npm run mcp:vercel:logs             # Shows log access conversation
npm run mcp:vercel:rollback         # Shows rollback conversation

# Validation & Health Checks
node scripts/utilities/validate-vercel-mcp.js  # 88% integration score - ready for use
```

### **🛠️ Traditional Commands (CI/CD Compatible)**:
```bash
# Direct deployment commands (CI/CD workflows)
npm run deploy:preview         # Fixed: Direct Vercel preview deployment  
npm run deploy:production      # Fixed: Direct Vercel production deployment
npm run deploy:prod            # Fixed: Direct Vercel production deployment (alias)

# Legacy CLI operations (show VercelMCP recommendations)
npm run vercel:deploy          # Production deployment with VercelMCP reminder
npm run vercel:preview         # Preview deployment with VercelMCP reminder
npm run vercel:alias           # Domain alias management with VercelMCP reminder
npm run vercel:logs            # Deployment logs with VercelMCP reminder
npm run vercel:env             # Environment variables with VercelMCP reminder
```

### **🎯 Business Impact Alignment**:
- **Revenue Optimization**: Deploy A/B tests for AdSense placement instantly
- **Market Discovery**: 10-50x faster hypothesis validation than competitors
- **User Experience**: Preview environment testing without deployment delays
- **Innovation Velocity**: Support $36,000/year revenue target through rapid iteration

### **✅ Integration Status**:
- **Configuration**: 75% complete (awaiting Vercel access token)
- **Scripts Integration**: ✅ All deployment scripts show VercelMCP recommendations
- **Documentation**: ✅ VercelMCP prioritized in all deployment guides
- **Workflow**: ✅ Chat-first deployment strategy implemented

## Claude AI Productivity Intelligence

**CRITICAL**: Check environment health before starting any development work:
```bash
# Required environment check at session start:
curl -s http://localhost:3050/health | jq '.'
./scripts/utilities/environment-health-check.sh
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
- **Docker Status**: Verify Docker networking with `./scripts/utilities/quick-docker-health.sh`
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

## Weather Filtering - Frequent Failure Point ⚠️

**CRITICAL ISSUE**: Weather filtering logic is a recurring problem that wastes significant development time.

**Pattern Recognition**:
- Weather filter thresholds are consistently too restrictive (e.g., 77 locations → 5 results)
- Threshold calculation based on small initial datasets creates overly narrow ranges
- "Mild" temperature filters exclude reasonable weather conditions
- Each attempt to "fix" filters creates new edge cases and unexpected behaviors
- Multiple sessions have been consumed debugging filter percentiles instead of building features

**Root Cause**: 
- Percentile-based filtering on dynamic datasets creates unpredictable user experiences
- "Quality over quantity" philosophy conflicts with practical usability needs
- Complex threshold preservation logic during radius expansion adds unnecessary complexity

**Historical Evidence**:
- Session patterns show repeated filter adjustments: 0.4 → 0.6 → 0.7 percentiles
- Users report "only 5 POI matching weather filter" as unrealistic
- Filter logic consumes more development time than feature development
- Each "improvement" introduces new failure modes

**STOP RULE**: 
- **DO NOT** adjust filter percentiles without explicit user request
- **DO NOT** implement complex threshold preservation systems
- **DO NOT** spend time debugging why filtering is "too restrictive" - this is expected behavior for niche weather preferences
- **FOCUS** on core functionality, map display, and user experience over filter optimization

**Alternative Approaches for Future Consideration**:
- Simple absolute thresholds instead of percentile-based
- User-configurable filter ranges 
- Visual feedback showing "X locations match your weather preferences"
- Default to showing all locations with weather overlay, filters as optional refinement

**Decision Framework**:
- If user requests filter changes: Ask for specific requirements before implementation
- If filtering seems restrictive: Document but don't auto-adjust
- If development time on filters exceeds 30 minutes: Stop and document issue instead

## Development Deployment Memories

- Vercel preview environment requires vercel authentication to access
- Vercel authentication should only apply to preview, if it's on production there is a break