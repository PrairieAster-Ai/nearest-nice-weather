/**
 * ========================================================================
 * WEATHER FILTERING SERVICE TESTS
 * ========================================================================
 *
 * The service is a thin, stable wrapper over the (separately, heavily tested)
 * weatherFilteringUtils. These tests verify the wrapper's own contract:
 * delegation, the empty-input / empty-result short-circuits, distance helpers,
 * and the singleton export — without re-asserting percentile thresholds (the
 * project explicitly forbids tuning/depending on those in tests).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  WeatherFilteringService,
  weatherFilteringService,
  type Location,
} from '../WeatherFilteringService'

const mkLocation = (over: Partial<Location> & { id: string }): Location => ({
  name: `POI ${over.id}`,
  lat: 45,
  lng: -93,
  temperature: 70,
  precipitation: 10,
  windSpeed: 5,
  condition: 'Clear',
  description: 'nice',
  ...over,
})

// A spread of Minneapolis-area POIs at varying distances from downtown.
const downtown: [number, number] = [44.9778, -93.265]
const locations: Location[] = [
  mkLocation({ id: '1', lat: 44.9778, lng: -93.265, temperature: 60 }), // ~0 mi
  mkLocation({ id: '2', lat: 45.05, lng: -93.3, temperature: 72 }), // ~5 mi
  mkLocation({ id: '3', lat: 45.2, lng: -93.4, temperature: 80 }), // ~17 mi
  mkLocation({ id: '4', lat: 46.0, lng: -94.0, temperature: 50 }), // ~85 mi
]

describe('WeatherFilteringService', () => {
  let service: WeatherFilteringService
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    service = new WeatherFilteringService()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('calculateDistance', () => {
    it('returns ~0 for identical points', () => {
      expect(service.calculateDistance(downtown, downtown)).toBeCloseTo(0, 5)
    })

    it('computes a positive great-circle distance between distinct points', () => {
      const d = service.calculateDistance([44.9778, -93.265], [44.9537, -93.09])
      // Downtown Minneapolis to ~St Paul: order of ~8-9 miles.
      expect(d).toBeGreaterThan(5)
      expect(d).toBeLessThan(15)
    })
  })

  describe('applyWeatherFilters', () => {
    it('returns an empty array immediately when given no locations', () => {
      const result = service.applyWeatherFilters([], {
        temperature: 'mild',
        precipitation: 'none',
        wind: 'calm',
      })
      expect(result).toEqual([])
      // Empty-input short-circuit happens before the filtering log line.
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('returns a subset of the input locations (never invents new ones)', () => {
      const filtered = service.applyWeatherFilters(locations, {
        temperature: 'mild',
        precipitation: 'none',
        wind: 'calm',
      })

      expect(Array.isArray(filtered)).toBe(true)
      expect(filtered.length).toBeLessThanOrEqual(locations.length)
      const inputIds = new Set(locations.map((l) => l.id))
      filtered.forEach((loc) => expect(inputIds.has(loc.id)).toBe(true))
    })

    it('honours a maxDistance cap relative to the user location', () => {
      const filtered = service.applyWeatherFilters(
        locations,
        { temperature: 'mild', precipitation: 'none', wind: 'calm' },
        downtown,
        10, // miles
      )
      // The ~85mi-away POI (id 4) must be excluded by the distance cap.
      expect(filtered.find((l) => l.id === '4')).toBeUndefined()
    })

    it('logs the filtering summary when locations are provided', () => {
      service.applyWeatherFilters(locations, {
        temperature: 'mild',
        precipitation: 'none',
        wind: 'calm',
      })
      const logged = consoleLogSpy.mock.calls.map((c) => String(c[0]))
      expect(logged.some((l) => l.includes('WEATHER FILTERING'))).toBe(true)
    })
  })

  describe('calculateFilterResultCounts', () => {
    it('returns an empty object for no visible POIs', () => {
      expect(service.calculateFilterResultCounts([])).toEqual({})
    })

    it('returns per-option counts equal to the visible POI count', () => {
      const counts = service.calculateFilterResultCounts(locations)
      expect(counts.temperature_mild).toBe(locations.length)
      expect(counts.precipitation_none).toBe(locations.length)
      expect(counts.wind_calm).toBe(locations.length)
    })
  })

  describe('filterByDistance', () => {
    it('keeps only locations within the radius', () => {
      const within = service.filterByDistance(locations, downtown, 10)
      const ids = within.map((l) => l.id)
      expect(ids).toContain('1')
      expect(ids).not.toContain('4')
    })

    it('returns everything when the radius is very large', () => {
      const within = service.filterByDistance(locations, downtown, 5000)
      expect(within).toHaveLength(locations.length)
    })
  })

  describe('sortByDistance', () => {
    it('orders locations closest-first from the user location', () => {
      const sorted = service.sortByDistance(locations, downtown)
      expect(sorted[0].id).toBe('1')
      expect(sorted[sorted.length - 1].id).toBe('4')
    })

    it('does not mutate the original array', () => {
      const copy = [...locations]
      service.sortByDistance(locations, downtown)
      expect(locations).toEqual(copy)
    })
  })

  describe('singleton', () => {
    it('exports a ready-to-use instance', () => {
      expect(weatherFilteringService).toBeInstanceOf(WeatherFilteringService)
    })
  })
})
