-- ========================================================================
-- DATABASE REBUILD SCRIPT
-- ========================================================================
-- Rebuilds database schema to match production code expectations
-- Run this in Neon SQL Editor or via psql

-- Drop existing tables (if any)
DROP TABLE IF EXISTS weather_conditions;
DROP TABLE IF EXISTS locations;

-- Create locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create weather_conditions table
CREATE TABLE weather_conditions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    temperature INTEGER,
    condition VARCHAR(100),
    description TEXT,
    precipitation INTEGER,
    wind_speed INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample Minnesota locations
INSERT INTO locations (name, lat, lng) VALUES
('Minneapolis', 44.9778, -93.2650),
('St. Paul', 44.9537, -93.0900),
('Duluth', 46.7867, -92.1005),
('Rochester', 44.0121, -92.4802),
('Bloomington', 44.8408, -93.2982),
('Plymouth', 45.0105, -93.4555),
('Minnetonka', 44.9211, -93.4687),
('Eagan', 44.8041, -93.1668),
('Woodbury', 44.9239, -92.9594),
('Maple Grove', 45.0725, -93.4557),
('Eden Prairie', 44.8547, -93.4708),
('Coon Rapids', 45.1200, -93.3030),
('Burnsville', 44.7677, -93.2777),
('Blaine', 45.1607, -93.2349),
('Lakeville', 44.6496, -93.2424),
('Brainerd', 46.3580, -94.2008),
('St. Cloud', 45.5579, -94.1632),
('Mankato', 44.1636, -93.9994),
('Winona', 44.0498, -91.6407),
('Moorhead', 46.8737, -96.7678);

-- Insert sample weather conditions
INSERT INTO weather_conditions (location_id, temperature, condition, description, precipitation, wind_speed) VALUES
(1, 72, 'Clear', 'Clear skies in Minneapolis', 10, 8),
(2, 70, 'Partly Cloudy', 'Partly cloudy in St. Paul', 15, 6),
(3, 65, 'Cloudy', 'Overcast in Duluth', 30, 12),
(4, 75, 'Clear', 'Sunny in Rochester', 5, 5),
(5, 73, 'Clear', 'Clear skies in Bloomington', 8, 7),
(6, 71, 'Partly Cloudy', 'Partly cloudy in Plymouth', 12, 9),
(7, 74, 'Clear', 'Sunny in Minnetonka', 7, 6),
(8, 72, 'Partly Cloudy', 'Partly cloudy in Eagan', 14, 8),
(9, 69, 'Cloudy', 'Overcast in Woodbury', 25, 10),
(10, 76, 'Clear', 'Clear skies in Maple Grove', 6, 5),
(11, 73, 'Clear', 'Sunny in Eden Prairie', 9, 7),
(12, 68, 'Partly Cloudy', 'Partly cloudy in Coon Rapids', 18, 11),
(13, 71, 'Clear', 'Clear skies in Burnsville', 11, 8),
(14, 67, 'Cloudy', 'Overcast in Blaine', 22, 9),
(15, 74, 'Clear', 'Sunny in Lakeville', 8, 6),
(16, 66, 'Partly Cloudy', 'Partly cloudy in Brainerd', 20, 12),
(17, 70, 'Clear', 'Clear skies in St. Cloud', 13, 7),
(18, 75, 'Clear', 'Sunny in Mankato', 7, 5),
(19, 68, 'Partly Cloudy', 'Partly cloudy in Winona', 16, 9),
(20, 64, 'Cloudy', 'Overcast in Moorhead', 28, 14);

-- Create indexes for performance
CREATE INDEX idx_locations_lat_lng ON locations(lat, lng);
CREATE INDEX idx_weather_conditions_location_id ON weather_conditions(location_id);

-- Verify the rebuild
SELECT 
    l.name,
    l.lat,
    l.lng,
    w.temperature,
    w.condition
FROM locations l
LEFT JOIN weather_conditions w ON l.id = w.location_id
ORDER BY l.name
LIMIT 5;