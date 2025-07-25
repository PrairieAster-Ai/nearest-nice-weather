# Current Database Schema (Production Reality)

**Last Updated**: July 25, 2025  
**Purpose**: Document the actual working database structure for MVP development

## Database Configuration

### Environment Variables
- **PRIMARY**: `DATABASE_URL` (Neon PostgreSQL connection string)
- **FALLBACK**: `POSTGRES_URL` (alternative naming for Vercel compatibility)
- **REMOVED**: `WEATHERDB_URL` (deprecated, causes confusion)

### Environments
- **Localhost**: Development Neon database branch
- **Preview/Production**: Production Neon database branch

## Current Table Structure

Based on API analysis and production data, these tables actually exist and work:

### `locations`
Primary table for Minnesota weather locations (34 records in production)
```sql
-- Columns based on API usage in weather-locations.js
id          -- Primary key
name        -- Location name (e.g., "Minneapolis", "Duluth") 
lat         -- Latitude (decimal)
lng         -- Longitude (decimal)
```

### `weather_conditions`  
Weather data linked to locations
```sql
-- Columns based on API usage
location_id   -- Foreign key to locations(id)
temperature   -- Current temperature
condition     -- Weather condition string
description   -- Weather description
precipitation -- Precipitation percentage
wind_speed    -- Wind speed value
```

### `tourism_operators`
Business data for Minnesota tourism operators
```sql
-- Referenced in test-db.js, likely contains operator information
-- Exact structure needs verification via API endpoint
```

### `user_feedback`
User feedback and ratings (actively managed in feedback.js)
```sql
id SERIAL PRIMARY KEY
email VARCHAR(255)
feedback_text TEXT NOT NULL
rating INTEGER CHECK (rating >= 1 AND rating <= 5)
category VARCHAR(50) CHECK (category IN ('bug', 'feature', 'general', 'performance'))
categories JSONB
user_agent TEXT
ip_address VARCHAR(45)
session_id VARCHAR(255)
page_url TEXT
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

## Schema vs Documentation Mismatch

### ❌ Documented But Not Used
The `documentation/technical/database-schema.sql` shows:
- PostGIS extensions and spatial queries
- Organized schemas: `weather.*`, `tourism.*`, `analytics.*`
- Complex geographic calculations

### ✅ Actually Working  
The production system uses:
- Simple flat table structure
- Basic SQL queries without PostGIS
- Haversine distance calculations in JavaScript

## MVP Development Guidelines

### ✅ Safe to Use
- `locations` table - 34 Minnesota locations working
- `weather_conditions` table - provides weather data
- `user_feedback` table - handles customer feedback
- Basic distance calculations using lat/lng

### ⚠️  Needs Investigation
- `tourism_operators` table structure
- Relationship between locations and weather_conditions
- Data freshness and update mechanisms

### 🚫 Don't Use
- PostGIS-based documentation (not actually implemented)
- Schema-prefixed table names (weather.locations, etc.)
- `WEATHERDB_URL` environment variable (deprecated)

## Next Steps for MVP

1. **Document actual table schemas** via database introspection
2. **Create API endpoints** for tourism_operators if needed
3. **Verify data freshness** and update mechanisms
4. **Keep it simple** - don't over-engineer with PostGIS until needed