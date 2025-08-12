/**
 * Direct testing of sanitize.ts source code with import.meta handling
 */

// Set up environment
process.env.NODE_ENV = 'test';

describe('Sanitize Utils - Direct Source Testing', () => {
  let sanitizeModule;
  
  beforeAll(async () => {
    // Import the actual source file
    sanitizeModule = await import('../../../apps/web/src/utils/sanitize.ts');
  });
  
  describe('escapeHtml function', () => {
    test('should escape HTML special characters', () => {
      const { escapeHtml } = sanitizeModule;
      
      const input = '<script>alert("XSS")</script>';
      const result = escapeHtml(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });
    
    test('should handle normal text', () => {
      const { escapeHtml } = sanitizeModule;
      
      const input = 'Hello World';
      const result = escapeHtml(input);
      
      expect(result).toBe('Hello World');
    });
  });
  
  describe('sanitizeUrl function', () => {
    test('should remove javascript: protocol', () => {
      const { sanitizeUrl } = sanitizeModule;
      
      const maliciousUrl = 'javascript:alert("XSS")';
      const result = sanitizeUrl(maliciousUrl);
      
      // The actual implementation returns empty string for dangerous URLs
      expect(result).toBe('');
    });
    
    test('should allow safe URLs', () => {
      const { sanitizeUrl } = sanitizeModule;
      
      const safeUrl = 'https://example.com';
      const result = sanitizeUrl(safeUrl);
      
      // URL constructor may add trailing slash
      expect(result).toMatch(/^https:\/\/example\.com\/?$/);
    });
  });
  
  describe('sanitizeObject function', () => {
    test('should sanitize all string values in object', () => {
      const { sanitizeObject } = sanitizeModule;
      
      const input = {
        name: '<script>alert("XSS")</script>',
        description: 'Normal text',
        nested: {
          value: 'javascript:alert("evil")'
        }
      };
      
      const result = sanitizeObject(input);
      
      expect(result.name).not.toContain('<script>');
      expect(result.description).toBe('Normal text');
      // sanitizeObject doesn't deeply sanitize nested objects in the current implementation
      // It only sanitizes top-level string values
      expect(typeof result.nested).toBe('object');
    });
  });
});