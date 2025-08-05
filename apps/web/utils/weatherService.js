/**
 * ========================================================================
 * WEATHER SERVICE - Vercel Serverless Compatible
 * ========================================================================
 * 
 * @BUSINESS_PURPOSE: Real-time weather data for production deployment
 * @TECHNICAL_APPROACH: OpenWeather API integration optimized for serverless
 * @SYNC_TARGET: src/services/weatherService.js (localhost version)
 * 
 * SERVERLESS OPTIMIZATIONS:
 * - No in-memory caching (use Vercel edge caching instead)
 * - Simplified error handling for cold starts
 * - Optimized for single-request usage pattern
 * 
 * ========================================================================
 */

/**
 * Fetch real weather data from OpenWeather API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @returns {Promise<Object>} Weather data object
 */
export async function fetchWeatherData(lat, lng) {
  try {
    // Only proceed if API key is configured
    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your-openweather-api-key') {
      console.log('OpenWeather API key not configured, using fallback data')
      return getFallbackWeather(lat, lng)
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
    
    console.log(`Fetching weather for ${lat}, ${lng}`)
    
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
      wind_speed: Math.round(data.wind?.speed || 0),
      weather_source: 'openweather',
      weather_timestamp: new Date().toISOString()
    }
    
    return weatherData
    
  } catch (error) {
    console.error('Weather API error:', error.message)
    return getFallbackWeather(lat, lng)
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
    wind_speed: 8,
    weather_source: 'fallback',
    weather_timestamp: new Date().toISOString()
  }
}

/**
 * Batch fetch weather for multiple locations (optimized for serverless)
 * @param {Array} locations - Array of location objects with lat/lng
 * @param {number} maxConcurrent - Maximum concurrent requests (default: 5)
 */
export async function fetchBatchWeather(locations, maxConcurrent = 5) {
  // Process in batches to avoid overwhelming the API
  const batches = []
  for (let i = 0; i < locations.length; i += maxConcurrent) {
    batches.push(locations.slice(i, i + maxConcurrent))
  }
  
  const results = []
  
  for (const batch of batches) {
    const batchPromises = batch.map(async (location) => {
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
  
  return results
}