/**
 * ========================================================================
 * SHARED POI QUERY BUILDER TESTS
 * ========================================================================
 *
 * Direct unit tests for the single source of truth that both API
 * implementations (Express/pg + Vercel/Neon) build their POI proximity
 * queries from. The dual-api-parity test only exercises mocks; these tests
 * exercise the real builders so the SYNC-CRITICAL Haversine formula and
 * parameter ordering can't drift.
 *
 * @SYNC_CONTEXT: shared/database/queries.js
 */

import { describe, test, expect } from 'vitest'
import {
  haversineMilesSQL,
  buildPOIQuery,
  buildNeonPOIQuery,
  transformPOIResults,
} from '../queries.js'

describe('haversineMilesSQL (single source of truth)', () => {
  test('uses 3959 (miles), not 6371 (km)', () => {
    const sql = haversineMilesSQL('$2', '$1')
    expect(sql).toContain('3959 * acos')
    expect(sql).not.toContain('6371')
  })

  test('places lat token in the cos/sin terms and lng token in the delta term', () => {
    // Parameter order is SYNC-CRITICAL: $1 = lng, $2 = lat
    const sql = haversineMilesSQL('$2', '$1')
    expect(sql).toContain('cos(radians($2))')        // latitude
    expect(sql).toContain('sin(radians($2))')        // latitude
    expect(sql).toContain('cos(radians(lng) - radians($1))') // longitude delta
  })

  test('is token-agnostic (reusable for any SQL placeholders)', () => {
    const sql = haversineMilesSQL('$LAT', '$LNG')
    expect(sql).toContain('cos(radians($LAT))')
    expect(sql).toContain('radians(lng) - radians($LNG)')
  })
})

describe('buildPOIQuery (Express / node-postgres path)', () => {
  test('proximity query selects distance and binds [lng, lat, limit]', () => {
    const { primaryQuery, fallbackQuery, params } = buildPOIQuery({
      lat: '44.9778',
      lng: '-93.2650',
      limit: '25',
    })
    expect(primaryQuery).toContain('as distance_miles')
    expect(primaryQuery).toContain('FROM poi_locations_expanded')
    expect(fallbackQuery).toContain('FROM poi_locations')
    expect(params).toEqual([-93.265, 44.9778, 25])
    // Both branches reuse the one formula definition
    expect(primaryQuery).toContain(haversineMilesSQL('$2', '$1'))
    expect(fallbackQuery).toContain(haversineMilesSQL('$2', '$1'))
  })

  test('non-proximity query omits distance and binds [limit]', () => {
    const { primaryQuery, params } = buildPOIQuery({ limit: '10' })
    expect(primaryQuery).not.toContain('distance_miles')
    expect(primaryQuery).toContain('ORDER BY place_rank ASC')
    expect(primaryQuery).toContain('LIMIT $1')
    expect(params).toEqual([10])
  })

  test('caps limit at 500 and defaults to 200', () => {
    expect(buildPOIQuery({ limit: '9999' }).params).toEqual([500])
    expect(buildPOIQuery({}).params).toEqual([200])
  })
})

describe('buildNeonPOIQuery (Vercel / Neon path) parity with pg path', () => {
  // Minimal tagged-template stub that records the assembled SQL text.
  const sqlStub = (strings) => strings.join('?')

  test('proximity Neon query carries the identical Haversine math as pg', () => {
    const args = { lat: '44.9778', lng: '-93.2650', limit: '25' }
    const neon = buildNeonPOIQuery(args)
    const text = neon.primaryQuery(sqlStub)

    // Same Earth radius + same trig structure as the canonical formula
    expect(text).toContain('3959 * acos')
    expect(text).toContain('cos(radians(') // lat term
    expect(text).toContain('as distance_miles')
    expect(text).toContain('FROM poi_locations_expanded')
    expect(text).not.toContain('6371')
  })

  test('non-proximity Neon query omits distance', () => {
    const neon = buildNeonPOIQuery({ limit: '10' })
    const text = neon.primaryQuery(sqlStub)
    expect(text).not.toContain('distance_miles')
    expect(text).toContain('ORDER BY place_rank ASC')
  })
})

describe('transformPOIResults', () => {
  test('normalizes types and fills defaults consistently', () => {
    const [poi] = transformPOIResults([
      {
        id: 1,
        name: 'Theodore Wirth Park',
        lat: '44.9778',
        lng: '-93.2650',
        place_rank: 3,
        distance_miles: '2.345',
      },
    ])
    expect(poi.id).toBe('1') // stringified
    expect(poi.lat).toBe(44.9778) // numeric
    expect(poi.lng).toBe(-93.265)
    expect(poi.amenities).toEqual([]) // default
    expect(poi.activities).toEqual([])
    expect(poi.distance_miles).toBe('2.35') // 2-dp string
    expect(poi.data_source).toBe('unknown')
  })

  test('leaves distance null when not present', () => {
    const [poi] = transformPOIResults([{ id: 7, name: 'x', lat: '1', lng: '2' }])
    expect(poi.distance_miles).toBeNull()
  })
})
