/**
 * ========================================================================
 * WEATHER SERVICE - OpenWeather API Integration
 * ========================================================================
 * 
 * @BUSINESS_PURPOSE: Real-time weather data for MVP launch
 * @TECHNICAL_APPROACH: Caching + fallback strategy for reliability
 * @MVP_CRITICAL: Replaces mock data with live weather for production launch
 * 
 * FEATURES:
 * - OpenWeather API integration with error handling
 * - In-memory caching (5-minute TTL) for performance
 * - Graceful fallback to pleasant defaults
 * - Cost optimization (minimal API calls)
 * 
 * ========================================================================
 */

import fetch from 'node-fetch'

// In-memory cache for weather data (5-minute TTL)
const weatherCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch real weather data from OpenWeather API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @returns {Promise<Object>} Weather data object
 */
export async function fetchWeatherData(lat, lng) {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`
  
  // Check cache first
  const cached = weatherCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    // Only proceed if API key is configured
    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your-openweather-api-key') {
      console.log('OpenWeather API key not configured, using fallback data')
      return getFallbackWeather(lat, lng)
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
    
    console.log(`Fetching weather for ${lat}, ${lng}`)
    const response = await fetch(url, { timeout: 3000 })
    
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform OpenWeather response to our format
    const weatherData = {
      temperature: Math.round(data.main.temp),
      condition: mapWeatherCondition(data.weather[0].main),
      description: data.weather[0].description,
      precipitation: calculatePrecipitationChance(data),
      windSpeed: Math.round(data.wind?.speed || 0),
      source: 'openweather',
      timestamp: new Date().toISOString()
    }
    
    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    })
    
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
    description: 'Pleasant outdoor conditions',
    precipitation: 15,
    windSpeed: 8,
    source: 'fallback',
    timestamp: new Date().toISOString()
  }
}

/**
 * Batch fetch weather for multiple locations (with rate limiting)
 */
export async function fetchBatchWeather(locations) {
  const weatherPromises = locations.map(async (location, index) => {
    // Add small delay to avoid rate limiting (100ms between calls)
    await new Promise(resolve => setTimeout(resolve, index * 100))
    
    const weather = await fetchWeatherData(location.lat, location.lng)
    return {
      ...location,
      ...weather
    }
  })
  
  return Promise.all(weatherPromises)
}