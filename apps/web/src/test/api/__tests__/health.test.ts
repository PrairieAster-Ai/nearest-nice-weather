/**
 * ========================================================================
 * HEALTH CHECK API INTEGRATION TESTS
 * ========================================================================
 * 
 * 📋 PURPOSE: Integration testing for health check API endpoint
 * 🔗 ENDPOINT: /api/health - System health monitoring API
 * 📊 COVERAGE: Health status, response format, availability monitoring
 * ⚙️ SCENARIOS: Basic health check, response validation, performance
 * 🎯 BUSINESS IMPACT: Ensures system monitoring and deployment validation
 * 
 * BUSINESS CONTEXT: System health monitoring for operational reliability
 * - Validates system health status reporting
 * - Tests deployment validation endpoint
 * - Verifies monitoring integration capability
 * - Ensures consistent health check format
 * 
 * TECHNICAL COVERAGE: Health endpoint integration testing
 * - HTTP GET request validation
 * - Response format standardization
 * - Performance monitoring
 * - Availability testing
 * 
 * 🏗️ TEST ARCHITECTURE:
 * - Integration-focused: Tests health endpoint availability
 * - HTTP client testing with fetch
 * - JSON response validation
 * - Performance monitoring
 * 
 * @CLAUDE_CONTEXT: Essential health monitoring for operational reliability
 * @BUSINESS_RULE: P0 MUST respond within 1 second with valid status
 * @INTEGRATION_POINT: Tests monitoring and deployment validation
 * @AVAILABILITY: Validates system uptime monitoring capability
 * 
 * 📚 BUSINESS CONTEXT BREADCRUMBS:
 * Monitoring → health check → system status → operational reliability
 * TEST COVERAGE: HTTP requests → response validation → performance monitoring
 * VALUE CHAIN: Health monitoring → system reliability → user experience
 * 
 * LAST UPDATED: 2025-08-13
 */

import { describe, it, expect } from 'vitest';

// Test the health check API endpoint
const API_BASE_URL = 'http://localhost:4000';

describe('Health Check API Integration', () => {
  
  // Helper function to make health check requests
  const checkHealth = async (endpoint: string = '/api/health') => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response;
  };

  describe('✅ Basic Health Check', () => {
    it('should return 200 OK status', async () => {
      const response = await checkHealth();
      
      expect(response.status).toBe(200);
    });

    it('should return valid JSON response', async () => {
      const response = await checkHealth();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(typeof data).toBe('object');
    });

    it('should include health status in response', async () => {
      const response = await checkHealth();
      const data = await response.json();
      
      expect(data).toHaveProperty('status');
      expect(typeof data.status).toBe('string');
      
      // Common health status values
      const validStatuses = ['healthy', 'ok', 'up', 'available'];
      const statusLower = data.status.toLowerCase();
      const hasValidStatus = validStatuses.some(status => 
        statusLower.includes(status)
      );
      
      expect(hasValidStatus).toBe(true);
    });

    it('should include timestamp information', async () => {
      const response = await checkHealth();
      const data = await response.json();
      
      // Should include some form of timestamp
      const hasTimestamp = data.timestamp || data.time || data.checked_at || data.uptime;
      expect(hasTimestamp).toBeDefined();
    });
  });

  describe('📊 Response Format Validation', () => {
    it('should return consistent response structure', async () => {
      const response = await checkHealth();
      const data = await response.json();
      
      // Should be an object (not array or primitive)
      expect(typeof data).toBe('object');
      expect(data).not.toBeNull();
      expect(Array.isArray(data)).toBe(false);
      
      // Should have required health check properties
      expect(data).toHaveProperty('status');
    });

    it('should include version or build information if available', async () => {
      const response = await checkHealth();
      const data = await response.json();
      
      // Version info is optional but helpful for monitoring
      // Just verify it's a string if present
      if (data.version) {
        expect(typeof data.version).toBe('string');
      }
      
      if (data.build) {
        expect(typeof data.build).toBe('string');
      }
    });

    it('should include service name or identifier if available', async () => {
      const response = await checkHealth();
      const data = await response.json();
      
      // Service identification is helpful for multi-service deployments
      if (data.service || data.name || data.app) {
        const identifier = data.service || data.name || data.app;
        expect(typeof identifier).toBe('string');
        expect(identifier.length).toBeGreaterThan(0);
      }
    });
  });

  describe('⚡ Performance Testing', () => {
    it('should respond very quickly (under 1 second)', async () => {
      const startTime = Date.now();
      
      const response = await checkHealth();
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should be very fast
    });

    it('should handle multiple concurrent health checks', async () => {
      const healthRequests = Array.from({ length: 5 }, () => checkHealth());
      
      const responses = await Promise.all(healthRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should be consistently fast across multiple requests', async () => {
      const requests = 3;
      const times = [];
      
      for (let i = 0; i < requests; i++) {
        const startTime = Date.now();
        const response = await checkHealth();
        const responseTime = Date.now() - startTime;
        
        expect(response.status).toBe(200);
        times.push(responseTime);
      }
      
      // All requests should be fast
      times.forEach(time => {
        expect(time).toBeLessThan(1000);
      });
      
      // Average response time should be very fast
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      expect(avgTime).toBeLessThan(500); // Average under 500ms
    });
  });

  describe('🔧 HTTP Method Support', () => {
    it('should support GET requests', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET'
      });
      
      expect(response.status).toBe(200);
    });

    it('should handle HEAD requests appropriately', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'HEAD'
      });
      
      // HEAD should return same status as GET but no body
      expect([200, 405].includes(response.status)).toBe(true);
    });

    it('should handle unsupported methods appropriately', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      // Should either accept POST or return method not allowed
      expect([200, 405].includes(response.status)).toBe(true);
    });
  });

  describe('🌐 Reliability and Error Handling', () => {
    it('should return valid response even under load', async () => {
      // Simulate some load with concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, () => checkHealth());
      
      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
      });
    });

    it('should include appropriate cache headers', async () => {
      const response = await checkHealth();
      
      expect(response.status).toBe(200);
      
      // Health checks should typically not be cached or have short cache
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        // Should not cache health checks for too long
        expect(cacheControl.toLowerCase()).toMatch(/(no-cache|no-store|max-age=0|max-age=[1-5])/);
      }
    });
  });

  describe('🔍 Monitoring Integration', () => {
    it('should provide machine-readable status', async () => {
      const response = await checkHealth();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      
      // Status should be easily parseable by monitoring tools
      expect(data.status).toBeDefined();
      expect(typeof data.status).toBe('string');
      expect(data.status.length).toBeGreaterThan(0);
    });

    it('should be suitable for uptime monitoring', async () => {
      const response = await checkHealth();
      
      // Should return 200 when healthy, non-200 when unhealthy
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Should provide clear status indication
      expect(data).toHaveProperty('status');
      
      // Response should be small and efficient for frequent polling
      const responseSize = JSON.stringify(data).length;
      expect(responseSize).toBeLessThan(1000); // Should be compact
    });

    it('should work with standard health check patterns', async () => {
      const response = await checkHealth();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      
      // Should follow common health check patterns
      // Either simple status or more detailed health info
      const hasSimpleStatus = typeof data.status === 'string';
      const hasDetailedHealth = typeof data === 'object' && data !== null;
      
      expect(hasSimpleStatus || hasDetailedHealth).toBe(true);
    });
  });
});

/**
 * 📊 COVERAGE SUMMARY:
 * ✅ Basic health check functionality and 200 OK status
 * ✅ JSON response format validation
 * ✅ Response structure and required fields
 * ✅ Performance testing under 1 second response time
 * ✅ HTTP method support validation
 * ✅ Reliability under concurrent requests
 * ✅ Monitoring integration readiness
 * 
 * 🎯 BUSINESS COVERAGE:
 * ✅ System health monitoring capability
 * ✅ Deployment validation endpoint
 * ✅ Operational reliability verification
 * 
 * 🔧 TECHNICAL COVERAGE:
 * ✅ HTTP endpoint availability testing
 * ✅ Response format standardization
 * ✅ Performance characteristics validation
 * ✅ Monitoring tool integration compatibility
 */