/**
 * ========================================================================
 * useWeatherFiltering HOOK TESTS
 * ========================================================================
 *
 * Verifies the hook's type-converting wrapper around WeatherFilteringService:
 * memoized FAB badge counts, the on-demand applyWeatherFilters function,
 * windSpeed defaulting, the >21-marker diagnostic branch, and memo stability.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWeatherFiltering, type Location } from '../useWeatherFiltering'

const mkLocation = (over: Partial<Location> & { id: string }): Location => ({
  name: `POI ${over.id}`,
  lat: 45,
  lng: -93,
  temperature: 68,
  condition: 'Clear',
  description: 'pleasant',
  precipitation: 10,
  windSpeed: 5,
  ...over,
})

describe('useWeatherFiltering', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('returns the filtering function and memoized badge counts', () => {
    const pois = [mkLocation({ id: '1' }), mkLocation({ id: '2' })]
    const { result } = renderHook(() => useWeatherFiltering(pois, [44.97, -93.26]))

    expect(typeof result.current.applyWeatherFilters).toBe('function')
    expect(result.current.filterResultCounts.temperature_mild).toBe(2)
    expect(result.current.filterResultCounts.wind_calm).toBe(2)
  })

  it('returns empty badge counts for an empty POI list', () => {
    const { result } = renderHook(() => useWeatherFiltering([], null))
    expect(result.current.filterResultCounts).toEqual({})
  })

  it('applyWeatherFilters returns a subset drawn from the input locations', () => {
    const pois = [
      mkLocation({ id: '1', temperature: 55 }),
      mkLocation({ id: '2', temperature: 70 }),
      mkLocation({ id: '3', temperature: 85 }),
    ]
    const { result } = renderHook(() => useWeatherFiltering(pois, [44.97, -93.26]))

    const filtered = result.current.applyWeatherFilters(pois, {
      temperature: 'mild',
      precipitation: 'none',
      wind: 'calm',
    })

    expect(filtered.length).toBeLessThanOrEqual(pois.length)
    const inputIds = new Set(pois.map((p) => p.id))
    filtered.forEach((loc) => {
      expect(inputIds.has(loc.id)).toBe(true)
      // Round-trip conversion preserves the local Location shape.
      expect(loc).toHaveProperty('condition')
      expect(loc).toHaveProperty('description')
      expect(typeof loc.windSpeed).toBe('number')
    })
  })

  it('defaults missing windSpeed to 0 during conversion without throwing', () => {
    const poiMissingWind = { ...mkLocation({ id: 'w' }) }
    // Simulate upstream data where windSpeed is absent.
    delete (poiMissingWind as Partial<Location>).windSpeed
    const pois = [poiMissingWind as Location]

    const { result } = renderHook(() => useWeatherFiltering(pois, null))
    expect(() =>
      result.current.applyWeatherFilters(pois, {
        temperature: 'mild',
        precipitation: 'none',
        wind: 'calm',
      }),
    ).not.toThrow()
    // Counts are still computed from the (converted) POIs.
    expect(result.current.filterResultCounts.temperature_mild).toBe(1)
  })

  it('logs an error diagnostic when more than 21 markers pass the filter', () => {
    // 25 identical, distance-free POIs with permissive filters → all pass.
    const pois = Array.from({ length: 25 }, (_, i) => mkLocation({ id: String(i) }))
    const { result } = renderHook(() => useWeatherFiltering(pois, null))

    const filtered = result.current.applyWeatherFilters(pois, {
      temperature: '',
      precipitation: '',
      wind: '',
    })

    expect(filtered.length).toBe(25)
    const errors = consoleErrorSpy.mock.calls.map((c) => String(c[0]))
    expect(errors.some((e) => e.includes('Displaying 25 markers'))).toBe(true)
  })

  it('logs the normal marker-count line when at most 21 markers pass', () => {
    const pois = [mkLocation({ id: '1' }), mkLocation({ id: '2' })]
    const { result } = renderHook(() => useWeatherFiltering(pois, null))

    result.current.applyWeatherFilters(pois, {
      temperature: '',
      precipitation: '',
      wind: '',
    })

    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0]))
    expect(logs.some((l) => l.includes('Total markers to display'))).toBe(true)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('keeps applyWeatherFilters stable across re-renders with the same user location', () => {
    const pois = [mkLocation({ id: '1' })]
    const userLocation: [number, number] = [44.97, -93.26]
    const { result, rerender } = renderHook(
      ({ p, u }) => useWeatherFiltering(p, u),
      { initialProps: { p: pois, u: userLocation } },
    )

    const firstFn = result.current.applyWeatherFilters
    rerender({ p: [...pois], u: userLocation })
    expect(result.current.applyWeatherFilters).toBe(firstFn)
  })
})
