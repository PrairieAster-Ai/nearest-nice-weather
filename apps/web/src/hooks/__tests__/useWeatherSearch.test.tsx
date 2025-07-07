import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useWeatherSearch } from '../useWeatherSearch'
import type { WeatherFilter } from '../../types/weather'

const theme = createTheme({
  palette: {
    primary: {
      main: '#7563A8',
    },
  },
})

// Create test wrapper with proper providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

describe.skip('useWeatherSearch Hook', () => {
  const mockFilters: WeatherFilter = {
    temperature: 'mild',
    precipitation: 'none',
    wind: 'calm'
  }

  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
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