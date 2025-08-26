# Database Schema & Data Model - Nearest Nice Weather

> **For GitHub Wiki**: Complete database documentation for rapid developer onboarding

## 🏗️ Database Architecture

**Platform**: Neon PostgreSQL (Serverless)  
**Environment Strategy**: Branch-based development (dev/preview/production)  
**Data Focus**: Minnesota outdoor recreation Points of Interest (POIs)  
**Scale**: 138 outdoor destinations, designed for 10,000+ users

## 📊 Current Schema

### Primary Table: `poi_locations`
**Purpose**: Core outdoor recreation destinations database

```sql
CREATE TABLE poi_locations (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,              -- "Gooseberry Falls State Park"
    description TEXT,                        -- User-friendly description
    
    -- Geographic Data
    lat DECIMAL(10, 8) NOT NULL,             -- 47.1389 (latitude)
    lng DECIMAL(11, 8) NOT NULL,             -- -91.4706 (longitude)
    
    -- Classification
    park_type VARCHAR(100),                  -- "State Park", "Trail System", "Nature Center"
    place_rank INTEGER DEFAULT 30,           -- Importance ranking (10=National, 15=State, 20=Regional, 30=Local)
    
    -- Data Management
    data_source VARCHAR(50),                 -- "seed_script", "manual", "api_import"
    external_id VARCHAR(100),                -- Unique identifier from data sources
    search_name JSONB,                       -- Alternative names for search
    last_modified TIMESTAMP DEFAULT NOW(),
    
    -- OpenStreetMap Integration (Optional)
    osm_id BIGINT,                          -- OpenStreetMap node/way/relation ID
    osm_type VARCHAR(10),                   -- "node", "way", "relation"
    
    -- Geographic Constraints
    CONSTRAINT poi_minnesota_bounds CHECK (
        lat BETWEEN 43.499356 AND 49.384472 AND
        lng BETWEEN -97.239209 AND -89.491739
    )
);

-- Performance Indexes
CREATE INDEX idx_poi_locations_geography ON poi_locations (lat, lng);
CREATE INDEX idx_poi_locations_park_type ON poi_locations (park_type);
CREATE INDEX idx_poi_locations_place_rank ON poi_locations (place_rank);
CREATE INDEX idx_poi_locations_data_source ON poi_locations (data_source);

-- Search optimization
CREATE INDEX idx_poi_locations_name_gin ON poi_locations USING gin(to_tsvector('english', name));
```

### Secondary Table: `user_feedback`
**Purpose**: User feedback and rating collection

```sql
CREATE TABLE user_feedback (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Feedback Content
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(50),                    -- "general", "bug", "feature"
    
    -- User Information (Optional)
    email VARCHAR(255),                      -- Optional contact email
    
    -- Technical Metadata
    user_agent TEXT,                         -- Browser/device information
    ip_address VARCHAR(45),                  -- IPv4/IPv6 address
    session_id VARCHAR(255),                 -- Session tracking
    page_url TEXT,                          -- Page where feedback was submitted
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_user_feedback_created_at ON user_feedback (created_at DESC);
CREATE INDEX idx_user_feedback_category ON user_feedback (category);
CREATE INDEX idx_user_feedback_rating ON user_feedback (rating);
```

## 📍 POI Data Model

### Current Data Inventory (138 Locations)
```sql
-- Data distribution by park type
SELECT park_type, COUNT(*) as location_count
FROM poi_locations 
WHERE park_type IS NOT NULL
GROUP BY park_type
ORDER BY location_count DESC;

-- Example output:
-- State Park        | 45
-- Trail System      | 28  
-- Nature Center     | 22
-- Regional Park     | 18
-- Forest            | 15
-- Wildlife Refuge   | 10
```

### Place Rank Classification
```sql
-- Importance hierarchy for display prioritization
SELECT 
  place_rank,
  CASE 
    WHEN place_rank <= 10 THEN 'National Significance'
    WHEN place_rank <= 15 THEN 'State Significance' 
    WHEN place_rank <= 20 THEN 'Regional Significance'
    ELSE 'Local Significance'
  END as significance_level,
  COUNT(*) as location_count
FROM poi_locations
GROUP BY place_rank
ORDER BY place_rank;
```

### Geographic Distribution
```sql
-- Minnesota regions represented in dataset
SELECT 
  CASE 
    WHEN lat >= 47.5 THEN 'Northern Minnesota'
    WHEN lat >= 45.5 THEN 'Central Minnesota'
    ELSE 'Southern Minnesota'
  END as region,
  COUNT(*) as poi_count,
  AVG(lat) as avg_latitude,
  AVG(lng) as avg_longitude
FROM poi_locations
GROUP BY 
  CASE 
    WHEN lat >= 47.5 THEN 'Northern Minnesota'
    WHEN lat >= 45.5 THEN 'Central Minnesota'
    ELSE 'Southern Minnesota'
  END
ORDER BY poi_count DESC;
```

## 🗄️ Sample Data

### Representative POI Records
```sql
-- Example State Park (High Priority)
INSERT INTO poi_locations (
  name, lat, lng, park_type, place_rank, 
  description, data_source, external_id
) VALUES (
  'Gooseberry Falls State Park',
  47.1389, -91.4706,
  'State Park', 15,
  'Spectacular waterfalls cascading into Lake Superior with hiking trails and scenic overlooks',
  'seed_script', 'mn_state_park_gooseberry'
);

-- Example Regional Trail (Medium Priority)
INSERT INTO poi_locations (
  name, lat, lng, park_type, place_rank,
  description, data_source, external_id
) VALUES (
  'Midtown Greenway',
  44.9486, -93.2636,
  'Trail System', 20,
  'Urban bike and walking trail connecting Minneapolis neighborhoods',
  'seed_script', 'minneapolis_midtown_greenway'
);

-- Example Nature Center (Local Priority)
INSERT INTO poi_locations (
  name, lat, lng, park_type, place_rank,
  description, data_source, external_id
) VALUES (
  'Richardson Nature Center',
  44.8733, -93.3110,
  'Nature Center', 30,
  'Environmental education center with prairie trails and wildlife viewing',
  'seed_script', 'richardson_nature_center'
);
```

## 🔄 Data Management Queries

### Common Database Operations

#### 1. Distance-Based POI Search
```sql
-- Find POIs within radius of user location (Haversine formula)
SELECT 
  id, name, lat, lng, park_type, description, place_rank,
  (3959 * acos(
    cos(radians(?)) * cos(radians(lat)) * 
    cos(radians(lng) - radians(?)) + 
    sin(radians(?)) * sin(radians(lat))
  )) as distance_miles
FROM poi_locations 
WHERE park_type IS NOT NULL
HAVING distance_miles <= ?
ORDER BY distance_miles ASC, place_rank ASC
LIMIT ?;

-- Parameters: [user_lat, user_lng, user_lat, max_distance_miles, limit]
```

#### 2. Priority-Based Display
```sql
-- Get POIs for map display (prioritize important locations)
SELECT id, name, lat, lng, park_type, place_rank
FROM poi_locations
WHERE park_type IS NOT NULL
ORDER BY 
  place_rank ASC,           -- Higher priority first
  name ASC                  -- Alphabetical within same priority
LIMIT 200;
```

#### 3. Search Functionality
```sql
-- Text search across POI names and descriptions
SELECT id, name, lat, lng, park_type, description,
       ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), 
               plainto_tsquery('english', ?)) as search_rank
FROM poi_locations
WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) 
      @@ plainto_tsquery('english', ?)
ORDER BY search_rank DESC, place_rank ASC
LIMIT 50;

-- Parameter: search_term (e.g., "waterfall hiking")
```

#### 4. Feedback Analytics
```sql
-- Feedback summary for product insights
SELECT 
  category,
  AVG(rating)::DECIMAL(3,2) as avg_rating,
  COUNT(*) as feedback_count,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_count,
  COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_count
FROM user_feedback
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY category
ORDER BY feedback_count DESC;
```

## 🔧 Database Configuration

### Environment Variables
```bash
# Development (Neon Dev Branch)
DATABASE_URL="postgresql://username:password@dev-hostname/database?sslmode=require"

# Production (Neon Main Branch) 
DATABASE_URL="postgresql://username:password@prod-hostname/database?sslmode=require"
```

### Connection Configuration
```javascript
// Development (pg driver)
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,                    // Connection pool size
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000
});

// Production (Neon Serverless)
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
```

## 🚨 Deprecated Tables

### Legacy Schema (No Longer Used)
```sql
-- ❌ DEPRECATED: Legacy weather stations table
-- Replaced by POI-centric architecture
DROP TABLE IF EXISTS locations;

-- ❌ DEPRECATED: Legacy weather conditions table  
-- Weather data now fetched real-time from APIs
DROP TABLE IF EXISTS weather_conditions;
```

**Migration Notes**: 
- Original application used cities/weather stations as primary data
- Pivoted to outdoor recreation POIs for better user experience
- Weather is now integrated real-time rather than stored

## 🔍 Data Quality & Validation

### Data Integrity Checks
```sql
-- Verify all POIs are within Minnesota bounds
SELECT COUNT(*) as total_locations,
       COUNT(CASE WHEN lat BETWEEN 43.499356 AND 49.384472 
                    AND lng BETWEEN -97.239209 AND -89.491739 
                  THEN 1 END) as locations_in_minnesota,
       COUNT(CASE WHEN park_type IS NOT NULL THEN 1 END) as locations_with_type
FROM poi_locations;

-- Expected: All locations should be in Minnesota with valid park types
```

### Data Completeness Analysis
```sql
-- Check for missing essential data
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_names,
  COUNT(CASE WHEN lat IS NULL OR lng IS NULL THEN 1 END) as missing_coordinates,
  COUNT(CASE WHEN park_type IS NULL OR park_type = '' THEN 1 END) as missing_types,
  COUNT(CASE WHEN description IS NULL OR description = '' THEN 1 END) as missing_descriptions
FROM poi_locations;
```

### Duplicate Detection
```sql
-- Find potential duplicate locations (within 100 meters)
SELECT p1.id, p1.name, p2.id, p2.name,
       (3959 * acos(
         cos(radians(p1.lat)) * cos(radians(p2.lat)) * 
         cos(radians(p2.lng) - radians(p1.lng)) + 
         sin(radians(p1.lat)) * sin(radians(p2.lat))
       )) * 1609.34 as distance_meters
FROM poi_locations p1
JOIN poi_locations p2 ON p1.id < p2.id
WHERE (3959 * acos(
         cos(radians(p1.lat)) * cos(radians(p2.lat)) * 
         cos(radians(p2.lng) - radians(p1.lng)) + 
         sin(radians(p1.lat)) * sin(radians(p2.lat))
       )) * 1609.34 < 100
ORDER BY distance_meters;
```

## 📈 Performance Optimization

### Index Strategy
```sql
-- Geographic search optimization
CREATE INDEX CONCURRENTLY idx_poi_lat_lng_btree ON poi_locations (lat, lng);

-- Composite index for common query patterns
CREATE INDEX CONCURRENTLY idx_poi_type_rank ON poi_locations (park_type, place_rank) 
WHERE park_type IS NOT NULL;

-- Partial index for active POIs only
CREATE INDEX CONCURRENTLY idx_poi_active ON poi_locations (place_rank, name)
WHERE park_type IS NOT NULL;
```

### Query Performance
```sql
-- Monitor query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name, lat, lng, park_type,
       (3959 * acos(...)) as distance_miles
FROM poi_locations
WHERE park_type IS NOT NULL
ORDER BY distance_miles ASC
LIMIT 50;
```

## 🔄 Database Maintenance

### Regular Maintenance Tasks
```sql
-- Update table statistics for query optimization
ANALYZE poi_locations;
ANALYZE user_feedback;

-- Check database size and growth
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Strategy
```bash
# Automated Neon backups (point-in-time recovery)
# Manual backup for critical data
pg_dump $DATABASE_URL > poi_backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < poi_backup_20250814.sql
```

## 🛠️ Development Workflow

### Local Development Setup
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with Neon development branch URL

# 2. Verify database connection
node -e "const { Pool } = require('pg'); 
         const pool = new Pool({connectionString: process.env.DATABASE_URL}); 
         pool.query('SELECT COUNT(*) FROM poi_locations').then(console.log);"

# 3. Run data validation
npm run db:validate
```

### Common Database Tasks
```bash
# Check POI data integrity
npm run db:check-integrity

# Update POI data from seeding scripts
npm run db:seed-pois

# Export POI data for backup
npm run db:export-pois

# Import POI data from backup
npm run db:import-pois
```

### Environment Promotion
```bash
# Promote data from dev to preview
./scripts/promote-database.sh dev preview

# Promote data from preview to production
./scripts/promote-database.sh preview production
```

This database schema provides a solid foundation for the outdoor recreation discovery platform, with proper indexing, data validation, and maintenance procedures for optimal performance and reliability.