# 🏞️ Nearest Nice Weather - B2C Outdoor Recreation Platform

**Discover Minnesota parks, trails, and nature centers with perfect weather conditions for your outdoor adventures.**

## 🎯 Business Model & Target Market

**What We Are**: B2C weather-optimized outdoor recreation discovery platform
**Target Users**: Casual outdoor enthusiasts in Minnesota metro areas seeking free/frugal activities
**Core Value**: "Find the nearest parks with nice weather for your outdoor plans"
**Revenue Model**: Ad-supported free platform (B2C only - no B2B features)

## 🗺️ Core Features

- **138 Minnesota Outdoor Recreation POIs**: State parks, trails, forests, nature centers
- **Weather-Enhanced Discovery**: Real-time weather data enhances outdoor activity planning
- **Distance-Based Navigation**: Find destinations from closest to farthest
- **Auto-Expanding Search**: Automatically expands search radius for users in remote areas
- **Mobile-First PWA**: Progressive Web App optimized for on-the-go outdoor planning

## 🏗️ Technical Architecture

**Frontend**: Vite + React + Material-UI Progressive Web App
**Backend**: Vercel Edge Functions (serverless Node.js)
**Database**: Neon PostgreSQL with `poi_locations` table (138 outdoor destinations)
**APIs**: RESTful POI discovery with weather integration
**Deployment**: Vercel platform with preview/production environments

## 🚀 Quick Start

### Development Setup
```bash
# Install dependencies
npm install

# Configure environment (copy and add your API keys)
cp .env.example .env

# Start development environment (frontend + API)
npm start
# Frontend: http://localhost:3003
# API: http://localhost:4000

# Run health checks
./scripts/environment-validation.sh localhost
```

### Key API Endpoints
- `GET /api/poi-locations-with-weather` - Primary POI discovery with weather data
- `GET /api/poi-locations` - Basic POI data without weather
- `POST /api/feedback` - User feedback submission

### Deployment
```bash
# Deploy to preview environment (safe testing)
npm run deploy:preview

# Deploy to production (requires confirmation)
npm run deploy:production
```

## 📊 Data Architecture

**Primary Table**: `poi_locations`
- 138 Minnesota outdoor recreation destinations
- Parks, trails, forests, nature centers
- Geographic coordinates with importance ranking
- Minnesota-only bounds (43.5-49.4°N, -97.2--89.5°W)

**Deprecated**: Legacy `locations` table (weather stations/cities) - replaced by POI-centric architecture

## 🎯 Business Context for Developers

**@CLAUDE_CONTEXT**: This is a B2C outdoor recreation platform, NOT a weather station app
**@BUSINESS_RULE**: Target users are casual outdoor enthusiasts, NOT businesses or weather researchers
**@DATA_MODEL**: `poi_locations` table contains parks/trails/forests, NOT cities or weather stations
**@ARCHITECTURE**: Vercel serverless + Neon PostgreSQL (NOT FastAPI/PostGIS from legacy docs)

## 📁 Key Project Files

- **Business Model**: `/PURE-B2C-STRATEGY-2025.md` - B2C outdoor recreation focus
- **POI Specification**: `/POI-DATABASE-SPECIFICATION-2025.md` - Outdoor destination data model
- **API Implementation**: `/dev-api-server.js` (localhost), `/apps/web/api/` (production)
- **Frontend Hook**: `/apps/web/src/hooks/usePOINavigation.ts` - Primary UI data integration
- **Database Seeding**: `/scripts/seed-minnesota-parks.js` - 138 outdoor destinations

## 🧭 Development Guidelines

1. **POI-First Development**: All features should enhance outdoor recreation discovery
2. **Weather as Context**: Weather enhances activity planning but isn't the primary focus
3. **Mobile Optimization**: Design for users checking conditions while planning trips
4. **Minnesota Focus**: All POIs and features target Minnesota outdoor enthusiasts
5. **B2C Only**: No B2B tourism operator features or enterprise functionality

## 🔒 Security & Quality Assurance

**Automated Security Pipeline** (Implemented 2025-09-05):
- **Pre-commit Security**: gitleaks, detect-secrets, custom credential validation
- **CI/CD Security**: GitHub Actions with CodeQL, TruffleHog OSS, Dependabot
- **3-Layer Protection**: Pre-commit + CI/CD + runtime monitoring ready
- **Credential Protection**: Zero exposed credentials (97 issues resolved)
- **Test Suite Integration**: Enhanced `./scripts/ci-test.sh` with security validation

**Security Commands**:
```bash
# Run security validation
node scripts/security/validate-env.cjs

# Run CI tests with security checks
./scripts/ci-test.sh

# Run pre-commit security hooks
pre-commit run --all-files
```

## 🛠️ Maintenance & Operations

- **Health Monitoring**: `./scripts/environment-validation.sh [environment]`
- **Database Management**: POI data in `poi_locations` table only
- **Dual API Architecture**: Sync localhost (`dev-api-server.js`) with Vercel (`apps/web/api/`)
- **Environment Variables**: Separate `.env` (development) and Vercel dashboard (production)
- **Security Monitoring**: Automated credential scanning and vulnerability detection

## 📈 Success Metrics

- **User Engagement**: Outdoor enthusiasts finding nearby recreation opportunities
- **POI Coverage**: 138 Minnesota destinations across diverse outdoor categories
- **Weather Accuracy**: Real-time conditions for informed activity planning
- **Mobile Performance**: Fast, responsive experience for on-the-go users

## 🚫 What This Project Is NOT

- ❌ NOT a weather station or meteorological data platform
- ❌ NOT a B2B tourism operator marketplace
- ❌ NOT using complex microservices (simple serverless functions)
- ❌ NOT national scope (Minnesota-focused for MVP)
- ❌ NOT paid/premium features (ad-supported B2C model)

---

## 📚 Documentation

**📖 [Complete Documentation - GitHub Wiki](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki)** - Single Source of Truth ✅

### **🚀 Quick Start Links:**
⭐ **[Developer Quick Start Guide](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Developer-Quick-Start)** - 5-minute onboarding
🏗️ **[API Reference](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/API-Reference)** - Complete endpoint documentation
⚛️ **[Frontend Architecture](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Frontend-Architecture)** - React patterns and components
🗄️ **[Database Schema](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Database-Schema)** - POI data model and queries
📊 **[Executive Summary](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Executive-Summary)** - Business overview and production status

### **🔍 All Claims Validated:**
📋 **[Sources Reference](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Sources-Reference)** - Every statistic backed by 3+ authoritative sources

**For Claude AI context, see `/CLAUDE.md`**
