/**
 * ========================================================================
 * WEATHER SERVICE - Redis Cache Integrated
 * ========================================================================
 * 
 * @BUSINESS_PURPOSE: Cost-optimized weather data with Redis caching
 * @TECHNICAL_APPROACH: OpenWeather API + Redis cache for 60% cost reduction
 * @PRD_REF: PRD-REDIS-CACHING-180.md
 * 
 * CACHE OPTIMIZATIONS:
 * - Redis caching for 6-hour weather data persistence
 * - Batch weather requests with cache-first strategy
 * - Graceful fallback when cache unavailable
 * - Environment-aware cache configuration
 * 
 * ========================================================================
 */

// Dynamic import for cache service to handle both ES modules and CommonJS contexts
let cacheService = null
async function getCacheServiceDynamic() {
  if (!cacheService) {
    try {
      const { getCacheService } = await import('../services/cacheService.js')
      cacheService = getCacheService()
    } catch (error) {
      console.log('Cache service not available, using fallback')
      // Fallback cache service for environments without TypeScript support
      cacheService = {
        getWeatherData: async () => null,
        setWeatherData: async () => false,
        getBatchWeatherData: async () => new Map(),
        getStats: () => ({ hits: 0, misses: 0, errors: 0, totalRequests: 0, hitRate: 0 })
      }
    }
  }
  return cacheService
}

/**
 * Fetch weather data with Redis cache integration
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @returns {Promise<Object>} Weather data object with cache status
 */
export async function fetchWeatherData(lat, lng) {
  const cacheService = await getCacheServiceDynamic()
  let cacheStatus = 'disabled'

  try {
    // Try cache first (cache coordinates to 2 decimal precision for efficiency)
    const cachedWeather = await cacheService.getWeatherData(lat, lng, 2)
    if (cachedWeather) {
      console.log(`Cache HIT for weather at ${lat}, ${lng}`)
      return {
        ...cachedWeather,
        cache_status: 'hit',
        cache_timestamp: cachedWeather.weather_timestamp
      }
    }

    cacheStatus = 'miss'
    console.log(`Cache MISS for weather at ${lat}, ${lng} - fetching from API`)

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
    
    // Cache the weather data for 6 hours
    await cacheService.setWeatherData(lat, lng, weatherData, 2)
    console.log(`Cached weather data for ${lat}, ${lng}`)
    
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
 * Batch fetch weather for multiple locations with optimized caching
 * @param {Array} locations - Array of location objects with lat/lng
 * @param {number} maxConcurrent - Maximum concurrent requests (default: 5)
 */
export async function fetchBatchWeather(locations, maxConcurrent = 5) {
  const cacheService = await getCacheServiceDynamic()
  let cacheHits = 0
  let cacheMisses = 0
  let apiRequests = 0
  
  console.log(`Starting batch weather fetch for ${locations.length} locations`)
  
  try {
    // PHASE 1: Check cache for all locations first
    const coordinates = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }))
    const cachedResults = await cacheService.getBatchWeatherData(coordinates, 2)
    
    const results = []
    const uncachedLocations = []
    
    for (const location of locations) {
      const cacheKey = `nnw:weather:lat:${Math.round(location.lat * 100) / 100}|lng:${Math.round(location.lng * 100) / 100}`
      const cachedWeather = cachedResults.get(cacheKey)
      
      if (cachedWeather) {
        cacheHits++
        results.push({
          ...location,
          ...cachedWeather,
          cache_status: 'hit'
        })
      } else {
        cacheMisses++
        uncachedLocations.push(location)
      }
    }
    
    console.log(`Cache analysis: ${cacheHits} hits, ${cacheMisses} misses`)
    
    // PHASE 2: Fetch weather for uncached locations only
    if (uncachedLocations.length > 0) {
      console.log(`Fetching weather for ${uncachedLocations.length} uncached locations`)
      
      // Process in batches to avoid overwhelming the API
      const batches = []
      for (let i = 0; i < uncachedLocations.length; i += maxConcurrent) {
        batches.push(uncachedLocations.slice(i, i + maxConcurrent))
      }
      
      for (const batch of batches) {
        const batchPromises = batch.map(async (location) => {
          apiRequests++
          const weather = await fetchWeatherData(location.lat, location.lng)
          return {
            ...location,
            ...weather
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
        
        // Small delay between batches to be respectful to API
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }
    
    // Sort results to match original order
    const sortedResults = locations.map(originalLoc => {
      return results.find(result => 
        Math.abs(result.lat - originalLoc.lat) < 0.001 && 
        Math.abs(result.lng - originalLoc.lng) < 0.001
      )
    }).filter(Boolean)
    
    console.log(`Batch weather completed: ${cacheHits} cached, ${apiRequests} API calls`)
    
    return {
      locations: sortedResults,
      cache_stats: {
        hits: cacheHits,
        misses: cacheMisses,
        api_requests: apiRequests,
        hit_rate: locations.length > 0 ? (cacheHits / locations.length) * 100 : 0
      }
    }
    
  } catch (error) {
    console.error('Batch weather fetch error:', error)
    
    // Fallback: use individual requests without cache optimization
    const fallbackResults = []
    for (const location of locations) {
      try {
        const weather = await fetchWeatherData(location.lat, location.lng)
        fallbackResults.push({
          ...location,
          ...weather
        })
      } catch (err) {
        console.error(`Failed to fetch weather for ${location.lat}, ${location.lng}:`, err)
        fallbackResults.push({
          ...location,
          ...getFallbackWeather(location.lat, location.lng),
          cache_status: 'error'
        })
      }
    }
    
    return {
      locations: fallbackResults,
      cache_stats: {
        hits: 0,
        misses: locations.length,
        api_requests: locations.length,
        hit_rate: 0,
        error: error.message
      }
    }
  }
}