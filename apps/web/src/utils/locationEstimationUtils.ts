/**
 * ========================================================================
 * LOCATION ESTIMATION UTILITIES - EXTRACTED GEOLOCATION ALGORITHMS
 * ========================================================================
 *
 * 📋 PURPOSE: Pure functions extracted from UserLocationEstimator for testability
 * 🔗 EXTRACTED_FROM: services/UserLocationEstimator.ts - intelligent positioning service
 * 📊 COVERAGE: Location scoring, confidence calculation, accuracy estimation, validation
 * ⚙️ FUNCTIONALITY: Geographic algorithms for location estimation and quality assessment
 * 🎯 BUSINESS_IMPACT: Ensures accurate location estimation for outdoor recreation discovery
 *
 * BUSINESS CONTEXT: Location intelligence for Minnesota outdoor enthusiasts
 * - Calculates location confidence and accuracy for user positioning
 * - Provides Minnesota-specific optimizations for better local accuracy
 * - Enables intelligent fallback strategies for location estimation
 * - Supports privacy-aware location caching and validation
 *
 * TECHNICAL DETAILS: Pure functions for location quality assessment
 * - Location confidence scoring based on accuracy and age
 * - Minnesota-specific IP geolocation accuracy improvements
 * - Location estimate scoring for method comparison
 * - Cache validation and location summary generation
 *
 * EXTRACTED FROM: UserLocationEstimator class to improve testability and maintainability
 * @CLAUDE_CONTEXT: Pure function extraction for comprehensive geolocation testing
 */

// Constants for location estimation
export const LOCATION_CONFIDENCE_THRESHOLDS = {
  HIGH_ACCURACY_METERS: 50,
  HIGH_AGE_MINUTES: 5,
  MEDIUM_ACCURACY_METERS: 1000,
  MEDIUM_AGE_MINUTES: 30,
  LOW_ACCURACY_METERS: 10000,
} as const;

export const MINNESOTA_ACCURACY_ESTIMATES = {
  URBAN_METERS: 3000,    // ~3km for Minnesota urban areas
  RURAL_METERS: 15000,   // ~15km for rural Minnesota
  GENERAL_URBAN_METERS: 5000,   // ~5km for urban areas
  GENERAL_RURAL_METERS: 25000,  // ~25km for rural areas
} as const;

export const CONFIDENCE_SCORES = {
  high: 100,
  medium: 75,
  low: 50,
  unknown: 25
} as const;

export const METHOD_SCORES = {
  gps: 100,
  network: 80,
  manual: 75,
  cached: 60,
  ip: 40,
  fallback: 10,
  none: 0
} as const;

// Type definitions (extracted from UserLocationEstimator)
export type LocationMethod =
  | 'gps'           // High accuracy GPS
  | 'network'       // Network-based (WiFi/cell towers)
  | 'ip'           // IP geolocation
  | 'cached'       // Previously stored location
  | 'manual'       // User-set location
  | 'fallback'     // Default Minneapolis center
  | 'none';        // No location available

export type LocationConfidence = 'high' | 'medium' | 'low' | 'unknown';

export interface LocationEstimate {
  coordinates: [number, number]; // [latitude, longitude]
  accuracy: number; // Accuracy in meters (approximate)
  method: LocationMethod;
  timestamp: number; // Unix timestamp
  confidence: LocationConfidence;
  source?: string; // Optional source identifier
}

/**
 * Calculate location confidence based on accuracy and age
 * @param accuracy - Accuracy in meters
 * @param timestamp - Location timestamp
 * @returns Location confidence level
 */
export function calculateConfidence(accuracy: number, timestamp: number): LocationConfidence {
  const age = Date.now() - timestamp;

  if (accuracy < LOCATION_CONFIDENCE_THRESHOLDS.HIGH_ACCURACY_METERS &&
      age < LOCATION_CONFIDENCE_THRESHOLDS.HIGH_AGE_MINUTES * 60 * 1000) {
    return 'high';      // <50m, <5min
  }

  if (accuracy < LOCATION_CONFIDENCE_THRESHOLDS.MEDIUM_ACCURACY_METERS &&
      age < LOCATION_CONFIDENCE_THRESHOLDS.MEDIUM_AGE_MINUTES * 60 * 1000) {
    return 'medium';    // <1km, <30min
  }

  if (accuracy < LOCATION_CONFIDENCE_THRESHOLDS.LOW_ACCURACY_METERS) {
    return 'low';       // <10km
  }

  return 'unknown';
}

/**
 * Estimate IP geolocation accuracy based on location details
 * Minnesota-specific optimizations for better local accuracy
 * @param city - City name from IP geolocation
 * @param region - Region/state name from IP geolocation
 * @returns Estimated accuracy in meters
 */
export function estimateIPAccuracy(city?: string, region?: string): number {
  // Urban areas typically have better IP geolocation
  const urbanCities = ['minneapolis', 'saint paul', 'duluth', 'rochester', 'bloomington', 'st. paul'];
  const cityName = city?.toLowerCase() || '';
  const regionName = region?.toLowerCase() || '';

  // Minnesota-specific accuracy improvements
  if (regionName.includes('minnesota') || regionName.includes('mn')) {
    // Special handling for St. Paul variations
    if (cityName.includes('paul') || urbanCities.some(urbanCity => cityName.includes(urbanCity))) {
      return MINNESOTA_ACCURACY_ESTIMATES.URBAN_METERS; // ~3km for Minnesota urban areas (better ISP mapping)
    }
    return MINNESOTA_ACCURACY_ESTIMATES.RURAL_METERS; // ~15km for rural Minnesota
  }

  // General urban vs rural classification
  if (urbanCities.includes(cityName) || cityName.includes('minneapolis') || cityName.includes('paul')) {
    return MINNESOTA_ACCURACY_ESTIMATES.GENERAL_URBAN_METERS; // ~5km for urban areas
  }

  return MINNESOTA_ACCURACY_ESTIMATES.GENERAL_RURAL_METERS; // ~25km for rural areas
}

/**
 * Calculate IP geolocation confidence based on available location data
 * @param city - City name from IP geolocation
 * @param region - Region/state name from IP geolocation
 * @param country - Country name from IP geolocation
 * @returns Location confidence level
 */
export function calculateIPConfidence(city?: string, region?: string, country?: string): LocationConfidence {
  // Higher confidence for areas with known good IP geolocation
  const hasCity = city && city.toLowerCase() !== 'unknown';
  const hasRegion = region && region.toLowerCase() !== 'unknown';
  const isMinnesota = region?.toLowerCase().includes('minnesota') || region?.toLowerCase().includes('mn');
  const isUS = country?.toLowerCase().includes('us') || country?.toLowerCase().includes('united states');

  if (isMinnesota && hasCity) {
    return 'medium'; // Good confidence for Minnesota cities
  } else if (isUS && hasCity && hasRegion) {
    return 'low'; // Basic confidence for US cities with region
  } else if (hasCity || hasRegion) {
    return 'low'; // Some confidence with partial location data
  } else {
    return 'unknown'; // No confidence without location details
  }
}

/**
 * Score a location estimate for quality comparison
 * @param estimate - Location estimate to score
 * @returns Numerical score (0-100) where higher is better
 */
export function scoreEstimate(estimate: LocationEstimate): number {
  const ageScore = Math.max(0, 100 - (Date.now() - estimate.timestamp) / 60000); // Decay over time

  // Handle zero accuracy case to avoid -Infinity from log10(0)
  const safeAccuracy = Math.max(1, estimate.accuracy); // Minimum 1 meter for scoring
  const accuracyScore = Math.max(0, 100 - Math.log10(safeAccuracy));

  return (
    CONFIDENCE_SCORES[estimate.confidence] * 0.3 +
    METHOD_SCORES[estimate.method] * 0.3 +
    accuracyScore * 0.2 +
    ageScore * 0.2
  );
}

/**
 * Check if a cached location is still valid
 * @param location - Cached location estimate
 * @param maxAge - Maximum age in milliseconds
 * @returns True if cache is still valid
 */
export function isCacheValid(location: LocationEstimate, maxAge: number): boolean {
  return (Date.now() - location.timestamp) < maxAge;
}

/**
 * Generate human-readable location summary
 * @param estimate - Location estimate to summarize
 * @returns Formatted summary string
 */
export function getLocationSummary(estimate: LocationEstimate): string {
  const accuracy = estimate.accuracy < 1000
    ? `±${Math.round(estimate.accuracy)}m`
    : `±${Math.round(estimate.accuracy / 1000)}km`;

  const age = Date.now() - estimate.timestamp;
  const ageText = age < 60000
    ? 'just now'
    : age < 3600000
      ? `${Math.round(age / 60000)}min ago`
      : `${Math.round(age / 3600000)}h ago`;

  const methodText = {
    'gps': 'GPS',
    'network': 'Network',
    'ip': 'IP Location',
    'cached': 'Cached',
    'manual': 'Manual',
    'fallback': 'Default',
    'none': 'Unknown'
  }[estimate.method];

  return `${methodText} (${accuracy}) • ${ageText}`;
}

/**
 * Get privacy summary for location data
 * @param cachedLocation - Currently cached location or null
 * @returns Privacy information about stored data
 */
export function getPrivacySummary(cachedLocation: LocationEstimate | null): {
  hasStoredData: boolean;
  lastUpdate: number | null;
  dataAge: string;
} {
  if (!cachedLocation) {
    return {
      hasStoredData: false,
      lastUpdate: null,
      dataAge: 'No stored location data'
    };
  }

  const age = Date.now() - cachedLocation.timestamp;
  const dataAge = age < 3600000
    ? `${Math.round(age / 60000)} minutes ago`
    : age < 86400000
      ? `${Math.round(age / 3600000)} hours ago`
      : `${Math.round(age / 86400000)} days ago`;

  return {
    hasStoredData: true,
    lastUpdate: cachedLocation.timestamp,
    dataAge: `Last updated ${dataAge}`
  };
}

/**
 * Validate geographic coordinates
 * @param coordinates - [latitude, longitude] pair
 * @returns True if coordinates are valid
 */
export function isValidLocationCoordinates(coordinates: [number, number]): boolean {
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
export function isWithinExpectedRegion(coordinates: [number, number]): boolean {
  if (!isValidLocationCoordinates(coordinates)) {
    return false;
  }

  const [lat, lng] = coordinates;

  // Extended Upper Midwest bounds (Minnesota + surrounding states)
  const UPPER_MIDWEST_BOUNDS = {
    north: 50.0,  // Canadian border
    south: 40.0,  // Southern border of region
    east: -85.0,  // Eastern boundary
    west: -105.0  // Western boundary
  };

  return lat >= UPPER_MIDWEST_BOUNDS.south &&
         lat <= UPPER_MIDWEST_BOUNDS.north &&
         lng >= UPPER_MIDWEST_BOUNDS.west &&
         lng <= UPPER_MIDWEST_BOUNDS.east;
}

/**
 * Create a fallback location estimate for Minnesota
 * @param coordinates - Optional coordinates (defaults to Minneapolis)
 * @param method - Location method to use
 * @returns Fallback location estimate
 */
export function createFallbackLocation(
  coordinates: [number, number] = [44.9537, -93.0900], // Minneapolis center
  method: LocationMethod = 'fallback'
): LocationEstimate {
  return {
    coordinates,
    accuracy: 50000, // 50km accuracy for fallback
    method,
    timestamp: Date.now(),
    confidence: 'low',
    source: 'minnesota-fallback'
  };
}

/**
 * Calculate age of location estimate in milliseconds
 * @param estimate - Location estimate
 * @returns Age in milliseconds
 */
export function getLocationAge(estimate: LocationEstimate): number {
  return Date.now() - estimate.timestamp;
}

/**
 * Format location coordinates for display
 * @param coordinates - [latitude, longitude] pair
 * @param precision - Number of decimal places (default: 4)
 * @returns Formatted coordinate string
 */
export function formatCoordinates(coordinates: [number, number], precision: number = 4): string {
  const [lat, lng] = coordinates;
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Compare two location estimates and return the better one
 * @param estimate1 - First location estimate
 * @param estimate2 - Second location estimate
 * @returns The better estimate based on scoring
 */
export function selectBestEstimate(estimate1: LocationEstimate, estimate2: LocationEstimate): LocationEstimate {
  const score1 = scoreEstimate(estimate1);
  const score2 = scoreEstimate(estimate2);

  return score1 >= score2 ? estimate1 : estimate2;
}

/**
 * Filter location estimates by minimum confidence level
 * @param estimates - Array of location estimates
 * @param minConfidence - Minimum confidence level required
 * @returns Filtered estimates meeting confidence requirement
 */
export function filterByConfidence(
  estimates: LocationEstimate[],
  minConfidence: LocationConfidence
): LocationEstimate[] {
  const confidenceOrder: LocationConfidence[] = ['unknown', 'low', 'medium', 'high'];
  const minIndex = confidenceOrder.indexOf(minConfidence);

  if (minIndex === -1) {
    return estimates; // Invalid confidence level, return all
  }

  return estimates.filter(estimate => {
    const estimateIndex = confidenceOrder.indexOf(estimate.confidence);
    return estimateIndex >= minIndex;
  });
}

/**
 * Create a location estimate from browser geolocation result
 * @param position - GeolocationPosition from browser API
 * @returns Standardized location estimate
 */
export function createLocationFromGeolocation(position: GeolocationPosition): LocationEstimate {
  return {
    coordinates: [position.coords.latitude, position.coords.longitude],
    accuracy: position.coords.accuracy || 10000, // Default to 10km if not provided
    method: 'gps',
    timestamp: position.timestamp || Date.now(),
    confidence: calculateConfidence(position.coords.accuracy || 10000, position.timestamp || Date.now()),
    source: 'browser-geolocation'
  };
}
