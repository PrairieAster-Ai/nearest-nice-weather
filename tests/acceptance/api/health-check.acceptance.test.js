/**
 * ========================================================================
 * ACCEPTANCE TEST: Health Check API
 * ========================================================================
 *
 * Validates production-ready status of health check endpoint
 * Tests against: localhost, preview, production
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

// Test configuration
const RESPONSE_TIME_THRESHOLD = 2000 // 2 seconds
const currentEnv = process.env.TEST_ENV || 'localhost'
const baseUrl = environments[currentEnv]

describe(`Health Check Acceptance Tests [${currentEnv}]`, () => {

  // ========================================================================
  // Critical Tests - Must Pass
  // ========================================================================

  describe('Critical: Endpoint Availability', () => {
    it('should return 200 OK status', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/api/health`)
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD)
    })

    it('should return valid JSON response', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const contentType = response.headers.get('content-type')

      expect(contentType).toContain('application/json')

      const data = await response.json()
      expect(data).toBeDefined()
      expect(typeof data).toBe('object')
    })

    it('should include success=true in response', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const data = await response.json()

      expect(data.success).toBe(true)
    })

    it('should include timestamp in ISO format', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const data = await response.json()

      expect(data.timestamp).toBeDefined()
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  // ========================================================================
  // High Priority Tests - Should Pass
  // ========================================================================

  describe('High Priority: Response Structure', () => {
    it('should include environment information', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const data = await response.json()

      if (currentEnv !== 'localhost') {
        expect(data.environment).toBe('vercel-serverless')
        expect(data.region).toBeDefined()
      }
    })

    it('should include message field', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const data = await response.json()

      expect(data.message).toBeDefined()
      expect(typeof data.message).toBe('string')
      expect(data.message.length).toBeGreaterThan(0)
    })

    it('should include debug information', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const data = await response.json()

      expect(data.debug).toBeDefined()
      expect(typeof data.debug).toBe('object')
      expect(data.debug.has_database_url).toBeDefined()
    })
  })

  // ========================================================================
  // Performance Tests
  // ========================================================================

  describe('Performance: Response Time', () => {
    it('should respond in less than 2 seconds', async () => {
      const startTime = Date.now()
      await fetch(`${baseUrl}/api/health`)
      const responseTime = Date.now() - startTime

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD)
    })

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() => {
        const startTime = Date.now()
        return fetch(`${baseUrl}/api/health`).then(res => ({
          status: res.status,
          time: Date.now() - startTime
        }))
      })

      const results = await Promise.all(requests)

      results.forEach(result => {
        expect(result.status).toBe(200)
        expect(result.time).toBeLessThan(RESPONSE_TIME_THRESHOLD)
      })
    })
  })

  // ========================================================================
  // CORS Tests
  // ========================================================================

  describe('Integration: CORS Headers', () => {
    it('should allow cross-origin requests', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const corsHeader = response.headers.get('access-control-allow-origin')

      expect(corsHeader).toBeDefined()
      expect(corsHeader).toBe('*')
    })

    it('should support OPTIONS preflight', async () => {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS'
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('access-control-allow-methods')).toContain('GET')
    })
  })

  // ========================================================================
  // Data Integrity Tests
  // ========================================================================

  describe('Data Integrity: Environment Validation', () => {
    it('should confirm database connection exists', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const data = await response.json()

      expect(data.debug.has_database_url).toBe(true)
    })

    it('should report correct environment', async () => {
      const response = await fetch(`${baseUrl}/api/health`)
      const data = await response.json()

      if (currentEnv === 'production') {
        expect(data.debug.vercel_env).toBe('production')
      } else if (currentEnv === 'preview') {
        expect(data.debug.vercel_env).toBe('preview')
      }
    })
  })
})
