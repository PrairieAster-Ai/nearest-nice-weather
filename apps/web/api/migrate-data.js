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

    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Supported actions: clear, populate'
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