import { useState, useEffect, useCallback } from 'react'

/**
 * POI LOCATION WITH WEATHER DATA INTERFACE
 * @CLAUDE_CONTEXT: Unified data structure for POI-centric architecture
 * 
 * ARCHITECTURAL SHIFT: From weather-station-centric to POI-centric display
 * - Combines POI location data with weather information
 * - Maintains compatibility with existing filtering and map display logic
 * - Adds POI-specific fields while preserving weather interface
 */
interface POILocation {
  // Core location data (compatible with existing WeatherLocation interface)
  id: string
  name: string
  lat: number
  lng: number
  
  // Weather data (maintains compatibility with existing components)
  temperature: number
  condition: string
  description: string         // Will be weather_description from API
  precipitation: number       // 0-100 scale
  windSpeed: number          // mph
  
  // POI-specific data (new fields for POI-centric architecture)
  park_type?: string         // "State Park", "National Park", etc.
  data_source?: string       // "osm", "nps", "dnr", "google"
  place_rank?: number        // Importance ranking (1-30)
  
  // Distance and weather source information
  distance_miles?: string | null              // Distance from user to POI
  weather_station_name?: string | null        // Source of weather data
  weather_distance_miles?: string | null      // Distance from POI to weather station
}

interface POILocationResponse {
  success: boolean
  data: POILocation[]
  count: number
  timestamp: string
  error?: string
  debug?: {
    query_type: string
    user_location: { lat: number; lng: number } | null
    poi_radius: string
    weather_radius: string
    limit: string
    data_source: string
    cache_strategy: string
    cache_duration: string
  }
}

interface UsePOILocationsOptions {
  userLocation?: [number, number] | null
  radius?: number                    // POI search radius in miles
  weatherRadius?: number            // Weather station search radius in miles
  limit?: number
}

/**
 * CUSTOM HOOK FOR POI LOCATIONS WITH WEATHER DATA
 * @CLAUDE_CONTEXT: Replaces useWeatherLocations for POI-centric architecture
 * 
 * BUSINESS PURPOSE: Enables POI-centric outdoor recreation platform
 * - Shows parks/recreational locations with weather conditions
 * - Supports proximity-based filtering from user location
 * - Provides weather data for each POI location
 * 
 * TECHNICAL IMPLEMENTATION: Fetches from unified API endpoint
 * - Uses /api/poi-locations-with-weather for both localhost and production
 * - Maintains interface compatibility with existing components
 * - Adds POI-specific data while preserving weather interface
 * 
 * INTEGRATION STRATEGY:
 * - Drop-in replacement for useWeatherLocations hook
 * - Compatible with existing filter logic and map components
 * - Extends functionality without breaking existing UI
 * 
 * @ARCHITECTURE_NOTE: Central data layer for POI-weather integration
 * @BUSINESS_RULE: Always return meaningful weather data for each POI
 * @PERFORMANCE_CRITICAL: Optimized for 200+ POI locations with weather
 */
export function usePOILocations(options: UsePOILocationsOptions = {}) {
  const [locations, setLocations] = useState<POILocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const { 
    userLocation, 
    radius = 50,           // Default POI search radius
    weatherRadius = 25,    // Default weather station search radius
    limit = 200 
  } = options

  const fetchPOILocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters for unified API
      const params = new URLSearchParams({
        limit: limit.toString(),
        weather_radius: weatherRadius.toString()
      })

      // Add user location and POI radius if available
      if (userLocation && userLocation[0] !== undefined && userLocation[1] !== undefined && 
          !isNaN(userLocation[0]) && !isNaN(userLocation[1])) {
        params.append('lat', userLocation[0].toString())
        params.append('lng', userLocation[1].toString())
        params.append('radius', radius.toString())
      }

      // Use unified POI-weather API endpoint
      const apiUrl = `/api/poi-locations-with-weather?${params}`
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: POILocationResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch POI locations with weather')
      }

      setLocations(result.data)
      setLastFetch(new Date())

      // DEBUG: POI-weather API data fetching for performance monitoring
      if (process.env.NODE_ENV === 'development' && result.debug) {
        console.log('POI locations with weather fetched:', {
          count: result.count,
          query_type: result.debug.query_type,
          user_location: result.debug.user_location,
          poi_radius: result.debug.poi_radius,
          weather_radius: result.debug.weather_radius,
          cache_strategy: result.debug.cache_strategy,
          timestamp: result.timestamp
        })
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // Development-friendly error messages
      if (process.env.NODE_ENV === 'development' && errorMessage.includes('fetch')) {
        setError('Local API server not running. Start with: npm start')
      } else if (errorMessage.includes('Database connection required')) {
        setError('Database connection required - configure DATABASE_URL')
      } else if (errorMessage.includes('404')) {
        setError('POI-weather API endpoint not found - check server implementation')
      } else {
        setError(errorMessage)
      }
      
      console.error('Failed to fetch POI locations with weather:', err)
      
      // Set empty array on error
      setLocations([])
    } finally {
      setLoading(false)
    }
  }, [userLocation, radius, weatherRadius, limit])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchPOILocations()
  }, [fetchPOILocations])

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    return fetchPOILocations()
  }, [fetchPOILocations])

  return {
    locations,
    loading,
    error,
    lastFetch,
    refetch,
    
    // Computed values (compatible with useWeatherLocations interface)
    hasData: locations.length > 0,
    isEmpty: !loading && locations.length === 0,
    isStale: lastFetch && Date.now() - lastFetch.getTime() > 5 * 60 * 1000, // 5 minutes
    
    // POI-specific computed values
    poisWithWeather: locations.filter(poi => poi.weather_station_name),
    poisWithoutWeather: locations.filter(poi => !poi.weather_station_name),
    uniqueParkTypes: [...new Set(locations.map(poi => poi.park_type).filter(Boolean))],
    averageWeatherDistance: locations
      .filter(poi => poi.weather_distance_miles)
      .reduce((sum, poi, arr) => sum + parseFloat(poi.weather_distance_miles!), 0) / 
      locations.filter(poi => poi.weather_distance_miles).length || 0
  }
}