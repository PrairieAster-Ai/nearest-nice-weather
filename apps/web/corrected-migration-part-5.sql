-- ========================================================================
-- CORRECTED PRODUCTION POI MIGRATION - PART 5 OF 5
-- ========================================================================
-- Insert final POI locations 121-138 with new schema structure
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Lowry Nature Center', 44.8833, -93.75, 'Nature Center', 'seed_script', 'Environmental education and wildlife rehabilitation', 20),
('Warner Nature Center', 45.3833, -92.7833, 'Nature Center', 'seed_script', 'St. Croix River valley education center', 20),
('Long Lake Regional Park', 44.9833, -93.6167, 'Regional Park', 'seed_script', 'Fishing and quiet lake recreation', 18),
('Silverwood Park', 45.0833, -93.2167, 'Regional Park', 'seed_script', 'Art programs and Silver Lake access', 18),
('Snail Lake Regional Park', 45.0833, -93.0833, 'Regional Park', 'seed_script', 'Fishing and wildlife viewing', 18),
('Vadnais-Snail Lakes Regional Park', 45.0833, -93.0833, 'Regional Park', 'seed_script', 'Chain of lakes recreation', 18),
('Pine Tree Apple Orchard', 45.2167, -93.1667, 'Orchard', 'seed_script', 'Apple picking and family activities', 20),
('Minnehaha Regional Park', 44.9167, -93.2167, 'Regional Park', 'seed_script', 'Famous waterfall and Mississippi River gorge', 15),
('Crosby Farm Regional Park', 44.9, -93.2, 'Regional Park', 'seed_script', 'Mississippi River floodplain forest', 18),
('Highland Park', 44.9167, -93.1833, 'City Park', 'seed_script', 'Urban park with recreation facilities', 20),
('Mears Park', 44.9333, -93.0833, 'City Park', 'seed_script', 'Downtown St. Paul urban park', 20),
('Rice Park', 44.9417, -93.0917, 'City Park', 'seed_script', 'Historic downtown square', 20),
('Loring Park', 44.9667, -93.2833, 'City Park', 'seed_script', 'Urban lake park in downtown Minneapolis', 20),
('Boom Island Park', 44.99, -93.2667, 'City Park', 'seed_script', 'Mississippi River island park', 20),
('Father Hennepin Bluff Park', 44.9833, -93.2667, 'City Park', 'seed_script', 'River bluff overlook in downtown', 20),
('Gold Medal Park', 44.9733, -93.2533, 'City Park', 'seed_script', 'Modern park near Mississippi River', 20),
('Mill Ruins Park', 44.9783, -93.2567, 'City Park', 'seed_script', 'Historic flour mill ruins', 20),
('Water Works Park', 44.9667, -93.2167, 'City Park', 'seed_script', 'River recreation and historic waterworks', 20);

-- Final verification - should be 138 total POI locations
SELECT COUNT(*) as final_total_poi_count FROM poi_locations;

-- Show sample of imported data to verify structure
SELECT 
    name, 
    park_type, 
    importance_rank, 
    data_source
FROM poi_locations 
ORDER BY importance_rank, name 
LIMIT 10;