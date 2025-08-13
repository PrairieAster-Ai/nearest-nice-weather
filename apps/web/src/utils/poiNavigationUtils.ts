/**
 * ========================================================================
 * POI NAVIGATION UTILITIES - EXTRACTED TESTABLE LOGIC
 * ========================================================================
 * 
 * 📋 PURPOSE: Pure functions extracted from usePOINavigation hook for testability
 * 🔗 EXTRACTED_FROM: hooks/usePOINavigation.ts - outdoor recreation discovery algorithm
 * 📊 COVERAGE: Distance calculations, data processing, filtering, expansion logic
 * ⚙️ FUNCTIONALITY: Geographic algorithms, POI organization, intelligent navigation
 * 🎯 BUSINESS_IMPACT: Core outdoor recreation discovery algorithm with distance-based navigation
 * 
 * BUSINESS CONTEXT: Outdoor recreation discovery for Minnesota outdoor enthusiasts
 * - Calculates distances to outdoor recreation destinations (parks, trails, forests)
 * - Organizes POIs into 30-mile distance slices for intelligent navigation
 * - Enables auto-expanding search for users in remote areas
 * - Provides sorting and filtering logic for optimal user experience
 * 
 * TECHNICAL DETAILS: Pure functions for geographic calculations
 * - Haversine formula for accurate distance calculations
 * - Distance-based POI organization and filtering
 * - Auto-expand logic for rural area coverage
 * - Data transformation with weather integration
 * 
 * EXTRACTED FROM: usePOINavigation hook to improve testability and maintainability
 * @CLAUDE_CONTEXT: Pure function extraction for comprehensive unit testing
 */

// Distance calculation constants
export const DISTANCE_SLICE_SIZE = 30; // 30 mile slices
export const EARTH_RADIUS_MILES = 3959; // Earth's radius in miles

// Data processing constants
export const MAX_RESULTS = 50; // Hard-coded API limit

// Type definitions (extracted from usePOINavigation)
export interface POIWithMetadata {
  id: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number;
  precipitation: number;
  windSpeed: string; // Wind speed in mph (string from API)
  condition: string;
  description: string;
  distance: number;
  displayed: boolean;
  sliceIndex: number;
}

export interface POIProcessingResult {
  processedPOIs: POIWithMetadata[];
  totalCount: number;
  closestDistance: number;
  farthestDistance: number;
}

export interface WeatherFilters {
  temp_min: number;
  temp_max: number;
  conditions: string[];
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param point1 - [latitude, longitude] of first point
 * @param point2 - [latitude, longitude] of second point
 * @returns Distance in miles
 */
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
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
 * Calculate slice index for distance-based organization
 * @param distance - Distance in miles
 * @returns Slice index (0 for 0-30mi, 1 for 30-60mi, etc.)
 */
export function calculateSliceIndex(distance: number): number {
  return Math.floor(distance / DISTANCE_SLICE_SIZE);
}

/**
 * Process raw API data into POI objects with distance metadata
 * @param apiData - Raw API response data
 * @param userLocation - User's current location [lat, lng]
 * @returns Processed and sorted POI array with metadata
 */
export function processAPIData(apiData: any[], userLocation: [number, number]): POIProcessingResult {
  if (!apiData || apiData.length === 0) {
    return {
      processedPOIs: [],
      totalCount: 0,
      closestDistance: 0,
      farthestDistance: 0
    };
  }

  const processed = apiData.map((location) => {
    const distance = calculateDistance(userLocation, [location.lat, location.lng]);
    const sliceIndex = calculateSliceIndex(distance);
    
    return {
      id: location.id,
      name: location.name,
      lat: location.lat,
      lng: location.lng,
      temperature: location.temperature,
      precipitation: location.precipitation,
      windSpeed: location.windSpeed,
      condition: location.condition,
      description: location.description,
      distance,
      displayed: false, // Initially not displayed
      sliceIndex
    } as POIWithMetadata;
  });

  // Sort by distance (closest first) with alphabetical secondary sort for consistency
  const sorted = processed.sort((a, b) => {
    if (Math.abs(a.distance - b.distance) < 0.01) { // Same distance (within 0.01 miles)
      return a.name.localeCompare(b.name);
    }
    return a.distance - b.distance;
  });

  return {
    processedPOIs: sorted,
    totalCount: sorted.length,
    closestDistance: sorted.length > 0 ? sorted[0].distance : 0,
    farthestDistance: sorted.length > 0 ? sorted[sorted.length - 1].distance : 0
  };
}

/**
 * Filter POIs by maximum distance (distance-based slicing)
 * @param allPOIs - All available POIs with metadata
 * @param maxDistance - Maximum distance to include in results
 * @returns Filtered POI array within distance limit
 */
export function getVisiblePOIs(allPOIs: POIWithMetadata[], maxDistance: number): POIWithMetadata[] {
  return allPOIs.filter(poi => poi.distance <= maxDistance);
}

/**
 * Check if there are more POIs available beyond current slice
 * @param allPOIs - All available POIs with metadata
 * @param currentMaxDistance - Current maximum distance shown
 * @returns True if more POIs exist beyond current distance
 */
export function checkCanExpand(allPOIs: POIWithMetadata[], currentMaxDistance: number): boolean {
  return allPOIs.some(poi => poi.distance > currentMaxDistance);
}

/**
 * Calculate next expansion distance for auto-expand feature
 * @param currentMaxDistance - Current maximum distance
 * @returns Next distance slice maximum
 */
export function calculateNextExpansionDistance(currentMaxDistance: number): number {
  return currentMaxDistance + DISTANCE_SLICE_SIZE;
}

/**
 * Find optimal starting slice for user location
 * Ensures users always see at least some POIs, expanding automatically if needed
 * @param allPOIs - All available POIs with metadata
 * @param minPOIsDesired - Minimum number of POIs to show (default: 1)
 * @returns Optimal maximum distance to start with
 */
export function findOptimalStartingSlice(
  allPOIs: POIWithMetadata[], 
  minPOIsDesired: number = 1
): number {
  if (allPOIs.length === 0) {
    return DISTANCE_SLICE_SIZE; // Default to first slice
  }

  // Start with first slice
  let currentMaxDistance = DISTANCE_SLICE_SIZE;
  
  // Keep expanding until we have enough POIs or run out of data
  while (true) {
    const visiblePOIs = getVisiblePOIs(allPOIs, currentMaxDistance);
    
    // If we have enough POIs, use this slice
    if (visiblePOIs.length >= minPOIsDesired) {
      return currentMaxDistance;
    }
    
    // If we can't expand further, return current distance
    if (!checkCanExpand(allPOIs, currentMaxDistance)) {
      return currentMaxDistance;
    }
    
    // Expand to next slice
    currentMaxDistance = calculateNextExpansionDistance(currentMaxDistance);
    
    // Safety valve: don't expand beyond reasonable limits
    if (currentMaxDistance > 300) { // 300 miles should cover any reasonable use case
      return 300; // Cap at 300 miles
    }
  }
}

/**
 * Calculate statistics for POI distribution across distance slices
 * @param allPOIs - All available POIs with metadata
 * @returns Distribution statistics for analytics and debugging
 */
export function calculatePOIDistributionStats(allPOIs: POIWithMetadata[]): {
  sliceDistribution: Record<number, number>;
  totalSlices: number;
  averageDistance: number;
  medianDistance: number;
} {
  if (allPOIs.length === 0) {
    return {
      sliceDistribution: {},
      totalSlices: 0,
      averageDistance: 0,
      medianDistance: 0
    };
  }

  // Calculate slice distribution
  const sliceDistribution: Record<number, number> = {};
  let totalDistance = 0;

  allPOIs.forEach(poi => {
    sliceDistribution[poi.sliceIndex] = (sliceDistribution[poi.sliceIndex] || 0) + 1;
    totalDistance += poi.distance;
  });

  // Calculate statistics
  const totalSlices = Math.max(...Object.keys(sliceDistribution).map(Number)) + 1;
  const averageDistance = totalDistance / allPOIs.length;
  
  // Calculate median distance
  const sortedDistances = allPOIs.map(poi => poi.distance).sort((a, b) => a - b);
  const medianDistance = sortedDistances.length % 2 === 0
    ? (sortedDistances[sortedDistances.length / 2 - 1] + sortedDistances[sortedDistances.length / 2]) / 2
    : sortedDistances[Math.floor(sortedDistances.length / 2)];

  return {
    sliceDistribution,
    totalSlices,
    averageDistance,
    medianDistance
  };
}

/**
 * Apply weather filters to POI list
 * @param pois - POI array to filter
 * @param filters - Weather filter criteria
 * @returns Filtered POI array meeting weather criteria
 */
export function applyWeatherFilters(pois: POIWithMetadata[], filters: WeatherFilters): POIWithMetadata[] {
  return pois.filter(poi => {
    // Temperature filter
    if (poi.temperature < filters.temp_min || poi.temperature > filters.temp_max) {
      return false;
    }
    
    // Condition filter (if specified)
    if (filters.conditions.length > 0) {
      if (!filters.conditions.includes(poi.condition)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Validate geographic coordinates
 * @param coordinates - [latitude, longitude] pair
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(coordinates: [number, number] | null): boolean {
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
 * Check if coordinates are within Minnesota (approximate bounds)
 * Used for validation and optimization
 * @param coordinates - [latitude, longitude] pair
 * @returns True if coordinates are within Minnesota bounds
 */
export function isWithinMinnesotaBounds(coordinates: [number, number]): boolean {
  if (!isValidCoordinates(coordinates)) {
    return false;
  }
  
  const [lat, lng] = coordinates;
  
  // Minnesota approximate bounds
  const MN_BOUNDS = {
    north: 49.5, // Canadian border
    south: 43.5, // Iowa border
    east: -89.5, // Wisconsin border
    west: -97.5  // North Dakota border
  };
  
  return lat >= MN_BOUNDS.south && 
         lat <= MN_BOUNDS.north && 
         lng >= MN_BOUNDS.west && 
         lng <= MN_BOUNDS.east;
}