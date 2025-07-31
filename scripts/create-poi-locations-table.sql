-- ========================================================================
-- POI LOCATIONS TABLE CREATION - Minnesota POI Database Deployment
-- ========================================================================
-- 
-- @CLAUDE_CONTEXT: OSS-proven schema patterns from Nominatim, AllTrails, OSM
-- @BUSINESS_PURPOSE: 200+ Minnesota parks for comprehensive outdoor recreation coverage
-- @COMPATIBILITY: Designed to work alongside existing locations table
-- @PERFORMANCE: Geographic indexes for sub-second proximity queries
-- 
-- Story: Minnesota POI Database Deployment (#155)
-- Created: 2025-01-30
-- ========================================================================

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create POI locations table with OSS-proven patterns
CREATE TABLE IF NOT EXISTS poi_locations (
  -- Primary key and identification
  id SERIAL PRIMARY KEY,
  
  -- Core location data (required fields)
  name VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  
  -- OSM tracking for incremental updates (Nominatim pattern)
  osm_id BIGINT,                    -- Track source for incremental updates
  osm_type VARCHAR(10),             -- way, node, relation
  
  -- Classification system (AllTrails pattern)
  park_type VARCHAR(100),           -- State Park, County Park, National Park, etc.
  difficulty VARCHAR(50),           -- Easy, Moderate, Difficult
  surface_type VARCHAR(50),         -- Paved, Natural, Mixed
  
  -- Search optimization (Nominatim pattern)
  search_name JSONB,                -- Name variants for search optimization
  place_rank INTEGER DEFAULT 30,   -- Importance ranking (1-30, lower = more important)
  
  -- Data management and source tracking
  description TEXT,
  data_source VARCHAR(50),          -- osm, nps, dnr, google
  external_id VARCHAR(100),         -- Source system ID for re-synchronization
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Geographic constraint validation (Minnesota bounds)
  CONSTRAINT poi_minnesota_bounds CHECK (
    lat BETWEEN 43.499356 AND 49.384472 AND
    lng BETWEEN -97.239209 AND -89.491739
  )
);

-- ========================================================================
-- PERFORMANCE INDEXES - OSM-Proven Patterns
-- ========================================================================

-- Primary geographic index for proximity queries (GIST index on geography)
CREATE INDEX IF NOT EXISTS idx_poi_geography 
ON poi_locations USING GIST(ST_Point(lng, lat));

-- Search optimization index for name variants
CREATE INDEX IF NOT EXISTS idx_poi_search 
ON poi_locations USING GIN(search_name);

-- OSM tracking index for incremental updates
CREATE INDEX IF NOT EXISTS idx_poi_osm_tracking 
ON poi_locations (osm_id, osm_type, last_modified);

-- Classification index for filtering by park type and difficulty
CREATE INDEX IF NOT EXISTS idx_poi_classification 
ON poi_locations (park_type, difficulty);

-- Data source index for ETL management
CREATE INDEX IF NOT EXISTS idx_poi_data_source 
ON poi_locations (data_source, last_modified);

-- ========================================================================
-- FEATURE FLAG SYSTEM - Enable Rollback Capability
-- ========================================================================

-- Feature flag table for controlling POI vs legacy locations
CREATE TABLE IF NOT EXISTS feature_flags (
  flag_name VARCHAR(100) PRIMARY KEY,
  enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert POI feature flag (disabled by default for safe deployment)
INSERT INTO feature_flags (flag_name, enabled, description) 
VALUES (
  'use_poi_locations', 
  FALSE, 
  'Use poi_locations table instead of legacy locations table'
) ON CONFLICT (flag_name) DO NOTHING;

-- ========================================================================
-- DATA VALIDATION FUNCTIONS
-- ========================================================================

-- Function to validate GPS coordinates are within Minnesota
CREATE OR REPLACE FUNCTION validate_minnesota_coordinates(lat DECIMAL, lng DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    lat BETWEEN 43.499356 AND 49.384472 AND
    lng BETWEEN -97.239209 AND -89.491739
  );
END;
$$ LANGUAGE plpgsql;

-- Function to detect duplicate POIs within specified radius (km)
CREATE OR REPLACE FUNCTION find_duplicate_pois(check_lat DECIMAL, check_lng DECIMAL, radius_km DECIMAL DEFAULT 1.0)
RETURNS TABLE (
  poi_id INTEGER,
  poi_name VARCHAR(255),
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::INTEGER,
    p.name::VARCHAR(255),
    (ST_Distance(
      ST_Point(p.lng, p.lat)::geography,
      ST_Point(check_lng, check_lat)::geography
    ) / 1000)::DECIMAL as distance_km
  FROM poi_locations p
  WHERE ST_DWithin(
    ST_Point(p.lng, p.lat)::geography,
    ST_Point(check_lng, check_lat)::geography,
    radius_km * 1000
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- ETL HELPER FUNCTIONS
-- ========================================================================

-- Function for bulk insert with duplicate prevention
CREATE OR REPLACE FUNCTION insert_poi_safe(
  p_name VARCHAR(255),
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_park_type VARCHAR(100) DEFAULT NULL,
  p_data_source VARCHAR(50) DEFAULT 'manual',
  p_osm_id BIGINT DEFAULT NULL,
  p_osm_type VARCHAR(10) DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  poi_id INTEGER;
  duplicate_count INTEGER;
BEGIN
  -- Check for duplicates within 1km
  SELECT COUNT(*) INTO duplicate_count
  FROM poi_locations 
  WHERE ST_DWithin(
    ST_Point(lng, lat)::geography,
    ST_Point(p_lng, p_lat)::geography,
    1000
  );
  
  -- Only insert if no duplicates found
  IF duplicate_count = 0 THEN
    INSERT INTO poi_locations (
      name, lat, lng, park_type, data_source, osm_id, osm_type,
      search_name, last_modified
    ) VALUES (
      p_name, p_lat, p_lng, p_park_type, p_data_source, p_osm_id, p_osm_type,
      jsonb_build_object('primary', p_name, 'variations', ARRAY[p_name]),
      CURRENT_TIMESTAMP
    ) RETURNING id INTO poi_id;
    
    RETURN poi_id;
  ELSE
    -- Return -1 to indicate duplicate was skipped
    RETURN -1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- DATABASE STATISTICS AND MONITORING
-- ========================================================================

-- Create view for POI statistics
CREATE OR REPLACE VIEW poi_stats AS
SELECT 
  COUNT(*) as total_pois,
  COUNT(DISTINCT park_type) as park_types,
  COUNT(DISTINCT data_source) as data_sources,
  MIN(last_modified) as oldest_record,
  MAX(last_modified) as newest_record,
  COUNT(*) FILTER (WHERE osm_id IS NOT NULL) as osm_tracked,
  AVG(place_rank) as avg_importance_rank
FROM poi_locations;

-- ========================================================================
-- DEPLOYMENT VERIFICATION
-- ========================================================================

-- Verify table was created successfully
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'poi_locations') THEN
    RAISE NOTICE 'SUCCESS: poi_locations table created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: poi_locations table creation failed';
  END IF;
  
  -- Verify indexes were created
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_poi_geography') THEN
    RAISE NOTICE 'SUCCESS: Geographic indexes created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: Geographic indexes creation failed';
  END IF;
  
  -- Verify feature flag system
  IF EXISTS (SELECT 1 FROM feature_flags WHERE flag_name = 'use_poi_locations') THEN
    RAISE NOTICE 'SUCCESS: Feature flag system ready for rollback capability';
  ELSE
    RAISE EXCEPTION 'FAILED: Feature flag system setup failed';
  END IF;
END
$$;

-- Final success message
SELECT 'POI Database Schema - Ready for ETL Implementation' as status;