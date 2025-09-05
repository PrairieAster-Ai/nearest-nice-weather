/**
 * API Health Integration Tests
 * Testing API endpoints and database connectivity
 */

import { createMockPOI } from '../../fixtures/poi-data.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

describe('API Health Tests', () => {
  describe('Health Endpoint', () => {
    test('should respond with 200 and health status', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data.status).toBe('healthy');
    });

    test('should include database connectivity status', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();

      expect(data).toHaveProperty('database');
      expect(data.database).toHaveProperty('status');
      expect(['connected', 'disconnected']).toContain(data.database.status);
    });
  });

  describe('Weather Locations Endpoint', () => {
    test('should return POI list with proper structure', async () => {
      const response = await fetch(`${API_BASE_URL}/api/weather-locations?limit=5`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const poi = data[0];
        expect(poi).toHaveProperty('id');
        expect(poi).toHaveProperty('name');
        expect(poi).toHaveProperty('latitude');
        expect(poi).toHaveProperty('longitude');
      }
    });

    test('should respect limit parameter', async () => {
      const limit = 3;
      const response = await fetch(`${API_BASE_URL}/api/weather-locations?limit=${limit}`);
      const data = await response.json();

      expect(data.length).toBeLessThanOrEqual(limit);
    });

    test('should handle invalid limit gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/weather-locations?limit=invalid`);
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Feedback Endpoint', () => {
    test('should accept feedback submission', async () => {
      const feedback = {
        rating: 5,
        comment: 'Test feedback from API integration test',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback)
      });

      expect([200, 201]).toContain(response.status);
    });

    test('should handle invalid feedback data', async () => {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' })
      });

      expect([200, 400, 422]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await fetch(`${API_BASE_URL}/api/non-existent-endpoint`);
      expect(response.status).toBe(404);
    });

    test('should handle CORS headers correctly', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });
});
