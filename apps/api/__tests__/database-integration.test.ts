import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Pool } from 'pg'

// Mock pg module
vi.mock('pg', () => ({
  Pool: vi.fn(() => ({
    connect: vi.fn(),
    end: vi.fn(),
    query: vi.fn(),
  })),
}))

describe('Database Integration Tests', () => {
  let mockPool: any
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Create mock pool
    mockPool = {
      connect: vi.fn(),
      end: vi.fn(),
      query: vi.fn(),
    }

    vi.mocked(Pool).mockImplementation(() => mockPool)
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('Environment Variable Validation', () => {
    it('should detect missing DATABASE_URL', () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_URL

      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
      expect(connectionString).toBeUndefined()
    })

    it('should prioritize DATABASE_URL over POSTGRES_URL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db1'
      process.env.POSTGRES_URL = 'postgresql://user:pass@localhost:5432/db2'

      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
      expect(connectionString).toBe('postgresql://user:pass@localhost:5432/db1')
    })

    it('should detect malformed connection strings', () => {
      const testCases = [
        'invalid-url',
        'postgresql://',
        'postgresql://user@',
        'postgresql://user@:5432',
        'postgresql://user@host:',
        'postgresql://user@host:5432/',
        'postgresql://user:@host:5432/db', // empty password
      ]

      testCases.forEach(invalidUrl => {
        process.env.DATABASE_URL = invalidUrl
        // Test that URL parsing would fail
        expect(() => new URL(invalidUrl)).toThrow()
      })
    })

    it('should validate Neon.tech connection strings', () => {
      const neonUrl = 'postgresql://user:pass@ep-123.neon.tech/neondb'
      process.env.DATABASE_URL = neonUrl

      const connectionString = process.env.DATABASE_URL
      expect(connectionString).toContain('neon.tech')
      expect(connectionString).toContain('postgresql://')

      // Should not throw when parsing
      expect(() => new URL(neonUrl)).not.toThrow()
    })

    it('should handle environment variables with special characters', () => {
      // Test password with special characters that caused issues
      const specialCharUrl = 'postgresql://user:p@ssw!rd@host:5432/db'
      process.env.DATABASE_URL = specialCharUrl

      const connectionString = process.env.DATABASE_URL
      expect(connectionString).toBe(specialCharUrl)
    })
  })

  describe('SSL Configuration Tests', () => {
    it('should enable SSL for Neon connections', () => {
      const neonUrl = 'postgresql://user:pass@ep-123.neon.tech/neondb'
      process.env.DATABASE_URL = neonUrl

      const pool = new Pool({
        connectionString: neonUrl,
        ssl: neonUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      })

      expect(Pool).toHaveBeenCalledWith({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false },
        max: undefined,
        idleTimeoutMillis: undefined,
        connectionTimeoutMillis: undefined,
      })
    })

    it('should disable SSL for local connections', () => {
      const localUrl = 'postgresql://user:pass@localhost:5432/db'
      process.env.DATABASE_URL = localUrl

      const pool = new Pool({
        connectionString: localUrl,
        ssl: localUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      })

      expect(Pool).toHaveBeenCalledWith({
        connectionString: localUrl,
        ssl: false,
        max: undefined,
        idleTimeoutMillis: undefined,
        connectionTimeoutMillis: undefined,
      })
    })
  })

  describe('Connection Pool Configuration', () => {
    it('should configure connection pool with proper settings', () => {
      const connectionString = 'postgresql://user:pass@host:5432/db'

      const pool = new Pool({
        connectionString,
        ssl: false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })

      expect(Pool).toHaveBeenCalledWith({
        connectionString,
        ssl: false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })
    })
  })

  describe('Database Connection Error Handling', () => {
    it('should handle connection timeout errors', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      }

      mockPool.connect.mockRejectedValue(new Error('connect ETIMEDOUT'))

      try {
        await mockPool.connect()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toBe('connect ETIMEDOUT')
      }
    })

    it('should handle authentication errors', async () => {
      const authError = new Error('password authentication failed')
      authError.code = '28P01'

      mockPool.connect.mockRejectedValue(authError)

      try {
        await mockPool.connect()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toBe('password authentication failed')
        expect(error.code).toBe('28P01')
      }
    })

    it('should handle database not found errors', async () => {
      const dbError = new Error('database "nonexistent" does not exist')
      dbError.code = '3D000'

      mockPool.connect.mockRejectedValue(dbError)

      try {
        await mockPool.connect()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toBe('database "nonexistent" does not exist')
        expect(error.code).toBe('3D000')
      }
    })

    it('should handle SSL connection errors', async () => {
      const sslError = new Error('SSL connection has been closed unexpectedly')
      sslError.code = '08006'

      mockPool.connect.mockRejectedValue(sslError)

      try {
        await mockPool.connect()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toBe('SSL connection has been closed unexpectedly')
        expect(error.code).toBe('08006')
      }
    })
  })

  describe('Query Execution Tests', () => {
    it('should handle successful query execution', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 1, created_at: new Date() }],
          rowCount: 1,
        }),
        release: vi.fn(),
      }

      mockPool.connect.mockResolvedValue(mockClient)

      const client = await mockPool.connect()
      const result = await client.query('SELECT 1 as id')

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].id).toBe(1)
    })

    it('should handle query syntax errors', async () => {
      const mockClient = {
        query: vi.fn().mockRejectedValue(new Error('syntax error at or near "SELEC"')),
        release: vi.fn(),
      }

      mockPool.connect.mockResolvedValue(mockClient)

      const client = await mockPool.connect()

      try {
        await client.query('SELEC 1')
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toBe('syntax error at or near "SELEC"')
      }
    })

    it('should handle table not found errors', async () => {
      const mockClient = {
        query: vi.fn().mockRejectedValue(new Error('relation "nonexistent_table" does not exist')),
        release: vi.fn(),
      }

      mockPool.connect.mockResolvedValue(mockClient)

      const client = await mockPool.connect()

      try {
        await client.query('SELECT * FROM nonexistent_table')
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toBe('relation "nonexistent_table" does not exist')
      }
    })
  })

  describe('Feedback Table Schema Validation', () => {
    it('should validate user_feedback table structure', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [
            { column_name: 'id', data_type: 'integer' },
            { column_name: 'email', data_type: 'character varying' },
            { column_name: 'feedback_text', data_type: 'text' },
            { column_name: 'rating', data_type: 'integer' },
            { column_name: 'categories', data_type: 'jsonb' },
            { column_name: 'user_agent', data_type: 'text' },
            { column_name: 'ip_address', data_type: 'character varying' },
            { column_name: 'session_id', data_type: 'character varying' },
            { column_name: 'page_url', data_type: 'text' },
            { column_name: 'created_at', data_type: 'timestamp with time zone' },
          ],
        }),
        release: vi.fn(),
      }

      mockPool.connect.mockResolvedValue(mockClient)

      const client = await mockPool.connect()
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user_feedback'
      `)

      const columns = result.rows.map(row => row.column_name)
      expect(columns).toContain('id')
      expect(columns).toContain('email')
      expect(columns).toContain('feedback_text')
      expect(columns).toContain('rating')
      expect(columns).toContain('categories')
      expect(columns).toContain('created_at')
    })
  })
})
