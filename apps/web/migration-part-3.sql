-- ========================================================================
-- PRODUCTION POI MIGRATION - PART 3 OF 5
-- ========================================================================
-- Insert POI locations 61-90
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Tettegouche State Park', 47.3425, -91.1978, 'State Park', 'seed_script', 'Rugged coastline, inland lakes, and the Baptism River High Falls', 15),
('Upper Sioux Agency State Park', 44.7333, -95.4667, 'State Park', 'seed_script', 'Historic site with hiking and horseback riding trails', 15),
('Whitewater State Park', 44.0597, -92.0386, 'State Park', 'seed_script', 'Limestone bluffs and trout streams in the Driftless Area', 15),
('Wild River State Park', 45.5342, -92.7506, 'State Park', 'seed_script', '18 miles of St. Croix River shoreline with diverse habitats', 15),
('William O''Brien State Park', 45.2219, -92.7619, 'State Park', 'seed_script', 'Hardwood forests and wetlands along the St. Croix River', 15),
('Zippel Bay State Park', 48.8667, -94.85, 'State Park', 'seed_script', 'Lake of the Woods beaches and fishing', 15),
('Agassiz National Wildlife Refuge', 48.3, -96, 'Wildlife Refuge', 'seed_script', 'Vast wetlands in northwestern Minnesota', 18),
('Big Stone National Wildlife Refuge', 45.2667, -96.3333, 'Wildlife Refuge', 'seed_script', 'Prairie and wetland habitats', 18),
('Crane Meadows National Wildlife Refuge', 46.2333, -93.8333, 'Wildlife Refuge', 'seed_script', 'Wetlands for waterfowl and sandhill cranes', 18),
('Hamden Slough National Wildlife Refuge', 47.0167, -96.2833, 'Wildlife Refuge', 'seed_script', 'Prairie pothole wetlands and grasslands', 18),
('Minnesota Valley National Wildlife Refuge', 44.8075, -93.5272, 'Wildlife Refuge', 'seed_script', 'Urban refuge along the Minnesota River', 18),
('Northern Tallgrass Prairie National Wildlife Refuge', 44.0833, -96.1667, 'Wildlife Refuge', 'seed_script', 'Scattered prairie remnants preservation', 18),
('Rice Lake National Wildlife Refuge', 46.5167, -93.3333, 'Wildlife Refuge', 'seed_script', 'Wild rice lakes and diverse wildlife', 18),
('Rydell National Wildlife Refuge', 47.5333, -95.3, 'Wildlife Refuge', 'seed_script', 'Transition zone between prairie and forest', 18),
('Sherburne National Wildlife Refuge', 45.4167, -93.95, 'Wildlife Refuge', 'seed_script', 'Oak savanna and wetlands sanctuary', 18),
('Tamarac National Wildlife Refuge', 47.05, -95.6, 'Wildlife Refuge', 'seed_script', 'Lakes, bogs, and forests in the glacial lake country', 18),
('Baker Park Reserve', 45.0481, -93.5869, 'Regional Park', 'seed_script', 'Lake Independence shoreline with diverse habitats', 20),
('Battle Creek Regional Park', 44.9356, -93.0214, 'Regional Park', 'seed_script', 'Wooded valleys and ravines in St. Paul', 20),
('Bunker Hills Regional Park', 45.2181, -93.2839, 'Regional Park', 'seed_script', 'Wave pool, golf, and extensive trails', 20),
('Bunker Hills Regional Park', 45.245, -93.28, 'County Park', 'manual', 'Multi-use park with trails, beach, and recreational facilities', 20),
('Carver Park Reserve', 44.8783, -93.6283, 'Regional Park', 'seed_script', 'Largest park in Three Rivers system', 20),
('Chain of Lakes Regional Park', 44.9483, -93.3067, 'Regional Park', 'seed_script', 'Connected lakes with trails in Minneapolis', 20),
('Como Regional Park', 44.9819, -93.1494, 'Regional Park', 'seed_script', 'Historic park with zoo, conservatory, and lake', 20),
('Coon Rapids Dam Regional Park', 45.1444, -93.3117, 'Regional Park', 'seed_script', 'Mississippi River dam with visitor center', 20),
('Elm Creek Park Reserve', 45.1394, -93.4406, 'Regional Park', 'seed_script', 'Swimming pond, trails, and nature center', 20),
('Hyland Lake Park Reserve', 44.8433, -93.3717, 'Regional Park', 'seed_script', 'Year-round recreation with ski slopes and trails', 20),
('Lebanon Hills Regional Park', 44.7764, -93.1872, 'Regional Park', 'seed_script', '2,000 acres with mountain biking and hiking trails', 20),
('Minnehaha Falls Regional Park', 44.9153, -93.2111, 'County Park', 'manual', 'Historic waterfall park with paved trails and scenic overlooks', 20),
('Minnehaha Regional Park', 44.9153, -93.21, 'Regional Park', 'seed_script', '53-foot waterfall and limestone bluffs in Minneapolis', 20),
('Murphy-Hanrehan Park Reserve', 44.7394, -93.3439, 'Regional Park', 'seed_script', 'Glacial landscapes with challenging trails', 20);

-- Verify batch 3 count (should be 90 total)
SELECT COUNT(*) as total_after_batch_3 FROM poi_locations;