# Current Database Schema (Production Reality)

**Last Updated**: July 25, 2025  
**Purpose**: Document the actual working database structure for MVP development

## Overview and Context

**@CLAUDE_CONTEXT**: This document describes the ACTUAL database schema used in production  
**@BUSINESS_RULE**: B2C consumer platform focused on Minnesota outdoor recreation market  
**@ARCHITECTURE_NOTE**: Simple flat table structure chosen over PostGIS for MVP speed  

This schema serves the "Nearest Nice Weather" platform, providing weather-location data for outdoor enthusiasts and recreation consumers in Minnesota. The design prioritizes simplicity and rapid development over complex geographic operations.

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
**@CLAUDE_CONTEXT**: Primary table for Minnesota weather locations (34 records in production)  
**BUSINESS PURPOSE**: Geographic points where weather data is collected for outdoor recreation  
**DATA RELATIONSHIPS**: Links to weather_conditions via location_id foreign key  
**QUERY PATTERNS**: Frequently queried with distance calculations using Haversine formula  
**PERFORMANCE NOTES**: No spatial indexes needed for current Minnesota-focused dataset (34 comprehensive locations)  

```sql
-- CORE LOCATION DATA: Geographic identifiers for weather stations
id          -- Primary key (integer, auto-increment)
name        -- Location name (e.g., "Minneapolis", "Duluth") - VARCHAR(255)
lat         -- Latitude (decimal degrees, WGS84) - DECIMAL precision for mapping
lng         -- Longitude (decimal degrees, WGS84) - DECIMAL precision for mapping
```

### `weather_conditions`  
**@CLAUDE_CONTEXT**: Current weather data linked to specific locations  
**BUSINESS PURPOSE**: Real-time weather conditions for outdoor activity planning  
**DATA RELATIONSHIPS**: References locations table via location_id foreign key  
**QUERY PATTERNS**: Always joined with locations for complete weather-location data  
**PERFORMANCE NOTES**: LEFT JOIN used to preserve locations without current weather data  

```sql
-- CURRENT WEATHER DATA: Real-time conditions for outdoor recreation planning
location_id   -- Foreign key to locations(id) - INTEGER NOT NULL
temperature   -- Current temperature in Fahrenheit - INTEGER (outdoor recreation focus)
condition     -- Weather condition string (e.g., "Clear", "Cloudy") - VARCHAR(100)
description   -- Human-readable weather description - TEXT
precipitation -- Precipitation probability percentage (0-100) - INTEGER
wind_speed    -- Wind speed in miles per hour - INTEGER (mph for US outdoor use)
```

### `tourism_operators` (Legacy)
Historical reference data - not actively used in B2C consumer platform
```sql
-- Legacy table from original B2B concept
-- Not used in current B2C consumer-focused implementation
-- May be removed in future schema cleanup
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
- `locations` table - 34 comprehensive Minnesota locations covering all major outdoor recreation areas
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