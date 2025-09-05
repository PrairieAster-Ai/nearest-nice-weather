-- ========================================================================
-- ⚠️  STOP AND CHECK FOR DUPLICATES - RUN THIS BEFORE PART 5
-- ========================================================================
-- You should have 120 records after part 4, but got 150
-- This indicates duplicate entries were inserted
-- ========================================================================

-- Check for duplicate POI names
SELECT
    name,
    COUNT(*) as duplicate_count
FROM poi_locations
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name;

-- Show total count (should be 120 after part 4, but you got 150)
SELECT COUNT(*) as current_total FROM poi_locations;

-- ========================================================================
-- RECOMMENDATION: DO NOT RUN PART 5 YET
-- ========================================================================
-- 1. If duplicates exist, we need to clean them up first
-- 2. Remove duplicates before running final migration part
-- 3. Then run corrected part 5 to reach exactly 138 total
-- ========================================================================
