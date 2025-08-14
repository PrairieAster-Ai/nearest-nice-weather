/**
 * ========================================================================
 * WEATHER FILTERING UTILITIES - EXTRACTED PURE FUNCTIONS
 * ========================================================================
 * 
 * 📋 PURPOSE: Pure functions extracted from WeatherFilteringService for testability
 * 🔗 EXTRACTED_FROM: services/WeatherFilteringService.ts - Weather filtering service
 * 📊 COVERAGE: Weather filtering algorithms, distance calculations, percentile calculations
 * ⚙️ FUNCTIONALITY: Geographic and weather-based filtering for outdoor recreation
 * 🎯 BUSINESS_IMPACT: Ensures accurate weather filtering for optimal outdoor activity discovery
 * 
 * BUSINESS CONTEXT: Weather filtering for Minnesota outdoor enthusiasts
 * - Calculates percentile-based weather thresholds for relative filtering
 * - Provides distance-based filtering for geographic constraints
 * - Enables intelligent location sorting and filtering for outdoor activities
 * - Supports badge count calculations for UI feedback
 * 
 * TECHNICAL DETAILS: Pure functions for weather and geographic filtering
 * - Haversine formula for accurate distance calculations
 * - Percentile-based thresholds for relative weather classification
 * - Distance sorting and filtering algorithms
 * - Weather threshold calculations for cold/mild/hot classification
 * 
 * EXTRACTED FROM: WeatherFilteringService class to improve testability and maintainability
 * @CLAUDE_CONTEXT: Pure function extraction for comprehensive weather filtering testing
 */

// Constants for weather filtering
export const EARTH_RADIUS_MILES = 3959;

export const WEATHER_PERCENTILES = {
  // Temperature filtering percentiles
  COLD_THRESHOLD: 0.4,     // Coldest 40%
  HOT_THRESHOLD: 0.6,      // Hottest 40% (starting from 60th percentile)
  MILD_MIN: 0.1,          // Exclude extreme 10% cold
  MILD_MAX: 0.9,          // Exclude extreme 10% hot
  
  // Precipitation filtering percentiles
  DRY_THRESHOLD: 0.6,      // Driest 60%
  LIGHT_MIN: 0.2,         // Light rain range 20th-70th percentile
  LIGHT_MAX: 0.7,
  HEAVY_THRESHOLD: 0.7,    // Wettest 30%
  
  // Wind filtering percentiles
  CALM_THRESHOLD: 0.5,     // Calmest 50%
  BREEZY_MIN: 0.3,        // Breezy range 30th-70th percentile
  BREEZY_MAX: 0.7,
  WINDY_THRESHOLD: 0.7     // Windiest 30%
} as const;

// Type definitions
export type Coordinates = [number, number]; // [latitude, longitude]

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
  description: string;
}

export interface WeatherFilters {
  temperature?: 'cold' | 'mild' | 'hot' | '';
  precipitation?: 'none' | 'light' | 'heavy' | '';
  wind?: 'calm' | 'breezy' | 'windy' | '';
}

export interface FilterCounts {
  [key: string]: number;
}

export interface WeatherThresholds {
  cold: number;
  hot: number;
  mildMin: number;
  mildMax: number;
}

export interface PrecipitationThresholds {
  dry: number;
  lightMin: number;
  lightMax: number;
  heavy: number;
}

export interface WindThresholds {
  calm: number;
  breezyMin: number;
  breezyMax: number;
  windy: number;
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param point1 - First coordinate [latitude, longitude]
 * @param point2 - Second coordinate [latitude, longitude]
 * @returns Distance in miles
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const [lat1, lng1] = point1;
  const [lat2, lng2] = point2;
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_MILES * c;
}

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
 * Filter locations by distance from a user location
 * @param locations - Array of locations to filter
 * @param userLocation - User's current coordinates
 * @param maxDistance - Maximum distance in miles
 * @returns Locations within the specified distance
 */
export function filterByDistance(
  locations: Location[],
  userLocation: Coordinates,
  maxDistance: number
): Location[] {
  return locations.filter(loc => {
    const distance = calculateDistance(userLocation, [loc.lat, loc.lng]);
    return distance <= maxDistance;
  });
}

/**
 * Sort locations by distance from user location
 * @param locations - Array of locations to sort
 * @param userLocation - User's current coordinates
 * @returns Locations sorted by distance (closest first)
 */
export function sortByDistance(
  locations: Location[],
  userLocation: Coordinates
): Location[] {
  return [...locations].sort((a, b) => {
    const distanceA = calculateDistance(userLocation, [a.lat, a.lng]);
    const distanceB = calculateDistance(userLocation, [b.lat, b.lng]);
    return distanceA - distanceB;
  });
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

/**
 * Validate geographic coordinates
 * @param coordinates - [latitude, longitude] pair
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(coordinates: Coordinates | null): boolean {
  if (!coordinates || coordinates.length !== 2) {
    return false;
  }
  
  const [lat, lng] = coordinates;
  
  // Check for NaN or Infinity
  if (!isFinite(lat) || !isFinite(lng)) {
    return false;
  }
  
  // Valid latitude: -90 to 90
  if (lat < -90 || lat > 90) {
    return false;
  }
  
  // Valid longitude: -180 to 180
  if (lng < -180 || lng > 180) {
    return false;
  }
  
  return true;
}

/**
 * Check if coordinates are within reasonable bounds for Minnesota/Upper Midwest
 * @param coordinates - [latitude, longitude] pair
 * @returns True if coordinates are within expected regional bounds
 */
export function isWithinMinnesotaBounds(coordinates: Coordinates): boolean {
  if (!isValidCoordinates(coordinates)) {
    return false;
  }
  
  const [lat, lng] = coordinates;
  
  // Minnesota bounds (with some buffer)
  const MINNESOTA_BOUNDS = {
    north: 49.5,   // Canadian border
    south: 43.0,   // Iowa border
    east: -89.0,   // Wisconsin border
    west: -97.5    // Dakotas border
  };
  
  return lat >= MINNESOTA_BOUNDS.south && 
         lat <= MINNESOTA_BOUNDS.north && 
         lng >= MINNESOTA_BOUNDS.west && 
         lng <= MINNESOTA_BOUNDS.east;
}

/**
 * Get the closest location from an array of locations
 * @param locations - Array of locations to search
 * @param userLocation - User's current coordinates
 * @returns Closest location or null if no locations
 */
export function getClosestLocation(
  locations: Location[],
  userLocation: Coordinates
): Location | null {
  if (locations.length === 0) return null;
  
  return locations.reduce((closest, current) => {
    const currentDistance = calculateDistance(userLocation, [current.lat, current.lng]);
    const closestDistance = calculateDistance(userLocation, [closest.lat, closest.lng]);
    
    return currentDistance < closestDistance ? current : closest;
  });
}

/**
 * Calculate statistics about location distribution
 * @param locations - Array of locations to analyze
 * @param userLocation - User's current coordinates
 * @returns Statistics about distance distribution
 */
export function calculateLocationStats(
  locations: Location[],
  userLocation: Coordinates
): {
  count: number;
  averageDistance: number;
  medianDistance: number;
  closestDistance: number;
  farthestDistance: number;
} {
  if (locations.length === 0) {
    return {
      count: 0,
      averageDistance: 0,
      medianDistance: 0,
      closestDistance: 0,
      farthestDistance: 0
    };
  }
  
  const distances = locations.map(loc => 
    calculateDistance(userLocation, [loc.lat, loc.lng])
  ).sort((a, b) => a - b);
  
  const averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
  const medianDistance = distances.length % 2 === 0
    ? (distances[distances.length / 2 - 1] + distances[distances.length / 2]) / 2
    : distances[Math.floor(distances.length / 2)];
  
  return {
    count: locations.length,
    averageDistance,
    medianDistance,
    closestDistance: distances[0],
    farthestDistance: distances[distances.length - 1]
  };
}