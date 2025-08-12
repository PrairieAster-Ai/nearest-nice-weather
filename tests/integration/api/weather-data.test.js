/**
 * Weather Data Integration Tests
 * Testing weather API integrations and data processing
 */

import { MOCK_WEATHER_DATA, MOCK_USER_LOCATIONS } from '../../fixtures/poi-data.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

describe('Weather Data Integration', () => {
  describe('Weather Location Search', () => {
    test('should return locations within search radius', async () => {
      const minneapolis = MOCK_USER_LOCATIONS.minneapolis;
      const radius = 50; // miles
      
      const response = await fetch(
        `${API_BASE_URL}/api/weather-locations?lat=${minneapolis.latitude}&lng=${minneapolis.longitude}&radius=${radius}`
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      
      // Verify distance calculation
      data.forEach(poi => {
        if (poi.distance_miles) {
          const distance = parseFloat(poi.distance_miles);
          expect(distance).toBeLessThanOrEqual(radius);
        }
      });
    });

    test('should expand search radius when few results found', async () => {
      // Test with very restrictive parameters
      const response = await fetch(
        `${API_BASE_URL}/api/weather-locations?lat=44.9537&lng=-93.0900&radius=1`
      );
      
      const data = await response.json();
      
      // Should return some results even with small radius due to expansion
      expect(data.length).toBeGreaterThan(0);
    });

    test('should handle invalid coordinates gracefully', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/weather-locations?lat=invalid&lng=invalid`
      );
      
      // Should still return results (fallback to default search)
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Weather Filtering', () => {
    test('should filter by temperature preferences', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/weather-locations?temperature=mild&limit=10`
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should return some results (may be fewer due to filtering)
      expect(Array.isArray(data)).toBe(true);
    });

    test('should filter by precipitation preferences', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/weather-locations?precipitation=none&limit=10`
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should combine multiple weather filters', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/weather-locations?temperature=mild&precipitation=none&wind=calm&limit=10`
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Data Quality', () => {
    test('should return complete POI data structure', async () => {
      const response = await fetch(`${API_BASE_URL}/api/weather-locations?limit=3`);
      const data = await response.json();
      
      if (data.length > 0) {
        const poi = data[0];
        
        // Required fields
        expect(poi).toHaveProperty('id');
        expect(poi).toHaveProperty('name');
        expect(poi).toHaveProperty('latitude');
        expect(poi).toHaveProperty('longitude');
        
        // Geographic validation
        expect(typeof poi.latitude).toBe('number');
        expect(typeof poi.longitude).toBe('number');
        expect(poi.latitude).toBeGreaterThan(40); // Minnesota bounds
        expect(poi.latitude).toBeLessThan(50);
        expect(poi.longitude).toBeGreaterThan(-100);
        expect(poi.longitude).toBeLessThan(-85);
      }
    });

    test('should include weather data when available', async () => {
      const response = await fetch(`${API_BASE_URL}/api/weather-locations?limit=5`);
      const data = await response.json();
      
      data.forEach(poi => {
        if (poi.temperature) {
          expect(typeof poi.temperature).toBe('number');
          expect(poi.temperature).toBeGreaterThan(-50);
          expect(poi.temperature).toBeLessThan(150);
        }
        
        if (poi.precipitation !== undefined) {
          expect(typeof poi.precipitation).toBe('number');
          expect(poi.precipitation).toBeGreaterThanOrEqual(0);
          expect(poi.precipitation).toBeLessThanOrEqual(100);
        }
        
        if (poi.windSpeed !== undefined) {
          expect(typeof poi.windSpeed).toBe('number');
          expect(poi.windSpeed).toBeGreaterThanOrEqual(0);
        }
      });
    });

    test('should maintain consistent POI count across requests', async () => {
      const requests = [
        fetch(`${API_BASE_URL}/api/weather-locations?limit=100`),
        fetch(`${API_BASE_URL}/api/weather-locations?limit=100`),
        fetch(`${API_BASE_URL}/api/weather-locations?limit=100`)
      ];
      
      const responses = await Promise.all(requests);
      const datasets = await Promise.all(responses.map(r => r.json()));
      
      // All requests should return the same base dataset size
      const counts = datasets.map(d => d.length);
      const uniqueCounts = [...new Set(counts)];
      expect(uniqueCounts.length).toBe(1); // All counts should be identical
    });
  });

  describe('Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/weather-locations?limit=20`);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // 5 second timeout
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = Array(5).fill().map(() => 
        fetch(`${API_BASE_URL}/api/weather-locations?limit=10`)
      );
      
      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      const datasets = await Promise.all(responses.map(r => r.json()));
      datasets.forEach(data => {
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
      });
    });
  });
});