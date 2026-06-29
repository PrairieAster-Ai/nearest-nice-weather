/**
 * Thin client for the POI/weather and feedback HTTP endpoints.
 *
 * Wraps `fetch` with a per-request timeout (via `AbortController`) and normalizes
 * every failure mode — non-2xx responses, timeouts, and unexpected errors — into a
 * single {@link WeatherApiError} so callers only have to catch one error type.
 *
 * @remarks
 * Base URL and timeout come from `VITE_API_BASE_URL` / `VITE_API_TIMEOUT` and default
 * to `/api` and 10s. In development these proxy to the Express dev server; in
 * production they hit the Vercel serverless functions.
 *
 * @module services/weatherApi
 */
import { Location } from '../types/weather'
import type { FeedbackFormData, FeedbackSubmissionResponse } from '../types/feedback'

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
}


/**
 * Error thrown for any failed weather/feedback API call.
 *
 * Unifies HTTP errors, request timeouts, and unexpected failures so callers can
 * `catch (e) { if (e instanceof WeatherApiError) ... }` without inspecting `fetch`
 * internals.
 */
export class WeatherApiError extends Error {
  /**
   * @param message - Human-readable description of what failed.
   * @param status - HTTP status code when the failure originated from a response; omitted for timeouts/network errors.
   */
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'WeatherApiError'
  }
}

/**
 * Singleton API client exposing the two calls the web app makes.
 *
 * @example
 * ```ts
 * try {
 *   const locations = await weatherApi.getLocations()
 * } catch (e) {
 *   if (e instanceof WeatherApiError) showToast(e.message)
 * }
 * ```
 */
export const weatherApi = {
  /**
   * Fetch all POI locations enriched with current weather.
   *
   * @returns The list of locations, or an empty array if the response carries no `data`.
   * @throws {@link WeatherApiError} on non-2xx responses, request timeout, or unexpected failure.
   */
  async getLocations(): Promise<Location[]> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/poi-locations-with-weather`, {
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

  /**
   * Submit user feedback, translating the form shape into the API payload.
   *
   * Generates a per-submission `session_id` and attaches the current page URL and
   * user agent for diagnostics.
   *
   * @param feedback - The collected form data (comment, rating, category, optional email).
   * @returns The normalized success response with the persisted feedback id.
   * @throws {@link WeatherApiError} on non-2xx responses, a `success: false` body, timeout, or unexpected failure.
   */
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
        session_id: `session_${Date.now()}_${crypto.randomUUID()}`,
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
