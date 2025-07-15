import { useState, useEffect, useCallback } from 'react'

interface WeatherLocation {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number // 0-100 scale
  windSpeed: number // mph
}

interface WeatherLocationResponse {
  success: boolean
  data: WeatherLocation[]
  count: number
  timestamp: string
  error?: string
  debug?: any
}

interface UseWeatherLocationsOptions {
  userLocation?: [number, number] | null
  radius?: number // miles (legacy parameter, not used for distance restriction)  
  limit?: number
}


export function useWeatherLocations(options: UseWeatherLocationsOptions = {}) {
  const [locations, setLocations] = useState<WeatherLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const { userLocation, radius = 50, limit = 150 } = options

  const fetchWeatherLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString()
      })

      if (userLocation && userLocation[0] !== undefined && userLocation[1] !== undefined && 
          !isNaN(userLocation[0]) && !isNaN(userLocation[1])) {
        params.append('lat', userLocation[0].toString())
        params.append('lng', userLocation[1].toString())
        params.append('radius', radius.toString())
      }

      // Use proxy in all environments
      const apiUrl = `/api/weather-locations?${params}`
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: WeatherLocationResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch weather locations')
      }

      setLocations(result.data)
      setLastFetch(new Date())

      // Log debug info in development
      if (process.env.NODE_ENV === 'development' && result.debug) {
        console.log('Weather locations fetched:', {
          count: result.count,
          query_type: result.debug.query_type,
          user_location: result.debug.user_location,
          timestamp: result.timestamp
        })
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // In development, provide more helpful error messages
      if (process.env.NODE_ENV === 'development' && errorMessage.includes('fetch')) {
        setError('Local API server not running. Start with: node dev-api-server.js')
      } else if (errorMessage.includes('Database connection required')) {
        setError('Database connection required - configure DATABASE_URL')
      } else {
        setError(errorMessage)
      }
      
      console.error('Failed to fetch weather locations:', err)
      
      // Set empty array on error
      setLocations([])
    } finally {
      setLoading(false)
    }
  }, [userLocation, radius, limit])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchWeatherLocations()
  }, [fetchWeatherLocations])

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    return fetchWeatherLocations()
  }, [fetchWeatherLocations])

  return {
    locations,
    loading,
    error,
    lastFetch,
    refetch,
    // Computed values
    hasData: locations.length > 0,
    isEmpty: !loading && locations.length === 0,
    isStale: lastFetch && Date.now() - lastFetch.getTime() > 5 * 60 * 1000 // 5 minutes
  }
}