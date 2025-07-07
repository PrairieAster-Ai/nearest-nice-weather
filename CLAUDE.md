# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Nearest Nice Weather" project - a weather intelligence platform connecting outdoor enthusiasts with optimal weather conditions. 

**Core Business Philosophy**: [The Innovation Infrastructure Advantage](documentation/business-plan/innovation-velocity-principles.md) - we optimize technical architecture for rapid experimentation and learning speed, creating competitive advantage through faster market discovery.

**Target Market**: Minnesota tourism operators (ice fishing guides, BWCA outfitters, resorts) and outdoor recreation enthusiasts.

## Repository Structure

- `documentation/` - Complete business plan, technical architecture, and strategic documentation
  - `business-plan/` - Master plan, executive summary, implementation roadmap
  - `appendices/` - Market research, user personas, financial assumptions
  - `sessions/` - Action items and focused work tracking
  - `architecture-overview.md` - Complete technical specification for FastAPI + Directus + PostGIS stack

## Development Commands

**Environment Setup** (SIMPLIFIED - Environment Variables):
```bash
# 1. Copy environment template and configure
cp .env.example .env

# 2. Edit .env with your Neon database URL (get from Neon Dashboard)
# DATABASE_URL="postgresql://[username]:[password]@[hostname]/weather?sslmode=require"

# 3. Run development environment
cd apps/web && npm run dev

# The development server will proxy API calls to production automatically
# No local API server needed - all configuration via .env files
```

**Environment Variables** (Required):
- `DATABASE_URL`: Neon PostgreSQL connection string
- `POSTGRES_URL`: Alternative name for Vercel compatibility
- Development vs production managed automatically

**Development Tools** (SIMPLIFIED STACK):
- ✅ **Neon PostgreSQL Database** (cloud-hosted, no local setup required)
- ✅ Redis cache on port 6379 (local for sessions only)
- ✅ **Vercel API Functions** (serverless, connected to Neon)
- ✅ **Frontend (Next.js PWA) on port 3000** (LIVE with Neon integration)
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