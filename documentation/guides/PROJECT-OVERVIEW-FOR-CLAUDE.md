# 🤖 Quick Context for Claude Code - Nearest Nice Weather

**⚡ CRITICAL CONTEXT: Read this file first to understand the business model and avoid building wrong features.**

## 🎯 What This Project IS

### **Business Model**: B2C Outdoor Recreation Discovery
- **Target Users**: Casual outdoor enthusiasts in Minnesota seeking free/frugal activities
- **Core Feature**: Find Minnesota parks, trails, forests with optimal weather conditions
- **User Journey**: User opens app → sees nearby outdoor destinations → picks one with nice weather → goes hiking/biking/etc
- **Revenue**: Ad-supported free platform (no premium features)

### **Data Model**: POI-Centric Architecture
- **Primary Data**: Minnesota outdoor recreation POIs in `poi_locations` table
- **POI Types**: State Parks, Trail Systems, State Forests, Nature Centers, Wildlife Refuges
- **Examples**: "Gooseberry Falls State Park", "Paul Bunyan State Trail", "Deep Portage Conservation Reserve"
- **Weather Integration**: Each POI enhanced with real-time weather data for activity planning

### **Current Technical Stack**
- **Frontend**: React + Vite + Material-UI (Progressive Web App)
- **Backend**: Vercel Edge Functions (serverless Node.js)
- **Database**: Neon PostgreSQL (cloud-hosted, no local PostgreSQL)
- **Primary API**: `/api/poi-locations-with-weather` (returns parks + weather)
- **Deployment**: Vercel platform (preview + production environments)

## ❌ What This Project is NOT

### **NOT These Business Models**
- ❌ **NOT Weather Stations**: We don't show meteorological data or weather station locations
- ❌ **NOT City Weather**: We don't show weather for Minneapolis, Saint Paul, etc.
- ❌ **NOT B2B Platform**: No tourism operator features, no business marketplace
- ❌ **NOT Premium/Paid**: No subscription tiers, no paid features

### **NOT These Technologies** (Legacy Documentation Lies)
- ❌ **NOT FastAPI**: Documentation mentions it, but we use Vercel functions
- ❌ **NOT PostGIS**: Documentation mentions it, but we use simple PostgreSQL
- ❌ **NOT Redis**: Documentation mentions it, but we don't use caching
- ❌ **NOT Microservices**: Simple serverless functions, not complex architecture

### **NOT These Data Models**
- ❌ **NOT `locations` table**: Legacy table with cities - we use `poi_locations`
- ❌ **NOT Weather-First**: Weather enhances outdoor activity planning, not primary focus
- ❌ **NOT National Scope**: Minnesota-only for MVP (bounds: 43.5-49.4°N)

## 📋 Common Claude Tasks & Correct Approaches

### **Adding New Features**
✅ **RIGHT**: "Add filtering by trail difficulty for hikers"
❌ **WRONG**: "Add weather station data visualization"

### **Database Queries**
✅ **RIGHT**: `SELECT * FROM poi_locations WHERE park_type = 'State Park'`
❌ **WRONG**: `SELECT * FROM locations` (legacy table with cities)

### **API Development**
✅ **RIGHT**: Enhance `/api/poi-locations-with-weather` for outdoor recreation
❌ **WRONG**: Create weather station APIs or B2B operator endpoints

### **Frontend Components**
✅ **RIGHT**: POI cards showing "Itasca State Park - 72°F, Sunny, Perfect for hiking"
❌ **WRONG**: Weather charts, meteorological data, city weather displays

## 🗂️ Key Files for Understanding

### **Business Logic**
1. **`/README.md`** - Project overview with correct business model
2. **`/PURE-B2C-STRATEGY-2025.md`** - B2C outdoor recreation strategy
3. **`/POI-DATABASE-SPECIFICATION-2025.md`** - POI data model specification

### **Implementation**
1. **`/dev-api-server.js`** - Localhost API with comprehensive POI documentation
2. **`/apps/web/api/poi-locations-with-weather.js`** - Production POI API
3. **`/apps/web/src/hooks/usePOINavigation.ts`** - Frontend POI integration
4. **`/scripts/seed-minnesota-parks.js`** - 138 outdoor destinations data

### **What to Ignore**
- ❌ `/documentation/technical/architecture-overview.md` - Outdated FastAPI/PostGIS docs
- ❌ B2B tourism operator references in business plans - Not implemented
- ❌ Weather station or city-focused documentation - Legacy approach

## 🚀 Quick Development Commands

```bash
# Start development (frontend + API)
npm start

# Test POI API returns parks (not cities)
curl "localhost:4000/api/poi-locations-with-weather?lat=46.7296&lng=-94.6859&limit=3"
# Should return: Deep Portage Conservation Reserve, Foot Hills State Forest, etc.

# Deploy to preview
npm run deploy:preview

# Validate environment
./scripts/environment-validation.sh localhost
```

## 💡 Business Rule Reminders

1. **Every feature** should help users find outdoor recreation destinations
2. **Weather data** enhances activity planning but isn't the main focus
3. **Target user** is a weekend warrior looking for free outdoor fun
4. **Geographic scope** is Minnesota only (no national expansion in MVP)
5. **Revenue model** is ads only (no premium features to build)

## ⚠️ Common Mistakes to Avoid

1. **Building weather station features** - We're about outdoor recreation, not meteorology
2. **Adding B2B functionality** - Pure B2C platform, no business features
3. **Using `locations` table** - Always use `poi_locations` for outdoor destinations
4. **National expansion** - Stay focused on Minnesota POIs only
5. **Complex architecture** - Keep it simple with serverless functions

---

**Remember**: This is a platform for finding great places to hike, bike, and explore outdoors with nice weather - NOT a weather app! 🏞️🌤️
