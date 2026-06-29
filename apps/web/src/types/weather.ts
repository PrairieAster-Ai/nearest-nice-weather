import { z } from 'zod'

/**
 * User's weather preferences used to filter outdoor recreation locations.
 * Each axis is a coarse bucket rather than a numeric range.
 */
export const WeatherFilterSchema = z.object({
  temperature: z.enum(['warm', 'mild', 'cool']),
  precipitation: z.enum(['none', 'light', 'any']),
  wind: z.enum(['calm', 'light', 'windy']),
})

/**
 * Current weather conditions attached to a location.
 * `precipitation` is a 0–100 percentage; `windSpeed` is non-negative.
 */
export const LocationWeatherSchema = z.object({
  temperature: z.number(),
  precipitation: z.number().min(0).max(100),
  windSpeed: z.number().min(0),
})

/**
 * An outdoor recreation location with optional attached weather conditions.
 */
export const LocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  weather: LocationWeatherSchema.optional(),
})

/**
 * Response shape for a weather/location search: the matched locations and an
 * optional total count.
 */
export const WeatherSearchResponseSchema = z.object({
  locations: z.array(LocationSchema),
  total: z.number().optional(),
})

/** User weather preferences (inferred from {@link WeatherFilterSchema}). */
export type WeatherFilter = z.infer<typeof WeatherFilterSchema>
/** Weather conditions for a location (inferred from {@link LocationWeatherSchema}). */
export type LocationWeather = z.infer<typeof LocationWeatherSchema>
/** A recreation location (inferred from {@link LocationSchema}). */
export type Location = z.infer<typeof LocationSchema>
/** Search response payload (inferred from {@link WeatherSearchResponseSchema}). */
export type WeatherSearchResponse = z.infer<typeof WeatherSearchResponseSchema>

/** Normalized error returned by the weather API layer. */
export interface ApiError {
  message: string
  status?: number
  code?: string
}

/**
 * React Query cache key factory for weather data. Use these helpers instead of
 * inline arrays so cache invalidation stays consistent across the app.
 */
export const queryKeys = {
  weather: {
    all: ['weather'] as const,
    search: (filters: WeatherFilter) => ['weather', 'search', filters] as const,
    locations: () => ['weather', 'locations'] as const,
  },
} as const
