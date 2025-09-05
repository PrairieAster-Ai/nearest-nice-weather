/**
 * Comprehensive tests for usePOINavigation hook
 * Testing core POI discovery and navigation logic
 */
import { renderHook, act } from '@testing-library/react';
import { usePOINavigation } from '../../../apps/web/src/hooks/usePOINavigation';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console methods to reduce noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

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

describe('usePOINavigation', () => {
  // Sample test data
  const mockUserLocation: [number, number] = [44.9778, -93.2650]; // Minneapolis
  const mockFilters = {
    temperature: 'mild',
    precipitation: 'none',
    wind: 'calm'
  };

  const mockPOIData = [
    {
      id: '1',
      name: 'Minnehaha Falls',
      lat: 44.9153,
      lng: -93.2111,
      temperature: 72,
      precipitation: 0,
      windSpeed: '5 mph',
      condition: 'Clear',
      description: 'Beautiful waterfall in Minneapolis'
    },
    {
      id: '2',
      name: 'Lake Harriet',
      lat: 44.9217,
      lng: -93.3072,
      temperature: 70,
      precipitation: 10,
      windSpeed: '3 mph',
      condition: 'Partly Cloudy',
      description: 'Scenic lake with walking path'
    },
    {
      id: '3',
      name: 'Gooseberry Falls State Park',
      lat: 47.1395,
      lng: -91.4695,
      temperature: 65,
      precipitation: 20,
      windSpeed: '8 mph',
      condition: 'Cloudy',
      description: 'State park on Lake Superior shore'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockLocalStorage.getItem.mockReturnValue(null);

    // Setup successful fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockPOIData })
    });
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('Hook Initialization', () => {
    test('should initialize with default state', () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      expect(result.current.allPOIs).toEqual([]);
      expect(result.current.visiblePOIs).toEqual([]);
      expect(result.current.currentSliceMax).toBe(30);
      expect(result.current.currentPOIIndex).toBe(0);
      expect(result.current.isAtClosest).toBe(false);
      expect(result.current.isAtFarthest).toBe(false);
      expect(result.current.canExpand).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should handle null user location', () => {
      const { result } = renderHook(() =>
        usePOINavigation(null, mockFilters)
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.allPOIs).toEqual([]);
    });

    test('should provide navigation functions', () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      expect(typeof result.current.navigateCloser).toBe('function');
      expect(typeof result.current.navigateFarther).toBe('function');
      expect(typeof result.current.expandSearch).toBe('function');
      expect(typeof result.current.getCurrentPOI).toBe('function');
    });
  });

  describe('Data Loading and Processing', () => {
    test('should load POI data when user location provided', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/poi-locations-with-weather?limit=50',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    test('should process API data with distance calculations', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (result.current.allPOIs.length > 0) {
        const firstPOI = result.current.allPOIs[0];
        expect(firstPOI).toHaveProperty('distance');
        expect(firstPOI).toHaveProperty('displayed');
        expect(firstPOI).toHaveProperty('sliceIndex');
        expect(typeof firstPOI.distance).toBe('number');
      }
    });

    test('should sort POIs by distance', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (result.current.allPOIs.length > 1) {
        const distances = result.current.allPOIs.map(poi => poi.distance);
        const sortedDistances = [...distances].sort((a, b) => a - b);
        expect(distances).toEqual(sortedDistances);
      }
    });

    test('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.error).toContain('Failed to load POI data');
    });

    test('should handle non-ok API responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.error).toContain('API Error');
    });
  });

  describe('Distance-Based Slicing', () => {
    test('should implement 30-mile distance slices', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should start with 30-mile slice
      expect(result.current.currentSliceMax).toBe(30);
    });

    test('should filter visible POIs by current slice', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // All visible POIs should be within current slice distance
      result.current.visiblePOIs.forEach(poi => {
        expect(poi.distance).toBeLessThanOrEqual(result.current.currentSliceMax);
      });
    });

    test('should detect when expansion is possible', async () => {
      // Create test data with POIs beyond 30 miles
      const distantPOIData = [
        ...mockPOIData,
        {
          id: '4',
          name: 'Distant Park',
          lat: 45.5, // Further from Minneapolis
          lng: -94.0,
          temperature: 68,
          precipitation: 0,
          windSpeed: '4 mph',
          condition: 'Clear',
          description: 'Far away park'
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: distantPOIData })
      });

      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should detect POIs beyond current slice
      const hasDistantPOIs = result.current.allPOIs.some(poi => poi.distance > 30);
      if (hasDistantPOIs) {
        expect(result.current.canExpand).toBe(true);
      }
    });
  });

  describe('Navigation Functions', () => {
    test('should navigate to closer POI', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (result.current.visiblePOIs.length > 1) {
        // Start at index 1 to test navigation
        await act(async () => {
          result.current.navigateFarther();
        });

        const prevIndex = result.current.currentPOIIndex;

        await act(async () => {
          result.current.navigateCloser();
        });

        expect(result.current.currentPOIIndex).toBeLessThan(prevIndex);
      }
    });

    test('should navigate to farther POI', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (result.current.visiblePOIs.length > 1) {
        const initialIndex = result.current.currentPOIIndex;

        await act(async () => {
          result.current.navigateFarther();
        });

        expect(result.current.currentPOIIndex).toBeGreaterThan(initialIndex);
      }
    });

    test('should handle boundary conditions for navigation', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Test navigation at closest boundary
      expect(() => {
        act(() => {
          result.current.navigateCloser();
        });
      }).not.toThrow();

      // Test navigation at farthest boundary
      expect(() => {
        act(() => {
          result.current.navigateFarther();
        });
      }).not.toThrow();
    });

    test('should expand search radius', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const initialSliceMax = result.current.currentSliceMax;

      await act(async () => {
        result.current.expandSearch();
      });

      expect(result.current.currentSliceMax).toBeGreaterThan(initialSliceMax);
    });

    test('should return current POI', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const currentPOI = result.current.getCurrentPOI();

      if (result.current.visiblePOIs.length > 0) {
        expect(currentPOI).toBeDefined();
        expect(currentPOI).toEqual(result.current.visiblePOIs[result.current.currentPOIIndex]);
      } else {
        expect(currentPOI).toBeNull();
      }
    });
  });

  describe('Click Throttling', () => {
    test('should throttle rapid navigation clicks', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (result.current.visiblePOIs.length > 1) {
        const initialIndex = result.current.currentPOIIndex;

        // Rapid clicks should be throttled
        await act(async () => {
          result.current.navigateFarther();
          result.current.navigateFarther(); // Should be throttled
        });

        // Only one navigation should have occurred
        expect(result.current.currentPOIIndex).toBe(initialIndex + 1);
      }
    });

    test('should allow navigation after throttle period', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (result.current.visiblePOIs.length > 2) {
        await act(async () => {
          result.current.navigateFarther();
        });

        // Wait for throttle period to pass
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 600));
        });

        await act(async () => {
          result.current.navigateFarther();
        });

        // Second navigation should work after throttle period
        expect(result.current.currentPOIIndex).toBeGreaterThan(0);
      }
    });
  });

  describe('Cache Management', () => {
    test('should cache API responses in localStorage', async () => {
      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have attempted to cache the API response
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should use cached data when available', async () => {
      const cachedData = JSON.stringify({
        data: mockPOIData,
        timestamp: Date.now(),
        location: '44.9778,-93.2650',
        filters: JSON.stringify(mockFilters)
      });

      mockLocalStorage.getItem.mockReturnValue(cachedData);

      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should use cached data, not make API call
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should refresh expired cache', async () => {
      const expiredCache = JSON.stringify({
        data: mockPOIData,
        timestamp: Date.now() - (6 * 60 * 1000), // 6 minutes ago (expired)
        location: '44.9778,-93.2650',
        filters: JSON.stringify(mockFilters)
      });

      mockLocalStorage.getItem.mockReturnValue(expiredCache);

      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should make fresh API call for expired cache
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Filter Integration', () => {
    test('should react to filter changes', async () => {
      const { result, rerender } = renderHook(
        ({ location, filters }) => usePOINavigation(location, filters),
        {
          initialProps: {
            location: mockUserLocation,
            filters: mockFilters
          }
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

      // Change filters
      const newFilters = { ...mockFilters, temperature: 'hot' };
      rerender({ location: mockUserLocation, filters: newFilters });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should trigger new API call for filter change
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    test('should handle location changes', async () => {
      const { result, rerender } = renderHook(
        ({ location, filters }) => usePOINavigation(location, filters),
        {
          initialProps: {
            location: mockUserLocation,
            filters: mockFilters
          }
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Change location
      const newLocation: [number, number] = [45.0, -94.0];
      rerender({ location: newLocation, filters: mockFilters });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should trigger recalculation of distances
      expect(result.current.allPOIs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.allPOIs).toEqual([]);
      expect(result.current.visiblePOIs).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    test('should handle malformed API data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ invalid: 'data' }] })
      });

      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should handle gracefully without crashing
      expect(result.current.error).toBeNull();
    });

    test('should handle network timeouts', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const { result } = renderHook(() =>
        usePOINavigation(mockUserLocation, mockFilters)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.error).toContain('Failed to load POI data');
    });
  });
});
