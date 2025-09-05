/**
 * ========================================================================
 * MSW API HANDLERS - MOCK API ENDPOINTS FOR TESTING
 * ========================================================================
 *
 * 📋 PURPOSE: Mock Service Worker handlers for API integration testing
 * 🔗 ENDPOINTS: /api/health, /api/poi-locations-with-weather, /api/feedback
 * 📊 COVERAGE: API mocking for unit and integration testing
 * ⚙️ FUNCTIONALITY: Realistic API responses for isolated testing
 * 🎯 TESTING_SUPPORT: Enables testing without external dependencies
 *
 * BUSINESS CONTEXT: API testing infrastructure for reliable development
 * - Provides consistent API responses for testing
 * - Enables offline development and testing
 * - Supports integration testing without live database
 * - Maintains API contract compliance in tests
 *
 * TECHNICAL IMPLEMENTATION: MSW request handlers with mock data
 * - HTTP request interception and response mocking
 * - Realistic data generation for POI and weather endpoints
 * - Error simulation for testing error handling
 * - CORS headers for browser compatibility
 *
 * 🏗️ HANDLER ARCHITECTURE:
 * - RESTful API pattern compliance
 * - Request validation and error responses
 * - Mock data generation with realistic values
 * - Performance simulation with appropriate delays
 *
 * @CLAUDE_CONTEXT: Essential testing infrastructure for API reliability
 * @BUSINESS_RULE: P1 MUST provide realistic test data for Minnesota POIs
 * @INTEGRATION_POINT: Supports frontend-backend integration testing
 * @TESTING_CRITICAL: Enables comprehensive API testing without external dependencies
 *
 * 📚 BUSINESS CONTEXT BREADCRUMBS:
 * Test execution → API request → MSW handler → mock response → test validation
 * TESTING_CHAIN: Unit tests → integration tests → API contract validation
 * VALUE_CHAIN: Reliable testing → quality assurance → production deployment
 *
 * LAST UPDATED: 2025-08-13
 */

import { http, HttpResponse } from 'msw';

// Mock POI data for Minnesota outdoor recreation
const mockPOIData = [
  {
    id: '1',
    name: 'Minnehaha Falls',
    lat: 44.9153,
    lng: -93.2111,
    temperature: 72,
    condition: 'Partly Cloudy',
    description: 'Beautiful waterfall in Minneapolis',
    precipitation: 10,
    windSpeed: 5
  },
  {
    id: '2',
    name: 'Gooseberry Falls State Park',
    lat: 47.1403,
    lng: -91.4692,
    temperature: 68,
    condition: 'Sunny',
    description: 'Stunning waterfalls along Lake Superior',
    precipitation: 0,
    windSpeed: 8
  },
  {
    id: '3',
    name: 'Boundary Waters Canoe Area',
    lat: 47.9473,
    lng: -91.5046,
    temperature: 65,
    condition: 'Clear',
    description: 'Pristine wilderness canoeing',
    precipitation: 5,
    windSpeed: 12
  },
  {
    id: '4',
    name: 'Split Rock Lighthouse',
    lat: 47.2012,
    lng: -91.3954,
    temperature: 70,
    condition: 'Overcast',
    description: 'Historic lighthouse on Lake Superior',
    precipitation: 20,
    windSpeed: 15
  },
  {
    id: '5',
    name: 'Itasca State Park',
    lat: 47.2181,
    lng: -95.2097,
    temperature: 74,
    condition: 'Partly Sunny',
    description: 'Headwaters of the Mississippi River',
    precipitation: 15,
    windSpeed: 6
  }
];

export const apiHandlers = [
  // Health check endpoint - GET
  http.get('http://localhost:4000/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      success: true,
      message: 'API server is running',
      timestamp: new Date().toISOString(),
      port: 4000,
      service: 'nearest-nice-weather-api',
      version: '1.0.0'
    });
  }),

  // Health check endpoint - HEAD
  http.head('http://localhost:4000/api/health', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }),

  // Health check endpoint - POST (method not allowed)
  http.post('http://localhost:4000/api/health', () => {
    return HttpResponse.json({
      success: false,
      error: 'Method not allowed for health check. Use GET.'
    }, {
      status: 405
    });
  }),

  // POI locations with weather endpoint
  http.get('http://localhost:4000/api/poi-locations-with-weather', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const temperature = url.searchParams.get('temperature');
    const precipitation = url.searchParams.get('precipitation');
    const wind = url.searchParams.get('wind');
    const userLat = parseFloat(url.searchParams.get('userLat') || '0');
    const userLng = parseFloat(url.searchParams.get('userLng') || '0');
    const maxDistance = parseFloat(url.searchParams.get('maxDistance') || '100');

    let filteredData = [...mockPOIData];

    // Apply weather filters
    if (temperature === 'cold') {
      filteredData = filteredData.filter(poi => poi.temperature < 70);
    } else if (temperature === 'hot') {
      filteredData = filteredData.filter(poi => poi.temperature > 75);
    } else if (temperature === 'mild') {
      filteredData = filteredData.filter(poi => poi.temperature >= 65 && poi.temperature <= 75);
    }

    if (precipitation === 'none') {
      filteredData = filteredData.filter(poi => poi.precipitation < 10);
    } else if (precipitation === 'light') {
      filteredData = filteredData.filter(poi => poi.precipitation >= 10 && poi.precipitation < 30);
    } else if (precipitation === 'moderate') {
      filteredData = filteredData.filter(poi => poi.precipitation >= 30);
    }

    if (wind === 'calm') {
      filteredData = filteredData.filter(poi => poi.windSpeed < 10);
    } else if (wind === 'moderate') {
      filteredData = filteredData.filter(poi => poi.windSpeed >= 10 && poi.windSpeed < 20);
    } else if (wind === 'strong') {
      filteredData = filteredData.filter(poi => poi.windSpeed >= 20);
    }

    // Apply distance filtering if user location provided
    if (userLat && userLng) {
      filteredData = filteredData.filter(poi => {
        // Simple distance calculation (not precise but good for testing)
        const distance = Math.sqrt(
          Math.pow(poi.lat - userLat, 2) + Math.pow(poi.lng - userLng, 2)
        ) * 111; // Rough conversion to km
        return distance <= maxDistance;
      });
    }

    // Apply limit
    const limitedData = filteredData.slice(0, limit);

    return HttpResponse.json({
      locations: limitedData,
      total: filteredData.length,
      limit: limit,
      applied_filters: {
        temperature,
        precipitation,
        wind,
        user_location: userLat && userLng ? { lat: userLat, lng: userLng } : null,
        max_distance: maxDistance
      }
    });
  }),

  // POI locations - unsupported methods
  http.delete('http://localhost:4000/api/poi-locations-with-weather', () => {
    return HttpResponse.json({
      success: false,
      error: 'Method not allowed. Use GET to retrieve POI locations.'
    }, {
      status: 405
    });
  }),

  // Feedback submission endpoint
  http.post('http://localhost:4000/api/feedback', async ({ request }) => {
    try {
      const body = await request.json() as any;

      // Validate required fields
      if (!body.feedback || typeof body.feedback !== 'string' || body.feedback.trim().length === 0) {
        return HttpResponse.json({
          success: false,
          error: 'Feedback text is required and cannot be empty'
        }, {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return HttpResponse.json({
        success: true,
        message: 'Feedback submitted successfully',
        feedback_id: `fb_${Date.now()}`,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });

    } catch (error) {
      return HttpResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }),

  // OPTIONS requests for CORS preflight
  http.options('http://localhost:4000/api/feedback', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }),

  // Handle unsupported methods for feedback endpoint
  http.get('http://localhost:4000/api/feedback', () => {
    return HttpResponse.json({
      success: false,
      error: 'Method not allowed. Use POST to submit feedback.'
    }, {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }),

  http.put('http://localhost:4000/api/feedback', () => {
    return HttpResponse.json({
      success: false,
      error: 'Method not allowed. Use POST to submit feedback.'
    }, {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }),

  http.delete('http://localhost:4000/api/feedback', () => {
    return HttpResponse.json({
      success: false,
      error: 'Method not allowed. Use POST to submit feedback.'
    }, {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  })
];

/**
 * 📊 HANDLER COVERAGE:
 * ✅ Health check endpoint with realistic response
 * ✅ POI locations with weather filtering and pagination
 * ✅ Feedback submission with validation and error handling
 * ✅ CORS preflight and method validation
 * ✅ Error simulation for testing error handling
 * ✅ Realistic Minnesota POI data for testing
 *
 * 🎯 TESTING SUPPORT:
 * ✅ Unit test isolation with consistent responses
 * ✅ Integration test support with realistic data
 * ✅ Error handling validation capabilities
 * ✅ Performance testing with simulated delays
 *
 * 🔧 TECHNICAL FEATURES:
 * ✅ Request parameter processing and validation
 * ✅ Realistic data filtering and pagination
 * ✅ Proper HTTP status codes and CORS headers
 * ✅ Error simulation for comprehensive testing
 */
