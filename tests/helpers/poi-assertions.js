/**
 * ========================================================================
 * POI TEST ASSERTIONS - Custom Matchers for POI Data Validation
 * ========================================================================
 *
 * @PURPOSE: Reusable assertion helpers for POI data testing
 * @USAGE: Import in test files for consistent validation
 */

/**
 * Validate POI has all required fields
 */
function expectValidPOI(poi) {
  expect(poi).toBeDefined()
  expect(poi.name).toBeDefined()
  expect(typeof poi.name).toBe('string')
  expect(poi.name.length).toBeGreaterThanOrEqual(3)

  expect(poi.lat).toBeDefined()
  expect(typeof poi.lat).toBe('number')
  expect(poi.lat).not.toBeNaN()

  expect(poi.lng).toBeDefined()
  expect(typeof poi.lng).toBe('number')
  expect(poi.lng).not.toBeNaN()
}

/**
 * Validate POI coordinates are within Minnesota bounds
 */
function expectMinnesotaBounds(poi) {
  const minnesotaBounds = {
    south: 43.499356,
    north: 49.384472,
    west: -97.239209,
    east: -89.491739
  }

  expect(poi.lat).toBeGreaterThanOrEqual(minnesotaBounds.south)
  expect(poi.lat).toBeLessThanOrEqual(minnesotaBounds.north)
  expect(poi.lng).toBeGreaterThanOrEqual(minnesotaBounds.west)
  expect(poi.lng).toBeLessThanOrEqual(minnesotaBounds.east)
}

/**
 * Validate POI matches poi_locations database schema
 */
function expectDatabaseSchema(poi) {
  // Required fields
  expectValidPOI(poi)

  // Optional fields should be correct type if present
  if (poi.park_type !== undefined) {
    expect(typeof poi.park_type === 'string' || poi.park_type === null).toBe(true)
  }

  if (poi.park_level !== undefined) {
    expect(['national', 'state', 'county', 'municipal', null].includes(poi.park_level)).toBe(true)
  }

  if (poi.data_source !== undefined) {
    expect(typeof poi.data_source).toBe('string')
  }

  if (poi.place_rank !== undefined) {
    expect(typeof poi.place_rank).toBe('number')
    expect(poi.place_rank).toBeGreaterThan(0)
    expect(poi.place_rank).toBeLessThanOrEqual(100)
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in miles
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Check if two POIs are duplicates (within 10 meters / ~0.0001 degrees)
 */
function areDuplicates(poi1, poi2) {
  const distanceMiles = calculateDistance(poi1.lat, poi1.lng, poi2.lat, poi2.lng)
  const distanceFeet = distanceMiles * 5280
  return distanceFeet < 33 // 10 meters = ~33 feet
}

/**
 * Validate array of POIs has no duplicates
 */
function expectNoDuplicates(pois) {
  for (let i = 0; i < pois.length; i++) {
    for (let j = i + 1; j < pois.length; j++) {
      if (areDuplicates(pois[i], pois[j])) {
        throw new Error(`Duplicate POIs found: ${pois[i].name} and ${pois[j].name} are within 10 meters`)
      }
    }
  }
}

/**
 * Create mock POI for testing
 */
function createMockPOI(overrides = {}) {
  return {
    id: '123',
    name: 'Test Park',
    lat: 44.9778,
    lng: -93.2650,
    park_type: 'State Park',
    park_level: 'state',
    ownership: 'Minnesota DNR',
    operator: 'Minnesota DNR',
    data_source: 'osm_overpass',
    description: 'Test park description',
    place_rank: 20,
    phone: null,
    website: null,
    amenities: [],
    activities: [],
    ...overrides
  }
}

/**
 * Validate import statistics
 */
function expectValidStatistics(stats) {
  expect(stats).toBeDefined()
  expect(typeof stats.inserted).toBe('number')
  expect(typeof stats.skipped).toBe('number')
  expect(typeof stats.errors).toBe('number')

  expect(stats.inserted).toBeGreaterThanOrEqual(0)
  expect(stats.skipped).toBeGreaterThanOrEqual(0)
  expect(stats.errors).toBeGreaterThanOrEqual(0)
}

// Export all functions
module.exports = {
  expectValidPOI,
  expectMinnesotaBounds,
  expectDatabaseSchema,
  calculateDistance,
  areDuplicates,
  expectNoDuplicates,
  createMockPOI,
  expectValidStatistics
}
