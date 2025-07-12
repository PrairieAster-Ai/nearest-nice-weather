-- Contextual Weather Data Schema for Subjective "Nearest Nice Weather"
-- Optimized for gathering user context and environmental adaptation

-- Enhanced weather locations with geographical context
CREATE TABLE weather_locations_contextual (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    coordinates GEOMETRY(POINT, 4326),
    
    -- Geographic Context for "Near" interpretation
    region_type TEXT, -- 'metro', 'rural', 'wilderness', 'lakeside', 'forest'
    accessibility TEXT, -- 'urban', 'suburban', 'remote', 'drive_required'
    terrain_type TEXT, -- 'flat', 'hilly', 'mountain', 'lake', 'river'
    elevation_ft INTEGER,
    
    -- Tourism/Activity Context
    primary_activities TEXT[], -- ['fishing', 'hiking', 'camping', 'photography']
    seasonal_popularity JSONB, -- {"spring": 0.3, "summer": 0.9, "fall": 0.7, "winter": 0.1}
    infrastructure_level TEXT, -- 'full_services', 'basic_amenities', 'primitive', 'wilderness'
    
    -- Cultural/Local Context  
    local_weather_norms JSONB, -- Expected weather ranges for this location
    tourism_type TEXT, -- 'family', 'adventure', 'scenic', 'cultural', 'outdoor_recreation'
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Current weather with relative context
CREATE TABLE weather_conditions_contextual (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES weather_locations_contextual(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Raw weather data
    temperature_f INTEGER,
    feels_like_f INTEGER,
    condition TEXT,
    precipitation_chance INTEGER, -- 0-100
    precipitation_type TEXT, -- 'none', 'light_rain', 'heavy_rain', 'snow', 'mixed'
    wind_speed_mph INTEGER,
    wind_direction TEXT,
    humidity INTEGER,
    visibility_miles INTEGER,
    uv_index INTEGER,
    
    -- Contextual weather assessment
    comfort_index DECIMAL(3,2), -- 0.0-1.0 based on human comfort for outdoor activities
    activity_suitability JSONB, -- {"hiking": 0.8, "fishing": 0.6, "photography": 0.9}
    relative_niceness DECIMAL(3,2), -- Compared to regional/seasonal norms
    
    -- Dynamic context
    is_improving BOOLEAN, -- Weather trend
    is_stable BOOLEAN, -- Consistent conditions expected
    hours_until_change INTEGER, -- Forecast stability
    
    -- User behavior context (learned over time)
    user_selection_frequency DECIMAL(3,2), -- How often users choose this combination
    time_of_day_popularity JSONB, -- When this weather is most selected
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- User interaction context for machine learning "nice"
CREATE TABLE user_weather_preferences (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    user_agent TEXT,
    
    -- Geographic context when interaction occurred
    user_location GEOMETRY(POINT, 4326),
    search_radius_miles INTEGER,
    
    -- Weather conditions they selected
    selected_location_id INTEGER REFERENCES weather_locations_contextual(id),
    selected_weather_conditions JSONB,
    
    -- Context of the selection
    time_of_day TIME,
    day_of_week INTEGER,
    season TEXT,
    
    -- What they filtered/searched for
    filter_preferences JSONB, -- What filters they used
    rejection_patterns JSONB, -- What they filtered OUT
    
    -- Behavioral indicators
    time_spent_deciding INTEGER, -- Seconds on page before selection
    alternatives_considered INTEGER, -- How many locations they viewed
    activity_intent TEXT, -- Inferred or stated activity
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sample data showing contextual approach
INSERT INTO weather_locations_contextual (
    name, coordinates, region_type, accessibility, terrain_type, elevation_ft,
    primary_activities, seasonal_popularity, infrastructure_level, tourism_type
) VALUES 
(
    'Boundary Waters - Ely Entry',
    ST_SetSRID(ST_MakePoint(-91.8668, 47.903), 4326),
    'wilderness',
    'remote',
    'lake',
    1330,
    ARRAY['canoeing', 'fishing', 'wilderness_camping', 'photography'],
    '{"spring": 0.4, "summer": 0.95, "fall": 0.8, "winter": 0.1}',
    'primitive',
    'adventure'
),
(
    'Lake Minnetonka - Wayzata',
    ST_SetSRID(ST_MakePoint(-93.507, 44.9733), 4326),
    'metro',
    'urban',
    'lake',
    920,
    ARRAY['boating', 'swimming', 'dining', 'shopping'],
    '{"spring": 0.6, "summer": 0.9, "fall": 0.5, "winter": 0.2}',
    'full_services',
    'family'
),
(
    'North Shore - Grand Marais',
    ST_SetSRID(ST_MakePoint(-90.3362, 47.7511), 4326),
    'rural',
    'drive_required',
    'mountain',
    602,
    ARRAY['hiking', 'lighthouse_viewing', 'fall_colors', 'storm_watching'],
    '{"spring": 0.3, "summer": 0.8, "fall": 0.95, "winter": 0.4}',
    'basic_amenities',
    'scenic'
);

-- Contextual weather that shows relative "niceness"
INSERT INTO weather_conditions_contextual (
    location_id, temperature_f, feels_like_f, condition, precipitation_chance,
    wind_speed_mph, comfort_index, activity_suitability, relative_niceness,
    is_improving, is_stable, hours_until_change
) VALUES 
(
    1, -- Boundary Waters
    68, 65, 'Partly Cloudy', 20, 8,
    0.85, -- High comfort for wilderness activities
    '{"canoeing": 0.9, "fishing": 0.8, "photography": 0.7}',
    0.9, -- Excellent for this location/season
    true, false, 6
),
(
    2, -- Lake Minnetonka  
    78, 82, 'Sunny', 5, 12,
    0.75, -- Good for lake activities despite some wind
    '{"boating": 0.6, "swimming": 0.8, "dining": 0.9}',
    0.8, -- Very good for metro lake area
    false, true, 12
),
(
    3, -- North Shore
    55, 52, 'Overcast', 60, 25,
    0.4, -- Challenging conditions but...
    '{"hiking": 0.3, "storm_watching": 0.95, "photography": 0.8}',
    0.7, -- Actually good for dramatic North Shore experience
    true, false, 3
);