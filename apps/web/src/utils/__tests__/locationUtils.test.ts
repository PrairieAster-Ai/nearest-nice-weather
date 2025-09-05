/**
 * ========================================================================
 * LOCATION UTILITIES TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Comprehensive testing for location utility functions
 * 🔗 UTILITIES: locationUtils - Pure location management functions
 * 📊 COVERAGE: Coordinate validation, localStorage, location methods
 * ⚙️ FUNCTIONALITY: Location state management and persistence
 * 🎯 BUSINESS_IMPACT: Ensures reliable location tracking for POI recommendations
 *
 * BUSINESS CONTEXT: Location management reliability
 * - Validates coordinate accuracy for map positioning
 * - Ensures localStorage persistence works across sessions
 * - Tests location method prioritization logic
 * - Verifies Minnesota boundary validation
 *
 * TECHNICAL COVERAGE: Pure function testing
 * - Coordinate validation edge cases
 * - localStorage error handling
 * - Distance calculation accuracy
 * - Location state transitions
 *
 * LAST UPDATED: 2025-08-13
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isValidCoordinates,
  formatCoordinates,
  saveLocationToStorage,
  loadLocationFromStorage,
  createLocationUpdate,
  hasLocationChangedSignificantly,
  getMinnesotaBounds,
  isLocationInMinnesota,
  getLocationMethodPriority,
  selectBestLocationMethod,
  type LocationMethod,
  type LocationState
} from '../locationUtils'

// Mock localStorage for testing
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  })
}

// Replace global localStorage with mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('Location Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('✅ isValidCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinates([44.9537, -93.0900])).toBe(true) // Minneapolis
      expect(isValidCoordinates([0, 0])).toBe(true) // Equator/Prime Meridian
      expect(isValidCoordinates([90, 180])).toBe(true) // Extreme valid coordinates
      expect(isValidCoordinates([-90, -180])).toBe(true) // Opposite extreme
    })

    it('should return false for null or undefined coordinates', () => {
      expect(isValidCoordinates(null)).toBe(false)
      expect(isValidCoordinates(undefined as any)).toBe(false)
    })

    it('should return false for invalid array formats', () => {
      expect(isValidCoordinates([] as any)).toBe(false)
      expect(isValidCoordinates([44.9537] as any)).toBe(false) // Missing longitude
      expect(isValidCoordinates([44.9537, -93.0900, 0] as any)).toBe(false) // Too many elements
    })

    it('should return false for non-numeric coordinates', () => {
      expect(isValidCoordinates(['44.9537', '-93.0900'] as any)).toBe(false)
      expect(isValidCoordinates([NaN, -93.0900])).toBe(false)
      expect(isValidCoordinates([44.9537, Infinity])).toBe(false)
      expect(isValidCoordinates([-Infinity, -93.0900])).toBe(false)
    })

    it('should return false for out-of-bounds coordinates', () => {
      expect(isValidCoordinates([91, -93.0900])).toBe(false) // Latitude too high
      expect(isValidCoordinates([-91, -93.0900])).toBe(false) // Latitude too low
      expect(isValidCoordinates([44.9537, 181])).toBe(false) // Longitude too high
      expect(isValidCoordinates([44.9537, -181])).toBe(false) // Longitude too low
    })
  })

  describe('✅ formatCoordinates', () => {
    it('should format valid coordinates with default precision', () => {
      const result = formatCoordinates([44.9537, -93.0900])
      expect(result).toBe('44.9537, -93.0900')
    })

    it('should format coordinates with custom precision', () => {
      const result = formatCoordinates([44.953789, -93.090123], 2)
      expect(result).toBe('44.95, -93.09')
    })

    it('should handle zero precision', () => {
      const result = formatCoordinates([44.9537, -93.0900], 0)
      expect(result).toBe('45, -93')
    })

    it('should return error message for invalid coordinates', () => {
      expect(formatCoordinates(null)).toBe('Invalid coordinates')
      expect(formatCoordinates([NaN, -93.0900])).toBe('Invalid coordinates')
      expect(formatCoordinates([91, -93.0900])).toBe('Invalid coordinates')
    })

    it('should handle negative coordinates correctly', () => {
      const result = formatCoordinates([-44.9537, 93.0900])
      expect(result).toBe('-44.9537, 93.0900')
    })
  })

  describe('✅ saveLocationToStorage', () => {
    it('should save valid location data to localStorage', () => {
      const locationData = {
        userLocation: [44.9537, -93.0900] as [number, number],
        locationMethod: 'gps' as LocationMethod,
        showLocationPrompt: false
      }

      const result = saveLocationToStorage(locationData)

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userLocation', JSON.stringify(locationData.userLocation))
      expect(localStorageMock.setItem).toHaveBeenCalledWith('locationMethod', JSON.stringify(locationData.locationMethod))
      expect(localStorageMock.setItem).toHaveBeenCalledWith('showLocationPrompt', JSON.stringify(locationData.showLocationPrompt))
    })

    it('should save null location correctly', () => {
      const locationData = {
        userLocation: null,
        locationMethod: 'none' as LocationMethod,
        showLocationPrompt: true
      }

      const result = saveLocationToStorage(locationData)

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userLocation', 'null')
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full')
      })

      const locationData = {
        userLocation: [44.9537, -93.0900] as [number, number],
        locationMethod: 'gps' as LocationMethod,
        showLocationPrompt: false
      }

      const result = saveLocationToStorage(locationData)

      expect(result).toBe(false)
    })
  })

  describe('✅ loadLocationFromStorage', () => {
    it('should load valid location data from localStorage', () => {
      const savedData = {
        userLocation: [44.9537, -93.0900],
        locationMethod: 'gps',
        showLocationPrompt: false
      }

      localStorageMock.store['userLocation'] = JSON.stringify(savedData.userLocation)
      localStorageMock.store['locationMethod'] = JSON.stringify(savedData.locationMethod)
      localStorageMock.store['showLocationPrompt'] = JSON.stringify(savedData.showLocationPrompt)

      const result = loadLocationFromStorage()

      expect(result).toEqual({
        userLocation: [44.9537, -93.0900],
        locationMethod: 'gps',
        showLocationPrompt: false
      })
    })

    it('should return defaults when no data exists', () => {
      const result = loadLocationFromStorage()

      expect(result).toEqual({
        userLocation: null,
        locationMethod: 'none',
        showLocationPrompt: true
      })
    })

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.store['userLocation'] = 'invalid-json'
      localStorageMock.store['locationMethod'] = '"gps"'
      localStorageMock.store['showLocationPrompt'] = 'false'

      const result = loadLocationFromStorage()

      expect(result).toEqual({
        userLocation: null,
        locationMethod: 'none',
        showLocationPrompt: true
      })
    })

    it('should validate loaded coordinates', () => {
      localStorageMock.store['userLocation'] = JSON.stringify([91, -93.0900]) // Invalid latitude

      const result = loadLocationFromStorage()

      expect(result.userLocation).toBeNull() // Should be null due to validation
    })

    it('should handle localStorage access errors', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available')
      })

      const result = loadLocationFromStorage()

      expect(result).toEqual({
        userLocation: null,
        locationMethod: 'none',
        showLocationPrompt: true
      })
    })
  })

  describe('✅ createLocationUpdate', () => {
    it('should create valid location update', () => {
      const position: [number, number] = [44.9537, -93.0900]
      const method: LocationMethod = 'gps'

      const result = createLocationUpdate(position, method)

      expect(result.position).toEqual(position)
      expect(result.method).toBe(method)
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) // ISO format
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(Date.now() - 1000) // Recent timestamp
    })

    it('should throw error for invalid coordinates', () => {
      expect(() => createLocationUpdate([91, -93.0900], 'gps')).toThrow('Invalid coordinates')
      expect(() => createLocationUpdate([NaN, -93.0900], 'gps')).toThrow('Invalid coordinates')
    })
  })

  describe('✅ hasLocationChangedSignificantly', () => {
    it('should return true when either location is null', () => {
      expect(hasLocationChangedSignificantly(null, [44.9537, -93.0900])).toBe(true)
      expect(hasLocationChangedSignificantly([44.9537, -93.0900], null)).toBe(true)
      expect(hasLocationChangedSignificantly(null, null)).toBe(true)
    })

    it('should return false for same location', () => {
      const location: [number, number] = [44.9537, -93.0900]
      const result = hasLocationChangedSignificantly(location, location)
      expect(result).toBe(false)
    })

    it('should return false for small changes within threshold', () => {
      const location1: [number, number] = [44.9537, -93.0900]
      const location2: [number, number] = [44.9538, -93.0901] // Very small change

      const result = hasLocationChangedSignificantly(location1, location2, 0.1)
      expect(result).toBe(false)
    })

    it('should return true for large changes exceeding threshold', () => {
      const minneapolis: [number, number] = [44.9537, -93.0900]
      const duluth: [number, number] = [46.7867, -92.1005] // ~135 miles apart

      const result = hasLocationChangedSignificantly(minneapolis, duluth, 1)
      expect(result).toBe(true)
    })

    it('should use custom threshold correctly', () => {
      const location1: [number, number] = [44.9537, -93.0900]
      const location2: [number, number] = [44.9637, -93.0900] // ~0.69 miles north

      expect(hasLocationChangedSignificantly(location1, location2, 1)).toBe(false) // Within 1 mile
      expect(hasLocationChangedSignificantly(location1, location2, 0.5)).toBe(true) // Exceeds 0.5 miles
    })

    it('should handle invalid coordinates', () => {
      const validLocation: [number, number] = [44.9537, -93.0900]
      const invalidLocation: [number, number] = [91, -93.0900]

      expect(hasLocationChangedSignificantly(validLocation, invalidLocation)).toBe(true)
      expect(hasLocationChangedSignificantly(invalidLocation, validLocation)).toBe(true)
    })
  })

  describe('✅ Minnesota bounds validation', () => {
    it('should return correct Minnesota bounds', () => {
      const bounds = getMinnesotaBounds()

      expect(bounds.north).toBe(49.4)
      expect(bounds.south).toBe(43.5)
      expect(bounds.east).toBe(-89.5)
      expect(bounds.west).toBe(-97.2)
    })

    it('should identify Minnesota locations correctly', () => {
      const minneapolisLocation: [number, number] = [44.9537, -93.0900]
      const duluthLocation: [number, number] = [46.7867, -92.1005]

      expect(isLocationInMinnesota(minneapolisLocation)).toBe(true)
      expect(isLocationInMinnesota(duluthLocation)).toBe(true)
    })

    it('should identify non-Minnesota locations correctly', () => {
      const chicagoLocation: [number, number] = [41.8781, -87.6298]
      const denverLocation: [number, number] = [39.7392, -104.9903]

      expect(isLocationInMinnesota(chicagoLocation)).toBe(false)
      expect(isLocationInMinnesota(denverLocation)).toBe(false)
    })

    it('should handle edge cases at Minnesota borders', () => {
      const bounds = getMinnesotaBounds()

      // Points just inside borders
      expect(isLocationInMinnesota([bounds.south + 0.1, bounds.west + 0.1])).toBe(true)
      expect(isLocationInMinnesota([bounds.north - 0.1, bounds.east - 0.1])).toBe(true)

      // Points just outside borders
      expect(isLocationInMinnesota([bounds.south - 0.1, bounds.west - 0.1])).toBe(false)
      expect(isLocationInMinnesota([bounds.north + 0.1, bounds.east + 0.1])).toBe(false)
    })

    it('should handle invalid coordinates', () => {
      expect(isLocationInMinnesota(null)).toBe(false)
      expect(isLocationInMinnesota([NaN, -93.0900])).toBe(false)
      expect(isLocationInMinnesota([91, -93.0900])).toBe(false)
    })
  })

  describe('✅ Location method prioritization', () => {
    it('should return correct priorities for all methods', () => {
      expect(getLocationMethodPriority('manual')).toBe(10)
      expect(getLocationMethodPriority('gps')).toBe(8)
      expect(getLocationMethodPriority('cached')).toBe(6)
      expect(getLocationMethodPriority('ip')).toBe(4)
      expect(getLocationMethodPriority('none')).toBe(0)
    })

    it('should handle unknown methods', () => {
      expect(getLocationMethodPriority('unknown' as any)).toBe(0)
    })

    it('should select best method from array', () => {
      expect(selectBestLocationMethod(['none', 'ip', 'gps'])).toBe('gps')
      expect(selectBestLocationMethod(['ip', 'manual', 'cached'])).toBe('manual')
      expect(selectBestLocationMethod(['none'])).toBe('none')
    })

    it('should handle empty method array', () => {
      expect(selectBestLocationMethod([])).toBe('none')
    })

    it('should select first method when priorities are equal', () => {
      // Two 'none' methods should return 'none'
      expect(selectBestLocationMethod(['none', 'none'])).toBe('none')
    })
  })

  describe('🔧 Edge Cases and Integration', () => {
    it('should handle full location lifecycle', () => {
      // Create location update
      const update = createLocationUpdate([44.9537, -93.0900], 'gps')

      // Save to storage
      const saveSuccess = saveLocationToStorage({
        userLocation: update.position,
        locationMethod: update.method,
        showLocationPrompt: false
      })
      expect(saveSuccess).toBe(true)

      // Load from storage
      const loaded = loadLocationFromStorage()
      expect(loaded.userLocation).toEqual(update.position)
      expect(loaded.locationMethod).toBe(update.method)
      expect(loaded.showLocationPrompt).toBe(false)

      // Validate coordinates
      expect(isValidCoordinates(loaded.userLocation)).toBe(true)
      expect(isLocationInMinnesota(loaded.userLocation)).toBe(true)

      // Format for display
      const formatted = formatCoordinates(loaded.userLocation)
      expect(formatted).toBe('44.9537, -93.0900')
    })

    it('should handle storage errors in full lifecycle', () => {
      // Mock storage failure
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full')
      })

      const saveSuccess = saveLocationToStorage({
        userLocation: [44.9537, -93.0900],
        locationMethod: 'gps',
        showLocationPrompt: false
      })

      expect(saveSuccess).toBe(false)

      // Load should still work with defaults
      const loaded = loadLocationFromStorage()
      expect(loaded).toEqual({
        userLocation: null,
        locationMethod: 'none',
        showLocationPrompt: true
      })
    })

    it('should maintain data integrity with invalid data', () => {
      // Try to save invalid coordinates
      const result = saveLocationToStorage({
        userLocation: [91, -93.0900], // Invalid latitude
        locationMethod: 'gps',
        showLocationPrompt: false
      })

      // Save operation succeeds (doesn't validate)
      expect(result).toBe(true)

      // But load operation validates and rejects invalid data
      const loaded = loadLocationFromStorage()
      expect(loaded.userLocation).toBeNull() // Invalid coordinates rejected
    })
  })
})

/**
 * 📊 TEST COVERAGE SUMMARY:
 * ✅ Coordinate validation for all edge cases
 * ✅ Coordinate formatting with precision control
 * ✅ localStorage save/load with error handling
 * ✅ Location update creation with validation
 * ✅ Significant location change detection
 * ✅ Minnesota boundary validation
 * ✅ Location method prioritization logic
 * ✅ Integration testing of full lifecycle
 * ✅ Error handling for storage failures
 * ✅ Data integrity with invalid inputs
 *
 * 🎯 BUSINESS COVERAGE:
 * ✅ Reliable location tracking for POI recommendations
 * ✅ Location persistence across browser sessions
 * ✅ Geographic boundary validation for Minnesota focus
 * ✅ Location method prioritization for best accuracy
 *
 * 🔧 TECHNICAL COVERAGE:
 * ✅ Pure function mathematical operations
 * ✅ localStorage integration with error handling
 * ✅ Type-safe coordinate validation
 * ✅ Edge case handling for invalid data
 */
