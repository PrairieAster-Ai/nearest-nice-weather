/**
 * ========================================================================
 * MOCK OVERPASS API - Test Fixtures for OSM Integration
 * ========================================================================
 *
 * @PURPOSE: Mock fetch responses for Overpass API testing
 * @USAGE: Import in test files to mock HTTP requests
 */

const fs = require('fs')
const path = require('path')

/**
 * Load fixture data from JSON files
 */
function loadFixture(filename) {
  const fixturePath = path.join(__dirname, '../fixtures', filename)
  const data = fs.readFileSync(fixturePath, 'utf-8')
  return JSON.parse(data)
}

/**
 * Create mock fetch function that returns Overpass API response
 */
function createMockOverpassFetch(fixtureFile = 'osm-overpass-response.json') {
  const fixtureData = loadFixture(fixtureFile)

  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => fixtureData
  })
}

/**
 * Create mock fetch that returns error
 */
function createMockOverpassError(statusCode = 500, message = 'Internal Server Error') {
  return jest.fn().mockResolvedValue({
    ok: false,
    status: statusCode,
    statusText: message
  })
}

/**
 * Create mock fetch that simulates timeout
 */
function createMockOverpassTimeout() {
  return jest.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'))
      }, 100)
    })
  })
}

/**
 * Create mock fetch that simulates rate limiting (429)
 */
function createMockOverpassRateLimit() {
  return jest.fn().mockResolvedValue({
    ok: false,
    status: 429,
    statusText: 'Too Many Requests',
    headers: {
      get: (name) => {
        if (name === 'Retry-After') return '60'
        return null
      }
    }
  })
}

/**
 * Create mock fetch that returns malformed JSON
 */
function createMockOverpassMalformedJSON() {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError('Unexpected token in JSON')
    }
  })
}

/**
 * Create mock fetch that returns empty result
 */
function createMockOverpassEmpty() {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      version: 0.6,
      generator: 'Overpass API Mock',
      elements: []
    })
  })
}

/**
 * Create mock fetch with custom delay (for testing rate limiting)
 */
function createMockOverpassWithDelay(fixtureFile = 'osm-overpass-response.json', delayMs = 500) {
  const fixtureData = loadFixture(fixtureFile)

  return jest.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          status: 200,
          json: async () => fixtureData
        })
      }, delayMs)
    })
  })
}

/**
 * Spy on fetch calls to verify API interaction
 */
function createFetchSpy() {
  return {
    calls: [],
    mockFetch: jest.fn((url, options) => {
      this.calls.push({ url, options, timestamp: Date.now() })
      return createMockOverpassFetch()()
    })
  }
}

// Export all functions
module.exports = {
  loadFixture,
  createMockOverpassFetch,
  createMockOverpassError,
  createMockOverpassTimeout,
  createMockOverpassRateLimit,
  createMockOverpassMalformedJSON,
  createMockOverpassEmpty,
  createMockOverpassWithDelay,
  createFetchSpy
}
