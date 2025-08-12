/**
 * Simplified tests for monitoring service
 * Focusing on testable functionality
 */

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Mock fetch
global.fetch = jest.fn();

// Mock window and navigator globals
const mockAddEventListener = jest.fn();
const mockWindow = {
  location: { href: 'https://test.example.com/page' },
  addEventListener: mockAddEventListener
};

const mockNavigator = {
  userAgent: 'Test Browser 1.0'
};

if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true
  });
} else {
  global.window = mockWindow;
}

if (typeof global.navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true
  });
} else {
  global.navigator = mockNavigator;
}

// Mock sessionStorage
Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
}));

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => mockDate.getTime());

// Import after mocks are set up
import { monitoring, ErrorContext, PerformanceMetric } from '../../../apps/web/src/services/monitoring';

describe('MonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (global.sessionStorage.getItem as jest.Mock).mockClear();
    (global.sessionStorage.setItem as jest.Mock).mockClear();
    mockConsoleError.mockClear();
    mockConsoleDebug.mockClear();
    mockConsoleWarn.mockClear();
  });

  describe('captureError', () => {
    test('should log error to console', () => {
      const testError = new Error('Test error message');
      const context: ErrorContext = {
        userId: 'user123',
        sessionId: 'session456',
        context: 'test context'
      };

      monitoring.captureError(testError, context);

      expect(mockConsoleError).toHaveBeenCalledWith('🚨 Error captured:', expect.objectContaining({
        message: 'Test error message',
        name: 'Error',
        userId: 'user123',
        sessionId: 'session456',
        context: 'test context'
      }));
    });

    test('should handle error without context', () => {
      const testError = new Error('Simple error');
      
      monitoring.captureError(testError);

      expect(mockConsoleError).toHaveBeenCalledWith('🚨 Error captured:', expect.objectContaining({
        message: 'Simple error',
        name: 'Error'
      }));
    });

    test('should include error stack trace', () => {
      const testError = new Error('Error with stack');
      testError.stack = 'Error: Test\n    at test.js:1:1';

      monitoring.captureError(testError);

      expect(mockConsoleError).toHaveBeenCalledWith('🚨 Error captured:', expect.objectContaining({
        stack: 'Error: Test\n    at test.js:1:1'
      }));
    });

    test('should be a callable function', () => {
      expect(typeof monitoring.captureError).toBe('function');
    });
  });

  describe('capturePerformance', () => {
    test('should log performance metric to console', () => {
      const metric: PerformanceMetric = {
        name: 'API_RESPONSE_TIME',
        value: 150,
        unit: 'ms',
        timestamp: mockDate,
        context: {
          endpoint: '/api/locations'
        }
      };

      monitoring.capturePerformance(metric);

      expect(mockConsoleDebug).toHaveBeenCalledWith('📊 Performance metric:', expect.objectContaining({
        name: 'API_RESPONSE_TIME',
        value: 150,
        unit: 'ms',
        timestamp: mockDate.toISOString(),
        url: 'https://test.example.com/page'
      }));
    });

    test('should handle performance metric without context', () => {
      const metric: PerformanceMetric = {
        name: 'FID',
        value: 50,
        unit: 'ms',
        timestamp: mockDate
      };

      monitoring.capturePerformance(metric);

      expect(mockConsoleDebug).toHaveBeenCalledWith('📊 Performance metric:', expect.objectContaining({
        name: 'FID',
        value: 50,
        unit: 'ms'
      }));
    });

    test('should be a callable function', () => {
      expect(typeof monitoring.capturePerformance).toBe('function');
    });
  });

  describe('captureUserAction', () => {
    test('should log user action to console', () => {
      const action = 'button_click';
      const context = {
        buttonId: 'submit-form',
        formType: 'feedback'
      };

      monitoring.captureUserAction(action, context);

      expect(mockConsoleDebug).toHaveBeenCalledWith('👤 User action:', expect.objectContaining({
        action: 'button_click',
        timestamp: mockDate.toISOString(),
        url: 'https://test.example.com/page',
        buttonId: 'submit-form',
        formType: 'feedback'
      }));
    });

    test('should handle user action without context', () => {
      const action = 'search_performed';

      monitoring.captureUserAction(action);

      expect(mockConsoleDebug).toHaveBeenCalledWith('👤 User action:', expect.objectContaining({
        action: 'search_performed',
        timestamp: mockDate.toISOString(),
        url: 'https://test.example.com/page'
      }));
    });

    test('should be a callable function', () => {
      expect(typeof monitoring.captureUserAction).toBe('function');
    });
  });

  describe('captureWebVitals', () => {
    test('should setup PerformanceObserver for Core Web Vitals', () => {
      monitoring.captureWebVitals();

      // Should create three PerformanceObserver instances
      expect(PerformanceObserver).toHaveBeenCalledTimes(3);

      // Check that observers are configured with callbacks
      const calls = (PerformanceObserver as jest.Mock).mock.calls;
      expect(calls[0][0]).toBeInstanceOf(Function); // LCP callback
      expect(calls[1][0]).toBeInstanceOf(Function); // FID callback
      expect(calls[2][0]).toBeInstanceOf(Function); // CLS callback
    });

    test('should handle LCP measurements', () => {
      const mockLCPCallback = jest.fn();
      (PerformanceObserver as jest.Mock).mockImplementation((callback) => {
        mockLCPCallback.mockImplementation(callback);
        return { observe: jest.fn() };
      });

      monitoring.captureWebVitals();

      // Simulate LCP measurement
      const mockLCPEntries = [{
        startTime: 1200,
        name: 'largest-contentful-paint'
      }];

      mockLCPCallback({
        getEntries: () => mockLCPEntries
      });

      expect(mockConsoleDebug).toHaveBeenCalledWith('📊 Performance metric:', expect.objectContaining({
        name: 'LCP',
        value: 1200,
        unit: 'ms'
      }));
    });

    test('should handle FID measurements', () => {
      let fidCallback: any;
      (PerformanceObserver as jest.Mock).mockImplementation((callback) => {
        fidCallback = callback;
        return { observe: jest.fn() };
      });

      monitoring.captureWebVitals();

      // Simulate FID measurement
      const mockFIDEntries = [{
        startTime: 50,
        processingStart: 75,
        name: 'first-input'
      }];

      fidCallback({
        getEntries: () => mockFIDEntries
      });

      expect(mockConsoleDebug).toHaveBeenCalledWith('📊 Performance metric:', expect.objectContaining({
        name: 'FID',
        value: 25, // processingStart - startTime = 75 - 50
        unit: 'ms'
      }));
    });

    test('should handle CLS measurements', () => {
      let clsCallback: any;
      (PerformanceObserver as jest.Mock).mockImplementation((callback) => {
        clsCallback = callback;
        return { observe: jest.fn() };
      });

      monitoring.captureWebVitals();

      // Simulate CLS measurement
      const mockCLSEntries = [
        { value: 0.1, hadRecentInput: false },
        { value: 0.05, hadRecentInput: false },
        { value: 0.2, hadRecentInput: true } // Should be ignored
      ];

      clsCallback({
        getEntries: () => mockCLSEntries
      });

      expect(mockConsoleDebug).toHaveBeenCalledWith('📊 Performance metric:', expect.objectContaining({
        name: 'CLS',
        value: expect.closeTo(0.15, 2), // Allow for floating point precision
        unit: 'score'
      }));
    });

    test('should be a callable function', () => {
      expect(typeof monitoring.captureWebVitals).toBe('function');
    });
  });

  describe('session management', () => {
    test('should use existing session ID from sessionStorage', () => {
      (global.sessionStorage.getItem as jest.Mock).mockReturnValue('existing_session_123');

      const testError = new Error('Test');
      monitoring.captureError(testError);

      expect(global.sessionStorage.getItem).toHaveBeenCalledWith('monitoring_session_id');
      expect(global.sessionStorage.setItem).not.toHaveBeenCalled();
    });

    test('should create new session ID if none exists', () => {
      (global.sessionStorage.getItem as jest.Mock).mockReturnValue(null);

      const testError = new Error('Test');
      monitoring.captureError(testError);

      expect(global.sessionStorage.getItem).toHaveBeenCalledWith('monitoring_session_id');
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'monitoring_session_id',
        expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
      );
    });

    test('should generate session ID with random component', () => {
      const mockMathRandom = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
      (global.sessionStorage.getItem as jest.Mock).mockReturnValue(null);

      const testError = new Error('Test');
      monitoring.captureError(testError);

      expect(mockMathRandom).toHaveBeenCalled();
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'monitoring_session_id',
        expect.stringContaining('session_')
      );

      mockMathRandom.mockRestore();
    });
  });

  describe('module interfaces', () => {
    test('should export ErrorContext interface', () => {
      // TypeScript interface test - if this compiles, the interface exists
      const context: ErrorContext = {
        userId: 'test',
        sessionId: 'test',
        userAgent: 'test',
        url: 'test',
        context: 'test'
      };
      expect(context).toBeDefined();
    });

    test('should export PerformanceMetric interface', () => {
      // TypeScript interface test - if this compiles, the interface exists
      const metric: PerformanceMetric = {
        name: 'test',
        value: 100,
        unit: 'ms',
        timestamp: new Date()
      };
      expect(metric).toBeDefined();
    });

    test('should export monitoring service instance', () => {
      expect(monitoring).toBeDefined();
      expect(typeof monitoring.captureError).toBe('function');
      expect(typeof monitoring.capturePerformance).toBe('function');
      expect(typeof monitoring.captureUserAction).toBe('function');
      expect(typeof monitoring.captureWebVitals).toBe('function');
    });
  });

  describe('global event handlers', () => {
    test('should setup event listeners on module load', () => {
      // Since the module is already loaded, verify that addEventListener was called
      expect(mockAddEventListener).toHaveBeenCalled();
    });

    test('should handle at least some global events', () => {
      // Verify that event listeners exist (even if we can't test them easily)
      const calls = mockAddEventListener.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});

afterAll(() => {
  mockConsoleError.mockRestore();
  mockConsoleDebug.mockRestore();
  mockConsoleWarn.mockRestore();
});