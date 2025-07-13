-- ========================================================================
-- WEATHER INTELLIGENCE DATABASE REBUILD
-- ========================================================================
-- Clean rebuild with known good structure for Minnesota weather data

-- Drop all existing tables
DROP TABLE IF EXISTS weather_conditions CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS tourism_operators CASCADE;

-- Create locations table (Minnesota weather stations/cities)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    state VARCHAR(2) DEFAULT 'MN',
    city VARCHAR(255),
    county VARCHAR(255),
    elevation INTEGER,
    population INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create weather_conditions table
CREATE TABLE weather_conditions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    temperature INTEGER NOT NULL, -- Fahrenheit
    condition VARCHAR(100) NOT NULL, -- Clear, Cloudy, Rain, Snow, etc.
    description TEXT,
    precipitation INTEGER DEFAULT 0, -- Percentage chance
    wind_speed INTEGER DEFAULT 0, -- MPH
    humidity INTEGER DEFAULT 50, -- Percentage
    pressure DECIMAL(6, 2), -- inHg
    visibility INTEGER DEFAULT 10, -- Miles
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tourism_operators table (for B2B features)
CREATE TABLE tourism_operators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- Outfitter, Resort, Guide Service, etc.
    location_id INTEGER REFERENCES locations(id),
    contact_email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    specialties TEXT[], -- Activities they offer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample Minnesota locations (key cities and outdoor recreation areas)
INSERT INTO locations (name, lat, lng, city, county, elevation, population) VALUES
-- Major Cities
('Minneapolis', 44.9778, -93.2650, 'Minneapolis', 'Hennepin', 830, 429954),
('St. Paul', 44.9537, -93.0900, 'Saint Paul', 'Ramsey', 702, 308096),
('Rochester', 44.0121, -92.4802, 'Rochester', 'Olmsted', 1297, 121395),
('Duluth', 46.7867, -92.1005, 'Duluth', 'St. Louis', 1428, 86697),
('Bloomington', 44.8408, -93.2982, 'Bloomington', 'Hennepin', 815, 89987),

-- BWCA and Arrowhead Region
('Ely', 47.9032, -91.8668, 'Ely', 'St. Louis', 1481, 3460),
('Grand Marais', 47.7505, -90.3343, 'Grand Marais', 'Cook', 602, 1351),
('Grand Portage', 47.9611, -89.6818, 'Grand Portage', 'Cook', 635, 557),
('Tofte', 47.5921, -90.8682, 'Tofte', 'Cook', 1200, 203),
('Lutsen', 47.6391, -90.7140, 'Lutsen', 'Cook', 1640, 247),

-- Central Lakes Region
('Brainerd', 46.3580, -94.2008, 'Brainerd', 'Crow Wing', 1226, 13590),
('Walker', 47.1011, -94.5836, 'Walker', 'Cass', 1360, 941),
('Grand Rapids', 47.2378, -93.5308, 'Grand Rapids', 'Itasca', 1276, 10869),
('Bemidji', 47.4734, -94.8803, 'Bemidji', 'Beltrami', 1355, 15946),
('Park Rapids', 46.9211, -95.0581, 'Park Rapids', 'Hubbard', 1431, 4054),

-- Southern Minnesota
('Mankato', 44.1636, -94.0019, 'Mankato', 'Blue Earth', 785, 44488),
('Winona', 44.0498, -91.6332, 'Winona', 'Winona', 659, 25948),
('Red Wing', 44.5625, -92.5338, 'Red Wing', 'Goodhue', 720, 16459),
('Austin', 43.6669, -92.9746, 'Austin', 'Mower', 1201, 25180),
('Albert Lea', 43.6481, -93.3677, 'Albert Lea', 'Freeborn', 1230, 17781),

-- Western Minnesota
('Willmar', 45.1219, -95.0434, 'Willmar', 'Kandiyohi', 1128, 19600),
('Morris', 45.5866, -95.9134, 'Morris', 'Stevens', 1154, 5094),
('Alexandria', 45.8855, -95.3772, 'Alexandria', 'Douglas', 1421, 13070),
('Fergus Falls', 46.2830, -96.0779, 'Fergus Falls', 'Otter Tail', 1198, 13471),
('Detroit Lakes', 46.8175, -95.8453, 'Detroit Lakes', 'Becker', 1417, 9869),

-- Border Waters Entry Points
('Crane Lake', 48.2558, -92.5418, 'Crane Lake', 'St. Louis', 1142, 134),
('Gunflint Trail', 47.9500, -90.8000, 'Grand Marais', 'Cook', 1500, 50),
('Sawbill Trail', 47.8333, -90.9167, 'Tofte', 'Cook', 1800, 25),
('Kawishiwi Triangle', 47.8167, -91.6000, 'Ely', 'St. Louis', 1600, 30),

-- State Parks and Recreation Areas  
('Itasca State Park', 47.1926, -95.2023, 'Park Rapids', 'Clearwater', 1475, 0),
('Gooseberry Falls', 47.1403, -91.4693, 'Two Harbors', 'Lake', 800, 0),
('Split Rock Lighthouse', 47.2007, -91.3956, 'Two Harbors', 'Lake', 168, 0),
('Temperance River', 47.5647, -90.9089, 'Schroeder', 'Cook', 700, 0),
('Cascade River', 47.7028, -90.6489, 'Lutsen', 'Cook', 900, 0);

-- Insert sample weather conditions for each location
INSERT INTO weather_conditions (location_id, temperature, condition, description, precipitation, wind_speed, humidity, pressure, visibility)
SELECT 
    l.id,
    -- Generate realistic Minnesota weather based on season
    CASE 
        WHEN EXTRACT(month FROM CURRENT_DATE) IN (12, 1, 2) THEN 15 + (RANDOM() * 40)::INTEGER -- Winter: 15-55°F
        WHEN EXTRACT(month FROM CURRENT_DATE) IN (3, 4, 5) THEN 35 + (RANDOM() * 35)::INTEGER -- Spring: 35-70°F  
        WHEN EXTRACT(month FROM CURRENT_DATE) IN (6, 7, 8) THEN 55 + (RANDOM() * 35)::INTEGER -- Summer: 55-90°F
        ELSE 30 + (RANDOM() * 40)::INTEGER -- Fall: 30-70°F
    END as temperature,
    -- Weather conditions
    CASE (RANDOM() * 5)::INTEGER
        WHEN 0 THEN 'Clear'
        WHEN 1 THEN 'Partly Cloudy'
        WHEN 2 THEN 'Cloudy'
        WHEN 3 THEN 'Light Rain'
        WHEN 4 THEN 'Overcast'
        ELSE 'Fair'
    END as condition,
    l.name || ' area weather conditions' as description,
    (RANDOM() * 100)::INTEGER as precipitation,
    (RANDOM() * 25)::INTEGER as wind_speed,
    30 + (RANDOM() * 40)::INTEGER as humidity,
    29.80 + (RANDOM() * 1.0) as pressure,
    5 + (RANDOM() * 10)::INTEGER as visibility
FROM locations l;

-- Insert sample tourism operators
INSERT INTO tourism_operators (name, type, location_id, contact_email, specialties) VALUES
('Superior Wilderness Outfitters', 'BWCA Outfitter', (SELECT id FROM locations WHERE name = 'Ely'), 'info@superiorwilderness.com', ARRAY['Canoe Trips', 'Fishing', 'Camping']),
('Gunflint Lodge', 'Resort', (SELECT id FROM locations WHERE name = 'Grand Marais'), 'reservations@gunflint.com', ARRAY['Lodging', 'Guided Tours', 'Winter Sports']),
('Wilderness Canoe Base', 'Guide Service', (SELECT id FROM locations WHERE name = 'Ely'), 'guides@canoebase.com', ARRAY['BWCA Guides', 'Portage Service', 'Equipment Rental']),
('North Shore Adventures', 'Outdoor Recreation', (SELECT id FROM locations WHERE name = 'Duluth'), 'info@northshoreadventures.com', ARRAY['Lake Superior Tours', 'Hiking', 'Photography']),
('Brainerd Lakes Guide Service', 'Fishing Guide', (SELECT id FROM locations WHERE name = 'Brainerd'), 'fishing@brainerdguides.com', ARRAY['Walleye Fishing', 'Bass Tournaments', 'Ice Fishing']);

-- Create indexes for performance
CREATE INDEX idx_locations_lat_lng ON locations(lat, lng);
CREATE INDEX idx_weather_conditions_location_id ON weather_conditions(location_id);
CREATE INDEX idx_tourism_operators_location_id ON tourism_operators(location_id);

-- Verify data
SELECT COUNT(*) as total_locations FROM locations;
SELECT COUNT(*) as total_weather_records FROM weather_conditions;
SELECT COUNT(*) as total_operators FROM tourism_operators;