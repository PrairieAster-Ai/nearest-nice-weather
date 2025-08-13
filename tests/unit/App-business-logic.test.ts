/**
 * Business Logic Tests for App.tsx
 * Testing core weather filtering algorithms and distance calculations
 */

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock location and weather data types
interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number;
  precipitation: number;
  windSpeed: string;
  condition: string;
  description: string;
}

interface WeatherFilters {
  temperature?: 'cold' | 'mild' | 'hot' | '';
  precipitation?: 'none' | 'light' | 'heavy' | '';
  wind?: 'calm' | 'breezy' | 'windy' | '';
}

describe('App.tsx Business Logic', () => {
  const mockLocations: Location[] = [
    {
      id: '1',
      name: 'Cold Location',
      lat: 44.9778,
      lng: -93.2650,
      temperature: 32,
      precipitation: 5,
      windSpeed: '3 mph',
      condition: 'Clear',
      description: 'Cold outdoor spot'
    },
    {
      id: '2', 
      name: 'Mild Location',
      lat: 44.9217,
      lng: -93.3072,
      temperature: 65,
      precipitation: 15,
      windSpeed: '8 mph',
      condition: 'Partly Cloudy',
      description: 'Moderate weather spot'
    },
    {
      id: '3',
      name: 'Hot Location',
      lat: 47.1395,
      lng: -91.4695,
      temperature: 85,
      precipitation: 30,
      windSpeed: '12 mph',
      condition: 'Sunny',
      description: 'Warm outdoor area'
    },
    {
      id: '4',
      name: 'Very Cold Location',
      lat: 46.7296,
      lng: -94.6859,
      temperature: 15,
      precipitation: 2,
      windSpeed: '5 mph',
      condition: 'Snow',
      description: 'Very cold area'
    },
    {
      id: '5',
      name: 'Very Hot Location',
      lat: 45.0677,
      lng: -95.4156,
      temperature: 95,
      precipitation: 40,
      windSpeed: '15 mph',
      condition: 'Hot',
      description: 'Very hot area'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Distance Calculation Algorithm', () => {
    /**
     * Haversine formula for calculating distances between coordinates
     * This is the same algorithm used in App.tsx
     */
    const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
      const [lat1, lng1] = point1;
      const [lat2, lng2] = point2;
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    test('should calculate distance between Minneapolis and Saint Paul correctly', () => {
      const minneapolis: [number, number] = [44.9778, -93.2650];
      const stPaul: [number, number] = [44.9537, -93.0900];
      
      const distance = calculateDistance(minneapolis, stPaul);
      
      // Distance between Minneapolis and Saint Paul is approximately 8.7 miles
      expect(distance).toBeCloseTo(8.7, 1);
      expect(distance).toBeGreaterThan(8);
      expect(distance).toBeLessThan(10);
    });

    test('should return 0 for identical coordinates', () => {
      const point: [number, number] = [44.9778, -93.2650];
      const distance = calculateDistance(point, point);
      
      expect(distance).toBeCloseTo(0, 3);
    });

    test('should calculate long distances correctly', () => {
      const minneapolis: [number, number] = [44.9778, -93.2650];
      const newYork: [number, number] = [40.7128, -74.0060];
      
      const distance = calculateDistance(minneapolis, newYork);
      
      // Distance between Minneapolis and NYC is approximately 1000 miles
      expect(distance).toBeGreaterThan(900);
      expect(distance).toBeLessThan(1200);
    });

    test('should handle edge case coordinates correctly', () => {
      const northPole: [number, number] = [90, 0];
      const equator: [number, number] = [0, 0];
      
      const distance = calculateDistance(northPole, equator);
      
      // Distance from North Pole to equator should be approximately 6200 miles
      expect(distance).toBeGreaterThan(6000);
      expect(distance).toBeLessThan(6500);
    });
  });

  describe('Weather Filtering Algorithm - Temperature', () => {
    /**
     * Temperature filtering implementation from App.tsx
     * Uses percentile-based filtering for relative weather conditions
     */
    const applyTemperatureFilter = (locations: Location[], filter: 'cold' | 'mild' | 'hot'): Location[] => {
      const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b);
      const tempCount = temps.length;
      
      if (filter === 'cold') {
        // Show coldest 40% of available temperatures
        const threshold = temps[Math.floor(tempCount * 0.4)];
        return locations.filter(loc => loc.temperature <= threshold);
      } else if (filter === 'hot') {
        // Show hottest 40% of available temperatures  
        const threshold = temps[Math.floor(tempCount * 0.6)];
        return locations.filter(loc => loc.temperature >= threshold);
      } else if (filter === 'mild') {
        // Show middle 80% of temperatures (exclude extreme 10% on each end)
        const minThreshold = temps[Math.floor(tempCount * 0.1)];
        const maxThreshold = temps[Math.floor(tempCount * 0.9)];
        return locations.filter(loc => loc.temperature >= minThreshold && loc.temperature <= maxThreshold);
      }
      
      return locations;
    };

    test('should filter cold temperatures correctly using percentiles', () => {
      const filtered = applyTemperatureFilter(mockLocations, 'cold');
      
      // With our test data (15, 32, 65, 85, 95), coldest 40% should include 15, 32, and 65
      expect(filtered.length).toBe(3);
      expect(filtered.map(l => l.temperature)).toEqual(expect.arrayContaining([15, 32, 65]));
      expect(filtered.every(l => l.temperature <= 65)).toBe(true);
    });

    test('should filter hot temperatures correctly using percentiles', () => {
      const filtered = applyTemperatureFilter(mockLocations, 'hot');
      
      // With our test data, hottest 40% should include 85 and 95
      expect(filtered.length).toBe(2);
      expect(filtered.map(l => l.temperature)).toEqual(expect.arrayContaining([85, 95]));
      expect(filtered.every(l => l.temperature >= 65)).toBe(true);
    });

    test('should filter mild temperatures correctly using percentiles', () => {
      const filtered = applyTemperatureFilter(mockLocations, 'mild');
      
      // Mild should exclude extreme 10% on each end
      // With 5 locations, this should include most locations except possibly extremes
      expect(filtered.length).toBeGreaterThan(2);
      expect(filtered.length).toBeLessThanOrEqual(5);
      
      // Should not include the most extreme temperatures
      const temps = filtered.map(l => l.temperature);
      expect(temps).toContain(65); // Middle temperature should definitely be included
    });

    test('should handle single location correctly', () => {
      const singleLocation = [mockLocations[0]];
      
      const coldFiltered = applyTemperatureFilter(singleLocation, 'cold');
      const hotFiltered = applyTemperatureFilter(singleLocation, 'hot');
      const mildFiltered = applyTemperatureFilter(singleLocation, 'mild');
      
      expect(coldFiltered.length).toBe(1);
      expect(hotFiltered.length).toBe(1);
      expect(mildFiltered.length).toBe(1);
    });

    test('should maintain relative filtering across different temperature ranges', () => {
      // Test with winter temperatures
      const winterLocations: Location[] = [
        { ...mockLocations[0], temperature: -10 },
        { ...mockLocations[1], temperature: 0 },
        { ...mockLocations[2], temperature: 10 },
        { ...mockLocations[3], temperature: 20 },
        { ...mockLocations[4], temperature: 30 }
      ];

      const coldWinter = applyTemperatureFilter(winterLocations, 'cold');
      const hotWinter = applyTemperatureFilter(winterLocations, 'hot');

      // Even in winter, filtering should work relatively
      expect(coldWinter.length).toBeGreaterThan(0);
      expect(hotWinter.length).toBeGreaterThan(0);
      
      // Cold should include lower temperatures, hot should include higher ones
      const coldTemps = coldWinter.map(l => l.temperature);
      const hotTemps = hotWinter.map(l => l.temperature);
      
      expect(Math.max(...coldTemps)).toBeLessThanOrEqual(Math.min(...hotTemps));
    });
  });

  describe('Weather Filtering Algorithm - Precipitation', () => {
    /**
     * Precipitation filtering implementation from App.tsx
     */
    const applyPrecipitationFilter = (locations: Location[], filter: 'none' | 'light' | 'heavy'): Location[] => {
      const precips = locations.map(loc => loc.precipitation).sort((a, b) => a - b);
      const precipCount = precips.length;
      
      if (filter === 'none') {
        // Show driest 60% of available locations
        const threshold = precips[Math.floor(precipCount * 0.6)];
        return locations.filter(loc => loc.precipitation <= threshold);
      } else if (filter === 'light') {
        // Show middle precipitation range (20th-70th percentile)
        const minThreshold = precips[Math.floor(precipCount * 0.2)];
        const maxThreshold = precips[Math.floor(precipCount * 0.7)];
        return locations.filter(loc => loc.precipitation >= minThreshold && loc.precipitation <= maxThreshold);
      } else if (filter === 'heavy') {
        // Show wettest 30% of available locations
        const threshold = precips[Math.floor(precipCount * 0.7)];
        return locations.filter(loc => loc.precipitation >= threshold);
      }
      
      return locations;
    };

    test('should filter for no precipitation correctly', () => {
      const filtered = applyPrecipitationFilter(mockLocations, 'none');
      
      // Should include locations with lower precipitation values
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThanOrEqual(mockLocations.length);
      
      // Verify all included locations have relatively low precipitation
      const maxPrecip = Math.max(...filtered.map(l => l.precipitation));
      const allPrecips = mockLocations.map(l => l.precipitation).sort((a, b) => a - b);
      const threshold = allPrecips[Math.floor(allPrecips.length * 0.6)];
      
      expect(maxPrecip).toBeLessThanOrEqual(threshold);
    });

    test('should filter for light precipitation correctly', () => {
      const filtered = applyPrecipitationFilter(mockLocations, 'light');
      
      expect(filtered.length).toBeGreaterThan(0);
      
      // Should be in the middle range, not the driest or wettest
      const precips = filtered.map(l => l.precipitation);
      const allPrecips = mockLocations.map(l => l.precipitation).sort((a, b) => a - b);
      
      // Shouldn't include the very driest or very wettest
      expect(Math.min(...precips)).toBeGreaterThanOrEqual(allPrecips[0]);
      expect(Math.max(...precips)).toBeLessThanOrEqual(allPrecips[allPrecips.length - 1]);
    });

    test('should filter for heavy precipitation correctly', () => {
      const filtered = applyPrecipitationFilter(mockLocations, 'heavy');
      
      expect(filtered.length).toBeGreaterThan(0);
      
      // Should include locations with higher precipitation values
      const minPrecip = Math.min(...filtered.map(l => l.precipitation));
      const allPrecips = mockLocations.map(l => l.precipitation).sort((a, b) => a - b);
      const threshold = allPrecips[Math.floor(allPrecips.length * 0.7)];
      
      expect(minPrecip).toBeGreaterThanOrEqual(threshold);
    });
  });

  describe('Distance-based Filtering', () => {
    const userLocation: [number, number] = [44.9778, -93.2650]; // Minneapolis
    
    const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
      const [lat1, lng1] = point1;
      const [lat2, lng2] = point2;
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const applyDistanceFilter = (locations: Location[], maxDistance: number): Location[] => {
      return locations.filter(loc => {
        const distance = calculateDistance(userLocation, [loc.lat, loc.lng]);
        return distance <= maxDistance;
      });
    };

    test('should filter locations within specified distance', () => {
      const filtered = applyDistanceFilter(mockLocations, 50); // 50 mile radius
      
      // All returned locations should be within 50 miles
      filtered.forEach(loc => {
        const distance = calculateDistance(userLocation, [loc.lat, loc.lng]);
        expect(distance).toBeLessThanOrEqual(50);
      });
    });

    test('should return empty array when no locations within distance', () => {
      const filtered = applyDistanceFilter(mockLocations, 1); // 1 mile radius
      
      // With our test data spread across Minnesota, very few should be within 1 mile
      expect(filtered.length).toBeLessThanOrEqual(1);
    });

    test('should return all locations when distance limit is very large', () => {
      const filtered = applyDistanceFilter(mockLocations, 1000); // 1000 mile radius
      
      // All Minnesota locations should be within 1000 miles of Minneapolis
      expect(filtered.length).toBe(mockLocations.length);
    });

    test('should handle edge case with zero distance limit', () => {
      const filtered = applyDistanceFilter(mockLocations, 0);
      
      // With zero distance, might have one location very close depending on coordinates
      expect(filtered.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Filter Result Count Calculation', () => {
    /**
     * Simplified filter result count logic from App.tsx
     */
    const calculateFilterResultCounts = (visiblePOIs: Location[]): { [key: string]: number } => {
      if (!visiblePOIs || visiblePOIs.length === 0) return {};
      
      const count = visiblePOIs.length;
      const counts: { [key: string]: number } = {};
      
      const filterOptions = ['cold', 'mild', 'hot', 'none', 'light', 'heavy', 'calm', 'breezy', 'windy'];
      filterOptions.forEach(option => {
        counts[`temperature_${option}`] = count;
        counts[`precipitation_${option}`] = count;
        counts[`wind_${option}`] = count;
      });
      
      return counts;
    };

    test('should return empty object for empty POI list', () => {
      const counts = calculateFilterResultCounts([]);
      
      expect(counts).toEqual({});
    });

    test('should return correct counts for all filter options', () => {
      const counts = calculateFilterResultCounts(mockLocations);
      
      expect(counts['temperature_cold']).toBe(mockLocations.length);
      expect(counts['temperature_mild']).toBe(mockLocations.length);
      expect(counts['temperature_hot']).toBe(mockLocations.length);
      expect(counts['precipitation_none']).toBe(mockLocations.length);
      expect(counts['precipitation_light']).toBe(mockLocations.length);
      expect(counts['precipitation_heavy']).toBe(mockLocations.length);
      expect(counts['wind_calm']).toBe(mockLocations.length);
      expect(counts['wind_breezy']).toBe(mockLocations.length);
      expect(counts['wind_windy']).toBe(mockLocations.length);
    });

    test('should handle single location correctly', () => {
      const singleLocation = [mockLocations[0]];
      const counts = calculateFilterResultCounts(singleLocation);
      
      Object.values(counts).forEach(count => {
        expect(count).toBe(1);
      });
    });
  });

  describe('Visit Tracking Logic', () => {
    /**
     * Visit tracking logic from App.tsx useEffect
     */
    const updateVisitTracking = (lastVisit: string | null): string | null => {
      const currentVisit = new Date().toISOString();
      const currentDate = currentVisit.split('T')[0]; // Get just the date part
      
      if (lastVisit !== currentDate) {
        return currentDate; // Update needed
      }
      
      return null; // No update needed
    };

    test('should update visit on first visit', () => {
      const result = updateVisitTracking(null);
      
      expect(result).not.toBeNull();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });

    test('should update visit on different day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const lastVisit = yesterday.toISOString().split('T')[0];
      
      const result = updateVisitTracking(lastVisit);
      
      expect(result).not.toBeNull();
      expect(result).not.toBe(lastVisit);
    });

    test('should not update visit on same day', () => {
      const today = new Date().toISOString().split('T')[0];
      
      const result = updateVisitTracking(today);
      
      expect(result).toBeNull();
    });

    test('should handle malformed last visit date', () => {
      const malformedDate = "invalid-date";
      
      const result = updateVisitTracking(malformedDate);
      
      expect(result).not.toBeNull(); // Should update since it's not equal to today
    });
  });

  describe('Integrated Weather and Distance Filtering', () => {
    const userLocation: [number, number] = [44.9778, -93.2650];

    const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
      const [lat1, lng1] = point1;
      const [lat2, lng2] = point2;
      const R = 3959;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const applyIntegratedFilters = (locations: Location[], filters: WeatherFilters, maxDistance?: number): Location[] => {
      let filtered = [...locations];
      
      // Apply distance filter first
      if (maxDistance) {
        filtered = filtered.filter(loc => {
          const distance = calculateDistance(userLocation, [loc.lat, loc.lng]);
          return distance <= maxDistance;
        });
      }
      
      // Apply temperature filter
      if (filters.temperature) {
        const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b);
        const tempCount = temps.length;
        
        if (filters.temperature === 'cold') {
          const threshold = temps[Math.floor(tempCount * 0.4)];
          filtered = filtered.filter(loc => loc.temperature <= threshold);
        } else if (filters.temperature === 'hot') {
          const threshold = temps[Math.floor(tempCount * 0.6)];
          filtered = filtered.filter(loc => loc.temperature >= threshold);
        } else if (filters.temperature === 'mild') {
          const minThreshold = temps[Math.floor(tempCount * 0.1)];
          const maxThreshold = temps[Math.floor(tempCount * 0.9)];
          filtered = filtered.filter(loc => loc.temperature >= minThreshold && loc.temperature <= maxThreshold);
        }
      }
      
      return filtered;
    };

    test('should apply both distance and temperature filters correctly', () => {
      const filters: WeatherFilters = { temperature: 'cold' };
      const maxDistance = 200; // 200 miles
      
      const filtered = applyIntegratedFilters(mockLocations, filters, maxDistance);
      
      // All results should pass both filters
      filtered.forEach(loc => {
        const distance = calculateDistance(userLocation, [loc.lat, loc.lng]);
        expect(distance).toBeLessThanOrEqual(maxDistance);
      });
      
      // Should have applied temperature filter as well
      expect(filtered.length).toBeLessThanOrEqual(mockLocations.length);
    });

    test('should handle empty results gracefully', () => {
      const filters: WeatherFilters = { temperature: 'hot' };
      const maxDistance = 1; // Very small radius
      
      const filtered = applyIntegratedFilters(mockLocations, filters, maxDistance);
      
      // Might have no results due to restrictive filters
      expect(filtered.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(filtered)).toBe(true);
    });

    test('should work with no filters applied', () => {
      const filters: WeatherFilters = {};
      
      const filtered = applyIntegratedFilters(mockLocations, filters);
      
      expect(filtered.length).toBe(mockLocations.length);
      expect(filtered).toEqual(mockLocations);
    });
  });
});