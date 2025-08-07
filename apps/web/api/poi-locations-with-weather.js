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

/**
 * Apply weather-based filtering to POI results
 * Uses percentile-based filtering for relative weather preferences
 */
function applyWeatherFilters(locations, filters) {
  if (!locations || locations.length === 0) return []

  let filtered = [...locations]
  const startCount = filtered.length

  // Temperature filtering - uses percentile-based approach for seasonal relevance
  if (filters.temperature && filters.temperature !== '') {
    const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b)
    const tempCount = temps.length

    if (filters.temperature === 'cold') {
      // Show coldest 40% of available temperatures
      const threshold = temps[Math.floor(tempCount * 0.4)]
      filtered = filtered.filter(loc => loc.temperature <= threshold)
      console.log(`❄️ Cold filter: temps ≤ ${threshold}°F`)
    } else if (filters.temperature === 'hot') {
      // Show hottest 40% of available temperatures
      const threshold = temps[Math.floor(tempCount * 0.6)]
      filtered = filtered.filter(loc => loc.temperature >= threshold)
      console.log(`🔥 Hot filter: temps ≥ ${threshold}°F`)
    } else if (filters.temperature === 'mild') {
      // Show middle 80% of temperatures (exclude extreme 10% on each end)
      const minThreshold = temps[Math.floor(tempCount * 0.1)]
      const maxThreshold = temps[Math.floor(tempCount * 0.9)]
      filtered = filtered.filter(loc => loc.temperature >= minThreshold && loc.temperature <= maxThreshold)
      console.log(`🌤️ Mild filter: temps ${minThreshold}°F - ${maxThreshold}°F`)
    }
  }

  // Precipitation filtering - based on percentiles of available data
  if (filters.precipitation && filters.precipitation !== '') {
    const precips = locations.map(loc => loc.precipitation).sort((a, b) => a - b)
    const precipCount = precips.length

    if (filters.precipitation === 'none') {
      // Show driest 60% of available locations
      const threshold = precips[Math.floor(precipCount * 0.6)]
      filtered = filtered.filter(loc => loc.precipitation <= threshold)
      console.log(`☀️ No precip filter: precip ≤ ${threshold}%`)
    } else if (filters.precipitation === 'light') {
      // Show middle precipitation range (20th-70th percentile)
      const minThreshold = precips[Math.floor(precipCount * 0.2)]
      const maxThreshold = precips[Math.floor(precipCount * 0.7)]
      filtered = filtered.filter(loc => loc.precipitation >= minThreshold && loc.precipitation <= maxThreshold)
      console.log(`🌦️ Light precip filter: precip ${minThreshold}% - ${maxThreshold}%`)
    } else if (filters.precipitation === 'heavy') {
      // Show wettest 30% of available locations
      const threshold = precips[Math.floor(precipCount * 0.7)]
      filtered = filtered.filter(loc => loc.precipitation >= threshold)
      console.log(`🌧️ Heavy precip filter: precip ≥ ${threshold}%`)
    }
  }

  // Wind filtering - based on percentiles of available wind speeds
  if (filters.wind && filters.wind !== '') {
    const winds = locations.map(loc => loc.windSpeed || 0).sort((a, b) => a - b)
    const windCount = winds.length

    if (filters.wind === 'calm') {
      // Show calmest 50% of available locations
      const threshold = winds[Math.floor(windCount * 0.5)]
      filtered = filtered.filter(loc => (loc.windSpeed || 0) <= threshold)
      console.log(`🍃 Calm filter: wind ≤ ${threshold}mph`)
    } else if (filters.wind === 'breezy') {
      // Show middle wind range (30th-70th percentile)
      const minThreshold = winds[Math.floor(windCount * 0.3)]
      const maxThreshold = winds[Math.floor(windCount * 0.7)]
      filtered = filtered.filter(loc => {
        const windSpeed = loc.windSpeed || 0
        return windSpeed >= minThreshold && windSpeed <= maxThreshold
      })
      console.log(`💨 Breezy filter: wind ${minThreshold} - ${maxThreshold}mph`)
    } else if (filters.wind === 'windy') {
      // Show windiest 30% of available locations
      const threshold = winds[Math.floor(windCount * 0.7)]
      filtered = filtered.filter(loc => (loc.windSpeed || 0) >= threshold)
      console.log(`🌪️ Windy filter: wind ≥ ${threshold}mph`)
    }
  }

  console.log(`🎯 Weather filtering: ${startCount} → ${filtered.length} POIs`)
  return filtered
}

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
    const { lat, lng, radius = '50', limit = '200', temperature, precipitation, wind } = req.query
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
    let transformedData = await fetchBatchWeather(baseData, 5) // Max 5 concurrent requests

    console.log(`Weather integration complete for ${transformedData.length} POIs`)

    // Apply weather-based filtering if filters are provided
    transformedData = applyWeatherFilters(transformedData, { temperature, precipitation, wind })
    console.log(`After weather filtering: ${transformedData.length} POIs`)

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