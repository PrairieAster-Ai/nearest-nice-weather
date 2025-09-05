import { z } from 'zod'

// Zod schemas for runtime validation
export const WeatherFilterSchema = z.object({
  temperature: z.enum(['warm', 'mild', 'cool']),
  precipitation: z.enum(['none', 'light', 'any']),
  wind: z.enum(['calm', 'light', 'windy']),
})

export const LocationWeatherSchema = z.object({
  temperature: z.number(),
  precipitation: z.number().min(0).max(100),
  windSpeed: z.number().min(0),
})

export const LocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  weather: LocationWeatherSchema.optional(),
})

export const WeatherSearchResponseSchema = z.object({
  locations: z.array(LocationSchema),
  total: z.number().optional(),
})

// TypeScript types derived from Zod schemas
export type WeatherFilter = z.infer<typeof WeatherFilterSchema>
export type LocationWeather = z.infer<typeof LocationWeatherSchema>
export type Location = z.infer<typeof LocationSchema>
export type WeatherSearchResponse = z.infer<typeof WeatherSearchResponseSchema>

// API Error types
export interface ApiError {
  message: string
  status?: number
  code?: string
}

// Query keys for React Query
export const queryKeys = {
  weather: {
    all: ['weather'] as const,
    search: (filters: WeatherFilter) => ['weather', 'search', filters] as const,
    locations: () => ['weather', 'locations'] as const,
  },
} as const
