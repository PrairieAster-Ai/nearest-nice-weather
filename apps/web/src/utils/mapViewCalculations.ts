/**
 * ========================================================================
 * MAP VIEW CALCULATION UTILITIES
 * ========================================================================
 *
 * 📋 PURPOSE: Extracted testable map view calculation logic from App.tsx
 * 🔗 DEPENDENCIES: MapCalculationService for optimal view calculations
 * 📊 COVERAGE: Pure functions for map center and zoom calculations
 * ⚙️ FUNCTIONALITY: Location-aware map view optimization
 * 🎯 BUSINESS_IMPACT: Optimal map views improve user experience and POI discovery
 *
 * BUSINESS CONTEXT: Map view optimization for POI discovery
 * - Calculates optimal map center and zoom for multiple POIs
 * - Handles user location integration for proximity-based views
 * - Provides fallback calculations for edge cases
 *
 * TECHNICAL CONTEXT: Pure utility functions
 * - No side effects or React dependencies
 * - Easily testable mathematical calculations
 * - Compatible with existing MapViewManager hook
 *
 * EXTRACTED FROM: App.tsx lines 287-308 (map view calculation logic)
 *
 * LAST UPDATED: 2025-08-13
 */

export interface LocationPoint {
  id: string
  name: string
  lat: number
  lng: number
}

export interface MapViewBounds {
  center: [number, number]
  zoom: number
}

/**
 * Calculate optimal map view for a set of locations
 * @param locations Array of location points to include in view
 * @param userLocation Optional user location to prioritize in view
 * @returns Optimal center and zoom level
 */
export function calculateOptimalMapView(
  locations: LocationPoint[],
  userLocation?: [number, number] | null
): MapViewBounds {
  if (locations.length === 0) {
    // Fallback to Minnesota center if no locations
    return {
      center: [44.9537, -93.0900], // Minneapolis center
      zoom: 7
    }
  }

  if (locations.length === 1) {
    // Single location - center on it with reasonable zoom
    const location = locations[0]
    return {
      center: [location.lat, location.lng],
      zoom: userLocation ? 10 : 8
    }
  }

  // Multiple locations - calculate bounds
  const bounds = calculateLocationBounds(locations, userLocation)

  return {
    center: bounds.center,
    zoom: bounds.zoom
  }
}

/**
 * Calculate bounding box and optimal zoom for locations
 * @param locations Array of locations to bound
 * @param userLocation Optional user location to include in bounds
 * @returns Center point and zoom level
 */
export function calculateLocationBounds(
  locations: LocationPoint[],
  userLocation?: [number, number] | null
): MapViewBounds {
  const allPoints = [...locations]

  // Include user location in bounds calculation if available
  if (userLocation) {
    allPoints.push({
      id: 'user',
      name: 'User Location',
      lat: userLocation[0],
      lng: userLocation[1]
    })
  }

  if (allPoints.length === 0) {
    return {
      center: [44.9537, -93.0900],
      zoom: 7
    }
  }

  // Calculate bounding box
  const lats = allPoints.map(point => point.lat)
  const lngs = allPoints.map(point => point.lng)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  // Calculate center point
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2

  // Calculate zoom based on bounds size
  const latDiff = maxLat - minLat
  const lngDiff = maxLng - minLng
  const maxDiff = Math.max(latDiff, lngDiff)

  // Zoom calculation based on geographic span
  let zoom = 10 // Default zoom
  if (maxDiff > 5) zoom = 6      // Very wide area
  else if (maxDiff > 2) zoom = 7  // Wide area
  else if (maxDiff > 1) zoom = 8  // Moderate area
  else if (maxDiff > 0.5) zoom = 9 // Small area
  else zoom = 10                  // Very small area

  return {
    center: [centerLat, centerLng],
    zoom
  }
}

/**
 * Calculate distance between two geographic points
 * @param point1 First coordinate pair [lat, lng]
 * @param point2 Second coordinate pair [lat, lng]
 * @returns Distance in miles
 */
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lat1, lng1] = point1
  const [lat2, lng2] = point2

  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Check if a location point is within a given radius of a center point
 * @param location Location to check
 * @param center Center point for radius check
 * @param radiusMiles Radius in miles
 * @returns True if location is within radius
 */
export function isLocationWithinRadius(
  location: LocationPoint,
  center: [number, number],
  radiusMiles: number
): boolean {
  const distance = calculateDistance([location.lat, location.lng], center)
  return distance <= radiusMiles
}

/**
 * Find the closest location to a reference point
 * @param locations Array of locations to search
 * @param referencePoint Reference coordinate [lat, lng]
 * @returns Closest location with distance information
 */
export function findClosestLocation(
  locations: LocationPoint[],
  referencePoint: [number, number]
): { location: LocationPoint; distance: number } | null {
  if (locations.length === 0) {
    return null
  }

  let closest = locations[0]
  let minDistance = calculateDistance([closest.lat, closest.lng], referencePoint)

  for (let i = 1; i < locations.length; i++) {
    const location = locations[i]
    const distance = calculateDistance([location.lat, location.lng], referencePoint)

    if (distance < minDistance) {
      minDistance = distance
      closest = location
    }
  }

  return {
    location: closest,
    distance: minDistance
  }
}
