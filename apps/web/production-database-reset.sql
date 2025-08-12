-- ========================================================================
-- PRODUCTION DATABASE COMPLETE RESET
-- ========================================================================
-- WARNING: This will completely erase all production data
-- BACKUP FIRST if you need to preserve any existing data
-- ========================================================================

-- Step 1: Drop all existing tables (in dependency order)
DROP TABLE IF EXISTS weather_conditions CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS poi_locations CASCADE;
DROP TABLE IF EXISTS tourism_operators CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;

-- Step 2: Drop all sequences
DROP SEQUENCE IF EXISTS poi_locations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS locations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS weather_conditions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS tourism_operators_id_seq CASCADE;
DROP SEQUENCE IF EXISTS feedback_id_seq CASCADE;

-- Step 3: Drop any remaining objects
DROP TYPE IF EXISTS condition_type CASCADE;
DROP TYPE IF EXISTS precipitation_type CASCADE;

-- Step 4: Verify all tables are gone
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- If the above query returns no rows, the reset is complete
-- Next step: Run the localhost schema recreation script