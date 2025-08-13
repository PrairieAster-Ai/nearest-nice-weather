/**
 * ========================================================================
 * LOCATION UTILITIES
 * ========================================================================
 * 
 * 📋 PURPOSE: Extracted testable location management logic from App.tsx
 * 🔗 DEPENDENCIES: None - pure utilities for location handling
 * 📊 COVERAGE: Location state management, localStorage persistence, validation
 * ⚙️ FUNCTIONALITY: User location handling and storage
 * 🎯 BUSINESS_IMPACT: Reliable location tracking for personalized POI recommendations
 * 
 * BUSINESS CONTEXT: User location management
 * - Handles user location state changes and persistence
 * - Manages location method tracking (GPS, manual, IP, etc.)
 * - Provides localStorage integration for location preferences
 * - Validates location coordinates and formats
 * 
 * TECHNICAL CONTEXT: Pure utility functions
 * - No React dependencies or side effects
 * - Easy to test mathematical and validation logic
 * - Handles localStorage errors gracefully
 * - Type-safe location coordinate handling
 * 
 * EXTRACTED FROM: App.tsx lines 332-365 (location change handling)
 * 
 * LAST UPDATED: 2025-08-13
 */

export type LocationMethod = 'none' | 'gps' | 'ip' | 'manual' | 'cached'

export interface LocationState {
  userLocation: [number, number] | null
  locationMethod: LocationMethod
  showLocationPrompt: boolean
}

export interface LocationUpdate {
  position: [number, number]
  method: LocationMethod
  timestamp: string
}

/**
 * Validate if coordinates are valid geographic coordinates
 * @param coordinates Coordinate pair to validate
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(coordinates: [number, number] | null): boolean {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return false
  }

  const [lat, lng] = coordinates
  
  // Check if values are numbers
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false
  }

  // Check if values are finite (not NaN or Infinity)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false
  }

  // Check latitude bounds (-90 to 90)
  if (lat < -90 || lat > 90) {
    return false
  }

  // Check longitude bounds (-180 to 180)
  if (lng < -180 || lng > 180) {
    return false
  }

  return true
}

/**
 * Format coordinates for display
 * @param coordinates Coordinate pair to format
 * @param precision Number of decimal places (default 4)
 * @returns Formatted coordinate string
 */
export function formatCoordinates(
  coordinates: [number, number] | null,
  precision: number = 4
): string {
  if (!isValidCoordinates(coordinates)) {
    return 'Invalid coordinates'
  }

  const [lat, lng] = coordinates!
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
}

/**
 * Save location data to localStorage with error handling
 * @param locationData Location data to save
 * @returns Success status
 */
export function saveLocationToStorage(locationData: {
  userLocation: [number, number] | null
  locationMethod: LocationMethod
  showLocationPrompt: boolean
}): boolean {
  try {
    localStorage.setItem('userLocation', JSON.stringify(locationData.userLocation))
    localStorage.setItem('locationMethod', JSON.stringify(locationData.locationMethod))
    localStorage.setItem('showLocationPrompt', JSON.stringify(locationData.showLocationPrompt))
    return true
  } catch (error) {
    console.warn('Failed to save location to localStorage:', error)
    return false
  }
}

/**
 * Load location data from localStorage with error handling
 * @returns Location data or defaults
 */
export function loadLocationFromStorage(): LocationState {
  try {
    const userLocationStr = localStorage.getItem('userLocation')
    const locationMethodStr = localStorage.getItem('locationMethod')
    const showLocationPromptStr = localStorage.getItem('showLocationPrompt')

    const userLocation = userLocationStr ? JSON.parse(userLocationStr) : null
    const locationMethod = locationMethodStr ? JSON.parse(locationMethodStr) : 'none'
    const showLocationPrompt = showLocationPromptStr ? JSON.parse(showLocationPromptStr) : true

    // Validate loaded coordinates
    const validUserLocation = isValidCoordinates(userLocation) ? userLocation : null

    return {
      userLocation: validUserLocation,
      locationMethod,
      showLocationPrompt
    }
  } catch (error) {
    console.warn('Failed to load location from localStorage:', error)
    return {
      userLocation: null,
      locationMethod: 'none',
      showLocationPrompt: true
    }
  }
}

/**
 * Create a location update object with timestamp
 * @param position New coordinate position
 * @param method Method used to obtain location
 * @returns Location update object
 */
export function createLocationUpdate(
  position: [number, number],
  method: LocationMethod
): LocationUpdate {
  if (!isValidCoordinates(position)) {
    throw new Error('Invalid coordinates provided for location update')
  }

  return {
    position,
    method,
    timestamp: new Date().toISOString()
  }
}

/**
 * Calculate if location has changed significantly
 * @param oldLocation Previous location
 * @param newLocation New location
 * @param thresholdMiles Threshold in miles for significant change (default 0.1)
 * @returns True if location changed significantly
 */
export function hasLocationChangedSignificantly(
  oldLocation: [number, number] | null,
  newLocation: [number, number] | null,
  thresholdMiles: number = 0.1
): boolean {
  // If either location is null, consider it a significant change
  if (!oldLocation || !newLocation) {
    return true
  }

  // Validate both coordinates
  if (!isValidCoordinates(oldLocation) || !isValidCoordinates(newLocation)) {
    return true
  }

  // Calculate distance between locations
  const distance = calculateLocationDistance(oldLocation, newLocation)
  
  return distance >= thresholdMiles
}

/**
 * Calculate distance between two coordinate points
 * @param point1 First coordinate pair
 * @param point2 Second coordinate pair
 * @returns Distance in miles
 */
function calculateLocationDistance(
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

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Get Minnesota bounds for location validation
 * @returns Minnesota bounding box coordinates
 */
export function getMinnesotaBounds() {
  return {
    north: 49.4,
    south: 43.5,
    east: -89.5,
    west: -97.2
  }
}

/**
 * Check if coordinates are within Minnesota
 * @param coordinates Coordinate pair to check
 * @returns True if coordinates are in Minnesota
 */
export function isLocationInMinnesota(coordinates: [number, number] | null): boolean {
  if (!isValidCoordinates(coordinates)) {
    return false
  }

  const [lat, lng] = coordinates!
  const bounds = getMinnesotaBounds()

  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  )
}

/**
 * Get location method priority for conflict resolution
 * @param method Location method to evaluate
 * @returns Priority score (higher = more reliable)
 */
export function getLocationMethodPriority(method: LocationMethod): number {
  const priorities = {
    manual: 10,    // User explicitly set location
    gps: 8,        // GPS is accurate but may have issues
    cached: 6,     // Previously saved location
    ip: 4,         // IP geolocation is approximate
    none: 0        // No location data
  }

  return priorities[method] || 0
}

/**
 * Determine best location method when multiple sources are available
 * @param methods Array of available location methods
 * @returns Best location method to use
 */
export function selectBestLocationMethod(methods: LocationMethod[]): LocationMethod {
  if (methods.length === 0) {
    return 'none'
  }

  return methods.reduce((best, current) => {
    return getLocationMethodPriority(current) > getLocationMethodPriority(best) ? current : best
  })
}