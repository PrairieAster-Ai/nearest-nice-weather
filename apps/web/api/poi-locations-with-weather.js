/**
 * ========================================================================
 * POI LOCATIONS WITH WEATHER API - Production Vercel Function
 * ========================================================================
 *
 * @PURPOSE: Primary frontend API - POI discovery with weather integration
 * @SYNC_TARGET: dev-api-server.js /api/poi-locations-with-weather endpoint
 * @BUSINESS_CRITICAL: Main map interface depends on this endpoint
 *
 * This is the main API endpoint used by the frontend map interface.
 * Combines outdoor recreation POIs with mock weather data and filtering.
 * Uses identical logic to localhost Express.js endpoint.
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'

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

    let result
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
        FROM poi_locations
        ORDER BY distance_miles ASC
        LIMIT ${limitNum}
      `
    } else {
      result = await sql`
        SELECT
          id, name, lat, lng, park_type, park_level, ownership, operator,
          data_source, description, place_rank, phone, website, amenities, activities
        FROM poi_locations
        ORDER BY place_rank ASC, name ASC
        LIMIT ${limitNum}
      `
    }

    // Transform results and add mock weather data
    const baseData = result.map(row => ({
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

    // Add consistent mock weather data
    console.log(`Adding mock weather data for ${baseData.length} POIs`)
    const transformedData = baseData.map((poi, index) => {
      // Deterministic mock weather based on POI ID for consistency
      const seed = parseInt(poi.id) + index
      const random = (seed * 9301 + 49297) % 233280 / 233280

      return {
        ...poi,
        temperature: Math.floor(random * 50) + 40, // 40-90°F
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'][Math.floor(random * 5)],
        weather_description: 'Perfect weather for outdoor activities',
        precipitation: Math.floor(random * 80), // 0-80%
        windSpeed: Math.floor(random * 20) + 3, // 3-23mph
        weather_source: 'mock',
        weather_timestamp: new Date().toISOString()
      }
    })

    // Apply weather-based filtering
    const filteredData = applyWeatherFilters(transformedData, { temperature, precipitation, wind })
    console.log(`After weather filtering: ${filteredData.length} POIs`)

    res.json({
      success: true,
      data: filteredData,
      count: filteredData.length,
      timestamp: new Date().toISOString(),
      debug: {
        query_type: lat && lng ? 'proximity_with_weather' : 'all_pois_with_weather',
        user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        radius: radius,
        limit: limitNum.toString(),
        data_source: 'poi_with_mock_weather',
        weather_api: 'mock_weather_service',
        environment: 'vercel-serverless',
        note: 'Using consistent mock weather data - matching localhost behavior'
      }
    })

  } catch (error) {
    console.error('POI-Weather API error:', error)

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve POI data with weather',
      message: error.message,
      context: 'poi-locations-with-weather endpoint',
      timestamp: new Date().toISOString()
    })
  }
}
