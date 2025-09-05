/**
 * ========================================================================
 * USE WEATHER SEARCH HOOK TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Comprehensive testing for useWeatherSearch hook functionality
 * 🔗 HOOK: useWeatherSearch - Weather search API integration with filtering
 * 📊 COVERAGE: State management, API calls, error handling, data transformation
 * ⚙️ FUNCTIONALITY: Weather location search, filtering, loading states
 * 🎯 BUSINESS_IMPACT: Ensures reliable weather location search functionality
 *
 * LAST UPDATED: 2025-08-13
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWeatherSearch } from '../useWeatherSearch'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:4000',
      VITE_API_TIMEOUT: '10000'
    }
  }
})

describe('useWeatherSearch Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('✅ Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useWeatherSearch())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.results).toEqual([])
      expect(typeof result.current.searchWeather).toBe('function')
      expect(typeof result.current.clearResults).toBe('function')
    })
  })

  describe('📝 Filter Validation', () => {
    it('should validate required filter fields before searching', async () => {
      const { result } = renderHook(() => useWeatherSearch())

      // Missing temperature
      await act(async () => {
        await result.current.searchWeather({
          precipitation: 'none',
          wind: 'calm'
        } as any)
      })

      expect(result.current.error).toBe('Please select all weather preferences')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate all required fields are present', async () => {
      const { result } = renderHook(() => useWeatherSearch())

      // Missing precipitation
      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          wind: 'calm'
        } as any)
      })

      expect(result.current.error).toBe('Please select all weather preferences')

      // Missing wind
      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none'
        } as any)
      })

      expect(result.current.error).toBe('Please select all weather preferences')
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('🔄 API Integration', () => {
    it('should make API call with valid filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 1, name: 'Location 1', lat: 45.0, lng: -93.0 },
            { id: 2, name: 'Location 2', lat: 44.0, lng: -92.0 }
          ]
        })
      })

      const { result } = renderHook(() => useWeatherSearch())

      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/poi-locations-with-weather',
        expect.objectContaining({
          method: 'GET',
          signal: expect.any(AbortSignal)
        })
      )

      expect(result.current.results).toHaveLength(2)
      expect(result.current.error).toBe(null)
      expect(result.current.loading).toBe(false)
    })

    it('should handle successful API response', async () => {
      const mockData = [
        { id: 1, name: 'Park 1', lat: 45.0, lng: -93.0, temperature: 72 },
        { id: 2, name: 'Park 2', lat: 44.0, lng: -92.0, temperature: 68 }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData })
      })

      const { result } = renderHook(() => useWeatherSearch())

      await act(async () => {
        await result.current.searchWeather({
          temperature: 'mild',
          precipitation: 'light',
          wind: 'light'
        })
      })

      expect(result.current.results).toEqual(mockData)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      const { result } = renderHook(() => useWeatherSearch())

      await act(async () => {
        await result.current.searchWeather({
          temperature: 'cool',
          precipitation: 'any',
          wind: 'windy'
        })
      })

      expect(result.current.results).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle missing data field in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const { result } = renderHook(() => useWeatherSearch())

      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      expect(result.current.results).toEqual([])
      expect(result.current.loading).toBe(false)
    })
  })

  describe('⏱️ Loading States', () => {
    it('should set loading state during API call', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(pendingPromise)

      const { result } = renderHook(() => useWeatherSearch())

      const searchPromise = act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      // Check loading state immediately
      expect(result.current.loading).toBe(true)

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ data: [] })
      })

      await searchPromise

      expect(result.current.loading).toBe(false)
    })
  })

  describe('❌ Error Handling', () => {
    it('should handle HTTP error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      })

      const { result } = renderHook(() => useWeatherSearch())

      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      expect(result.current.error).toBe('Failed to search for weather locations: 500')
      expect(result.current.results).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useWeatherSearch())

      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.results).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should handle timeout errors', async () => {
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError)

      const { result } = renderHook(() => useWeatherSearch())

      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      expect(result.current.error).toBe('Request timed out. Please try again.')
      expect(result.current.results).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should handle unexpected errors', async () => {
      mockFetch.mockRejectedValueOnce('Unexpected error type')

      const { result } = renderHook(() => useWeatherSearch())

      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      expect(result.current.error).toBe('An unexpected error occurred')
      expect(result.current.results).toEqual([])
    })
  })

  describe('🧹 Clear Results', () => {
    it('should clear results and error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 1, name: 'Test Location' }]
        })
      })

      const { result } = renderHook(() => useWeatherSearch())

      // First perform a search
      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      expect(result.current.results).toHaveLength(1)

      // Clear results
      act(() => {
        result.current.clearResults()
      })

      expect(result.current.results).toEqual([])
      expect(result.current.error).toBe(null)
    })

    it('should clear error state', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      const { result } = renderHook(() => useWeatherSearch())

      // First cause an error
      await act(async () => {
        await result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })
      })

      expect(result.current.error).toBe('Test error')

      // Clear results
      act(() => {
        result.current.clearResults()
      })

      expect(result.current.error).toBe(null)
      expect(result.current.results).toEqual([])
    })
  })

  describe('⚡ Request Cancellation', () => {
    it('should abort request on timeout', async () => {
      const controller = new AbortController()
      const abortSpy = vi.spyOn(controller, 'abort')

      // Mock AbortController
      global.AbortController = vi.fn(() => controller) as any

      // Create a promise that doesn't resolve immediately
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      const { result } = renderHook(() => useWeatherSearch())

      const searchPromise = result.current.searchWeather({
        temperature: 'warm',
        precipitation: 'none',
        wind: 'calm'
      })

      // Fast-forward timers to trigger timeout
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // The abort should have been called
      await waitFor(() => {
        expect(abortSpy).toHaveBeenCalled()
      })

      // Restore original AbortController
      global.AbortController = AbortController
    })
  })

  describe('🔄 Hook Stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useWeatherSearch())

      const firstSearchWeather = result.current.searchWeather
      const firstClearResults = result.current.clearResults

      rerender()

      expect(result.current.searchWeather).toBe(firstSearchWeather)
      expect(result.current.clearResults).toBe(firstClearResults)
    })

    it('should handle rapid successive searches', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: 1 }] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: 2 }] })
        })

      const { result } = renderHook(() => useWeatherSearch())

      // Fire two searches rapidly
      await act(async () => {
        const search1 = result.current.searchWeather({
          temperature: 'warm',
          precipitation: 'none',
          wind: 'calm'
        })

        const search2 = result.current.searchWeather({
          temperature: 'cool',
          precipitation: 'light',
          wind: 'light'
        })

        await Promise.all([search1, search2])
      })

      // Should have the result from the last search
      expect(result.current.results).toEqual([{ id: 2 }])
    })
  })
})

/**
 * 📊 TEST COVERAGE SUMMARY:
 * ✅ Initial state validation
 * ✅ Filter validation before API calls
 * ✅ Successful API integration
 * ✅ Empty results handling
 * ✅ Loading state management
 * ✅ HTTP error handling
 * ✅ Network error handling
 * ✅ Timeout error handling
 * ✅ Clear results functionality
 * ✅ Request cancellation on timeout
 * ✅ Hook stability and memoization
 * ✅ Rapid successive searches
 *
 * 🎯 BUSINESS COVERAGE:
 * ✅ Weather preference filtering
 * ✅ Location search functionality
 * ✅ Error recovery flows
 * ✅ User experience optimization
 */
