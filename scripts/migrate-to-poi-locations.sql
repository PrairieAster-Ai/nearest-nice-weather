-- ========================================================================
-- MIGRATION: Consolidate poi_locations_expanded back to poi_locations
-- ========================================================================
-- 
-- PURPOSE: Refactor poi_locations_expanded table back to poi_locations
--          with all the enhanced fields from the expanded version
--
-- This migration:
-- 1. Adds missing columns to poi_locations if they don't exist
-- 2. Migrates all data from poi_locations_expanded to poi_locations
-- 3. Updates the table to be the single source of truth
-- ========================================================================

-- Step 1: Add missing columns to poi_locations if they don't exist
ALTER TABLE poi_locations 
ADD COLUMN IF NOT EXISTS park_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS ownership VARCHAR(100),
ADD COLUMN IF NOT EXISTS operator VARCHAR(255),
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS amenities TEXT[],
ADD COLUMN IF NOT EXISTS activities TEXT[],
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Create a unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'poi_locations_source_unique'
    ) THEN
        ALTER TABLE poi_locations 
        ADD CONSTRAINT poi_locations_source_unique 
        UNIQUE(data_source, source_id);
    END IF;
END $$;

-- Step 3: Check if poi_locations_expanded exists and has data
DO $$
DECLARE
    expanded_exists boolean;
    expanded_count integer;
    poi_count integer;
BEGIN
    -- Check if expanded table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'poi_locations_expanded'
    ) INTO expanded_exists;
    
    IF expanded_exists THEN
        -- Count records in both tables
        SELECT COUNT(*) FROM poi_locations_expanded INTO expanded_count;
        SELECT COUNT(*) FROM poi_locations INTO poi_count;
        
        RAISE NOTICE 'poi_locations_expanded exists with % records', expanded_count;
        RAISE NOTICE 'poi_locations has % records', poi_count;
        
        -- If expanded has more data, migrate it
        IF expanded_count > poi_count THEN
            RAISE NOTICE 'Migrating data from poi_locations_expanded to poi_locations...';
            
            -- Clear poi_locations and migrate all data
            TRUNCATE poi_locations RESTART IDENTITY CASCADE;
            
            INSERT INTO poi_locations (
                name, lat, lng, 
                park_type, park_level, ownership, operator,
                description, data_source, source_id, place_rank,
                phone, website, amenities, activities,
                created_at, updated_at
            )
            SELECT 
                name, lat, lng,
                park_type, park_level, ownership, operator,
                description, data_source, source_id, place_rank,
                phone, website, amenities, activities,
                created_at, updated_at
            FROM poi_locations_expanded
            ON CONFLICT (data_source, source_id) DO UPDATE SET
                name = EXCLUDED.name,
                lat = EXCLUDED.lat,
                lng = EXCLUDED.lng,
                park_type = EXCLUDED.park_type,
                park_level = EXCLUDED.park_level,
                ownership = EXCLUDED.ownership,
                operator = EXCLUDED.operator,
                description = EXCLUDED.description,
                place_rank = EXCLUDED.place_rank,
                phone = EXCLUDED.phone,
                website = EXCLUDED.website,
                amenities = EXCLUDED.amenities,
                activities = EXCLUDED.activities,
                updated_at = CURRENT_TIMESTAMP;
                
            RAISE NOTICE 'Migration complete. Migrated % records', expanded_count;
        ELSE
            RAISE NOTICE 'poi_locations already has sufficient data, skipping migration';
        END IF;
    ELSE
        RAISE NOTICE 'poi_locations_expanded does not exist, nothing to migrate';
    END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poi_locations_coords ON poi_locations(lat, lng);
CREATE INDEX IF NOT EXISTS idx_poi_locations_park_type ON poi_locations(park_type);
CREATE INDEX IF NOT EXISTS idx_poi_locations_data_source ON poi_locations(data_source);
CREATE INDEX IF NOT EXISTS idx_poi_locations_place_rank ON poi_locations(place_rank);

-- Step 5: Add a comment to document the schema
COMMENT ON TABLE poi_locations IS 'Primary POI table with full metadata - consolidated from poi_locations_expanded';

-- Step 6: Display final status
SELECT 
    'poi_locations' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT park_type) as park_types,
    COUNT(DISTINCT data_source) as data_sources
FROM poi_locations;