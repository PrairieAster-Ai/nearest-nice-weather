import { useState, useCallback } from 'react'
import { WeatherFilter } from '../components/features/WeatherFilters'
import { Location } from '../components/features/WeatherMap'

interface UseWeatherSearchReturn {
  loading: boolean
  error: string | null
  results: Location[]
  searchWeather: (filters: WeatherFilter) => Promise<void>
  clearResults: () => void
}

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

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/weather-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to search for weather locations: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.locations || [])
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