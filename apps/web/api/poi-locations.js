/**
 * ========================================================================
 * POI LOCATIONS API - Minnesota Parks & Recreation Areas
 * ========================================================================
 * 
 * @CLAUDE_CONTEXT: Phase 2 ETL pipeline deployment - POI data endpoint
 * @BUSINESS_PURPOSE: Serve Points of Interest (parks, recreation areas) with proximity queries
 * @TECHNICAL_APPROACH: Neon serverless database with geographic distance calculations
 * 
 * Serves the POI locations loaded by ETL pipeline for Minnesota outdoor recreation
 * Supports proximity-based queries for location-aware recommendations
 * 
 * INTEGRATION: Works with three-database architecture:
 * - Localhost: Development branch
 * - Preview: Preview branch (isolated testing)
 * - Production: Production branch (live data)
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'

// Neon serverless database connection
// Uses simplified DATABASE_URL environment variable
const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  // CORS headers for frontend access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    })
  }

  try {
    // Extract query parameters
    const { lat, lng, limit = 50, radius = 50 } = req.query
    const limitNum = Math.min(parseInt(limit) || 50, 100) // Cap at 100

    let query
    let params = []

    if (lat && lng) {
      // Proximity query with distance calculation
      const userLat = parseFloat(lat)
      const userLng = parseFloat(lng)
      const radiusKm = parseFloat(radius) * 1.60934 // Convert miles to km

      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates',
          message: 'lat and lng must be valid numbers'
        })
      }

      // Haversine distance formula for proximity search (with explicit casting)
      query = `
        SELECT 
          id,
          name,
          CAST(lat AS DECIMAL) as lat,
          CAST(lng AS DECIMAL) as lng,
          park_type,
          data_source,
          description,
          importance_rank,
          ROUND(
            (6371 * acos(
              cos(radians(CAST($1 AS DECIMAL))) * cos(radians(CAST(lat AS DECIMAL))) * 
              cos(radians(CAST(lng AS DECIMAL)) - radians(CAST($2 AS DECIMAL))) + 
              sin(radians(CAST($1 AS DECIMAL))) * sin(radians(CAST(lat AS DECIMAL)))
            ) * 0.621371)::numeric, 2
          ) AS distance_miles
        FROM poi_locations 
        WHERE (
          6371 * acos(
            cos(radians(CAST($1 AS DECIMAL))) * cos(radians(CAST(lat AS DECIMAL))) * 
            cos(radians(CAST(lng AS DECIMAL)) - radians(CAST($2 AS DECIMAL))) + 
            sin(radians(CAST($1 AS DECIMAL))) * sin(radians(CAST(lat AS DECIMAL)))
          )
        ) <= CAST($4 AS DECIMAL)
        ORDER BY distance_miles ASC, importance_rank ASC
        LIMIT $3
      `
      params = [userLat, userLng, limitNum, radiusKm]
    } else {
      // General query without proximity (with explicit casting)
      query = `
        SELECT 
          id,
          name,
          CAST(lat AS DECIMAL) as lat,
          CAST(lng AS DECIMAL) as lng,
          park_type,
          data_source,
          description,
          importance_rank,
          NULL as distance_miles
        FROM poi_locations 
        ORDER BY importance_rank ASC, name ASC
        LIMIT $1
      `
      params = [limitNum]
    }

    const result = await sql(query, params)

    // Success response with debug information
    const response = {
      success: true,
      data: result,
      count: result.length,
      timestamp: new Date().toISOString(),
      debug: {
        query_type: lat && lng ? 'proximity_search' : 'all_pois',
        user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        radius: lat && lng ? `${radius} miles` : 'N/A',
        limit: limitNum.toString(),
        data_source: 'poi_locations_table'
      }
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('POI Locations API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Database query failed',
      message: 'Unable to fetch POI locations',
      timestamp: new Date().toISOString(),
      debug: {
        error_type: error.name || 'DatabaseError',
        query_attempted: lat && lng ? 'proximity_search' : 'all_pois'
      }
    })
  }
}