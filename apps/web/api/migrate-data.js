/**
 * ========================================================================
 * DATA MIGRATION API - Database Population and Synchronization
 * ========================================================================
 * 
 * @CLAUDE_CONTEXT: Preview database synchronization with localhost data
 * @BUSINESS_PURPOSE: Ensure preview environment matches localhost for testing
 * @TECHNICAL_APPROACH: Clear and repopulate preview database with localhost data
 * 
 * Handles migration of POI locations and weather-locations from localhost to preview
 * Ensures both environments have identical data for proper testing validation
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
    const { action, table, data } = req.body

    if (!action || !table) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'action and table are required'
      })
    }

    let result = {}

    if (action === 'clear') {
      // Clear the specified table
      if (table === 'poi_locations') {
        await sql`DELETE FROM poi_locations`
        result = { table: 'poi_locations', action: 'cleared' }
      } else if (table === 'locations') {
        await sql`DELETE FROM locations`
        result = { table: 'locations', action: 'cleared' }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid table',
          message: 'Supported tables: poi_locations, locations'
        })
      }

    } else if (action === 'populate') {
      // Populate the specified table with data
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid data',
          message: 'data must be an array of records'
        })
      }

      if (table === 'poi_locations') {
        // Insert POI locations
        let insertedCount = 0
        for (const item of data) {
          await sql`
            INSERT INTO poi_locations (
              name, lat, lng, park_type, data_source, description, importance_rank,
              osm_id, osm_type, search_name, place_rank, external_id
            ) VALUES (
              ${item.name}, 
              ${parseFloat(item.lat)}, 
              ${parseFloat(item.lng)}, 
              ${item.park_type || null},
              ${item.data_source || null},
              ${item.description || null},
              ${item.importance_rank || 10},
              ${item.osm_id || null},
              ${item.osm_type || null},
              ${item.search_name ? JSON.stringify(item.search_name) : null},
              ${item.place_rank || 30},
              ${item.external_id || null}
            )
          `
          insertedCount++
        }
        result = { table: 'poi_locations', action: 'populated', count: insertedCount }

      } else if (table === 'locations') {
        // Insert weather locations
        let insertedCount = 0
        for (const item of data) {
          await sql`
            INSERT INTO locations (
              name, lat, lng, temperature, condition, description, 
              precipitation, "windSpeed"
            ) VALUES (
              ${item.name},
              ${parseFloat(item.lat)}, 
              ${parseFloat(item.lng)},
              ${item.temperature || 70},
              ${item.condition || 'Partly Cloudy'},
              ${item.description || `Weather conditions for ${item.name}`},
              ${item.precipitation || 10},
              ${item.windSpeed || 8}
            )
          `
          insertedCount++
        }
        result = { table: 'locations', action: 'populated', count: insertedCount }

      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid table',
          message: 'Supported tables: poi_locations, locations'
        })
      }

    } else if (action === 'create_weather_conditions') {
      // Create weather_conditions table and populate with data
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

      result = { 
        table: 'weather_conditions', 
        action: 'created_and_populated',
        weather_conditions_count: weatherCount[0].count,
        locations_count: locationCount[0].count
      }

    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Supported actions: clear, populate, create_weather_conditions'
      })
    }

    return res.status(200).json({
      success: true,
      message: `${action} completed successfully`,
      result: result,
      timestamp: new Date().toISOString(),
      environment: {
        vercel_env: process.env.VERCEL_ENV || 'development',
        has_database_url: !!process.env.DATABASE_URL
      }
    })

  } catch (error) {
    console.error('Migration Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}