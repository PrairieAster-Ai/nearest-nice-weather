import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { weatherApi, WeatherApiError } from '../services/weatherApi'
import { WeatherFilter, Location, queryKeys } from '../types/weather'
import { monitoring } from '../services/monitoring'

export const useLocations = () => {
  return useQuery({
    queryKey: queryKeys.weather.locations(),
    queryFn: weatherApi.getLocations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof WeatherApiError && error.status && error.status >= 400 && error.status < 500) {
        return false
      }
      return failureCount < 3
    },
    throwOnError: (error) => {
      monitoring.captureError(error instanceof Error ? error : new Error(String(error)), {
        additionalContext: { queryKey: 'locations' }
      })
      return false // Don't throw, handle gracefully
    }
  })
}

export const useWeatherSearch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (filters: WeatherFilter) => {
      // Track user action
      monitoring.captureUserAction('weather_search', { filters })
      
      const startTime = performance.now()
      const result = await weatherApi.searchLocations(filters)
      const endTime = performance.now()

      // Track performance
      monitoring.capturePerformance({
        name: 'weather_search_duration',
        value: endTime - startTime,
        unit: 'ms',
        timestamp: new Date(),
        context: { resultCount: result.locations.length }
      })

      return result
    },
    onSuccess: (data, variables) => {
      // Cache the search results
      queryClient.setQueryData(
        queryKeys.weather.search(variables),
        data,
        {
          updatedAt: Date.now(),
        }
      )

      // Also update individual location data if we have weather info
      data.locations.forEach((location) => {
        if (location.weather) {
          queryClient.setQueryData(
            ['weather', 'location', location.id],
            location,
            {
              updatedAt: Date.now(),
            }
          )
        }
      })
    },
    onError: (error) => {
      monitoring.captureError(
        error instanceof Error ? error : new Error(String(error)),
        {
          additionalContext: { 
            action: 'weather_search',
            errorType: error instanceof WeatherApiError ? 'api_error' : 'unknown_error'
          }
        }
      )
    }
  })
}

export const useWeatherSearchResults = (filters: WeatherFilter | null) => {
  return useQuery({
    queryKey: filters ? queryKeys.weather.search(filters) : ['weather', 'search', 'disabled'],
    queryFn: () => weatherApi.searchLocations(filters!),
    enabled: !!filters && Object.values(filters).every(value => value && value.length > 0),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof WeatherApiError && error.status && error.status >= 400 && error.status < 500) {
        return false
      }
      return failureCount < 2
    }
  })
}

// Custom hook for managing cached weather searches
export const useWeatherSearchHistory = () => {
  const queryClient = useQueryClient()

  const getSearchHistory = () => {
    const queryCache = queryClient.getQueryCache()
    return queryCache
      .findAll({ queryKey: ['weather', 'search'] })
      .map(query => ({
        filters: query.queryKey[2] as WeatherFilter,
        data: query.state.data as Location[] | undefined,
        timestamp: query.state.dataUpdatedAt,
      }))
      .filter(item => item.data && item.data.length > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5) // Keep last 5 searches
  }

  const clearSearchHistory = () => {
    queryClient.removeQueries({ queryKey: ['weather', 'search'] })
  }

  return {
    getSearchHistory,
    clearSearchHistory,
  }
}