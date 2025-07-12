# 📦 Archived Legacy Code

**Archived on:** 2025-01-12  
**Review for deletion:** 2025-02-11 (30 days)  
**Tracker:** See `/LEGACY-DELETION-TRACKER.md` for deletion timeline

## ⚠️ WARNING: DO NOT USE THESE FILES

These files are archived because they:
- Conflict with the current stable database schema
- Use PostGIS when we use simple lat/lng coordinates  
- Create duplicate/conflicting API endpoints
- Reference old table names that no longer exist

## Current Working System

**Database:** `locations` + `weather_conditions` tables (simple schema)  
**API:** `dev-api-server.js` serving `/api/weather-locations`  
**Data:** `database-seeder.js` with intelligent simulation  

## Archived Files

### old-api/
- `weather-locations.ts` - Duplicate API using `weather.locations` schema
- `setup-weather-schema.ts` - PostGIS schema setup (conflicts with stable schema)
- `setup-database.ts` - PostGIS database setup (not used)

### old-schemas/  
- `generate-weather-data.js` - Old weather generation (replaced by database-seeder.js)
- `contextual-weather-schema.sql` - Previous schema attempt

## If You Need to Restore Something

```bash
# Emergency restore (only if you discover a critical dependency)
git checkout working-baseline-before-cleanup -- api/setup-weather-schema.ts
```

**Before restoring:** Check `/LEGACY-DELETION-TRACKER.md` for safety procedures.