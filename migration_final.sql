-- FINAL DATABASE MIGRATION - THE LAST SCHEMA CHANGE EVER
-- This creates a stable foundation that never needs to change again
-- All future changes will be via data loading strategies only

-- Clean slate - remove all existing weather tables
DROP TABLE IF EXISTS weather_conditions CASCADE;
DROP TABLE IF EXISTS weather_data CASCADE;
DROP TABLE IF EXISTS weather_locations CASCADE;
DROP SCHEMA IF EXISTS weather CASCADE;

-- Create final, stable schema that works for all data strategies
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    lat DECIMAL(10,6) NOT NULL,
    lng DECIMAL(10,6) NOT NULL,
    region TEXT,
    location_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE weather_conditions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Core weather data (always present regardless of source)
    temperature INTEGER NOT NULL,
    condition TEXT NOT NULL,
    precipitation INTEGER NOT NULL DEFAULT 0,
    wind_speed INTEGER NOT NULL DEFAULT 0,
    
    -- Enhanced data for contextual filtering
    description TEXT DEFAULT '',
    comfort_index DECIMAL(3,2) DEFAULT 0.5,
    activity_suitability JSONB DEFAULT '{}',
    
    -- Meta information for flexible data strategies
    data_source TEXT DEFAULT 'simulation',
    generated_at TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour'
);

-- Indexes for performance
CREATE INDEX idx_weather_location_id ON weather_conditions(location_id);
CREATE INDEX idx_weather_generated_at ON weather_conditions(generated_at);
CREATE INDEX idx_weather_valid_until ON weather_conditions(valid_until);
CREATE INDEX idx_locations_lat_lng ON locations(lat, lng);

-- Sample data to verify schema works
INSERT INTO locations (name, lat, lng, region, location_type) VALUES
    ('Minneapolis', 44.977800, -93.265000, 'Metro', 'urban'),
    ('Duluth', 46.786700, -92.100500, 'North Shore', 'lakeside'),
    ('Brainerd', 46.358000, -94.200800, 'Lakes', 'resort'),
    ('Rochester', 44.012100, -92.480200, 'Southeast', 'city'),
    ('Ely', 47.903000, -91.866800, 'Boundary Waters', 'wilderness'),
    ('Grand Rapids', 47.236900, -93.530800, 'North Central', 'forest'),
    ('International Falls', 48.600900, -93.406700, 'Border', 'border'),
    ('Alexandria', 45.885200, -95.377500, 'Lake Country', 'lake_town'),
    ('Bemidji', 47.473700, -94.880300, 'North Woods', 'college_town'),
    ('St. Cloud', 45.557900, -94.163200, 'Central', 'river_city');

-- Generate initial weather data for immediate functionality
INSERT INTO weather_conditions (location_id, temperature, condition, precipitation, wind_speed, description, data_source)
SELECT 
    id,
    FLOOR(RANDOM() * 40) + 45 AS temperature,  -- 45-85°F range
    CASE FLOOR(RANDOM() * 5)
        WHEN 0 THEN 'Sunny'
        WHEN 1 THEN 'Partly Cloudy'
        WHEN 2 THEN 'Cloudy'
        WHEN 3 THEN 'Clear'
        ELSE 'Overcast'
    END AS condition,
    FLOOR(RANDOM() * 50) AS precipitation,     -- 0-50% chance
    FLOOR(RANDOM() * 20) + 5 AS wind_speed,   -- 5-25 mph
    'Initial stable foundation data',
    'initial_seed'
FROM locations;

-- Verify the schema works with our API expectations
SELECT 
    l.id,
    l.name,
    l.lat,
    l.lng,
    w.temperature,
    w.condition,
    w.description,
    w.precipitation,
    w.wind_speed
FROM locations l
JOIN weather_conditions w ON l.id = w.location_id
ORDER BY l.name;