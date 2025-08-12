-- ========================================================================
-- PRODUCTION DATABASE SCHEMA RECREATION
-- ========================================================================
-- Recreate database schema to match localhost structure
-- ========================================================================

-- Create POI locations table with complete localhost schema
CREATE TABLE poi_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    park_type VARCHAR(100),
    park_level VARCHAR(50),
    ownership VARCHAR(100),
    operator VARCHAR(100),
    data_source VARCHAR(50),
    description TEXT,
    importance_rank INTEGER DEFAULT 10,
    phone VARCHAR(20),
    website VARCHAR(255),
    amenities JSONB DEFAULT '[]'::jsonb,
    activities JSONB DEFAULT '[]'::jsonb,
    place_rank INTEGER DEFAULT 10,
    distance_miles DECIMAL(6, 2)
);

-- Create indexes for performance
CREATE INDEX idx_poi_locations_lat_lng ON poi_locations(lat, lng);
CREATE INDEX idx_poi_locations_park_type ON poi_locations(park_type);
CREATE INDEX idx_poi_locations_importance_rank ON poi_locations(importance_rank);
CREATE INDEX idx_poi_locations_data_source ON poi_locations(data_source);

-- Create legacy tables for API compatibility (minimal structure)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    state VARCHAR(2) DEFAULT 'MN',
    data_source VARCHAR(50) DEFAULT 'legacy'
);

CREATE TABLE weather_conditions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id),
    temperature DECIMAL(5, 2),
    condition VARCHAR(100),
    precipitation DECIMAL(5, 2) DEFAULT 0,
    wind_speed DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feedback table
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    feedback TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    user_location JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tourism operators table (for future use)
CREATE TABLE tourism_operators (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    services JSONB DEFAULT '[]'::jsonb,
    location_lat DECIMAL(10, 7),
    location_lng DECIMAL(10, 7),
    service_area_radius INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verify schema creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;