import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../api/feedback'
import { Pool } from 'pg'

// Mock pg module
vi.mock('pg', () => ({
  Pool: vi.fn(() => ({
    connect: vi.fn(),
    end: vi.fn(),
    query: vi.fn(),
  })),
}))

describe('Feedback API Endpoint Tests', () => {
  let mockPool: any
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Set up test environment
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test'
    process.env.NODE_ENV = 'test'

    // Create mock pool
    mockPool = {
      connect: vi.fn(),
      end: vi.fn(),
      query: vi.fn(),
    }

    vi.mocked(Pool).mockImplementation(() => mockPool)

    // Clear console mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('HTTP Method Handling', () => {
    it('should handle OPTIONS requests for CORS', async () => {
      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'OPTIONS',
      })

      try {

        await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res._getHeaders()).toHaveProperty('access-control-allow-origin', '*')
      expect(res._getHeaders()).toHaveProperty('access-control-allow-methods', 'POST, OPTIONS')
      expect(res._getHeaders()).toHaveProperty('access-control-allow-headers', 'Content-Type')
    })

    it('should reject non-POST requests', async () => {
      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toBe('Method not allowed')
    })
  })

  describe('Request Validation', () => {
    it('should reject requests with empty feedback', async () => {
      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: '',
          rating: 5,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toBe('Feedback text is required')
    })

    it('should reject requests with whitespace-only feedback', async () => {
      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: '   \n\t   ',
          rating: 5,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toBe('Feedback text is required')
    })

    it('should reject requests with missing feedback field', async () => {
      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          rating: 5,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toBe('Feedback text is required')
    })
  })

  describe('Successful Feedback Submission', () => {
    it('should successfully submit feedback with all fields', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 1, created_at: new Date('2024-01-01T00:00:00Z') }],
        }),
        release: vi.fn(),
      }

      mockPool.connect.mockResolvedValue(mockClient)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          email: 'test@example.com',
          feedback: 'Great app!',
          rating: 5,
          categories: ['feature', 'ui'],
          session_id: 'test-session',
          page_url: 'https://example.com/test',
        },
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.feedback_id).toBe(1)
      expect(data.message).toBe('Feedback received successfully')
      expect(data.debug).toHaveProperty('has_database_url', true)

      // Verify database query was called with correct parameters
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback'),
        [
          'test@example.com',
          'Great app!',
          5,
          JSON.stringify(['feature', 'ui']),
          'Mozilla/5.0',
          '192.168.1.1',
          'test-session',
          'https://example.com/test',
        ]
      )
    })

    it('should handle optional fields correctly', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 2, created_at: new Date('2024-01-01T00:00:00Z') }],
        }),
        release: vi.fn(),
      }

      mockPool.connect.mockResolvedValue(mockClient)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: 'Simple feedback',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)

      // Verify database query was called with null values for optional fields
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback'),
        [
          null, // email
          'Simple feedback',
          null, // rating
          null, // categories
          '', // user-agent (empty string)
          'unknown', // ip_address
          expect.stringMatching(/^session_\d+_[a-z0-9]+$/), // generated session_id
          null, // page_url
        ]
      )
    })
  })

  describe('Database Connection Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      const dbError = new Error('connect ECONNREFUSED')
      dbError.code = 'ECONNREFUSED'

      mockPool.connect.mockRejectedValue(dbError)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: 'Test feedback',
          rating: 4,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200) // Should still return success
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.feedback_id).toMatch(/^logged_\d+$/)
      expect(data.message).toBe('Feedback received successfully')
      expect(data.debug).toHaveProperty('database_error', 'connect ECONNREFUSED')
      expect(data.debug).toHaveProperty('database_code', 'ECONNREFUSED')
    })

    it('should handle authentication errors', async () => {
      const authError = new Error('password authentication failed')
      authError.code = '28P01'

      mockPool.connect.mockRejectedValue(authError)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: 'Test feedback',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.debug).toHaveProperty('database_error', 'password authentication failed')
      expect(data.debug).toHaveProperty('database_code', '28P01')
    })

    it('should handle SSL connection errors', async () => {
      const sslError = new Error('SSL connection has been closed unexpectedly')
      sslError.code = '08006'

      mockPool.connect.mockRejectedValue(sslError)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: 'Test feedback',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.debug).toHaveProperty('database_error', 'SSL connection has been closed unexpectedly')
      expect(data.debug).toHaveProperty('database_code', '08006')
    })
  })

  describe('Special Character Handling', () => {
    it('should handle feedback with special characters', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 3, created_at: new Date('2024-01-01T00:00:00Z') }],
        }),
        release: vi.fn(),
      }

      mockPool.connect.mockResolvedValue(mockClient)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {;

      } catch (error) {

        console.error('Operation failed:', error);

        // TODO: Add proper error handling

      }
          feedback: 'Great app! Special chars: @#$%^&*()_+{}[]|\\:";\'<>?,./`~',
          email: 'test+special@example.com',
        },
      })

      try {

        await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)

      // Verify special characters were preserved
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback'),
        expect.arrayContaining([
          'test+special@example.com',;

      } catch (error) {

        console.error('Operation failed:', error);

        // TODO: Add proper error handling

      }
          'Great app! Special chars: @#$%^&*()_+{}[]|\\:";\'<>?,./`~',
        ])
      )
    })

    it('should handle feedback with exclamation marks (known issue)', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 4, created_at: new Date('2024-01-01T00:00:00Z') }],
        }),
        release: vi.fn(),
      }

      mockPool.connect.mockResolvedValue(mockClient)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: 'This is amazing! Really great work!',
          rating: 5,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)

      // Verify exclamation marks were preserved
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback'),
        expect.arrayContaining([
          'This is amazing! Really great work!',
        ])
      )
    })
  })

  describe('Environment Variable Detection', () => {
    it('should detect and report environment variable status', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@ep-123.neon.tech/db'
      process.env.POSTGRES_URL = 'postgresql://user:pass@localhost:5432/db'

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: 'Test feedback',
        },
      })

      // Mock successful database operation
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 1, created_at: new Date() }],
        }),
        release: vi.fn(),
      }
      mockPool.connect.mockResolvedValue(mockClient)

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.debug).toHaveProperty('has_database_url', true)
      expect(data.debug).toHaveProperty('has_postgres_url', true)
      expect(data.debug).toHaveProperty('connection_string_start', 'postgresql://user:pa')
      expect(data.debug).toHaveProperty('environment', 'test')
    })

    it('should handle missing environment variables', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_URL

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: {
          feedback: 'Test feedback',
        },
      })

      // This should cause a connection error
      mockPool.connect.mockRejectedValue(new Error('Connection string undefined'))

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.debug).toHaveProperty('has_database_url', false)
      expect(data.debug).toHaveProperty('has_postgres_url', false)
      expect(data.debug).toHaveProperty('connection_string_start', 'not set')
    })
  })

  describe('IP Address Handling', () => {
    it('should handle single IP address', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 1, created_at: new Date() }],
        }),
        release: vi.fn(),
      }
      mockPool.connect.mockResolvedValue(mockClient)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: { feedback: 'Test feedback' },
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      await handler(req, res)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback'),
        expect.arrayContaining(['192.168.1.1'])
      )
    })

    it('should handle multiple IP addresses', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 1, created_at: new Date() }],
        }),
        release: vi.fn(),
      }
      mockPool.connect.mockResolvedValue(mockClient)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: { feedback: 'Test feedback' },
        headers: { 'x-forwarded-for': ['192.168.1.1', '10.0.0.1'] },
      })

      await handler(req, res)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback'),
        expect.arrayContaining(['192.168.1.1'])
      )
    })

    it('should fallback to x-real-ip when x-forwarded-for is not available', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 1, created_at: new Date() }],
        }),
        release: vi.fn(),
      }
      mockPool.connect.mockResolvedValue(mockClient)

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: { feedback: 'Test feedback' },
        headers: { 'x-real-ip': '192.168.1.1' },
      })

      await handler(req, res)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback'),
        expect.arrayContaining(['192.168.1.1'])
      )
    })
  })

  describe('Server Error Handling', () => {
    it('should handle unexpected server errors', async () => {
      // Mock a catastrophic error that happens before database connection
      const originalHandler = handler
      const errorHandler = vi.fn().mockRejectedValue(new Error('Unexpected server error'))

      const { req, res } = createMocks<VercelRequest, VercelResponse>({
        method: 'POST',
        body: { feedback: 'Test feedback' },
      })

      // Simulate an error by making the request body parsing fail
      Object.defineProperty(req, 'body', {
        get: () => {
          throw new Error('Request body parsing failed')
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to submit feedback. Please try again.')
    })
  })
})
