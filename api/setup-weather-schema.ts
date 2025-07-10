import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

// Database schema setup for weather ETL integration
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const weatherSchemaSQL = `
-- Extend weather schema for ETL integration
CREATE TABLE IF NOT EXISTS weather.current_data (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES weather.locations(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2), -- Fahrenheit
    condition VARCHAR(100), -- 'Sunny', 'Partly Cloudy', 'Clear', 'Overcast', etc.
    description TEXT,
    precipitation INTEGER CHECK (precipitation >= 0 AND precipitation <= 100), -- 0-100 scale
    wind_speed INTEGER CHECK (wind_speed >= 0), -- mph
    humidity INTEGER CHECK (humidity >= 0 AND humidity <= 100), -- percentage
    pressure DECIMAL(6,2), -- millibars
    visibility DECIMAL(4,1), -- miles
    uv_index INTEGER CHECK (uv_index >= 0 AND uv_index <= 11),
    weather_source VARCHAR(50), -- 'OpenWeather', 'WeatherAPI', 'NOAA', etc.
    source_data JSONB, -- Raw API response for debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id) -- Only one current record per location
);

-- Weather forecast data (for future ETL)
CREATE TABLE IF NOT EXISTS weather.forecast_data (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES weather.locations(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    forecast_hour INTEGER CHECK (forecast_hour >= 0 AND forecast_hour <= 23),
    temperature_high DECIMAL(5,2),
    temperature_low DECIMAL(5,2),
    condition VARCHAR(100),
    description TEXT,
    precipitation_chance INTEGER CHECK (precipitation_chance >= 0 AND precipitation_chance <= 100),
    precipitation_amount DECIMAL(5,2), -- inches
    wind_speed INTEGER,
    wind_direction INTEGER CHECK (wind_direction >= 0 AND wind_direction <= 360), -- degrees
    weather_source VARCHAR(50),
    source_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, forecast_date, forecast_hour)
);

-- ETL job tracking
CREATE TABLE IF NOT EXISTS weather.etl_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- 'current', 'forecast', 'historical'
    weather_source VARCHAR(50) NOT NULL,
    locations_processed INTEGER DEFAULT 0,
    locations_successful INTEGER DEFAULT 0,
    locations_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
    error_message TEXT,
    source_metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_current_data_location_id ON weather.current_data(location_id);
CREATE INDEX IF NOT EXISTS idx_current_data_updated_at ON weather.current_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_forecast_location_date ON weather.forecast_data(location_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_etl_jobs_status ON weather.etl_jobs(status, started_at);

-- Insert comprehensive Minnesota test locations for development
INSERT INTO weather.locations (name, state, country, coordinates, timezone) VALUES
    ('International Falls', 'MN', 'US', ST_SetSRID(ST_MakePoint(-93.4067, 48.6009), 4326), 'America/Chicago'),
    ('Hibbing', 'MN', 'US', ST_SetSRID(ST_MakePoint(-92.9377, 47.4271), 4326), 'America/Chicago'),
    ('Thief River Falls', 'MN', 'US', ST_SetSRID(ST_MakePoint(-96.1814, 48.1133), 4326), 'America/Chicago'),
    ('Bemidji', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.8803, 47.4737), 4326), 'America/Chicago'),
    ('Grand Portage', 'MN', 'US', ST_SetSRID(ST_MakePoint(-90.3457, 47.9622), 4326), 'America/Chicago'),
    ('Mankato', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.0, 44.1636), 4326), 'America/Chicago'),
    ('Rochester', 'MN', 'US', ST_SetSRID(ST_MakePoint(-92.4802, 44.0121), 4326), 'America/Chicago'),
    ('Winona', 'MN', 'US', ST_SetSRID(ST_MakePoint(-91.6432, 44.0498), 4326), 'America/Chicago'),
    ('Austin', 'MN', 'US', ST_SetSRID(ST_MakePoint(-92.9755, 43.6661), 4326), 'America/Chicago'),
    ('Fairmont', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.4608, 43.6522), 4326), 'America/Chicago'),
    ('Two Harbors', 'MN', 'US', ST_SetSRID(ST_MakePoint(-91.6718, 47.0188), 4326), 'America/Chicago'),
    ('Silver Bay', 'MN', 'US', ST_SetSRID(ST_MakePoint(-91.2665, 47.2955), 4326), 'America/Chicago'),
    ('Grand Marais', 'MN', 'US', ST_SetSRID(ST_MakePoint(-90.3343, 47.7503), 4326), 'America/Chicago'),
    ('Lutsen', 'MN', 'US', ST_SetSRID(ST_MakePoint(-90.7179, 47.6436), 4326), 'America/Chicago'),
    ('Cook', 'MN', 'US', ST_SetSRID(ST_MakePoint(-92.6888, 47.8519), 4326), 'America/Chicago'),
    ('Morris', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.9147, 45.5866), 4326), 'America/Chicago'),
    ('Ortonville', 'MN', 'US', ST_SetSRID(ST_MakePoint(-96.4420, 45.3080), 4326), 'America/Chicago'),
    ('Worthington', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.5959, 43.6208), 4326), 'America/Chicago'),
    ('Marshall', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.7880, 44.4469), 4326), 'America/Chicago'),
    ('Pipestone', 'MN', 'US', ST_SetSRID(ST_MakePoint(-96.3178, 44.0011), 4326), 'America/Chicago'),
    ('Park Rapids', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.0589, 46.9219), 4326), 'America/Chicago'),
    ('Detroit Lakes', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.8453, 46.8172), 4326), 'America/Chicago'),
    ('Fergus Falls', 'MN', 'US', ST_SetSRID(ST_MakePoint(-96.0776, 46.2830), 4326), 'America/Chicago'),
    ('Wadena', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.1364, 46.4422), 4326), 'America/Chicago'),
    ('Walker', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.5836, 47.0981), 4326), 'America/Chicago'),
    ('Sauk Centre', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.9531, 45.7369), 4326), 'America/Chicago'),
    ('Little Falls', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.3625, 45.9761), 4326), 'America/Chicago'),
    ('St. Cloud', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.1632, 45.5579), 4326), 'America/Chicago'),
    ('Willmar', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.0433, 45.1219), 4326), 'America/Chicago'),
    ('Hutchinson', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.3736, 44.8883), 4326), 'America/Chicago'),
    ('Cloquet', 'MN', 'US', ST_SetSRID(ST_MakePoint(-92.4596, 46.7213), 4326), 'America/Chicago'),
    ('Virginia', 'MN', 'US', ST_SetSRID(ST_MakePoint(-92.5363, 47.5235), 4326), 'America/Chicago'),
    ('Crookston', 'MN', 'US', ST_SetSRID(ST_MakePoint(-96.6081, 47.7742), 4326), 'America/Chicago'),
    ('Moorhead', 'MN', 'US', ST_SetSRID(ST_MakePoint(-96.7678, 46.8738), 4326), 'America/Chicago'),
    ('Redwood Falls', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.1172, 44.5394), 4326), 'America/Chicago'),
    ('Alexandria', 'MN', 'US', ST_SetSRID(ST_MakePoint(-95.3775, 45.8852), 4326), 'America/Chicago')
ON CONFLICT DO NOTHING;
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security: Only allow setup in development or with specific header
  const allowSetup = process.env.NODE_ENV === 'development' || 
                    req.headers['x-setup-key'] === process.env.SETUP_KEY;
  
  if (!allowSetup) {
    return res.status(403).json({ 
      success: false, 
      error: 'Weather schema setup not allowed in this environment' 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Execute weather schema setup
      await client.query(weatherSchemaSQL);
      
      // Verify tables were created and get location count
      const tablesResult = await client.query(`
        SELECT table_name, table_schema 
        FROM information_schema.tables 
        WHERE table_schema = 'weather' 
        AND table_name IN ('locations', 'current_data', 'forecast_data', 'etl_jobs')
        ORDER BY table_name
      `);

      const locationCount = await client.query(`
        SELECT COUNT(*) as count FROM weather.locations WHERE state = 'MN'
      `);

      res.status(200).json({
        success: true,
        message: 'Weather schema created successfully',
        tables_created: tablesResult.rows,
        minnesota_locations: parseInt(locationCount.rows[0].count),
        timestamp: new Date().toISOString(),
        ready_for_etl: true
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Weather schema setup error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to setup weather schema',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}