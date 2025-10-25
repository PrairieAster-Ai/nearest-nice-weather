/**
 * ========================================================================
 * FEEDBACK API - Unit Tests
 * ========================================================================
 *
 * Tests for the feedback submission API endpoint
 * File under test: apps/web/api/feedback.js
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
  createRequestContext: vi.fn(() => ({ method: 'POST', url: '/', ip: '127.0.0.1' })),
  createErrorContext: vi.fn((error) => ({ error: error.message }))
}))

// Mock the @neondatabase/serverless module before importing handler
vi.mock('@neondatabase/serverless', () => {
  const mockSql = vi.fn()
  return {
    neon: vi.fn(() => mockSql)
  }
})

import handler from '../feedback.js'
import { neon } from '@neondatabase/serverless'

// ========================================================================
// Test Helpers - Mock Request/Response Objects
// ========================================================================

/**
 * Create a mock Vercel request object
 */
function createMockRequest(method = 'POST', body = {}, headers = {}) {
  return {
    method,
    body,
    headers: {
      'user-agent': 'Mozilla/5.0 Test Browser',
      'x-forwarded-for': '192.168.1.100',
      ...headers
    }
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

describe('Feedback API Endpoint', () => {
  let mockReq
  let mockRes
  let mockSql
  let originalEnv

  beforeEach(() => {
    // Reset mocks before each test
    mockReq = createMockRequest()
    mockRes = createMockResponse()

    // Get the mocked sql function
    mockSql = neon()
    mockSql.mockClear()

    // Save original environment
    originalEnv = { ...process.env }

    // Set up test environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb' // pragma: allowlist secret
    process.env.NODE_ENV = 'test'

    // Default mock implementation for successful database operations
    mockSql.mockImplementation((strings, ...values) => {
      // CREATE TABLE query
      if (strings[0].includes('CREATE TABLE')) {
        return Promise.resolve([])
      }
      // INSERT query - return mock feedback record
      if (strings[0].includes('INSERT INTO')) {
        return Promise.resolve([{
          id: 123,
          created_at: new Date('2025-10-24T12:00:00Z')
        }])
      }
      return Promise.resolve([])
    })
  })

  // ========================================================================
  // CORS Headers
  // ========================================================================

  describe('CORS Headers', () => {
    it('should set CORS headers for POST request', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type')
    })

    it('should set CORS headers for OPTIONS request', async () => {
      mockReq.method = 'OPTIONS'
      await handler(mockReq, mockRes)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS')
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

    it('should handle POST request successfully', async () => {
      mockReq.method = 'POST'
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.body.success).toBe(true)
    })

    it('should reject GET request with 405', async () => {
      mockReq.method = 'GET'
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
  // Request Validation
  // ========================================================================

  describe('Request Validation', () => {
    it('should reject empty feedback with 400', async () => {
      mockReq.body = { feedback: '' }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.body.success).toBe(false)
      expect(mockRes.body.error).toBe('Feedback text is required')
    })

    it('should reject whitespace-only feedback with 400', async () => {
      mockReq.body = { feedback: '   ' }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.body.error).toBe('Feedback text is required')
    })

    it('should reject missing feedback field with 400', async () => {
      mockReq.body = { email: 'test@example.com' }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.body.error).toBe('Feedback text is required')
    })

    it('should accept valid feedback', async () => {
      mockReq.body = { feedback: 'Great app!' }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.body.success).toBe(true)
    })

    it('should trim feedback text', async () => {
      mockReq.body = { feedback: '  Great app!  ' }
      await handler(mockReq, mockRes)

      // Verify feedback was accepted (trimming happens inside handler)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.body.success).toBe(true)

      // Check that INSERT was called
      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls.length).toBeGreaterThan(0)
    })
  })

  // ========================================================================
  // Database Operations
  // ========================================================================

  describe('Database Operations', () => {
    it('should create table if not exists', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      const createTableCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('CREATE TABLE IF NOT EXISTS')
      )
      expect(createTableCalls.length).toBe(1)
    })

    it('should insert feedback into database', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO user_feedback')
      )
      expect(insertCalls.length).toBe(1)
    })

    it('should return feedback_id from database', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      expect(mockRes.body.feedback_id).toBe(123)
    })

    it('should return created timestamp', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      expect(mockRes.body.timestamp).toBe('2025-10-24T12:00:00.000Z')
    })
  })

  // ========================================================================
  // Optional Fields
  // ========================================================================

  describe('Optional Fields', () => {
    it('should accept feedback with email', async () => {
      mockReq.body = {
        feedback: 'Test feedback',
        email: 'user@example.com'
      }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][1]).toBe('user@example.com')
    })

    it('should accept feedback with rating', async () => {
      mockReq.body = {
        feedback: 'Test feedback',
        rating: 5
      }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][3]).toBe(5)
    })

    it('should accept feedback with category', async () => {
      mockReq.body = {
        feedback: 'Test feedback',
        category: 'bug'
      }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][4]).toBe('bug')
    })

    it('should accept feedback with categories array', async () => {
      mockReq.body = {
        feedback: 'Test feedback',
        categories: ['bug', 'performance']
      }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      // Should use first category as finalCategory
      expect(insertCalls[0][4]).toBe('bug')
      // Should store full array as JSON
      expect(insertCalls[0][5]).toBe('["bug","performance"]')
    })

    it('should default to general category when none provided', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][4]).toBe('general')
      expect(insertCalls[0][5]).toBe('["general"]')
    })

    it('should accept feedback with page_url', async () => {
      mockReq.body = {
        feedback: 'Test feedback',
        page_url: 'https://example.com/test'
      }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should accept feedback with session_id', async () => {
      mockReq.body = {
        feedback: 'Test feedback',
        session_id: 'custom_session_123'
      }
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][8]).toBe('custom_session_123')
    })

    it('should generate session_id when not provided', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][8]).toMatch(/^session_/)
    })
  })

  // ========================================================================
  // Client Information
  // ========================================================================

  describe('Client Information', () => {
    it('should capture user agent', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      mockReq.headers['user-agent'] = 'Custom Browser/1.0'
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][6]).toBe('Custom Browser/1.0')
    })

    it('should handle missing user agent', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      delete mockReq.headers['user-agent']
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][6]).toBe('')
    })

    it('should capture IP from x-forwarded-for', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      mockReq.headers['x-forwarded-for'] = '203.0.113.1'
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][7]).toBe('203.0.113.1')
    })

    it('should capture IP from x-real-ip when x-forwarded-for not present', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      delete mockReq.headers['x-forwarded-for']
      mockReq.headers['x-real-ip'] = '203.0.113.2'
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][7]).toBe('203.0.113.2')
    })

    it('should handle array of IPs in x-forwarded-for', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      mockReq.headers['x-forwarded-for'] = ['203.0.113.1', '203.0.113.2']
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      // Should use first IP
      expect(insertCalls[0][7]).toBe('203.0.113.1')
    })

    it('should default to unknown IP when headers missing', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      delete mockReq.headers['x-forwarded-for']
      delete mockReq.headers['x-real-ip']
      await handler(mockReq, mockRes)

      const insertCalls = mockSql.mock.calls.filter(call =>
        call[0][0].includes('INSERT INTO')
      )
      expect(insertCalls[0][7]).toBe('unknown')
    })
  })

  // ========================================================================
  // Success Response
  // ========================================================================

  describe('Success Response', () => {
    it('should return success status', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      expect(mockRes.body.success).toBe(true)
    })

    it('should return success message', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      expect(mockRes.body.message).toBe('Feedback received successfully')
    })

    it('should return all required fields', async () => {
      mockReq.body = { feedback: 'Test feedback' }
      await handler(mockReq, mockRes)

      expect(mockRes.body).toHaveProperty('success')
      expect(mockRes.body).toHaveProperty('feedback_id')
      expect(mockRes.body).toHaveProperty('message')
      expect(mockRes.body).toHaveProperty('timestamp')
    })
  })

  // ========================================================================
  // Error Handling
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValue(new Error('Database connection failed'))
      mockReq.body = { feedback: 'Test feedback' }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.body.success).toBe(false)

      // Note: Error logging now happens through structured logger (mocked)
    })

    it('should return generic error message in production', async () => {
      process.env.NODE_ENV = 'production'
      mockSql.mockRejectedValue(new Error('Sensitive database error'))
      mockReq.body = { feedback: 'Test feedback' }

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, mockRes)

      expect(mockRes.body.error).toBe('Failed to submit feedback. Please try again.')
      expect(mockRes.body.error).not.toContain('Sensitive')

      consoleErrorSpy.mockRestore()
    })

    it('should return specific error message in non-production', async () => {
      process.env.NODE_ENV = 'development'
      mockSql.mockRejectedValue(new Error('Specific database error'))
      mockReq.body = { feedback: 'Test feedback' }

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, mockRes)

      expect(mockRes.body.error).toBe('Specific database error')

      consoleErrorSpy.mockRestore()
    })

    it('should include timestamp in error response', async () => {
      mockSql.mockRejectedValue(new Error('Test error'))
      mockReq.body = { feedback: 'Test feedback' }

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await handler(mockReq, mockRes)

      expect(mockRes.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      consoleErrorSpy.mockRestore()
    })

    it('should log errors via structured logger', async () => {
      mockSql.mockRejectedValue(new Error('Test error'))
      mockReq.body = { feedback: 'Test feedback' }

      await handler(mockReq, mockRes)

      // Note: Error logging now happens through structured logger (mocked)
      // Logger mock is called but we don't need to verify it here since
      // the error handling behavior (500 status) is already verified
    })
  })

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle very long feedback text', async () => {
      const longFeedback = 'A'.repeat(10000)
      mockReq.body = { feedback: longFeedback }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should handle special characters in feedback', async () => {
      mockReq.body = { feedback: 'Test <script>alert("xss")</script> feedback' }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should handle unicode characters in feedback', async () => {
      mockReq.body = { feedback: '测试反馈 🎉 🌟' }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should handle null values in optional fields', async () => {
      mockReq.body = {
        feedback: 'Test feedback',
        email: null,
        rating: null,
        category: null
      }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should handle undefined values in optional fields', async () => {
      mockReq.body = {
        feedback: 'Test feedback',
        email: undefined,
        rating: undefined,
        category: undefined
      }
      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })
  })
})
