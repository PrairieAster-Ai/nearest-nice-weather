/**
 * ========================================================================
 * useFilterManager HOOK TESTS
 * ========================================================================
 *
 * Verifies the triple-state filter manager (instant → debounced → persisted):
 * defaults from localStorage, instant UI updates with isFiltering feedback,
 * debounced commit to persistent storage, and persistence across remounts.
 * Uses fake timers to drive the 100ms debounce deterministically.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilterManager } from '../FilterManager'

const STORAGE_KEY = 'nearestNiceWeather_filters'

describe('useFilterManager', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('initialises with the persisted defaults (mild / none / calm)', () => {
    const { result } = renderHook(() => useFilterManager())
    expect(result.current.filters).toEqual({
      temperature: 'mild',
      precipitation: 'none',
      wind: 'calm',
    })
    expect(result.current.isFiltering).toBe(false)
  })

  it('updates the instant filters and flags filtering immediately on change', () => {
    const { result } = renderHook(() => useFilterManager())

    act(() => {
      result.current.handleFilterChange('temperature', 'hot')
    })

    // Instant mirror updates synchronously for <100ms UI feedback.
    expect(result.current.instantFilters.temperature).toBe('hot')
    expect(result.current.isFiltering).toBe(true)
    // Debounced/persisted value has not caught up yet.
    expect(result.current.filters.temperature).toBe('mild')
  })

  it('commits the debounced value to persistent state after the debounce delay', () => {
    const { result } = renderHook(() => useFilterManager())

    act(() => {
      result.current.handleFilterChange('wind', 'windy')
    })

    act(() => {
      vi.advanceTimersByTime(150) // > FAST_SEARCH (100ms)
    })

    expect(result.current.debouncedFilters.wind).toBe('windy')
    expect(result.current.filters.wind).toBe('windy')
    expect(result.current.isFiltering).toBe(false)
  })

  it('persists the committed filters to localStorage', () => {
    const { result } = renderHook(() => useFilterManager())

    act(() => {
      result.current.handleFilterChange('precipitation', 'heavy')
    })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    expect(stored.precipitation).toBe('heavy')
  })

  it('restores persisted filters on a fresh mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ temperature: 'cold', precipitation: 'light', wind: 'breezy' }),
    )

    const { result } = renderHook(() => useFilterManager())
    expect(result.current.filters).toEqual({
      temperature: 'cold',
      precipitation: 'light',
      wind: 'breezy',
    })
  })
})
