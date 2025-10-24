# 🏗️ Actual Technical Architecture - Nearest Nice Weather (2025)

**⚠️ CRITICAL**: This document reflects the ACTUAL implementation. Ignore legacy FastAPI/PostGIS documentation.

## 🎯 Architecture Overview

### **Business Model Alignment**
- **Purpose**: B2C outdoor recreation discovery platform for Minnesota
- **Users**: Casual outdoor enthusiasts seeking parks/trails with nice weather
- **Scale**: POI locations, targeting 10,000+ active users
- **Revenue**: Ad-supported free platform (no premium features)

### **Technology Stack (What's Actually Deployed)**

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (PWA)                         │
│         React + Vite + Material-UI + Leaflet            │
│              Hosted on Vercel CDN                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ├── Static Assets (CDN)
                           └── API Calls
                           │
┌─────────────────────────────────────────────────────────┐
│              Backend (Serverless)                        │
│         Vercel Edge Functions (Node.js)                  │
│    • /api/poi-locations-with-weather (PRIMARY)          │
│    • /api/poi-locations                                  │
│    • /api/feedback                                       │
└─────────────────────────────────────────────────────────┘
                           │
                           └── SQL Queries
                           │
┌─────────────────────────────────────────────────────────┐
│              Database (Cloud)                            │
│           Neon PostgreSQL (Serverless)                   │
│     • poi_locations table (138 outdoor POIs)            │
│     • user_feedback table                                │
│     • Deprecated: locations, weather_conditions          │
└─────────────────────────────────────────────────────────┘
                           │
                           └── Weather API Integration
                           │
┌─────────────────────────────────────────────────────────┐
│            External Services                             │
│     • OpenWeather API (weather data)                     │
│     • Geolocation API (user location)                    │
└─────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema (Actual)

### **Primary Table: `poi_locations`**
```sql
CREATE TABLE poi_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,              -- "Gooseberry Falls State Park"
    lat DECIMAL(10, 8) NOT NULL,             -- 47.1389
    lng DECIMAL(11, 8) NOT NULL,             -- -91.4706
    park_type VARCHAR(100),                  -- "State Park", "Trail System", etc.
    data_source VARCHAR(50),                 -- "seed_script", "manual"
    description TEXT,                        -- User-friendly description
    place_rank INTEGER DEFAULT 30,           -- Importance (10=National, 15=State, 20=Regional)
    osm_id BIGINT,                          -- OpenStreetMap reference (optional)
    osm_type VARCHAR(10),                   -- OSM type (optional)
    search_name JSONB,                      -- Alternative names for search
    external_id VARCHAR(100),               -- Unique identifier from seeding
    last_modified TIMESTAMP DEFAULT NOW(),

    -- Minnesota bounds constraint
    CONSTRAINT poi_minnesota_bounds CHECK (
        lat BETWEEN 43.499356 AND 49.384472 AND
        lng BETWEEN -97.239209 AND -89.491739
    )
);

-- Current data: 138 Minnesota outdoor recreation destinations
```

### **Secondary Table: `user_feedback`**
```sql
CREATE TABLE user_feedback (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(50),
    user_agent TEXT,
    ip_address VARCHAR(45),
    session_id VARCHAR(255),
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔌 API Architecture (Serverless Functions)

### **Primary API: `/api/poi-locations-with-weather`**
```javascript
// Vercel Edge Function (apps/web/api/poi-locations-with-weather.js)
export default async function handler(req, res) {
    const { lat, lng, limit = 200 } = req.query;

    // Query POI locations from database
    const poiQuery = sql`
        SELECT id, name, lat, lng, park_type, description, place_rank,
            (3959 * acos(...)) as distance_miles  -- Haversine formula
        FROM poi_locations
        WHERE park_type IS NOT NULL
        ORDER BY distance_miles ASC
        LIMIT ${limit}
    `;

    // Enhance with weather data
    const poisWithWeather = pois.map(poi => ({
        ...poi,
        temperature: getWeatherData(poi.lat, poi.lng).temp,
        condition: getWeatherData(poi.lat, poi.lng).condition,
        // ... weather fields
    }));

    return res.json({ success: true, data: poisWithWeather });
}
```

### **Development vs Production Architecture**

| Environment | Frontend | Backend | Database |
|------------|----------|---------|----------|
| **Localhost** | Vite dev server (3003) | Express.js (4000) | Neon dev branch |
| **Preview** | Vercel CDN | Vercel Functions | Neon prod branch |
| **Production** | Vercel CDN | Vercel Functions | Neon prod branch |

**Dual API Architecture**:
- `dev-api-server.js` - Fast localhost development with hot reload
- `apps/web/api/*.js` - Production serverless functions
- **Maintenance**: Must sync changes between both implementations

## 🌤️ Weather Integration

### **Data Flow**
1. User location determined via browser geolocation
2. POIs fetched from database ordered by distance
3. Weather data fetched for each POI location
4. Combined POI+weather data returned to frontend
5. Frontend displays on interactive map

### **Weather Service Integration**
```javascript
// src/services/weatherService.js
export async function fetchWeatherData(lat, lng) {
    // Check 5-minute cache first
    const cached = weatherCache.get(`${lat},${lng}`);
    if (cached) return cached;

    // Fetch from OpenWeather API
    const weather = await fetch(`https://api.openweathermap.org/...`);

    // Cache and return
    weatherCache.set(`${lat},${lng}`, weather);
    return weather;
}
```

## 🚀 Deployment Architecture

### **Vercel Platform Configuration**
```
Production URL: https://nearestniceweather.com
Preview URL: https://p.nearestniceweather.com
API Routes: Automatically deployed from apps/web/api/

Environment Variables (Vercel Dashboard):
- DATABASE_URL / POSTGRES_URL - Neon connection string
- OPENWEATHER_API_KEY - Weather data access
```

### **Build & Deploy Process**
```bash
# Local development
npm start                    # Starts frontend + API

# Preview deployment
npm run deploy:preview       # Creates preview on p.nearestniceweather.com

# Production deployment
npm run deploy:production    # Requires confirmation, deploys to production
```

## 📊 Performance Characteristics

### **Current Scale**
- **POI Data**: 138 outdoor recreation destinations (static dataset)
- **API Response Time**: ~200ms average (POI query + weather fetch)
- **Weather Cache**: 5-minute TTL to reduce API calls
- **Database**: Serverless Neon scales automatically

### **Optimization Strategies**
1. **Edge Functions**: Run close to users via Vercel's global network
2. **Database Indexes**: Geographic and search indexes on poi_locations
3. **Weather Caching**: Reduce external API calls with intelligent caching
4. **Static Assets**: CDN delivery for all frontend resources

## 🔐 Security & Privacy

### **Current Implementation**
- **HTTPS Only**: Enforced by Vercel platform
- **Database**: SSL required for all connections
- **API Keys**: Stored in environment variables, never in code
- **User Data**: Minimal collection (feedback only, no accounts yet)
- **CORS**: Configured for frontend origin only

## 🗺️ Roadmap Alignment

### **Current MVP** ✅
- POI discovery with weather integration
- Distance-based search with auto-expand
- Basic feedback collection

### **Future Enhancements** (Not Implemented)
- User accounts and saved searches
- Advanced filtering (difficulty, amenities)
- Offline PWA capabilities
- Social sharing features

## ⚠️ What This Architecture is NOT

❌ **NOT FastAPI** - Legacy docs mention it, actual is Vercel Functions
❌ **NOT PostGIS** - Using simple PostgreSQL without GIS extensions
❌ **NOT Microservices** - Simple serverless functions only
❌ **NOT Redis/Caching** - Only in-memory weather cache
❌ **NOT Complex** - Intentionally simple for maintainability

---

**For business context, see `/README.md` and `/PROJECT-OVERVIEW-FOR-CLAUDE.md`**
**For API implementation details, see `/dev-api-server.js` (well documented)**
