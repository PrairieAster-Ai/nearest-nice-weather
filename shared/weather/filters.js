/**
 * ========================================================================
 * SHARED WEATHER FILTERS MODULE
 * ========================================================================
 *
 * Single source of truth for weather-based POI filtering logic.
 *
 * EXTRACTED FROM:
 * - dev-api-server.js (lines 54-137) - Localhost Express.js API
 * - apps/web/api/poi-locations-with-weather.js (lines 192-274) - Production Vercel Function
 *
 * PURPOSE:
 * - Eliminate 184 lines of code duplication
 * - Single place to fix bugs and adjust filtering logic
 * - Testable, maintainable, reusable
 *
 * APPROACH:
 * - Percentile-based filtering for relative weather preferences
 * - Adapts to current weather distribution across POIs
 * - Seasonal relevance without hardcoded temperature thresholds
 *
 * ⚠️  CAUTION: Weather filtering is historically problematic
 * See CLAUDE.md: "DO NOT adjust filter percentiles without explicit user request"
 * This logic can cause restrictive filtering (77 locations → 5 results)
 *
 * @module shared/weather/filters
 * @version 1.0.0
 * @created 2025-10-24
 * @part-of Phase 0: Code Quality Prerequisites (CQ-1)
 * ========================================================================
 */

/**
 * Apply weather-based filtering to POI results
 * Uses percentile-based filtering for relative weather preferences
 *
 * @param {Array<Object>} locations - Array of POI objects with weather data
 * @param {Object} filters - Weather filter preferences
 * @param {string} [filters.temperature] - Temperature preference: 'cold', 'hot', 'mild', or ''
 * @param {string} [filters.precipitation] - Precipitation preference: 'none', 'light', 'heavy', or ''
 * @param {string} [filters.wind] - Wind preference: 'calm', 'breezy', 'windy', or ''
 * @param {Function} [logger=console.log] - Optional logging function for diagnostics
 * @returns {Array<Object>} Filtered array of POI objects
 *
 * @example
 * const filtered = applyWeatherFilters(pois, {
 *   temperature: 'mild',
 *   precipitation: 'none',
 *   wind: 'calm'
 * });
 */
export function applyWeatherFilters(locations, filters, logger = console.log) {
  // Handle empty input
  if (!locations || locations.length === 0) return []

  // Start with all locations
  let filtered = [...locations]
  const startCount = filtered.length

  // Apply temperature filter if specified
  if (filters.temperature && filters.temperature !== '') {
    filtered = filterByTemperature(filtered, locations, filters.temperature, logger)
  }

  // Apply precipitation filter if specified
  if (filters.precipitation && filters.precipitation !== '') {
    filtered = filterByPrecipitation(filtered, locations, filters.precipitation, logger)
  }

  // Apply wind filter if specified
  if (filters.wind && filters.wind !== '') {
    filtered = filterByWind(filtered, locations, filters.wind, logger)
  }

  // Log final filtering result
  logger(`Weather filtering: ${startCount} -> ${filtered.length} POIs`)

  return filtered
}

/**
 * Filter locations by temperature preference
 * Uses percentile-based approach for seasonal relevance
 *
 * @param {Array<Object>} filtered - Current filtered locations
 * @param {Array<Object>} all - All original locations (for percentile calculation)
 * @param {string} preference - Temperature preference: 'cold', 'hot', 'mild'
 * @param {Function} logger - Logging function
 * @returns {Array<Object>} Temperature-filtered locations
 */
function filterByTemperature(filtered, all, preference, logger) {
  // Calculate temperature percentiles from all locations
  const temps = all.map(loc => loc.temperature).sort((a, b) => a - b)
  const tempCount = temps.length

  switch (preference) {
    case 'cold':
      // Show coldest 40% of available temperatures
      const coldThreshold = temps[Math.floor(tempCount * 0.4)]
      const coldFiltered = filtered.filter(loc => loc.temperature <= coldThreshold)
      logger(`Cold filter: temps <= ${coldThreshold}F`)
      return coldFiltered

    case 'hot':
      // Show hottest 40% of available temperatures
      const hotThreshold = temps[Math.floor(tempCount * 0.6)]
      const hotFiltered = filtered.filter(loc => loc.temperature >= hotThreshold)
      logger(`Hot filter: temps >= ${hotThreshold}F`)
      return hotFiltered

    case 'mild':
      // Show middle 80% of temperatures (exclude extreme 10% on each end)
      const mildMin = temps[Math.floor(tempCount * 0.1)]
      const mildMax = temps[Math.floor(tempCount * 0.9)]
      const mildFiltered = filtered.filter(loc =>
        loc.temperature >= mildMin && loc.temperature <= mildMax
      )
      logger(`Mild filter: temps ${mildMin}F - ${mildMax}F`)
      return mildFiltered

    default:
      return filtered
  }
}

/**
 * Filter locations by precipitation preference
 * Uses percentile-based approach for relative filtering
 *
 * @param {Array<Object>} filtered - Current filtered locations
 * @param {Array<Object>} all - All original locations (for percentile calculation)
 * @param {string} preference - Precipitation preference: 'none', 'light', 'heavy'
 * @param {Function} logger - Logging function
 * @returns {Array<Object>} Precipitation-filtered locations
 */
function filterByPrecipitation(filtered, all, preference, logger) {
  // Calculate precipitation percentiles from all locations
  const precips = all.map(loc => loc.precipitation).sort((a, b) => a - b)
  const precipCount = precips.length

  switch (preference) {
    case 'none':
      // Show driest 60% of available locations
      const noneThreshold = precips[Math.floor(precipCount * 0.6)]
      const noneFiltered = filtered.filter(loc => loc.precipitation <= noneThreshold)
      logger(`No precip filter: precip <= ${noneThreshold}%`)
      return noneFiltered

    case 'light':
      // Show middle precipitation range (20th-70th percentile)
      const lightMin = precips[Math.floor(precipCount * 0.2)]
      const lightMax = precips[Math.floor(precipCount * 0.7)]
      const lightFiltered = filtered.filter(loc =>
        loc.precipitation >= lightMin && loc.precipitation <= lightMax
      )
      logger(`Light precip filter: precip ${lightMin}% - ${lightMax}%`)
      return lightFiltered

    case 'heavy':
      // Show wettest 30% of available locations
      const heavyThreshold = precips[Math.floor(precipCount * 0.7)]
      const heavyFiltered = filtered.filter(loc => loc.precipitation >= heavyThreshold)
      logger(`Heavy precip filter: precip >= ${heavyThreshold}%`)
      return heavyFiltered

    default:
      return filtered
  }
}

/**
 * Filter locations by wind preference
 * Uses percentile-based approach for relative filtering
 *
 * @param {Array<Object>} filtered - Current filtered locations
 * @param {Array<Object>} all - All original locations (for percentile calculation)
 * @param {string} preference - Wind preference: 'calm', 'breezy', 'windy'
 * @param {Function} logger - Logging function
 * @returns {Array<Object>} Wind-filtered locations
 */
function filterByWind(filtered, all, preference, logger) {
  // Calculate wind speed percentiles from all locations
  const winds = all.map(loc => loc.windSpeed || 0).sort((a, b) => a - b)
  const windCount = winds.length

  switch (preference) {
    case 'calm':
      // Show calmest 50% of available locations
      const calmThreshold = winds[Math.floor(windCount * 0.5)]
      const calmFiltered = filtered.filter(loc => (loc.windSpeed || 0) <= calmThreshold)
      logger(`Calm filter: wind <= ${calmThreshold}mph`)
      return calmFiltered

    case 'breezy':
      // Show middle wind range (30th-70th percentile)
      const breezyMin = winds[Math.floor(windCount * 0.3)]
      const breezyMax = winds[Math.floor(windCount * 0.7)]
      const breezyFiltered = filtered.filter(loc => {
        const windSpeed = loc.windSpeed || 0
        return windSpeed >= breezyMin && windSpeed <= breezyMax
      })
      logger(`Breezy filter: wind ${breezyMin} - ${breezyMax}mph`)
      return breezyFiltered

    case 'windy':
      // Show windiest 30% of available locations
      const windyThreshold = winds[Math.floor(windCount * 0.7)]
      const windyFiltered = filtered.filter(loc => (loc.windSpeed || 0) >= windyThreshold)
      logger(`Windy filter: wind >= ${windyThreshold}mph`)
      return windyFiltered

    default:
      return filtered
  }
}

/**
 * Calculate percentile threshold from sorted array
 * Helper utility for percentile-based filtering
 *
 * @param {Array<number>} sortedValues - Sorted array of numeric values
 * @param {number} percentile - Percentile (0.0 to 1.0)
 * @returns {number} Value at the specified percentile
 *
 * @example
 * const temps = [40, 50, 60, 70, 80].sort((a, b) => a - b);
 * const median = calculatePercentileThreshold(temps, 0.5); // 60
 */
export function calculatePercentileThreshold(sortedValues, percentile) {
  if (!sortedValues || sortedValues.length === 0) return 0
  const index = Math.floor(sortedValues.length * percentile)
  return sortedValues[Math.min(index, sortedValues.length - 1)]
}

/**
 * Validate filter preferences object
 * Ensures filter values are valid options
 *
 * @param {Object} filters - Filter preferences to validate
 * @returns {boolean} True if filters are valid
 *
 * @example
 * validateFilters({ temperature: 'mild' }); // true
 * validateFilters({ temperature: 'invalid' }); // false
 */
export function validateFilters(filters) {
  const validTemperatures = ['', 'cold', 'hot', 'mild']
  const validPrecipitation = ['', 'none', 'light', 'heavy']
  const validWind = ['', 'calm', 'breezy', 'windy']

  if (filters.temperature && !validTemperatures.includes(filters.temperature)) {
    return false
  }

  if (filters.precipitation && !validPrecipitation.includes(filters.precipitation)) {
    return false
  }

  if (filters.wind && !validWind.includes(filters.wind)) {
    return false
  }

  return true
}

// Default export for convenience
export default {
  applyWeatherFilters,
  calculatePercentileThreshold,
  validateFilters
}
