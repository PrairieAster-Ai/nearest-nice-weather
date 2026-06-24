/**
 * Tests for the extracted multi-provider IP geolocation (from
 * UserLocationEstimator). fetch is mocked per provider endpoint.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchIPLocation } from '../ipGeolocation'

const IPAPI = 'https://ipapi.co/json/'
const IP_API = 'http://ip-api.com/json/?fields=status,lat,lon,city,region,country'
const IPGEO = 'https://api.ipgeolocation.io/ipgeo'

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
      [IP_API]: () => fail(),
      [IPGEO]: () => fail(),
    })
    const est = await fetchIPLocation()
    expect(est.method).toBe('ip')
    expect(est.coordinates).toEqual([44.98, -93.27])
    expect(est.source).toContain('ipapi_Minneapolis')
    // Minnesota urban → high IP accuracy (~3km) → medium confidence
    expect(est.confidence).toBe('medium')
  })

  it('parses the ip-api provider response shape', async () => {
    mockFetchByUrl({
      [IPAPI]: () => fail(),
      [IP_API]: () => ok({ status: 'success', lat: 46.8, lon: -92.1, city: 'Duluth', region: 'Minnesota', country: 'US' }),
      [IPGEO]: () => fail(),
    })
    const est = await fetchIPLocation()
    expect(est.coordinates).toEqual([46.8, -92.1])
    expect(est.source).toContain('ip-api_Duluth')
  })

  it('parses the ipgeolocation provider (string coords)', async () => {
    mockFetchByUrl({
      [IPAPI]: () => fail(),
      [IP_API]: () => fail(),
      [IPGEO]: () => ok({ latitude: '44.94', longitude: '-93.09', city: 'Saint Paul', state_prov: 'Minnesota', country_code2: 'US' }),
    })
    const est = await fetchIPLocation()
    expect(est.coordinates).toEqual([44.94, -93.09])
    expect(est.source).toContain('ipgeolocation_Saint Paul')
  })

  it('ignores providers that return unusable data (lat/lng 0)', async () => {
    mockFetchByUrl({
      [IPAPI]: () => ok({ latitude: 0, longitude: 0 }), // invalid → null
      [IP_API]: () => ok({ status: 'success', lat: 45.0, lon: -93.0, city: 'Bloomington', region: 'Minnesota', country: 'US' }),
      [IPGEO]: () => fail(),
    })
    const est = await fetchIPLocation()
    expect(est.coordinates).toEqual([45.0, -93.0])
  })

  it('returns the best-scored estimate when several providers succeed', async () => {
    // ipapi: rural MN (low accuracy ~15km); ip-api: urban MN (better ~3km).
    mockFetchByUrl({
      [IPAPI]: () => ok({ latitude: 47.5, longitude: -94.9, city: 'Bemidji', region: 'Minnesota', country_code: 'US' }),
      [IP_API]: () => ok({ status: 'success', lat: 44.98, lon: -93.27, city: 'Minneapolis', region: 'Minnesota', country: 'US' }),
      [IPGEO]: () => fail(),
    })
    const est = await fetchIPLocation()
    // Minneapolis (urban, finer accuracy, medium confidence) should win.
    expect(est.source).toContain('Minneapolis')
  })

  it('throws when every provider fails', async () => {
    mockFetchByUrl({
      [IPAPI]: () => fail(503),
      [IP_API]: () => Promise.reject(new Error('network down')),
      [IPGEO]: () => fail(500),
    })
    await expect(fetchIPLocation()).rejects.toThrow(/IP geolocation unavailable/)
  })
})
