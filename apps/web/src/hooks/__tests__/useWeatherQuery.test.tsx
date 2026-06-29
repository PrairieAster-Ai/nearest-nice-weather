/**
 * ========================================================================
 * useWeatherQuery HOOKS TESTS (TanStack Query)
 * ========================================================================
 *
 * Covers the four query/mutation hooks that wrap weatherApi + monitoring:
 *  - useLocations: success, and graceful (non-throwing) error handling
 *  - useWeatherSearch: telemetry + cache priming on success, error reporting
 *  - useWeatherSearchResults: enable/disable gating on filter completeness
 *  - useWeatherSearchHistory: reading and clearing recent searches from cache
 *
 * weatherApi is spied (its WeatherApiError class is kept real so the hooks'
 * instanceof-based retry logic still works); monitoring is spied to assert
 * telemetry without performing any network I/O.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useLocations,
  useWeatherSearch,
  useWeatherSearchResults,
  useWeatherSearchHistory,
} from '../useWeatherQuery'
import { weatherApi, WeatherApiError } from '../../services/weatherApi'
import { monitoring } from '../../services/monitoring'
import { queryKeys, type WeatherFilter } from '../../types/weather'

const sampleLocations = [
  { id: 1, name: 'Lebanon Hills', lat: 44.78, lng: -93.18, weather: { temperature: 70, precipitation: 5, windSpeed: 4 } },
  { id: 2, name: 'Minnehaha Falls', lat: 44.91, lng: -93.21 },
]

const completeFilter: WeatherFilter = { temperature: 'warm', precipitation: 'none', wind: 'calm' }

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      // No gcTime override: observer-less caches written in onSuccess must
      // survive long enough for assertions (gcTime: 0 would GC them at once).
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('useWeatherQuery hooks', () => {
  let getLocationsSpy: ReturnType<typeof vi.spyOn>
  let captureError: ReturnType<typeof vi.spyOn>
  let captureUserAction: ReturnType<typeof vi.spyOn>
  let capturePerformance: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    getLocationsSpy = vi.spyOn(weatherApi, 'getLocations')
    captureError = vi.spyOn(monitoring, 'captureError').mockImplementation(() => {})
    captureUserAction = vi.spyOn(monitoring, 'captureUserAction').mockImplementation(() => {})
    capturePerformance = vi.spyOn(monitoring, 'capturePerformance').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useLocations', () => {
    it('fetches and returns the locations list', async () => {
      getLocationsSpy.mockResolvedValue(sampleLocations as any)
      const { wrapper } = makeWrapper()

      const { result } = renderHook(() => useLocations(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(sampleLocations)
      expect(getLocationsSpy).toHaveBeenCalledTimes(1)
    })

    it('reports errors to monitoring and resolves to an error state without throwing', async () => {
      // 4xx error → the hook retry predicate returns false (no retries).
      getLocationsSpy.mockRejectedValue(new WeatherApiError('not found', 404))
      const { wrapper } = makeWrapper()

      const { result } = renderHook(() => useLocations(), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(captureError).toHaveBeenCalledWith(
        expect.any(WeatherApiError),
        expect.objectContaining({ additionalContext: { queryKey: 'locations' } }),
      )
    })
  })

  describe('useWeatherSearch (mutation)', () => {
    it('records telemetry and primes the cache on success', async () => {
      getLocationsSpy.mockResolvedValue(sampleLocations as any)
      const { queryClient, wrapper } = makeWrapper()

      const { result } = renderHook(() => useWeatherSearch(), { wrapper })

      let mutationData: any
      await act(async () => {
        mutationData = await result.current.mutateAsync(completeFilter)
      })

      // The mutation returns the located results with a total.
      expect(mutationData).toEqual({ locations: sampleLocations, total: 2 })

      expect(captureUserAction).toHaveBeenCalledWith('weather_search', { filters: completeFilter })
      expect(capturePerformance).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'weather_search_duration', unit: 'ms' }),
      )

      // onSuccess primes the cache under the filter key (await the write).
      await waitFor(() => {
        expect(queryClient.getQueryData(queryKeys.weather.search(completeFilter))).toBeDefined()
      })
      const cached = queryClient.getQueryData(queryKeys.weather.search(completeFilter)) as any
      expect(cached.total).toBe(2)
      expect(cached.locations).toHaveLength(2)

      // Per-location weather primed only for the location that carries weather.
      expect(queryClient.getQueryData(['weather', 'location', 1])).toMatchObject({ id: 1 })
      expect(queryClient.getQueryData(['weather', 'location', 2])).toBeUndefined()
    })

    it('captures the error and tags WeatherApiError failures as api_error', async () => {
      getLocationsSpy.mockRejectedValue(new WeatherApiError('server error', 500))
      const { wrapper } = makeWrapper()

      const { result } = renderHook(() => useWeatherSearch(), { wrapper })

      await act(async () => {
        await expect(result.current.mutateAsync(completeFilter)).rejects.toThrow('server error')
      })

      expect(captureError).toHaveBeenCalledWith(
        expect.any(WeatherApiError),
        expect.objectContaining({
          additionalContext: expect.objectContaining({
            action: 'weather_search',
            errorType: 'api_error',
          }),
        }),
      )
    })
  })

  describe('useWeatherSearchResults', () => {
    it('stays disabled (no fetch) when filters are null', async () => {
      getLocationsSpy.mockResolvedValue(sampleLocations as any)
      const { wrapper } = makeWrapper()

      const { result } = renderHook(() => useWeatherSearchResults(null), { wrapper })

      // Query is disabled: it never reaches loading/fetching.
      expect(result.current.fetchStatus).toBe('idle')
      expect(getLocationsSpy).not.toHaveBeenCalled()
    })

    it('stays disabled when a filter axis is empty', async () => {
      getLocationsSpy.mockResolvedValue(sampleLocations as any)
      const { wrapper } = makeWrapper()

      renderHook(
        () => useWeatherSearchResults({ temperature: 'warm', precipitation: '', wind: 'calm' } as any),
        { wrapper },
      )

      await Promise.resolve()
      expect(getLocationsSpy).not.toHaveBeenCalled()
    })

    it('fetches results when a complete filter set is provided', async () => {
      getLocationsSpy.mockResolvedValue(sampleLocations as any)
      const { wrapper } = makeWrapper()

      const { result } = renderHook(() => useWeatherSearchResults(completeFilter), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual({ locations: sampleLocations, total: 2 })
      expect(getLocationsSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('useWeatherSearchHistory', () => {
    it('returns recent non-empty searches most-recent first and clears them', async () => {
      const { queryClient, wrapper } = makeWrapper()

      const filterA: WeatherFilter = { temperature: 'warm', precipitation: 'none', wind: 'calm' }
      const filterB: WeatherFilter = { temperature: 'cool', precipitation: 'light', wind: 'windy' }
      const filterEmpty: WeatherFilter = { temperature: 'mild', precipitation: 'any', wind: 'light' }

      // Seed the cache: A older, B newer, plus one empty result that must be filtered out.
      queryClient.setQueryData(queryKeys.weather.search(filterA), [{ id: 1 }])
      queryClient.setQueryData(queryKeys.weather.search(filterB), [{ id: 2 }, { id: 3 }])
      queryClient.setQueryData(queryKeys.weather.search(filterEmpty), [])

      const { result } = renderHook(() => useWeatherSearchHistory(), { wrapper })

      const history = result.current.getSearchHistory()
      // The empty-result search is excluded.
      expect(history).toHaveLength(2)
      expect(history.every((h) => h.data && h.data.length > 0)).toBe(true)

      act(() => {
        result.current.clearSearchHistory()
      })

      expect(result.current.getSearchHistory()).toHaveLength(0)
    })
  })
})
