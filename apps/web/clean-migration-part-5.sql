-- ========================================================================
-- CLEAN PRODUCTION POI MIGRATION - PART 5 OF 5 (NO DUPLICATES)
-- ========================================================================
-- Insert final POI locations 113-138 - Nature Centers and City Parks
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Snail Lake Regional Park', 45.0833, -93.0833, 'Regional Park', 'seed_script', 'Fishing and wildlife viewing', 18),
('Vadnais-Snail Lakes Regional Park', 45.0833, -93.0833, 'Regional Park', 'seed_script', 'Chain of lakes recreation', 18),
('Minnehaha Regional Park', 44.9167, -93.2167, 'Regional Park', 'seed_script', 'Famous waterfall and Mississippi River gorge', 15),
('Crosby Farm Regional Park', 44.9, -93.2, 'Regional Park', 'seed_script', 'Mississippi River floodplain forest', 18),
('Fort Snelling State Park Nature Center', 44.8833, -93.1833, 'Nature Center', 'seed_script', 'Educational programs and river confluence', 20),
('Wood Lake Nature Center', 44.8667, -93.3, 'Nature Center', 'seed_script', 'Urban wetland sanctuary', 20),
('Westwood Hills Nature Center', 44.8333, -93.4, 'Nature Center', 'seed_script', 'Environmental education in urban setting', 20),
('Richardson Nature Center', 45.0833, -93.6667, 'Nature Center', 'seed_script', 'Nature programs and trails', 20),
('Lowry Nature Center', 44.8833, -93.75, 'Nature Center', 'seed_script', 'Environmental education and wildlife rehabilitation', 20),
('Warner Nature Center', 45.3833, -92.7833, 'Nature Center', 'seed_script', 'St. Croix River valley education center', 20),
('Highland Park', 44.9167, -93.1833, 'City Park', 'seed_script', 'Urban park with recreation facilities', 20),
('Mears Park', 44.9333, -93.0833, 'City Park', 'seed_script', 'Downtown St. Paul urban park', 20),
('Rice Park', 44.9417, -93.0917, 'City Park', 'seed_script', 'Historic downtown square', 20),
('Loring Park', 44.9667, -93.2833, 'City Park', 'seed_script', 'Urban lake park in downtown Minneapolis', 20),
('Boom Island Park', 44.99, -93.2667, 'City Park', 'seed_script', 'Mississippi River island park', 20),
('Father Hennepin Bluff Park', 44.9833, -93.2667, 'City Park', 'seed_script', 'River bluff overlook in downtown', 20),
('Gold Medal Park', 44.9733, -93.2533, 'City Park', 'seed_script', 'Modern park near Mississippi River', 20),
('Mill Ruins Park', 44.9783, -93.2567, 'City Park', 'seed_script', 'Historic flour mill ruins', 20),
('Water Works Park', 44.9667, -93.2167, 'City Park', 'seed_script', 'River recreation and historic waterworks', 20),
('Pine Tree Apple Orchard', 45.2167, -93.1667, 'Orchard', 'seed_script', 'Apple picking and family activities', 20),
('Split Rock Creek Recreation Area', 43.5, -96.3667, 'Recreation Area', 'seed_script', 'Lake recreation and camping', 18),
('Taylors Falls State Park', 45.4005, -92.6518, 'State Park', 'manual', 'St. Croix River gorge with rock climbing and scenic overlooks', 10),
('Theodore Wirth Regional Park', 44.9833, -93.3167, 'Regional Park', 'seed_script', 'Large urban park with golf and trails', 18),
('Como Park Zoo and Conservatory', 44.9825, -93.1508, 'Zoo', 'seed_script', 'Historic zoo and botanical conservatory', 18),
('Minnesota Zoo', 44.7783, -93.1981, 'Zoo', 'seed_script', 'Major zoo with diverse animal exhibits', 18),
('Landscape Arboretum', 44.8639, -93.6158, 'Arboretum', 'seed_script', 'University botanical garden and research facility', 18);

-- Final verification - should be exactly 138 total POI locations
SELECT 
    COUNT(*) as final_total_poi_count,
    'Target: 138' as target_count
FROM poi_locations;

-- Show distribution by park type
SELECT 
    park_type, 
    COUNT(*) as count 
FROM poi_locations 
GROUP BY park_type 
ORDER BY count DESC;

-- Verify no duplicates exist
SELECT 
    name, 
    COUNT(*) as count
FROM poi_locations 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY name;