-- ========================================================================
-- PRODUCTION POI MIGRATION - PART 5 OF 5
-- ========================================================================
-- Insert POI locations 121-138 (final batch)
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Root River State Trail', 43.7833, -92.0667, 'Trail System', 'seed_script', '42 miles through bluff country', 24),
('Sakatah Singing Hills State Trail', 44.2167, -93.5333, 'Trail System', 'seed_script', '39 miles through lakes and towns', 24),
('Audubon Center of the North Woods', 46.8667, -93.1333, 'Nature Center', 'seed_script', 'Wildlife education and trails', 25),
('Deep Portage Conservation Reserve', 46.8333, -94.7167, 'Nature Center', 'seed_script', '6,000 acres of learning landscape', 25),
('Eagle Bluff Environmental Learning Center', 44.15, -92.0333, 'Nature Center', 'seed_script', 'Bluff-top learning center', 25),
('Long Lake Conservation Center', 46.8833, -93.5667, 'Nature Center', 'seed_script', 'Environmental education facility', 25),
('Wolf Ridge Environmental Learning Center', 47.4667, -91.3833, 'Nature Center', 'seed_script', 'Environmental education on Lake Superior', 25),
('Fort Snelling State Park', 44.8928, -93.1811, 'State Park', 'seed_script', 'Historic fort at confluence of Mississippi and Minnesota rivers', 15),
('Jeffers Petroglyphs', 44.0667, -95.05, 'Historic Site', 'seed_script', 'Ancient rock carvings on the prairie', 26),
('Lac qui Parle Mission', 45.0333, -95.9167, 'Historic Site', 'seed_script', '1835 mission site with trails', 26),
('Oliver H. Kelley Farm', 45.2333, -93.6667, 'Historic Site', 'seed_script', 'Historic farm with nature trails', 26),
('Crow River State Water Trail', 45.1333, -94.5, 'Water Trail', 'seed_script', 'Prairie river paddling', 27),
('Kettle River State Water Trail', 46.5167, -92.8667, 'Water Trail', 'seed_script', 'Whitewater paddling adventure', 27),
('Minnesota River State Water Trail', 44.8833, -93.9333, 'Water Trail', 'seed_script', 'Historic river route', 27),
('Red Lake River State Water Trail', 47.8833, -96.0833, 'Water Trail', 'seed_script', 'Northern river journey', 27),
('Straight River State Water Trail', 44.0167, -93.3, 'Water Trail', 'seed_script', 'Clear water paddling', 27),
('Whiteface River State Water Trail', 46.6667, -92.75, 'Water Trail', 'seed_script', 'Scenic paddling through forests', 27),
('Carlos Avery Wildlife Management Area', 45.28, -93.145, 'Wildlife Area', 'manual', 'Wildlife viewing and hunting area with hiking trails near Nowthen', 30);

-- ========================================================================
-- FINAL VERIFICATION
-- ========================================================================

-- Verify final POI count (should be 138)
SELECT COUNT(*) as final_poi_count FROM poi_locations;

-- Show POI distribution by park type
SELECT park_type, COUNT(*) as count 
FROM poi_locations 
GROUP BY park_type 
ORDER BY count DESC;

-- Confirm all data loaded successfully
SELECT 'Migration Complete!' as status, COUNT(*) as total_locations FROM poi_locations;