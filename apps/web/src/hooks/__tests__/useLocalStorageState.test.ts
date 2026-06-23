/**
 * ========================================================================
 * USE LOCAL STORAGE STATE HOOK TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Comprehensive testing for localStorage state management hook
 * 🔗 HOOK: useLocalStorageState - Persistent user preferences across sessions
 * 📊 COVERAGE: State persistence, JSON serialization, error handling, typed hooks
 * ⚙️ FUNCTIONALITY: Cross-session state management for weather preferences
 * 🎯 BUSINESS_IMPACT: Ensures user preferences persist for better UX retention
 *
 * BUSINESS CONTEXT: User retention through preference persistence
 * - Tests weather filter preference storage
 * - Validates location data persistence
 * - Ensures map view settings are remembered
 * - Verifies UI state consistency across sessions
 *
 * TECHNICAL COVERAGE: React hook testing with localStorage
 * - localStorage read/write operations
 * - JSON serialization/deserialization
 * - Error handling for storage failures
 * - Type safety for specialized hooks
 *
 * LAST UPDATED: 2025-08-13
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  useLocalStorageState,
  useWeatherFiltersStorage,
  useUserLocationStorage,
  useMapViewStorage,
  useLocationMethodStorage,
  useShowLocationPromptStorage,
  useLastVisitStorage,
  STORAGE_KEYS,
  type WeatherFilters,
  type MapViewSettings,
  type LocationMethod
} from '../useLocalStorageState'
import { createLocalStorageMock } from '../../test/localStorage-setup'

// Create isolated localStorage mock for this test file
const localStorageMock = createLocalStorageMock()

// Replace global localStorage with mock (merge with existing)
if (typeof global.localStorage !== 'undefined') {
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  })
}

// Mock window.localStorage for SSR tests (preserve existing window properties)
if (typeof global.window !== 'undefined') {
  Object.defineProperty(global.window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  })
}

describe('useLocalStorageState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset the store
    Object.keys(localStorageMock.store).forEach(key => {
      delete localStorageMock.store[key]
    })

    // Ensure window.event exists before each test (React-DOM requirement)
    if (typeof global.window !== 'undefined' && !global.window.hasOwnProperty('event')) {
      Object.defineProperty(global.window, 'event', {
        get() {
          return undefined
        },
        configurable: true
      })
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('✅ Basic Functionality', () => {
    it('should initialize with default value when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useLocalStorageState('testKey', 'defaultValue')
      )

      expect(result.current[0]).toBe('defaultValue')
    })

    it('should initialize with stored value when localStorage has data', () => {
      localStorageMock.store['testKey'] = JSON.stringify('storedValue')

      const { result } = renderHook(() =>
        useLocalStorageState('testKey', 'defaultValue')
      )

      expect(result.current[0]).toBe('storedValue')
    })

    it('should update state and localStorage when value changes', () => {
      const { result } = renderHook(() =>
        useLocalStorageState('testKey', 'initial')
      )

      act(() => {
        result.current[1]('updated')
      })

      expect(result.current[0]).toBe('updated')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'testKey',
        JSON.stringify('updated')
      )
    })

    it('should handle functional updates', () => {
      const { result } = renderHook(() =>
        useLocalStorageState('counter', 0)
      )

      act(() => {
        result.current[1](prev => prev + 1)
      })

      expect(result.current[0]).toBe(1)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'counter',
        JSON.stringify(1)
      )
    })
  })

  describe('✅ Data Type Handling', () => {
    it('should handle string values', () => {
      const { result } = renderHook(() =>
        useLocalStorageState('stringKey', 'hello')
      )

      act(() => {
        result.current[1]('world')
      })

      expect(result.current[0]).toBe('world')
    })

    it('should handle number values', () => {
      const { result } = renderHook(() =>
        useLocalStorageState('numberKey', 42)
      )

      act(() => {
        result.current[1](100)
      })

      expect(result.current[0]).toBe(100)
    })

    it('should handle boolean values', () => {
      const { result } = renderHook(() =>
        useLocalStorageState('boolKey', false)
      )

      act(() => {
        result.current[1](true)
      })

      expect(result.current[0]).toBe(true)
    })

    it('should handle object values', () => {
      const initialObj = { name: 'test', count: 1 }
      const updatedObj = { name: 'updated', count: 2 }

      const { result } = renderHook(() =>
        useLocalStorageState('objKey', initialObj)
      )

      act(() => {
        result.current[1](updatedObj)
      })

      expect(result.current[0]).toEqual(updatedObj)
    })

    it('should handle array values', () => {
      const initialArray = [1, 2, 3]
      const updatedArray = [4, 5, 6]

      const { result } = renderHook(() =>
        useLocalStorageState('arrayKey', initialArray)
      )

      act(() => {
        result.current[1](updatedArray)
      })

      expect(result.current[0]).toEqual(updatedArray)
    })

    it('should handle null values', () => {
      const { result } = renderHook(() =>
        useLocalStorageState<string | null>('nullKey', null)
      )

      act(() => {
        result.current[1]('not null')
      })

      expect(result.current[0]).toBe('not null')

      act(() => {
        result.current[1](null)
      })

      expect(result.current[0]).toBe(null)
    })
  })

  describe('✅ Error Handling', () => {
    it('should handle localStorage read errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage not available')
      })

      const { result } = renderHook(() =>
        useLocalStorageState('errorKey', 'default')
      )

      expect(result.current[0]).toBe('default')
    })

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.store['invalidKey'] = 'invalid-json'

      const { result } = renderHook(() =>
        useLocalStorageState('invalidKey', 'default')
      )

      expect(result.current[0]).toBe('default')
    })

    it('should handle localStorage write errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full')
      })

      const { result } = renderHook(() =>
        useLocalStorageState('writeErrorKey', 'initial')
      )

      // Should not throw error when trying to update
      act(() => {
        result.current[1]('updated')
      })

      expect(result.current[0]).toBe('updated')
    })

    it('should handle server-side rendering (no localStorage)', () => {
      // SSR environments have window but localStorage might be undefined or inaccessible
      // Mock a more realistic SSR scenario
      const originalGetItem = localStorageMock.getItem

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage is not available in SSR')
      })

      const { result } = renderHook(() =>
        useLocalStorageState('ssrKey', 'default')
      )

      // Should fall back to default value when localStorage is unavailable
      expect(result.current[0]).toBe('default')

      // Restore localStorage
      localStorageMock.getItem = originalGetItem
    })
  })

  describe('✅ Performance Optimization', () => {
    it('should not update state for identical values', () => {
      const { result } = renderHook(() =>
        useLocalStorageState('perfKey', { count: 1 })
      )

      const initialState = result.current[0]

      act(() => {
        result.current[1]({ count: 1 }) // Same value
      })

      // State should remain the same object reference
      expect(result.current[0]).toBe(initialState)
    })

    it('should maintain stable setState function reference', () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorageState('stableKey', 'value')
      )

      const initialSetState = result.current[1]

      rerender()

      expect(result.current[1]).toBe(initialSetState)
    })
  })

  describe('✅ Storage Keys Constants', () => {
    it('should export correct storage keys', () => {
      expect(STORAGE_KEYS.WEATHER_FILTERS).toBe('nearestNiceWeather_filters')
      expect(STORAGE_KEYS.USER_LOCATION).toBe('nearestNiceWeather_userLocation')
      expect(STORAGE_KEYS.LOCATION_METHOD).toBe('nearestNiceWeather_locationMethod')
      expect(STORAGE_KEYS.MAP_VIEW).toBe('nearestNiceWeather_mapView')
      expect(STORAGE_KEYS.LAST_VISIT).toBe('nearestNiceWeather_lastVisit')
      expect(STORAGE_KEYS.SHOW_LOCATION_PROMPT).toBe('nearestNiceWeather_showLocationPrompt')
    })

    it('should have consistent naming pattern', () => {
      const keys = Object.values(STORAGE_KEYS)

      keys.forEach(key => {
        expect(key).toMatch(/^nearestNiceWeather_/)
      })
    })
  })

  describe('✅ Specialized Weather Filters Hook', () => {
    it('should initialize with correct weather filter defaults', () => {
      const { result } = renderHook(() => useWeatherFiltersStorage())

      expect(result.current[0]).toEqual({
        temperature: 'mild',
        precipitation: 'none',
        wind: 'calm'
      })
    })

    it('should update weather filters correctly', () => {
      const { result } = renderHook(() => useWeatherFiltersStorage())

      const newFilters: WeatherFilters = {
        temperature: 'hot',
        precipitation: 'light',
        wind: 'breezy'
      }

      act(() => {
        result.current[1](newFilters)
      })

      expect(result.current[0]).toEqual(newFilters)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.WEATHER_FILTERS,
        JSON.stringify(newFilters)
      )
    })

    it('should handle partial weather filter updates', () => {
      const { result } = renderHook(() => useWeatherFiltersStorage())

      act(() => {
        result.current[1](prev => ({
          ...prev,
          temperature: 'cold'
        }))
      })

      expect(result.current[0]).toEqual({
        temperature: 'cold',
        precipitation: 'none',
        wind: 'calm'
      })
    })
  })

  describe('✅ Specialized Location Hook', () => {
    it('should initialize with null location', () => {
      const { result } = renderHook(() => useUserLocationStorage())

      expect(result.current[0]).toBeNull()
    })

    it('should handle coordinate updates', () => {
      const { result } = renderHook(() => useUserLocationStorage())

      const coordinates: [number, number] = [44.9537, -93.0900]

      act(() => {
        result.current[1](coordinates)
      })

      expect(result.current[0]).toEqual(coordinates)
    })

    it('should handle location clearing', () => {
      localStorageMock.store[STORAGE_KEYS.USER_LOCATION] = JSON.stringify([44.9537, -93.0900])

      const { result } = renderHook(() => useUserLocationStorage())

      act(() => {
        result.current[1](null)
      })

      expect(result.current[0]).toBeNull()
    })
  })

  describe('✅ Specialized Map View Hook', () => {
    it('should initialize with Minnesota center defaults', () => {
      const { result } = renderHook(() => useMapViewStorage())

      expect(result.current[0]).toEqual({
        center: [46.7296, -94.6859],
        zoom: 7
      })
    })

    it('should update map view settings', () => {
      const { result } = renderHook(() => useMapViewStorage())

      const newMapView: MapViewSettings = {
        center: [44.9537, -93.0900],
        zoom: 10
      }

      act(() => {
        result.current[1](newMapView)
      })

      expect(result.current[0]).toEqual(newMapView)
    })
  })

  describe('✅ Specialized Location Method Hook', () => {
    it('should initialize with none method', () => {
      const { result } = renderHook(() => useLocationMethodStorage())

      expect(result.current[0]).toBe('none')
    })

    it('should handle all location method types', () => {
      const { result } = renderHook(() => useLocationMethodStorage())

      const methods: LocationMethod[] = ['geolocation', 'ip', 'manual', 'none']

      methods.forEach(method => {
        act(() => {
          result.current[1](method)
        })

        expect(result.current[0]).toBe(method)
      })
    })
  })

  describe('✅ Specialized UI State Hooks', () => {
    it('should initialize show location prompt as true', () => {
      const { result } = renderHook(() => useShowLocationPromptStorage())

      expect(result.current[0]).toBe(true)
    })

    it('should handle prompt visibility changes', () => {
      const { result } = renderHook(() => useShowLocationPromptStorage())

      act(() => {
        result.current[1](false)
      })

      expect(result.current[0]).toBe(false)
    })

    it('should initialize last visit as null', () => {
      const { result } = renderHook(() => useLastVisitStorage())

      expect(result.current[0]).toBeNull()
    })

    it('should handle visit timestamp updates', () => {
      const { result } = renderHook(() => useLastVisitStorage())

      const timestamp = '2025-08-13T14:30:00.000Z'

      act(() => {
        result.current[1](timestamp)
      })

      expect(result.current[0]).toBe(timestamp)
    })
  })

  describe('🔧 Integration and Lifecycle', () => {
    it('should handle multiple hooks with different keys', () => {
      const { result: result1 } = renderHook(() =>
        useLocalStorageState('key1', 'value1')
      )
      const { result: result2 } = renderHook(() =>
        useLocalStorageState('key2', 'value2')
      )

      act(() => {
        result1.current[1]('updated1')
        result2.current[1]('updated2')
      })

      expect(result1.current[0]).toBe('updated1')
      expect(result2.current[0]).toBe('updated2')
    })

    it('should maintain consistency across re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorageState('consistentKey', 'initial')
      )

      act(() => {
        result.current[1]('updated')
      })

      rerender()

      expect(result.current[0]).toBe('updated')
    })

    it('should handle rapid successive updates', () => {
      const { result } = renderHook(() =>
        useLocalStorageState('rapidKey', 0)
      )

      act(() => {
        for (let i = 1; i <= 10; i++) {
          result.current[1](i)
        }
      })

      expect(result.current[0]).toBe(10)
    })
  })
})

/**
 * 📊 TEST COVERAGE SUMMARY:
 * ✅ Basic localStorage state management functionality
 * ✅ All data type handling (string, number, boolean, object, array, null)
 * ✅ Error handling for storage failures and invalid JSON
 * ✅ Performance optimization (identical value prevention, stable references)
 * ✅ Storage key constants validation
 * ✅ All specialized typed hooks (weather, location, map, UI state)
 * ✅ Integration testing with multiple hooks
 * ✅ Server-side rendering compatibility
 * ✅ Rapid update handling
 *
 * 🎯 BUSINESS COVERAGE:
 * ✅ User preference persistence for retention
 * ✅ Weather filter memory across sessions
 * ✅ Location data consistency
 * ✅ Map view settings preservation
 *
 * 🔧 TECHNICAL COVERAGE:
 * ✅ React hook lifecycle management
 * ✅ localStorage integration with error handling
 * ✅ JSON serialization/deserialization
 * ✅ TypeScript type safety validation
 */
