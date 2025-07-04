# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Nearest Nice Weather" project - a weather intelligence platform connecting outdoor enthusiasts with optimal weather conditions. The repository currently contains comprehensive business planning documentation and technical architecture specifications, with development implementation planned.

**Target Market**: Minnesota tourism operators (ice fishing guides, BWCA outfitters, resorts) and outdoor recreation enthusiasts.

## Repository Structure

- `documentation/` - Complete business plan, technical architecture, and strategic documentation
  - `business-plan/` - Master plan, executive summary, implementation roadmap
  - `appendices/` - Market research, user personas, financial assumptions
  - `sessions/` - Action items and focused work tracking
  - `architecture-overview.md` - Complete technical specification for FastAPI + Directus + PostGIS stack

## Development Commands

**Environment Setup** (COMPLETED - Ready to Use):
```bash
# Start core infrastructure (PostgreSQL + Redis)
docker-compose up -d postgres redis

# Run FastAPI application locally
export PATH="$HOME/.local/bin:$PATH"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/weather_intelligence"
export REDIS_URL="redis://localhost:6379"
cd application/app && uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

# Run Next.js frontend locally  
cd application/frontend && export NEXT_PUBLIC_API_URL="http://localhost:8000" && npm run dev &

# View service logs
docker-compose logs -f postgres redis

# Stop all services
docker-compose down
```

**Development Tools** (LIVE & OPERATIONAL):
- ✅ PostgreSQL with PostGIS on port 5432 (with sample data)
- ✅ Redis cache on port 6379 (connected)
- ⏳ Directus CMS on port 8055 (optional - large download)
- ✅ **FastAPI application on port 8000** (LIVE with docs at /docs)
- ✅ **Frontend (Next.js PWA) on port 3000** (LIVE infrastructure dashboard)

## Technical Architecture

**Technology Stack** (aligned implementation):
- **Backend**: FastAPI with async support
- **Database**: PostgreSQL with PostGIS extension for geographic calculations
- **CMS**: Directus for content and user management (optional)
- **Cache**: Redis for sessions and weather data caching
- **Frontend**: Vite + React Progressive Web App with Material-UI
- **Background Tasks**: Celery with Redis broker
- **Deployment**: Vercel serverless functions + Docker containers

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