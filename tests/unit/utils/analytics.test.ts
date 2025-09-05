/**
 * Comprehensive tests for analytics utility
 * Testing Umami analytics integration and privacy-focused tracking
 */

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Mock the import.meta.env.DEV for testing
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true
});

// Mock import.meta globally for analytics tests
(global as any).importMeta = {
  env: {
    DEV: false,
    NODE_ENV: 'test'
  }
};

// Import analytics functions after setting up mocks
import {
  initializeAnalytics,
  trackPOIInteraction,
  trackWeatherFilter,
  trackLocationUpdate,
  trackNavigation,
  trackFeatureUsage,
  trackError,
  trackPageView,
  isAnalyticsEnabled
} from '../../../apps/web/src/utils/analytics';

describe('Analytics Utility', () => {
  // Mock window object and Umami
  const mockUmamiTrack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();

    // Setup window.umami properly
    if (typeof global.window === 'undefined') {
      (global as any).window = {};
    }

    (global as any).window.umami = {
      track: mockUmamiTrack
    };

    // Mock location without triggering JSDOM navigation
    (global as any).window.location = {
      pathname: '/test'
    };
  });

  afterEach(() => {
    mockUmamiTrack.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('initializeAnalytics', () => {
    test('should return true when Umami is loaded', () => {
      const result = initializeAnalytics();

      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Umami Analytics initialized');
    });

    test('should return false when Umami is not loaded', () => {
      delete (global as any).window.umami;

      const result = initializeAnalytics();

      expect(result).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith('📊 Umami Analytics not loaded - check environment variables');
    });

    test('should handle missing window object', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = initializeAnalytics();

      expect(result).toBe(false);

      // Restore window
      (global as any).window = originalWindow;
    });

    test('should log development mode message', () => {
      // Temporarily mock DEV environment
      (global as any).importMeta.env.DEV = true;
      delete (global as any).window.umami;

      const result = initializeAnalytics();

      expect(result).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Analytics in development mode - events will be logged only');

      // Reset DEV flag
      (global as any).importMeta.env.DEV = false;
    });
  });

  describe('isAnalyticsEnabled', () => {
    test('should return true when Umami is available and functional', () => {
      const result = isAnalyticsEnabled();

      expect(result).toBe(true);
    });

    test('should return false when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = isAnalyticsEnabled();

      expect(result).toBe(false);

      // Restore window
      (global as any).window = originalWindow;
    });

    test('should return false when umami is undefined', () => {
      delete (global as any).window.umami;

      const result = isAnalyticsEnabled();

      expect(result).toBe(false);
    });

    test('should return false when umami.track is not a function', () => {
      (global as any).window.umami = { track: 'not-a-function' };

      const result = isAnalyticsEnabled();

      expect(result).toBe(false);
    });
  });

  describe('trackPOIInteraction', () => {
    test('should track POI interaction with complete data', () => {
      const mockPOI = {
        name: 'Minnehaha Falls',
        temperature: 72,
        condition: 'Clear',
        distance: 5.2,
        park_type: 'state_park'
      };

      trackPOIInteraction('view', mockPOI);

      expect(mockUmamiTrack).toHaveBeenCalledWith('poi-interaction', {
        action: 'view',
        poi_name: 'Minnehaha Falls',
        poi_type: 'state_park',
        temperature: 72,
        condition: 'Clear',
        distance_miles: 5
      });
    });

    test('should handle POI without distance', () => {
      const mockPOI = {
        name: 'Lake Harriet',
        temperature: 68,
        condition: 'Partly Cloudy'
      };

      trackPOIInteraction('directions', mockPOI);

      expect(mockUmamiTrack).toHaveBeenCalledWith('poi-interaction', {
        action: 'directions',
        poi_name: 'Lake Harriet',
        poi_type: 'unknown',
        temperature: 68,
        condition: 'Partly Cloudy',
        distance_miles: undefined
      });
    });

    test('should handle POI without park_type', () => {
      const mockPOI = {
        name: 'Local Trail',
        temperature: 65,
        condition: 'Cloudy',
        distance: 2.8
      };

      trackPOIInteraction('feedback', mockPOI);

      expect(mockUmamiTrack).toHaveBeenCalledWith('poi-interaction', {
        action: 'feedback',
        poi_name: 'Local Trail',
        poi_type: 'unknown',
        temperature: 65,
        condition: 'Cloudy',
        distance_miles: 3
      });
    });

    test('should round distance to nearest mile', () => {
      const mockPOI = {
        name: 'Test POI',
        temperature: 70,
        condition: 'Clear',
        distance: 4.7
      };

      trackPOIInteraction('click', mockPOI);

      expect(mockUmamiTrack).toHaveBeenCalledWith('poi-interaction', {
        action: 'click',
        poi_name: 'Test POI',
        poi_type: 'unknown',
        temperature: 70,
        condition: 'Clear',
        distance_miles: 5
      });
    });

    test('should log in development mode when Umami not available', () => {
      delete (global as any).window.umami;

      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockPOI = {
        name: 'Dev POI',
        temperature: 70,
        condition: 'Clear'
      };

      trackPOIInteraction('test', mockPOI);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 [Analytics] poi-interaction:',
        expect.objectContaining({
          action: 'test',
          poi_name: 'Dev POI'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('trackWeatherFilter', () => {
    test('should track weather filter with temperature range', () => {
      const filterData = {
        temp_min: 60,
        temp_max: 80,
        conditions: ['clear', 'partly-cloudy'],
        wind_max: 10,
        precipitation_max: 20
      };

      trackWeatherFilter('temperature', filterData);

      expect(mockUmamiTrack).toHaveBeenCalledWith('weather-filter', {
        filter_type: 'temperature',
        temp_range: '60-80',
        conditions: 'clear,partly-cloudy',
        wind_max: 10,
        precipitation_max: 20
      });
    });

    test('should handle filter without temperature range', () => {
      const filterData = {
        conditions: ['rainy'],
        wind_max: 15
      };

      trackWeatherFilter('precipitation', filterData);

      expect(mockUmamiTrack).toHaveBeenCalledWith('weather-filter', {
        filter_type: 'precipitation',
        temp_range: undefined,
        conditions: 'rainy',
        wind_max: 15,
        precipitation_max: undefined
      });
    });

    test('should handle filter with only one temperature bound', () => {
      const filterData = {
        temp_min: 50
      };

      trackWeatherFilter('wind', filterData);

      expect(mockUmamiTrack).toHaveBeenCalledWith('weather-filter', {
        filter_type: 'wind',
        temp_range: undefined,
        conditions: undefined,
        wind_max: undefined,
        precipitation_max: undefined
      });
    });

    test('should handle empty conditions array', () => {
      const filterData = {
        conditions: [],
        temp_min: 65,
        temp_max: 75
      };

      trackWeatherFilter('all', filterData);

      expect(mockUmamiTrack).toHaveBeenCalledWith('weather-filter', {
        filter_type: 'all',
        temp_range: '65-75',
        conditions: '',
        wind_max: undefined,
        precipitation_max: undefined
      });
    });
  });

  describe('trackLocationUpdate', () => {
    test('should track location update with privacy protection', () => {
      const location = {
        lat: 44.9778,
        lng: -93.2650,
        accuracy: 50,
        source: 'gps' as const
      };

      trackLocationUpdate(location);

      expect(mockUmamiTrack).toHaveBeenCalledWith('location-update', {
        source: 'gps',
        accuracy_meters: 50,
        lat_zone: 44, // Floor of lat for privacy
        lng_zone: -94 // Floor of lng for privacy
      });
    });

    test('should handle location without accuracy', () => {
      const location = {
        lat: 45.5,
        lng: -94.8,
        source: 'ip' as const
      };

      trackLocationUpdate(location);

      expect(mockUmamiTrack).toHaveBeenCalledWith('location-update', {
        source: 'ip',
        accuracy_meters: undefined,
        lat_zone: 45,
        lng_zone: -95
      });
    });

    test('should handle manual location source', () => {
      const location = {
        lat: 46.1234,
        lng: -95.6789,
        source: 'manual' as const
      };

      trackLocationUpdate(location);

      expect(mockUmamiTrack).toHaveBeenCalledWith('location-update', {
        source: 'manual',
        accuracy_meters: undefined,
        lat_zone: 46,
        lng_zone: -96
      });
    });
  });

  describe('trackNavigation', () => {
    test('should track navigation action with context', () => {
      const context = {
        poi_count: 5,
        distance: 30
      };

      trackNavigation('expand', context);

      expect(mockUmamiTrack).toHaveBeenCalledWith('navigation', {
        action: 'expand',
        poi_count: 5,
        distance: 30
      });
    });

    test('should track navigation action without context', () => {
      trackNavigation('closer');

      expect(mockUmamiTrack).toHaveBeenCalledWith('navigation', {
        action: 'closer'
      });
    });

    test('should handle various navigation actions', () => {
      const actions = ['closer', 'farther', 'expand', 'reset'];

      actions.forEach(action => {
        trackNavigation(action);
        expect(mockUmamiTrack).toHaveBeenCalledWith('navigation', {
          action
        });
      });
    });
  });

  describe('trackFeatureUsage', () => {
    test('should track feature usage with context', () => {
      const context = {
        poi_id: '123',
        success: true
      };

      trackFeatureUsage('directions', context);

      expect(mockUmamiTrack).toHaveBeenCalledWith('feature-usage', {
        feature: 'directions',
        poi_id: '123',
        success: true
      });
    });

    test('should track feature usage without context', () => {
      trackFeatureUsage('feedback');

      expect(mockUmamiTrack).toHaveBeenCalledWith('feature-usage', {
        feature: 'feedback'
      });
    });

    test('should handle various features', () => {
      const features = ['directions', 'feedback', 'filter', 'location-drag'];

      features.forEach(feature => {
        trackFeatureUsage(feature);
        expect(mockUmamiTrack).toHaveBeenCalledWith('feature-usage', {
          feature
        });
      });
    });
  });

  describe('trackError', () => {
    test('should track error with context', () => {
      const context = {
        component: 'MapContainer',
        user_action: 'click_poi'
      };

      trackError('api_timeout', context);

      expect(mockUmamiTrack).toHaveBeenCalledWith('error', {
        error_type: 'api_timeout',
        component: 'MapContainer',
        user_action: 'click_poi'
      });
    });

    test('should track error without context', () => {
      trackError('network_error');

      expect(mockUmamiTrack).toHaveBeenCalledWith('error', {
        error_type: 'network_error'
      });
    });

    test('should handle various error types', () => {
      const errorTypes = ['api_error', 'validation_error', 'render_error', 'location_error'];

      errorTypes.forEach(errorType => {
        trackError(errorType);
        expect(mockUmamiTrack).toHaveBeenCalledWith('error', {
          error_type: errorType
        });
      });
    });
  });

  describe('trackPageView', () => {
    test('should track page view with custom path', () => {
      trackPageView('/custom-path');

      expect(mockUmamiTrack).toHaveBeenCalledWith('page-view', {
        path: '/custom-path'
      });
    });

    test('should track page view with current path when no path provided', () => {
      trackPageView();

      expect(mockUmamiTrack).toHaveBeenCalledWith('page-view', {
        path: '/test'
      });
    });

    test('should not track when Umami is not available', () => {
      delete (global as any).window.umami;

      trackPageView('/test-path');

      expect(mockUmamiTrack).not.toHaveBeenCalled();
    });

    test('should handle missing window object', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => trackPageView()).not.toThrow();
      expect(mockUmamiTrack).not.toHaveBeenCalled();

      // Restore window
      (global as any).window = originalWindow;
    });
  });

  describe('Development Mode Behavior', () => {
    beforeEach(() => {
      delete (global as any).window.umami;
      (global as any).importMeta.env.DEV = true;
    });

    afterEach(() => {
      (global as any).importMeta.env.DEV = false;
    });

    test('should log events in development mode', () => {
      trackNavigation('test-action', { test: 'data' });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 [Analytics] navigation:',
        { action: 'test-action', test: 'data' }
      );
    });

    test('should log events without data in development mode', () => {
      trackFeatureUsage('test-feature');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 [Analytics] feature-usage:',
        { feature: 'test-feature' }
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle undefined window gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        trackPOIInteraction('test', { name: 'Test', temperature: 70, condition: 'Clear' });
        trackWeatherFilter('test', {});
        trackLocationUpdate({ lat: 44, lng: -93, source: 'gps' });
        trackNavigation('test');
        trackFeatureUsage('test');
        trackError('test');
      }).not.toThrow();

      // Restore window
      (global as any).window = originalWindow;
    });

    test('should handle malformed umami object', () => {
      (global as any).window.umami = { notTrack: 'invalid' };

      expect(() => {
        trackNavigation('test');
      }).not.toThrow();
    });

    test('should handle umami.track throwing errors', () => {
      mockUmamiTrack.mockImplementation(() => {
        throw new Error('Umami error');
      });

      expect(() => {
        trackFeatureUsage('test');
      }).not.toThrow();
    });

    test('should handle very large numbers in tracking data', () => {
      const largePOI = {
        name: 'Test POI',
        temperature: 999999,
        condition: 'Extreme',
        distance: 999999.99
      };

      expect(() => {
        trackPOIInteraction('test', largePOI);
      }).not.toThrow();

      expect(mockUmamiTrack).toHaveBeenCalledWith('poi-interaction',
        expect.objectContaining({
          distance_miles: 1000000
        })
      );
    });

    test('should handle empty strings and null values', () => {
      const emptyPOI = {
        name: '',
        temperature: 0,
        condition: ''
      };

      expect(() => {
        trackPOIInteraction('', emptyPOI);
      }).not.toThrow();

      expect(mockUmamiTrack).toHaveBeenCalledWith('poi-interaction', {
        action: '',
        poi_name: '',
        poi_type: 'unknown',
        temperature: 0,
        condition: '',
        distance_miles: undefined
      });
    });
  });

  describe('Privacy Protection', () => {
    test('should anonymize coordinates in location tracking', () => {
      // Test various coordinate ranges to ensure consistent floor behavior
      const locations = [
        { lat: 44.123, lng: -93.456, expected_lat: 44, expected_lng: -94 },
        { lat: 45.999, lng: -92.001, expected_lat: 45, expected_lng: -93 },
        { lat: 46.0, lng: -94.0, expected_lat: 46, expected_lng: -94 }
      ];

      locations.forEach(({ lat, lng, expected_lat, expected_lng }) => {
        trackLocationUpdate({ lat, lng, source: 'gps' });

        expect(mockUmamiTrack).toHaveBeenCalledWith('location-update',
          expect.objectContaining({
            lat_zone: expected_lat,
            lng_zone: expected_lng
          })
        );
      });
    });

    test('should not include exact coordinates in any tracking', () => {
      const location = { lat: 44.9778, lng: -93.2650, source: 'gps' as const };
      trackLocationUpdate(location);

      const call = mockUmamiTrack.mock.calls[0][1];
      expect(call).not.toHaveProperty('lat', 44.9778);
      expect(call).not.toHaveProperty('lng', -93.2650);
      expect(call).not.toHaveProperty('latitude');
      expect(call).not.toHaveProperty('longitude');
    });

    test('should use general zones instead of precise coordinates', () => {
      const location = { lat: 44.9778, lng: -93.2650, source: 'gps' as const };
      trackLocationUpdate(location);

      expect(mockUmamiTrack).toHaveBeenCalledWith('location-update', {
        source: 'gps',
        accuracy_meters: undefined,
        lat_zone: 44,
        lng_zone: -94
      });
    });
  });
});
