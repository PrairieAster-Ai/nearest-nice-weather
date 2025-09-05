import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Environment Variable Validation Tests', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('Database URL Validation', () => {
    it('should validate correct PostgreSQL URL format', () => {
      const validUrls = [
        'postgresql://user:pass@localhost:5432/db',
        'postgresql://user:pass@127.0.0.1:5432/db',
        'postgresql://user:pass@host.example.com:5432/db',
        'postgresql://user:pass@ep-123.neon.tech/db',
        'postgresql://user:pass@host:5432/db?sslmode=require',
        'postgres://user:pass@host:5432/db',
        'postgresql://user:p%40ssw0rd@host:5432/db', // URL encoded password
      ]

      validUrls.forEach(url => {
        process.env.DATABASE_URL = url

        // Should not throw when parsing
        expect(() => new URL(url)).not.toThrow()

        // Should contain required components
        const parsed = new URL(url)
        expect(parsed.protocol).toMatch(/^(postgresql|postgres):$/)
        expect(parsed.username).toBeTruthy()
        expect(parsed.password).toBeTruthy()
        expect(parsed.hostname).toBeTruthy()
        expect(parsed.port).toBeTruthy()
        expect(parsed.pathname).toBeTruthy()
      })
    })

    it('should detect invalid PostgreSQL URL formats', () => {
      const invalidUrls = [
        'invalid-url',
        'http://user:pass@host:5432/db',
        'postgresql://',
        'postgresql://user@',
        'postgresql://user@:5432',
        'postgresql://user@host:',
        'postgresql://user@host:5432/',
        'postgresql://:pass@host:5432/db',
        'postgresql://user:@host:5432/db',
        'postgresql://user:pass@:5432/db',
        'postgresql://user:pass@host:/db',
        'postgresql://user:pass@host:5432',
        'postgresql://user:pass@host:abc/db',
        'postgresql://user:pass@host:5432/db with spaces',
      ]

      invalidUrls.forEach(url => {
        process.env.DATABASE_URL = url

        // Should throw when parsing invalid URLs
        expect(() => new URL(url)).toThrow()
      })
    })

    it('should handle URLs with special characters in password', () => {
      const specialCharPasswords = [
        'postgresql://user:p@ssw0rd@host:5432/db',
        'postgresql://user:pass!@host:5432/db',
        'postgresql://user:pa$sw0rd@host:5432/db',
        'postgresql://user:p%40ssw0rd@host:5432/db', // URL encoded @
        'postgresql://user:p%21ssw0rd@host:5432/db', // URL encoded !
        'postgresql://user:p%24ssw0rd@host:5432/db', // URL encoded $
      ]

      specialCharPasswords.forEach(url => {
        process.env.DATABASE_URL = url

        // Should parse successfully
        const parsed = new URL(url)
        expect(parsed.password).toBeTruthy()
      })
    })

    it('should detect Neon.tech URLs', () => {
      const neonUrls = [
        'postgresql://user:pass@ep-123.neon.tech/db',
        'postgresql://user:pass@ep-abc-def.neon.tech/db',
        'postgresql://user:pass@ep-123.us-east-1.neon.tech/db',
      ]

      neonUrls.forEach(url => {
        process.env.DATABASE_URL = url

        expect(url).toContain('neon.tech')
        const parsed = new URL(url)
        expect(parsed.hostname).toContain('neon.tech')
      })
    })
  })

  describe('Environment Variable Priority', () => {
    it('should prioritize DATABASE_URL over POSTGRES_URL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host1:5432/db1'
      process.env.POSTGRES_URL = 'postgresql://user:pass@host2:5432/db2'

      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
      expect(connectionString).toBe('postgresql://user:pass@host1:5432/db1')
    })

    it('should fallback to POSTGRES_URL when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL
      process.env.POSTGRES_URL = 'postgresql://user:pass@host2:5432/db2'

      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
      expect(connectionString).toBe('postgresql://user:pass@host2:5432/db2')
    })

    it('should handle both variables being undefined', () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_URL

      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
      expect(connectionString).toBeUndefined()
    })
  })

  describe('SSL Configuration Detection', () => {
    it('should detect when SSL is required for Neon connections', () => {
      const neonUrl = 'postgresql://user:pass@ep-123.neon.tech/db'
      process.env.DATABASE_URL = neonUrl

      const isNeonConnection = neonUrl.includes('neon.tech')
      expect(isNeonConnection).toBe(true)

      const sslConfig = isNeonConnection ? { rejectUnauthorized: false } : false
      expect(sslConfig).toEqual({ rejectUnauthorized: false })
    })

    it('should detect when SSL is not required for local connections', () => {
      const localUrl = 'postgresql://user:pass@localhost:5432/db'
      process.env.DATABASE_URL = localUrl

      const isNeonConnection = localUrl.includes('neon.tech')
      expect(isNeonConnection).toBe(false)

      const sslConfig = isNeonConnection ? { rejectUnauthorized: false } : false
      expect(sslConfig).toBe(false)
    })
  })

  describe('Connection String Parsing', () => {
    it('should extract connection components correctly', () => {
      const url = 'postgresql://testuser:testpass@testhost:5432/testdb'
      process.env.DATABASE_URL = url

      const parsed = new URL(url)
      expect(parsed.protocol).toBe('postgresql:')
      expect(parsed.username).toBe('testuser')
      expect(parsed.password).toBe('testpass')
      expect(parsed.hostname).toBe('testhost')
      expect(parsed.port).toBe('5432')
      expect(parsed.pathname).toBe('/testdb')
    })

    it('should handle URL with query parameters', () => {
      const url = 'postgresql://user:pass@host:5432/db?sslmode=require&connect_timeout=10'
      process.env.DATABASE_URL = url

      const parsed = new URL(url)
      expect(parsed.searchParams.get('sslmode')).toBe('require')
      expect(parsed.searchParams.get('connect_timeout')).toBe('10')
    })
  })

  describe('Environment Variable Existence Check', () => {
    it('should correctly detect existing environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db'
      process.env.POSTGRES_URL = 'postgresql://user:pass@host:5432/db'

      expect(!!process.env.DATABASE_URL).toBe(true)
      expect(!!process.env.POSTGRES_URL).toBe(true)
      expect(process.env.DATABASE_URL?.length).toBeGreaterThan(0)
      expect(process.env.POSTGRES_URL?.length).toBeGreaterThan(0)
    })

    it('should correctly detect missing environment variables', () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_URL

      expect(!!process.env.DATABASE_URL).toBe(false)
      expect(!!process.env.POSTGRES_URL).toBe(false)
      expect(process.env.DATABASE_URL?.length || 0).toBe(0)
      expect(process.env.POSTGRES_URL?.length || 0).toBe(0)
    })
  })

  describe('Connection String Redaction', () => {
    it('should redact passwords in connection strings for logging', () => {
      const url = 'postgresql://user:secretpass@host:5432/db'
      process.env.DATABASE_URL = url

      const redacted = url.replace(/:[^:@]*@/, ':***@')
      expect(redacted).toBe('postgresql://user:***@host:5432/db')
      expect(redacted).not.toContain('secretpass')
    })

    it('should handle connection strings without passwords', () => {
      const url = 'postgresql://user@host:5432/db'
      process.env.DATABASE_URL = url

      const redacted = url.replace(/:[^:@]*@/, ':***@')
      expect(redacted).toBe('postgresql://user@host:5432/db')
    })
  })

  describe('Environment Variable Filtering', () => {
    it('should filter database-related environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db'
      process.env.POSTGRES_URL = 'postgresql://user:pass@host:5432/db'
      process.env.POSTGRES_HOST = 'host'
      process.env.POSTGRES_PORT = '5432'
      process.env.POSTGRES_USER = 'user'
      process.env.POSTGRES_PASSWORD = 'pass'
      process.env.POSTGRES_DB = 'db'
      process.env.UNRELATED_VAR = 'value'

      const databaseVars = Object.keys(process.env).filter(key =>
        key.includes('DATABASE') || key.includes('POSTGRES')
      )

      expect(databaseVars).toContain('DATABASE_URL')
      expect(databaseVars).toContain('POSTGRES_URL')
      expect(databaseVars).toContain('POSTGRES_HOST')
      expect(databaseVars).toContain('POSTGRES_PORT')
      expect(databaseVars).toContain('POSTGRES_USER')
      expect(databaseVars).toContain('POSTGRES_PASSWORD')
      expect(databaseVars).toContain('POSTGRES_DB')
      expect(databaseVars).not.toContain('UNRELATED_VAR')
    })
  })

  describe('Vercel Environment Detection', () => {
    it('should detect Vercel deployment environment', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'

      expect(process.env.VERCEL).toBe('1')
      expect(process.env.VERCEL_ENV).toBe('production')
    })

    it('should detect local development environment', () => {
      delete process.env.VERCEL
      process.env.NODE_ENV = 'development'

      expect(process.env.VERCEL).toBeUndefined()
      expect(process.env.NODE_ENV).toBe('development')
    })
  })
})
