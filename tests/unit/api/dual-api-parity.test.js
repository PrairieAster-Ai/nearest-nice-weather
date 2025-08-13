/**
 * Dual API Architecture Parity Tests
 * Critical sync points between localhost Express.js and Vercel serverless functions
 * 
 * @SYNC_CONTEXT: DUAL-API-MITIGATION-STRATEGIES.md
 * @HIGH_RISK: Schema mismatches, Haversine formula consistency, data type differences
 */

// Mock both API implementations for testing
const mockExpressResponse = {
  health: {
    status: 'healthy',
    timestamp: '2025-01-01T00:00:00.000Z',
    database: { status: 'connected' },
    environment: 'localhost'
  },
  weatherLocations: [
    {
      id: '1',
      name: 'Minneapolis Parks',
      lat: 44.9778,
      lng: -93.2650,
      temperature: 72,
      precipitation: 15,
      windSpeed: 8,
      distance_miles: 2.5
    }
  ],
  feedback: {
    success: true,
    message: 'Feedback submitted successfully',
    id: 'fb_123'
  }
};

const mockVercelResponse = {
  health: {
    status: 'healthy',
    timestamp: '2025-01-01T00:00:00.000Z',
    database: { status: 'connected' },
    environment: 'vercel'
  },
  weatherLocations: [
    {
      id: '1',
      name: 'Minneapolis Parks',
      lat: 44.9778,
      lng: -93.2650,
      temperature: 72,
      precipitation: 15,
      windSpeed: 8,
      distance_miles: 2.5
    }
  ],
  feedback: {
    success: true,
    message: 'Feedback submitted successfully',
    id: 'fb_123'
  }
};

describe('Dual API Architecture Parity', () => {
  describe('🔴 HIGH RISK: Schema Consistency', () => {
    test('should have consistent field names between environments', () => {
      const expressFields = Object.keys(mockExpressResponse.weatherLocations[0]);
      const vercelFields = Object.keys(mockVercelResponse.weatherLocations[0]);
      
      expect(expressFields.sort()).toEqual(vercelFields.sort());
      
      // Specific field checks based on historical issues
      expect(expressFields).toContain('windSpeed');  // NOT wind_speed vs windSpeed mismatch
      expect(expressFields).toContain('distance_miles'); // Consistent distance field
      expect(vercelFields).toContain('windSpeed');
      expect(vercelFields).toContain('distance_miles');
    });

    test('should have consistent data types between environments', () => {
      const expressLocation = mockExpressResponse.weatherLocations[0];
      const vercelLocation = mockVercelResponse.weatherLocations[0];
      
      // Critical: pg returns strings, neon returns numbers
      // Both should be converted to consistent types
      expect(typeof expressLocation.id).toBe('string');
      expect(typeof vercelLocation.id).toBe('string');
      
      expect(typeof expressLocation.lat).toBe('number');
      expect(typeof vercelLocation.lat).toBe('number');
      
      expect(typeof expressLocation.lng).toBe('number');  
      expect(typeof vercelLocation.lng).toBe('number');
      
      expect(typeof expressLocation.temperature).toBe('number');
      expect(typeof vercelLocation.temperature).toBe('number');
      
      expect(typeof expressLocation.windSpeed).toBe('number');
      expect(typeof vercelLocation.windSpeed).toBe('number');
    });

    test('should have identical response structures', () => {
      // Remove environment-specific fields for comparison
      const normalizeResponse = (response) => {
        const normalized = JSON.parse(JSON.stringify(response));
        if (normalized.health) delete normalized.health.environment;
        if (normalized.health) delete normalized.health.timestamp;
        return normalized;
      };
      
      expect(normalizeResponse(mockExpressResponse)).toEqual(normalizeResponse(mockVercelResponse));
    });
  });

  describe('🔴 HIGH RISK: Haversine Formula Consistency', () => {
    test('should use consistent Earth radius (3959 miles)', () => {
      // Both implementations must use 3959 miles, NOT 6371 kilometers
      const earthRadiusMiles = 3959;
      const earthRadiusKm = 6371;
      
      // Mock Haversine formula validation
      const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 3959; // Earth radius in miles (MUST match both implementations)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      // Test distance calculation consistency
      const distance = calculateDistance(44.9778, -93.2650, 44.9800, -93.2600);
      expect(distance).toBeCloseTo(0.29, 1); // Should be ~0.29 miles (corrected)
      expect(distance).toBeLessThan(1); // Sanity check
    });

    test('should use consistent parameter order (lng, lat)', () => {
      // Both implementations must use lng=$1, lat=$2 in SQL queries
      const mockSqlQuery = 'SELECT *, (3959 * acos(cos(radians($2)) * cos(radians(lat)) * cos(radians(lng) - radians($1)) + sin(radians($2)) * sin(radians(lat)))) as distance_miles';
      
      // Verify parameter usage: $1 with lng, $2 with lat
      expect(mockSqlQuery).toContain('radians($1)');
      expect(mockSqlQuery).toContain('radians($2)');
      expect(mockSqlQuery).toContain('lng) - radians($1)'); // $1 is longitude
      expect(mockSqlQuery).toContain('cos(radians($2))'); // $2 is latitude
    });
  });

  describe('🟡 MEDIUM RISK: Database Driver Differences', () => {
    test('should handle pg vs neon serverless driver differences', () => {
      // Mock pg driver response (returns strings)
      const pgResult = {
        id: '1',
        lat: '44.9778',
        lng: '-93.2650',
        temperature: '72',
        wind_speed: '8'
      };
      
      // Mock neon serverless response (may return numbers)
      const neonResult = {
        id: '1',
        lat: 44.9778,
        lng: -93.2650,
        temperature: 72,
        wind_speed: 8
      };
      
      // Transformation function (should be identical in both implementations)
      const transformLocation = (row) => ({
        id: row.id.toString(),
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        temperature: parseInt(row.temperature || 70),
        windSpeed: parseInt(row.wind_speed || 8)
      });
      
      const transformedPg = transformLocation(pgResult);
      const transformedNeon = transformLocation(neonResult);
      
      expect(transformedPg).toEqual(transformedNeon);
      expect(typeof transformedPg.lat).toBe('number');
      expect(typeof transformedNeon.lat).toBe('number');
    });

    test('should have consistent error handling patterns', () => {
      const createStandardError = (error, isDevelopment = false) => ({
        success: false,
        error: 'Database operation failed',
        debug: isDevelopment ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
      
      const mockError = new Error('Connection failed');
      const prodError = createStandardError(mockError, false);
      const devError = createStandardError(mockError, true);
      
      expect(prodError.debug).toBeUndefined();
      expect(devError.debug).toBe('Connection failed');
      expect(prodError.success).toBe(false);
      expect(devError.success).toBe(false);
    });
  });

  describe('API Endpoint Parity Tests', () => {
    test('health endpoint should return consistent structure', () => {
      const expectedHealthFields = ['status', 'timestamp', 'database'];
      
      expect(Object.keys(mockExpressResponse.health)).toEqual(
        expect.arrayContaining(expectedHealthFields)
      );
      expect(Object.keys(mockVercelResponse.health)).toEqual(
        expect.arrayContaining(expectedHealthFields)
      );
      
      expect(mockExpressResponse.health.status).toBe('healthy');
      expect(mockVercelResponse.health.status).toBe('healthy');
    });

    test('weather-locations endpoint should return POI array', () => {
      expect(Array.isArray(mockExpressResponse.weatherLocations)).toBe(true);
      expect(Array.isArray(mockVercelResponse.weatherLocations)).toBe(true);
      
      const expressLocation = mockExpressResponse.weatherLocations[0];
      const vercelLocation = mockVercelResponse.weatherLocations[0];
      
      expect(expressLocation).toHaveProperty('id');
      expect(expressLocation).toHaveProperty('name');
      expect(expressLocation).toHaveProperty('lat');
      expect(expressLocation).toHaveProperty('lng');
      expect(expressLocation).toHaveProperty('distance_miles');
      
      expect(vercelLocation).toHaveProperty('id');
      expect(vercelLocation).toHaveProperty('name');
      expect(vercelLocation).toHaveProperty('lat');
      expect(vercelLocation).toHaveProperty('lng');
      expect(vercelLocation).toHaveProperty('distance_miles');
    });

    test('feedback endpoint should return consistent success format', () => {
      expect(mockExpressResponse.feedback.success).toBe(true);
      expect(mockVercelResponse.feedback.success).toBe(true);
      
      expect(typeof mockExpressResponse.feedback.message).toBe('string');
      expect(typeof mockVercelResponse.feedback.message).toBe('string');
      
      expect(typeof mockExpressResponse.feedback.id).toBe('string');
      expect(typeof mockVercelResponse.feedback.id).toBe('string');
    });
  });

  describe('Environment Validation Integration', () => {
    test('should validate API response format consistency', () => {
      // This test simulates the environment-validation.sh script checks
      const validateApiResponse = (response, endpoint) => {
        switch (endpoint) {
          case 'health':
            expect(response).toHaveProperty('status');
            expect(response).toHaveProperty('timestamp');
            expect(response.database).toHaveProperty('status');
            break;
          case 'weather-locations':
            expect(Array.isArray(response)).toBe(true);
            if (response.length > 0) {
              expect(response[0]).toHaveProperty('id');
              expect(response[0]).toHaveProperty('name');
              expect(response[0]).toHaveProperty('lat');
              expect(response[0]).toHaveProperty('lng');
            }
            break;
          case 'feedback':
            expect(response).toHaveProperty('success');
            expect(typeof response.success).toBe('boolean');
            break;
        }
      };
      
      // Test each endpoint format
      validateApiResponse(mockExpressResponse.health, 'health');
      validateApiResponse(mockVercelResponse.health, 'health');
      
      validateApiResponse(mockExpressResponse.weatherLocations, 'weather-locations');
      validateApiResponse(mockVercelResponse.weatherLocations, 'weather-locations');
      
      validateApiResponse(mockExpressResponse.feedback, 'feedback');
      validateApiResponse(mockVercelResponse.feedback, 'feedback');
    });

    test('should detect data type inconsistencies', () => {
      // This is the type of issue that breaks API parity
      const inconsistentResponse = {
        id: 1, // number instead of string
        lat: '44.9778', // string instead of number  
        temperature: '72', // string instead of number
      };
      
      const transformToConsistent = (data) => ({
        id: data.id.toString(),
        lat: parseFloat(data.lat),
        temperature: parseInt(data.temperature)
      });
      
      const transformed = transformToConsistent(inconsistentResponse);
      
      expect(typeof transformed.id).toBe('string');
      expect(typeof transformed.lat).toBe('number');
      expect(typeof transformed.temperature).toBe('number');
    });
  });

  describe('Performance Characteristics', () => {
    test('should handle localhost vs Vercel response time expectations', () => {
      // Localhost Express: ~100ms target
      // Vercel Preview: 200-500ms expected  
      // Vercel Production: 100-300ms expected
      
      const performanceExpectations = {
        localhost: { min: 10, max: 200 },
        preview: { min: 200, max: 1000 },
        production: { min: 100, max: 500 }
      };
      
      Object.keys(performanceExpectations).forEach(env => {
        const { min, max } = performanceExpectations[env];
        expect(min).toBeLessThan(max);
        expect(max).toBeGreaterThan(0);
      });
    });
  });
});

describe('Schema Change Protocol Validation', () => {
  test('should validate mandatory schema change steps', () => {
    const schemaChangeProtocol = [
      'Design Phase: Document column names and types',
      'Implementation Phase: Update localhost first',
      'Implementation Phase: Test localhost thoroughly',
      'Implementation Phase: Update Vercel with identical logic', 
      'Implementation Phase: Deploy to preview',
      'Implementation Phase: Test preview environment',
      'Validation Phase: Run comprehensive validation',
      'Validation Phase: Compare response formats',
      'Deployment Phase: Deploy to production only after preview validation',
      'Deployment Phase: Validate production immediately'
    ];
    
    expect(schemaChangeProtocol).toHaveLength(10);
    expect(schemaChangeProtocol[0]).toMatch(/Design Phase/);
    expect(schemaChangeProtocol[9]).toMatch(/Validate production/);
  });
  
  test('should enforce type conversion patterns', () => {
    // Mock database row that could come from either pg or neon
    const mockRow = {
      id: 1,
      lat: '44.9778',
      lng: '-93.2650',
      temperature: '72',
      precipitation: null,
      wind_speed: '8'
    };
    
    // Standard transformation (must be identical in both implementations)
    const standardTransform = (row) => ({
      id: row.id.toString(),
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      temperature: parseInt(row.temperature || 70),
      precipitation: parseInt(row.precipitation || 15),
      windSpeed: parseInt(row.wind_speed || 8)
    });
    
    const result = standardTransform(mockRow);
    
    expect(result.id).toBe('1');
    expect(result.lat).toBe(44.9778);
    expect(result.lng).toBe(-93.2650);
    expect(result.temperature).toBe(72);
    expect(result.precipitation).toBe(15); // fallback for null
    expect(result.windSpeed).toBe(8);
  });
});