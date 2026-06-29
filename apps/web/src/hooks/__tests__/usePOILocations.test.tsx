/**
 * ========================================================================
 * usePOILocations HOOK TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Cover the POI-with-weather data hook: query construction,
 *             success/error states, the derived/computed values, and the
 *             refetch path.
 * 🔗 HOOK: hooks/usePOILocations.ts
 *
 * fetch is stubbed (bypassing MSW) so each test controls the API response.
 * No mock-data fallbacks are asserted — on error the hook surfaces an error and
 * an empty list, which is the documented behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePOILocations } from '../usePOILocations'

const poi = (over: Record<string, unknown> = {}) => ({
  id: '1',
  name: 'Minnehaha Falls',
  lat: 44.91,
  lng: -93.21,
  temperature: 72,
  condition: 'Clear',
  description: 'clear sky',
  precipitation: 0,
  windSpeed: 5,
  park_type: 'Regional Park',
  weather_station_name: 'MSP Airport',
  weather_distance_miles: '4.0',
  ...over,
})

const jsonResponse = (body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}) =>
  Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: () => Promise.resolve(body),
  } as Response)

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('usePOILocations', () => {
  it('fetches on mount and exposes the returned locations', async () => {
    const data = [poi(), poi({ id: '2', name: 'Como Park', weather_station_name: null, weather_distance_miles: null })]
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: true, data, count: 2, timestamp: 'now' })))

    const { result } = renderHook(() => usePOILocations())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.locations).toHaveLength(2)
    expect(result.current.error).toBeNull()
    expect(result.current.hasData).toBe(true)
    expect(result.current.isEmpty).toBe(false)
    expect(result.current.lastFetch).toBeInstanceOf(Date)
  })

  it('includes lat/lng/radius params only when a valid user location is supplied', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ success: true, data: [], count: 0, timestamp: 'now' }))
    vi.stubGlobal('fetch', fetchMock)

    // Stable references so the data-fetch effect does not re-run on every render.
    const userLocation: [number, number] = [44.95, -93.1]
    const { result } = renderHook(() =>
      usePOILocations({ userLocation, radius: 75, weatherRadius: 30, limit: 100 })
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('lat=44.95')
    expect(url).toContain('lng=-93.1')
    expect(url).toContain('radius=75')
    expect(url).toContain('weather_radius=30')
    expect(url).toContain('limit=100')
  })

  it('omits lat/lng when the user location contains NaN coordinates', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ success: true, data: [], count: 0, timestamp: 'now' }))
    vi.stubGlobal('fetch', fetchMock)

    const userLocation: [number, number] = [NaN, NaN]
    const { result } = renderHook(() => usePOILocations({ userLocation }))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).not.toContain('lat=')
    expect(url).not.toContain('lng=')
    // The POI radius param is omitted (weather_radius is always present).
    expect(url).not.toMatch(/[?&]radius=/)
  })

  it('surfaces an error and an empty list when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({}, { ok: false, status: 500, statusText: 'Internal Server Error' })))

    const { result } = renderHook(() => usePOILocations())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toMatch(/HTTP 500/)
    expect(result.current.locations).toEqual([])
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.hasData).toBe(false)
  })

  it('surfaces the API error message when success is false', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: false, data: [], count: 0, timestamp: 'now', error: 'No POI data loaded' })))

    const { result } = renderHook(() => usePOILocations())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('No POI data loaded')
  })

  it('computes POI-derived values (weather coverage, park types, avg distance)', async () => {
    const data = [
      poi({ id: '1', park_type: 'State Park', weather_station_name: 'A', weather_distance_miles: '2' }),
      poi({ id: '2', park_type: 'State Park', weather_station_name: 'B', weather_distance_miles: '4' }),
      poi({ id: '3', park_type: 'Trail', weather_station_name: null, weather_distance_miles: null }),
    ]
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: true, data, count: 3, timestamp: 'now' })))

    const { result } = renderHook(() => usePOILocations())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.poisWithWeather).toHaveLength(2)
    expect(result.current.poisWithoutWeather).toHaveLength(1)
    expect(result.current.uniqueParkTypes.sort()).toEqual(['State Park', 'Trail'])
    // Average of the two POIs that have a weather distance: (2 + 4) / 2 = 3
    expect(result.current.averageWeatherDistance).toBe(3)
  })

  it('refetch triggers a second request', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ success: true, data: [poi()], count: 1, timestamp: 'now' }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => usePOILocations())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await result.current.refetch()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})
