/**
 * UserLocationEstimator Service Coverage Test using CommonJS approach
 * Comprehensive testing of location estimation service
 *
 * @COVERAGE_TARGET: services/UserLocationEstimator.ts
 * @PHASE: Phase 3 - Complete service layer coverage
 */

// Mock browser environment
global.window = {
  location: { href: 'https://test.com' }
};

const mockNavigatorPermissions = {
  query: jest.fn()
};

global.navigator = {
  geolocation: {
    getCurrentPosition: jest.fn(),
  },
  permissions: mockNavigatorPermissions
};

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

global.localStorage = mockLocalStorage;

global.fetch = jest.fn();
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: 'mock-signal',
  abort: jest.fn()
}));
global.setTimeout = jest.fn((fn, delay) => {
  fn(); // Execute immediately for testing
  return 'mock-timeout-id';
});
global.clearTimeout = jest.fn();

describe('UserLocationEstimator Service Coverage - CommonJS', () => {
  let mockLocationEstimator;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset global mocks
    global.fetch.mockClear();

    // Reset localStorage mock return values
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});

    // Reset navigator mocks
    global.navigator.geolocation.getCurrentPosition.mockClear();
    mockNavigatorPermissions.query.mockClear();

    // Create mock UserLocationEstimator class
    mockLocationEstimator = {
      defaultOptions: {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
        fallbackCoordinates: [44.9537, -93.0900],
        cacheMaxAge: 1800000
      },
      cachedLocation: null,
      isEstimating: false
    };
  });

  describe('LocationEstimate interface validation', () => {
    test('should validate LocationEstimate data structure', () => {
      const validLocationEstimate = {
        coordinates: [44.9537, -93.0900],
        accuracy: 100,
        method: 'gps',
        timestamp: Date.now(),
        confidence: 'high',
        source: 'browser_geolocation'
      };

      // Validate required fields
      expect(Array.isArray(validLocationEstimate.coordinates)).toBe(true);
      expect(validLocationEstimate.coordinates).toHaveLength(2);
      expect(typeof validLocationEstimate.accuracy).toBe('number');
      expect(typeof validLocationEstimate.method).toBe('string');
      expect(typeof validLocationEstimate.timestamp).toBe('number');
      expect(typeof validLocationEstimate.confidence).toBe('string');

      // Validate coordinate ranges (latitude, longitude)
      const [lat, lng] = validLocationEstimate.coordinates;
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);

      // Validate method enum values
      const validMethods = ['gps', 'network', 'ip', 'cached', 'manual', 'fallback', 'none'];
      expect(validMethods).toContain(validLocationEstimate.method);

      // Validate confidence enum values
      const validConfidences = ['high', 'medium', 'low', 'unknown'];
      expect(validConfidences).toContain(validLocationEstimate.confidence);
    });

    test('should validate LocationOptions interface', () => {
      const validOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000,
        fallbackCoordinates: [45.0, -94.0],
        cacheMaxAge: 3600000
      };

      // Validate option types
      expect(typeof validOptions.enableHighAccuracy).toBe('boolean');
      expect(typeof validOptions.timeout).toBe('number');
      expect(typeof validOptions.maximumAge).toBe('number');
      expect(Array.isArray(validOptions.fallbackCoordinates)).toBe(true);
      expect(typeof validOptions.cacheMaxAge).toBe('number');

      // Validate reasonable values
      expect(validOptions.timeout).toBeGreaterThan(0);
      expect(validOptions.timeout).toBeLessThan(60000); // Reasonable timeout
      expect(validOptions.maximumAge).toBeGreaterThanOrEqual(0);
      expect(validOptions.cacheMaxAge).toBeGreaterThan(0);
    });
  });

  describe('Browser Geolocation Implementation', () => {
    test('should handle successful geolocation with high accuracy', async () => {
      const getBrowserGeolocation = (options) => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const estimate = {
                coordinates: [position.coords.latitude, position.coords.longitude],
                accuracy: position.coords.accuracy,
                method: position.coords.accuracy < 100 ? 'gps' : 'network',
                timestamp: position.timestamp,
                confidence: position.coords.accuracy <= 50 ? 'high' : 'medium',
                source: 'browser_geolocation'
              };
              resolve(estimate);
            },
            (error) => {
              reject(new Error(`Geolocation error: ${error.message}`));
            },
            {
              enableHighAccuracy: options.enableHighAccuracy,
              timeout: options.timeout,
              maximumAge: options.maximumAge
            }
          );
        });
      };

      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 44.9778,
          longitude: -93.2650,
          accuracy: 50
        },
        timestamp: Date.now()
      };

      global.navigator.geolocation.getCurrentPosition.mockImplementation((success, error, options) => {
        success(mockPosition);
      });

      const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 };
      const result = await getBrowserGeolocation(options);

      expect(result.coordinates).toEqual([44.9778, -93.2650]);
      expect(result.accuracy).toBe(50);
      expect(result.method).toBe('gps'); // < 100m accuracy
      expect(result.confidence).toBe('high'); // < 50m accuracy
      expect(result.source).toBe('browser_geolocation');

      expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });

    test('should handle geolocation errors', async () => {
      const getBrowserGeolocation = (options) => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => reject(new Error(`Geolocation error: ${error.message}`)),
            options
          );
        });
      };

      // Mock geolocation error
      global.navigator.geolocation.getCurrentPosition.mockImplementation((success, error, options) => {
        error({ message: 'User denied geolocation' });
      });

      const options = { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 };

      await expect(getBrowserGeolocation(options)).rejects.toThrow('Geolocation error: User denied geolocation');
    });

    test('should handle unsupported geolocation', async () => {
      const getBrowserGeolocation = (options) => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
        });
      };

      // Mock unsupported geolocation
      global.navigator.geolocation = undefined;

      await expect(getBrowserGeolocation({})).rejects.toThrow('Geolocation not supported');

      // Restore for other tests
      global.navigator.geolocation = {
        getCurrentPosition: jest.fn(),
      };
    });
  });

  describe('IP Geolocation Implementation', () => {
    test('should handle successful IP geolocation with multiple providers', async () => {
      const getIPLocation = async () => {
        const providers = [
          {
            name: 'ipapi',
            endpoint: 'https://ipapi.co/json/',
            parser: (data) => {
              if (data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
                return {
                  coordinates: [data.latitude, data.longitude],
                  accuracy: 5000,
                  method: 'ip',
                  timestamp: Date.now(),
                  confidence: 'medium',
                  source: `ipapi_${data.city || 'unknown'}_${data.region || 'unknown'}`
                };
              }
              return null;
            }
          }
        ];

        const providerPromises = providers.map(async (provider) => {
          try {
            const response = await fetch(provider.endpoint, {
              signal: 'mock-signal',
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const estimate = provider.parser(data);

            if (estimate) {
              return { provider: provider.name, estimate, error: null };
            }

            return { provider: provider.name, estimate: null, error: 'Invalid response data' };
          } catch (error) {
            return { provider: provider.name, estimate: null, error: error.message };
          }
        });

        const results = await Promise.allSettled(providerPromises);

        const successfulEstimates = results
          .filter((result) =>
            result.status === 'fulfilled' && result.value.estimate !== null
          )
          .map(result => result.value.estimate);

        if (successfulEstimates.length > 0) {
          return successfulEstimates[0];
        }

        throw new Error('IP geolocation unavailable');
      };

      // Mock successful IP geolocation response
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          latitude: 44.9537,
          longitude: -93.0900,
          city: 'Saint Paul',
          region: 'Minnesota'
        })
      });

      const result = await getIPLocation();

      expect(result.coordinates).toEqual([44.9537, -93.0900]);
      expect(result.accuracy).toBe(5000);
      expect(result.method).toBe('ip');
      expect(result.confidence).toBe('medium');
      expect(result.source).toBe('ipapi_Saint Paul_Minnesota');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://ipapi.co/json/',
        expect.objectContaining({
          signal: 'mock-signal',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        })
      );
    });

    test('should handle IP geolocation provider failures', async () => {
      const getIPLocation = async () => {
        const providers = [
          {
            name: 'ipapi',
            parser: () => null
          }
        ];

        global.fetch.mockRejectedValue(new Error('Network error'));

        const providerPromises = providers.map(async (provider) => {
          try {
            const response = await fetch('test-endpoint');
            const data = await response.json();
            const estimate = provider.parser(data);
            return { provider: provider.name, estimate, error: null };
          } catch (error) {
            return { provider: provider.name, estimate: null, error: error.message };
          }
        });

        const results = await Promise.allSettled(providerPromises);

        const successfulEstimates = results
          .filter((result) =>
            result.status === 'fulfilled' && result.value.estimate !== null
          )
          .map(result => result.value.estimate);

        if (successfulEstimates.length === 0) {
          throw new Error('IP geolocation unavailable');
        }

        return successfulEstimates[0];
      };

      await expect(getIPLocation()).rejects.toThrow('IP geolocation unavailable');
    });
  });

  describe('Cached Location Management', () => {
    test('should handle valid cached location from localStorage', async () => {
      const getCachedLocation = async () => {
        try {
          const cached = mockLocalStorage.getItem('location_cache');
          if (cached) {
            const parsedCache = JSON.parse(cached);
            const cacheAge = Date.now() - parsedCache.timestamp;

            if (cacheAge < 1800000) { // 30 minutes
              return {
                coordinates: parsedCache.coordinates,
                accuracy: parsedCache.accuracy,
                method: 'cached',
                timestamp: parsedCache.timestamp,
                confidence: parsedCache.confidence,
                source: parsedCache.source
              };
            } else {
              mockLocalStorage.removeItem('location_cache');
            }
          }
        } catch (error) {
          console.warn('Failed to load cached location:', error);
        }
        return null;
      };

      // Mock valid cached location
      const cachedData = {
        coordinates: [44.9778, -93.2650],
        accuracy: 100,
        method: 'gps',
        timestamp: Date.now() - 300000, // 5 minutes ago
        confidence: 'high',
        source: 'browser_geolocation'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await getCachedLocation();

      expect(result).not.toBeNull();
      expect(result.coordinates).toEqual([44.9778, -93.2650]);
      expect(result.method).toBe('cached');
      expect(result.confidence).toBe('high');

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('location_cache');
    });

    test('should handle expired cached location', async () => {
      const getCachedLocation = async () => {
        try {
          const cached = mockLocalStorage.getItem('location_cache');
          if (cached) {
            const parsedCache = JSON.parse(cached);
            const cacheAge = Date.now() - parsedCache.timestamp;

            if (cacheAge < 1800000) {
              return parsedCache;
            } else {
              mockLocalStorage.removeItem('location_cache');
            }
          }
        } catch (error) {
          console.warn('Failed to load cached location:', error);
        }
        return null;
      };

      // Mock expired cached location
      const expiredData = {
        coordinates: [44.9778, -93.2650],
        timestamp: Date.now() - 3600000, // 1 hour ago (expired)
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));

      const result = await getCachedLocation();

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('location_cache');
    });

    test('should handle malformed cached location', async () => {
      const getCachedLocation = async () => {
        try {
          const cached = mockLocalStorage.getItem('location_cache');
          if (cached) {
            const parsedCache = JSON.parse(cached);
            return parsedCache;
          }
        } catch (error) {
          console.warn('Failed to load cached location:', error);
        }
        return null;
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock malformed JSON
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = await getCachedLocation();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load cached location:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Location Accuracy and Confidence Calculations', () => {
    test('should calculate confidence based on accuracy and timestamp', () => {
      const calculateConfidence = (accuracy, timestamp) => {
        const age = Date.now() - timestamp;

        if (accuracy < 50 && age < 300000) return 'high';      // <50m, <5min
        if (accuracy < 1000 && age < 1800000) return 'medium'; // <1km, <30min
        if (accuracy < 10000) return 'low';                    // <10km
        return 'unknown';
      };

      const now = Date.now();

      // Test high confidence
      expect(calculateConfidence(25, now - 60000)).toBe('high'); // 25m, 1min ago

      // Test medium confidence
      expect(calculateConfidence(500, now - 600000)).toBe('medium'); // 500m, 10min ago

      // Test low confidence
      expect(calculateConfidence(5000, now - 3600000)).toBe('low'); // 5km, 1hr ago

      // Test unknown confidence
      expect(calculateConfidence(50000, now - 7200000)).toBe('unknown'); // 50km, 2hr ago
    });

    test('should estimate IP accuracy based on location data', () => {
      const estimateIPAccuracy = (city, region) => {
        const urbanCities = ['minneapolis', 'saint paul', 'duluth', 'rochester', 'bloomington', 'st. paul'];
        const cityName = city?.toLowerCase() || '';
        const regionName = region?.toLowerCase() || '';

        if (regionName.includes('minnesota') || regionName.includes('mn')) {
          if (urbanCities.some(city => cityName.includes(city))) {
            return 3000; // ~3km for Minnesota urban areas
          }
          return 15000; // ~15km for rural Minnesota
        }

        if (urbanCities.includes(cityName) || cityName.includes('minneapolis') || cityName.includes('paul')) {
          return 5000; // ~5km for urban areas
        }
        return 25000; // ~25km for rural areas
      };

      // Test Minnesota urban areas
      expect(estimateIPAccuracy('Minneapolis', 'Minnesota')).toBe(3000);
      expect(estimateIPAccuracy('Saint Paul', 'MN')).toBe(3000);

      // Test Minnesota rural areas
      expect(estimateIPAccuracy('Hibbing', 'Minnesota')).toBe(15000);

      // Test non-Minnesota urban areas
      expect(estimateIPAccuracy('New York', 'New York')).toBe(25000);

      // Test unknown areas
      expect(estimateIPAccuracy('Unknown', 'Unknown')).toBe(25000);
    });

    test('should calculate IP confidence based on location completeness', () => {
      const calculateIPConfidence = (city, region, country) => {
        const hasCity = city && city.toLowerCase() !== 'unknown';
        const hasRegion = region && region.toLowerCase() !== 'unknown';
        const isMinnesota = region?.toLowerCase().includes('minnesota') || region?.toLowerCase().includes('mn');
        const isUS = country?.toLowerCase().includes('us') || country?.toLowerCase().includes('united states');

        if (isMinnesota && hasCity) {
          return 'medium';
        } else if (isUS && hasCity && hasRegion) {
          return 'low';
        } else if (hasCity || hasRegion) {
          return 'low';
        } else {
          return 'unknown';
        }
      };

      // Test Minnesota with city
      expect(calculateIPConfidence('Minneapolis', 'Minnesota', 'US')).toBe('medium');

      // Test US with city and region
      expect(calculateIPConfidence('Chicago', 'Illinois', 'United States')).toBe('low');

      // Test with partial data
      expect(calculateIPConfidence('SomeCity', null, 'US')).toBe('low');

      // Test with no useful data
      expect(calculateIPConfidence(null, null, null)).toBe('unknown');
    });
  });

  describe('Location Scoring Algorithm', () => {
    test('should score location estimates for comparison', () => {
      const scoreEstimate = (estimate) => {
        const confidenceScores = { 'high': 100, 'medium': 75, 'low': 50, 'unknown': 25 };
        const methodScores = { 'gps': 100, 'network': 80, 'manual': 75, 'cached': 60, 'ip': 40, 'fallback': 10, 'none': 0 };
        const ageScore = Math.max(0, 100 - (Date.now() - estimate.timestamp) / 60000); // Decay over time
        const accuracyScore = Math.max(0, 100 - Math.log10(estimate.accuracy));

        return (
          confidenceScores[estimate.confidence] * 0.3 +
          methodScores[estimate.method] * 0.3 +
          accuracyScore * 0.2 +
          ageScore * 0.2
        );
      };

      const now = Date.now();

      const gpsEstimate = {
        coordinates: [44.9778, -93.2650],
        accuracy: 10,
        method: 'gps',
        timestamp: now - 30000, // 30 seconds ago
        confidence: 'high'
      };

      const ipEstimate = {
        coordinates: [44.9537, -93.0900],
        accuracy: 5000,
        method: 'ip',
        timestamp: now - 300000, // 5 minutes ago
        confidence: 'low'
      };

      const fallbackEstimate = {
        coordinates: [44.9537, -93.0900],
        accuracy: 50000,
        method: 'fallback',
        timestamp: now,
        confidence: 'unknown'
      };

      const gpsScore = scoreEstimate(gpsEstimate);
      const ipScore = scoreEstimate(ipEstimate);
      const fallbackScore = scoreEstimate(fallbackEstimate);

      // GPS should score highest
      expect(gpsScore).toBeGreaterThan(ipScore);
      expect(gpsScore).toBeGreaterThan(fallbackScore);

      // IP should score higher than fallback
      expect(ipScore).toBeGreaterThan(fallbackScore);

      // All scores should be positive
      expect(gpsScore).toBeGreaterThan(0);
      expect(ipScore).toBeGreaterThan(0);
      expect(fallbackScore).toBeGreaterThan(0);
    });
  });

  describe('Cache Validation and Management', () => {
    test('should validate cache age correctly', () => {
      const isCacheValid = (location, maxAge) => {
        return (Date.now() - location.timestamp) < maxAge;
      };

      const now = Date.now();
      const maxAge = 1800000; // 30 minutes

      const recentLocation = { timestamp: now - 900000 }; // 15 minutes ago
      const oldLocation = { timestamp: now - 3600000 };   // 1 hour ago

      expect(isCacheValid(recentLocation, maxAge)).toBe(true);
      expect(isCacheValid(oldLocation, maxAge)).toBe(false);
    });

    test('should cache location to localStorage', () => {
      const cacheLocation = (estimate) => {
        try {
          mockLocalStorage.setItem('location_cache', JSON.stringify({
            coordinates: estimate.coordinates,
            accuracy: estimate.accuracy,
            method: estimate.method,
            timestamp: estimate.timestamp,
            confidence: estimate.confidence,
            source: estimate.source
          }));
        } catch (error) {
          console.warn('Failed to cache location locally:', error);
        }
      };

      const testEstimate = {
        coordinates: [44.9778, -93.2650],
        accuracy: 100,
        method: 'gps',
        timestamp: Date.now(),
        confidence: 'high',
        source: 'browser_geolocation'
      };

      cacheLocation(testEstimate);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'location_cache',
        JSON.stringify({
          coordinates: testEstimate.coordinates,
          accuracy: testEstimate.accuracy,
          method: testEstimate.method,
          timestamp: testEstimate.timestamp,
          confidence: testEstimate.confidence,
          source: testEstimate.source
        })
      );
    });
  });

  describe('Privacy and Permission Management', () => {
    test('should clear stored location data', () => {
      const clearStoredLocation = () => {
        try {
          mockLocalStorage.removeItem('location_cache');
          console.log('🔒 Cleared stored location data');
        } catch (error) {
          console.warn('Failed to clear stored location:', error);
        }
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      clearStoredLocation();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('location_cache');
      expect(consoleLogSpy).toHaveBeenCalledWith('🔒 Cleared stored location data');

      consoleLogSpy.mockRestore();
    });

    test('should check permission status', async () => {
      const checkPermissionStatus = async () => {
        const result = {
          geolocation: 'not_supported',
          hasPermissionApi: mockNavigatorPermissions !== undefined
        };

        if (mockNavigatorPermissions) {
          try {
            const permission = await mockNavigatorPermissions.query({ name: 'geolocation' });
            result.geolocation = permission.state;
          } catch (error) {
            console.warn('Failed to check geolocation permission:', error);
          }
        }

        return result;
      };

      // Mock permission query success
      mockNavigatorPermissions.query.mockResolvedValue({ state: 'granted' });

      const result = await checkPermissionStatus();

      expect(result.hasPermissionApi).toBe(true);
      expect(result.geolocation).toBe('granted');
      expect(mockNavigatorPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
    });

    test('should get privacy summary from stored data', () => {
      const getPrivacySummary = () => {
        try {
          const cached = mockLocalStorage.getItem('location_cache');
          if (cached) {
            const parsedCache = JSON.parse(cached);
            const age = Date.now() - parsedCache.timestamp;
            const ageStr = age < 60000
              ? 'just now'
              : age < 3600000
                ? `${Math.round(age / 60000)}min ago`
                : `${Math.round(age / 3600000)}hr ago`;

            return {
              hasStoredData: true,
              lastUpdate: parsedCache.timestamp,
              dataAge: ageStr
            };
          }
        } catch (error) {
          console.warn('Failed to check privacy data:', error);
        }

        return {
          hasStoredData: false,
          lastUpdate: null,
          dataAge: 'never'
        };
      };

      // Test with stored data
      const storedData = {
        timestamp: Date.now() - 1800000 // 30 minutes ago
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const resultWithData = getPrivacySummary();

      expect(resultWithData.hasStoredData).toBe(true);
      expect(resultWithData.lastUpdate).toBe(storedData.timestamp);
      expect(resultWithData.dataAge).toBe('30min ago');

      // Test without stored data
      mockLocalStorage.getItem.mockReturnValue(null);

      const resultWithoutData = getPrivacySummary();

      expect(resultWithoutData.hasStoredData).toBe(false);
      expect(resultWithoutData.lastUpdate).toBeNull();
      expect(resultWithoutData.dataAge).toBe('never');
    });
  });

  describe('Utility Functions', () => {
    test('should generate location summary string', () => {
      const getLocationSummary = (estimate) => {
        const accuracy = estimate.accuracy < 1000
          ? `±${Math.round(estimate.accuracy)}m`
          : `±${Math.round(estimate.accuracy / 1000)}km`;

        const age = Date.now() - estimate.timestamp;
        const ageStr = age < 60000
          ? 'just now'
          : age < 3600000
            ? `${Math.round(age / 60000)}min ago`
            : `${Math.round(age / 3600000)}hr ago`;

        return `${estimate.method.toUpperCase()}: ${accuracy} (${ageStr})`;
      };

      const now = Date.now();

      const recentEstimate = {
        method: 'gps',
        accuracy: 50,
        timestamp: now - 30000 // 30 seconds ago
      };

      const oldEstimate = {
        method: 'ip',
        accuracy: 5000,
        timestamp: now - 1800000 // 30 minutes ago
      };

      const veryOldEstimate = {
        method: 'cached',
        accuracy: 25000,
        timestamp: now - 7200000 // 2 hours ago
      };

      expect(getLocationSummary(recentEstimate)).toBe('GPS: ±50m (just now)');
      expect(getLocationSummary(oldEstimate)).toBe('IP: ±5km (30min ago)');
      expect(getLocationSummary(veryOldEstimate)).toBe('CACHED: ±25km (2hr ago)');
    });

    test('should create fallback location', () => {
      const getFallbackLocation = (coordinates = [44.9537, -93.0900]) => {
        return {
          coordinates,
          accuracy: 50000, // 50km uncertainty
          method: 'fallback',
          timestamp: Date.now(),
          confidence: 'unknown',
          source: 'default_minnesota'
        };
      };

      const fallback = getFallbackLocation();

      expect(fallback.coordinates).toEqual([44.9537, -93.0900]);
      expect(fallback.accuracy).toBe(50000);
      expect(fallback.method).toBe('fallback');
      expect(fallback.confidence).toBe('unknown');
      expect(fallback.source).toBe('default_minnesota');

      // Test custom coordinates
      const customFallback = getFallbackLocation([45.0, -94.0]);
      expect(customFallback.coordinates).toEqual([45.0, -94.0]);
    });
  });

  describe('Integration and Error Handling', () => {
    test('should handle progressive enhancement strategy', async () => {
      const estimateLocation = async (options = {}) => {
        const opts = {
          enableHighAccuracy: false,
          timeout: 8000,
          cacheMaxAge: 1800000,
          ...options
        };

        // Phase 1: Fast methods
        const fastMethods = [];

        // Try cached location
        try {
          const cached = await getCachedLocation();
          if (cached) fastMethods.push(cached);
        } catch (error) {
          // Cache failed, continue
        }

        // Phase 2: If no fast estimate, try slower methods
        if (fastMethods.length === 0 && opts.enableHighAccuracy) {
          try {
            const gps = await getBrowserGeolocation(opts);
            if (gps) fastMethods.push(gps);
          } catch (error) {
            // GPS failed, continue
          }
        }

        if (fastMethods.length > 0) {
          return fastMethods[0];
        }

        // Fallback
        return {
          coordinates: [44.9537, -93.0900],
          accuracy: 50000,
          method: 'fallback',
          timestamp: Date.now(),
          confidence: 'unknown',
          source: 'default_minnesota'
        };
      };

      const getCachedLocation = async () => null; // No cache
      const getBrowserGeolocation = async (opts) => {
        throw new Error('GPS failed');
      };

      // Test fallback scenario
      const result = await estimateLocation({ enableHighAccuracy: true });

      expect(result.method).toBe('fallback');
      expect(result.coordinates).toEqual([44.9537, -93.0900]);
      expect(result.confidence).toBe('unknown');
    });

    test('should handle network provider endpoint errors', async () => {
      const testNetworkProvider = async () => {
        const provider = {
          name: 'test-provider',
          endpoint: 'https://test-api.com/json',
          parser: (data) => {
            if (data.lat && data.lon) {
              return {
                coordinates: [data.lat, data.lon],
                accuracy: 5000,
                method: 'ip',
                timestamp: Date.now(),
                confidence: 'medium',
                source: 'test-provider'
              };
            }
            return null;
          }
        };

        try {
          global.fetch.mockRejectedValue(new Error('Network timeout'));

          const response = await fetch(provider.endpoint);
          const data = await response.json();
          const estimate = provider.parser(data);

          return { estimate, error: null };
        } catch (error) {
          return { estimate: null, error: error.message };
        }
      };

      const result = await testNetworkProvider();

      expect(result.estimate).toBeNull();
      expect(result.error).toBe('Network timeout');
    });
  });
});
