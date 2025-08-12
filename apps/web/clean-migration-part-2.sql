-- ========================================================================
-- CLEAN PRODUCTION POI MIGRATION - PART 2 OF 5 (NO DUPLICATES)
-- ========================================================================
-- Insert POI locations 29-56 - carefully curated to avoid duplicates
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
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
('Wild River State Park', 45.6333, -92.75, 'State Park', 'seed_script', 'Wild and Scenic St. Croix River with wildlife viewing', 15);

-- Verify count (should be 56 total)
SELECT COUNT(*) as total_after_batch_2 FROM poi_locations;