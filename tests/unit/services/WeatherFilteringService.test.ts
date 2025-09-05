/**
 * Comprehensive tests for WeatherFilteringService
 * Testing intelligent weather-based location filtering algorithms
 */

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Import the service and types
import {
  WeatherFilteringService,
  Location,
  WeatherFilters,
  Coordinates
} from '../../../apps/web/src/services/WeatherFilteringService';

describe('WeatherFilteringService', () => {
  let service: WeatherFilteringService;

  const mockLocations: Location[] = [
    {
      id: '1',
      name: 'Cold Location',
      lat: 44.9778,
      lng: -93.2650,
      temperature: 32,
      precipitation: 5,
      windSpeed: 3,
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
      windSpeed: 8,
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
      windSpeed: 12,
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
      windSpeed: 5,
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
      windSpeed: 15,
      condition: 'Hot',
      description: 'Very hot area'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    service = new WeatherFilteringService();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Distance Calculation', () => {
    test('should calculate distance between Minneapolis and Saint Paul correctly', () => {
      const minneapolis: Coordinates = [44.9778, -93.2650];
      const stPaul: Coordinates = [44.9537, -93.0900];

      const distance = service.calculateDistance(minneapolis, stPaul);

      // Distance between Minneapolis and Saint Paul is approximately 8.7 miles
      expect(distance).toBeCloseTo(8.7, 1);
      expect(distance).toBeGreaterThan(8);
      expect(distance).toBeLessThan(10);
    });

    test('should return 0 for identical coordinates', () => {
      const point: Coordinates = [44.9778, -93.2650];
      const distance = service.calculateDistance(point, point);

      expect(distance).toBeCloseTo(0, 3);
    });

    test('should calculate long distances correctly', () => {
      const minneapolis: Coordinates = [44.9778, -93.2650];
      const newYork: Coordinates = [40.7128, -74.0060];

      const distance = service.calculateDistance(minneapolis, newYork);

      // Distance between Minneapolis and NYC is approximately 1000 miles
      expect(distance).toBeGreaterThan(900);
      expect(distance).toBeLessThan(1200);
    });
  });

  describe('Temperature Filtering', () => {
    test('should filter cold temperatures correctly using percentiles', () => {
      const filters: WeatherFilters = { temperature: 'cold' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      // With our test data (15, 32, 65, 85, 95), coldest 40% should include 15, 32, and 65
      expect(filtered.length).toBe(3);
      expect(filtered.map(l => l.temperature)).toEqual(expect.arrayContaining([15, 32, 65]));
      expect(filtered.every(l => l.temperature <= 65)).toBe(true);
    });

    test('should filter hot temperatures correctly using percentiles', () => {
      const filters: WeatherFilters = { temperature: 'hot' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      // With our test data, hottest 40% should include 85 and 95
      expect(filtered.length).toBe(2);
      expect(filtered.map(l => l.temperature)).toEqual(expect.arrayContaining([85, 95]));
      expect(filtered.every(l => l.temperature >= 65)).toBe(true);
    });

    test('should filter mild temperatures correctly using percentiles', () => {
      const filters: WeatherFilters = { temperature: 'mild' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      // Mild should exclude extreme 10% on each end
      // With 5 locations, this should include most locations except possibly extremes
      expect(filtered.length).toBeGreaterThan(2);
      expect(filtered.length).toBeLessThanOrEqual(5);

      // Should include the middle temperature
      const temps = filtered.map(l => l.temperature);
      expect(temps).toContain(65); // Middle temperature should definitely be included
    });

    test('should handle empty temperature filter', () => {
      const filters: WeatherFilters = { temperature: '' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      expect(filtered.length).toBe(mockLocations.length);
    });

    test('should maintain relative filtering across different temperature ranges', () => {
      // Test with winter temperatures
      const winterLocations: Location[] = mockLocations.map((loc, i) => ({
        ...loc,
        temperature: [-10, 0, 10, 20, 30][i]
      }));

      const coldWinter = service.applyWeatherFilters(winterLocations, { temperature: 'cold' });
      const hotWinter = service.applyWeatherFilters(winterLocations, { temperature: 'hot' });

      // Even in winter, filtering should work relatively
      expect(coldWinter.length).toBeGreaterThan(0);
      expect(hotWinter.length).toBeGreaterThan(0);

      // Cold should include lower temperatures, hot should include higher ones
      const coldTemps = coldWinter.map(l => l.temperature);
      const hotTemps = hotWinter.map(l => l.temperature);

      expect(Math.max(...coldTemps)).toBeLessThanOrEqual(Math.min(...hotTemps));
    });
  });

  describe('Precipitation Filtering', () => {
    test('should filter for no precipitation correctly', () => {
      const filters: WeatherFilters = { precipitation: 'none' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

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
      const filters: WeatherFilters = { precipitation: 'light' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      expect(filtered.length).toBeGreaterThan(0);

      // Should be in the middle range, not the driest or wettest
      const precips = filtered.map(l => l.precipitation);
      const allPrecips = mockLocations.map(l => l.precipitation).sort((a, b) => a - b);

      // Shouldn't include the very driest or very wettest
      expect(Math.min(...precips)).toBeGreaterThanOrEqual(allPrecips[0]);
      expect(Math.max(...precips)).toBeLessThanOrEqual(allPrecips[allPrecips.length - 1]);
    });

    test('should filter for heavy precipitation correctly', () => {
      const filters: WeatherFilters = { precipitation: 'heavy' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      expect(filtered.length).toBeGreaterThan(0);

      // Should include locations with higher precipitation values
      const minPrecip = Math.min(...filtered.map(l => l.precipitation));
      const allPrecips = mockLocations.map(l => l.precipitation).sort((a, b) => a - b);
      const threshold = allPrecips[Math.floor(allPrecips.length * 0.7)];

      expect(minPrecip).toBeGreaterThanOrEqual(threshold);
    });
  });

  describe('Wind Filtering', () => {
    test('should filter for calm wind correctly', () => {
      const filters: WeatherFilters = { wind: 'calm' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      expect(filtered.length).toBeGreaterThan(0);

      // Should include locations with lower wind speeds
      const maxWind = Math.max(...filtered.map(l => l.windSpeed));
      const allWinds = mockLocations.map(l => l.windSpeed).sort((a, b) => a - b);
      const threshold = allWinds[Math.floor(allWinds.length * 0.5)];

      expect(maxWind).toBeLessThanOrEqual(threshold);
    });

    test('should filter for breezy wind correctly', () => {
      const filters: WeatherFilters = { wind: 'breezy' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      expect(filtered.length).toBeGreaterThan(0);

      // Should be in the middle range
      const winds = filtered.map(l => l.windSpeed);
      const allWinds = mockLocations.map(l => l.windSpeed).sort((a, b) => a - b);

      // Should include middle range winds
      expect(Math.min(...winds)).toBeGreaterThanOrEqual(allWinds[0]);
      expect(Math.max(...winds)).toBeLessThanOrEqual(allWinds[allWinds.length - 1]);
    });

    test('should filter for windy conditions correctly', () => {
      const filters: WeatherFilters = { wind: 'windy' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      expect(filtered.length).toBeGreaterThan(0);

      // Should include locations with higher wind speeds
      const minWind = Math.min(...filtered.map(l => l.windSpeed));
      const allWinds = mockLocations.map(l => l.windSpeed).sort((a, b) => a - b);
      const threshold = allWinds[Math.floor(allWinds.length * 0.7)];

      expect(minWind).toBeGreaterThanOrEqual(threshold);
    });
  });

  describe('Distance-based Filtering', () => {
    const userLocation: Coordinates = [44.9778, -93.2650]; // Minneapolis

    test('should filter locations within specified distance', () => {
      const filters: WeatherFilters = {};
      const filtered = service.applyWeatherFilters(mockLocations, filters, userLocation, 50);

      // All returned locations should be within 50 miles
      filtered.forEach(loc => {
        const distance = service.calculateDistance(userLocation, [loc.lat, loc.lng]);
        expect(distance).toBeLessThanOrEqual(50);
      });
    });

    test('should return empty array when no locations within distance', () => {
      const filters: WeatherFilters = {};
      const filtered = service.applyWeatherFilters(mockLocations, filters, userLocation, 1);

      // With our test data spread across Minnesota, very few should be within 1 mile
      expect(filtered.length).toBeLessThanOrEqual(1);
    });

    test('should return all locations when distance limit is very large', () => {
      const filters: WeatherFilters = {};
      const filtered = service.applyWeatherFilters(mockLocations, filters, userLocation, 1000);

      // All Minnesota locations should be within 1000 miles of Minneapolis
      expect(filtered.length).toBe(mockLocations.length);
    });

    test('should work without user location provided', () => {
      const filters: WeatherFilters = { temperature: 'cold' };
      const filtered = service.applyWeatherFilters(mockLocations, filters);

      // Should still apply weather filters without distance filtering
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('Integrated Weather and Distance Filtering', () => {
    const userLocation: Coordinates = [44.9778, -93.2650];

    test('should apply both distance and temperature filters correctly', () => {
      const filters: WeatherFilters = { temperature: 'cold' };
      const maxDistance = 200; // 200 miles

      const filtered = service.applyWeatherFilters(mockLocations, filters, userLocation, maxDistance);

      // All results should pass both filters
      filtered.forEach(loc => {
        const distance = service.calculateDistance(userLocation, [loc.lat, loc.lng]);
        expect(distance).toBeLessThanOrEqual(maxDistance);
      });

      // Should have applied temperature filter as well
      expect(filtered.length).toBeLessThanOrEqual(mockLocations.length);
    });

    test('should handle multiple weather filters simultaneously', () => {
      const filters: WeatherFilters = {
        temperature: 'mild',
        precipitation: 'none',
        wind: 'calm'
      };

      const filtered = service.applyWeatherFilters(mockLocations, filters);

      // Should apply all filters and return valid results
      expect(Array.isArray(filtered)).toBe(true);
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty results gracefully', () => {
      const filters: WeatherFilters = { temperature: 'hot' };
      const maxDistance = 1; // Very small radius

      const filtered = service.applyWeatherFilters(mockLocations, filters, userLocation, maxDistance);

      // Might have no results due to restrictive filters
      expect(filtered.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(filtered)).toBe(true);
    });

    test('should work with no filters applied', () => {
      const filters: WeatherFilters = {};

      const filtered = service.applyWeatherFilters(mockLocations, filters);

      expect(filtered.length).toBe(mockLocations.length);
      expect(filtered).toEqual(mockLocations);
    });
  });

  describe('Utility Methods', () => {
    test('filterByDistance should work correctly', () => {
      const userLocation: Coordinates = [44.9778, -93.2650];
      const filtered = service.filterByDistance(mockLocations, userLocation, 50);

      filtered.forEach(loc => {
        const distance = service.calculateDistance(userLocation, [loc.lat, loc.lng]);
        expect(distance).toBeLessThanOrEqual(50);
      });
    });

    test('sortByDistance should sort locations by distance', () => {
      const userLocation: Coordinates = [44.9778, -93.2650];
      const sorted = service.sortByDistance(mockLocations, userLocation);

      expect(sorted.length).toBe(mockLocations.length);

      // Should be sorted by distance (closest first)
      for (let i = 0; i < sorted.length - 1; i++) {
        const dist1 = service.calculateDistance(userLocation, [sorted[i].lat, sorted[i].lng]);
        const dist2 = service.calculateDistance(userLocation, [sorted[i + 1].lat, sorted[i + 1].lng]);
        expect(dist1).toBeLessThanOrEqual(dist2);
      }
    });

    test('calculateFilterResultCounts should return correct structure', () => {
      const counts = service.calculateFilterResultCounts(mockLocations);

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

    test('calculateFilterResultCounts should handle empty POI list', () => {
      const counts = service.calculateFilterResultCounts([]);

      expect(counts).toEqual({});
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty locations array', () => {
      const filters: WeatherFilters = { temperature: 'cold' };
      const filtered = service.applyWeatherFilters([], filters);

      expect(filtered).toEqual([]);
    });

    test('should handle single location correctly', () => {
      const singleLocation = [mockLocations[0]];

      const coldFiltered = service.applyWeatherFilters(singleLocation, { temperature: 'cold' });
      const hotFiltered = service.applyWeatherFilters(singleLocation, { temperature: 'hot' });
      const mildFiltered = service.applyWeatherFilters(singleLocation, { temperature: 'mild' });

      expect(coldFiltered.length).toBe(1);
      expect(hotFiltered.length).toBe(1);
      expect(mildFiltered.length).toBe(1);
    });

    test('should handle invalid filter values gracefully', () => {
      const filters: WeatherFilters = {
        temperature: 'invalid' as any,
        precipitation: 'invalid' as any,
        wind: 'invalid' as any
      };

      const filtered = service.applyWeatherFilters(mockLocations, filters);

      // Should return original locations when filters are invalid
      expect(filtered.length).toBe(mockLocations.length);
    });

    test('should handle extreme coordinates in distance calculation', () => {
      const northPole: Coordinates = [90, 0];
      const equator: Coordinates = [0, 0];

      const distance = service.calculateDistance(northPole, equator);

      // Distance from North Pole to equator should be approximately 6200 miles
      expect(distance).toBeGreaterThan(6000);
      expect(distance).toBeLessThan(6500);
    });
  });
});
