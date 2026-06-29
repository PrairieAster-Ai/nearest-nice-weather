/**
 * Tests for the extracted IP geolocation service (from UserLocationEstimator).
 * A single provider (ipapi.co) is configured; fetch is mocked per endpoint.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchIPLocation } from '../ipGeolocation'

const IPAPI = 'https://ipapi.co/json/'

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response)
const fail = (status = 500) =>
  Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) } as Response)

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

/** Route a mocked fetch to a per-endpoint response map. */
function mockFetchByUrl(map: Record<string, () => Promise<Response>>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const handler = map[url]
      return handler ? handler() : Promise.reject(new Error('unexpected url ' + url))
    })
  )
}

describe('fetchIPLocation', () => {
  it('returns an estimate from the ipapi provider', async () => {
    mockFetchByUrl({
      [IPAPI]: () => ok({ latitude: 44.98, longitude: -93.27, city: 'Minneapolis', region: 'Minnesota', country_code: 'US' }),
    })
    const est = await fetchIPLocation()
    expect(est.method).toBe('ip')
    expect(est.coordinates).toEqual([44.98, -93.27])
    expect(est.source).toContain('ipapi_Minneapolis')
    // Minnesota urban → high IP accuracy (~3km) → medium confidence
    expect(est.confidence).toBe('medium')
  })

  it('throws when the provider returns unusable data (lat/lng 0)', async () => {
    mockFetchByUrl({
      [IPAPI]: () => ok({ latitude: 0, longitude: 0 }), // invalid → null → no estimates
    })
    await expect(fetchIPLocation()).rejects.toThrow(/IP geolocation unavailable/)
  })

  it('throws when the provider fails', async () => {
    mockFetchByUrl({
      [IPAPI]: () => fail(503),
    })
    await expect(fetchIPLocation()).rejects.toThrow(/IP geolocation unavailable/)
  })

  it('throws when the network request rejects', async () => {
    mockFetchByUrl({
      [IPAPI]: () => Promise.reject(new Error('network down')),
    })
    await expect(fetchIPLocation()).rejects.toThrow(/IP geolocation unavailable/)
  })
})
