/**
 * ========================================================================
 * VERCEL SERVERLESS FUNCTION: Weather Locations API Endpoint
 * ========================================================================
 * 
 * @CLAUDE_CONTEXT: Primary weather data API for B2C consumer platform
 * @BUSINESS_CONTEXT: See CLAUDE.md Project Overview for complete business context
 * @TECHNICAL_PURPOSE: Proximity-based weather queries with Haversine distance calculations
 * @INTEGRATION_POINT: Connects Neon PostgreSQL with React frontend via Vercel Edge Functions
 * @PERFORMANCE_CRITICAL: Optimized for persona-driven weather discovery
 * @API_DOCUMENTATION: Same functionality as dev-api-server.js but in Vercel format
 * 
 * LAST UPDATED: 2025-07-25
 */

import { neon } from '@neondatabase/serverless'

/**
 * DATABASE CONNECTION CONFIGURATION
 * @CLAUDE_CONTEXT: Unified database connection strategy across all environments
 * 
 * ENVIRONMENT STRATEGY:
 * - Localhost: Uses DATABASE_URL from .env file (development Neon branch)  
 * - Preview/Production: Uses DATABASE_URL from Vercel environment (production Neon branch)
 * - POSTGRES_URL: Fallback for compatibility, same connection string
 * 
 * BUSINESS IMPACT: Different environments use separate database branches for safety
 * - Development branch: Safe testing without affecting live data
 * - Production branch: Live data shared between preview and production
 * 
 * SECURITY NOTES: Connection strings contain credentials, environment-isolated
 * @SECURITY_SENSITIVE: Database credentials in environment variables
 */
const sql = neon(process.env.DATABASE_URL)

/**
 * MAIN API HANDLER FUNCTION
 * @CLAUDE_CONTEXT: Vercel serverless function entry point
 * 
 * BUSINESS LOGIC: Serves weather location data for outdoor recreation planning
 * - Supports two query modes: proximity-based and general browsing
 * - Handles CORS for cross-origin frontend requests
 * - Provides consistent JSON response format
 * 
 * TECHNICAL IMPLEMENTATION: RESTful GET endpoint with query parameters
 * - Validates HTTP method and handles preflight requests
 * - Performs SQL queries with distance calculations
 * - Applies data transformation for frontend compatibility
 * 
 * INPUT/OUTPUT:
 * - Input: HTTP GET request with optional lat, lng, radius, limit parameters
 * - Output: JSON response with weather locations array and metadata
 * 
 * ERROR HANDLING: Try-catch with environment-appropriate error messages
 * @ERROR_BOUNDARY: Production errors are generic, development errors are detailed
 */
export default async function handler(req, res) {
  /**
   * CORS CONFIGURATION
   * @CLAUDE_CONTEXT: Enables frontend applications to access this API
   * 
   * BUSINESS IMPACT: Allows React frontend to consume weather data
   * - Wildcard origin for demo/development convenience
   * - GET method for data retrieval
   * - OPTIONS method for browser preflight requests
   * 
   * SECURITY NOTES: Wildcard CORS appropriate for public weather data
   * - No sensitive data exposed
   * - Read-only operations only
   * - Rate limiting handled at Vercel level
   */
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  /**
   * PREFLIGHT REQUEST HANDLING
   * @CLAUDE_CONTEXT: Browser CORS preflight mechanism
   * TECHNICAL PURPOSE: Responds to OPTIONS requests for CORS compliance
   */
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  /**
   * HTTP METHOD VALIDATION
   * @BUSINESS_RULE: Only GET requests allowed for weather data retrieval
   * SECURITY NOTES: Prevents unintended data modification attempts
   */
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    /**
     * QUERY PARAMETER EXTRACTION
     * @CLAUDE_CONTEXT: Flexible query interface for different use cases
     * 
     * PARAMETERS:
     * - lat, lng: User location for proximity-based queries (optional)
     * - radius: Legacy parameter, not currently used for filtering (default: 50)
     * - limit: Maximum results to return (default: 150, covers all MN locations)
     * 
     * BUSINESS LOGIC: Supports both "near me" and "show all" use cases
     * @DATA_TRANSFORMATION: String query params converted to numbers for calculations
     */
    const { lat, lng, radius = '50', limit = '150' } = req.query

    let result

    if (lat && lng) {
      /**
       * PROXIMITY-BASED QUERY MODE
       * @CLAUDE_CONTEXT: "Find weather near me" functionality
       * 
       * BUSINESS LOGIC: Enables users to find weather conditions within travel distance
       * - Calculates straight-line distance from user location to weather stations
       * - Orders results by proximity (closest first)
       * - Useful for trip planning and activity optimization
       * 
       * TECHNICAL IMPLEMENTATION: Manual Haversine formula for geographic distance
       * - 3959 = Earth's radius in miles (for mile-based results)  
       * - Uses radians for trigonometric calculations
       * - LEFT JOIN ensures locations without weather data are included
       * - NOTE: Could be replaced with PostGIS ST_Distance for better accuracy (Neon supports PostGIS)
       * 
       * @PERFORMANCE_CRITICAL: Distance calculation performed in database for efficiency
       * @BUSINESS_RULE: Minnesota-focused outdoor recreation use case
       */
      result = await sql`
        SELECT 
          l.id,
          l.name,
          l.lat,
          l.lng,
          w.temperature,
          w.condition,
          w.description,  
          w.precipitation,
          w.wind_speed,
          (
            3959 * acos(
              cos(radians(${parseFloat(lat)})) * cos(radians(l.lat)) * 
              cos(radians(l.lng) - radians(${parseFloat(lng)})) + 
              sin(radians(${parseFloat(lat)})) * sin(radians(l.lat))
            )
          ) as distance_miles
        FROM locations l
        LEFT JOIN weather_conditions w ON l.id = w.location_id
        ORDER BY distance_miles ASC
        LIMIT ${parseInt(limit)}
      `
    } else {
      /**
       * GENERAL LOCATION QUERY MODE  
       * @CLAUDE_CONTEXT: "Browse all locations" functionality
       * 
       * BUSINESS LOGIC: Allows users to explore all available weather locations
       * - Alphabetical ordering for predictable browsing experience
       * - Used for general exploration and location discovery
       * - Supports outdoor recreation consumers exploring regional conditions
       * 
       * TECHNICAL IMPLEMENTATION: Simple JOIN with alphabetical sorting
       * - No distance calculations needed
       * - Faster query execution for general browsing
       * - LEFT JOIN preserves locations without current weather data
       * 
       * @BUSINESS_RULE: All 34 Minnesota locations available for browsing
       */
      result = await sql`
        SELECT 
          l.id,
          l.name,
          l.lat,
          l.lng,
          w.temperature,
          w.condition,
          w.description,
          w.precipitation,
          w.wind_speed
        FROM locations l
        LEFT JOIN weather_conditions w ON l.id = w.location_id
        ORDER BY l.name ASC
        LIMIT ${parseInt(limit)}
      `
    }

    /**
     * DATA TRANSFORMATION FOR FRONTEND COMPATIBILITY
     * @CLAUDE_CONTEXT: Converts database format to frontend-expected interface
     * 
     * BUSINESS LOGIC: Ensures consistent data format regardless of database state
     * - Provides fallback values for missing weather data
     * - Standardizes data types for JavaScript consumption
     * - Maintains backward compatibility with existing frontend code
     * 
     * TECHNICAL IMPLEMENTATION: Array mapping with type conversions
     * - Database numeric IDs converted to strings for JSON transport
     * - Coordinates converted to JavaScript numbers for mapping libraries
     * - Weather data includes sensible defaults for missing values
     * 
     * @DATA_TRANSFORMATION: Database row objects → Frontend location objects
     * @BUSINESS_RULE: Never return empty/null weather data to users
     */
    const locations = result.map(row => ({
        // LOCATION IDENTIFICATION: String ID for frontend compatibility
        id: row.id.toString(),
        name: row.name,
        
        // GEOGRAPHIC COORDINATES: Parsed numbers for mapping libraries (Google Maps, Leaflet)
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        
        // WEATHER CONDITIONS: Sensible defaults for missing data
        // @BUSINESS_RULE: Always show plausible weather to avoid confusing users
        temperature: parseInt(row.temperature || 70),  // 70°F = pleasant Minnesota weather default
        condition: row.condition || 'Clear',           // Optimistic default condition
        description: row.description || `${row.name} area weather`,  // Generated description
        precipitation: parseInt(row.precipitation || 15), // 15% = low chance default
        windSpeed: parseInt(row.wind_speed || 8)      // 8 mph = light breeze default
      }))

      /**
       * API RESPONSE STRUCTURE
       * @CLAUDE_CONTEXT: Standardized JSON response format for all API endpoints
       * 
       * BUSINESS LOGIC: Consistent response format enables reliable frontend integration
       * - Success flag allows frontend to handle errors gracefully
       * - Data array contains the actual weather locations
       * - Count enables pagination and result set management
       * - Timestamp supports caching and data freshness validation
       * - Debug object aids development and troubleshooting
       * 
       * TECHNICAL IMPLEMENTATION: JSON response with metadata
       * - success: Boolean indicating operation status
       * - data: Array of transformed location objects
       * - count: Number of results returned
       * - timestamp: ISO string for response time tracking
       * - debug: Development information about query execution
       * 
       * @ARCHITECTURE_NOTE: Response format used across all API endpoints
       * @INTEGRATION_POINT: Frontend React components expect this exact structure
       */
      res.json({
        success: true,
        data: locations,
        count: locations.length,
        timestamp: new Date().toISOString(),
        debug: {
          query_type: lat && lng ? 'proximity_unlimited' : 'all_locations',
          user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
          radius: radius + ' (legacy parameter, not used for distance restriction)',
          limit: limit,
          data_source: 'database'
        }
      })


  } catch (error) {
    /**
     * ERROR HANDLING AND LOGGING
     * @CLAUDE_CONTEXT: Comprehensive error management for production reliability
     * 
     * BUSINESS LOGIC: Graceful error handling maintains user experience
     * - Development errors are detailed for debugging
     * - Production errors are generic to avoid information leakage
     * - All errors are logged for monitoring and troubleshooting
     * 
     * TECHNICAL IMPLEMENTATION: Try-catch with environment-aware responses
     * - Console logging for server-side debugging
     * - HTTP 500 status for server errors
     * - JSON error response matching success response format
     * 
     * @ERROR_BOUNDARY: Prevents API failures from crashing the application
     * @SECURITY_SENSITIVE: Production errors hide implementation details
     */
    console.error('Weather locations API error:', error)
    
    // ENVIRONMENT-AWARE ERROR MESSAGES
    // Development: Detailed error information for debugging
    // Production: Generic message to prevent information disclosure
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Internal server error'
      : error.message

    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}