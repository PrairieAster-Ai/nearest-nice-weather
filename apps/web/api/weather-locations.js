/**
 * ========================================================================
 * WEATHER LOCATIONS API - Production Vercel Function
 * ========================================================================
 * 
 * @PURPOSE: Pure POI locations endpoint (without weather data integration)
 * @SYNC_TARGET: dev-api-server.js /api/poi-locations endpoint
 * @BUSINESS_CRITICAL: Fixes 404 NOT_FOUND errors for weather-locations API
 * 
 * This endpoint provides Minnesota outdoor recreation POIs ordered by:
 * - Proximity: If lat/lng provided, ordered by distance from user
 * - Importance: If no location, ordered by place_rank (popularity)
 * 
 * Uses identical query logic to localhost Express.js endpoint.
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'

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
      error: 'Method not allowed'
    })
  }

  try {
    const { lat, lng, radius = '50', limit = '20' } = req.query
    const limitNum = Math.min(parseInt(limit) || 20, 500)
    
    console.log('🔍 Weather-locations query parameters:', { lat, lng, radius, limit })

    let result
    try {
      // Try expanded schema first (production)
      if (lat && lng) {
        const userLat = parseFloat(lat)
        const userLng = parseFloat(lng)
        
        result = await sql`
          SELECT 
            id, name, lat, lng, park_type, park_level, ownership, operator,
            data_source, description, place_rank, phone, website, amenities, activities,
            (3959 * acos(
              cos(radians(${userLat})) * cos(radians(lat)) * 
              cos(radians(lng) - radians(${userLng})) + 
              sin(radians(${userLat})) * sin(radians(lat))
            )) as distance_miles
          FROM poi_locations_expanded
          ORDER BY distance_miles ASC
          LIMIT ${limitNum}
        `
      } else {
        result = await sql`
          SELECT 
            id, name, lat, lng, park_type, park_level, ownership, operator,
            data_source, description, place_rank, phone, website, amenities, activities
          FROM poi_locations_expanded
          ORDER BY place_rank ASC, name ASC
          LIMIT ${limitNum}
        `
      }
    } catch (error) {
      console.log('Expanded table query failed, trying basic schema:', error.message)
      
      // Fallback to basic schema
      if (lat && lng) {
        const userLat = parseFloat(lat)
        const userLng = parseFloat(lng)
        
        result = await sql`
          SELECT id, name, lat, lng, park_type, data_source, 
                 description, place_rank,
                 NULL as park_level, NULL as ownership, NULL as operator,
                 NULL as phone, NULL as website, NULL as amenities, NULL as activities,
            (3959 * acos(
              cos(radians(${userLat})) * cos(radians(lat)) * 
              cos(radians(lng) - radians(${userLng})) + 
              sin(radians(${userLat})) * sin(radians(lat))
            )) as distance_miles
          FROM poi_locations
          WHERE data_source = 'manual' OR park_type IS NOT NULL
          ORDER BY distance_miles ASC
          LIMIT ${limitNum}
        `
      } else {
        result = await sql`
          SELECT id, name, lat, lng, park_type, data_source, 
                 description, place_rank,
                 NULL as park_level, NULL as ownership, NULL as operator,
                 NULL as phone, NULL as website, NULL as amenities, NULL as activities
          FROM poi_locations
          WHERE data_source = 'manual' OR park_type IS NOT NULL
          ORDER BY place_rank ASC, name ASC
          LIMIT ${limitNum}
        `
      }
    }
    
    // Transform results to match localhost format
    const pois = result.map(row => ({
      id: row.id.toString(),
      name: row.name,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      park_type: row.park_type || null,
      park_level: row.park_level || null,
      ownership: row.ownership || null,
      operator: row.operator || null,
      data_source: row.data_source || 'unknown',
      description: row.description || null,
      importance_rank: row.place_rank || 1,
      phone: row.phone || null,
      website: row.website || null,
      amenities: row.amenities || [],
      activities: row.activities || [],
      place_rank: row.place_rank || row.importance_rank || 1,
      distance_miles: row.distance_miles ? parseFloat(row.distance_miles).toFixed(2) : null
    }))
    
    res.json({
      success: true,
      data: pois,
      count: pois.length,
      timestamp: new Date().toISOString(),
      debug: {
        query_type: lat && lng ? 'proximity_poi' : 'all_pois',
        user_location: lat && lng ? { 
          lat: parseFloat(lat), 
          lng: parseFloat(lng) 
        } : null,
        radius: radius + ' miles (for reference)',
        limit: limit,
        data_source: 'poi_locations_table',
        environment: 'vercel-serverless'
      }
    })
    
  } catch (error) {
    console.error('Weather-locations API error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve POI data',
      message: error.message,
      context: 'weather-locations endpoint',
      timestamp: new Date().toISOString()
    })
  }
}