/**
 * ========================================================================
 * POI LOCATIONS WITH WEATHER API - Production Vercel Function
 * ========================================================================
 * 
 * @PURPOSE: Primary frontend API - POI discovery with weather integration
 * @SYNC_TARGET: dev-api-server.js /api/poi-locations-with-weather endpoint
 * @SHARED_LOGIC: Uses shared/database/queries.js and shared/weather/filters.js
 * 
 * This is the main API endpoint used by the frontend map interface.
 * Combines outdoor recreation POIs with weather data and filtering.
 * Uses shared logic modules to eliminate dual maintenance overhead.
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'
import { applyWeatherFilters, generateMockWeather } from '../../../shared/weather/filters.js'
import { 
  buildNeonPOIQuery, 
  transformPOIResults, 
  createErrorResponse, 
  createSuccessResponse 
} from '../../../shared/database/queries.js'

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
    const { lat, lng, radius = '50', limit = '200', temperature, precipitation, wind } = req.query
    const limitNum = Math.min(parseInt(limit) || 200, 500)

    console.log('🔍 POI-Weather query parameters:', { lat, lng, radius, limit, temperature, precipitation, wind })

    // Use shared query logic for consistency with localhost API
    const queryBuilder = buildNeonPOIQuery({ lat, lng, limit: limitNum })
    
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
    const baseData = transformPOIResults(result)

    // Add mock weather data using shared logic for consistency
    console.log(`Adding mock weather data for ${baseData.length} POIs`)
    const transformedData = baseData.map((poi, index) => ({
      ...poi,
      ...generateMockWeather(poi.id + index) // Consistent mock data based on POI
    }))

    // Apply weather-based filtering using shared logic
    const filteredData = applyWeatherFilters(transformedData, { temperature, precipitation, wind })
    console.log(`After weather filtering: ${filteredData.length} POIs`)

    // Create standardized response using shared logic
    const response = createSuccessResponse(filteredData, {
      query_type: lat && lng ? 'proximity_with_weather' : 'all_pois_with_weather',
      user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      radius: radius,
      limit: limitNum.toString(),
      data_source: 'poi_with_mock_weather',
      weather_api: 'mock_weather_service',
      environment: 'vercel-serverless',
      note: 'Using consistent mock weather data - upgrade to real API when needed'
    })
    
    res.json(response)

  } catch (error) {
    console.error('POI-Weather API error:', error)
    
    // Use shared error response format
    const errorResponse = createErrorResponse(error, 'poi-locations-with-weather endpoint')
    res.status(500).json(errorResponse)
  }
}