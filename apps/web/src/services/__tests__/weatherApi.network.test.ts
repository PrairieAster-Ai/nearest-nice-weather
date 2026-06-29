/**
 * ========================================================================
 * WEATHER API SERVICE - NETWORK BEHAVIOR TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Exercise the real fetch paths of weatherApi.getLocations and
 *             weatherApi.submitFeedback, which the existing weatherApi.test.ts
 *             intentionally left uncovered.
 * 🔗 SERVICE: services/weatherApi.ts
 * 📊 COVERAGE: success, empty-data, HTTP error, timeout (AbortError), unexpected
 *             error, and feedback payload mapping.
 *
 * Note: fetch is replaced with a stub (vi.stubGlobal) so these tests bypass MSW
 * and assert the wrapper's normalization behavior directly. No mock-data
 * fallbacks are asserted — failures surface as WeatherApiError.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { weatherApi, WeatherApiError } from '../weatherApi'
import type { FeedbackFormData } from '../../types/feedback'

/** Build a minimal fetch Response-like object. */
const jsonResponse = (body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}) =>
  Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: () => Promise.resolve(body),
  } as Response)

/** An error that mimics a fetch AbortController timeout. */
const abortError = () => {
  const e = new Error('The operation was aborted')
  e.name = 'AbortError'
  return e
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('weatherApi.getLocations', () => {
  it('returns the data array from a successful response', async () => {
    const locations = [{ id: '1', name: 'Lake Park' }, { id: '2', name: 'Trail Head' }]
    const fetchMock = vi.fn(() => jsonResponse({ data: locations }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await weatherApi.getLocations()

    expect(result).toEqual(locations)
    // Hits the POI/weather endpoint with a GET
    const [url, opts] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/poi-locations-with-weather')
    expect((opts as RequestInit).method).toBe('GET')
  })

  it('returns an empty array when the response carries no data field', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({})))

    const result = await weatherApi.getLocations()

    expect(result).toEqual([])
  })

  it('throws a WeatherApiError carrying the status on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({}, { ok: false, status: 503, statusText: 'Service Unavailable' })))

    await expect(weatherApi.getLocations()).rejects.toMatchObject({
      name: 'WeatherApiError',
      status: 503,
    })
    await expect(weatherApi.getLocations()).rejects.toThrow(/Service Unavailable/)
  })

  it('maps an AbortError (timeout) to a friendly timeout WeatherApiError without a status', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(abortError())))

    let caught: unknown
    try {
      await weatherApi.getLocations()
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(WeatherApiError)
    expect((caught as WeatherApiError).message).toMatch(/timed out/i)
    expect((caught as WeatherApiError).status).toBeUndefined()
  })

  it('wraps an unexpected network failure in a generic WeatherApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('socket hang up'))))

    await expect(weatherApi.getLocations()).rejects.toThrow(/unexpected error occurred while fetching locations/i)
  })
})

describe('weatherApi.submitFeedback', () => {
  const feedback: FeedbackFormData = {
    comment: 'Loved the trail finder',
    rating: 5,
    email: 'hiker@example.com',
    category: 'general',
  }

  it('submits feedback and returns a normalized success response', async () => {
    const fetchMock = vi.fn(() =>
      jsonResponse({ success: true, message: 'Thanks!', feedback_id: 42 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await weatherApi.submitFeedback(feedback)

    expect(result).toEqual({ success: true, message: 'Thanks!', id: 42 })

    // The form shape is translated into the API payload.
    const [url, opts] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/api/feedback')
    expect((opts as RequestInit).method).toBe('POST')
    const payload = JSON.parse((opts as RequestInit).body as string)
    expect(payload.feedback).toBe('Loved the trail finder')
    expect(payload.rating).toBe(5)
    expect(payload.category).toBe('general')
    expect(payload.email).toBe('hiker@example.com')
    // A diagnostic session id is generated per submission.
    expect(payload.session_id).toMatch(/^session_\d+_/)
    expect(typeof payload.page_url).toBe('string')
  })

  it('omits email from the payload when none is provided', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ success: true, feedback_id: 7 }))
    vi.stubGlobal('fetch', fetchMock)

    await weatherApi.submitFeedback({ comment: 'No email here', rating: 3, category: 'bug' })

    const payload = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(payload.email).toBeUndefined()
  })

  it('defaults message and id when the API omits them', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: true })))

    const result = await weatherApi.submitFeedback(feedback)

    expect(result.message).toBe('Feedback submitted successfully')
    expect(result.id).toBe(0)
  })

  it('throws a WeatherApiError with the status on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({}, { ok: false, status: 422, statusText: 'Unprocessable Entity' })))

    await expect(weatherApi.submitFeedback(feedback)).rejects.toMatchObject({
      name: 'WeatherApiError',
      status: 422,
    })
  })

  it('throws when the response body reports success: false', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ success: false, error: 'Spam detected' })))

    await expect(weatherApi.submitFeedback(feedback)).rejects.toThrow('Spam detected')
  })

  it('maps an AbortError (timeout) to a friendly timeout WeatherApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(abortError())))

    await expect(weatherApi.submitFeedback(feedback)).rejects.toThrow(/timed out/i)
  })

  it('wraps an unexpected failure in a generic WeatherApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('connection reset'))))

    await expect(weatherApi.submitFeedback(feedback)).rejects.toThrow(/unexpected error occurred while submitting feedback/i)
  })
})
