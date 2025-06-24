-- Nearest Nice Weather Database Schema
-- PostgreSQL with PostGIS extension for geographic calculations
-- Complete schema for weather intelligence platform

-- Enable PostGIS extension for geographic data types and functions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create database schema for weather intelligence platform
CREATE SCHEMA IF NOT EXISTS weather;
CREATE SCHEMA IF NOT EXISTS tourism;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Weather data tables
CREATE TABLE IF NOT EXISTS weather.locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    elevation INTEGER,
    timezone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON weather.locations USING GIST (coordinates);

-- Weather forecast data
CREATE TABLE IF NOT EXISTS weather.forecasts (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES weather.locations(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    temperature_high INTEGER,
    temperature_low INTEGER,
    humidity INTEGER,
    wind_speed INTEGER,
    wind_direction INTEGER,
    precipitation_probability INTEGER,
    precipitation_amount DECIMAL(5,2),
    weather_condition VARCHAR(100),
    visibility INTEGER,
    uv_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, forecast_date)
);

-- Tourism operator tables
CREATE TABLE IF NOT EXISTS tourism.operators (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    coordinates GEOMETRY(POINT, 4326),
    business_type VARCHAR(100), -- 'ice_fishing', 'bwca_outfitter', 'resort', etc.
    subscription_tier VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity preferences and weather thresholds
CREATE TABLE IF NOT EXISTS tourism.activity_preferences (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER REFERENCES tourism.operators(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    ideal_temp_min INTEGER,
    ideal_temp_max INTEGER,
    max_wind_speed INTEGER,
    max_precipitation INTEGER,
    min_visibility INTEGER,
    weather_conditions TEXT[], -- Array of acceptable conditions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and usage tracking
CREATE TABLE IF NOT EXISTS analytics.weather_requests (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER REFERENCES tourism.operators(id),
    location_id INTEGER REFERENCES weather.locations(id),
    request_type VARCHAR(100),
    request_data JSONB,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forecasts_location_date ON weather.forecasts(location_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_operators_coordinates ON tourism.operators USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_analytics_operator_time ON analytics.weather_requests(operator_id, created_at);

-- Insert sample Minnesota locations for development
INSERT INTO weather.locations (name, state, country, coordinates, timezone) VALUES
    ('Minneapolis', 'MN', 'US', ST_SetSRID(ST_MakePoint(-93.2650, 44.9778), 4326), 'America/Chicago'),
    ('Duluth', 'MN', 'US', ST_SetSRID(ST_MakePoint(-92.1005, 46.7867), 4326), 'America/Chicago'),
    ('Brainerd', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.2008, 46.3580), 4326), 'America/Chicago'),
    ('Grand Rapids', 'MN', 'US', ST_SetSRID(ST_MakePoint(-93.5308, 47.2369), 4326), 'America/Chicago'),
    ('Ely', 'MN', 'US', ST_SetSRID(ST_MakePoint(-91.8668, 47.9030), 4326), 'America/Chicago')
ON CONFLICT DO NOTHING;

-- Insert sample tourism operator for development
INSERT INTO tourism.operators (business_name, contact_email, phone, address, coordinates, business_type) VALUES
    ('North Woods Ice Fishing', 'info@northwoodsice.com', '218-555-0123', 'Brainerd, MN', ST_SetSRID(ST_MakePoint(-94.2008, 46.3580), 4326), 'ice_fishing'),
    ('BWCA Adventures', 'guide@bwcaadventures.com', '218-555-0456', 'Ely, MN', ST_SetSRID(ST_MakePoint(-91.8668, 47.9030), 4326), 'bwca_outfitter')
ON CONFLICT DO NOTHING;

-- Create function to calculate distance between points
CREATE OR REPLACE FUNCTION calculate_distance_miles(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN ST_Distance(
        ST_Transform(ST_SetSRID(ST_MakePoint(lon1, lat1), 4326), 3857),
        ST_Transform(ST_SetSRID(ST_MakePoint(lon2, lat2), 4326), 3857)
    ) * 0.000621371; -- Convert meters to miles
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for application user
-- Note: In production, create specific users with limited permissions
GRANT USAGE ON SCHEMA weather TO postgres;
GRANT USAGE ON SCHEMA tourism TO postgres;
GRANT USAGE ON SCHEMA analytics TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA weather TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tourism TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA weather TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA tourism TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO postgres;