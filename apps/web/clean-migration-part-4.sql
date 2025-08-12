-- ========================================================================
-- CLEAN PRODUCTION POI MIGRATION - PART 4 OF 5 (NO DUPLICATES)
-- ========================================================================
-- Insert POI locations 85-112 - Historic Sites and Regional Parks
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Fort Snelling National Historical Landmark', 44.8919, -93.1811, 'Historic Site', 'seed_script', 'Historic military fort at river confluence', 15),
('Lindbergh Historic Site', 45.9581, -94.3858, 'Historic Site', 'seed_script', 'Boyhood home of aviator Charles Lindbergh', 15),
('Lower Sioux Historic Site', 44.4667, -94.7667, 'Historic Site', 'seed_script', 'Dakota community and 1862 war interpretation', 15),
('Mille Lacs Indian Museum', 46.1333, -93.65, 'Historic Site', 'seed_script', 'Ojibwe culture and history museum', 15),
('North West Company Fur Post', 45.9167, -92.8333, 'Historic Site', 'seed_script', 'Reconstructed 1804 fur trading post', 15),
('Oliver H. Kelley Farm', 45.3667, -93.6833, 'Historic Site', 'seed_script', 'Living history farm and birthplace of the Grange', 15),
('Baker Park Reserve', 45.0833, -93.6667, 'Regional Park', 'seed_script', 'Lake Minnetonka recreation', 18),
('Elm Creek Park Reserve', 45.1833, -93.4667, 'Regional Park', 'seed_script', 'Swimming pond and extensive trail system', 18),
('Hyland Lake Park Reserve', 44.8333, -93.3833, 'Regional Park', 'seed_script', 'Skiing and year-round recreation', 18),
('Lake Rebecca Park Reserve', 45.3, -93.8, 'Regional Park', 'seed_script', 'Fishing and wildlife viewing', 18),
('Crow-Hassan Park Reserve', 45.2, -93.8, 'Regional Park', 'seed_script', 'Prairie restoration and bison herd', 18),
('Cleary Lake Regional Park', 44.6833, -93.4833, 'Regional Park', 'seed_script', 'Lake recreation and trails', 18),
('Carver Park Reserve', 44.8833, -93.75, 'Regional Park', 'seed_script', 'Diverse habitats and Lowry Nature Center', 18),
('Bryant Lake Regional Park', 44.8167, -93.4667, 'Regional Park', 'seed_script', 'Urban lake recreation', 18),
('Battle Creek Regional Park', 44.9167, -93, 'Regional Park', 'seed_script', 'Limestone caves and hardwood forest', 18),
('Bunker Hills Regional Park', 45.2167, -93.2833, 'Regional Park', 'seed_script', 'Golf course and wave pool', 18),
('Como Regional Park', 44.9833, -93.15, 'Regional Park', 'seed_script', 'Zoo, conservatory, and lake recreation', 18),
('Hidden Falls Regional Park', 44.9167, -93.2, 'Regional Park', 'seed_script', 'Mississippi River bluffs and picnicking', 18),
('Indian Mounds Regional Park', 44.9333, -93.0667, 'Regional Park', 'seed_script', 'Sacred burial mounds and river views', 18),
('Lilydale Regional Park', 44.9, -93.1167, 'Regional Park', 'seed_script', 'Fossil hunting and river access', 18),
('Phalen Regional Park', 44.9833, -93.0167, 'Regional Park', 'seed_script', 'Urban lake with beach and trails', 18),
('Cherokee Regional Park', 44.6833, -93.2167, 'Regional Park', 'seed_script', 'Minnesota River valley recreation', 18),
('Lake Byllesby Regional Park', 44.4833, -92.9833, 'Regional Park', 'seed_script', 'Cannon River recreation and camping', 18),
('Lake Elmo Park Reserve', 45, -92.8833, 'Regional Park', 'seed_script', 'Swimming beach and trail network', 18),
('Lebanon Hills Regional Park', 44.7333, -93.0833, 'Regional Park', 'seed_script', 'Mountain biking and cross-country skiing', 18),
('Murphy-Hanrehan Park Reserve', 44.7, -93.4, 'Regional Park', 'seed_script', 'Mountain biking and equestrian trails', 18),
('Long Lake Regional Park', 44.9833, -93.6167, 'Regional Park', 'seed_script', 'Fishing and quiet lake recreation', 18),
('Silverwood Park', 45.0833, -93.2167, 'Regional Park', 'seed_script', 'Art programs and Silver Lake access', 18);

-- Verify count (should be 112 total)
SELECT COUNT(*) as total_after_batch_4 FROM poi_locations;