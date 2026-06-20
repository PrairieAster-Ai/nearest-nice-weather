/**
 * Tests for the shared POI+weather core orchestration.
 * Exercises the framework-agnostic core directly with injected fakes, so the
 * contract both adapters depend on (row transform, weather enrichment field
 * names, filtering, response shape) is locked independent of pg/Neon.
 */

import { describe, test, expect, vi } from 'vitest'
import { getPOILocationsWithWeather } from '../poiLocationsWithWeather.js'

const rows = [
  { id: 1, name: 'Wirth Park', lat: '44.98', lng: '-93.31', place_rank: 2, distance_miles: '1.234' },
  { id: 2, name: 'Como Park', lat: '44.98', lng: '-93.15', place_rank: 5, distance_miles: '7.5' },
]

const weather = {
  temperature: 70,
  condition: 'Clear',
  weather_description: 'clear sky',
  precipitation: 10,
  windSpeed: 5,
  weather_source: 'openweather',
  weather_timestamp: '2026-01-01T00:00:00.000Z',
}

const deps = (overrides = {}) => ({
  runPOIQuery: vi.fn(async () => rows),
  fetchWeather: vi.fn(async () => weather),
  ...overrides,
})

describe('getPOILocationsWithWeather (shared core)', () => {
  test('returns standardized success response with weather-enriched POIs', async () => {
    const d = deps()
    const body = await getPOILocationsWithWeather({ lat: '44.9', lng: '-93.2', limit: '50' }, d)

    expect(body.success).toBe(true)
    expect(body.count).toBe(2)
    expect(body.data).toHaveLength(2)
    expect(body.debug.query_type).toBe('proximity_with_weather')
    expect(body.debug.data_source).toBe('poi_with_real_weather')
    expect(d.runPOIQuery).toHaveBeenCalledWith({ lat: '44.9', lng: '-93.2', limit: 50 })
  })

  test('maps weather using the canonical field names (regression: dev used .description/.source)', async () => {
    const body = await getPOILocationsWithWeather({ lat: '44.9', lng: '-93.2' }, deps())
    const poi = body.data[0]
    expect(poi.weather_description).toBe('clear sky')
    expect(poi.weather_source).toBe('openweather')
    expect(poi.weather_timestamp).toBe('2026-01-01T00:00:00.000Z')
    expect(poi.temperature).toBe(70)
    expect(poi.windSpeed).toBe(5)
  })

  test('calls the injected weather fetcher once per POI', async () => {
    const d = deps()
    await getPOILocationsWithWeather({}, d)
    expect(d.fetchWeather).toHaveBeenCalledTimes(rows.length)
  })

  test('non-proximity request reports all_pois_with_weather and null user_location', async () => {
    const body = await getPOILocationsWithWeather({ limit: '10' }, deps())
    expect(body.debug.query_type).toBe('all_pois_with_weather')
    expect(body.debug.user_location).toBeNull()
  })

  test('caps limit at 500 before querying', async () => {
    const d = deps()
    await getPOILocationsWithWeather({ limit: '99999' }, d)
    expect(d.runPOIQuery).toHaveBeenCalledWith({ lat: undefined, lng: undefined, limit: 500 })
  })

  test('propagates query errors to the adapter (adapter owns HTTP 500)', async () => {
    const d = deps({ runPOIQuery: vi.fn(async () => { throw new Error('db down') }) })
    await expect(getPOILocationsWithWeather({}, d)).rejects.toThrow('db down')
  })
})
