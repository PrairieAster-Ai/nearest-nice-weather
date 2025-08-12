-- ========================================================================
-- EMPTY POI TABLE FOR FRESH MIGRATION ATTEMPT
-- ========================================================================
-- Clear all POI data while preserving table structure
-- ========================================================================

-- Step 1: Remove all POI data
DELETE FROM poi_locations;

-- Step 2: Reset the sequence counter to start from 1
ALTER SEQUENCE poi_locations_id_seq RESTART WITH 1;

-- Step 3: Verify table is empty
SELECT COUNT(*) as current_count FROM poi_locations;

-- Step 4: Verify table structure is intact
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'poi_locations' 
ORDER BY ordinal_position;

-- Table is now ready for fresh migration attempt