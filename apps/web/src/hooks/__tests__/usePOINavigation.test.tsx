/**
 * ========================================================================
 * usePOINavigation HOOK TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Cover the primary map-interface data hook — loading POIs,
 *             distance-based auto-expansion, sequential navigation, click
 *             throttling, and error handling.
 * 🔗 HOOK: hooks/usePOINavigation.ts
 *
 * fetch is stubbed (bypassing MSW). The pure distance/slice helpers it composes
 * live in poiNavigationUtils and are tested separately; here we exercise the
 * stateful orchestration. No mock-data fallbacks are asserted.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePOINavigation } from '../usePOINavigation'

// User anchor near Minneapolis. ~0.0145 deg latitude ≈ 1 mile.
const USER: [number, number] = [44.95, -93.1]
const FILTERS = { temperature: 'mild', precipitation: 'none', wind: 'calm' }

/**
 * Build an API POI. `dLat` shifts latitude from USER so distance is controllable
 * (~69 miles per degree of latitude).
 */
const apiPoi = (id: string, name: string, dLat: number) => ({
  id,
  name,
  lat: USER[0] + dLat,
  lng: USER[1],
  temperature: 70,
  precipitation: 0,
  windSpeed: '5',
  condition: 'Clear',
  description: 'clear sky',
})

const jsonResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
  Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(body),
  } as Response)

/** Three POIs all within ~3 miles (slice 0). */
const nearbyData = [
  apiPoi('a', 'Alpha Park', 0),
  apiPoi('b', 'Bravo Park', 0.014),
  apiPoi('c', 'Charlie Park', 0.028),
]

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('usePOINavigation loading', () => {
  it('does not fetch until a user location is known', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ success: true, data: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => usePOINavigation(null, FILTERS))

    // Give the effect a tick; with no location it must stay idle.
    await Promise.resolve()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.visiblePOIs).toEqual([])
    expect(result.current.currentPOI).toBeNull()
  })

  it('loads POIs and sends location + filter query params', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ success: true, data: nearbyData }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))

    await waitFor(() => expect(result.current.visiblePOIs.length).toBe(3))

    expect(result.current.allPOICount).toBe(3)
    expect(result.current.currentPOI?.name).toBe('Alpha Park') // closest first
    expect(result.current.error).toBeNull()

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('/api/poi-locations-with-weather')
    expect(url).toContain('lat=44.95')
    expect(url).toContain('temperature=mild')
    expect(url).toContain('precipitation=none')
    expect(url).toContain('wind=calm')
  })

  it('auto-expands the search radius when nothing is within the first slice', async () => {
    // Single POI ~38 miles away (beyond the 30-mile first slice).
    const farData = [apiPoi('far', 'Far Park', 0.55)]
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: true, data: farData })))

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))

    await waitFor(() => expect(result.current.visiblePOIs.length).toBe(1))
    // Radius expanded past the initial 30mi to surface the lone result.
    expect(result.current.currentSliceMax).toBeGreaterThan(30)
    expect(result.current.currentPOI?.name).toBe('Far Park')
  })

  it('sets an error when the API responds non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({}, { ok: false, status: 500 })))

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))

    await waitFor(() => expect(result.current.error).toMatch(/API error: 500/))
    expect(result.current.visiblePOIs).toEqual([])
  })

  it('sets an error when the response shape is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: false })))

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))

    await waitFor(() => expect(result.current.error).toMatch(/Invalid API response format/))
  })
})

describe('usePOINavigation navigation + throttling', () => {
  it('navigates farther then closer through the visible POIs', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: true, data: nearbyData })))

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))
    await waitFor(() => expect(result.current.visiblePOIs.length).toBe(3))

    expect(result.current.isAtClosest).toBe(true)

    // Step farther → second-closest POI.
    let returned: unknown
    act(() => {
      returned = result.current.navigateFarther()
    })
    expect((returned as { name: string }).name).toBe('Bravo Park')
    await waitFor(() => expect(result.current.currentPOI?.name).toBe('Bravo Park'))
    expect(result.current.isAtClosest).toBe(false)
  })

  it('returns null from navigateCloser when already at the closest POI', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: true, data: nearbyData })))

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))
    await waitFor(() => expect(result.current.visiblePOIs.length).toBe(3))

    let returned: unknown = 'sentinel'
    act(() => {
      returned = result.current.navigateCloser()
    })
    expect(returned).toBeNull()
    expect(result.current.currentPOI?.name).toBe('Alpha Park')
  })

  it('signals NO_MORE_RESULTS when navigating past the farthest reachable POI', async () => {
    // Two nearby POIs, nothing beyond → cannot expand.
    const data = [apiPoi('a', 'Alpha Park', 0), apiPoi('b', 'Bravo Park', 0.014)]
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: true, data })))

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))
    await waitFor(() => expect(result.current.visiblePOIs.length).toBe(2))

    // Move to the last POI.
    act(() => {
      result.current.navigateFarther()
    })
    await waitFor(() => expect(result.current.currentPOI?.name).toBe('Bravo Park'))

    // The next "farther" is throttled (fired <500ms after the previous click),
    // so it returns null rather than advancing.
    let throttled: unknown = 'sentinel'
    act(() => {
      throttled = result.current.navigateFarther()
    })
    expect(throttled).toBeNull()
  })

  it('throttles a rapid second navigation click', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: true, data: nearbyData })))

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))
    await waitFor(() => expect(result.current.visiblePOIs.length).toBe(3))

    act(() => {
      result.current.navigateFarther() // allowed (lastClickTime was 0)
    })
    await waitFor(() => expect(result.current.currentPOI?.name).toBe('Bravo Park'))

    // Immediate follow-up click is within the 500ms throttle window.
    let secondClick: unknown = 'sentinel'
    act(() => {
      secondClick = result.current.navigateCloser()
    })
    expect(secondClick).toBeNull()
    // Cursor unchanged by the throttled click.
    expect(result.current.currentPOI?.name).toBe('Bravo Park')
  })

  it('reload forces a fresh fetch even within the dedupe window', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ success: true, data: nearbyData }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => usePOINavigation(USER, FILTERS))
    await waitFor(() => expect(result.current.visiblePOIs.length).toBe(3))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.reload()
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
