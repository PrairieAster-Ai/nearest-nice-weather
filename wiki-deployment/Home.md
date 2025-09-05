# Nearest Nice Weather - Developer Documentation Wiki

> **Complete technical documentation for rapid developer onboarding**

## 🎯 What is Nearest Nice Weather?

A **B2C outdoor recreation discovery platform** helping Minnesota residents find parks, trails, and nature centers with perfect weather conditions.

**Business Model**: Ad-supported free platform targeting 10,000+ casual outdoor enthusiasts
**Technical Stack**: React + TypeScript frontend, Node.js/Vercel serverless backend, Neon PostgreSQL
**Data**: 138 Minnesota outdoor recreation POIs with real-time weather integration

---

## 🚀 New Developer? Start Here!

### 1. **[Developer Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md)** ⭐
**Complete onboarding in 5 minutes**
- Environment setup and installation
- Key codebase navigation
- Common development tasks
- Debugging and troubleshooting

### 2. **[Application Architecture](WIKI-FRONTEND-ARCHITECTURE.md)**
**Understand the technical foundation**
- React component hierarchy and patterns
- Custom hooks and state management
- Services and utility functions
- Testing strategies and performance

### 3. **[API Reference](WIKI-API-REFERENCE.md)**
**Master the backend APIs**
- Complete endpoint documentation with examples
- Dual API architecture (development vs production)
- Weather integration and filtering logic
- Database query patterns

### 4. **[Database Schema](WIKI-DATABASE-SCHEMA.md)**
**Know your data model**
- POI locations table structure and indexes
- Sample queries and data operations
- Performance optimization strategies
- Maintenance and backup procedures

---

## 📁 Documentation Categories

### 🏗️ **Core Architecture**
| Document | Purpose | Target Audience |
|----------|---------|----------------|
| [API Reference](WIKI-API-REFERENCE.md) | Complete API docs with examples | Backend developers, full-stack |
| [Frontend Architecture](WIKI-FRONTEND-ARCHITECTURE.md) | React component and hook patterns | Frontend developers, UI/UX |
| [Database Schema](WIKI-DATABASE-SCHEMA.md) | Data model and query optimization | Backend developers, DevOps |

### ⚡ **Getting Started**
| Document | Purpose | Target Audience |
|----------|---------|----------------|
| [Developer Quick Start](WIKI-DEVELOPER-QUICKSTART.md) | 5-minute onboarding guide | All new developers |
| Project README | Business overview and context | Product managers, stakeholders |
| CLAUDE.md | AI context and development rules | AI-assisted development |

### 🛠️ **Development Workflow**
| Process | Description | Documentation |
|---------|-------------|---------------|
| **Local Development** | Express.js API + React frontend | [Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md) |
| **Testing Strategy** | React Testing Library + Vitest | [Frontend Architecture](WIKI-FRONTEND-ARCHITECTURE.md) |
| **Deployment Process** | Vercel preview → production | [API Reference](WIKI-API-REFERENCE.md) |
| **Database Management** | Neon PostgreSQL branching | [Database Schema](WIKI-DATABASE-SCHEMA.md) |

---

## 🎯 Common Developer Tasks

### **Frontend Development**
```bash
# Start development environment
npm start

# Create new component
mkdir apps/web/src/components/NewComponent
# See: Frontend Architecture Guide

# Add custom hook
touch apps/web/src/hooks/useNewHook.ts
# See: React Hooks Patterns
```

### **Backend Development**
```bash
# Add API endpoint (dual architecture)
# 1. Edit dev-api-server.js (development)
# 2. Create apps/web/api/new-endpoint.js (production)
# See: API Reference Guide

# Database operations
# See: Database Schema Guide
```

### **Testing & Quality**
```bash
# Run test suite
npm test

# Type checking
npm run type-check

# Environment validation
./scripts/environment-validation.sh localhost
```

### **Deployment**
```bash
# Preview environment
npm run deploy:preview

# Production (with confirmation)
npm run deploy:production
```

---

## 🗃️ Key Technical Concepts

### **Dual API Architecture**
- **Development**: Express.js server (`dev-api-server.js`) for fast iteration
- **Production**: Vercel Edge Functions (`apps/web/api/*.js`) for serverless deployment
- **Sync Requirement**: API changes must be made in both environments

### **Data Model**
- **Primary Table**: `poi_locations` (138 Minnesota outdoor recreation destinations)
- **Focus**: Parks, trails, nature centers, forests (NOT cities or weather stations)
- **Geographic Scope**: Minnesota bounds constraint (43.5-49.4°N, -97.2--89.5°W)

### **Weather Integration**
- **Current**: Mock weather data for consistent development/testing
- **Future**: Real OpenWeather API integration planned
- **Filtering**: Percentile-based relative weather preferences (cold/mild/hot)

### **State Management**
- **React Query**: Server state and API caching
- **localStorage**: User preferences and settings persistence
- **React Context**: App-wide state coordination

---

## 🧭 Navigation by Role

### **New Team Member**
1. Start with [Developer Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md)
2. Read project README for business context
3. Explore [Frontend Architecture](WIKI-FRONTEND-ARCHITECTURE.md) for UI patterns
4. Review [API Reference](WIKI-API-REFERENCE.md) for backend integration

### **Frontend Developer**
1. [Frontend Architecture](WIKI-FRONTEND-ARCHITECTURE.md) - Component patterns and hooks
2. [API Reference](WIKI-API-REFERENCE.md) - Frontend API integration
3. [Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md) - Development workflow

### **Backend Developer**
1. [API Reference](WIKI-API-REFERENCE.md) - Complete endpoint documentation
2. [Database Schema](WIKI-DATABASE-SCHEMA.md) - Data model and queries
3. [Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md) - Environment setup

### **Full-Stack Developer**
1. [Developer Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md) - Complete setup
2. [API Reference](WIKI-API-REFERENCE.md) - Backend architecture
3. [Frontend Architecture](WIKI-FRONTEND-ARCHITECTURE.md) - Frontend patterns
4. [Database Schema](WIKI-DATABASE-SCHEMA.md) - Data layer understanding

### **DevOps/Infrastructure**
1. [Database Schema](WIKI-DATABASE-SCHEMA.md) - Infrastructure and performance
2. [API Reference](WIKI-API-REFERENCE.md) - Deployment configuration
3. [Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md) - Environment validation

---

## 🔍 Quick Reference

### **Essential URLs**
- **Production**: https://nearestniceweather.com
- **Preview**: https://p.nearestniceweather.com
- **API Health**: `/api/health`
- **Primary Endpoint**: `/api/poi-locations-with-weather`

### **Development Ports**
- **Frontend**: http://localhost:3003
- **API Server**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health

### **Key Files**
- **Main App**: `apps/web/src/App.tsx`
- **Dev API**: `dev-api-server.js`
- **Prod APIs**: `apps/web/api/*.js`
- **Configuration**: `CLAUDE.md`, `.env`

### **Database**
- **Platform**: Neon PostgreSQL (serverless)
- **Primary Table**: `poi_locations` (138 Minnesota outdoor POIs)
- **Connection**: Environment variable `DATABASE_URL`

---

## 🆘 Need Help?

### **Common Issues**
| Problem | Solution | Documentation |
|---------|----------|---------------|
| Database connection failed | Check `DATABASE_URL` in `.env` | [Database Schema](WIKI-DATABASE-SCHEMA.md) |
| API endpoint not found | Verify both dev and prod APIs | [API Reference](WIKI-API-REFERENCE.md) |
| Frontend won't load | Check TypeScript errors | [Frontend Architecture](WIKI-FRONTEND-ARCHITECTURE.md) |
| Tests failing | Review test patterns | [Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md) |

### **Debug Commands**
```bash
# Environment health check
./scripts/environment-validation.sh localhost

# API connectivity
curl http://localhost:4000/api/health

# Database verification
npm run db:check-integrity

# Test suite
npm test -- --verbose
```

### **Emergency Procedures**
```bash
# Rollback to last known good state
git checkout ui-working-baseline

# Quick environment reset
npm run reset:environment

# Production issue escalation
# 1. Check https://nearestniceweather.com/api/health
# 2. Review Vercel deployment logs
# 3. Validate database connectivity
```

---

## 📈 Recent Updates

- **API Documentation**: Complete endpoint reference with examples
- **Frontend Architecture**: React patterns and testing strategies
- **Database Schema**: Performance optimization and maintenance
- **Developer Onboarding**: 5-minute quick start guide

**Last Updated**: August 14, 2025
**Documentation Status**: ✅ Complete and ready for new developer onboarding

---

**Ready to contribute to Minnesota's premier outdoor recreation discovery platform? Start with the [Developer Quick Start Guide](WIKI-DEVELOPER-QUICKSTART.md)!** 🎉
