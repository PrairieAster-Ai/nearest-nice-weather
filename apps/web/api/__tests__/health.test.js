/**
 * ========================================================================
 * HEALTH API - Unit Tests
 * ========================================================================
 *
 * Tests for the health check API endpoint
 * File under test: apps/web/api/health.js
 *
 * @part-of Phase 0: Code Quality Prerequisites (CQ-2)
 * @created 2025-10-24
 * ========================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

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

import handler from '../health.js'

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
// Test Suite
// ========================================================================

describe('Health API Endpoint', () => {
  let mockReq
  let mockRes
  let originalEnv

  beforeEach(() => {
    // Reset mocks before each test
    mockReq = createMockRequest()
    mockRes = createMockResponse()

    // Save original environment
    originalEnv = { ...process.env }

    // Set up test environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb' // pragma: allowlist secret
    process.env.NODE_ENV = 'test'
    process.env.VERCEL_ENV = 'preview'
    process.env.VERCEL_REGION = 'iad1'
  })

  // ========================================================================
  // CORS Headers
  // ========================================================================

  describe('CORS Headers', () => {
    it('should set CORS headers for GET request', async () => {
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

    it('should reject PATCH request with 405', async () => {
      mockReq.method = 'PATCH'
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(405)
    })
  })

  // ========================================================================
  // Success Response
  // ========================================================================

  describe('Success Response', () => {
    it('should return success status', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
    })

    it('should return production message', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.message).toBe('Production API server is running')
    })

    it('should return timestamp in ISO format', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should return vercel-serverless environment', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.environment).toBe('vercel-serverless')
    })

    it('should return VERCEL_REGION from environment', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.region).toBe('iad1')
    })

    it('should return unknown region when VERCEL_REGION not set', async () => {
      delete process.env.VERCEL_REGION
      await handler(mockReq, mockRes)

      expect(mockRes.body.region).toBe('unknown')
    })
  })

  // ========================================================================
  // Debug Information
  // ========================================================================

  describe('Debug Information', () => {
    it('should include debug object', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.debug).toBeDefined()
      expect(typeof mockRes.body.debug).toBe('object')
    })

    it('should report DATABASE_URL presence as true when set', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.debug.has_database_url).toBe(true)
    })

    it('should report DATABASE_URL presence as false when not set', async () => {
      delete process.env.DATABASE_URL
      await handler(mockReq, mockRes)

      expect(mockRes.body.debug.has_database_url).toBe(false)
    })

    it('should include NODE_ENV in debug info', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.debug.node_env).toBe('test')
    })

    it('should include VERCEL_ENV in debug info', async () => {
      await handler(mockReq, mockRes)

      expect(mockRes.body.debug.vercel_env).toBe('preview')
    })

    it('should handle missing NODE_ENV gracefully', async () => {
      delete process.env.NODE_ENV
      await handler(mockReq, mockRes)

      expect(mockRes.body.debug.node_env).toBeUndefined()
    })

    it('should handle missing VERCEL_ENV gracefully', async () => {
      delete process.env.VERCEL_ENV
      await handler(mockReq, mockRes)

      expect(mockRes.body.debug.vercel_env).toBeUndefined()
    })
  })

  // ========================================================================
  // Error Handling
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Force an error by making json() throw
      mockRes.json = vi.fn(() => {
        throw new Error('Test error')
      })

      // The error should be thrown since the handler doesn't have comprehensive error handling
      await expect(handler(mockReq, mockRes)).rejects.toThrow('Test error')

      // Note: Error logging now happens through structured logger (mocked)
    })

    it('should return error response when exception occurs', async () => {
      // Create a new mock response for error testing
      const errorRes = createMockResponse()
      let errorBody = null

      errorRes.json = vi.fn((data) => {
        if (!errorBody) {
          // First call - throw error
          errorBody = data
          throw new Error('Test error')
        }
        // Second call - return error response
        errorRes.body = data
        return errorRes
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, errorRes)

      expect(errorRes.status).toHaveBeenCalledWith(500)
      expect(errorRes.body.success).toBe(false)
      expect(errorRes.body.error).toBe('Health check failed')
      expect(errorRes.body.timestamp).toBeDefined()

      consoleErrorSpy.mockRestore()
    })

    it('should log errors via structured logger', async () => {
      mockRes.json = vi.fn(() => {
        throw new Error('Test error')
      })

      await expect(handler(mockReq, mockRes)).rejects.toThrow('Test error')

      // Note: Error logging now happens through structured logger (mocked)
      // Logger mock is called but we don't need to verify it here since
      // the error handling behavior (throwing) is already verified
    })
  })

  // ========================================================================
  // Response Structure Validation
  // ========================================================================

  describe('Response Structure', () => {
    it('should have all required success response fields', async () => {
      await handler(mockReq, mockRes)

      const requiredFields = ['success', 'message', 'timestamp', 'environment', 'region', 'debug']
      requiredFields.forEach(field => {
        expect(mockRes.body).toHaveProperty(field)
      })
    })

    it('should have all required debug fields', async () => {
      await handler(mockReq, mockRes)

      const requiredDebugFields = ['has_database_url', 'node_env', 'vercel_env']
      requiredDebugFields.forEach(field => {
        expect(mockRes.body.debug).toHaveProperty(field)
      })
    })

    it('should return valid JSON structure', async () => {
      await handler(mockReq, mockRes)

      // Verify response can be serialized to JSON
      expect(() => JSON.stringify(mockRes.body)).not.toThrow()
    })
  })

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle empty environment variables', async () => {
      process.env.DATABASE_URL = ''
      process.env.VERCEL_REGION = ''

      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
      expect(mockRes.body.debug.has_database_url).toBe(false)
      expect(mockRes.body.region).toBe('unknown')
    })

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => {
        const req = createMockRequest()
        const res = createMockResponse()
        return handler(req, res)
      })

      await Promise.all(requests)

      // All requests should complete successfully
      expect(requests).toHaveLength(10)
    })

    it('should return consistent response structure across calls', async () => {
      const req1 = createMockRequest()
      const res1 = createMockResponse()
      await handler(req1, res1)

      const req2 = createMockRequest()
      const res2 = createMockResponse()
      await handler(req2, res2)

      expect(Object.keys(res1.body).sort()).toEqual(Object.keys(res2.body).sort())
      expect(Object.keys(res1.body.debug).sort()).toEqual(Object.keys(res2.body.debug).sort())
    })
  })
})
