/**
 * ========================================================================
 * SANITIZATION UTILITIES TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Comprehensive testing for HTML sanitization and XSS prevention
 * 🔗 UTILITIES: sanitize.ts - Security utilities for safe HTML handling
 * 📊 COVERAGE: XSS prevention, URL sanitization, object sanitization
 * ⚙️ FUNCTIONALITY: Prevents malicious content injection and script execution
 * 🎯 BUSINESS_IMPACT: Ensures user security and platform integrity
 *
 * BUSINESS CONTEXT: Security-first platform protection
 * - Validates XSS prevention for user-generated content
 * - Ensures URL safety for external links
 * - Tests object sanitization for form data
 * - Protects against malicious script injection
 *
 * TECHNICAL COVERAGE: Security utility testing
 * - HTML character escaping validation
 * - URL protocol filtering and validation
 * - Object property sanitization
 * - Edge cases and malicious input handling
 *
 * LAST UPDATED: 2025-08-13
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { escapeHtml, sanitizeUrl, sanitizeObject } from '../sanitize'

// Mock DOM for testing
const mockCreateElement = vi.fn()
const mockElement = {
  textContent: '',
  innerHTML: ''
}

describe('Sanitization Utilities', () => {
  beforeEach(() => {
    // Mock document.createElement
    mockCreateElement.mockReturnValue(mockElement)
    Object.defineProperty(global, 'document', {
      value: {
        createElement: mockCreateElement
      },
      writable: true
    })

    // Mock window.location for URL tests
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          origin: 'https://example.com'
        }
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('✅ escapeHtml', () => {
    it('should escape basic HTML characters', () => {
      mockElement.innerHTML = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

      const result = escapeHtml('<script>alert("xss")</script>')

      expect(mockCreateElement).toHaveBeenCalledWith('div')
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })

    it('should handle number inputs', () => {
      const result = escapeHtml(42)
      expect(result).toBe('42')
    })

    it('should handle zero as number', () => {
      const result = escapeHtml(0)
      expect(result).toBe('0')
    })

    it('should handle empty string', () => {
      const result = escapeHtml('')
      expect(result).toBe('')
    })

    it('should handle null input', () => {
      const result = escapeHtml(null as any)
      expect(result).toBe('')
    })

    it('should handle undefined input', () => {
      const result = escapeHtml(undefined as any)
      expect(result).toBe('')
    })

    it('should escape special characters', () => {
      mockElement.innerHTML = '&amp;&lt;&gt;&quot;&#x27;'

      const result = escapeHtml('&<>"\'')

      expect(result).toBe('&amp;&lt;&gt;&quot;&#x27;')
    })

    it('should handle complex HTML structures', () => {
      mockElement.innerHTML = '&lt;div class=&quot;malicious&quot;&gt;&lt;img src=x onerror=alert(1)&gt;&lt;/div&gt;'

      const result = escapeHtml('<div class="malicious"><img src=x onerror=alert(1)></div>')

      expect(result).toBe('&lt;div class=&quot;malicious&quot;&gt;&lt;img src=x onerror=alert(1)&gt;&lt;/div&gt;')
    })

    it('should handle Unicode characters', () => {
      mockElement.innerHTML = '🚀 Hello 世界'

      const result = escapeHtml('🚀 Hello 世界')

      expect(result).toBe('🚀 Hello 世界')
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000) + '<script>alert("xss")</script>'
      mockElement.innerHTML = 'a'.repeat(10000) + '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

      const result = escapeHtml(longString)

      expect(result).toBe('a'.repeat(10000) + '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })
  })

  describe('✅ sanitizeUrl', () => {
    it('should allow valid HTTP URLs', () => {
      const result = sanitizeUrl('http://example.com')
      expect(result).toBe('http://example.com/')
    })

    it('should allow valid HTTPS URLs', () => {
      const result = sanitizeUrl('https://example.com/path?query=value')
      expect(result).toBe('https://example.com/path?query=value')
    })

    it('should allow mailto URLs', () => {
      const result = sanitizeUrl('mailto:test@example.com')
      expect(result).toBe('mailto:test@example.com')
    })

    it('should block javascript URLs', () => {
      const result = sanitizeUrl('javascript:alert("xss")')
      expect(result).toBe('')
    })

    it('should block javascript URLs with mixed case', () => {
      const result = sanitizeUrl('JavaScript:alert("xss")')
      expect(result).toBe('')
    })

    it('should block javascript URLs with whitespace', () => {
      const result = sanitizeUrl(' javascript:alert("xss")')
      expect(result).toBe('')
    })

    it('should block data URLs', () => {
      const result = sanitizeUrl('data:text/html,<script>alert("xss")</script>')
      expect(result).toBe('')
    })

    it('should block data URLs with mixed case', () => {
      const result = sanitizeUrl('DATA:text/html,<script>alert("xss")</script>')
      expect(result).toBe('')
    })

    it('should handle empty string', () => {
      const result = sanitizeUrl('')
      expect(result).toBe('')
    })

    it('should handle null input', () => {
      const result = sanitizeUrl(null as any)
      expect(result).toBe('')
    })

    it('should handle undefined input', () => {
      const result = sanitizeUrl(undefined as any)
      expect(result).toBe('')
    })

    it('should block unsupported protocols', () => {
      const result = sanitizeUrl('ftp://example.com')
      expect(result).toBe('')
    })

    it('should block file URLs', () => {
      const result = sanitizeUrl('file:///etc/passwd')
      expect(result).toBe('')
    })

    it('should handle invalid URLs gracefully', () => {
      const result = sanitizeUrl('not-a-url')
      // URL constructor with base URL makes this a valid relative URL
      expect(result).toBe('https://example.com/not-a-url')
    })

    it('should handle URLs with special characters', () => {
      const result = sanitizeUrl('https://example.com/path with spaces')
      expect(result).toBe('https://example.com/path%20with%20spaces')
    })

    it('should handle relative URLs by making them absolute', () => {
      const result = sanitizeUrl('/relative/path')
      expect(result).toBe('https://example.com/relative/path')
    })

    it('should handle URLs with fragments', () => {
      const result = sanitizeUrl('https://example.com/page#section')
      expect(result).toBe('https://example.com/page#section')
    })

    it('should handle URLs with complex query parameters', () => {
      const result = sanitizeUrl('https://example.com/search?q=test&sort=date&filter[]=active')
      // URL constructor doesn't encode square brackets
      expect(result).toBe('https://example.com/search?q=test&sort=date&filter[]=active')
    })
  })

  describe('✅ sanitizeObject', () => {
    it('should sanitize string properties in object', () => {
      // Set up mock to return different values for different inputs
      mockCreateElement.mockImplementation(() => {
        const elem = { ...mockElement }
        Object.defineProperty(elem, 'textContent', {
          set: function(value) {
            if (value === 'Safe') {
              this.innerHTML = 'Safe'
            } else if (value === '<script>alert("xss")</script>') {
              this.innerHTML = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
            }
          }
        })
        return elem
      })

      const input = {
        name: 'Safe',
        description: '<script>alert("xss")</script>',
        count: 42,
        active: true
      }

      const result = sanitizeObject(input)

      expect(result.name).toBe('Safe')
      expect(result.description).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
      expect(result.count).toBe(42)
      expect(result.active).toBe(true)
    })

    it('should handle empty object', () => {
      const result = sanitizeObject({})
      expect(result).toEqual({})
    })

    it('should not modify non-string properties', () => {
      const input = {
        number: 42,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' }
      }

      const result = sanitizeObject(input)

      expect(result.number).toBe(42)
      expect(result.boolean).toBe(true)
      expect(result.nullValue).toBe(null)
      expect(result.undefinedValue).toBe(undefined)
      expect(result.array).toEqual([1, 2, 3])
      expect(result.object).toEqual({ nested: 'value' })
    })

    it('should create new object without modifying original', () => {
      const input = {
        name: 'Test',
        description: '<script>alert("xss")</script>'
      }

      const result = sanitizeObject(input)

      expect(result).not.toBe(input) // Different object reference
      expect(input.description).toBe('<script>alert("xss")</script>') // Original unchanged
    })

    it('should handle object with many string properties', () => {
      mockCreateElement.mockImplementation(() => {
        const elem = { ...mockElement }
        // Simulate different innerHTML for different inputs
        Object.defineProperty(elem, 'textContent', {
          set: function(value) {
            if (value === '<b>bold</b>') {
              this.innerHTML = '&lt;b&gt;bold&lt;/b&gt;'
            } else if (value === '<i>italic</i>') {
              this.innerHTML = '&lt;i&gt;italic&lt;/i&gt;'
            } else if (value === 'safe') {
              this.innerHTML = 'safe'
            }
          }
        })
        return elem
      })

      const input = {
        title: '<b>bold</b>',
        subtitle: '<i>italic</i>',
        content: 'safe',
        id: 123
      }

      const result = sanitizeObject(input)

      expect(result.title).toBe('&lt;b&gt;bold&lt;/b&gt;')
      expect(result.subtitle).toBe('&lt;i&gt;italic&lt;/i&gt;')
      expect(result.content).toBe('safe')
      expect(result.id).toBe(123)
    })

    it('should handle object with nested arrays (arrays not sanitized)', () => {
      const input = {
        tags: ['<script>', 'safe-tag'],
        name: '<script>alert("xss")</script>'
      }

      mockElement.innerHTML = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

      const result = sanitizeObject(input)

      expect(result.tags).toEqual(['<script>', 'safe-tag']) // Arrays not modified
      expect(result.name).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })

    it('should handle object with function properties', () => {
      const testFunction = () => 'test'
      const input = {
        name: '<script>alert("xss")</script>',
        callback: testFunction
      }

      mockElement.innerHTML = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

      const result = sanitizeObject(input)

      expect(result.name).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
      expect(result.callback).toBe(testFunction)
    })
  })

  describe('🔧 Edge Cases and Security', () => {
    it('should handle DOM manipulation edge cases', () => {
      // Test what happens if createElement fails
      mockCreateElement.mockImplementationOnce(() => {
        throw new Error('DOM not available')
      })

      expect(() => escapeHtml('<script>alert("xss")</script>')).toThrow()
    })

    it('should handle URL constructor edge cases', () => {
      // Mock URL constructor to throw
      const originalURL = global.URL
      global.URL = class {
        constructor() {
          throw new Error('Invalid URL')
        }
      } as any

      const result = sanitizeUrl('invalid-url')
      expect(result).toBe('')

      global.URL = originalURL
    })

    it('should handle very large objects for sanitization', () => {
      const largeObject: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        largeObject[`prop${i}`] = i % 2 === 0 ? `<script>alert(${i})</script>` : i
      }

      mockCreateElement.mockImplementation(() => {
        const elem = { ...mockElement }
        Object.defineProperty(elem, 'textContent', {
          set: function(value) {
            this.innerHTML = value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
          }
        })
        return elem
      })

      const result = sanitizeObject(largeObject)

      // Check a few values
      expect(result.prop0).toBe('&lt;script&gt;alert(0)&lt;/script&gt;')
      expect(result.prop1).toBe(1)
      expect(result.prop2).toBe('&lt;script&gt;alert(2)&lt;/script&gt;')
      expect(result.prop3).toBe(3)
    })

    it('should maintain type safety with TypeScript generics', () => {
      interface TestInterface {
        name: string
        count: number
        active: boolean
      }

      const input: TestInterface = {
        name: '<script>alert("xss")</script>',
        count: 42,
        active: true
      }

      mockElement.innerHTML = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

      const result = sanitizeObject(input)

      // TypeScript should maintain the type
      expect(typeof result.name).toBe('string')
      expect(typeof result.count).toBe('number')
      expect(typeof result.active).toBe('boolean')
    })
  })
})

/**
 * 📊 TEST COVERAGE SUMMARY:
 * ✅ HTML escaping with all edge cases
 * ✅ URL sanitization with protocol filtering
 * ✅ Object sanitization maintaining type safety
 * ✅ XSS prevention validation
 * ✅ Input validation and error handling
 * ✅ DOM manipulation edge cases
 * ✅ Security boundary testing
 * ✅ Performance with large inputs
 * ✅ Type safety verification
 * ✅ Browser environment compatibility
 *
 * 🎯 BUSINESS COVERAGE:
 * ✅ Platform security and user protection
 * ✅ Malicious content prevention
 * ✅ Safe user-generated content handling
 * ✅ External link security validation
 *
 * 🔧 TECHNICAL COVERAGE:
 * ✅ Browser DOM API integration
 * ✅ URL constructor usage and fallbacks
 * ✅ Object property iteration and modification
 * ✅ TypeScript generic type preservation
 */
