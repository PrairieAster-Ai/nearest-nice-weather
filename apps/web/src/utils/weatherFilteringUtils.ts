/**
 * ========================================================================
 * WEATHER FILTERING UTILITIES - EXTRACTED PURE FUNCTIONS
 * ========================================================================
 *
 * 📋 PURPOSE: Pure weather-filtering functions (percentile thresholds + bucket filters)
 * 🔗 EXTRACTED_FROM: services/WeatherFilteringService.ts
 * 🎯 BUSINESS_IMPACT: Accurate weather filtering for optimal outdoor activity discovery
 *
 * Types/constants live in {@link ./weatherFilteringTypes} and the geographic
 * helpers (distance, bounds, sorting, stats) live in {@link ./geoUtils}; both are
 * re-exported below so existing callers keep importing everything from here.
 *
 * @CLAUDE_CONTEXT: Pure function extraction for comprehensive weather filtering testing
 */

import {
  WEATHER_PERCENTILES,
  type Location,
  type WeatherFilters,
  type Coordinates,
  type FilterCounts,
  type WeatherThresholds,
  type PrecipitationThresholds,
  type WindThresholds,
} from './weatherFilteringTypes';
import { filterByDistance } from './geoUtils';

// Re-export shared types/constants and geographic helpers so callers can keep
// importing the whole filtering surface from this module.
export {
  EARTH_RADIUS_MILES,
  WEATHER_PERCENTILES,
} from './weatherFilteringTypes';
export type {
  Coordinates,
  Location,
  WeatherFilters,
  FilterCounts,
  WeatherThresholds,
  PrecipitationThresholds,
  WindThresholds,
} from './weatherFilteringTypes';
export {
  calculateDistance,
  filterByDistance,
  sortByDistance,
  isValidCoordinates,
  isWithinMinnesotaBounds,
  getClosestLocation,
  calculateLocationStats,
} from './geoUtils';

/**
 * Calculate temperature-based filtering thresholds from location data
 * @param locations - Array of locations to analyze
 * @returns Temperature thresholds for filtering
 */
export function calculateTemperatureThresholds(locations: Location[]): WeatherThresholds {
  if (locations.length === 0) {
    return { cold: 0, hot: 100, mildMin: 0, mildMax: 100 };
  }

  const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b);
  const tempCount = temps.length;

  return {
    cold: temps[Math.floor(tempCount * WEATHER_PERCENTILES.COLD_THRESHOLD)],
    hot: temps[Math.floor(tempCount * WEATHER_PERCENTILES.HOT_THRESHOLD)],
    mildMin: temps[Math.floor(tempCount * WEATHER_PERCENTILES.MILD_MIN)],
    mildMax: temps[Math.floor(tempCount * WEATHER_PERCENTILES.MILD_MAX)]
  };
}

/**
 * Calculate precipitation-based filtering thresholds from location data
 * @param locations - Array of locations to analyze
 * @returns Precipitation thresholds for filtering
 */
export function calculatePrecipitationThresholds(locations: Location[]): PrecipitationThresholds {
  if (locations.length === 0) {
    return { dry: 0, lightMin: 0, lightMax: 0, heavy: 0 };
  }

  const precips = locations.map(loc => loc.precipitation).sort((a, b) => a - b);
  const precipCount = precips.length;

  return {
    dry: precips[Math.floor(precipCount * WEATHER_PERCENTILES.DRY_THRESHOLD)],
    lightMin: precips[Math.floor(precipCount * WEATHER_PERCENTILES.LIGHT_MIN)],
    lightMax: precips[Math.floor(precipCount * WEATHER_PERCENTILES.LIGHT_MAX)],
    heavy: precips[Math.floor(precipCount * WEATHER_PERCENTILES.HEAVY_THRESHOLD)]
  };
}

/**
 * Calculate wind-based filtering thresholds from location data
 * @param locations - Array of locations to analyze
 * @returns Wind thresholds for filtering
 */
export function calculateWindThresholds(locations: Location[]): WindThresholds {
  if (locations.length === 0) {
    return { calm: 0, breezyMin: 0, breezyMax: 0, windy: 0 };
  }

  const winds = locations.map(loc => loc.windSpeed).sort((a, b) => a - b);
  const windCount = winds.length;

  return {
    calm: winds[Math.floor(windCount * WEATHER_PERCENTILES.CALM_THRESHOLD)],
    breezyMin: winds[Math.floor(windCount * WEATHER_PERCENTILES.BREEZY_MIN)],
    breezyMax: winds[Math.floor(windCount * WEATHER_PERCENTILES.BREEZY_MAX)],
    windy: winds[Math.floor(windCount * WEATHER_PERCENTILES.WINDY_THRESHOLD)]
  };
}

/**
 * Apply temperature filtering to locations using calculated thresholds
 * @param locations - Array of locations to filter
 * @param thresholds - Temperature thresholds
 * @param temperatureFilter - Temperature filter type
 * @returns Filtered locations
 */
export function applyTemperatureFilter(
  locations: Location[],
  thresholds: WeatherThresholds,
  temperatureFilter?: string
): Location[] {
  if (!temperatureFilter || temperatureFilter.length === 0) {
    return locations;
  }

  switch (temperatureFilter) {
    case 'cold':
      return locations.filter(loc => loc.temperature <= thresholds.cold);
    case 'hot':
      return locations.filter(loc => loc.temperature >= thresholds.hot);
    case 'mild':
      return locations.filter(loc =>
        loc.temperature >= thresholds.mildMin && loc.temperature <= thresholds.mildMax
      );
    default:
      return locations;
  }
}

/**
 * Apply precipitation filtering to locations using calculated thresholds
 * @param locations - Array of locations to filter
 * @param thresholds - Precipitation thresholds
 * @param precipitationFilter - Precipitation filter type
 * @returns Filtered locations
 */
export function applyPrecipitationFilter(
  locations: Location[],
  thresholds: PrecipitationThresholds,
  precipitationFilter?: string
): Location[] {
  if (!precipitationFilter || precipitationFilter.length === 0) {
    return locations;
  }

  switch (precipitationFilter) {
    case 'none':
      return locations.filter(loc => loc.precipitation <= thresholds.dry);
    case 'light':
      return locations.filter(loc =>
        loc.precipitation >= thresholds.lightMin && loc.precipitation <= thresholds.lightMax
      );
    case 'heavy':
      return locations.filter(loc => loc.precipitation >= thresholds.heavy);
    default:
      return locations;
  }
}

/**
 * Apply wind filtering to locations using calculated thresholds
 * @param locations - Array of locations to filter
 * @param thresholds - Wind thresholds
 * @param windFilter - Wind filter type
 * @returns Filtered locations
 */
export function applyWindFilter(
  locations: Location[],
  thresholds: WindThresholds,
  windFilter?: string
): Location[] {
  if (!windFilter || windFilter.length === 0) {
    return locations;
  }

  switch (windFilter) {
    case 'calm':
      return locations.filter(loc => loc.windSpeed <= thresholds.calm);
    case 'breezy':
      return locations.filter(loc =>
        loc.windSpeed >= thresholds.breezyMin && loc.windSpeed <= thresholds.breezyMax
      );
    case 'windy':
      return locations.filter(loc => loc.windSpeed >= thresholds.windy);
    default:
      return locations;
  }
}

/**
 * Apply comprehensive weather filtering to locations
 * @param locations - Array of locations to filter
 * @param allLocations - All locations for threshold calculation
 * @param filters - Weather filter preferences
 * @param userLocation - User's current position for distance filtering
 * @param maxDistance - Maximum distance in miles
 * @returns Filtered array of locations matching criteria
 */
export function applyWeatherFilters(
  locations: Location[],
  allLocations: Location[],
  filters: WeatherFilters,
  userLocation?: Coordinates,
  maxDistance?: number
): Location[] {
  if (locations.length === 0) return [];

  let filtered = [...locations];

  // Apply distance filtering if specified
  if (maxDistance && userLocation) {
    filtered = filterByDistance(filtered, userLocation, maxDistance);
  }

  // Calculate thresholds from all locations for consistency
  const tempThresholds = calculateTemperatureThresholds(allLocations);
  const precipThresholds = calculatePrecipitationThresholds(allLocations);
  const windThresholds = calculateWindThresholds(allLocations);

  // Apply weather filters
  filtered = applyTemperatureFilter(filtered, tempThresholds, filters.temperature);
  filtered = applyPrecipitationFilter(filtered, precipThresholds, filters.precipitation);
  filtered = applyWindFilter(filtered, windThresholds, filters.wind);

  return filtered;
}

/**
 * Calculate simplified filter result counts for UI badges
 * @param visiblePOIs - Currently visible POIs
 * @returns Filter counts for badge display
 */
export function calculateFilterResultCounts(visiblePOIs: Location[]): FilterCounts {
  if (!visiblePOIs || visiblePOIs.length === 0) return {};

  // Simplified approach: return current visible POI count for all options
  // This prevents expensive recalculations and potential infinite loops
  const count = visiblePOIs.length;
  const counts: FilterCounts = {};

  const filterOptions = ['cold', 'mild', 'hot', 'none', 'light', 'heavy', 'calm', 'breezy', 'windy'];
  filterOptions.forEach(option => {
    counts[`temperature_${option}`] = count;
    counts[`precipitation_${option}`] = count;
    counts[`wind_${option}`] = count;
  });

  return counts;
}
