/**
 * ========================================================================
 * WEATHER LOCATIONS API - Production Vercel Function
 * ========================================================================
 * 
 * @PURPOSE: Pure POI locations endpoint (without weather data integration)
 * @SYNC_TARGET: dev-api-server.js /api/poi-locations endpoint
 * @SHARED_LOGIC: Uses shared/database/queries.js for consistency
 * 
 * This endpoint provides Minnesota outdoor recreation POIs ordered by:
 * - Proximity: If lat/lng provided, ordered by distance from user
 * - Importance: If no location, ordered by place_rank (popularity)
 * 
 * Response format matches localhost Express.js endpoint exactly.
 * Uses shared query logic to eliminate dual maintenance overhead.
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'
import { 
  buildNeonPOIQuery, 
  transformPOIResults, 
  createErrorResponse, 
  createSuccessResponse 
} from '../../shared/database/queries.js'

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
    
    console.log('🔍 Weather-locations query parameters:', { lat, lng, radius, limit })

    // Use shared query logic for consistency
    const queryBuilder = buildNeonPOIQuery({ lat, lng, limit })
    
    let result
    try {
      // Try primary query first (expanded schema)
      result = await queryBuilder.primaryQuery(sql)
    } catch (error) {
      console.log('Primary query failed, trying fallback:', error.message)
      
      if (error.message.includes('poi_locations_expanded') || 
          error.message.includes('does not exist')) {
        // Fallback to basic schema
        result = await queryBuilder.fallbackQuery(sql)
      } else {
        throw error
      }
    }
    
    // Transform results using shared logic
    const pois = transformPOIResults(result)
    
    // Create standardized response
    const response = createSuccessResponse(pois, {
      query_type: lat && lng ? 'proximity_poi' : 'all_pois',
      user_location: lat && lng ? { 
        lat: parseFloat(lat), 
        lng: parseFloat(lng) 
      } : null,
      radius: radius + ' miles (for reference)',
      limit: limit,
      environment: 'vercel-serverless'
    })
    
    res.json(response)
    
  } catch (error) {
    console.error('Weather-locations API error:', error)
    
    // Use shared error response format
    const errorResponse = createErrorResponse(error, 'weather-locations endpoint')
    res.status(500).json(errorResponse)
  }
}