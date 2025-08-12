-- ========================================================================
-- CLEAN PRODUCTION POI MIGRATION - PART 1 OF 5 (NO DUPLICATES)
-- ========================================================================
-- Insert first 28 POI locations - carefully curated to avoid duplicates
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Afton State Park', 44.8339, -92.7935, 'State Park', 'seed_script', 'Bluff-top views of the St. Croix River valley', 15),
('Bear Head Lake State Park', 47.8167, -92.05, 'State Park', 'seed_script', 'Wilderness escape with clear lakes and hiking trails', 15),
('Beaver Creek Valley State Park', 43.6381, -91.5972, 'State Park', 'seed_script', 'Spring-fed trout stream in a narrow valley', 15),
('Big Stone Lake State Park', 45.3667, -96.45, 'State Park', 'seed_script', 'Minnesota''s western border lake with great fishing', 15),
('Blue Mounds State Park', 43.7067, -96.1892, 'State Park', 'seed_script', 'Sioux quartzite cliff and bison herd on the prairie', 15),
('Buffalo River State Park', 46.8667, -96.45, 'State Park', 'seed_script', 'Prairie river ecosystem', 15),
('Camden State Park', 44.3667, -95.9167, 'State Park', 'seed_script', 'Spring-fed Redwood River valley with swimming and trails', 15),
('Carley State Park', 44.1103, -92.1636, 'State Park', 'seed_script', 'Prairie restoration and Whitewater River access', 15),
('Cascade River State Park', 47.7089, -90.5, 'State Park', 'seed_script', 'Series of waterfalls flowing into Lake Superior', 15),
('Charles A. Lindbergh State Park', 45.9594, -94.3847, 'State Park', 'seed_script', 'Boyhood home of aviator Charles Lindbergh', 15),
('Crow Wing State Park', 46.2653, -94.3333, 'State Park', 'seed_script', 'Historic fur trading post at Mississippi River confluence', 15),
('Father Hennepin State Park', 46.1667, -93.45, 'State Park', 'seed_script', 'Peninsula park on Mille Lacs Lake with great fishing', 15),
('Flandrau State Park', 44.2889, -94.4592, 'State Park', 'seed_script', 'Swimming pond and trails along the Cottonwood River', 15),
('Forestville/Mystery Cave State Park', 43.6358, -92.2258, 'State Park', 'seed_script', 'Minnesota''s longest cave and historic townsite', 15),
('Fort Ridgely State Park', 44.4433, -94.7267, 'State Park', 'seed_script', 'Historic fort site with golf course and trails', 15),
('Fort Snelling State Park', 44.8928, -93.1811, 'State Park', 'seed_script', 'Historic fort at confluence of Mississippi and Minnesota rivers', 15),
('Frontenac State Park', 44.5167, -92.35, 'State Park', 'seed_script', 'Bird migration hotspot overlooking Lake Pepin', 15),
('George H. Crosby Manitou State Park', 47.4833, -91.1167, 'State Park', 'seed_script', 'Backpacking paradise with rugged terrain and quiet solitude', 15),
('Glacial Lakes State Park', 45.55, -95.4, 'State Park', 'seed_script', 'Rolling hills and prairie lakes', 15),
('Glendalough State Park', 46.3333, -95.6833, 'State Park', 'seed_script', 'Heritage fishery and pristine lakes', 15),
('Gooseberry Falls State Park', 47.1389, -91.4706, 'State Park', 'seed_script', 'Famous for its spectacular waterfalls on the Gooseberry River', 10),
('Grand Portage State Park', 48, -89.5833, 'State Park', 'seed_script', 'Minnesota''s highest waterfall and northernmost state park', 15),
('Great River Bluffs State Park', 43.9344, -91.4083, 'State Park', 'seed_script', 'Spectacular bluff-top views of the Mississippi River', 15),
('Hayes Lake State Park', 48.6333, -95.5167, 'State Park', 'seed_script', 'Remote northern wilderness park', 15),
('Hill Annex Mine State Park', 47.5167, -93.2667, 'State Park', 'seed_script', 'Historic open-pit iron mine with fossil hunting', 15),
('Interstate State Park', 45.3908, -92.6522, 'State Park', 'seed_script', 'Dramatic glacial potholes and cliffs along the St. Croix River', 15),
('Itasca State Park', 47.2419, -95.2061, 'State Park', 'seed_script', 'Headwaters of the Mississippi River and old-growth pine forests', 10),
('John A. Latsch State Park', 44.0667, -91.8667, 'State Park', 'seed_script', 'Blufftop park with Mississippi River valley views', 15);

-- Verify count (should be 28)
SELECT COUNT(*) as batch_1_count FROM poi_locations;