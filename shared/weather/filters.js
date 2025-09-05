/**
 * ========================================================================
 * SHARED WEATHER FILTERING - Unified Logic for Dual API Architecture
 * ========================================================================
 *
 * @PURPOSE: Single source of truth for all weather-based POI filtering
 * @USAGE: Used by both Express.js (localhost) and Vercel functions (production)
 * @BENEFIT: Eliminates filtering logic duplication and sync maintenance overhead
 *
 * This module provides consistent weather filtering logic across environments:
 * - localhost: dev-api-server.js imports applyWeatherFilters()
 * - production: apps/web/api/poi-locations-with-weather.js imports applyWeatherFilters()
 *
 * Uses percentile-based filtering for relative weather preferences
 * that adapt to current seasonal conditions automatically.
 */

/**
 * Apply weather-based filtering to POI results
 * Uses percentile-based filtering for relative weather preferences
 *
 * @param {Array} locations - POI locations with weather data
 * @param {Object} filters - Weather filter preferences
 * @param {string} filters.temperature - 'cold', 'mild', 'hot', or empty
 * @param {string} filters.precipitation - 'none', 'light', 'heavy', or empty
 * @param {string} filters.wind - 'calm', 'breezy', 'windy', or empty
 * @returns {Array} Filtered POI locations
 */
export function applyWeatherFilters(locations, filters) {
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
 * Generate mock weather data for testing
 * Used when real weather API is unavailable
 *
 * @param {number} seed - Random seed for consistent mock data
 * @returns {Object} Mock weather data
 */
export function generateMockWeather(seed = Math.random()) {
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear']
  const descriptions = [
    'Perfect weather for outdoor activities',
    'Great conditions for hiking and recreation',
    'Comfortable weather for exploring',
    'Pleasant conditions for outdoor fun',
    'Nice weather for park visits'
  ]

  // Use seed for consistent results during testing
  const random = () => (seed * 9301 + 49297) % 233280 / 233280

  return {
    temperature: Math.floor(random() * 50) + 40, // 40-90°F
    condition: conditions[Math.floor(random() * conditions.length)],
    weather_description: descriptions[Math.floor(random() * descriptions.length)],
    precipitation: Math.floor(random() * 80), // 0-80%
    windSpeed: Math.floor(random() * 20) + 3, // 3-23mph
    weather_source: 'mock',
    weather_timestamp: new Date().toISOString()
  }
}

/**
 * Validate weather filter parameters
 * Ensures consistent parameter validation across environments
 *
 * @param {Object} filters - Filter parameters to validate
 * @returns {Object} Validation result with normalized filters
 */
export function validateWeatherFilters(filters) {
  const validTemperatures = ['cold', 'mild', 'hot']
  const validPrecipitation = ['none', 'light', 'heavy']
  const validWind = ['calm', 'breezy', 'windy']

  const normalized = {}
  const errors = []

  if (filters.temperature) {
    if (validTemperatures.includes(filters.temperature)) {
      normalized.temperature = filters.temperature
    } else {
      errors.push(`Invalid temperature filter: ${filters.temperature}`)
    }
  }

  if (filters.precipitation) {
    if (validPrecipitation.includes(filters.precipitation)) {
      normalized.precipitation = filters.precipitation
    } else {
      errors.push(`Invalid precipitation filter: ${filters.precipitation}`)
    }
  }

  if (filters.wind) {
    if (validWind.includes(filters.wind)) {
      normalized.wind = filters.wind
    } else {
      errors.push(`Invalid wind filter: ${filters.wind}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    filters: normalized
  }
}
