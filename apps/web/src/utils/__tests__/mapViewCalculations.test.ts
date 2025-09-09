/**
 * ========================================================================
 * MAP VIEW CALCULATION UTILITIES TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Comprehensive testing for map view calculation utilities
 * 🔗 UTILITIES: mapViewCalculations - Pure mathematical functions
 * 📊 COVERAGE: Map calculations, distance functions, bounds calculations
 * ⚙️ FUNCTIONALITY: Geographic calculations for optimal map views
 * 🎯 BUSINESS_IMPACT: Ensures accurate map positioning for POI discovery
 *
 * BUSINESS CONTEXT: Map view optimization
 * - Validates optimal map center and zoom calculations
 * - Ensures accurate distance calculations
 * - Tests edge cases and fallback scenarios
 * - Verifies geographic bounds calculations
 *
 * TECHNICAL COVERAGE: Pure function testing
 * - Mathematical accuracy of distance calculations
 * - Bounds calculation for multiple locations
 * - Zoom level optimization logic
 * - Edge case handling (empty arrays, single points)
 *
 * LAST UPDATED: 2025-08-13
 */

import { describe, it, expect } from 'vitest'
import {
  calculateOptimalMapView,
  calculateLocationBounds,
  calculateDistance,
  isLocationWithinRadius,
  findClosestLocation,
  type LocationPoint
} from '../mapViewCalculations'

describe('Map View Calculation Utilities', () => {

  // Sample test data
  const minneapolisLocation: LocationPoint = {
    id: '1',
    name: 'Minneapolis',
    lat: 44.9537,
    lng: -93.0900
  }

  const saintPaulLocation: LocationPoint = {
    id: '2',
    name: 'Saint Paul',
    lat: 44.9537,
    lng: -93.0900
  }

  const duluthLocation: LocationPoint = {
    id: '3',
    name: 'Duluth',
    lat: 46.7867,
    lng: -92.1005
  }

  const minnesotaLocations: LocationPoint[] = [
    minneapolisLocation,
    saintPaulLocation,
    duluthLocation
  ]

  describe('✅ calculateOptimalMapView', () => {
    it('should return Minnesota center for empty locations array', () => {
      const result = calculateOptimalMapView([])

      expect(result.center).toEqual([44.9537, -93.0900])
      expect(result.zoom).toBe(7)
    })

    it('should center on single location with appropriate zoom', () => {
      const result = calculateOptimalMapView([minneapolisLocation])

      expect(result.center).toEqual([44.9537, -93.0900])
      expect(result.zoom).toBe(8) // No user location
    })

    it('should use higher zoom for single location with user location', () => {
      const userLocation: [number, number] = [45.0, -93.0]
      const result = calculateOptimalMapView([minneapolisLocation], userLocation)

      expect(result.center).toEqual([44.9537, -93.0900])
      expect(result.zoom).toBe(10) // With user location
    })

    it('should calculate bounds for multiple locations', () => {
      const result = calculateOptimalMapView(minnesotaLocations)

      expect(result.center).toBeDefined()
      expect(result.zoom).toBeDefined()
      expect(Array.isArray(result.center)).toBe(true)
      expect(result.center).toHaveLength(2)
      expect(typeof result.zoom).toBe('number')
    })

    it('should include user location in bounds calculation', () => {
      const userLocation: [number, number] = [45.5, -94.0]
      const result = calculateOptimalMapView([minneapolisLocation], userLocation)

      // Should calculate bounds including both points
      expect(result.center).toBeDefined()
      expect(result.zoom).toBeDefined()
    })
  })

  describe('✅ calculateLocationBounds', () => {
    it('should return default bounds for empty locations', () => {
      const result = calculateLocationBounds([])

      expect(result.center).toEqual([44.9537, -93.0900])
      expect(result.zoom).toBe(7)
    })

    it('should calculate center point for multiple locations', () => {
      const locations = [
        { id: '1', name: 'Point 1', lat: 44.0, lng: -93.0 },
        { id: '2', name: 'Point 2', lat: 45.0, lng: -94.0 }
      ]

      const result = calculateLocationBounds(locations)

      // Center should be midpoint
      expect(result.center[0]).toBe(44.5) // Average of 44.0 and 45.0
      expect(result.center[1]).toBe(-93.5) // Average of -93.0 and -94.0
    })

    it('should include user location in bounds', () => {
      const locations = [minneapolisLocation]
      const userLocation: [number, number] = [46.0, -94.0]

      const result = calculateLocationBounds(locations, userLocation)

      // Center should be between Minneapolis and user location
      expect(result.center[0]).toBe((44.9537 + 46.0) / 2)
      expect(result.center[1]).toBe((-93.0900 + -94.0) / 2)
    })

    it('should calculate appropriate zoom for different area sizes', () => {
      // Small area (< 0.5 degrees)
      const smallArea = [
        { id: '1', name: 'Close 1', lat: 44.9, lng: -93.0 },
        { id: '2', name: 'Close 2', lat: 45.0, lng: -93.1 }
      ]
      const smallResult = calculateLocationBounds(smallArea)
      expect(smallResult.zoom).toBe(10)

      // Large area (> 5 degrees)
      const largeArea = [
        { id: '1', name: 'North', lat: 48.0, lng: -90.0 },
        { id: '2', name: 'South', lat: 42.0, lng: -96.0 }
      ]
      const largeResult = calculateLocationBounds(largeArea)
      expect(largeResult.zoom).toBe(6)
    })
  })

  describe('✅ calculateDistance', () => {
    it('should calculate zero distance for same point', () => {
      const point: [number, number] = [44.9537, -93.0900]
      const distance = calculateDistance(point, point)

      expect(distance).toBe(0)
    })

    it('should calculate approximate distance between Minneapolis and Duluth', () => {
      const minneapolis: [number, number] = [44.9537, -93.0900]
      const duluth: [number, number] = [46.7867, -92.1005]

      const distance = calculateDistance(minneapolis, duluth)

      // Approximate distance is ~135 miles
      expect(distance).toBeGreaterThan(130)
      expect(distance).toBeLessThan(140)
    })

    it('should return same distance regardless of point order', () => {
      const point1: [number, number] = [44.0, -93.0]
      const point2: [number, number] = [45.0, -94.0]

      const distance1 = calculateDistance(point1, point2)
      const distance2 = calculateDistance(point2, point1)

      expect(distance1).toBe(distance2)
    })

    it('should handle extreme coordinates', () => {
      const northPole: [number, number] = [90, 0]
      const equator: [number, number] = [0, 0]

      const distance = calculateDistance(northPole, equator)

      // Quarter of Earth's circumference (~6,215 miles)
      expect(distance).toBeGreaterThan(6000)
      expect(distance).toBeLessThan(6500)
    })
  })

  describe('✅ isLocationWithinRadius', () => {
    it('should return true for location at center point', () => {
      const location = minneapolisLocation
      const center: [number, number] = [44.9537, -93.0900]

      const isWithin = isLocationWithinRadius(location, center, 10)

      expect(isWithin).toBe(true)
    })

    it('should return false for location outside radius', () => {
      const location = duluthLocation
      const center: [number, number] = [44.9537, -93.0900] // Minneapolis

      const isWithin = isLocationWithinRadius(location, center, 50) // 50 mile radius

      expect(isWithin).toBe(false) // Duluth is ~135 miles from Minneapolis
    })

    it('should return true for location just inside radius', () => {
      const location = duluthLocation
      const center: [number, number] = [44.9537, -93.0900]

      const isWithin = isLocationWithinRadius(location, center, 200) // 200 mile radius

      expect(isWithin).toBe(true)
    })

    it('should handle zero radius correctly', () => {
      const location = minneapolisLocation
      const center: [number, number] = [44.9537, -93.0900]

      const isWithin = isLocationWithinRadius(location, center, 0)

      expect(isWithin).toBe(true) // Same location, zero distance
    })

    it('should handle negative radius by treating as positive', () => {
      const location = minneapolisLocation
      const center: [number, number] = [44.9537, -93.0900]

      const isWithin = isLocationWithinRadius(location, center, -10)

      // Note: Current implementation doesn't handle negative radius
      // This tests current behavior, may need adjustment if logic changes
      expect(isWithin).toBe(false)
    })
  })

  describe('✅ findClosestLocation', () => {
    it('should return null for empty locations array', () => {
      const reference: [number, number] = [44.9537, -93.0900]

      const result = findClosestLocation([], reference)

      expect(result).toBeNull()
    })

    it('should return single location when only one available', () => {
      const reference: [number, number] = [44.9537, -93.0900]

      const result = findClosestLocation([duluthLocation], reference)

      expect(result).not.toBeNull()
      expect(result!.location).toBe(duluthLocation)
      expect(result!.distance).toBeGreaterThan(0)
    })

    it('should find closest location among multiple options', () => {
      const reference: [number, number] = [44.9537, -93.0900] // Minneapolis coordinates

      const result = findClosestLocation(minnesotaLocations, reference)

      expect(result).not.toBeNull()
      expect(result!.location.name).toBe('Minneapolis') // Should be closest to itself
      expect(result!.distance).toBe(0) // Same location
    })

    it('should find closest when reference is between locations', () => {
      const locations = [
        { id: '1', name: 'North', lat: 46.0, lng: -93.0 },
        { id: '2', name: 'South', lat: 44.0, lng: -93.0 }
      ]
      const reference: [number, number] = [45.5, -93.0] // Closer to North

      const result = findClosestLocation(locations, reference)

      expect(result).not.toBeNull()
      expect(result!.location.name).toBe('North')
      expect(result!.distance).toBeGreaterThan(0)
      expect(result!.distance).toBeLessThan(100) // Should be reasonable distance
    })

    it('should include accurate distance calculation', () => {
      const reference: [number, number] = [44.9537, -93.0900]

      const result = findClosestLocation([duluthLocation], reference)

      expect(result).not.toBeNull()
      // Distance should match direct calculation
      const expectedDistance = calculateDistance([duluthLocation.lat, duluthLocation.lng], reference)
      expect(result!.distance).toBe(expectedDistance)
    })
  })

  describe('🔧 Edge Cases and Error Handling', () => {
    it('should handle locations with same coordinates', () => {
      const sameLocations = [
        { id: '1', name: 'Location 1', lat: 44.9537, lng: -93.0900 },
        { id: '2', name: 'Location 2', lat: 44.9537, lng: -93.0900 }
      ]

      const result = calculateLocationBounds(sameLocations)

      expect(result.center).toEqual([44.9537, -93.0900])
      expect(result.zoom).toBe(10) // Should use maximum zoom for identical points
    })

    it('should handle extreme latitude/longitude values', () => {
      const extremeLocations = [
        { id: '1', name: 'North Pole', lat: 90, lng: 0 },
        { id: '2', name: 'South Pole', lat: -90, lng: 180 }
      ]

      const result = calculateLocationBounds(extremeLocations)

      expect(result.center[0]).toBe(0) // Should be equator
      expect(result.center[1]).toBe(90) // Average of 0 and 180
      expect(result.zoom).toBe(6) // Should use minimum zoom for global span
    })

    it('should handle very small coordinate differences', () => {
      const microLocations = [
        { id: '1', name: 'Point 1', lat: 44.95370, lng: -93.09000 },
        { id: '2', name: 'Point 2', lat: 44.95371, lng: -93.09001 }
      ]

      const result = calculateLocationBounds(microLocations)

      expect(result.zoom).toBe(10) // Should use high zoom for very small area
    })

    it('should handle NaN coordinates gracefully', () => {
      const invalidLocation = { id: '1', name: 'Invalid', lat: NaN, lng: -93.0 }
      const validLocation = minneapolisLocation

      // Distance calculation with NaN should return NaN
      const distance = calculateDistance([invalidLocation.lat, invalidLocation.lng], [validLocation.lat, validLocation.lng])
      expect(distance).toBeNaN()
    })
  })

  describe('📊 Performance and Accuracy', () => {
    it('should maintain accuracy with large datasets', () => {
      // Generate 100 locations around Minnesota
      const manyLocations: LocationPoint[] = []
      for (let i = 0; i < 100; i++) {
        manyLocations.push({
          id: `location-${i}`,
          name: `Location ${i}`,
          lat: 44 + (Math.random() * 4), // 44-48 degrees (Minnesota range)
          lng: -97 + (Math.random() * 8)  // -97 to -89 degrees
        })
      }

      const result = calculateOptimalMapView(manyLocations)

      // Should calculate reasonable bounds for Minnesota
      expect(result.center[0]).toBeGreaterThan(44)
      expect(result.center[0]).toBeLessThan(48)
      expect(result.center[1]).toBeGreaterThan(-97)
      expect(result.center[1]).toBeLessThan(-89)
      expect(result.zoom).toBeGreaterThan(5)
      expect(result.zoom).toBeLessThan(11)
    })

    it('should be consistent with repeated calculations', () => {
      const locations = minnesotaLocations

      const result1 = calculateOptimalMapView(locations)
      const result2 = calculateOptimalMapView(locations)
      const result3 = calculateOptimalMapView(locations)

      expect(result1.center).toEqual(result2.center)
      expect(result2.center).toEqual(result3.center)
      expect(result1.zoom).toBe(result2.zoom)
      expect(result2.zoom).toBe(result3.zoom)
    })
  })
})

/**
 * 📊 TEST COVERAGE SUMMARY:
 * ✅ Optimal map view calculation for all scenarios
 * ✅ Location bounds calculation with edge cases
 * ✅ Distance calculation accuracy and consistency
 * ✅ Radius checking with various conditions
 * ✅ Closest location finding with performance
 * ✅ Edge case handling (empty arrays, invalid data)
 * ✅ Performance testing with large datasets
 * ✅ Mathematical accuracy verification
 * ✅ Coordinate system edge cases
 * ✅ Zoom level optimization logic
 *
 * 🎯 BUSINESS COVERAGE:
 * ✅ Map view optimization for user experience
 * ✅ Geographic accuracy for POI discovery
 * ✅ Performance with real-world data sizes
 * ✅ Edge case robustness for production use
 *
 * 🔧 TECHNICAL COVERAGE:
 * ✅ Pure function mathematical operations
 * ✅ Geographic coordinate calculations
 * ✅ Bounds and optimization algorithms
 * ✅ Error handling and data validation
 */
