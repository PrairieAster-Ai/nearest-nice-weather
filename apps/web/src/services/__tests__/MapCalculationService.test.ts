/**
 * ========================================================================
 * MAP CALCULATION SERVICE TESTS
 * ========================================================================
 *
 * Unit tests for the pure geographic calculations that drive map view
 * positioning (bounds, center, zoom optimization, distance, containment).
 * These are business-critical to the outdoor-recreation map UX and were
 * previously untested.
 *
 * @module src/services/__tests__/MapCalculationService.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MapCalculationService,
  mapCalculationService,
  type LocationPoint,
  type GeographicBounds,
  type Coordinates,
} from '../MapCalculationService'

// Silence the service's diagnostic console.log noise during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

const MPLS: Coordinates = [44.9537, -93.09] // fallback center

const loc = (id: string, lat: number, lng: number): LocationPoint => ({
  id,
  name: `POI ${id}`,
  lat,
  lng,
})

// A small Minnesota cluster
const sampleLocations: LocationPoint[] = [
  loc('1', 44.98, -93.27), // Minneapolis
  loc('2', 44.95, -93.1), // St. Paul-ish
  loc('3', 45.1, -93.3), // north metro
]

describe('MapCalculationService', () => {
  let svc: MapCalculationService

  beforeEach(() => {
    svc = new MapCalculationService()
  })

  describe('calculateBounds', () => {
    it('returns null for an empty array', () => {
      expect(svc.calculateBounds([])).toBeNull()
    })

    it('returns the min/max lat/lng across locations', () => {
      const b = svc.calculateBounds(sampleLocations)!
      expect(b).toEqual({
        minLat: 44.95,
        maxLat: 45.1,
        minLng: -93.3,
        maxLng: -93.1,
      })
    })

    it('handles a single location (degenerate bounds)', () => {
      const b = svc.calculateBounds([loc('1', 44.0, -93.0)])!
      expect(b).toEqual({ minLat: 44.0, maxLat: 44.0, minLng: -93.0, maxLng: -93.0 })
    })

    it('handles negative and positive coordinates correctly', () => {
      const b = svc.calculateBounds([loc('a', -10, 20), loc('b', 30, -40)])!
      expect(b).toEqual({ minLat: -10, maxLat: 30, minLng: -40, maxLng: 20 })
    })
  })

  describe('calculateCenter', () => {
    it('returns the geometric midpoint of bounds', () => {
      const bounds: GeographicBounds = { minLat: 44, maxLat: 46, minLng: -94, maxLng: -92 }
      expect(svc.calculateCenter(bounds)).toEqual([45, -93])
    })

    it('returns the point itself for degenerate bounds', () => {
      const bounds: GeographicBounds = { minLat: 44.9, maxLat: 44.9, minLng: -93.1, maxLng: -93.1 }
      expect(svc.calculateCenter(bounds)).toEqual([44.9, -93.1])
    })
  })

  describe('calculateOptimalZoom', () => {
    const boundsForRange = (range: number): GeographicBounds => ({
      minLat: 44,
      maxLat: 44 + range,
      minLng: -93,
      maxLng: -93, // keep lng range 0 so maxRange = latRange = range
    })

    it('uses a wide zoom for a large spread', () => {
      // range 5 → padded 6 → no tier matches → defaultZoom 8
      expect(svc.calculateOptimalZoom(boundsForRange(5))).toBe(8)
    })

    it('zooms in tighter as the spread shrinks', () => {
      const wide = svc.calculateOptimalZoom(boundsForRange(2)) // padded 2.4
      const tight = svc.calculateOptimalZoom(boundsForRange(0.05)) // padded floor 0.5
      expect(tight).toBeGreaterThan(wide)
    })

    it('applies the 0.5 minimum padded-range floor for tiny/zero spreads', () => {
      // range 0 → paddedRange = max(0, 0.5) = 0.5 → tier <0.5 not hit, <0.7 → 10.5, ... actually 0.5 hits "<0.7"
      // paddedRange 0.5: <4,<3,<2,<1.5,<1.0,<0.7 → 10.5; <0.5 is false. So zoom 10.5
      expect(svc.calculateOptimalZoom(boundsForRange(0))).toBe(10.5)
    })

    it('clamps to the configured maxZoom', () => {
      const z = svc.calculateOptimalZoom(boundsForRange(0), { maxZoom: 9 })
      expect(z).toBe(9)
    })

    it('clamps to the configured minZoom', () => {
      const z = svc.calculateOptimalZoom(boundsForRange(50), { minZoom: 7, defaultZoom: 6 })
      expect(z).toBe(7)
    })

    it('honors a custom padding factor', () => {
      // Larger padding pushes the range into a wider zoom tier
      const small = svc.calculateOptimalZoom(boundsForRange(0.9), { padding: 1 }) // 0.9 → <1.0 → 10
      const padded = svc.calculateOptimalZoom(boundsForRange(0.9), { padding: 2 }) // 1.8 → <2.0 → 9
      expect(padded).toBeLessThan(small)
    })
  })

  describe('calculateOptimalView', () => {
    it('falls back to Minneapolis + default zoom when there are no locations', () => {
      const view = svc.calculateOptimalView([])
      expect(view.center).toEqual(MPLS)
      expect(view.zoom).toBe(8)
    })

    it('respects a custom fallback center and default zoom', () => {
      const view = svc.calculateOptimalView([], { fallbackCenter: [40, -100], defaultZoom: 5 })
      expect(view.center).toEqual([40, -100])
      expect(view.zoom).toBe(5)
    })

    it('computes center + zoom for real locations', () => {
      const view = svc.calculateOptimalView(sampleLocations)
      // center is midpoint of bounds (44.95–45.1, -93.3 to -93.1)
      expect(view.center[0]).toBeCloseTo(45.025, 3)
      expect(view.center[1]).toBeCloseTo(-93.2, 3)
      expect(view.zoom).toBeGreaterThanOrEqual(6)
      expect(view.zoom).toBeLessThanOrEqual(15)
    })
  })

  describe('calculateViewWithUserLocation', () => {
    it('expands the view to include the user location', () => {
      const user: Coordinates = [46.5, -94.5] // far north-west of the cluster
      const withUser = svc.calculateViewWithUserLocation(sampleLocations, user)
      const withoutUser = svc.calculateOptimalView(sampleLocations)
      // Including a distant user point widens the spread → zooms out (smaller or equal zoom)
      expect(withUser.zoom).toBeLessThanOrEqual(withoutUser.zoom)
      // Center should shift toward the user point (higher lat)
      expect(withUser.center[0]).toBeGreaterThan(withoutUser.center[0])
    })
  })

  describe('calculateSimpleDistance', () => {
    it('is zero for identical points', () => {
      expect(svc.calculateSimpleDistance([44, -93], [44, -93])).toBe(0)
    })

    it('computes Euclidean distance', () => {
      expect(svc.calculateSimpleDistance([0, 0], [3, 4])).toBe(5)
    })

    it('is symmetric', () => {
      const a = svc.calculateSimpleDistance([44, -93], [45, -92])
      const b = svc.calculateSimpleDistance([45, -92], [44, -93])
      expect(a).toBeCloseTo(b, 10)
    })
  })

  describe('findClosestLocations', () => {
    it('returns locations sorted by distance, closest first', () => {
      const ref: Coordinates = [44.98, -93.27] // == location 1
      const result = svc.findClosestLocations(sampleLocations, ref)
      expect(result[0].id).toBe('1')
      expect(result).toHaveLength(3)
    })

    it('respects maxCount', () => {
      const result = svc.findClosestLocations(sampleLocations, [45, -93], 2)
      expect(result).toHaveLength(2)
    })

    it('returns empty for no locations', () => {
      expect(svc.findClosestLocations([], [45, -93])).toEqual([])
    })
  })

  describe('isWithinBounds', () => {
    const bounds: GeographicBounds = { minLat: 44, maxLat: 46, minLng: -94, maxLng: -92 }

    it('is true for an interior point', () => {
      expect(svc.isWithinBounds([45, -93], bounds)).toBe(true)
    })

    it('is true for points exactly on the edge (inclusive)', () => {
      expect(svc.isWithinBounds([44, -94], bounds)).toBe(true)
      expect(svc.isWithinBounds([46, -92], bounds)).toBe(true)
    })

    it('is false for a point outside', () => {
      expect(svc.isWithinBounds([43.9, -93], bounds)).toBe(false)
      expect(svc.isWithinBounds([45, -91.9], bounds)).toBe(false)
    })
  })

  describe('expandBounds', () => {
    it('expands symmetrically by the given factor', () => {
      const bounds: GeographicBounds = { minLat: 44, maxLat: 46, minLng: -94, maxLng: -92 }
      const expanded = svc.expandBounds(bounds, 1.5) // range 2 → grow by 1 total → 0.5 each side
      expect(expanded.minLat).toBeCloseTo(43.5, 10)
      expect(expanded.maxLat).toBeCloseTo(46.5, 10)
      expect(expanded.minLng).toBeCloseTo(-94.5, 10)
      expect(expanded.maxLng).toBeCloseTo(-91.5, 10)
    })

    it('defaults to a 1.2 factor', () => {
      const bounds: GeographicBounds = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 }
      const expanded = svc.expandBounds(bounds) // range 10 → grow 2 total → 1 each side
      expect(expanded.minLat).toBeCloseTo(-1, 10)
      expect(expanded.maxLat).toBeCloseTo(11, 10)
    })

    it('leaves degenerate bounds unchanged (zero range)', () => {
      const bounds: GeographicBounds = { minLat: 44, maxLat: 44, minLng: -93, maxLng: -93 }
      expect(svc.expandBounds(bounds, 2)).toEqual(bounds)
    })
  })

  describe('getCalculationSummary', () => {
    it('formats a human-readable summary', () => {
      const summary = svc.getCalculationSummary({ center: [44.9537, -93.09], zoom: 9 }, 5)
      expect(summary).toBe('Map view: 5 locations, center [44.954, -93.090], zoom 9')
    })
  })

  describe('singleton export', () => {
    it('exposes a ready-to-use instance', () => {
      expect(mapCalculationService).toBeInstanceOf(MapCalculationService)
      expect(mapCalculationService.calculateOptimalView([]).zoom).toBe(8)
    })
  })
})
