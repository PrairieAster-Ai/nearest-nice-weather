/**
 * ========================================================================
 * CREATE WEATHER CONDITIONS TABLE API - Database Schema Setup
 * ========================================================================
 * 
 * @CLAUDE_CONTEXT: Preview database missing weather_conditions table
 * @BUSINESS_PURPOSE: Enable weather-locations API to work in preview environment
 * @TECHNICAL_APPROACH: Create weather_conditions table with sample data
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
    // Create weather_conditions table
    await sql`
      CREATE TABLE IF NOT EXISTS weather_conditions (
        id SERIAL PRIMARY KEY,
        location_id INTEGER REFERENCES locations(id),
        temperature INTEGER DEFAULT 70,
        condition VARCHAR(50) DEFAULT 'Partly Cloudy',
        description TEXT,
        precipitation INTEGER DEFAULT 10,
        wind_speed INTEGER DEFAULT 8,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create index for better JOIN performance
    await sql`CREATE INDEX IF NOT EXISTS idx_weather_conditions_location_id ON weather_conditions (location_id)`

    // Populate with sample weather data for all locations
    await sql`
      INSERT INTO weather_conditions (location_id, temperature, condition, description, precipitation, wind_speed)
      SELECT 
        id,
        70 + (random() * 15)::integer,
        CASE 
          WHEN random() < 0.3 THEN 'Clear'
          WHEN random() < 0.6 THEN 'Partly Cloudy'
          WHEN random() < 0.8 THEN 'Cloudy'
          ELSE 'Light Rain'
        END,
        'Weather conditions for ' || name,
        5 + (random() * 20)::integer,
        5 + (random() * 15)::integer
      FROM locations
      WHERE id NOT IN (SELECT location_id FROM weather_conditions WHERE location_id IS NOT NULL)
    `

    // Check results
    const weatherCount = await sql`SELECT COUNT(*) as count FROM weather_conditions`
    const locationCount = await sql`SELECT COUNT(*) as count FROM locations`

    return res.status(200).json({
      success: true,
      message: 'weather_conditions table created and populated successfully',
      timestamp: new Date().toISOString(),
      results: {
        weather_conditions_count: weatherCount[0].count,
        locations_count: locationCount[0].count,
        table: 'weather_conditions',
        indexes: ['idx_weather_conditions_location_id']
      },
      environment: {
        vercel_env: process.env.VERCEL_ENV || 'development',
        has_database_url: !!process.env.DATABASE_URL
      }
    })

  } catch (error) {
    console.error('Weather Conditions Table Creation Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Table creation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}