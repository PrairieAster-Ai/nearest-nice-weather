-- ========================================================================
-- TARGETED CLEANUP: 150 → 138 POI RECORDS
-- ========================================================================
-- Remove exactly 12 duplicate records to reach target of 138
-- ========================================================================

-- Step 1: Identify the specific duplicates (should be 12 extra records)
SELECT 
    name, 
    COUNT(*) as duplicate_count,
    (COUNT(*) - 1) as extra_records,
    STRING_AGG(id::text, ', ' ORDER BY id) as all_ids
FROM poi_locations 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name;

-- Step 2: Calculate total extra records
SELECT 
    SUM(COUNT(*) - 1) as total_extra_records
FROM poi_locations 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Step 3: Remove duplicates (keep the FIRST occurrence - lowest ID)
DELETE FROM poi_locations 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM poi_locations 
    GROUP BY name
);

-- Step 4: Verify we now have exactly 138 POI
SELECT 
    COUNT(*) as final_total,
    'Should be 138' as expected_count
FROM poi_locations;

-- Step 5: Double-check no duplicates remain
SELECT 
    name, 
    COUNT(*) as count
FROM poi_locations 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY name;

-- Step 6: Final data quality check
SELECT 
    'POI Migration Complete' as status,
    COUNT(*) as total_poi,
    COUNT(DISTINCT name) as unique_names,
    MIN(importance_rank) as min_rank,
    MAX(importance_rank) as max_rank
FROM poi_locations;