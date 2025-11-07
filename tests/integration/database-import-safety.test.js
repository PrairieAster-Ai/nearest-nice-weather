/**
 * ========================================================================
 * DATABASE IMPORT SAFETY TESTS - Transaction & Validation Testing
 * ========================================================================
 *
 * @PURPOSE: Validate database import safety with transaction rollback
 * @PRD_REF: PRD-OVERPASS-TEST-INFRASTRUCTURE.md - Success Criteria SC-2
 * @BUSINESS_IMPACT: Prevent corrupted POI data in production database
 *
 * TEST COVERAGE:
 * 1. Transaction safety with automatic rollback on error
 * 2. Duplicate detection using coordinate proximity (10 meters)
 * 3. Minnesota geographic bounds validation
 * 4. Required field validation (name, lat, lng)
 * 5. Batch import statistics tracking
 */

const { Pool } = require('pg')
const DatabaseImporter = require('../../scripts/database-importer.cjs')
const { createMockPOI } = require('../helpers/poi-assertions.js')

/**
 * Mock database client for testing
 */
function createMockDatabaseClient() {
  const rows = []
  const queryLog = []
  let transactionActive = false
  let shouldRollback = false

  const mockClient = {
    query: jest.fn(async (sql, params) => {
      queryLog.push({ sql, params })

      // Handle transaction commands
      if (sql === 'BEGIN') {
        transactionActive = true
        // Don't reset shouldRollback here - it needs to persist for the test
        return { rows: [] }
      }

      if (sql === 'COMMIT') {
        if (!shouldRollback) {
          transactionActive = false
        }
        return { rows: [] }
      }

      if (sql === 'ROLLBACK') {
        transactionActive = false
        rows.length = 0 // Clear all inserted data
        return { rows: [] }
      }

      // Handle INSERT queries
      if (typeof sql === 'string' && sql.includes('INSERT INTO poi_locations')) {
        if (shouldRollback) {
          throw new Error('Simulated database error')
        }
        rows.push({ id: rows.length + 1, ...params })
        return { rows: [] }
      }

      // Handle duplicate check queries (Haversine distance)
      if (typeof sql === 'string' && sql.includes('distance_miles')) {
        const [lat, lng, thresholdMiles] = params || []
        const duplicates = rows.filter(row => {
          if (!row[1] || !row[2]) return false
          const rowLat = row[1]
          const rowLng = row[2]

          // Haversine formula for distance in miles
          const R = 3959 // Earth's radius in miles
          const dLat = (lat - rowLat) * (Math.PI / 180)
          const dLng = (lng - rowLng) * (Math.PI / 180)
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(rowLat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distance = R * c

          return distance < thresholdMiles
        })
        return { rows: duplicates }
      }

      // Handle stats queries
      if (typeof sql === 'string' && sql.includes('GROUP BY data_source')) {
        const stats = rows.reduce((acc, row) => {
          const source = row[7] || 'unknown'
          acc[source] = (acc[source] || 0) + 1
          return acc
        }, {})

        return {
          rows: Object.entries(stats).map(([data_source, count]) => ({
            data_source,
            count
          }))
        }
      }

      return { rows: [] }
    }),

    release: jest.fn(),

    // Test helpers
    _getRows: () => rows,
    _getQueryLog: () => queryLog,
    _setRollback: (value) => { shouldRollback = value },
    _clearData: () => { rows.length = 0 }
  }

  return mockClient
}

/**
 * Mock database pool
 */
function createMockPool() {
  const mockClient = createMockDatabaseClient()

  return {
    connect: jest.fn(async () => mockClient),
    end: jest.fn(),
    _getClient: () => mockClient
  }
}

describe('Database Import Safety - Transaction Management', () => {
  let importer, mockPool, mockClient

  beforeEach(() => {
    mockPool = createMockPool()
    mockClient = mockPool._getClient()
    importer = new DatabaseImporter(mockPool, { silent: true })
  })

  it('should commit transaction on successful import', async () => {
    const pois = [
      createMockPOI({ name: 'Test Park 1' }),
      createMockPOI({ name: 'Test Park 2', lat: 44.9879, lng: -93.2750 })
    ]

    const stats = await importer.batchImport(pois)

    expect(stats.inserted).toBe(2)
    expect(stats.errors).toBe(0)

    // Verify transaction flow
    const queryLog = mockClient._getQueryLog()
    expect(queryLog[0].sql).toBe('BEGIN')
    expect(queryLog[queryLog.length - 1].sql).toBe('COMMIT')
  })

  it('should rollback transaction on error', async () => {
    // Simulate error before any POIs are processed
    mockClient._setRollback(true)

    const pois = [
      createMockPOI({ name: 'Test Park 1' }),
      createMockPOI({ name: 'Test Park 2', lat: 44.9879, lng: -93.2750 })
    ]

    await expect(importer.batchImport(pois)).rejects.toThrow()

    // Verify rollback occurred
    const queryLog = mockClient._getQueryLog()
    const rollbackQuery = queryLog.find(q => q.sql === 'ROLLBACK')
    expect(rollbackQuery).toBeDefined()

    // Verify no data was persisted
    const rows = mockClient._getRows()
    expect(rows.length).toBe(0)
  })

  it('should release client connection after import', async () => {
    const pois = [createMockPOI({ name: 'Test Park' })]

    await importer.batchImport(pois)

    expect(mockClient.release).toHaveBeenCalled()
  })

  it('should release client connection even on error', async () => {
    mockClient._setRollback(true)
    const pois = [createMockPOI({ name: 'Test Park' })]

    await expect(importer.batchImport(pois)).rejects.toThrow()

    expect(mockClient.release).toHaveBeenCalled()
  })
})

describe('Database Import Safety - Duplicate Detection', () => {
  let importer, mockPool, mockClient

  beforeEach(() => {
    mockPool = createMockPool()
    mockClient = mockPool._getClient()
    importer = new DatabaseImporter(mockPool, { silent: true, duplicateThresholdMeters: 10 })
  })

  it('should detect duplicates within 10 meters', async () => {
    // Insert first POI
    const poi1 = createMockPOI({ name: 'Minnehaha Park' })
    await importer.batchImport([poi1])

    // Try to insert duplicate (same coordinates)
    const poi2 = createMockPOI({
      name: 'Minnehaha Regional Park',
      lat: poi1.lat,
      lng: poi1.lng
    })

    const stats = await importer.batchImport([poi2])

    expect(stats.duplicates).toBe(1)
    expect(stats.inserted).toBe(0)
    expect(stats.skipped).toBe(1)
  })

  it('should allow POIs more than 10 meters apart', async () => {
    const poi1 = createMockPOI({ name: 'North Park', lat: 44.9778, lng: -93.2650 })
    const poi2 = createMockPOI({ name: 'South Park', lat: 44.9679, lng: -93.2650 }) // ~1.1 km apart

    // Import both in the same batch
    const stats = await importer.batchImport([poi1, poi2])

    expect(stats.inserted).toBe(2)
    expect(stats.duplicates).toBe(0)
  })

  it('should configure duplicate threshold in meters', () => {
    const customImporter = new DatabaseImporter(mockPool, {
      silent: true,
      duplicateThresholdMeters: 50
    })

    expect(customImporter.duplicateThresholdMeters).toBe(50)
  })
})

describe('Database Import Safety - Field Validation', () => {
  let importer, mockPool

  beforeEach(() => {
    mockPool = createMockPool()
    importer = new DatabaseImporter(mockPool, { silent: true })
  })

  it('should reject POIs without name', async () => {
    const poi = createMockPOI({ name: null })

    const stats = await importer.batchImport([poi])

    expect(stats.invalidated).toBe(1)
    expect(stats.inserted).toBe(0)
  })

  it('should reject POIs with name shorter than 3 characters', async () => {
    const poi1 = createMockPOI({ name: 'AB' })
    const poi2 = createMockPOI({ name: 'X' })

    const stats = await importer.batchImport([poi1, poi2])

    expect(stats.invalidated).toBe(2)
    expect(stats.inserted).toBe(0)
  })

  it('should reject POIs with invalid latitude', async () => {
    const poi = createMockPOI({ lat: 'invalid' })

    const stats = await importer.batchImport([poi])

    expect(stats.invalidated).toBe(1)
    expect(stats.inserted).toBe(0)
  })

  it('should reject POIs with invalid longitude', async () => {
    const poi = createMockPOI({ lng: NaN })

    const stats = await importer.batchImport([poi])

    expect(stats.invalidated).toBe(1)
    expect(stats.inserted).toBe(0)
  })

  it('should accept POIs with valid required fields', async () => {
    const poi = createMockPOI({
      name: 'Valid Park',
      lat: 44.9778,
      lng: -93.2650
    })

    const stats = await importer.batchImport([poi])

    expect(stats.inserted).toBe(1)
    expect(stats.invalidated).toBe(0)
  })
})

describe('Database Import Safety - Geographic Bounds Validation', () => {
  let importer, mockPool

  beforeEach(() => {
    mockPool = createMockPool()
    importer = new DatabaseImporter(mockPool, { silent: true })
  })

  it('should reject POIs outside Minnesota bounds (south)', async () => {
    const poi = createMockPOI({ lat: 35.0, lng: -93.2650 }) // Too far south

    const stats = await importer.batchImport([poi])

    expect(stats.invalidated).toBe(1)
    expect(stats.inserted).toBe(0)
  })

  it('should reject POIs outside Minnesota bounds (north)', async () => {
    const poi = createMockPOI({ lat: 50.0, lng: -93.2650 }) // Too far north

    const stats = await importer.batchImport([poi])

    expect(stats.invalidated).toBe(1)
    expect(stats.inserted).toBe(0)
  })

  it('should reject POIs outside Minnesota bounds (west)', async () => {
    const poi = createMockPOI({ lat: 44.9778, lng: -98.0 }) // Too far west

    const stats = await importer.batchImport([poi])

    expect(stats.invalidated).toBe(1)
    expect(stats.inserted).toBe(0)
  })

  it('should reject POIs outside Minnesota bounds (east)', async () => {
    const poi = createMockPOI({ lat: 44.9778, lng: -88.0 }) // Too far east

    const stats = await importer.batchImport([poi])

    expect(stats.invalidated).toBe(1)
    expect(stats.inserted).toBe(0)
  })

  it('should accept POIs within Minnesota bounds', async () => {
    const poi = createMockPOI({
      name: 'Valid Minnesota Park',
      lat: 44.9778, // Within bounds
      lng: -93.2650 // Within bounds
    })

    const stats = await importer.batchImport([poi])

    expect(stats.inserted).toBe(1)
    expect(stats.invalidated).toBe(0)
  })

  it('should allow custom geographic bounds', () => {
    const customBounds = {
      south: 40.0,
      north: 50.0,
      west: -100.0,
      east: -80.0
    }

    const customImporter = new DatabaseImporter(mockPool, {
      silent: true,
      minnesotaBounds: customBounds
    })

    expect(customImporter.minnesotaBounds).toEqual(customBounds)
  })
})

describe('Database Import Safety - Batch Statistics', () => {
  let importer, mockPool

  beforeEach(() => {
    mockPool = createMockPool()
    importer = new DatabaseImporter(mockPool, { silent: true })
  })

  it('should track inserted count', async () => {
    const pois = [
      createMockPOI({ name: 'Park 1' }),
      createMockPOI({ name: 'Park 2', lat: 44.9879, lng: -93.2750 }),
      createMockPOI({ name: 'Park 3', lat: 44.9679, lng: -93.2850 })
    ]

    const stats = await importer.batchImport(pois)

    expect(stats.inserted).toBe(3)
  })

  it('should track skipped count', async () => {
    const pois = [
      createMockPOI({ name: 'Valid Park' }),
      createMockPOI({ name: 'X' }), // Too short
      createMockPOI({ lat: 'invalid' }) // Invalid coordinate
    ]

    const stats = await importer.batchImport(pois)

    expect(stats.skipped).toBe(2)
    expect(stats.invalidated).toBe(2)
  })

  it('should track duplicate count separately', async () => {
    const poi1 = createMockPOI({ name: 'Original Park' })
    await importer.batchImport([poi1])

    const poi2 = createMockPOI({
      name: 'Duplicate Park',
      lat: poi1.lat,
      lng: poi1.lng
    })

    const stats = await importer.batchImport([poi2])

    expect(stats.duplicates).toBe(1)
    expect(stats.skipped).toBe(1)
    expect(stats.inserted).toBe(0)
  })

  it('should provide complete statistics object', async () => {
    const pois = [createMockPOI({ name: 'Test Park' })]

    const stats = await importer.batchImport(pois)

    expect(stats).toHaveProperty('inserted')
    expect(stats).toHaveProperty('skipped')
    expect(stats).toHaveProperty('errors')
    expect(stats).toHaveProperty('duplicates')
    expect(stats).toHaveProperty('invalidated')
  })
})

describe('Database Import Safety - Integration Tests', () => {
  let importer, mockPool, mockClient

  beforeEach(() => {
    mockPool = createMockPool()
    mockClient = mockPool._getClient()
    importer = new DatabaseImporter(mockPool, { silent: true })
  })

  it('should handle mixed valid and invalid POIs', async () => {
    const pois = [
      createMockPOI({ name: 'Valid Park 1' }),
      createMockPOI({ name: 'XY' }), // Too short
      createMockPOI({ name: 'Valid Park 2', lat: 44.9879, lng: -93.2750 }),
      createMockPOI({ lat: 50.0, lng: -93.0 }) // Outside bounds
    ]

    const stats = await importer.batchImport(pois)

    expect(stats.inserted).toBe(2)
    expect(stats.invalidated).toBe(2)
    expect(stats.skipped).toBe(2)
  })

  it('should get import statistics by data source', async () => {
    const pois = [
      createMockPOI({ name: 'OSM Park 1', data_source: 'osm_overpass' }),
      createMockPOI({ name: 'OSM Park 2', lat: 44.9879, data_source: 'osm_overpass' }),
      createMockPOI({ name: 'Manual Park', lat: 44.9679, data_source: 'manual' })
    ]

    await importer.batchImport(pois)

    const stats = await importer.getImportStats(mockClient)

    expect(stats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ data_source: 'osm_overpass', count: 2 }),
        expect.objectContaining({ data_source: 'manual', count: 1 })
      ])
    )
  })

  it('should insert all POI fields correctly', async () => {
    const poi = createMockPOI({
      name: 'Complete Park',
      lat: 44.9778,
      lng: -93.2650,
      park_type: 'State Park',
      park_level: 'state',
      ownership: 'Minnesota DNR',
      operator: 'Minnesota DNR',
      data_source: 'osm_overpass',
      description: 'Beautiful state park',
      place_rank: 20,
      phone: '(651) 555-1234',
      website: 'https://example.com',
      amenities: ['parking', 'restrooms'],
      activities: ['hiking', 'camping']
    })

    const stats = await importer.batchImport([poi])

    expect(stats.inserted).toBe(1)

    // Verify INSERT query was called with correct parameters
    const queryLog = mockClient._getQueryLog()
    const insertQuery = queryLog.find(q =>
      typeof q.sql === 'string' && q.sql.includes('INSERT INTO poi_locations')
    )

    expect(insertQuery).toBeDefined()
    expect(insertQuery.params).toEqual([
      'Complete Park',
      44.9778,
      -93.2650,
      'State Park',
      'state',
      'Minnesota DNR',
      'Minnesota DNR',
      'osm_overpass',
      'Beautiful state park',
      20,
      '(651) 555-1234',
      'https://example.com',
      JSON.stringify(['parking', 'restrooms']),
      JSON.stringify(['hiking', 'camping'])
    ])
  })
})
