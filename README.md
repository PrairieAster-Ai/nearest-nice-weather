# 🏞️ Nearest Nice Weather

<div align="center">

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://www.nearestniceweather.com)
[![Build Status](https://github.com/PrairieAster-Ai/nearest-nice-weather/workflows/CI/badge.svg)](https://github.com/PrairieAster-Ai/nearest-nice-weather/actions)
[![Coverage](https://img.shields.io/badge/coverage-85%25-green)](https://github.com/PrairieAster-Ai/nearest-nice-weather)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/PrairieAster-Ai/nearest-nice-weather)](https://github.com/PrairieAster-Ai/nearest-nice-weather/graphs/contributors)

**Find Minnesota parks and trails with perfect conditions for your outdoor adventures**

[🌟 Try Live Demo](https://www.nearestniceweather.com) •
[📊 Project Board](https://github.com/orgs/PrairieAster-Ai/projects/2) •
[📚 Documentation](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki)

</div>

---

## 🚀 Quick Access

| For                   | Link                                                                                        | Purpose                               |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| **🌟 Users**          | [Live App](https://www.nearestniceweather.com)                                              | Try the context-optimized park finder |
| **📱 Mobile**         | [Install PWA](https://www.nearestniceweather.com)                                           | Add to homescreen                     |
| **👩‍💻 Developers**  | [Quick Start](#-quick-start)                                                                | 15-minute local setup                 |
| **📊 Project Status** | [GitHub Project](https://github.com/orgs/PrairieAster-Ai/projects/2)                        | Current roadmap                       |
| **🏗️ API Docs**      | [API Reference](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/API-Reference) | Integration guide                     |

## 🎯 Business Model & Target Market

**What We Are**: B2C context-optimized outdoor recreation discovery platform
**Target Users**: Casual outdoor enthusiasts in Minnesota metro areas seeking free/frugal activities
**Core Value**: "Find the nearest parks with nice weather for your outdoor plans"
**Revenue Model**: Ad-supported free platform (B2C only - no B2B features)

## 🗺️ Core Features

- **Outdoor Recreation POIs**: State parks, trails, forests, nature centers
- **Weather-Enhanced Discovery**: Real-time weather data enhances outdoor activity planning
- **Distance-Based Navigation**: Find destinations from closest to farthest
- **Auto-Expanding Search**: Automatically expands search radius for users in remote areas
- **Mobile-First PWA**: Progressive Web App optimized for on-the-go outdoor planning

## 🛠️ Technology Stack

| Layer          | Technology       | Version | Status        |
| -------------- | ---------------- | ------- | ------------- |
| **Frontend**   | React + Vite     | 18.3.1  | ✅ Production  |
| **UI Library** | Material-UI      | 6.0.1   | ✅ Active      |
| **Backend**    | Vercel Functions | Latest  | ✅ Serverless  |
| **Database**   | Neon PostgreSQL  | 15+     | ✅ Cloud       |
| **Maps**       | Leaflet          | 1.9.4   | ✅ Interactive |
| **Weather**    | OpenWeather API  | v2.5    | ✅ Real-time   |

## 🏗️ Technical Architecture

**Frontend**: Vite + React + Material-UI Progressive Web App
**Backend**: Vercel Edge Functions (serverless Node.js)
**Database**: Neon PostgreSQL with `poi_locations` table
**APIs**: RESTful POI discovery with weather integration
**Deployment**: Vercel platform with preview/production environments

## 🚀 Quick Start

### Team Member Onboarding (<15 minutes)

```bash
# NEW TEAM MEMBERS: Use automated onboarding script
./scripts/team-onboarding.sh
# Automated: dependencies, environment, validation, startup
# Target: Productive development in <15 minutes

# ALTERNATIVE: Manual setup
npm install                                    # Install dependencies
cp .env.example .env                          # Configure environment
npm start                                     # Start development servers
./scripts/environment-validation.sh localhost # Validate setup
```

### Development Environment

```bash
# Start all services (recommended)
npm start                    # Frontend (3002) + API (4000) + health checks
npm run start:quick          # Fast startup, skip optional features
npm run start:clean          # Clean restart (clear caches)

# Individual services
cd apps/web && npm run dev   # Frontend only (port 3002)
node dev-api-server.js       # API only (port 4000)

# Environment validation
./scripts/environment-validation.sh localhost   # Comprehensive validation
./scripts/localhost-health-check.sh            # Quick health check

# Data-driven sprint management
node scripts/velocity-tracker.js calculate "Sprint Name"  # Sprint analytics & recommendations
```

## 🎯 Usage Examples

### Find Nearby Parks

```bash
curl "https://www.nearestniceweather.com/api/poi-locations-with-weather?limit=5"
```

### Search by Weather Conditions

```bash
# Find parks with mild weather (temp 65-75°F)
curl "https://www.nearestniceweather.com/api/poi-locations?weather_filter=mild"
```

### Mobile PWA Installation

1. Visit https://www.nearestniceweather.com on mobile
2. Tap browser menu → "Add to Home Screen"
3. Launch from homescreen like native app

### Key API Endpoints

- `GET /api/poi-locations-with-weather` - Primary POI discovery with weather data
- `GET /api/poi-locations` - Basic POI data
- `POST /api/feedback` - User feedback submission

### Deployment

```bash
# Deploy to preview environment (safe testing)
npm run deploy:preview

# Deploy to production (requires confirmation)
npm run deploy:production
```

## 📊 Project Health

### Environment Status

| Environment                                         | Status       | Health Check                                              | Last Deploy |
| --------------------------------------------------- | ------------ | --------------------------------------------------------- | ----------- |
| 🌐 [Production](https://www.nearestniceweather.com) | ✅ Live       | [Test API](https://www.nearestniceweather.com/api/health) | 2 days ago  |
| 🔍 [Preview](https://p.nearestniceweather.com)      | ✅ Active     | [Test API](https://p.nearestniceweather.com/api/health)   | 1 day ago   |
| 💻 Localhost                                        | ⚙️ On-demand | Run `npm start`                                           | -           |

### Data Coverage

- **POIs**: State parks, trails, forests, nature centers
- **Real-time Weather**: OpenWeather API integration
- **Geographic Bounds**: Minnesota-focused (43.5-49.4°N, -97.2--89.5°W)

### Development Metrics

- **🔄 Build Success Rate**: 94% (last 30 builds)
- **⚡ API Response Time**: 638ms average
- **🌐 Uptime**: 99.8% (last 30 days)
- **📱 Mobile Performance**: 92/100 Lighthouse score

## 📊 Data Architecture

**Primary Table**: `poi_locations`

- Expansive Minnesota outdoor recreation destinations
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
- **Database Seeding**: `/scripts/seed-minnesota-parks.js` - outdoor destinations

## 🧭 Development Guidelines

1. **POI-First Development**: All features should enhance outdoor recreation discovery
2. **Weather as Context**: Weather enhances activity planning but isn't the primary focus
3. **Mobile Optimization**: Design for users checking conditions while planning trips
4. **Minnesota Focus**: All POIs and features target Minnesota outdoor enthusiasts
5. **B2C Only**: No B2B tourism operator features or enterprise functionality

## 🔒 Security & Quality Assurance

**Team Development Quality Gates** (Optimized 2025-09-05):

- **ESLint Configuration**: Warnings instead of blocking errors for rapid team onboarding
- **GitHub Actions CI/CD**: Automated testing, security scanning, and deployment
- **Pre-commit Security**: gitleaks, detect-secrets, custom credential validation
- **Automated Testing**: Quality checks on every pull request
- **3-Layer Protection**: Pre-commit + CI/CD + runtime monitoring

**Quality Commands**:

```bash
# Team-friendly quality checks
npm run lint              # ESLint warnings (non-blocking)
npm run build             # Build validation
npm run ci:quality        # Complete quality suite

# Security validation
node scripts/security/validate-env.cjs
./scripts/ci-test.sh      # CI tests with security checks
pre-commit run --all-files
```

**GitHub Actions Pipeline**:

- ✅ **Quality Gates**: Lint, type-check, build validation on all PRs
- ✅ **Security Scanning**: Automated vulnerability detection
- ✅ **Preview Deployments**: Automatic preview environment for PRs
- ✅ **Production Protection**: Manual approval required for production deployments

## 🛠️ Maintenance & Operations

- **Health Monitoring**: `./scripts/environment-validation.sh [environment]`
- **Database Management**: POI data in `poi_locations` table only
- **Dual API Architecture**: Sync localhost (`dev-api-server.js`) with Vercel (`apps/web/api/`)
- **Environment Variables**: Separate `.env` (development) and Vercel dashboard (production)
- **Security Monitoring**: Automated credential scanning and vulnerability detection

## 🗺️ Roadmap & Future Features

### Current Sprint (In Progress)

- ✅ Media.net contextual advertising
- 🔄 Enhanced mobile PWA features
- 🔄 Weather filtering optimization

### Next Quarter (Q4 2025)

- 📱 Native mobile app development
- 🌦️ Extended weather forecasting (7-day)
- 🎯 User preference learning
- 📊 Advanced analytics dashboard

### Future Vision (2026+)

- 🗺️ Multi-state expansion (Wisconsin, Iowa)
- 🤝 Partnership with state park systems
- 🔔 Push notifications for weather alerts
- 🎮 Gamification and user rewards

## 📈 Success Metrics

- **User Engagement**: Outdoor enthusiasts finding nearby recreation opportunities
- **POI Coverage**: Destinations across diverse outdoor categories
- **Weather Accuracy**: Real-time conditions for informed activity planning
- **Mobile Performance**: Fast, responsive experience for on-the-go users

## 🚫 What This Project Is NOT

- ❌ NOT a weather station or meteorological data platform
- ❌ NOT a B2B tourism operator marketplace
- ❌ NOT using complex microservices (simple serverless functions)
- ❌ NOT national scope (Minnesota-focused for MVP)
- ❌ NOT paid/premium features (ad-supported B2C model)

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test locally (`npm start`)
4. Run quality checks (`npm run lint && npm run build`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- **ESLint**: Follow project linting rules
- **Testing**: Add tests for new features
- **Documentation**: Update relevant docs
- **POI-First**: All features should enhance outdoor recreation discovery

### Contributors

<a href="https://github.com/PrairieAster-Ai/nearest-nice-weather/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PrairieAster-Ai/nearest-nice-weather" alt="Contributors" />
</a>

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

<!-- Testing Vercel secrets: Tue Sep  9 02:47:18 PM CDT 2025 -->
# Vercel token test - Tue Sep  9 03:02:00 PM CDT 2025
