-- ========================================================================
-- CORRECTED PRODUCTION POI MIGRATION - PART 3 OF 5
-- ========================================================================
-- Insert POI locations 61-90 with new schema structure
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Upper Sioux Agency State Park', 44.6, -95.5833, 'State Park', 'seed_script', 'Historic Dakota site with prairie restoration', 15),
('Whitewater State Park', 44.0767, -92.0558, 'State Park', 'seed_script', 'Limestone cliffs and spring-fed trout streams', 15),
('Wild River State Park', 45.6333, -92.75, 'State Park', 'seed_script', 'Wild and Scenic St. Croix River with wildlife viewing', 15),
('William O''Brien State Park', 45.5, -92.7667, 'State Park', 'seed_script', 'Sandy beach and hardwood forest along the St. Croix River', 15),
('Zippel Bay State Park', 48.8833, -94.75, 'State Park', 'seed_script', 'Remote wilderness park on Lake of the Woods', 15),
('Chippewa National Forest', 47.5, -94.2, 'National Forest', 'seed_script', 'Vast wilderness with pristine lakes and wildlife', 12),
('Superior National Forest', 47.8333, -91.1667, 'National Forest', 'seed_script', 'Boundary Waters wilderness and boreal forests', 12),
('Voyageurs National Park', 48.5, -92.8833, 'National Park', 'seed_script', 'Pristine wilderness waterways and Canadian Shield geology', 8),
('Mississippi National River and Recreation Area', 44.9, -93.2667, 'National Recreation Area', 'seed_script', 'Historic river corridor through Twin Cities', 12),
('Saint Croix National Scenic Riverway', 45.5833, -92.5, 'National Scenic Riverway', 'seed_script', 'Wild and scenic river system', 12),
('Taconite State Trail', 47.1167, -91.8667, 'State Trail', 'seed_script', '165-mile multi-use trail through forests and mining history', 18),
('Paul Bunyan State Trail', 46.8833, -94.8833, 'State Trail', 'seed_script', '120-mile paved trail from Brainerd to Bemidji', 18),
('Root River State Trail', 43.5667, -91.8, 'State Trail', 'seed_script', '42-mile limestone bluff trail through scenic valleys', 18),
('Mesabi Trail', 47.2833, -92.4333, 'State Trail', 'seed_script', '135-mile paved trail through Iron Range country', 18),
('Heartland State Trail', 46.3667, -94.6167, 'State Trail', 'seed_script', '49-mile trail through lake country and small towns', 18),
('Central Lakes State Trail', 46.0833, -94.9167, 'State Trail', 'seed_script', '55-mile trail connecting Fergus Falls to Osakis', 18),
('Cannon Valley Trail', 44.4167, -93.0167, 'State Trail', 'seed_script', '19.7-mile paved trail along the Cannon River', 18),
('Douglas State Trail', 45.8333, -95.3333, 'State Trail', 'seed_script', '13-mile trail through prairie and oak savanna', 18),
('Gateway State Trail', 45.0667, -92.9833, 'State Trail', 'seed_script', '18-mile paved trail from St. Paul to Pine Point Park', 18),
('Gitchi-Gami State Trail', 47.2, -91.3, 'State Trail', 'seed_script', '88-mile trail along Lake Superior''s North Shore', 18),
('Harmony-Preston Valley State Trail', 43.5667, -92.0167, 'State Trail', 'seed_script', '18-mile trail through scenic bluff country', 18),
('Luce Line State Trail', 45.0167, -93.7833, 'State Trail', 'seed_script', '63-mile trail from Plymouth to Cosmos', 18),
('Mill Towns State Trail', 45.4, -93.2167, 'State Trail', 'seed_script', '28-mile trail through historic mill towns', 18),
('Minnesota Valley State Trail', 44.7, -93.5833, 'State Trail', 'seed_script', '75-mile trail through river valley and prairie', 18),
('Munger State Trail', 46.7167, -92.1, 'State Trail', 'seed_script', '70-mile trail from Hinckley to Duluth', 18),
('Sakatah Singing Hills State Trail', 44.2333, -93.5167, 'State Trail', 'seed_script', '39-mile trail through oak forests and prairie', 18),
('Shooting Star State Trail', 43.6833, -92.4, 'State Trail', 'seed_script', '28-mile trail through Root River valley', 18),
('Soo Line Trail North', 47.1, -96.7667, 'State Trail', 'seed_script', '148-mile trail across northern Minnesota prairie', 18),
('Willard Munger State Trail', 46.7167, -92.1, 'State Trail', 'seed_script', '70-mile trail connecting Hinckley to Duluth', 18),
('Fort Snelling National Historical Landmark', 44.8919, -93.1811, 'Historic Site', 'seed_script', 'Historic military fort at river confluence', 15);

-- Verify batch 3 count (should be 90 total)
SELECT COUNT(*) as total_after_batch_3 FROM poi_locations;