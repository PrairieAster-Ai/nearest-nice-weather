import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

// Database setup endpoint for Neon integration
// Run this once after Neon is connected to create tables

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const createTablesSQL = `
-- Enable PostGIS extension for geographic data types and functions
CREATE EXTENSION IF NOT EXISTS postgis;

-- User feedback collection (immediate need)
CREATE TABLE IF NOT EXISTS user_feedback (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    categories JSONB,
    user_agent TEXT,
    ip_address VARCHAR(45),
    session_id VARCHAR(100),
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create database schema for weather intelligence platform (future expansion)
CREATE SCHEMA IF NOT EXISTS weather;
CREATE SCHEMA IF NOT EXISTS tourism;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Weather data tables (Phase 2)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON weather.locations USING GIST (coordinates);

-- Insert sample Minnesota locations for development
INSERT INTO weather.locations (name, state, country, coordinates, timezone) VALUES
    ('Minneapolis', 'MN', 'US', ST_SetSRID(ST_MakePoint(-93.2650, 44.9778), 4326), 'America/Chicago'),
    ('Duluth', 'MN', 'US', ST_SetSRID(ST_MakePoint(-92.1005, 46.7867), 4326), 'America/Chicago'),
    ('Brainerd', 'MN', 'US', ST_SetSRID(ST_MakePoint(-94.2008, 46.3580), 4326), 'America/Chicago'),
    ('Grand Rapids', 'MN', 'US', ST_SetSRID(ST_MakePoint(-93.5308, 47.2369), 4326), 'America/Chicago'),
    ('Ely', 'MN', 'US', ST_SetSRID(ST_MakePoint(-91.8668, 47.9030), 4326), 'America/Chicago')
ON CONFLICT DO NOTHING;
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security: Only allow setup in development or with specific header
  const allowSetup = process.env.NODE_ENV === 'development' || 
                    req.headers['x-setup-key'] === process.env.SETUP_KEY;
  
  if (!allowSetup) {
    return res.status(403).json({ 
      success: false, 
      error: 'Database setup not allowed in this environment' 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Execute database setup
      await client.query(createTablesSQL);
      
      // Verify tables were created
      const result = await client.query(`
        SELECT table_name, table_schema 
        FROM information_schema.tables 
        WHERE table_name IN ('user_feedback', 'locations')
        ORDER BY table_schema, table_name
      `);

      res.status(200).json({
        success: true,
        message: 'Database schema created successfully',
        tables_created: result.rows,
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Database setup error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to setup database schema',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}