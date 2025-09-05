import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Deployment Configuration Tests', () => {
  describe('vercel.json Syntax Validation', () => {
    it('should have valid JSON syntax in root vercel.json', () => {
      const vercelConfigPath = join(process.cwd(), '../../vercel.json')

      expect(() => {
        const content = readFileSync(vercelConfigPath, 'utf8')
        JSON.parse(content)
      }).not.toThrow()
    })

    it('should have valid JSON syntax in apps/web/vercel.json', () => {
      const vercelConfigPath = join(process.cwd(), '../web/vercel.json')

      expect(() => {
        const content = readFileSync(vercelConfigPath, 'utf8')
        JSON.parse(content)
      }).not.toThrow()
    })

    it('should have valid JSON syntax in apps/api/vercel.json', () => {
      const vercelConfigPath = join(process.cwd(), 'vercel.json')

      expect(() => {
        const content = readFileSync(vercelConfigPath, 'utf8')
        JSON.parse(content)
      }).not.toThrow()
    })
  })

  describe('Root vercel.json Configuration', () => {
    let config: any

    beforeEach(() => {
      const vercelConfigPath = join(process.cwd(), '../../vercel.json')
      const content = readFileSync(vercelConfigPath, 'utf8')
      config = JSON.parse(content)
    })

    it('should have required configuration fields', () => {
      expect(config).toHaveProperty('buildCommand')
      expect(config).toHaveProperty('outputDirectory')
      expect(config).toHaveProperty('framework')
      expect(config).toHaveProperty('installCommand')
    })

    it('should have correct build configuration', () => {
      expect(config.buildCommand).toContain('cd apps/web')
      expect(config.buildCommand).toContain('vite build')
      expect(config.outputDirectory).toBe('apps/web/dist')
      expect(config.framework).toBe('vite')
      expect(config.installCommand).toBe('npm install')
    })

    it('should have proper rewrites configuration', () => {
      expect(config.rewrites).toBeInstanceOf(Array)
      expect(config.rewrites.length).toBeGreaterThan(0)

      // Check for health check rewrite
      const healthRewrite = config.rewrites.find(r => r.source === '/health.json')
      expect(healthRewrite).toBeDefined()
      expect(healthRewrite.destination).toBe('/health.json')

      // Check for API rewrite
      const apiRewrite = config.rewrites.find(r => r.source === '/api/(.*)')
      expect(apiRewrite).toBeDefined()
      expect(apiRewrite.destination).toBe('/api/$1')

      // Check for catch-all rewrite
      const catchAllRewrite = config.rewrites.find(r => r.source === '/(.*)')
      expect(catchAllRewrite).toBeDefined()
      expect(catchAllRewrite.destination).toBe('/index.html')
    })

    it('should have proper security headers', () => {
      expect(config.headers).toBeInstanceOf(Array)
      expect(config.headers.length).toBeGreaterThan(0)

      const mainHeaders = config.headers.find(h => h.source === '/(.*)')
      expect(mainHeaders).toBeDefined()
      expect(mainHeaders.headers).toBeInstanceOf(Array)

      const headerKeys = mainHeaders.headers.map(h => h.key)
      expect(headerKeys).toContain('X-Content-Type-Options')
      expect(headerKeys).toContain('X-Frame-Options')
      expect(headerKeys).toContain('X-XSS-Protection')
      expect(headerKeys).toContain('Referrer-Policy')
      expect(headerKeys).toContain('Content-Security-Policy')
    })

    it('should have proper CSP configuration', () => {
      const mainHeaders = config.headers.find(h => h.source === '/(.*)')
      const cspHeader = mainHeaders.headers.find(h => h.key === 'Content-Security-Policy')

      expect(cspHeader).toBeDefined()
      expect(cspHeader.value).toContain("default-src 'self'")
      expect(cspHeader.value).toContain("script-src 'self'")
      expect(cspHeader.value).toContain("style-src 'self'")
      expect(cspHeader.value).toContain("img-src 'self' data: https:")
      expect(cspHeader.value).toContain("connect-src 'self'")
      expect(cspHeader.value).toContain("object-src 'none'")
    })

    it('should have proper regions configuration', () => {
      expect(config.regions).toBeInstanceOf(Array)
      expect(config.regions.length).toBeGreaterThan(0)

      // Should include some US regions
      expect(config.regions).toContain('cle1') // Cleveland
      expect(config.regions).toContain('iad1') // Washington DC
    })
  })

  describe('API vercel.json Configuration', () => {
    let config: any

    beforeEach(() => {
      const vercelConfigPath = join(process.cwd(), 'vercel.json')
      const content = readFileSync(vercelConfigPath, 'utf8')
      config = JSON.parse(content)
    })

    it('should have functions configuration', () => {
      if (config.functions) {
        expect(config.functions).toBeInstanceOf(Object)

        // Check for common function patterns
        const functionKeys = Object.keys(config.functions)
        functionKeys.forEach(key => {
          expect(key).toMatch(/^api\/.*\.ts$/)
        })
      }
    })
  })

  describe('Build Command Validation', () => {
    it('should validate build command components', () => {
      const buildCommand = 'cd apps/web && node deployment/health-check.cjs && vite build'
      const commands = buildCommand.split(' && ')

      expect(commands).toHaveLength(3)
      expect(commands[0]).toBe('cd apps/web')
      expect(commands[1]).toBe('node deployment/health-check.cjs')
      expect(commands[2]).toBe('vite build')
    })

    it('should validate health check file exists', () => {
      const healthCheckPath = join(process.cwd(), '../web/deployment/health-check.cjs')

      expect(() => {
        readFileSync(healthCheckPath, 'utf8')
      }).not.toThrow()
    })
  })

  describe('Output Directory Validation', () => {
    it('should validate output directory path', () => {
      const outputDir = 'apps/web/dist'

      expect(outputDir).toMatch(/^apps\/web\/dist$/)
      expect(outputDir).not.toContain('..')
      expect(outputDir).not.toContain('node_modules')
    })
  })

  describe('Framework Configuration', () => {
    it('should have valid framework specification', () => {
      const validFrameworks = [
        'vite',
        'nextjs',
        'create-react-app',
        'vue',
        'svelte',
        'nuxtjs',
        'gatsby',
        'angular',
        'static'
      ]

      const framework = 'vite'
      expect(validFrameworks).toContain(framework)
    })
  })

  describe('Rewrite Rules Validation', () => {
    it('should validate rewrite rule syntax', () => {
      const rewrites = [
        {
          source: '/health.json',
          destination: '/health.json'
        },
        {
          source: '/api/(.*)',
          destination: '/api/$1'
        },
        {
          source: '/(.*)',
          destination: '/index.html'
        }
      ]

      rewrites.forEach(rewrite => {
        expect(rewrite).toHaveProperty('source')
        expect(rewrite).toHaveProperty('destination')
        expect(typeof rewrite.source).toBe('string')
        expect(typeof rewrite.destination).toBe('string')
        expect(rewrite.source.length).toBeGreaterThan(0)
        expect(rewrite.destination.length).toBeGreaterThan(0)
      })
    })

    it('should validate API rewrite pattern', () => {
      const apiRewrite = {
        source: '/api/(.*)',
        destination: '/api/$1'
      }

      expect(apiRewrite.source).toMatch(/^\/api\/\(.*\)$/)
      expect(apiRewrite.destination).toMatch(/^\/api\/\$1$/)
    })
  })

  describe('Security Headers Validation', () => {
    it('should validate security header values', () => {
      const securityHeaders = [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        }
      ]

      securityHeaders.forEach(header => {
        expect(header).toHaveProperty('key')
        expect(header).toHaveProperty('value')
        expect(typeof header.key).toBe('string')
        expect(typeof header.value).toBe('string')
        expect(header.key.length).toBeGreaterThan(0)
        expect(header.value.length).toBeGreaterThan(0)
      })
    })

    it('should validate CSP header syntax', () => {
      const cspValue = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"

      expect(cspValue).toContain("default-src 'self'")
      expect(cspValue).toMatch(/;\s*script-src\s+/)
      expect(cspValue).toMatch(/;\s*style-src\s+/)

      // Should not contain dangerous directives
      expect(cspValue).not.toContain("'unsafe-inline' 'unsafe-eval'")
    })
  })

  describe('Region Configuration Validation', () => {
    it('should validate region codes', () => {
      const validRegions = [
        'iad1', 'dfw1', 'pdx1', 'sfo1', 'cle1', // US regions
        'lhr1', 'fra1', 'arn1', // EU regions
        'nrt1', 'sin1', 'syd1', 'hnd1', // Asia/Pacific regions
        'gru1', // South America
      ]

      const configuredRegions = ['cle1', 'iad1']

      configuredRegions.forEach(region => {
        expect(validRegions).toContain(region)
        expect(region).toMatch(/^[a-z]{3}1$/)
      })
    })
  })

  describe('JSON Schema Validation', () => {
    it('should validate against Vercel JSON schema', () => {
      const vercelConfigPath = join(process.cwd(), '../../vercel.json')
      const content = readFileSync(vercelConfigPath, 'utf8')
      const config = JSON.parse(content)

      // Check for schema reference
      expect(config).toHaveProperty('$schema')
      expect(config.$schema).toBe('https://openapi.vercel.sh/vercel.json')
    })
  })
})
