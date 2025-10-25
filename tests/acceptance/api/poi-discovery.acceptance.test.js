/**
 * ========================================================================
 * ACCEPTANCE TEST: POI Discovery with Weather
 * ========================================================================
 *
 * Validates production-ready status of POI discovery endpoint
 * Tests critical user workflow: Finding outdoor destinations with weather
 *
 * @category Acceptance Tests
 * @priority Critical
 * ========================================================================
 */

import { describe, it, expect } from 'vitest'

// Environment configuration
const environments = {
  localhost: process.env.LOCALHOST_API_URL || 'http://localhost:4000',
  preview: process.env.PREVIEW_URL || 'https://p.nearestniceweather.com',
  production: process.env.PRODUCTION_URL || 'https://nearestniceweather.com'
}

const RESPONSE_TIME_THRESHOLD = 3000 // 3 seconds (allows for weather API calls)
const MIN_POI_COUNT = 100 // Minimum expected POIs
const currentEnv = process.env.TEST_ENV || 'localhost'
const baseUrl = environments[currentEnv]

describe(`POI Discovery Acceptance Tests [${currentEnv}]`, () => {

  // ========================================================================
  // Critical Tests - Must Pass
  // ========================================================================

  describe('Critical: Endpoint Availability', () => {
    it('should return 200 OK for valid request', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=10`)
      expect(response.status).toBe(200)
    })

    it('should return valid JSON with POI data', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=10`)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should return POIs with weather data', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=5`)
      const data = await response.json()

      expect(data.data.length).toBeGreaterThan(0)

      const firstPOI = data.data[0]
      expect(firstPOI.temperature).toBeDefined()
      expect(firstPOI.condition).toBeDefined()
      expect(firstPOI.windSpeed).toBeDefined()
      expect(firstPOI.precipitation).toBeDefined()
    })

    it('should have minimum POI count in database', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=200`)
      const data = await response.json()

      expect(data.count).toBeGreaterThanOrEqual(MIN_POI_COUNT)
    })
  })

  // ========================================================================
  // High Priority: Data Quality
  // ========================================================================

  describe('High Priority: POI Data Quality', () => {
    it('should return POIs with complete metadata', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=10`)
      const data = await response.json()

      data.data.forEach(poi => {
        expect(poi.id).toBeDefined()
        expect(poi.name).toBeDefined()
        expect(poi.lat).toBeDefined()
        expect(poi.lng).toBeDefined()
        expect(typeof poi.lat).toBe('number')
        expect(typeof poi.lng).toBe('number')
      })
    })

    it('should return real weather data (not mock)', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=5`)
      const data = await response.json()

      const firstPOI = data.data[0]

      // Weather should be real (varying temperatures, not static mock data)
      expect(firstPOI.weather_source).toBeDefined()
      expect(firstPOI.temperature).toBeGreaterThan(0)
      expect(firstPOI.temperature).toBeLessThan(120) // Reasonable temperature range

      // Should have weather timestamp
      expect(firstPOI.weather_timestamp).toBeDefined()
    })

    it('should return Minnesota outdoor recreation POIs', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=20`)
      const data = await response.json()

      // Check for park/trail types (not cities or weather stations)
      const hasOutdoorPOIs = data.data.some(poi =>
        poi.park_type ||
        poi.name.toLowerCase().includes('park') ||
        poi.name.toLowerCase().includes('trail') ||
        poi.name.toLowerCase().includes('forest')
      )

      expect(hasOutdoorPOIs).toBe(true)
    })
  })

  // ========================================================================
  // High Priority: Query Parameters
  // ========================================================================

  describe('High Priority: Query Parameter Support', () => {
    it('should respect limit parameter', async () => {
      const limit = 5
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=${limit}`)
      const data = await response.json()

      expect(data.data.length).toBeLessThanOrEqual(limit)
      expect(data.count).toBe(data.data.length)
    })

    it('should support proximity queries with lat/lng', async () => {
      // Minneapolis coordinates
      const lat = 44.9778
      const lng = -93.2650

      const response = await fetch(
        `${baseUrl}/api/poi-locations-with-weather?lat=${lat}&lng=${lng}&limit=10`
      )
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)

      // Should include distance for proximity queries
      if (data.data[0].distance_miles) {
        expect(typeof data.data[0].distance_miles).toBe('string')
      }
    })

    it('should support weather filters', async () => {
      const response = await fetch(
        `${baseUrl}/api/poi-locations-with-weather?temperature=mild&limit=20`
      )
      const data = await response.json()

      expect(data.success).toBe(true)
      // Filter may reduce results
      expect(data.count).toBeGreaterThanOrEqual(0)
    })
  })

  // ========================================================================
  // Performance Tests
  // ========================================================================

  describe('Performance: Response Time', () => {
    it('should respond in less than 3 seconds', async () => {
      const startTime = Date.now()
      await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=10`)
      const responseTime = Date.now() - startTime

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD)
    })

    it('should handle larger result sets efficiently', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=50`)
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 1.5) // Allow 50% more time
    })
  })

  // ========================================================================
  // Integration: Weather API
  // ========================================================================

  describe('Integration: Weather API', () => {
    it('should include weather API information in debug', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=5`)
      const data = await response.json()

      if (data.debug) {
        expect(data.debug.weather_api).toBeDefined()
        expect(data.debug.data_source).toBeDefined()
      }
    })

    it('should have valid weather conditions', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=10`)
      const data = await response.json()

      const validConditions = [
        'Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain',
        'Rain', 'Thunderstorms', 'Snow', 'Foggy', 'Hazy'
      ]

      data.data.forEach(poi => {
        if (poi.condition) {
          expect(validConditions).toContain(poi.condition)
        }
      })
    })
  })

  // ========================================================================
  // Error Handling
  // ========================================================================

  describe('Error Handling: Invalid Requests', () => {
    it('should handle invalid coordinates gracefully', async () => {
      const response = await fetch(
        `${baseUrl}/api/poi-locations-with-weather?lat=invalid&lng=invalid&limit=5`
      )
      const data = await response.json()

      // Should still return success (with empty or all results)
      expect(data.success).toBe(true)
    })

    it('should handle excessive limit values', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather?limit=99999`)
      const data = await response.json()

      expect(data.success).toBe(true)
      // Should cap at reasonable limit
      expect(data.count).toBeLessThanOrEqual(500)
    })

    it('should reject non-GET requests', async () => {
      const response = await fetch(`${baseUrl}/api/poi-locations-with-weather`, {
        method: 'POST'
      })

      expect(response.status).toBe(405)
    })
  })
})
