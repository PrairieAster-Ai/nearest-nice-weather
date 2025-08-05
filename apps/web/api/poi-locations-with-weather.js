/**
 * ========================================================================
 * POI LOCATIONS WITH REAL WEATHER API - Production Compatible
 * ========================================================================
 * 
 * @BUSINESS_PURPOSE: POI discovery with real-time weather integration
 * @TECHNICAL_APPROACH: Use working POI API + OpenWeather API service
 * @SYNC_TARGET: dev-api-server.js poi-locations-with-weather endpoint
 * 
 * Provides Minnesota outdoor recreation POIs with real weather data
 * matching localhost API functionality for deployment parity.
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'
import { fetchBatchWeather } from '../utils/weatherService.js'

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
    const { lat, lng, radius = '50', limit = '200' } = req.query
    const limitNum = Math.min(parseInt(limit) || 200, 500)

    // Use the same fallback logic as poi-locations.js
    let result
    try {
      result = await sql`
        SELECT 
          id, name, lat, lng, park_type, data_source, description, 
          place_rank as importance_rank,
          NULL as distance_miles
        FROM poi_locations
        WHERE data_source = 'manual' OR park_type IS NOT NULL
        ORDER BY place_rank ASC, name ASC
        LIMIT ${limitNum}
      `
    } catch (error) {
      try {
        result = await sql`
          SELECT 
            id, name, lat, lng, data_source, description, 
            place_rank as importance_rank,
            NULL as distance_miles,
            NULL as park_type
          FROM poi_locations
          WHERE data_source = 'manual'
          ORDER BY place_rank ASC, name ASC
          LIMIT ${limitNum}
        `
      } catch (error2) {
        result = await sql`
          SELECT 
            id, name, lat, lng,
            NULL as description,
            1 as importance_rank,
            NULL as distance_miles,
            NULL as park_type,
            'unknown' as data_source
          FROM poi_locations
          ORDER BY name ASC
          LIMIT ${limitNum}
        `
      }
    }

    // Transform database results to basic format for weather service
    const baseData = result.map(row => ({
      id: row.id.toString(),
      name: row.name,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      park_type: row.park_type,
      data_source: row.data_source,
      description: row.description,
      importance_rank: row.importance_rank,
      distance_miles: row.distance_miles ? parseFloat(row.distance_miles).toFixed(2) : null
    }))

    // Fetch real weather data for all POIs (batch processing)
    console.log(`Fetching weather for ${baseData.length} POIs`)
    const transformedData = await fetchBatchWeather(baseData, 5) // Max 5 concurrent requests

    console.log(`Weather integration complete for ${transformedData.length} POIs`)

    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      timestamp: new Date().toISOString(),
      debug: {
        query_type: lat && lng ? 'proximity_with_weather' : 'all_pois_with_weather',
        user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        radius: radius,
        limit: limitNum.toString(),
        data_source: 'poi_with_real_weather',
        weather_api: 'openweather',
        note: 'Using real OpenWeather API data for production deployment'
      }
    })

  } catch (error) {
    console.error('POI-Weather API error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Database query failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}