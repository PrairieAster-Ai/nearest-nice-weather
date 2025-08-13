/**
 * Comprehensive tests for UserLocationEstimator service
 * Testing intelligent positioning service with multiple fallback strategies
 */

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

Object.defineProperty(global, 'navigator', {
  value: {
    geolocation: mockGeolocation,
    permissions: {
      query: jest.fn()
    }
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock fetch for IP geolocation
global.fetch = jest.fn();

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  abort: jest.fn(),
  signal: { aborted: false }
}));

// Import the service after setting up mocks
import { 
  UserLocationEstimator,
  LocationEstimate,
  LocationMethod,
  LocationConfidence
} from '../../../apps/web/src/services/UserLocationEstimator';

describe('UserLocationEstimator Service', () => {
  let estimator: UserLocationEstimator;

  const mockPosition = {
    coords: {
      latitude: 44.9778,
      longitude: -93.2650,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
    
    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    
    // Reset geolocation mocks
    mockGeolocation.getCurrentPosition.mockClear();
    mockGeolocation.watchPosition.mockClear();
    mockGeolocation.clearWatch.mockClear();
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        latitude: 44.9778,
        longitude: -93.2650,
        city: 'Minneapolis',
        region: 'Minnesota',
        accuracy: 'city'
      })
    });

    // Create new estimator instance
    estimator = new UserLocationEstimator();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('Constructor and Initialization', () => {
    test('should create instance with default configuration', () => {
      expect(estimator).toBeInstanceOf(UserLocationEstimator);
    });

    test('should handle constructor without throwing', () => {
      expect(() => new UserLocationEstimator()).not.toThrow();
    });
  });

  describe('Primary estimateLocation Method', () => {
    test('should successfully get GPS location with high accuracy', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const estimate = await estimator.estimateLocation({ enableHighAccuracy: true });

      expect(estimate).toMatchObject({
        coordinates: [44.9778, -93.2650],
        method: 'gps',
        confidence: 'high'
      });
      expect(estimate.accuracy).toBe(10);
      expect(estimate.timestamp).toBeGreaterThan(0);
    });

    test('should fallback to IP location when GPS fails', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied the request for Geolocation.'
        });
      });

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('ip');
      expect(estimate.coordinates).toEqual([44.9778, -93.2650]);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle complete failure with fallback location', async () => {
      // Disable GPS
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      // Disable IP geolocation
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // No cached location
      mockLocalStorage.getItem.mockReturnValue(null);

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('fallback');
      expect(estimate.coordinates).toEqual([44.9537, -93.0900]); // Minneapolis default
      expect(estimate.confidence).toBe('unknown');
    });

    test('should use cached location when available and fresh', async () => {
      const cachedLocation = {
        coordinates: [45.0, -94.0],
        accuracy: 15,
        method: 'gps',
        timestamp: Date.now() - 60000, // 1 minute ago
        confidence: 'high',
        source: 'cached_test'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedLocation));

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('cached');
      expect(estimate.coordinates).toEqual([45.0, -94.0]);
    });

    test('should ignore expired cached location', async () => {
      const expiredLocation = {
        coordinates: [45.0, -94.0],
        accuracy: 15,
        method: 'gps',
        timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        confidence: 'high'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredLocation));

      // Mock GPS success for fresh location
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('gps'); // Should get fresh GPS instead of expired cache
    });

    test('should handle corrupted cache data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('gps');
    });
  });

  describe('requestPreciseLocation Method', () => {
    test('should request high accuracy GPS location', async () => {
      const highAccuracyPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          accuracy: 5
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(highAccuracyPosition);
      });

      const estimate = await estimator.requestPreciseLocation();

      expect(estimate.accuracy).toBe(5);
      expect(estimate.confidence).toBe('high');
      expect(estimate.method).toBe('gps');
    });

    test('should handle GPS permission denied in precise mode', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied the request for Geolocation.'
        });
      });

      await expect(estimator.requestPreciseLocation()).rejects.toThrow('Geolocation error');
    });
  });

  describe('getFastLocation Method', () => {
    test('should return cached location if available', async () => {
      const cachedLocation = {
        coordinates: [45.0, -94.0],
        accuracy: 15,
        method: 'cached',
        timestamp: Date.now() - 60000, // 1 minute ago
        confidence: 'medium',
        source: 'test_cache'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedLocation));

      const estimate = await estimator.getFastLocation();

      expect(estimate.coordinates).toEqual([45.0, -94.0]);
      expect(estimate.method).toBe('cached');
    });

    test('should fallback to IP location when no cache', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const estimate = await estimator.getFastLocation();

      expect(estimate.method).toBe('ip');
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should fallback to default when all fast methods fail', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const estimate = await estimator.getFastLocation();

      expect(estimate.method).toBe('fallback');
      expect(estimate.coordinates).toEqual([44.9537, -93.0900]);
    });
  });

  describe('IP Geolocation Strategy', () => {
    test('should handle multiple IP providers with ipapi success', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          latitude: 44.9778,
          longitude: -93.2650,
          city: 'Minneapolis',
          region: 'Minnesota',
          country_code: 'US'
        })
      });

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('ip');
      expect(estimate.coordinates).toEqual([44.9778, -93.2650]);
      expect(estimate.confidence).toBe('medium');
    });

    test('should handle IP geolocation API failure', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('fallback');
    });

    test('should handle malformed IP geolocation response', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          // Missing required fields
          city: 'Minneapolis'
        })
      });

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('fallback');
    });

    test('should handle HTTP errors from IP providers', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('fallback');
    });
  });

  describe('Utility Methods', () => {
    test('should generate location summary', () => {
      const estimate: LocationEstimate = {
        coordinates: [44.9778, -93.2650],
        accuracy: 15,
        method: 'gps',
        timestamp: Date.now(),
        confidence: 'high'
      };

      const summary = estimator.getLocationSummary(estimate);

      expect(summary).toContain('GPS');
      expect(summary).toContain('±15m');
      expect(summary).toContain('just now');
    });

    test('should clear stored location data', () => {
      estimator.clearStoredLocation();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('location_cache');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 Cleared stored location data');
    });

    test('should provide privacy summary with no stored data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const summary = estimator.getPrivacySummary();

      expect(summary).toEqual({
        hasStoredData: false,
        lastUpdate: null,
        dataAge: 'never'
      });
    });

    test('should provide privacy summary with stored data', () => {
      const cachedData = {
        timestamp: Date.now() - 120000, // 2 minutes ago
        coordinates: [44.9778, -93.2650]
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const summary = estimator.getPrivacySummary();

      expect(summary.hasStoredData).toBe(true);
      expect(summary.lastUpdate).toBe(cachedData.timestamp);
      expect(summary.dataAge).toContain('min ago');
    });

    test('should check permission status', async () => {
      const mockPermission = { state: 'granted' };
      (navigator.permissions.query as jest.Mock).mockResolvedValue(mockPermission);

      const status = await estimator.checkPermissionStatus();

      expect(status.geolocation).toBe('granted');
      expect(status.hasPermissionApi).toBe(true);
    });

    test('should handle permission check failure', async () => {
      (navigator.permissions.query as jest.Mock).mockRejectedValue(new Error('Permission check failed'));

      const status = await estimator.checkPermissionStatus();

      expect(status.geolocation).toBe('not_supported');
      expect(status.hasPermissionApi).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle geolocation not supported', async () => {
      // Remove geolocation support
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true
      });

      const newEstimator = new UserLocationEstimator();
      const estimate = await newEstimator.estimateLocation();

      expect(estimate.method).toBe('ip');
    });

    test('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('gps');
    });

    test('should handle multiple simultaneous estimation requests', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => success(mockPosition), 100);
      });

      // First request starts estimation
      const promise1 = estimator.estimateLocation();
      
      // Second request should throw error about estimation in progress
      await expect(estimator.estimateLocation()).rejects.toThrow('Location estimation already in progress');

      // First request should complete normally
      const result1 = await promise1;
      expect(result1.coordinates).toEqual([44.9778, -93.2650]);
    });

    test('should handle network timeout gracefully', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const estimate = await estimator.estimateLocation();

      expect(estimate.method).toBe('fallback');
    });
  });

  describe('testAllMethods Diagnostic', () => {
    test('should test all location methods and return results', async () => {
      // Mock GPS success
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const results = await estimator.testAllMethods();

      expect(results).toHaveProperty('gps');
      expect(results).toHaveProperty('network');
      expect(results).toHaveProperty('ip');
      expect(results).toHaveProperty('cached');
      expect(results).toHaveProperty('fallback');

      // GPS and network should succeed
      expect(results.gps).toHaveProperty('coordinates');
      expect(results.network).toHaveProperty('coordinates');
      
      // Fallback should always work
      expect(results.fallback).toHaveProperty('coordinates');
      expect((results.fallback as LocationEstimate).method).toBe('fallback');
    });

    test('should handle GPS failure in test method', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(new Error('GPS failed'));
      });

      const results = await estimator.testAllMethods();

      expect(results.gps).toBeInstanceOf(Error);
      expect(results.network).toBeInstanceOf(Error);
    });
  });

  describe('Caching Behavior', () => {
    test('should cache successful location estimates in localStorage', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await estimator.estimateLocation();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'location_cache',
        expect.stringContaining('coordinates')
      );
    });

    test('should handle localStorage setItem failure', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage full');
      });

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      // Should not throw despite localStorage error
      const estimate = await estimator.estimateLocation();
      expect(estimate.method).toBe('gps');
    });
  });

  describe('Configuration Options', () => {
    test('should handle timeout configuration', async () => {
      const shortTimeout = 1000;
      
      mockGeolocation.getCurrentPosition.mockImplementation((success, error, options) => {
        expect(options?.timeout).toBe(shortTimeout);
        success(mockPosition);
      });

      await estimator.estimateLocation({ timeout: shortTimeout });
    });

    test('should handle high accuracy configuration', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error, options) => {
        expect(options?.enableHighAccuracy).toBe(true);
        success(mockPosition);
      });

      await estimator.estimateLocation({ enableHighAccuracy: true });
    });

    test('should handle custom fallback coordinates', async () => {
      const customFallback: [number, number] = [47.0, -94.0];
      
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const estimate = await estimator.estimateLocation({
        fallbackCoordinates: customFallback
      });

      expect(estimate.coordinates).toEqual(customFallback);
    });
  });
});