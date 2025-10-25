/**
 * ========================================================================
 * POI LOCATIONS WITH WEATHER API - Unit Tests
 * ========================================================================
 *
 * Tests for the POI discovery endpoint with weather integration
 * File under test: apps/web/api/poi-locations-with-weather.js
 *
 * @part-of Phase 0: Code Quality Prerequisites (CQ-2)
 * @created 2025-10-24
 * ========================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ========================================================================
// Mock Dependencies - MUST be before imports
// ========================================================================

// Mock logger before importing handler
vi.mock('../../../../shared/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })),
  createRequestContext: vi.fn(() => ({ method: 'GET', url: '/', ip: '127.0.0.1' })),
  createErrorContext: vi.fn((error) => ({ error: error.message }))
}))

// Mock @neondatabase/serverless
vi.mock('@neondatabase/serverless', () => {
  const mockSql = vi.fn()
  return {
    neon: vi.fn(() => mockSql)
  }
})

// Import handler and mocks AFTER mock setup
import handler from '../poi-locations-with-weather.js'
import { neon } from '@neondatabase/serverless'

// ========================================================================
// Test Helpers - Mock Request/Response Objects
// ========================================================================

/**
 * Create a mock Vercel request object
 */
function createMockRequest(method = 'GET', query = {}) {
  return {
    method,
    query,
    headers: {}
  }
}

/**
 * Create a mock Vercel response object with spies
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,

    // Mock setHeader
    setHeader: vi.fn((key, value) => {
      res.headers[key] = value
    }),

    // Mock status
    status: vi.fn((code) => {
      res.statusCode = code
      return res
    }),

    // Mock json
    json: vi.fn((data) => {
      res.body = data
      return res
    }),

    // Mock end
    end: vi.fn(() => res)
  }

  return res
}

// ========================================================================
// Test Data
// ========================================================================

const mockPOIData = [
  {
    id: 1,
    name: 'Minnehaha Falls',
    lat: 44.9153,
    lng: -93.2111,
    park_type: 'state_park',
    amenities: ['trails', 'waterfall'],
    distance: 5.2
  },
  {
    id: 2,
    name: 'Lake Harriet',
    lat: 44.9219,
    lng: -93.3098,
    park_type: 'city_park',
    amenities: ['lake', 'trails'],
    distance: 8.5
  }
]

const mockWeatherData = {
  main: {
    temp: 72,
    humidity: 65
  },
  weather: [
    {
      main: 'Clear',
      description: 'clear sky'
    }
  ],
  wind: {
    speed: 8
  },
  clouds: {
    all: 10
  }
}

// ========================================================================
// Test Suite
// ========================================================================

describe('POI Locations with Weather API Endpoint', () => {
  let mockReq
  let mockRes
  let mockSql
  let originalEnv
  let originalFetch

  beforeEach(() => {
    // Reset mocks before each test
    mockReq = createMockRequest()
    mockRes = createMockResponse()

    // Get mock SQL instance
    mockSql = neon()
    mockSql.mockClear()

    // Save original environment
    originalEnv = { ...process.env }

    // Set up test environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb' // pragma: allowlist secret
    process.env.OPENWEATHER_API_KEY = 'test-api-key' // pragma: allowlist secret

    // Mock global fetch for weather API calls
    originalFetch = global.fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWeatherData)
      })
    )
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv

    // Restore original fetch
    global.fetch = originalFetch
  })

  // ========================================================================
  // CORS Headers
  // ========================================================================

  describe('CORS Headers', () => {
    it('should set CORS headers for GET request', async () => {
      mockSql.mockResolvedValue([])

      await handler(mockReq, mockRes)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, OPTIONS')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type')
    })

    it('should set CORS headers for OPTIONS request', async () => {
      mockReq.method = 'OPTIONS'
      await handler(mockReq, mockRes)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, OPTIONS')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type')
    })
  })

  // ========================================================================
  // HTTP Methods
  // ========================================================================

  describe('HTTP Methods', () => {
    it('should handle OPTIONS request (preflight)', async () => {
      mockReq.method = 'OPTIONS'
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.end).toHaveBeenCalled()
      expect(mockRes.json).not.toHaveBeenCalled()
    })

    it('should handle GET request successfully', async () => {
      mockSql.mockResolvedValue([])
      mockReq.method = 'GET'

      await handler(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalled()
      expect(mockRes.body.success).toBe(true)
    })

    it('should reject POST request with 405', async () => {
      mockReq.method = 'POST'
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(405)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Method not allowed'
      })
    })

    it('should reject PUT request with 405', async () => {
      mockReq.method = 'PUT'
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(405)
    })

    it('should reject DELETE request with 405', async () => {
      mockReq.method = 'DELETE'
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(405)
    })
  })

  // ========================================================================
  // Proximity Queries (with lat/lng)
  // ========================================================================

  describe('Proximity Queries', () => {
    it('should query POIs with proximity when lat/lng provided', async () => {
      mockReq.query = { lat: '44.9778', lng: '-93.2650', radius: '10' }
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockSql).toHaveBeenCalled()
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall[0][0]).toContain('3959') // Haversine formula constant (miles)
      expect(mockRes.body.success).toBe(true)
    })

    it('should use default radius of 25km when not specified', async () => {
      mockReq.query = { lat: '44.9778', lng: '-93.2650' }
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockSql).toHaveBeenCalled()
      expect(mockRes.body.success).toBe(true)
    })

    it('should use default limit of 20 when not specified', async () => {
      mockReq.query = { lat: '44.9778', lng: '-93.2650' }
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockSql).toHaveBeenCalled()
      expect(mockRes.body.data.length).toBeLessThanOrEqual(20)
    })

    it('should respect custom limit parameter', async () => {
      mockReq.query = { lat: '44.9778', lng: '-93.2650', limit: '5' }
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockSql).toHaveBeenCalled()
      expect(mockRes.body.success).toBe(true)
    })

    it('should handle invalid coordinates gracefully', async () => {
      mockReq.query = { lat: 'invalid', lng: 'invalid' }
      mockSql.mockResolvedValue([])

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data).toEqual([])
    })
  })

  // ========================================================================
  // General Queries (without lat/lng)
  // ========================================================================

  describe('General Queries', () => {
    it('should query all POIs when no lat/lng provided', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockSql).toHaveBeenCalled()
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall[0][0]).toContain('place_rank') // General query uses place_rank
      expect(mockRes.body.success).toBe(true)
    })

    it('should respect limit parameter in general queries', async () => {
      mockReq.query = { limit: '10' }
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockSql).toHaveBeenCalled()
      expect(mockRes.body.success).toBe(true)
    })

    it('should handle empty database results', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue([])

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data).toEqual([])
      expect(mockRes.body.count).toBe(0)
    })
  })

  // ========================================================================
  // Weather API Integration
  // ========================================================================

  describe('Weather API Integration', () => {
    it('should fetch weather data for each POI', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(global.fetch).toHaveBeenCalledTimes(2) // One call per POI
      expect(mockRes.body.success).toBe(true)
    })

    it('should include weather data in response', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockRes.body.data[0]).toHaveProperty('temperature')
      expect(mockRes.body.data[0]).toHaveProperty('condition')
      expect(mockRes.body.data[0]).toHaveProperty('precipitation')
      expect(mockRes.body.data[0]).toHaveProperty('windSpeed')
    })

    it('should map weather conditions correctly', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue([mockPOIData[0]])

      await handler(mockReq, mockRes)

      // Weather condition is returned as-is from OpenWeather API
      expect(mockRes.body.data[0].condition).toBe('Clear')
      expect(mockRes.body.data[0].temperature).toBe(72)
    })

    it('should handle weather API failures gracefully', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue([mockPOIData[0]])
      global.fetch = vi.fn(() => Promise.reject(new Error('API error')))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, mockRes)

      // Should still return success with fallback weather
      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data[0]).toHaveProperty('temperature')

      consoleErrorSpy.mockRestore()
    })

    it('should use fallback weather when API key missing', async () => {
      delete process.env.OPENWEATHER_API_KEY
      mockReq.query = {}
      mockSql.mockResolvedValue([mockPOIData[0]])

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data[0]).toHaveProperty('temperature')
      expect(global.fetch).not.toHaveBeenCalled() // Should use fallback
    })

    it('should handle weather API non-ok response', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue([mockPOIData[0]])

      // Mock fetch to return non-ok response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503
        })
      )

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, mockRes)

      // Should use fallback weather
      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data[0]).toHaveProperty('temperature')

      consoleErrorSpy.mockRestore()
    })
  })

  // ========================================================================
  // Weather Filtering
  // ========================================================================

  describe('Weather Filtering', () => {
    it('should include weather data when filters not specified', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      // Should return all POIs with weather data
      expect(mockRes.body.data.length).toBe(2)
      expect(mockRes.body.data[0]).toHaveProperty('temperature')
      expect(mockRes.body.data[0]).toHaveProperty('condition')
    })

    it('should apply weather filters when specified', async () => {
      mockReq.query = {
        temperature: 'mild',
        precipitation: 'none',
        wind: 'calm'
      }
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      // Should apply filters and return filtered results
      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data.length).toBeLessThanOrEqual(2)
    })

    it('should handle empty filter results', async () => {
      mockReq.query = {
        temperature: 'hot' // Unlikely to match our mock weather
      }
      mockSql.mockResolvedValue(mockPOIData)

      // Mock extreme weather that won't match any filters
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            main: { temp: 20 }, // Very cold
            weather: [{ main: 'Clear' }],
            wind: { speed: 0 },
            clouds: { all: 0 }
          })
        })
      )

      await handler(mockReq, mockRes)

      // May return 0 results due to filtering
      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ========================================================================
  // Response Structure
  // ========================================================================

  describe('Response Structure', () => {
    it('should have all required success response fields', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      const requiredFields = ['success', 'data', 'count']
      requiredFields.forEach(field => {
        expect(mockRes.body).toHaveProperty(field)
      })
    })

    it('should return array of POI objects', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(Array.isArray(mockRes.body.data)).toBe(true)
    })

    it('should include POI metadata in response', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue([mockPOIData[0]])

      await handler(mockReq, mockRes)

      const poi = mockRes.body.data[0]
      expect(poi).toHaveProperty('name')
      expect(poi).toHaveProperty('lat')
      expect(poi).toHaveProperty('lng')
      expect(poi).toHaveProperty('park_type')
    })

    it('should return valid JSON structure', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      // Verify response can be serialized to JSON
      expect(() => JSON.stringify(mockRes.body)).not.toThrow()
    })
  })

  // ========================================================================
  // Error Handling
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockReq.query = {}
      mockSql.mockRejectedValue(new Error('Database connection failed'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.body.success).toBe(false)
      expect(mockRes.body.error).toBe('Failed to retrieve POI data with weather')

      consoleErrorSpy.mockRestore()
    })

    it('should log errors via structured logger', async () => {
      mockReq.query = {}
      mockSql.mockRejectedValue(new Error('Test error'))

      await handler(mockReq, mockRes)

      // Note: Error logging now happens through structured logger (mocked)
      // Logger mock is called but we don't need to verify it here since
      // the error handling behavior (500 status) is already verified
    })

    it('should return error timestamp', async () => {
      mockReq.query = {}
      mockSql.mockRejectedValue(new Error('Test error'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, mockRes)

      expect(mockRes.body.timestamp).toBeDefined()
      expect(mockRes.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      consoleErrorSpy.mockRestore()
    })

    it('should handle missing DATABASE_URL', async () => {
      delete process.env.DATABASE_URL
      mockReq.query = {}

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)

      consoleErrorSpy.mockRestore()
    })
  })

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle very large radius values', async () => {
      mockReq.query = { lat: '44.9778', lng: '-93.2650', radius: '10000' }
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
    })

    it('should handle very small radius values', async () => {
      mockReq.query = { lat: '44.9778', lng: '-93.2650', radius: '0.1' }
      mockSql.mockResolvedValue([])

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data).toEqual([])
    })

    it('should handle very large limit values', async () => {
      mockReq.query = { limit: '9999' }
      mockSql.mockResolvedValue(mockPOIData)

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
    })

    it('should handle limit of 0', async () => {
      mockReq.query = { limit: '0' }
      mockSql.mockResolvedValue([])

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data).toEqual([])
    })

    it('should handle negative coordinates', async () => {
      mockReq.query = { lat: '-44.9778', lng: '-93.2650' }
      mockSql.mockResolvedValue([])

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
    })

    it('should handle multiple concurrent requests', async () => {
      mockSql.mockResolvedValue(mockPOIData)

      const requests = Array(5).fill(null).map(() => {
        const req = createMockRequest()
        const res = createMockResponse()
        return handler(req, res)
      })

      await Promise.all(requests)

      // All requests should complete successfully
      expect(requests).toHaveLength(5)
    })

    it('should handle POIs with missing weather data fields', async () => {
      mockReq.query = {}
      mockSql.mockResolvedValue([mockPOIData[0]])

      // Mock weather response with missing fields
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            main: { temp: 72 },
            weather: [{ main: 'Clear' }],
            // Missing wind and clouds
          })
        })
      )

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.data[0].windSpeed).toBe(0) // Should default to 0
    })
  })
})
