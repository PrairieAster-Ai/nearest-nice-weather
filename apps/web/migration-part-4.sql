-- ========================================================================
-- PRODUCTION POI MIGRATION - PART 4 OF 5
-- ========================================================================
-- Insert POI locations 91-120
-- ========================================================================

INSERT INTO poi_locations (name, lat, lng, park_type, data_source, description, importance_rank) VALUES
('Rice Creek Chain of Lakes Park Reserve', 45.1389, -93.0917, 'Regional Park', 'seed_script', 'Multiple lakes connected by channels', 20),
('Rum River Central Regional Park', 45.36, -93.2, 'County Park', 'manual', 'River park with canoe access and hiking trails', 20),
('Saint Croix National Scenic Riverway', 45.4, -92.65, 'Scenic River', 'seed_script', 'Protected river corridor for paddling', 20),
('Theodore Wirth Regional Park', 44.9889, -93.3239, 'Regional Park', 'seed_script', 'Minneapolis'' largest park with lakes and trails', 20),
('Chengwatana State Forest', 45.85, -92.8833, 'State Forest', 'seed_script', 'Pine forests with ATV and snowmobile trails', 22),
('D.A.R. State Forest', 45.9833, -93.1833, 'State Forest', 'seed_script', 'Hardwood forests near the St. Croix River', 22),
('Foot Hills State Forest', 46.85, -94.8333, 'State Forest', 'seed_script', 'Rolling hills and mixed forests', 22),
('General C.C. Andrews State Forest', 46.1667, -92.7, 'State Forest', 'seed_script', 'Historic forestry site with trails', 22),
('Kabetogama State Forest', 48.3333, -93, 'State Forest', 'seed_script', 'Gateway to Voyageurs National Park waters', 22),
('Lake of the Woods State Forest', 48.75, -95.0833, 'State Forest', 'seed_script', 'Vast northern waters and forests', 22),
('Nemadji State Forest', 46.5833, -92.5833, 'State Forest', 'seed_script', 'Red clay valleys and pine forests', 22),
('Paul Bunyan State Forest', 47.3667, -94.8833, 'State Forest', 'seed_script', 'Named for the legendary lumberjack', 22),
('Pillsbury State Forest', 46.6333, -94.2667, 'State Forest', 'seed_script', 'Diverse forest habitats with many lakes', 22),
('Sand Dunes State Forest', 46.4, -93.0667, 'State Forest', 'seed_script', 'Unique sand dune ecosystem with OHV recreation', 22),
('Savanna State Forest', 46.7833, -93.35, 'State Forest', 'seed_script', 'Jack pine forests and wetlands', 22),
('Snake River State Forest', 46.1333, -93.1167, 'State Forest', 'seed_script', 'Canoeing and camping along the Snake River', 22),
('Crosslake Recreation Area', 46.6581, -94.1133, 'Recreation Area', 'seed_script', 'Popular lake area in Brainerd Lakes region', 23),
('Gull Lake Recreation Area', 46.4167, -94.35, 'Recreation Area', 'seed_script', 'Large lake with multiple access points', 23),
('Lake Pahoja Recreation Area', 44.0833, -95.05, 'Recreation Area', 'seed_script', 'Small lake with camping and water activities', 23),
('Leech Lake Recreation Area', 47.0833, -94.3833, 'Recreation Area', 'seed_script', 'Minnesota''s third largest lake', 23),
('Mississippi National River and Recreation Area', 44.9489, -93.0983, 'Recreation Area', 'seed_script', '72-mile river corridor through Twin Cities', 23),
('Pelican Lake Recreation Area', 46.6, -94.15, 'Recreation Area', 'seed_script', 'Excellent fishing and water sports', 23),
('Cannon Valley Trail', 44.4667, -92.9, 'Trail System', 'seed_script', '20 miles along the Cannon River', 24),
('Central Lakes State Trail', 46.2833, -95.05, 'Trail System', 'seed_script', '55 miles connecting lake communities', 24),
('Gateway State Trail', 45, -92.9333, 'Trail System', 'seed_script', '18 miles from St. Paul to Pine Point Park', 24),
('Glacial Lakes State Trail', 45.55, -95.1333, 'Trail System', 'seed_script', '22 miles through rolling prairie', 24),
('Heartland State Trail', 45.8, -94.75, 'Trail System', 'seed_script', '49 miles through lakes and forests', 24),
('Lake Wobegon Trail', 45.6167, -94.5833, 'Trail System', 'seed_script', '46 miles through Garrison Keillor country', 24),
('Minnesota River State Trail', 44.5333, -93.9667, 'Trail System', 'seed_script', 'Growing trail along Minnesota River valley', 24),
('Paul Bunyan State Trail', 46.35, -94.2, 'Trail System', 'seed_script', '120 miles - Minnesota''s longest rail-trail', 24);

-- Verify batch 4 count (should be 120 total)
SELECT COUNT(*) as total_after_batch_4 FROM poi_locations;