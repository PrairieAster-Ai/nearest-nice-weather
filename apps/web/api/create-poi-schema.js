/**
 * ========================================================================
 * POI SCHEMA CREATION API - Database Schema Management
 * ========================================================================
 * 
 * @CLAUDE_CONTEXT: Three-database architecture schema management
 * @BUSINESS_PURPOSE: Initialize POI database schema for new environments
 * @TECHNICAL_APPROACH: Creates poi_locations table with geographic indexes
 * 
 * Creates the POI locations table structure needed for the ETL pipeline
 * Used during preview database setup and environment initialization
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    })
  }

  try {
    // Create poi_locations table
    await sql`
      CREATE TABLE IF NOT EXISTS poi_locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        osm_id BIGINT,
        osm_type VARCHAR(10),
        park_type VARCHAR(100),
        search_name JSONB,
        place_rank INTEGER DEFAULT 30,
        data_source VARCHAR(50),
        description TEXT,
        importance_rank INTEGER DEFAULT 10,
        external_id VARCHAR(100),
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT poi_minnesota_bounds CHECK (
          lat BETWEEN 43.499356 AND 49.384472 AND
          lng BETWEEN -97.239209 AND -89.491739
        )
      )
    `

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_poi_locations_lat_lng ON poi_locations (lat, lng)`
    await sql`CREATE INDEX IF NOT EXISTS idx_poi_locations_park_type ON poi_locations (park_type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_poi_locations_importance ON poi_locations (importance_rank)`
    await sql`CREATE INDEX IF NOT EXISTS idx_poi_locations_data_source ON poi_locations (data_source)`

    // Check if table was created successfully
    const tableCheck = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'poi_locations' 
      ORDER BY ordinal_position
    `

    return res.status(200).json({
      success: true,
      message: 'POI schema created successfully',
      timestamp: new Date().toISOString(),
      schema: {
        table: 'poi_locations',
        columns: tableCheck.length,
        indexes: [
          'idx_poi_locations_lat_lng',
          'idx_poi_locations_park_type', 
          'idx_poi_locations_importance',
          'idx_poi_locations_data_source'
        ]
      },
      environment: {
        vercel_env: process.env.VERCEL_ENV || 'development',
        has_database_url: !!process.env.DATABASE_URL
      }
    })

  } catch (error) {
    console.error('POI Schema Creation Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Schema creation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}