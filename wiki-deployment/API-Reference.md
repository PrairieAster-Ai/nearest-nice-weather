# API Reference - Nearest Nice Weather

> **For GitHub Wiki**: Complete API documentation for rapid developer onboarding

## 🏗️ Architecture Overview

**Dual API Architecture**: The application maintains two API implementations for optimal development experience:

- **Development**: Express.js server (`dev-api-server.js`) - Port 4000
- **Production**: Vercel Edge Functions (`apps/web/api/*.js`) - Serverless

## 🔌 Core API Endpoints

### 1. Primary POI Discovery API

**Endpoint**: `GET /api/poi-locations-with-weather`  
**Purpose**: Main frontend API - outdoor recreation discovery with weather integration

#### Request Parameters
```javascript
{
  lat?: number,      // User latitude (optional, enables distance sorting)
  lng?: number,      // User longitude (optional, enables distance sorting) 
  limit?: number,    // Max results (default: 200)
  filters?: {        // Weather-based filtering (optional)
    temperature: 'cold' | 'mild' | 'hot' | '',
    precipitation: 'none' | 'light' | 'any' | '',
    wind: 'calm' | 'light' | 'breezy' | 'windy' | ''
  }
}
```

#### Response Format
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Gooseberry Falls State Park",
      "lat": 47.1389,
      "lng": -91.4706,
      "park_type": "State Park",
      "description": "Spectacular waterfalls and Lake Superior hiking",
      "place_rank": 15,
      "distance_miles": 45.2,
      
      // Weather Integration
      "temperature": 72,
      "condition": "sunny",
      "precipitation": 0,
      "wind_speed": "5",
      "humidity": 65,
      "last_weather_update": "2025-08-14T19:30:00Z"
    }
  ],
  "metadata": {
    "total_found": 138,
    "filtered_count": 25,
    "user_location": [44.9537, -93.0900],
    "filter_stats": {
      "temperature_range": "65-78°F",
      "locations_excluded_by_weather": 113
    }
  }
}
```

#### Implementation Examples

**Development Server** (`dev-api-server.js`):
```javascript
app.get('/api/poi-locations-with-weather', async (req, res) => {
  const { lat, lng, limit = 200 } = req.query;
  
  // Distance-based query with Haversine formula
  const distanceClause = lat && lng 
    ? `(3959 * acos(cos(radians(${lat})) * cos(radians(lat)) * 
       cos(radians(lng) - radians(${lng})) + sin(radians(${lat})) * 
       sin(radians(lat)))) as distance_miles`
    : 'NULL as distance_miles';

  const query = `
    SELECT id, name, lat, lng, park_type, description, place_rank,
           ${distanceClause}
    FROM poi_locations 
    WHERE park_type IS NOT NULL
    ${lat && lng ? 'ORDER BY distance_miles ASC' : 'ORDER BY place_rank ASC, name ASC'}
    LIMIT $1
  `;
  
  const result = await pool.query(query, [parseInt(limit)]);
  
  // Enhance with weather data
  const poisWithWeather = await Promise.all(
    result.rows.map(async (poi) => ({
      ...poi,
      ...(await generateMockWeatherData(poi.lat, poi.lng))
    }))
  );
  
  res.json({ success: true, data: poisWithWeather });
});
```

**Production Function** (`apps/web/api/poi-locations-with-weather.js`):
```javascript
export default async function handler(req, res) {
  const { lat, lng, limit = 200 } = req.query;
  
  const distanceSelect = lat && lng 
    ? sql`(3959 * acos(cos(radians(${parseFloat(lat)})) * cos(radians(lat)) * 
           cos(radians(lng) - radians(${parseFloat(lng)})) + 
           sin(radians(${parseFloat(lat)})) * sin(radians(lat)))) as distance_miles`
    : sql`NULL as distance_miles`;

  const locations = await sql`
    SELECT id, name, lat, lng, park_type, description, place_rank, ${distanceSelect}
    FROM poi_locations 
    WHERE park_type IS NOT NULL
    ORDER BY ${lat && lng ? sql`distance_miles ASC` : sql`place_rank ASC, name ASC`}
    LIMIT ${parseInt(limit)}
  `;
  
  // Weather enhancement identical to dev server
  const poisWithWeather = locations.map(poi => ({
    ...poi,
    ...generateMockWeatherData(poi.lat, poi.lng)
  }));
  
  return res.json({ success: true, data: poisWithWeather });
}
```

### 2. Basic POI Data API

**Endpoint**: `GET /api/poi-locations`  
**Purpose**: POI data without weather enhancement (faster, used for map markers)

#### Response Format
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Gooseberry Falls State Park",
      "lat": 47.1389,
      "lng": -91.4706,
      "park_type": "State Park",
      "place_rank": 15
    }
  ]
}
```

### 3. User Feedback API

**Endpoint**: `POST /api/feedback`  
**Purpose**: Collect user feedback and ratings

#### Request Body
```javascript
{
  "comment": "Great app! Found amazing trails near me.",
  "rating": 5,                    // 1-5 scale
  "email": "user@example.com",    // Optional
  "category": "general"           // "general" | "bug" | "feature"
}
```

#### Response Format
```javascript
{
  "success": true,
  "message": "Feedback submitted successfully",
  "id": 12345
}
```

### 4. Health Check API

**Endpoint**: `GET /api/health`  
**Purpose**: System health monitoring and deployment verification

#### Response Format
```javascript
{
  "status": "healthy",
  "timestamp": "2025-08-14T19:30:00Z",
  "environment": "production",
  "database": "connected",
  "services": {
    "database": "✅ Connected to Neon PostgreSQL",
    "weather_api": "✅ Mock weather service active"
  }
}
```

## 🌤️ Weather Integration

### Mock Weather Service
```javascript
// Development implementation
function generateMockWeatherData(lat, lng) {
  // Deterministic weather based on location
  const latSeed = Math.abs(lat * 1000) % 100;
  const lngSeed = Math.abs(lng * 1000) % 100;
  
  return {
    temperature: Math.round(45 + (latSeed + lngSeed) / 2),
    condition: ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(latSeed / 33)],
    precipitation: Math.round(lngSeed / 10),
    wind_speed: String(Math.round(latSeed / 10)),
    humidity: Math.round(40 + latSeed / 2),
    last_weather_update: new Date().toISOString()
  };
}
```

### Weather Filtering Logic
```javascript
function applyWeatherFilters(locations, filters) {
  if (!filters || Object.keys(filters).length === 0) return locations;
  
  let filtered = [...locations];
  
  // Percentile-based temperature filtering
  if (filters.temperature) {
    const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b);
    const tempCount = temps.length;
    
    switch (filters.temperature) {
      case 'cold':
        const coldThreshold = temps[Math.floor(tempCount * 0.4)];
        filtered = filtered.filter(loc => loc.temperature <= coldThreshold);
        break;
      case 'hot':
        const hotThreshold = temps[Math.floor(tempCount * 0.6)];
        filtered = filtered.filter(loc => loc.temperature >= hotThreshold);
        break;
      case 'mild':
        const minThreshold = temps[Math.floor(tempCount * 0.1)];
        const maxThreshold = temps[Math.floor(tempCount * 0.9)];
        filtered = filtered.filter(loc => 
          loc.temperature >= minThreshold && loc.temperature <= maxThreshold
        );
        break;
    }
  }
  
  return filtered;
}
```

## 🔧 Development Setup

### Environment Variables
```bash
# .env file for development
DATABASE_URL=postgresql://username:password@hostname/database
OPENWEATHER_API_KEY=your_api_key_here
NODE_ENV=development
```

### Starting the Development Server
```bash
# Start both frontend and API
npm start

# Or start API server only  
node dev-api-server.js

# Health check
curl http://localhost:4000/api/health
```

### Testing API Endpoints
```bash
# Basic POI data
curl "http://localhost:4000/api/poi-locations?limit=5"

# POIs with weather and user location
curl "http://localhost:4000/api/poi-locations-with-weather?lat=44.9537&lng=-93.0900&limit=10"

# Submit feedback
curl -X POST "http://localhost:4000/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Test feedback","rating":5,"category":"general"}'
```

## 🚀 Production Deployment

### Vercel Configuration
```javascript
// vercel.json
{
  "functions": {
    "apps/web/api/*.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 10
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "OPENWEATHER_API_KEY": "@openweather_api_key"
  }
}
```

### Environment Variables (Vercel Dashboard)
- `DATABASE_URL` or `POSTGRES_URL` - Neon PostgreSQL connection string
- `OPENWEATHER_API_KEY` - Weather API access (when implemented)

## ⚠️ Common Issues & Solutions

### 1. Database Connection Issues
```javascript
// Error: "database connection failed"
// Solution: Verify Neon PostgreSQL URL and SSL settings
const sql = neon(process.env.DATABASE_URL + '?sslmode=require');
```

### 2. CORS Issues in Development
```javascript
// Add CORS middleware in dev-api-server.js
app.use(cors({
  origin: ['http://localhost:3003', 'http://localhost:3001'],
  credentials: true
}));
```

### 3. Type Mismatches Between Environments
```javascript
// Always parse coordinates as floats
const lat = parseFloat(req.query.lat);
const lng = parseFloat(req.query.lng);
const limit = parseInt(req.query.limit) || 200;
```

## 📊 Performance Considerations

- **Caching**: No external cache layer - relies on Neon PostgreSQL performance
- **Weather API**: Currently uses mock data for development/testing
- **Database Indexes**: Geographic queries optimized with spatial indexes
- **Response Size**: Limit parameter controls payload size (default 200 POIs)
- **Error Handling**: Graceful degradation when weather data unavailable

## 🔄 Sync Requirements

**Critical**: When modifying API logic, update BOTH implementations:
1. Development: `dev-api-server.js` 
2. Production: `apps/web/api/*.js`

Use environment validation script to verify parity:
```bash
./scripts/environment-validation.sh localhost
./scripts/environment-validation.sh production
```