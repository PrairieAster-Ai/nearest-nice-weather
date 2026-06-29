/**
 * ========================================================================
 * USER LOCATION ESTIMATOR - SERVICE BEHAVIOR TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Cover the orchestration logic of the UserLocationEstimator class
 *             (the fallback chain, caching, browser-geolocation handling, and
 *             privacy helpers). The pure scoring/confidence helpers it composes
 *             already live in locationEstimationUtils and are tested separately.
 * 🔗 SERVICE: services/UserLocationEstimator.ts
 *
 * Strategy: ./ipGeolocation is mocked so the IP strategy is deterministic, and
 * navigator.geolocation / localStorage are stubbed per-test. No mock-data
 * fallbacks are asserted: the Minneapolis default is a genuine last-resort
 * estimate produced by the service, not an API stand-in.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UserLocationEstimator, locationEstimator } from '../UserLocationEstimator'
import type { LocationEstimate } from '../UserLocationEstimator'
import { fetchIPLocation } from '../ipGeolocation'

vi.mock('../ipGeolocation', () => ({
  fetchIPLocation: vi.fn(),
}))

const mockFetchIPLocation = vi.mocked(fetchIPLocation)

const ipEstimate = (): LocationEstimate => ({
  coordinates: [44.98, -93.27],
  accuracy: 3000,
  method: 'ip',
  timestamp: Date.now(),
  confidence: 'medium',
  source: 'ipapi_Minneapolis',
})

const MINNEAPOLIS: [number, number] = [44.9537, -93.09]

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  localStorage.clear()
  mockFetchIPLocation.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('UserLocationEstimator.getFallbackLocation (via getFastLocation)', () => {
  it('falls back to the Minneapolis default when IP geolocation fails and no cache exists', async () => {
    mockFetchIPLocation.mockRejectedValueOnce(new Error('IP geolocation unavailable'))
    const estimator = new UserLocationEstimator()

    const result = await estimator.getFastLocation()

    expect(result.method).toBe('fallback')
    expect(result.coordinates).toEqual(MINNEAPOLIS)
    expect(result.confidence).toBe('unknown')
    expect(result.source).toBe('default_minnesota')
    expect(result.accuracy).toBe(50000)
  })

  it('returns the IP estimate when available (no permission prompt)', async () => {
    mockFetchIPLocation.mockResolvedValueOnce(ipEstimate())
    const estimator = new UserLocationEstimator()

    const result = await estimator.getFastLocation()

    expect(result.method).toBe('ip')
    expect(result.coordinates).toEqual([44.98, -93.27])
    expect(mockFetchIPLocation).toHaveBeenCalledTimes(1)
  })
})

describe('UserLocationEstimator.estimateLocation', () => {
  it('selects the IP estimate and persists it to localStorage', async () => {
    mockFetchIPLocation.mockResolvedValueOnce(ipEstimate())
    const estimator = new UserLocationEstimator()

    const result = await estimator.estimateLocation()

    expect(result.method).toBe('ip')
    const cached = JSON.parse(localStorage.getItem('location_cache')!)
    expect(cached.coordinates).toEqual([44.98, -93.27])
    expect(cached.method).toBe('ip')
  })

  it('returns the Minneapolis fallback when every strategy fails', async () => {
    mockFetchIPLocation.mockRejectedValueOnce(new Error('IP geolocation unavailable'))
    const estimator = new UserLocationEstimator()

    const result = await estimator.estimateLocation()

    expect(result.method).toBe('fallback')
    expect(result.coordinates).toEqual(MINNEAPOLIS)
  })

  it('reads a previously persisted location from localStorage on a cold start', async () => {
    // No IP available, but a fresh cache entry exists.
    mockFetchIPLocation.mockRejectedValue(new Error('IP geolocation unavailable'))
    const fresh = {
      coordinates: [45.1, -93.2],
      accuracy: 200,
      method: 'manual',
      timestamp: Date.now(),
      confidence: 'high',
      source: 'user_set',
    }
    localStorage.setItem('location_cache', JSON.stringify(fresh))
    const estimator = new UserLocationEstimator()

    const result = await estimator.estimateLocation()

    // The cached entry is surfaced (relabeled as 'cached'), not the fallback.
    expect(result.method).toBe('cached')
    expect(result.coordinates).toEqual([45.1, -93.2])
  })

  it('ignores and evicts an expired localStorage cache entry', async () => {
    mockFetchIPLocation.mockRejectedValue(new Error('IP geolocation unavailable'))
    const stale = {
      coordinates: [45.1, -93.2],
      accuracy: 200,
      method: 'manual',
      timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago (> 30min cacheMaxAge)
      confidence: 'high',
      source: 'user_set',
    }
    localStorage.setItem('location_cache', JSON.stringify(stale))
    const estimator = new UserLocationEstimator()

    const result = await estimator.estimateLocation()

    expect(result.method).toBe('fallback')
    // The stale entry is evicted, and the fallback is not persisted.
    expect(localStorage.getItem('location_cache')).toBeNull()
  })
})

describe('UserLocationEstimator.requestPreciseLocation (browser geolocation)', () => {
  it('resolves a GPS estimate from navigator.geolocation', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 44.9, longitude: -93.1, accuracy: 12 },
        timestamp: Date.now(),
      } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    const estimator = new UserLocationEstimator()

    const result = await estimator.requestPreciseLocation()

    expect(result.coordinates).toEqual([44.9, -93.1])
    expect(result.method).toBe('gps') // accuracy < 100 → gps
    expect(result.source).toBe('browser_geolocation')
  })

  it('classifies a low-accuracy fix as network rather than gps', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 44.9, longitude: -93.1, accuracy: 500 },
        timestamp: Date.now(),
      } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    const estimator = new UserLocationEstimator()

    const result = await estimator.requestPreciseLocation()

    expect(result.method).toBe('network') // accuracy >= 100 → network
  })

  it('rejects when geolocation is not supported by the browser', async () => {
    vi.stubGlobal('navigator', {})
    const estimator = new UserLocationEstimator()

    await expect(estimator.requestPreciseLocation()).rejects.toThrow(/not supported/i)
  })

  it('rejects with the underlying message when geolocation errors', async () => {
    const getCurrentPosition = vi.fn((_s: PositionCallback, error: PositionErrorCallback) => {
      error({ message: 'User denied geolocation', code: 1 } as GeolocationPositionError)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    const estimator = new UserLocationEstimator()

    await expect(estimator.requestPreciseLocation()).rejects.toThrow(/User denied geolocation/)
  })
})

describe('UserLocationEstimator privacy + utility helpers', () => {
  it('summarizes accuracy in meters and km and reports freshness', () => {
    const estimator = new UserLocationEstimator()

    const meters = estimator.getLocationSummary({
      coordinates: MINNEAPOLIS, accuracy: 40, method: 'gps', timestamp: Date.now(), confidence: 'high',
    })
    expect(meters).toMatch(/GPS:/)
    expect(meters).toMatch(/±40m/)
    expect(meters).toMatch(/just now/)

    const km = estimator.getLocationSummary({
      coordinates: MINNEAPOLIS, accuracy: 50000, method: 'fallback', timestamp: Date.now() - 2 * 60 * 1000, confidence: 'unknown',
    })
    expect(km).toMatch(/±50km/)
    expect(km).toMatch(/2min ago/)
  })

  it('reports no stored data before any location is cached', () => {
    const estimator = new UserLocationEstimator()

    expect(estimator.getPrivacySummary()).toEqual({
      hasStoredData: false,
      lastUpdate: null,
      dataAge: 'never',
    })
  })

  it('reports stored data after a location is persisted', async () => {
    mockFetchIPLocation.mockResolvedValueOnce(ipEstimate())
    const estimator = new UserLocationEstimator()
    await estimator.estimateLocation()

    const summary = estimator.getPrivacySummary()
    expect(summary.hasStoredData).toBe(true)
    expect(typeof summary.lastUpdate).toBe('number')
    expect(summary.dataAge).toBe('just now')
  })

  it('clears both the in-memory and localStorage caches', async () => {
    mockFetchIPLocation.mockResolvedValueOnce(ipEstimate())
    const estimator = new UserLocationEstimator()
    await estimator.estimateLocation()
    expect(localStorage.getItem('location_cache')).not.toBeNull()

    estimator.clearStoredLocation()

    expect(localStorage.getItem('location_cache')).toBeNull()
    expect(estimator.getPrivacySummary().hasStoredData).toBe(false)
  })
})

describe('UserLocationEstimator.checkPermissionStatus', () => {
  it('reports not_supported when the Permissions API is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const estimator = new UserLocationEstimator()

    const status = await estimator.checkPermissionStatus()

    expect(status.hasPermissionApi).toBe(false)
    expect(status.geolocation).toBe('not_supported')
  })

  it('reflects the granted permission state from the Permissions API', async () => {
    const query = vi.fn(() => Promise.resolve({ state: 'granted' as PermissionState }))
    vi.stubGlobal('navigator', { permissions: { query } })
    const estimator = new UserLocationEstimator()

    const status = await estimator.checkPermissionStatus()

    expect(status.hasPermissionApi).toBe(true)
    expect(status.geolocation).toBe('granted')
    expect(query).toHaveBeenCalledWith({ name: 'geolocation' })
  })
})

describe('locationEstimator singleton', () => {
  it('exposes a shared instance of UserLocationEstimator', () => {
    expect(locationEstimator).toBeInstanceOf(UserLocationEstimator)
  })
})
