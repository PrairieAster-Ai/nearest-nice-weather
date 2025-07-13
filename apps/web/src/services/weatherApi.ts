import { WeatherFilter } from '../components/features/WeatherFilters'
import { Location } from '../components/features/WeatherMap'
import type { FeedbackFormData, FeedbackSubmissionResponse } from '../types/feedback'

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
}


export class WeatherApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'WeatherApiError'
  }
}

export interface WeatherSearchResponse {
  locations: Location[]
  total: number
}

export const weatherApi = {
  // DEPRECATED: This endpoint doesn't exist in current API
  // The main app uses useWeatherLocations -> /api/weather-locations
  // This can be removed after confirming no components use it
  async searchLocations(_filters: WeatherFilter): Promise<WeatherSearchResponse> {
    console.warn('DEPRECATED: searchLocations endpoint does not exist. Use useWeatherLocations instead.')
    throw new WeatherApiError('Search endpoint not implemented. Use weather-locations endpoint.')
  },

  async getLocations(): Promise<Location[]> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/weather-locations`, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new WeatherApiError(
          `Failed to fetch locations: ${response.statusText}`,
          response.status
        )
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof WeatherApiError) {
        throw error
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WeatherApiError('Request timed out. Please try again.')
      }
      
      throw new WeatherApiError('An unexpected error occurred while fetching locations')
    }
  },

  async submitFeedback(feedback: FeedbackFormData): Promise<FeedbackSubmissionResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    try {
      // Convert frontend feedback format to API format
      const apiPayload = {
        email: feedback.email || undefined,
        feedback: feedback.comment,
        rating: feedback.rating,
        category: feedback.category,
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        page_url: window.location.href,
      }

      const response = await fetch(`/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(apiPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new WeatherApiError(
          `Failed to submit feedback: ${response.statusText}`,
          response.status
        )
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new WeatherApiError(data.error || 'Failed to submit feedback')
      }

      return {
        success: data.success,
        message: data.message || 'Feedback submitted successfully',
        id: data.feedback_id || 0,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof WeatherApiError) {
        throw error
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WeatherApiError('Request timed out. Please try again.')
      }
      
      throw new WeatherApiError('An unexpected error occurred while submitting feedback')
    }
  }
}

export default weatherApi