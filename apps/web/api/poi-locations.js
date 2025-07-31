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

    // Simple query - return all POIs with full details
    const result = await sql`
      SELECT 
        id, name, lat, lng, park_type, data_source, description, importance_rank,
        NULL as distance_miles
      FROM poi_locations 
      ORDER BY importance_rank ASC, name ASC
      LIMIT ${limitNum}
    `

    return res.status(200).json({
      success: true,
      data: result,
      count: result.length,
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