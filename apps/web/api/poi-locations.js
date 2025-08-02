/**
 * ========================================================================
 * POI LOCATIONS API - Working Implementation (Based on Debug Pattern)
 * ========================================================================
 * 
 * @CLAUDE_CONTEXT: Preview-compatible POI locations API using proven debug pattern
 * @BUSINESS_PURPOSE: Serve Points of Interest data to match localhost functionality
 * @TECHNICAL_APPROACH: Simple query pattern that works in Vercel serverless environment
 * 
 * NOTE: Proximity filtering temporarily disabled to ensure API functionality
 * All POIs returned without distance calculations until Haversine issue resolved
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed'
    })
  }

  try {
    // Extract query parameters (using safe defaults)
    const { lat, lng, limit = 50, radius = 50 } = req.query
    const limitNum = Math.min(parseInt(limit) || 50, 100) // Cap at 100

    // Simple query - return POI locations from the locations table
    // Handle park_type column gracefully (might not exist in all environments)
    let result
    try {
      result = await sql`
        SELECT 
          id, name, lat, lng, park_type, data_source, description, 
          place_rank as importance_rank,
          NULL as distance_miles
        FROM locations
        WHERE data_source = 'manual' OR park_type IS NOT NULL
        ORDER BY place_rank ASC, name ASC
        LIMIT ${limitNum}
      `
    } catch (error) {
      if (error.message.includes('column "park_type" does not exist')) {
        // Fallback query without park_type column
        result = await sql`
          SELECT 
            id, name, lat, lng, data_source, description, 
            place_rank as importance_rank,
            NULL as distance_miles,
            NULL as park_type
          FROM locations
          WHERE data_source = 'manual'
          ORDER BY place_rank ASC, name ASC
          LIMIT ${limitNum}
        `
      } else {
        throw error
      }
    }

    // Transform database results to match localhost API format
    const transformedData = result.map(row => ({
      id: row.id.toString(),
      name: row.name,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      park_type: row.park_type,
      data_source: row.data_source,
      description: row.description,
      importance_rank: row.importance_rank,
      osm_id: row.osm_id,
      osm_type: row.osm_type,
      search_name: row.search_name,
      place_rank: row.place_rank,
      external_id: row.external_id,
      distance_miles: row.distance_miles ? parseFloat(row.distance_miles).toFixed(2) : null
    }))

    return res.status(200).json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      timestamp: new Date().toISOString(),
      debug: {
        query_type: lat && lng ? 'proximity_search_disabled' : 'all_pois',
        user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        radius: lat && lng ? `${radius} miles (proximity filtering disabled)` : 'N/A',
        limit: limitNum.toString(),
        data_source: 'poi_locations_table',
        note: 'Proximity filtering temporarily disabled - showing all results ordered by importance'
      }
    })

  } catch (error) {
    console.error('POI Locations API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Database query failed',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }
}