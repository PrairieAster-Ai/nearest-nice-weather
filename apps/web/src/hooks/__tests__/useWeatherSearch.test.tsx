import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWeatherSearch } from '../useWeatherSearch'
import { render } from '../../test/utils/test-utils'
import type { WeatherFilter } from '../../types/weather'

// Mock the QueryProvider wrapper for hooks
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return render(<div>{children}</div>).container.firstChild as any
}

describe('useWeatherSearch Hook', () => {
  const mockFilters: WeatherFilter = {
    temperature: 'mild',
    precipitation: 'none',
    wind: 'calm'
  }

  beforeEach(() => {
    // Reset any state between tests
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useWeatherSearch(), { wrapper })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.results).toEqual([])
  })

  it('handles successful search', async () => {
    const { result } = renderHook(() => useWeatherSearch(), { wrapper })
    
    await result.current.searchWeather(mockFilters)
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.results.length).toBeGreaterThan(0)
    })
  })

  it('handles search errors', async () => {
    const { result } = renderHook(() => useWeatherSearch(), { wrapper })
    
    // Mock a failed request by using invalid filters
    const invalidFilters = { ...mockFilters, temperature: 'invalid' as any }
    
    await result.current.searchWeather(invalidFilters)
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeTruthy()
    })
  })

  it('sets loading state during search', async () => {
    const { result } = renderHook(() => useWeatherSearch(), { wrapper })
    
    const searchPromise = result.current.searchWeather(mockFilters)
    
    // Check loading state immediately after triggering search
    expect(result.current.loading).toBe(true)
    
    await searchPromise
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})