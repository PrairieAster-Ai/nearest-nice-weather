-- ========================================================================
-- PRODUCTION POI MIGRATION - PART 1 OF 5
-- ========================================================================
-- Clear existing data and insert first 30 POI locations
-- ========================================================================

-- Step 1: Clear existing POI data (backup first if needed)
TRUNCATE TABLE poi_locations CASCADE;

-- Step 2: Reset sequence for clean IDs
ALTER SEQUENCE poi_locations_id_seq RESTART WITH 1;

-- Step 3: Insert first batch of Minnesota POI locations (30 locations)
INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Gooseberry Falls State Park', 47.1397, -91.469, 'State Park', 'manual', 'Spectacular waterfalls along Lake Superior with hiking trails', 10),
('Itasca State Park', 47.2181, -95.2058, 'State Park', 'manual', 'Headwaters of the Mississippi River with old-growth pines', 10),
('Split Rock Lighthouse State Park', 47.1999, -91.3895, 'State Park', 'manual', 'Iconic lighthouse on Lake Superior cliffs with hiking trails', 10),
('Taylors Falls State Park', 45.4005, -92.6518, 'State Park', 'manual', 'St. Croix River gorge with rock climbing and scenic overlooks', 10),
('Grand Portage National Monument', 47.9953, -89.6842, 'National Monument', 'seed_script', 'Historic fur trade depot and Ojibwe heritage', 12),
('Pipestone National Monument', 44.0133, -96.3253, 'National Monument', 'seed_script', 'Sacred Native American quarries', 12),
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
('Gooseberry Falls State Park', 47.1389, -91.4706, 'State Park', 'seed_script', 'Famous for its spectacular waterfalls on the Gooseberry River', 15),
('Grand Portage State Park', 48, -89.5833, 'State Park', 'seed_script', 'Minnesota''s highest waterfall and northernmost state park', 15),
('Great River Bluffs State Park', 43.9344, -91.4083, 'State Park', 'seed_script', 'Spectacular bluff-top views of the Mississippi River', 15),
('Hayes Lake State Park', 48.6333, -95.5167, 'State Park', 'seed_script', 'Remote northern wilderness park', 15);

-- Verify batch 1 count
SELECT COUNT(*) as batch_1_count FROM poi_locations;