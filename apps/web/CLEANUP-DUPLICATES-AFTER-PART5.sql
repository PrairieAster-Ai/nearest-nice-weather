-- ========================================================================
-- CLEANUP DUPLICATES AFTER RUNNING ALL 5 PARTS
-- ========================================================================
-- You likely have ~168 records instead of 138 due to duplicates
-- This will clean up the database to exactly 138 unique POI
-- ========================================================================

-- Step 1: Check current total and duplicates
SELECT COUNT(*) as current_total FROM poi_locations;

-- Step 2: Show all duplicates
SELECT 
    name, 
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as duplicate_ids
FROM poi_locations 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name;

-- Step 3: Remove duplicates (keep lowest ID for each name)
DELETE FROM poi_locations 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM poi_locations 
    GROUP BY name
);

-- Step 4: Verify cleanup - should now be 138 total
SELECT COUNT(*) as final_total FROM poi_locations;

-- Step 5: Final verification - show sample of cleaned data
SELECT 
    COUNT(*) as total_poi,
    COUNT(DISTINCT name) as unique_names,
    MIN(importance_rank) as min_importance,
    MAX(importance_rank) as max_importance
FROM poi_locations;

-- Step 6: Show distribution by park type
SELECT 
    park_type, 
    COUNT(*) as count 
FROM poi_locations 
GROUP BY park_type 
ORDER BY count DESC;