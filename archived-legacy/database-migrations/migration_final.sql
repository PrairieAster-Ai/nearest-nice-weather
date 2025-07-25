-- ========================================================================
-- FINAL DATABASE MIGRATION - THE LAST SCHEMA CHANGE EVER
-- ========================================================================
-- 
-- BUSINESS CONTEXT: Weather Intelligence Platform for Minnesota Tourism
-- TARGET PERSONAS: 
-- - Sarah Kowalski (BWCA Outfitter): Safety-critical weather decisions, $400-800/mo value
-- - Jennifer Martinez (Mayo Medical Tourism): Family stress reduction during medical care
-- - Andrea Thompson (Bass Tournament): Performance-driven weather strategy, $50-100/mo
-- - Kirsten Lindqvist (Rural Business): Regional development across remote Minnesota areas
--
-- STABILITY PROMISE: This schema is LOCKED FOREVER to prevent database rebuild cycles
-- All future features will be delivered through data loading strategies, not schema changes
-- 
-- DESIGN PHILOSOPHY: Simple, extensible schema supporting multiple data strategies
-- - Real-time API integration (future)
-- - Intelligent simulation (current) 
-- - Hybrid real+simulated data (planned)
-- - Historical pattern analysis (planned)
--
-- ========================================================================

-- Clean slate - remove all existing weather tables from previous iterations
-- This prevents conflicts with old PostGIS-based schemas and weather.* namespaces
DROP TABLE IF EXISTS weather_conditions CASCADE;
DROP TABLE IF EXISTS weather_data CASCADE;
DROP TABLE IF EXISTS weather_locations CASCADE;
DROP SCHEMA IF EXISTS weather CASCADE;

-- ========================================================================
-- CORE LOCATIONS TABLE
-- ========================================================================
-- PURPOSE: Minnesota geographic locations for tourism operators and outdoor enthusiasts
-- PERSONA NEEDS:
-- - Sarah (BWCA): Multiple wilderness entry points and lake regions
-- - Jennifer (Mayo): Rochester medical district + family activity areas  
-- - Andrea (Bass): Tournament venues across 400-mile radius from Twin Cities
-- - Kirsten (Rural): Remote communities from St. Cloud to Iron Range
--
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                    -- Human-readable location name (e.g., "Ely", "Rochester", "Lake Minnetonka")
    lat DECIMAL(10,6) NOT NULL,            -- Latitude (6 decimal precision = ~4 inch accuracy)
    lng DECIMAL(10,6) NOT NULL,            -- Longitude (sufficient for all Minnesota tourism needs)
    region TEXT,                           -- Minnesota region (e.g., "BWCA", "North Shore", "Metro", "Iron Range")
    location_type TEXT,                    -- Activity context (e.g., "wilderness", "urban", "lakeside", "medical_district")
    created_at TIMESTAMP DEFAULT NOW()
    
    -- EXTENSIBILITY NOTES FOR CLAUDE AI:
    -- - region: Used for persona-specific filtering (Sarah needs "BWCA", Jennifer needs "Rochester area")
    -- - location_type: Enables activity-specific recommendations without schema changes
    -- - Future enhancements via data strategies: elevation, accessibility, amenities, etc.
    -- - NO GEOMETRY TYPES: Simple lat/lng avoids PostGIS dependency and deployment complexity
);

-- ========================================================================
-- WEATHER CONDITIONS TABLE
-- ========================================================================
-- PURPOSE: Flexible weather data supporting multiple personas and data strategies
-- PERSONA REQUIREMENTS:
-- - Sarah (BWCA): Lightning alerts, wind speeds for paddling safety, multi-day forecasts
-- - Jennifer (Mayo): Comfort conditions for medical families, indoor/outdoor activity planning
-- - Andrea (Bass): Barometric pressure changes, water temperature correlation, competition timing
-- - Kirsten (Rural): Remote area reliability, offline capability, business travel conditions
--
CREATE TABLE weather_conditions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    
    -- ====================================================================
    -- CORE WEATHER DATA (Always present regardless of data source)
    -- ====================================================================
    temperature INTEGER NOT NULL,          -- Fahrenheit (integer sufficient for outdoor activity decisions)
    condition TEXT NOT NULL,               -- Weather condition (e.g., "Sunny", "Thunderstorms", "Light Snow")
    precipitation INTEGER NOT NULL DEFAULT 0,  -- Percentage chance (0-100, matches user mental models)
    wind_speed INTEGER NOT NULL DEFAULT 0,     -- Miles per hour (critical for Sarah's paddling safety, Andrea's fishing)
    
    -- ====================================================================
    -- CONTEXTUAL INTELLIGENCE (Persona-specific decision support)
    -- ====================================================================
    description TEXT DEFAULT '',           -- Human-readable weather summary for Jennifer's family planning
    comfort_index DECIMAL(3,2) DEFAULT 0.5,    -- 0.0-1.0 scale for medical family stress reduction
    activity_suitability JSONB DEFAULT '{}',   -- Activity-specific scores: {"fishing": 0.8, "hiking": 0.6, "camping": 0.9}
    
    -- CLAUDE AI GUIDANCE FOR activity_suitability JSONB:
    -- - Sarah needs: {"wilderness_paddling": 0.8, "portaging": 0.7, "camping": 0.9}
    -- - Jennifer needs: {"family_outdoor": 0.6, "accessibility_friendly": 0.8, "indoor_backup": 0.9}
    -- - Andrea needs: {"bass_fishing": 0.8, "tournament_conditions": 0.7, "boat_launch": 0.9}
    -- - Kirsten needs: {"business_travel": 0.7, "community_events": 0.8, "hunting_fishing": 0.6}
    -- 
    -- EXTENSIBILITY: Add new activities without schema changes via data loading strategies
    
    -- ====================================================================
    -- DATA STRATEGY METADATA (Supports multiple data sources)
    -- ====================================================================
    data_source TEXT DEFAULT 'simulation',     -- 'simulation', 'api', 'hybrid', 'historical' (enables data strategy evolution)
    generated_at TIMESTAMP DEFAULT NOW(),      -- When this data was created/updated
    valid_until TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour'  -- Cache invalidation for real-time transitions
    
    -- CLAUDE AI DECISION SUPPORT:
    -- - data_source helps determine data freshness and reliability for persona needs
    -- - Sarah requires high reliability -> prefer 'api' or 'hybrid' over 'simulation'
    -- - Jennifer needs consistency -> 'simulation' acceptable for stress reduction
    -- - Andrea wants accuracy -> 'api' preferred for tournament success
    -- - valid_until enables seamless transition from simulation to real-time data
);

-- ========================================================================
-- PERFORMANCE INDEXES (Optimized for persona usage patterns)
-- ========================================================================
-- CLAUDE AI QUERY OPTIMIZATION GUIDANCE:
-- - location_id: Most queries filter by location first (all personas)
-- - generated_at: Time-based queries for data freshness (Sarah's multi-day planning)
-- - valid_until: Cache invalidation and real-time data transitions
-- - lat/lng composite: Proximity searches for Andrea's tournament radius, Kirsten's rural travel
--
CREATE INDEX idx_weather_location_id ON weather_conditions(location_id);
CREATE INDEX idx_weather_generated_at ON weather_conditions(generated_at);
CREATE INDEX idx_weather_valid_until ON weather_conditions(valid_until);
CREATE INDEX idx_locations_lat_lng ON locations(lat, lng);           -- Enables distance calculations without PostGIS

-- ========================================================================
-- INITIAL MINNESOTA LOCATIONS (Persona-representative sample)
-- ========================================================================
-- SELECTION CRITERIA:
-- - Geographic diversity across Minnesota tourism regions
-- - Representative of each persona's operational areas
-- - Real coordinates for accurate distance calculations
-- - Different location_type values to test activity-specific filtering
--
-- PERSONA COVERAGE:
-- - Sarah (BWCA): Ely, Grand Rapids (wilderness outfitting areas)
-- - Jennifer (Mayo): Rochester (medical tourism center)
-- - Andrea (Bass): Minneapolis, Brainerd (tournament venues + metro base)
-- - Kirsten (Rural): International Falls, Bemidji (remote business communities)
--
INSERT INTO locations (name, lat, lng, region, location_type) VALUES
    ('Minneapolis', 44.977800, -93.265000, 'Metro', 'urban'),           -- Andrea's home base, urban amenities
    ('Duluth', 46.786700, -92.100500, 'North Shore', 'lakeside'),      -- Tourism gateway, scenic activities  
    ('Brainerd', 46.358000, -94.200800, 'Lakes', 'resort'),            -- Andrea's tournament venue, family tourism
    ('Rochester', 44.012100, -92.480200, 'Southeast', 'city'),         -- Jennifer's medical tourism center
    ('Ely', 47.903000, -91.866800, 'Boundary Waters', 'wilderness'),   -- Sarah's outfitting headquarters
    ('Grand Rapids', 47.236900, -93.530800, 'North Central', 'forest'), -- Rural tourism, outdoor recreation
    ('International Falls', 48.600900, -93.406700, 'Border', 'border'),-- Kirsten's remote business community
    ('Alexandria', 45.885200, -95.377500, 'Lake Country', 'lake_town'), -- Mid-state recreation hub
    ('Bemidji', 47.473700, -94.880300, 'North Woods', 'college_town'),  -- Kirsten's rural network, education center
    ('St. Cloud', 45.557900, -94.163200, 'Central', 'river_city');      -- Central Minnesota business/recreation

-- ========================================================================
-- INITIAL WEATHER DATA (Verification and immediate functionality)
-- ========================================================================
-- PURPOSE: Populate database with realistic initial data for immediate testing
-- CLAUDE AI ENHANCEMENT OPPORTUNITY:
-- - Replace this basic random generation with intelligent simulation
-- - Use database-seeder.js for persona-specific weather scenarios
-- - Consider seasonal patterns and Minnesota climate baselines
--
-- PERSONA TESTING SCENARIOS:
-- - Sarah: Include high-wind scenarios (>20mph) for paddling safety testing
-- - Jennifer: Include comfort-friendly scenarios (60-75°F, low precipitation)  
-- - Andrea: Include varied conditions for tournament strategy testing
-- - Kirsten: Include challenging rural travel conditions
--
INSERT INTO weather_conditions (location_id, temperature, condition, precipitation, wind_speed, description, data_source)
SELECT 
    id,
    FLOOR(RANDOM() * 40) + 45 AS temperature,  -- 45-85°F range (Minnesota seasonal reality)
    CASE FLOOR(RANDOM() * 5)                   -- Basic conditions for initial testing
        WHEN 0 THEN 'Sunny'                    -- Good for Jennifer's family activities
        WHEN 1 THEN 'Partly Cloudy'            -- Ideal for Andrea's fishing
        WHEN 2 THEN 'Cloudy'                   -- Acceptable for Sarah's paddling
        WHEN 3 THEN 'Clear'                    -- Excellent for all personas
        ELSE 'Overcast'                        -- Testing marginal conditions
    END AS condition,
    FLOOR(RANDOM() * 50) AS precipitation,     -- 0-50% chance (testing filter responsiveness)
    FLOOR(RANDOM() * 20) + 5 AS wind_speed,   -- 5-25 mph (includes Sarah's safety thresholds)
    'Initial stable foundation data',          -- Temporary description for testing
    'initial_seed'                             -- Identifies this as basic test data
FROM locations;

-- ========================================================================
-- SCHEMA VALIDATION QUERY (Verifies API compatibility)
-- ========================================================================
-- PURPOSE: Confirm the schema matches frontend expectations and persona needs
-- CLAUDE AI VALIDATION POINTS:
-- - All required fields populated for API response format
-- - Geographic spread appropriate for Minnesota tourism market
-- - Weather variety suitable for filter testing
-- - Data structure supports persona-specific queries
--
SELECT 
    l.id,
    l.name,
    l.lat,
    l.lng,
    l.region,                                  -- For persona-specific filtering
    l.location_type,                           -- For activity-based recommendations
    w.temperature,
    w.condition,
    w.description,
    w.precipitation,
    w.wind_speed,
    w.data_source,                             -- Identifies simulation vs real data
    w.generated_at
FROM locations l
JOIN weather_conditions w ON l.id = w.location_id
ORDER BY l.name;

-- ========================================================================
-- CLAUDE AI NEXT STEPS RECOMMENDATIONS:
-- ========================================================================
-- 1. ENHANCE WEATHER SIMULATION:
--    - Replace random data with intelligent simulation (database-seeder.js)
--    - Add seasonal patterns for Minnesota climate
--    - Include persona-specific scenarios for testing
--
-- 2. ACTIVITY SUITABILITY POPULATION:
--    - Add JSONB activity scores for each persona
--    - Include comfort_index calculations
--    - Test contextual filtering capabilities
--
-- 3. PERSONA-SPECIFIC LOCATIONS:
--    - Add more BWCA entry points for Sarah
--    - Include Rochester medical district areas for Jennifer  
--    - Add tournament venues for Andrea
--    - Include remote rural areas for Kirsten
--
-- 4. PERFORMANCE OPTIMIZATION:
--    - Monitor query performance with larger datasets
--    - Add indexes for persona-specific query patterns
--    - Implement data archiving strategy for historical weather
--
-- 5. REAL-TIME DATA INTEGRATION:
--    - Plan transition from simulation to API data
--    - Implement valid_until-based cache invalidation
--    - Add data_source quality indicators
-- ========================================================================