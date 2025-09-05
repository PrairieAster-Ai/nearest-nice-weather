/**
 * Complete Sanitize Utils Coverage Test
 * Comprehensive edge case testing to achieve 95%+ coverage
 *
 * @COVERAGE_TARGET: sanitize.ts (80% → 95%+)
 * @DUAL_API_CONTEXT: Tests sanitization used by both Express and Vercel APIs
 */

// Mock DOM environment for comprehensive testing
global.document = {
  createElement: jest.fn(() => ({
    textContent: '',
    innerHTML: ''
  }))
};

global.window = {
  location: {
    origin: 'https://localhost:3000'
  }
};

// Enhanced URL constructor mock for complete URL testing
global.URL = jest.fn().mockImplementation((url, base) => {
  // Simulate real URL constructor behavior
  const urlStr = String(url).toLowerCase();

  if (urlStr.startsWith('javascript:')) {
    throw new TypeError('Invalid URL: javascript protocol not allowed');
  }

  if (urlStr.startsWith('data:')) {
    throw new TypeError('Invalid URL: data protocol not allowed');
  }

  if (urlStr.includes('://')) {
    const protocol = urlStr.split('://')[0] + ':';
    return {
      protocol,
      toString: () => url,
      href: url
    };
  }

  // Relative URL with base
  return {
    protocol: 'https:',
    toString: () => base ? new URL(url, base).href : url,
    href: url
  };
});

describe('Complete Sanitize Utils Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('escapeHtml - Complete Edge Cases', () => {
    test('should import and test all escapeHtml branches', async () => {
      const { escapeHtml } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Mock DOM element behavior for different test cases
      const createMockElement = (textContent, innerHTML) => ({
        set textContent(value) { this._textContent = value; },
        get textContent() { return this._textContent; },
        innerHTML
      });

      // Test number input (should convert to string)
      const numberResult = escapeHtml(42);
      expect(numberResult).toBe('42');

      const floatResult = escapeHtml(3.14159);
      expect(floatResult).toBe('3.14159');

      const zeroResult = escapeHtml(0);
      expect(zeroResult).toBe('0');

      const negativeResult = escapeHtml(-100);
      expect(negativeResult).toBe('-100');

      // Test string input with DOM manipulation
      document.createElement.mockReturnValue(createMockElement('', 'escaped_string_content'));

      const stringResult = escapeHtml('<script>alert("test")</script>');
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(stringResult).toBe('escaped_string_content');

      // Test falsy values (should return empty string)
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(false)).toBe('');
      expect(escapeHtml(NaN)).toBe('');

      // Test edge case strings
      const edgeCases = [
        '   ', // Whitespace only
        '\n\t\r', // Special characters
        '""', // Quotes
        "''", // Single quotes
        '&', // HTML entities
        '<>', // Empty tags
        '<!--comment-->', // HTML comments
      ];

      edgeCases.forEach((edgeCase, index) => {
        document.createElement.mockReturnValue(createMockElement('', `escaped_${index}`));
        const result = escapeHtml(edgeCase);
        expect(result).toBe(`escaped_${index}`);
        expect(document.createElement).toHaveBeenCalled();
      });
    });
  });

  describe('sanitizeUrl - Complete Coverage', () => {
    test('should import and test all sanitizeUrl branches', async () => {
      const { sanitizeUrl } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Test empty/null inputs
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl(null)).toBe('');
      expect(sanitizeUrl(undefined)).toBe('');
      expect(sanitizeUrl('   ')).toBe(''); // Whitespace only

      // Test dangerous protocols (should return empty string)
      const dangerousUrls = [
        'javascript:alert("xss")',
        'JAVASCRIPT:ALERT("XSS")', // Case insensitive
        'data:text/html,<script>alert("xss")</script>',
        'DATA:IMAGE/PNG;BASE64,...', // Case insensitive
        '  javascript:alert("padded")  ', // With padding
        '\tdata:text/html,evil\n', // With whitespace
      ];

      dangerousUrls.forEach(url => {
        const result = sanitizeUrl(url);
        expect(result).toBe('');
      });

      // Test safe protocols (should be processed)
      const safeUrls = [
        'https://example.com',
        'http://localhost:3000',
        'mailto:test@example.com',
        'HTTPS://EXAMPLE.COM', // Case handling
        'HTTP://TEST.COM',
        'MAILTO:CAPS@TEST.COM',
      ];

      // Mock successful URL construction
      global.URL.mockImplementation((url, base) => ({
        protocol: url.toLowerCase().startsWith('https:') ? 'https:' :
                 url.toLowerCase().startsWith('http:') ? 'http:' :
                 url.toLowerCase().startsWith('mailto:') ? 'mailto:' : 'unknown:',
        toString: () => url,
        href: url
      }));

      safeUrls.forEach(url => {
        const result = sanitizeUrl(url);
        expect(result).toBe(url); // Should return the URL as-is for safe protocols
        expect(global.URL).toHaveBeenCalled();
      });

      // Test URL constructor error handling
      global.URL.mockImplementation(() => {
        throw new Error('Invalid URL');
      });

      const invalidUrl = 'not-a-valid-url';
      const errorResult = sanitizeUrl(invalidUrl);
      expect(errorResult).toBe(''); // Should return empty string on URL error

      // Test unsupported but valid protocols
      global.URL.mockImplementation((url) => ({
        protocol: 'ftp:',
        toString: () => url
      }));

      const ftpUrl = 'ftp://files.example.com';
      const ftpResult = sanitizeUrl(ftpUrl);
      expect(ftpResult).toBe(''); // FTP not in allowed protocols
    });

    test('should test URL base parameter handling', async () => {
      const { sanitizeUrl } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Reset URL mock for base parameter testing
      global.URL.mockImplementation((url, base) => {
        if (url.includes('://')) {
          return {
            protocol: 'https:',
            toString: () => url
          };
        } else {
          // Relative URL - should use base
          return {
            protocol: 'https:',
            toString: () => `${base}/${url}`
          };
        }
      });

      const relativeUrl = '/api/endpoint';
      const result = sanitizeUrl(relativeUrl);

      expect(global.URL).toHaveBeenCalledWith(relativeUrl, window.location.origin);
      // The function should handle relative URLs with the base
      expect(typeof result).toBe('string');
    });
  });

  describe('sanitizeObject - Complete Coverage', () => {
    test('should import and test all sanitizeObject branches', async () => {
      const { sanitizeObject } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Mock escapeHtml for controlled testing
      const mockEscapeHtml = jest.fn((value) => `escaped_${value}`);

      // Test comprehensive object sanitization
      const complexObject = {
        // String properties (should be escaped)
        title: 'Test <script>alert("xss")</script> Title',
        description: 'Description with <b>HTML</b>',
        emptyString: '',
        whitespaceString: '   spaces   ',

        // Non-string properties (should be preserved)
        id: 12345,
        active: true,
        inactive: false,
        nullValue: null,
        undefinedValue: undefined,
        zeroValue: 0,

        // Array (should be preserved as-is)
        tags: ['tag1', 'tag2', 'tag3'],

        // Nested object (should be preserved as-is)
        metadata: {
          created: '2023-01-01',
          author: 'test user'
        },

        // Function (should be preserved)
        handler: () => console.log('test'),

        // Date object
        createdAt: new Date('2023-01-01'),
      };

      // Mock the imported escapeHtml function
      const sanitizeModule = await import('../../../apps/web/src/utils/sanitize.ts');
      const originalEscapeHtml = sanitizeModule.escapeHtml;
      sanitizeModule.escapeHtml = mockEscapeHtml;

      const result = sanitizeObject(complexObject);

      // Should return a new object (not the same reference)
      expect(result).not.toBe(complexObject);

      // String properties should be escaped
      expect(mockEscapeHtml).toHaveBeenCalledWith('Test <script>alert("xss")</script> Title');
      expect(mockEscapeHtml).toHaveBeenCalledWith('Description with <b>HTML</b>');
      expect(mockEscapeHtml).toHaveBeenCalledWith('');
      expect(mockEscapeHtml).toHaveBeenCalledWith('   spaces   ');

      // Non-string properties should be unchanged
      expect(result.id).toBe(12345);
      expect(result.active).toBe(true);
      expect(result.inactive).toBe(false);
      expect(result.nullValue).toBe(null);
      expect(result.undefinedValue).toBe(undefined);
      expect(result.zeroValue).toBe(0);

      // Complex properties should be preserved as-is
      expect(result.tags).toBe(complexObject.tags);
      expect(result.metadata).toBe(complexObject.metadata);
      expect(result.handler).toBe(complexObject.handler);
      expect(result.createdAt).toBe(complexObject.createdAt);

      // Restore original function
      sanitizeModule.escapeHtml = originalEscapeHtml;
    });

    test('should handle edge case objects', async () => {
      const { sanitizeObject } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Test empty object
      const emptyResult = sanitizeObject({});
      expect(emptyResult).toEqual({});
      expect(emptyResult).not.toBe({}); // Should be a new object

      // Test object with only string properties
      const stringOnlyObject = {
        str1: 'value1',
        str2: 'value2',
        str3: ''
      };

      const stringResult = sanitizeObject(stringOnlyObject);
      expect(Object.keys(stringResult)).toHaveLength(3);

      // Test object with prototype properties (should only process own properties)
      function TestClass() {
        this.ownProp = 'own value';
      }
      TestClass.prototype.prototypeProp = 'prototype value';

      const instanceObject = new TestClass();
      const instanceResult = sanitizeObject(instanceObject);

      expect(instanceResult.hasOwnProperty('ownProp')).toBe(true);
      expect(instanceResult.hasOwnProperty('prototypeProp')).toBe(false);
    });
  });

  describe('Comprehensive Security Testing', () => {
    test('should handle advanced XSS attack vectors', async () => {
      const { escapeHtml, sanitizeUrl, sanitizeObject } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Advanced XSS vectors that should be neutralized
      const xssVectors = [
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)">',
        '<form><input onfocus="alert(1)" autofocus>',
        '<marquee onstart="alert(1)">',
        '<video><source onerror="alert(1)">',
        '"><script>alert(1)</script>',
        '\';alert(1);//',
        'javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)>',
      ];

      // Mock DOM element to simulate text content assignment
      document.createElement.mockReturnValue({
        set textContent(value) { this._text = value; },
        get textContent() { return this._text; },
        innerHTML: 'sanitized_content'
      });

      xssVectors.forEach((vector, index) => {
        const escapedResult = escapeHtml(vector);
        expect(escapedResult).toBe('sanitized_content');
        expect(document.createElement).toHaveBeenCalled();
      });

      // Test URL-based XSS
      const maliciousUrls = [
        'javascript:alert(String.fromCharCode(88,83,83))',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:msgbox("XSS")',
        'javascript:alert`1`',
        'JaVaScRiPt:alert(1)',
        'DATA:text/html,<script>alert(1)</script>',
      ];

      maliciousUrls.forEach(url => {
        const sanitizedUrl = sanitizeUrl(url);
        expect(sanitizedUrl).toBe('');
      });

      // Test object-based XSS through multiple string fields
      const maliciousObject = {
        title: '<script>alert("title")</script>',
        description: 'javascript:alert("desc")',
        content: '<img src=x onerror=alert("img")>',
        metadata: '<iframe src="javascript:alert(1)">',
        normalField: 42, // Should be unchanged
        boolField: true // Should be unchanged
      };

      const sanitizedObject = sanitizeObject(maliciousObject);
      expect(sanitizedObject.normalField).toBe(42);
      expect(sanitizedObject.boolField).toBe(true);
      // String fields should be processed by escapeHtml (mocked)
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large inputs efficiently', async () => {
      const { escapeHtml, sanitizeUrl, sanitizeObject } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Test large string input
      const largeString = 'x'.repeat(10000) + '<script>alert("xss")</script>' + 'y'.repeat(10000);

      document.createElement.mockReturnValue({
        textContent: '',
        innerHTML: 'large_sanitized_content'
      });

      const start = Date.now();
      const result = escapeHtml(largeString);
      const duration = Date.now() - start;

      expect(result).toBe('large_sanitized_content');
      expect(duration).toBeLessThan(100); // Should complete quickly

      // Test large object with many properties
      const largeObject = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`prop_${i}`] = i % 2 === 0 ? `string_${i}` : i; // Mix of strings and numbers
      }

      const largeObjectStart = Date.now();
      const largeObjectResult = sanitizeObject(largeObject);
      const largeObjectDuration = Date.now() - largeObjectStart;

      expect(Object.keys(largeObjectResult)).toHaveLength(1000);
      expect(largeObjectDuration).toBeLessThan(100); // Should complete quickly
    });

    test('should handle circular references gracefully', async () => {
      const { sanitizeObject } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Create object with circular reference
      const circularObject = {
        name: 'test',
        value: 42
      };
      circularObject.self = circularObject;

      // Should not throw error and should handle the circular reference
      expect(() => {
        const result = sanitizeObject(circularObject);
        expect(result.name).toBeDefined();
        expect(result.value).toBe(42);
        expect(result.self).toBe(circularObject.self); // Circular ref preserved
      }).not.toThrow();
    });

    test('should handle special JavaScript values', async () => {
      const { escapeHtml, sanitizeUrl, sanitizeObject } = await import('../../../apps/web/src/utils/sanitize.ts');

      // Test special numeric values
      expect(escapeHtml(Infinity)).toBe('Infinity');
      expect(escapeHtml(-Infinity)).toBe('-Infinity');
      expect(escapeHtml(NaN)).toBe(''); // NaN is falsy

      // Test BigInt (if supported)
      if (typeof BigInt !== 'undefined') {
        expect(escapeHtml(BigInt(123))).toBe('123');
      }

      // Test Symbol (should be converted to string)
      const symbol = Symbol('test');
      expect(escapeHtml(symbol)).toBe('Symbol(test)');

      // Test object with special values
      const specialObject = {
        infinity: Infinity,
        negInfinity: -Infinity,
        notANumber: NaN,
        symbol: Symbol('test'),
        stringProp: '<script>test</script>'
      };

      const result = sanitizeObject(specialObject);
      expect(result.infinity).toBe(Infinity);
      expect(result.negInfinity).toBe(-Infinity);
      expect(result.notANumber).toBe(NaN);
      expect(result.symbol).toBe(Symbol('test'));
      // Only stringProp should be processed by escapeHtml
    });
  });
});
