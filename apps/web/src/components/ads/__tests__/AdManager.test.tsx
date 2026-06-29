/**
 * ========================================================================
 * AD MANAGER + useAdManager HOOK TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Cover the centralized ad-management context — guard rails of the
 *             useAdManager hook, A/B test group assignment, impression/click
 *             tracking + CTR math, placement resolution, and ad-block detection.
 * 🔗 SOURCE: components/ads/AdManager.tsx, hooks/useAdManager.ts
 *
 * fetch is stubbed (bypassing MSW) to drive ad-block detection, and the AdSense
 * <script> injection is neutralized by stubbing head.appendChild so no real
 * network/script load happens during tests.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AdManagerProvider } from '../AdManager'
import { useAdManager } from '../../../hooks/useAdManager'

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  // Prevent the AdSense <script> from actually being injected/loaded.
  vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => node)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const wrapperWith = (props: { enableAds?: boolean } = {}) =>
  ({ children }: { children: React.ReactNode }) => (
    <AdManagerProvider enableAds={props.enableAds}>{children}</AdManagerProvider>
  )

describe('useAdManager guard', () => {
  it('throws when used outside an AdManagerProvider', () => {
    // Suppress the React error boundary console noise for the expected throw.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAdManager())).toThrow(/must be used within AdManagerProvider/)
    spy.mockRestore()
  })
})

describe('AdManagerProvider default state', () => {
  it('exposes the context with an A or B test group and clean initial metrics', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response)))
    const { result } = renderHook(() => useAdManager(), { wrapper: wrapperWith({ enableAds: false }) })

    expect(['A', 'B']).toContain(result.current.testGroup)
    expect(result.current.performanceMetrics).toEqual({})
    expect(result.current.adsLoaded).toBe(false)
    expect(typeof result.current.trackAdImpression).toBe('function')
    expect(typeof result.current.isAdEnabled).toBe('function')
  })
})

describe('getOptimalAdPlacement', () => {
  it('returns the configured placements for a known context and [] for an unknown one', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response)))
    const { result } = renderHook(() => useAdManager(), { wrapper: wrapperWith({ enableAds: false }) })

    expect(result.current.getOptimalAdPlacement('poi_detail')).toEqual(['poi-detail', 'sidebar'])
    expect(result.current.getOptimalAdPlacement('homepage')).toEqual(['homepage-banner'])
    expect(result.current.getOptimalAdPlacement('does-not-exist')).toEqual([])
  })
})

describe('isAdEnabled', () => {
  it('returns false for every placement when ads are disabled', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response)))
    const { result } = renderHook(() => useAdManager(), { wrapper: wrapperWith({ enableAds: false }) })

    expect(result.current.isAdEnabled('homepage-banner')).toBe(false)
    expect(result.current.isAdEnabled('poi-detail')).toBe(false)
  })

  it('enables always-on placements when ads are enabled and no ad-block is detected', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response))) // detection succeeds → not blocked
    const { result } = renderHook(() => useAdManager(), { wrapper: wrapperWith({ enableAds: true }) })

    await waitFor(() => expect(result.current.isAdBlockDetected).toBe(false))
    // These two are unconditionally enabled (independent of time-of-day).
    expect(result.current.isAdEnabled('homepage-banner')).toBe(true)
    expect(result.current.isAdEnabled('poi-detail')).toBe(true)
  })

  it('disables all placements once ad-block is detected', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('blocked')))) // detection fails → blocked
    const { result } = renderHook(() => useAdManager(), { wrapper: wrapperWith({ enableAds: true }) })

    await waitFor(() => expect(result.current.isAdBlockDetected).toBe(true))
    expect(result.current.isAdEnabled('homepage-banner')).toBe(false)
  })
})

describe('impression + click tracking', () => {
  it('accumulates impressions for a placement', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response)))
    const { result } = renderHook(() => useAdManager(), { wrapper: wrapperWith({ enableAds: true }) })

    act(() => {
      result.current.trackAdImpression('homepage-banner')
      result.current.trackAdImpression('homepage-banner')
    })

    await waitFor(() =>
      expect(result.current.performanceMetrics['homepage-banner']?.impressions).toBe(2)
    )
    expect(result.current.performanceMetrics['homepage-banner'].clicks).toBe(0)
  })

  it('records clicks and computes click-through rate against impressions', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response)))
    const { result } = renderHook(() => useAdManager(), { wrapper: wrapperWith({ enableAds: true }) })

    act(() => {
      result.current.trackAdImpression('sidebar')
      result.current.trackAdImpression('sidebar')
      result.current.trackAdImpression('sidebar')
      result.current.trackAdImpression('sidebar')
    })
    await waitFor(() => expect(result.current.performanceMetrics['sidebar']?.impressions).toBe(4))

    act(() => {
      result.current.trackAdClick('sidebar')
    })

    await waitFor(() => expect(result.current.performanceMetrics['sidebar']?.clicks).toBe(1))
    // 1 click / 4 impressions = 25% CTR
    expect(result.current.performanceMetrics['sidebar'].ctr).toBe(25)
  })

  it('does not record metrics while ads are disabled', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response)))
    const { result } = renderHook(() => useAdManager(), { wrapper: wrapperWith({ enableAds: false }) })

    act(() => {
      result.current.trackAdImpression('homepage-banner')
      result.current.trackAdClick('homepage-banner')
    })

    expect(result.current.performanceMetrics).toEqual({})
  })
})
