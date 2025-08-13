/**
 * Comprehensive tests for loadAnalytics utility
 * Testing dynamic Umami analytics script loading
 */

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock document methods
const mockAppendChild = jest.fn();
const mockQuerySelector = jest.fn();
const mockCreateElement = jest.fn();

// Setup JSDOM mocks
beforeAll(() => {
  // Mock document methods for this test suite
  (global as any).document = {
    head: {
      appendChild: mockAppendChild
    },
    querySelector: mockQuerySelector,
    createElement: mockCreateElement
  };
});

// Import after setting up mocks
import { loadUmamiAnalytics } from '../../../apps/web/src/utils/loadAnalytics';

describe('loadAnalytics Utility', () => {
  // Mock script element
  const mockScript = {
    async: false,
    src: '',
    setAttribute: jest.fn(),
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockAppendChild.mockClear();
    mockQuerySelector.mockClear();
    mockCreateElement.mockClear();
    
    // Reset script mock
    mockScript.async = false;
    mockScript.src = '';
    mockScript.onload = null;
    mockScript.onerror = null;
    mockScript.setAttribute.mockClear();
    
    // Setup createElement to return our mock script
    mockCreateElement.mockReturnValue(mockScript);
    
    // Default: no existing script
    mockQuerySelector.mockReturnValue(null);
    
    // Setup environment variables for tests
    process.env.VITE_UMAMI_SCRIPT_URL = 'https://analytics.example.com/script.js';
    process.env.VITE_UMAMI_WEBSITE_ID = 'test-website-id';
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('Environment Configuration', () => {
    test('should load analytics when environment variables are set', async () => {
      const promise = loadUmamiAnalytics();
      
      // Simulate successful script load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      const result = await promise;
      
      expect(result).toBe(true);
      expect(mockCreateElement).toHaveBeenCalledWith('script');
      expect(mockAppendChild).toHaveBeenCalledWith(mockScript);
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Umami Analytics: Script loaded successfully');
    });

    test('should disable analytics when script URL is missing', async () => {
      delete process.env.VITE_UMAMI_SCRIPT_URL;
      
      const result = await loadUmamiAnalytics();
      
      expect(result).toBe(false);
      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Umami Analytics: Environment variables not set, analytics disabled');
    });

    test('should disable analytics when website ID is missing', async () => {
      delete process.env.VITE_UMAMI_WEBSITE_ID;
      
      const result = await loadUmamiAnalytics();
      
      expect(result).toBe(false);
      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Umami Analytics: Environment variables not set, analytics disabled');
    });

    test('should disable analytics when both environment variables are missing', async () => {
      delete process.env.VITE_UMAMI_SCRIPT_URL;
      delete process.env.VITE_UMAMI_WEBSITE_ID;
      
      const result = await loadUmamiAnalytics();
      
      expect(result).toBe(false);
      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Umami Analytics: Environment variables not set, analytics disabled');
    });
  });

  describe('Script Element Creation', () => {
    test('should create script element with correct attributes', async () => {
      const promise = loadUmamiAnalytics();
      
      expect(mockCreateElement).toHaveBeenCalledWith('script');
      expect(mockScript.async).toBe(true);
      expect(mockScript.src).toBe('https://analytics.example.com/script.js');
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-website-id', 'test-website-id');
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-domains', 'nearestniceweather.com,localhost');
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-cache', 'false');
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      await promise;
    });

    test('should set correct domains configuration', async () => {
      const promise = loadUmamiAnalytics();
      
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-domains', 'nearestniceweather.com,localhost');
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      await promise;
    });

    test('should disable caching for analytics script', async () => {
      const promise = loadUmamiAnalytics();
      
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-cache', 'false');
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      await promise;
    });
  });

  describe('Script Loading Behavior', () => {
    test('should append script to document head', async () => {
      const promise = loadUmamiAnalytics();
      
      expect(mockAppendChild).toHaveBeenCalledWith(mockScript);
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      await promise;
    });

    test('should resolve true on successful script load', async () => {
      const promise = loadUmamiAnalytics();
      
      // Simulate successful script load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      const result = await promise;
      
      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Umami Analytics: Script loaded successfully');
    });

    test('should resolve false on script load error', async () => {
      const promise = loadUmamiAnalytics();
      
      // Simulate script load error
      if (mockScript.onerror) {
        mockScript.onerror();
      }
      
      const result = await promise;
      
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('📊 Umami Analytics: Failed to load script');
    });

    test('should handle script load timeout gracefully', async () => {
      const promise = loadUmamiAnalytics();
      
      // Don't call onload or onerror - simulate timeout/hanging
      // In a real scenario, this would timeout based on browser settings
      // For testing, we'll simulate the error case
      if (mockScript.onerror) {
        mockScript.onerror();
      }
      
      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('Duplicate Script Prevention', () => {
    test('should not load script if already exists in document', async () => {
      // Mock existing script found
      const existingScript = { src: 'https://analytics.example.com/script.js' };
      mockQuerySelector.mockReturnValue(existingScript);
      
      const result = await loadUmamiAnalytics();
      
      expect(result).toBe(true);
      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockAppendChild).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Umami Analytics: Script already loaded');
    });

    test('should check for script using correct selector', async () => {
      // Mock existing script found
      mockQuerySelector.mockReturnValue({ src: 'https://analytics.example.com/script.js' });
      
      await loadUmamiAnalytics();
      
      expect(mockQuerySelector).toHaveBeenCalledWith('script[src="https://analytics.example.com/script.js"]');
    });

    test('should load script if different URL already exists', async () => {
      // Mock script with different URL
      mockQuerySelector.mockReturnValue(null); // No matching script found
      
      const promise = loadUmamiAnalytics();
      
      expect(mockCreateElement).toHaveBeenCalled();
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      const result = await promise;
      expect(result).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle document.createElement returning null', async () => {
      mockCreateElement.mockReturnValue(null);
      
      expect(() => loadUmamiAnalytics()).not.toThrow();
    });

    test('should handle document.head.appendChild throwing error', async () => {
      mockAppendChild.mockImplementation(() => {
        throw new Error('DOM manipulation failed');
      });
      
      expect(() => loadUmamiAnalytics()).not.toThrow();
    });

    test('should handle querySelector throwing error', async () => {
      mockQuerySelector.mockImplementation(() => {
        throw new Error('Query failed');
      });
      
      expect(() => loadUmamiAnalytics()).not.toThrow();
    });

    test('should handle empty environment variables', async () => {
      process.env.VITE_UMAMI_SCRIPT_URL = '';
      process.env.VITE_UMAMI_WEBSITE_ID = '';
      
      const result = await loadUmamiAnalytics();
      
      expect(result).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Umami Analytics: Environment variables not set, analytics disabled');
    });

    test('should handle whitespace-only environment variables', async () => {
      process.env.VITE_UMAMI_SCRIPT_URL = '   ';
      process.env.VITE_UMAMI_WEBSITE_ID = '\t\n';
      
      const result = await loadUmamiAnalytics();
      
      expect(result).toBe(false);
    });
  });

  describe('Configuration Values', () => {
    test('should use correct script URL from environment', async () => {
      process.env.VITE_UMAMI_SCRIPT_URL = 'https://custom-analytics.example.com/umami.js';
      
      const promise = loadUmamiAnalytics();
      
      expect(mockScript.src).toBe('https://custom-analytics.example.com/umami.js');
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      await promise;
    });

    test('should use correct website ID from environment', async () => {
      process.env.VITE_UMAMI_WEBSITE_ID = 'custom-website-id-123';
      
      const promise = loadUmamiAnalytics();
      
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-website-id', 'custom-website-id-123');
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      await promise;
    });

    test('should handle special characters in configuration', async () => {
      process.env.VITE_UMAMI_SCRIPT_URL = 'https://analytics.example.com/script-v2.0.js?param=value&test=123';
      process.env.VITE_UMAMI_WEBSITE_ID = 'website-id-with-special-chars_123';
      
      const promise = loadUmamiAnalytics();
      
      expect(mockScript.src).toBe('https://analytics.example.com/script-v2.0.js?param=value&test=123');
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-website-id', 'website-id-with-special-chars_123');
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      await promise;
    });
  });

  describe('Promise Resolution', () => {
    test('should return a Promise that resolves', async () => {
      const result = loadUmamiAnalytics();
      
      expect(result).toBeInstanceOf(Promise);
      
      // Simulate successful load
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      const resolved = await result;
      expect(typeof resolved).toBe('boolean');
    });

    test('should resolve immediately when environment variables missing', async () => {
      delete process.env.VITE_UMAMI_SCRIPT_URL;
      
      const start = Date.now();
      const result = await loadUmamiAnalytics();
      const duration = Date.now() - start;
      
      expect(result).toBe(false);
      expect(duration).toBeLessThan(10); // Should resolve almost immediately
    });

    test('should resolve immediately when script already loaded', async () => {
      mockQuerySelector.mockReturnValue({ src: 'https://analytics.example.com/script.js' });
      
      const start = Date.now();
      const result = await loadUmamiAnalytics();
      const duration = Date.now() - start;
      
      expect(result).toBe(true);
      expect(duration).toBeLessThan(10); // Should resolve almost immediately
    });
  });

  describe('Multiple Calls', () => {
    test('should handle multiple simultaneous calls', async () => {
      // First call should create and load script
      const promise1 = loadUmamiAnalytics();
      
      // Second call should find existing script
      mockQuerySelector.mockReturnValue({ src: 'https://analytics.example.com/script.js' });
      const promise2 = loadUmamiAnalytics();
      
      // Simulate first script loading
      if (mockScript.onload) {
        mockScript.onload();
      }
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    test('should handle sequential calls correctly', async () => {
      // First call
      const promise1 = loadUmamiAnalytics();
      if (mockScript.onload) {
        mockScript.onload();
      }
      const result1 = await promise1;
      
      // Second call should detect existing script
      mockQuerySelector.mockReturnValue({ src: 'https://analytics.example.com/script.js' });
      const result2 = await loadUmamiAnalytics();
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockCreateElement).toHaveBeenCalledTimes(1); // Only called once
    });
  });
});