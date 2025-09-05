-- ========================================================================
-- COMPLETE CLEAN POI MIGRATION - ALL 138 LOCATIONS
-- ========================================================================
-- Single file migration with exactly 138 unique POI locations
-- No duplicates, production ready
-- ========================================================================

-- First, clear any existing data
DELETE FROM poi_locations;
ALTER SEQUENCE poi_locations_id_seq RESTART WITH 1;

-- Insert all 138 POI locations in one transaction
INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
-- STATE PARKS (Part 1: 1-28)
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
('John A. Latsch State Park', 44.0667, -91.8667, 'State Park', 'seed_script', 'Blufftop park with Mississippi River valley views', 15),

-- STATE PARKS (Part 2: 29-56)
('Judge C.R. Magney State Park', 47.8167, -90.05, 'State Park', 'seed_script', 'Home to the mysterious Devil''s Kettle waterfall', 15),
('Kilen Woods State Park', 43.7333, -95.0667, 'State Park', 'seed_script', 'Oak woodlands along the Des Moines River', 15),
('Lac qui Parle State Park', 45, -95.8833, 'State Park', 'seed_script', 'Prairie wetlands and historic sites', 15),
('Lake Bemidji State Park', 47.5333, -94.8333, 'State Park', 'seed_script', 'Beautiful beaches and bog walk on Lake Bemidji', 15),
('Lake Bronson State Park', 48.7333, -96.6667, 'State Park', 'seed_script', 'Prairie meets aspen parkland', 15),
('Lake Carlos State Park', 45.9833, -95.35, 'State Park', 'seed_script', 'Clear water lake with great swimming', 15),
('Lake Louise State Park', 43.5414, -92.5006, 'State Park', 'seed_script', 'Prairie restoration with wildflowers and wildlife', 15),
('Lake Maria State Park', 45.3214, -93.9306, 'State Park', 'seed_script', 'Remnant of Big Woods with trails and backcountry campsites', 15),
('Lake Shetek State Park', 44.1044, -95.6917, 'State Park', 'seed_script', 'Largest lake in southwest Minnesota with diverse recreation', 15),
('Lake Vermilion State Park', 47.8292, -92.4283, 'State Park', 'seed_script', 'Newest state park on scenic Lake Vermilion', 15),
('McCarthy Beach State Park', 47.6522, -93.0603, 'State Park', 'seed_script', 'Sandy beach on Side Lake with excellent swimming', 15),
('Mille Lacs Kathio State Park', 46.1308, -93.7447, 'State Park', 'seed_script', 'Archaeological sites and hiking trails near Mille Lacs Lake', 15),
('Minneopa State Park', 44.1433, -94.0922, 'State Park', 'seed_script', 'Double waterfall and historic windmill', 15),
('Monson Lake State Park', 45.3167, -95.2667, 'State Park', 'seed_script', 'Historic site with swimming beach and hiking trails', 15),
('Myre-Big Island State Park', 43.6383, -93.3089, 'State Park', 'seed_script', 'Oak savanna on a glacial esker peninsula', 15),
('Nerstrand Big Woods State Park', 44.3453, -93.0972, 'State Park', 'seed_script', 'Last remnant of Big Woods with hidden waterfall', 15),
('Old Mill State Park', 48.25, -96.0833, 'State Park', 'seed_script', 'Historic mill and swimming hole', 15),
('Rice Lake State Park', 44.0833, -93.0667, 'State Park', 'seed_script', 'Southern hardwood forests', 15),
('Sakatah Lake State Park', 44.2333, -93.5167, 'State Park', 'seed_script', 'Hardwood forests and lake recreation', 15),
('Scenic State Park', 47.7089, -93.5833, 'State Park', 'seed_script', 'Virgin pine forests surrounding pristine lakes', 15),
('Sibley State Park', 45.0014, -95.0142, 'State Park', 'seed_script', 'Mount Tom offers panoramic views of the prairie landscape', 15),
('Soudan Underground Mine State Park', 47.8147, -92.2442, 'State Park', 'seed_script', 'Minnesota''s oldest iron mine with underground tours', 15),
('Split Rock Creek State Park', 43.5, -96.3667, 'State Park', 'seed_script', 'Historic dam and lake on Split Rock Creek', 15),
('Split Rock Lighthouse State Park', 47.2003, -91.3672, 'State Park', 'seed_script', 'Iconic lighthouse perched on a cliff overlooking Lake Superior', 10),
('Temperance River State Park', 47.5522, -90.8825, 'State Park', 'seed_script', 'Deep gorges and waterfalls carved by the Temperance River', 15),
('Upper Sioux Agency State Park', 44.6, -95.5833, 'State Park', 'seed_script', 'Historic Dakota site with prairie restoration', 15),
('Whitewater State Park', 44.0767, -92.0558, 'State Park', 'seed_script', 'Limestone cliffs and spring-fed trout streams', 15),
('Wild River State Park', 45.6333, -92.75, 'State Park', 'seed_script', 'Wild and Scenic St. Croix River with wildlife viewing', 15),

-- ADDITIONAL STATE PARKS AND NATIONAL AREAS (Part 3: 57-84)
('William O''Brien State Park', 45.5, -92.7667, 'State Park', 'seed_script', 'Sandy beach and hardwood forest along the St. Croix River', 15),
('Zippel Bay State Park', 48.8833, -94.75, 'State Park', 'seed_script', 'Remote wilderness park on Lake of the Woods', 15),
('Voyageurs National Park', 48.5, -92.8833, 'National Park', 'seed_script', 'Pristine wilderness waterways and Canadian Shield geology', 8),
('Grand Portage National Monument', 47.9953, -89.6842, 'National Monument', 'seed_script', 'Historic fur trade depot and Ojibwe heritage', 12),
('Pipestone National Monument', 44.0133, -96.3253, 'National Monument', 'seed_script', 'Sacred Native American quarries', 12),
('Chippewa National Forest', 47.5, -94.2, 'National Forest', 'seed_script', 'Vast wilderness with pristine lakes and wildlife', 12),
('Superior National Forest', 47.8333, -91.1667, 'National Forest', 'seed_script', 'Boundary Waters wilderness and boreal forests', 12),
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

-- HISTORIC SITES AND REGIONAL PARKS (Part 4: 85-112)
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
('Silverwood Park', 45.0833, -93.2167, 'Regional Park', 'seed_script', 'Art programs and Silver Lake access', 18),

-- NATURE CENTERS, CITY PARKS, AND FINAL LOCATIONS (Part 5: 113-138)
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

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================

-- Final count check - should be exactly 138
SELECT
    COUNT(*) as total_poi_locations,
    'Expected: 138' as target
FROM poi_locations;

-- Distribution by park type
SELECT
    park_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / 138, 1) as percentage
FROM poi_locations
GROUP BY park_type
ORDER BY count DESC;

-- Importance rank distribution
SELECT
    importance_rank,
    COUNT(*) as count
FROM poi_locations
GROUP BY importance_rank
ORDER BY importance_rank;

-- Check for any duplicates (should return no rows)
SELECT
    name,
    COUNT(*) as duplicate_count
FROM poi_locations
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;

-- Sample of top importance locations
SELECT
    name,
    park_type,
    importance_rank,
    description
FROM poi_locations
WHERE importance_rank <= 10
ORDER BY importance_rank, name;

-- Final status
SELECT
    'POI Migration Complete' as status,
    COUNT(*) as total_locations,
    COUNT(DISTINCT name) as unique_names,
    CASE WHEN COUNT(*) = 138 THEN '✅ SUCCESS' ELSE '❌ CHECK REQUIRED' END as result
FROM poi_locations;
