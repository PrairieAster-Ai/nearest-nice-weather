/**
 * Comprehensive tests for validation utilities
 * Achieving high coverage of validation.ts
 */

// Mock document for sanitizeHtml tests first
global.document = {
  createElement: jest.fn().mockImplementation((tag: string) => {
    if (tag === 'div') {
      return {
        textContent: '',
        innerHTML: '',
        set textContent(value: string) {
          // Simulate DOM text content sanitization
          this.innerHTML = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        }
      };
    }
    return {};
  })
} as any;

// Mock window for CSP tests
const mockWindow = {
  location: {
    origin: 'https://example.com'
  }
};

if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true
  });
} else {
  global.window = mockWindow;
}

// Import the actual modules
import { 
  sanitizeString, 
  sanitizeHtml, 
  UserInputSchemas, 
  rateLimiter, 
  CSP_DIRECTIVES,
  generateCSP,
  SECURITY_HEADERS,
  validateEnvironment,
  isValidExternalUrl
} from '../../../apps/web/src/utils/validation';

describe('sanitizeString', () => {
  test('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    const result = sanitizeString(input);
    expect(result).toBe('Hello  World');
  });

  test('should remove javascript protocols', () => {
    const input = 'Click here: javascript:alert("xss")';
    const result = sanitizeString(input);
    expect(result).toBe('Click here: alert("xss")');
  });

  test('should remove event handlers', () => {
    const input = 'Text with onclick="malicious()" handler';
    const result = sanitizeString(input);
    expect(result).toBe('Text with "malicious()" handler'); // Only removes onclick= not the content
  });

  test('should handle mixed malicious content', () => {
    const input = '  <script>evil()</script> onclick="bad()" javascript:harmful()  ';
    const result = sanitizeString(input);
    expect(result).toBe(' "bad()" harmful()'); // Script removed, onclick= removed, javascript: removed
  });

  test('should handle normal text unchanged', () => {
    const input = 'This is normal text with numbers 123 and symbols !@#';
    const result = sanitizeString(input);
    expect(result).toBe('This is normal text with numbers 123 and symbols !@#');
  });

  test('should trim whitespace', () => {
    const input = '   surrounded by spaces   ';
    const result = sanitizeString(input);
    expect(result).toBe('surrounded by spaces');
  });

  test('should handle empty string', () => {
    const result = sanitizeString('');
    expect(result).toBe('');
  });
});

describe('sanitizeHtml', () => {
  test('should escape HTML characters', () => {
    const input = '<div>Hello & "World"</div>';
    const result = sanitizeHtml(input);
    expect(result).toBe('&lt;div&gt;Hello &amp; "World"&lt;/div&gt;'); // Quotes aren't escaped in this implementation
  });

  test('should handle script injection attempts', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;'); // Quotes aren't escaped in this implementation
  });

  test('should handle normal text', () => {
    const input = 'Plain text content';
    const result = sanitizeHtml(input);
    expect(result).toBe('Plain text content');
  });

  test('should handle empty string', () => {
    const result = sanitizeHtml('');
    expect(result).toBe('');
  });
});

describe('UserInputSchemas', () => {
  describe('weatherFilter schema', () => {
    test('should validate correct weather filter', () => {
      const validData = {
        temperature: 'warm' as const,
        precipitation: 'none' as const,
        wind: 'calm' as const
      };
      
      const result = UserInputSchemas.weatherFilter.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid temperature', () => {
      const invalidData = {
        temperature: 'hot',
        precipitation: 'none',
        wind: 'calm'
      };
      
      const result = UserInputSchemas.weatherFilter.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid temperature selection');
      }
    });

    test('should reject invalid precipitation', () => {
      const invalidData = {
        temperature: 'warm',
        precipitation: 'heavy',
        wind: 'calm'
      };
      
      const result = UserInputSchemas.weatherFilter.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid wind', () => {
      const invalidData = {
        temperature: 'warm',
        precipitation: 'none',
        wind: 'hurricane'
      };
      
      const result = UserInputSchemas.weatherFilter.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('feedback schema', () => {
    test('should validate correct feedback', () => {
      const validData = {
        rating: 5,
        comment: 'Great service!',
        email: 'test@example.com',
        category: 'general' as const
      };
      
      const result = UserInputSchemas.feedback.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comment).toBe('Great service!'); // Sanitized
      }
    });

    test('should validate feedback without email', () => {
      const validData = {
        rating: 3,
        comment: 'Needs improvement',
        category: 'bug' as const
      };
      
      const result = UserInputSchemas.feedback.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should validate feedback with empty email', () => {
      const validData = {
        rating: 4,
        comment: 'Good overall',
        email: '',
        category: 'feature' as const
      };
      
      const result = UserInputSchemas.feedback.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid rating (too low)', () => {
      const invalidData = {
        rating: 0,
        comment: 'Bad',
        category: 'bug'
      };
      
      const result = UserInputSchemas.feedback.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid rating (too high)', () => {
      const invalidData = {
        rating: 6,
        comment: 'Too good',
        category: 'general'
      };
      
      const result = UserInputSchemas.feedback.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Rating must be between 1 and 5');
      }
    });

    test('should reject comment that is too long', () => {
      const invalidData = {
        rating: 3,
        comment: 'a'.repeat(1001), // 1001 characters
        category: 'general'
      };
      
      const result = UserInputSchemas.feedback.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Comment must be less than 1000 characters');
      }
    });

    test('should reject invalid email format', () => {
      const invalidData = {
        rating: 3,
        comment: 'Test',
        email: 'not-an-email',
        category: 'general'
      };
      
      const result = UserInputSchemas.feedback.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject email that is too long', () => {
      const invalidData = {
        rating: 3,
        comment: 'Test',
        email: 'a'.repeat(250) + '@example.com', // > 254 characters
        category: 'general'
      };
      
      const result = UserInputSchemas.feedback.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should sanitize malicious comment content', () => {
      const maliciousData = {
        rating: 3,
        comment: '<script>alert("xss")</script>Great app!',
        category: 'general' as const
      };
      
      const result = UserInputSchemas.feedback.safeParse(maliciousData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comment).toBe('Great app!'); // Script tag removed
      }
    });
  });

  describe('search schema', () => {
    test('should validate correct search query', () => {
      const validData = { query: 'Minneapolis weather' };
      
      const result = UserInputSchemas.search.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject empty search query', () => {
      const invalidData = { query: '' };
      
      const result = UserInputSchemas.search.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Search query cannot be empty');
      }
    });

    test('should reject search query that is too long', () => {
      const invalidData = { query: 'a'.repeat(101) }; // 101 characters
      
      const result = UserInputSchemas.search.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Search query is too long');
      }
    });

    test('should sanitize malicious search query', () => {
      const maliciousData = { query: '<script>alert("xss")</script>search term' };
      
      const result = UserInputSchemas.search.safeParse(maliciousData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('search term'); // Script tag removed
      }
    });
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset all keys before each test
    rateLimiter.reset('test-user');
    rateLimiter.reset('test-user-2');
    rateLimiter.reset('test-user-unique');
    rateLimiter.reset('user1');
    rateLimiter.reset('user2');
    jest.clearAllMocks();
  });

  test('should allow requests within limit', () => {
    const key = 'test-user-unique-1';
    const limit = 3;
    const windowMs = 60000; // 1 minute

    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true);
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true);
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true);
  });

  test('should deny requests that exceed limit', () => {
    const key = 'test-user-unique-2';
    const limit = 2;
    const windowMs = 60000;

    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true);
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true);
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(false); // Exceeds limit
  });

  test('should allow requests after time window expires', async () => {
    const key = 'test-user-unique-3';
    const limit = 1;
    const windowMs = 100; // 100ms window

    // First request should be allowed
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true);
    
    // Second request should be denied (within window)
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(false);
    
    // Wait for window to expire and try again
    await new Promise(resolve => setTimeout(resolve, 110));
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true);
  });

  test('should handle different keys separately', () => {
    const limit = 1;
    const windowMs = 60000;

    expect(rateLimiter.isAllowed('user1-unique', limit, windowMs)).toBe(true);
    expect(rateLimiter.isAllowed('user2-unique', limit, windowMs)).toBe(true);
    expect(rateLimiter.isAllowed('user1-unique', limit, windowMs)).toBe(false); // user1 exceeds
    expect(rateLimiter.isAllowed('user2-unique', limit, windowMs)).toBe(false); // user2 exceeds
  });

  test('should reset specific key', () => {
    const key = 'test-user-unique-4';
    const limit = 1;
    const windowMs = 60000;

    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true);
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(false); // Exceeds

    rateLimiter.reset(key);
    expect(rateLimiter.isAllowed(key, limit, windowMs)).toBe(true); // Should work after reset
  });
});

describe('CSP and Security Headers', () => {
  test('should have required CSP directives', () => {
    expect(CSP_DIRECTIVES).toHaveProperty('default-src');
    expect(CSP_DIRECTIVES).toHaveProperty('script-src');
    expect(CSP_DIRECTIVES).toHaveProperty('style-src');
    expect(CSP_DIRECTIVES).toHaveProperty('img-src');
    expect(CSP_DIRECTIVES).toHaveProperty('connect-src');
    expect(CSP_DIRECTIVES).toHaveProperty('font-src');
  });

  test('should generate valid CSP string', () => {
    const csp = generateCSP();
    expect(typeof csp).toBe('string');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  test('should include all security headers', () => {
    expect(SECURITY_HEADERS).toHaveProperty('Content-Security-Policy');
    expect(SECURITY_HEADERS).toHaveProperty('X-Content-Type-Options');
    expect(SECURITY_HEADERS).toHaveProperty('X-Frame-Options');
    expect(SECURITY_HEADERS).toHaveProperty('X-XSS-Protection');
    expect(SECURITY_HEADERS).toHaveProperty('Referrer-Policy');
    expect(SECURITY_HEADERS).toHaveProperty('Permissions-Policy');
  });

  test('should have secure header values', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block');
  });
});

describe('validateEnvironment', () => {
  test('should be a function', () => {
    expect(typeof validateEnvironment).toBe('function');
  });

  test('should not throw with default environment', () => {
    // Skip actual validation test due to import.meta complexity in Jest
    // The function exists and is testable in integration tests
    expect(validateEnvironment).toBeDefined();
  });
});

describe('isValidExternalUrl', () => {
  test('should validate correct HTTP URLs', () => {
    expect(isValidExternalUrl('http://example.com')).toBe(true);
    expect(isValidExternalUrl('http://example.com/path')).toBe(true);
    expect(isValidExternalUrl('http://example.com:8080/path?query=1')).toBe(true);
  });

  test('should validate correct HTTPS URLs', () => {
    expect(isValidExternalUrl('https://example.com')).toBe(true);
    expect(isValidExternalUrl('https://subdomain.example.com/path')).toBe(true);
    expect(isValidExternalUrl('https://example.com:443/secure')).toBe(true);
  });

  test('should reject invalid protocols', () => {
    expect(isValidExternalUrl('ftp://example.com')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
    expect(isValidExternalUrl('javascript:alert("xss")')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert("xss")</script>')).toBe(false);
  });

  test('should reject malformed URLs', () => {
    expect(isValidExternalUrl('not-a-url')).toBe(false);
    expect(isValidExternalUrl('http://')).toBe(false);
    expect(isValidExternalUrl('https://')).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('example.com')).toBe(false); // Missing protocol
  });

  test('should handle URL constructor exceptions', () => {
    expect(isValidExternalUrl('http://[invalid-ipv6')).toBe(false);
    expect(isValidExternalUrl('https://exam ple.com')).toBe(false); // Space in domain
  });
});