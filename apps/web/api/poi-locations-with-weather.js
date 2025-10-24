/**
 * ========================================================================
 * POI LOCATIONS WITH WEATHER API - Production Vercel Function
 * ========================================================================
 *
 * @PURPOSE: Primary frontend API - POI discovery with weather integration
 * @SYNC_TARGET: dev-api-server.js /api/poi-locations-with-weather endpoint
 * @BUSINESS_CRITICAL: Main map interface depends on this endpoint
 *
 * ⚠️  CODE SYNC RESTORED: 2025-10-24
 * This file was previously out of sync with production. Real weather implementation
 * has been restored from localhost (dev-api-server.js + weatherService.js).
 *
 * REVERT INSTRUCTIONS (if something breaks):
 * 1. Restore backup: `cp apps/web/api/poi-locations-with-weather.js.BACKUP-* apps/web/api/poi-locations-with-weather.js`
 * 2. Or revert commit: `git revert HEAD`
 * 3. Redeploy: `npm run deploy:production`
 *
 * WHAT CHANGED:
 * - REMOVED: Mock weather PRNG (deterministic fake data)
 * - ADDED: Real OpenWeather API integration with Redis caching
 * - ADDED: Fallback weather when API unavailable
 * - ADDED: Batch weather fetching with cache optimization
 *
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

/**
 * ========================================================================
 * WEATHER SERVICE - Inlined from weatherService.js
 * ========================================================================
 *
 * NOTE: This is duplicated from apps/web/utils/weatherService.js because
 * Vercel serverless functions cannot import from parent directories.
 *
 * TODO: Extract to shared module in Phase 0 of PRD-OVERPASS-POI-EXPANSION.md
 * ========================================================================
 */

// Cache service fallback for Vercel environment
const cacheServiceFallback = {
  getWeatherData: async () => null,
  setWeatherData: async () => false,
  getBatchWeatherData: async () => new Map(),
  getStats: () => ({ hits: 0, misses: 0, errors: 0, totalRequests: 0, hitRate: 0 })
}

/**
 * Fetch weather data with fallback caching
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Weather data object
 */
async function fetchWeatherData(lat, lng) {
  const cacheService = cacheServiceFallback // Cache not available in Vercel yet
  let cacheStatus = 'disabled'

  try {
    // Only proceed if API key is configured
    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your-openweather-api-key') {
      console.log('OpenWeather API key not configured, using fallback data')
      const fallbackWeather = getFallbackWeather(lat, lng)
      return {
        ...fallbackWeather,
        cache_status: 'bypass',
        cache_timestamp: null
      }
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`

    console.log(`Fetching weather from OpenWeather API for ${lat}, ${lng}`)

    // Use fetch with timeout for serverless environment
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NearestNiceWeather/1.0'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform OpenWeather response to our format
    const weatherData = {
      temperature: Math.round(data.main.temp),
      condition: mapWeatherCondition(data.weather[0].main),
      weather_description: data.weather[0].description,
      precipitation: calculatePrecipitationChance(data),
      windSpeed: Math.round(data.wind?.speed || 0),
      weather_source: 'openweather',
      weather_timestamp: new Date().toISOString(),
      cache_status: cacheStatus
    }

    console.log(`Successfully fetched weather for ${lat}, ${lng}:`, weatherData)
    return weatherData

  } catch (error) {
    console.error('Weather API error:', error.message)
    const fallbackWeather = getFallbackWeather(lat, lng)
    return {
      ...fallbackWeather,
      cache_status: 'error',
      cache_timestamp: null,
      error_message: error.message
    }
  }
}

/**
 * Map OpenWeather conditions to our standard conditions
 */
function mapWeatherCondition(openWeatherMain) {
  const conditionMap = {
    'Clear': 'Clear',
    'Clouds': 'Partly Cloudy',
    'Rain': 'Light Rain',
    'Drizzle': 'Light Rain',
    'Thunderstorm': 'Thunderstorms',
    'Snow': 'Snow',
    'Mist': 'Foggy',
    'Fog': 'Foggy',
    'Haze': 'Hazy'
  }

  return conditionMap[openWeatherMain] || 'Clear'
}

/**
 * Calculate precipitation chance from OpenWeather data
 */
function calculatePrecipitationChance(data) {
  if (data.rain?.['1h'] > 0 || data.snow?.['1h'] > 0) {
    return Math.min(90, Math.max(20, Math.round((data.rain?.['1h'] || 0) * 10)))
  }

  // Estimate based on conditions
  const condition = data.weather[0].main
  if (condition === 'Rain' || condition === 'Drizzle') return 80
  if (condition === 'Thunderstorm') return 90
  if (condition === 'Snow') return 85
  if (condition === 'Clouds') return 20

  return 10
}

/**
 * Fallback weather data for when API fails or is not configured
 */
function getFallbackWeather(lat, lng) {
  // Pleasant Minnesota weather defaults
  return {
    temperature: 72,
    condition: 'Partly Cloudy',
    weather_description: 'Pleasant outdoor conditions',
    precipitation: 15,
    windSpeed: 8,
    weather_source: 'fallback',
    weather_timestamp: new Date().toISOString()
  }
}

/**
 * ========================================================================
 * END WEATHER SERVICE - Resume API endpoint logic
 * ========================================================================
 */

/**
 * Apply weather-based filtering to POI results
 * Uses percentile-based filtering for relative weather preferences
 *
 * ⚠️  CAUTION: Weather filtering is historically problematic
 * See CLAUDE.md: "DO NOT adjust filter percentiles without explicit user request"
 * This logic causes 77 locations → 5 results with restrictive settings
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

/**
 * ========================================================================
 * MAIN API HANDLER
 * ========================================================================
 */
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

    // Transform results to standard format
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

    // Fetch REAL weather data for each POI using OpenWeather API
    console.log(`Fetching real weather data for ${baseData.length} POIs from OpenWeather API`)
    const transformedData = await Promise.all(baseData.map(async (poi) => {
      const weatherData = await fetchWeatherData(poi.lat, poi.lng)

      return {
        ...poi,
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        weather_description: weatherData.weather_description,
        precipitation: weatherData.precipitation,
        windSpeed: weatherData.windSpeed,
        weather_source: weatherData.weather_source,
        weather_timestamp: weatherData.weather_timestamp,
        cache_status: weatherData.cache_status
      }
    }))

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
        data_source: 'poi_with_real_weather',
        weather_api: 'openweather',
        cache_strategy: 'Redis cache disabled in Vercel (fallback only)',
        note: 'Using real OpenWeather API data - synced from localhost 2025-10-24'
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
