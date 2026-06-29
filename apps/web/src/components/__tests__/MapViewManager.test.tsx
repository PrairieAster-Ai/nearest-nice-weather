/**
 * ========================================================================
 * useMapViewManager HOOK TESTS
 * ========================================================================
 *
 * Verifies the map view manager that frames the user + nearest POIs:
 * defaults, the three updateMapView branches (user+POIs, user without POIs,
 * no user with POIs, neither), localStorage persistence, and the imperative
 * setMapCenter / setMapZoom setters.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMapViewManager } from '../MapViewManager'

const MAP_VIEW_KEY = 'nearestNiceWeather_mapView'

interface Loc {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number
  windSpeed: string
}

const mkLoc = (over: Partial<Loc> & { id: string }): Loc => ({
  name: `POI ${over.id}`,
  lat: 45,
  lng: -93,
  temperature: 70,
  condition: 'Clear',
  description: 'nice',
  precipitation: 10,
  windSpeed: '5',
  ...over,
})

const minneapolis: [number, number] = [44.9537, -93.09]

describe('useMapViewManager', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('initialises from the persisted Minnesota default view', () => {
    const { result } = renderHook(() => useMapViewManager(null))
    expect(result.current.mapCenter).toEqual([46.7296, -94.6859])
    expect(result.current.mapZoom).toBe(7)
  })

  it('centres on the user with a medium zoom when there are no POIs', () => {
    const userLocation: [number, number] = [44.97, -93.26]
    const { result } = renderHook(() => useMapViewManager(userLocation))

    act(() => {
      result.current.updateMapView([])
    })

    expect(result.current.mapCenter).toEqual(userLocation)
    expect(result.current.mapZoom).toBe(11)
  })

  it('computes a dynamic view around the user and nearest POIs', () => {
    const userLocation: [number, number] = [44.97, -93.26]
    const { result } = renderHook(() => useMapViewManager(userLocation))

    act(() => {
      result.current.updateMapView([
        mkLoc({ id: '1', lat: 44.98, lng: -93.27 }),
        mkLoc({ id: '2', lat: 45.05, lng: -93.3 }),
      ])
    })

    // Center is recomputed (no longer the persisted default) and zoom is within
    // the configured 8..18 dynamic range.
    expect(result.current.mapCenter).not.toEqual([46.7296, -94.6859])
    expect(result.current.mapZoom).toBeGreaterThanOrEqual(8)
    expect(result.current.mapZoom).toBeLessThanOrEqual(18)
  })

  it('fits all markers when there is no user location but POIs exist', () => {
    const { result } = renderHook(() => useMapViewManager(null))

    act(() => {
      result.current.updateMapView([
        mkLoc({ id: '1', lat: 44.9, lng: -93.2 }),
        mkLoc({ id: '2', lat: 46.8, lng: -95.0 }),
      ])
    })

    // A valid center/zoom is produced from the markers' bounds.
    expect(result.current.mapCenter[0]).toBeGreaterThan(44)
    expect(result.current.mapCenter[0]).toBeLessThan(47)
    expect(typeof result.current.mapZoom).toBe('number')
  })

  it('falls back to the Minneapolis default when there is no user location and no POIs', () => {
    const { result } = renderHook(() => useMapViewManager(null, minneapolis, 8))

    act(() => {
      result.current.updateMapView([])
    })

    expect(result.current.mapCenter).toEqual(minneapolis)
    expect(result.current.mapZoom).toBe(8)
  })

  it('persists center and zoom changes to localStorage', () => {
    const { result } = renderHook(() => useMapViewManager(null))

    act(() => {
      result.current.setMapCenter([45.5, -92.5])
      result.current.setMapZoom(12)
    })

    const stored = JSON.parse(localStorage.getItem(MAP_VIEW_KEY) || '{}')
    expect(stored.center).toEqual([45.5, -92.5])
    expect(stored.zoom).toBe(12)
  })

  it('exposes imperative setters for center and zoom', () => {
    const { result } = renderHook(() => useMapViewManager(null))

    act(() => {
      result.current.setMapCenter([43.0, -91.0])
    })
    expect(result.current.mapCenter).toEqual([43.0, -91.0])

    act(() => {
      result.current.setMapZoom(15)
    })
    expect(result.current.mapZoom).toBe(15)
  })
})
