import { useState, useCallback } from 'react'
import { WeatherFilter } from '../types/weather'
import { Location } from '../types/weather'

/** State and actions returned by {@link useWeatherSearch}. */
interface UseWeatherSearchReturn {
  loading: boolean
  error: string | null
  results: Location[]
  searchWeather: (filters: WeatherFilter) => Promise<void>
  clearResults: () => void
}

/**
 * Local-state weather search hook backed by a direct `fetch` to the
 * POI-with-weather endpoint. Requires all three filter axes to be set, applies
 * a `VITE_API_TIMEOUT` abort, and surfaces timeout/error messages to the caller.
 *
 * @returns Search state plus `searchWeather` and `clearResults` actions.
 * @example
 * ```tsx
 * const { results, loading, error, searchWeather } = useWeatherSearch();
 * searchWeather({ temperature: 'mild', precipitation: 'none', wind: 'calm' });
 * ```
 */
export const useWeatherSearch = (): UseWeatherSearchReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Location[]>([])

  const searchWeather = useCallback(async (filters: WeatherFilter) => {
    if (!filters.temperature || !filters.precipitation || !filters.wind) {
      setError('Please select all weather preferences')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(),
        parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'))

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/poi-locations-with-weather`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to search for weather locations: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.data || [])
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred')
      }
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    loading,
    error,
    results,
    searchWeather,
    clearResults
  }
}

export default useWeatherSearch
