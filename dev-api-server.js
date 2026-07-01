// ========================================================================
// LOCALHOST EXPRESS.JS API SERVER - Development Environment Only
// ========================================================================
//
// ⚠️  ARCHITECTURAL DECISION: DUAL API ARCHITECTURE
// This localhost Express server duplicates functionality found in apps/web/api/*.js
//
// WHY DUAL ARCHITECTURE EXISTS:
// ✅ DEVELOPMENT VELOCITY: ~100ms API responses vs 1-3s Vercel dev cold starts
// ✅ DEBUGGING SUPERIORITY: Full Node.js debugging, console logs, breakpoints
// ✅ DATABASE CONNECTION POOLING: Persistent connections vs serverless reconnects
// ✅ OFFLINE DEVELOPMENT: Works without internet, independent of Vercel infrastructure
// ✅ AUTO-HEALING WORKFLOW: npm start provides 3-second startup with service monitoring
//
// ❌ MAINTENANCE OVERHEAD: 60% code duplication between this file and Vercel functions
// ❌ SYNC BURDEN: Every API change requires updates in two locations
// ❌ DATABASE DRIVER DIFFERENCES: pg (localhost) vs @neondatabase/serverless (production)
// ❌ ENVIRONMENT-SPECIFIC BUGS: Data type mismatches, connection handling differences
//
// DECISION RATIONALE (2025-07-31):
// For single developer MVP development, localhost velocity benefits outweigh
// architectural purity concerns. Post-MVP migration to Vercel-only is planned.
//
// MITIGATION STRATEGIES IN PLACE:
// 1. Automated environment validation: ./scripts/environment-validation.sh
// 2. Type consistency enforcement: parseFloat() transformations
// 3. API parity testing: Cross-environment validation scripts
// 4. Documentation: This comment block and inline sync reminders
//
// MIGRATION PATH (Post-MVP):
// Phase 1: Benchmark vercel dev performance vs localhost
// Phase 2: Selective migration of read-only APIs
// Phase 3: Full migration if productivity metrics justify change
//
// @SYNC_TARGET: apps/web/api/*.js (Vercel serverless functions)
// @MAINTENANCE_BURDEN: Estimated 2-4 hours/week for dual-environment sync
// @BUSINESS_CONTEXT: See CLAUDE.md Project Overview for complete business context
// ========================================================================

import express from 'express'
import cors from 'cors'
import pkg from 'pg'
const { Pool } = pkg
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'
import { fetchWeatherData } from './apps/web/utils/weatherService.js'
import { buildPOIQuery } from './shared/database/queries.js'
import { getPOILocationsWithWeather } from './shared/api/poiLocationsWithWeather.js'

// Load environment variables
dotenv.config()

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = 4000

// ====================================================================
// DATABASE CONNECTION - LOCALHOST DEVELOPMENT PATTERN
// ====================================================================
// ⚠️  DUAL DATABASE DRIVER ARCHITECTURE WARNING
//
// LOCALHOST USES: node-postgres ('pg') with connection pooling
// PRODUCTION USES: @neondatabase/serverless driver in apps/web/api/*.js
//
// TRADEOFFS:
// ✅ LOCALHOST BENEFITS:
//    - Persistent connection pool (10 connections max)
//    - 30-second idle timeout prevents connection churn
//    - 2-second connection timeout for fast failure detection
//    - Full transaction support with manual client.release()
//
// ❌ SYNC CHALLENGES:
//    - Different query parameter binding: $1, $2 vs template literals
//    - Different error objects and stack traces
//    - Connection pooling vs serverless connection handling
//    - Type coercion differences (pg returns strings, neon returns numbers)
//
// MITIGATION STRATEGIES:
// 1. Explicit type conversion: parseInt(row.temperature || 70)
// 2. Consistent error handling patterns in try/catch blocks
// 3. Manual testing of both environments before deployment
// 4. Environment validation scripts verify API parity
//
// @SYNC_TARGET: const sql = neon(process.env.DATABASE_URL) in Vercel functions
// @FUTURE_MIGRATION: Consider database adapter pattern for unified interface
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Neon cloud database
  },
  max: 10,                      // Connection pool size (serverless has no pooling)
  idleTimeoutMillis: 30000,     // Keep connections alive longer than serverless
  connectionTimeoutMillis: 2000, // Fast failure for development feedback
})

// ====================================================================
// MIDDLEWARE CONFIGURATION
// ====================================================================
app.use(cors())                    // Enable cross-origin requests for frontend
app.use(express.json())            // Parse JSON payloads for feedback and filters

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query('SELECT NOW() as current_time')
      res.json({
        success: true,
        message: 'Database connection successful',
        timestamp: result.rows[0].current_time,
        postgres_version: 'Connected'
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.log('Database connection error:', error)
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      debug: error.message
    })
  }
})

// Feedback submission endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { email, feedback, rating, category, categories, session_id, page_url } = req.body

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Feedback text is required'
      })
    }

    // Get client info
    const userAgent = req.headers['user-agent'] || ''
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'unknown'
    const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create table if it doesn't exist
    const client = await pool.connect()

    try {
      // Create table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255),
          feedback_text TEXT NOT NULL,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          category VARCHAR(50) CHECK (category IN ('bug', 'feature', 'general', 'performance')),
          categories JSONB,
          user_agent TEXT,
          ip_address VARCHAR(45),
          session_id VARCHAR(255),
          page_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Handle categories - support both single category and array
      const finalCategory = category || (categories && categories.length > 0 ? categories[0] : 'general')
      const finalCategories = categories || (category ? [category] : ['general'])

      // Insert feedback
      const query = `
        INSERT INTO user_feedback
        (email, feedback_text, rating, category, categories, user_agent, ip_address, session_id, page_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, created_at
      `

      const result = await client.query(query, [
        email || null,
        feedback.trim(),
        rating || null,
        finalCategory,
        JSON.stringify(finalCategories),
        userAgent,
        Array.isArray(clientIp) ? clientIp[0] : clientIp,
        sessionId,
        page_url || null
      ])

      const feedbackRecord = result.rows[0]

      res.status(200).json({
        success: true,
        feedback_id: feedbackRecord.id,
        message: 'Feedback received successfully',
        timestamp: feedbackRecord.created_at.toISOString()
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.log('Feedback submission error:', error)

    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})


// ====================================================================
// 🗑️ LEGACY WEATHER-LOCATIONS API REMOVED (2025-08-05)
// ====================================================================
//
// ❌ REMOVED: /api/weather-locations endpoint that queried cities from 'locations' table
// ✅ REPLACED BY: /api/poi-locations-with-weather (outdoor recreation POIs)
//
// 🎯 BUSINESS RATIONALE:
// - Cities (Minneapolis, Brainerd, etc.) don't align with outdoor recreation focus
// - POI-centric architecture provides better user experience
// - Eliminates code duplication and maintenance overhead
//
// 🔄 MIGRATION IMPACT:
// - Frontend never used this endpoint (used POI system exclusively)
// - No breaking changes to user-facing functionality
// - Reduced API surface area and complexity
//
// 📚 HISTORICAL CONTEXT:
// This endpoint was part of dual architecture experiment with weather stations
// as primary data source. Business model pivoted to outdoor recreation POIs
// as primary discovery mechanism, making weather stations obsolete.
//
// @REMOVED_DATE: 2025-08-05
// @REPLACED_BY: /api/poi-locations-with-weather
// @BUSINESS_IMPACT: None (unused by frontend)
// ====================================================================

// Database schema management endpoint
app.post('/api/create-poi-schema', async (req, res) => {
  try {
    const client = await pool.connect()

    try {
      // Execute schema creation commands one by one
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis')

      // Create POI locations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS poi_locations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          lat DECIMAL(10, 8) NOT NULL,
          lng DECIMAL(11, 8) NOT NULL,
          osm_id BIGINT,
          osm_type VARCHAR(10),
          park_type VARCHAR(100),
          difficulty VARCHAR(50),
          surface_type VARCHAR(50),
          search_name JSONB,
          place_rank INTEGER DEFAULT 30,
          description TEXT,
          data_source VARCHAR(50),
          external_id VARCHAR(100),
          last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT poi_minnesota_bounds CHECK (
            lat BETWEEN 43.499356 AND 49.384472 AND
            lng BETWEEN -97.239209 AND -89.491739
          )
        )
      `)

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_poi_geography ON poi_locations USING GIST(ST_Point(lng, lat))')
      await client.query('CREATE INDEX IF NOT EXISTS idx_poi_search ON poi_locations USING GIN(search_name)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_poi_osm_tracking ON poi_locations (osm_id, osm_type, last_modified)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_poi_classification ON poi_locations (park_type, difficulty)')

      // Create feature flags table
      await client.query(`
        CREATE TABLE IF NOT EXISTS feature_flags (
          flag_name VARCHAR(100) PRIMARY KEY,
          enabled BOOLEAN DEFAULT FALSE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Insert POI feature flag
      await client.query(`
        INSERT INTO feature_flags (flag_name, enabled, description)
        VALUES ('use_poi_locations', FALSE, 'Use poi_locations table instead of legacy locations table')
        ON CONFLICT (flag_name) DO NOTHING
      `)

      res.json({
        success: true,
        message: 'POI database schema created successfully',
        timestamp: new Date().toISOString(),
        tables_created: ['poi_locations', 'feature_flags'],
        indexes_created: ['idx_poi_geography', 'idx_poi_search', 'idx_poi_osm_tracking', 'idx_poi_classification']
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Schema creation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create POI schema',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Insert sample POI data endpoint
app.post('/api/insert-sample-pois', async (req, res) => {
  try {
    const client = await pool.connect()

    try {
      // Sample Minnesota POI data for testing
      const samplePOIs = [
        {
          name: 'Minnehaha Falls Regional Park',
          lat: 44.9153, lng: -93.2111,
          park_type: 'County Park',
          data_source: 'manual',
          description: 'Historic waterfall park with paved trails and scenic overlooks'
        },
        {
          name: 'Gooseberry Falls State Park',
          lat: 47.1397, lng: -91.4690,
          park_type: 'State Park',
          data_source: 'manual',
          description: 'Spectacular waterfalls along Lake Superior with hiking trails'
        },
        {
          name: 'Itasca State Park',
          lat: 47.2181, lng: -95.2058,
          park_type: 'State Park',
          data_source: 'manual',
          description: 'Headwaters of the Mississippi River with old-growth pines'
        },
        {
          name: 'Split Rock Lighthouse State Park',
          lat: 47.1999, lng: -91.3895,
          park_type: 'State Park',
          data_source: 'manual',
          description: 'Iconic lighthouse on Lake Superior cliffs with hiking trails'
        },
        {
          name: 'Taylors Falls State Park',
          lat: 45.4005, lng: -92.6518,
          park_type: 'State Park',
          data_source: 'manual',
          description: 'St. Croix River gorge with rock climbing and scenic overlooks'
        },
        {
          name: 'Carlos Avery Wildlife Management Area',
          lat: 45.2800, lng: -93.1450,
          park_type: 'Wildlife Area',
          data_source: 'manual',
          description: 'Wildlife viewing and hunting area with hiking trails near Nowthen'
        },
        {
          name: 'Bunker Hills Regional Park',
          lat: 45.2450, lng: -93.2800,
          park_type: 'County Park',
          data_source: 'manual',
          description: 'Multi-use park with trails, beach, and recreational facilities'
        },
        {
          name: 'Rum River Central Regional Park',
          lat: 45.3600, lng: -93.2000,
          park_type: 'County Park',
          data_source: 'manual',
          description: 'River park with canoe access and hiking trails'
        }
      ]

      let insertedCount = 0
      let skippedCount = 0

      for (const poi of samplePOIs) {
        // Simple duplicate check using lat/lng proximity (1km = ~0.009 degrees)
        const existingCheck = await client.query(`
          SELECT COUNT(*) as count FROM poi_locations
          WHERE ABS(lat - $1) < 0.009 AND ABS(lng - $2) < 0.009
        `, [poi.lat, poi.lng])

        if (existingCheck.rows[0].count === '0') {
          await client.query(`
            INSERT INTO poi_locations (
              name, lat, lng, park_type, data_source, description,
              search_name, place_rank, last_modified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          `, [
            poi.name, poi.lat, poi.lng, poi.park_type, poi.data_source, poi.description,
            JSON.stringify({primary: poi.name, variations: [poi.name]}),
            poi.park_type === 'State Park' ? 10 : poi.park_type === 'County Park' ? 20 : 30
          ])
          insertedCount++
        } else {
          skippedCount++
        }
      }

      res.json({
        success: true,
        message: 'Sample POI data processing complete',
        timestamp: new Date().toISOString(),
        inserted: insertedCount,
        skipped: skippedCount,
        total_attempted: samplePOIs.length
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Sample POI insertion error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to insert sample POI data',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// ====================================================================
// 🏞️ POINTS OF INTEREST (POI) API - CORE OUTDOOR RECREATION SYSTEM
// ====================================================================
//
// 🎯 BUSINESS PURPOSE:
// Primary API for outdoor recreation discovery in Minnesota. Returns parks, trails,
// forests, nature centers, and other outdoor destinations with proximity-based ranking.
//
// 📊 POI_LOCATIONS TABLE SCHEMA (Single Source of Truth):
// - id: SERIAL PRIMARY KEY
// - name: VARCHAR(255) - "Gooseberry Falls State Park", "Paul Bunyan Trail", etc.
// - lat/lng: DECIMAL(10,8)/DECIMAL(11,8) - Geographic coordinates
// - park_type: VARCHAR(100) - "State Park", "Trail System", "Nature Center", etc.
// - data_source: VARCHAR(50) - "seed_script", "manual", "osm_import"
// - description: TEXT - User-friendly description of the location
// - place_rank: INTEGER - Importance ranking (10=National Park, 15=State Park, 20=Regional)
// - osm_id/osm_type: External OpenStreetMap references (optional)
// - search_name: JSONB - Alternative names and search variations
// - external_id: VARCHAR(100) - Unique identifier from seeding script
//
// 🗺️ GEOGRAPHIC CONSTRAINTS:
// Minnesota-only bounds: lat BETWEEN 43.5 AND 49.4, lng BETWEEN -97.2 AND -89.5
//
// 🔍 QUERY PATTERNS:
// 1. PROXIMITY SEARCH: Returns POIs ordered by distance from user location
// 2. IMPORTANCE SEARCH: Returns all POIs ordered by place_rank (popularity/significance)
// 3. FILTERED SEARCH: WHERE data_source = 'manual' OR park_type IS NOT NULL
//
// 📐 HAVERSINE DISTANCE FORMULA:
// Standard Earth radius = 3959 miles, calculates great-circle distance between coordinates
// Formula: 3959 * acos(cos(radians(lat2)) * cos(radians(lat1)) * cos(radians(lng1) - radians(lng2)) + sin(radians(lat2)) * sin(radians(lat1)))
//
// 🌐 API RESPONSE FORMAT:
// {
//   "success": true,
//   "data": [
//     {
//       "id": "123",
//       "name": "Gooseberry Falls State Park",
//       "lat": 47.1389, "lng": -91.4706,
//       "park_type": "State Park",
//       "data_source": "seed_script",
//       "description": "Famous waterfalls...",
//       "importance_rank": 15,  // ← Alias for place_rank in response
//       "distance_miles": "23.45" // Only present for proximity queries
//     }
//   ],
//   "count": 50,
//   "debug": { query_type, user_location, limit }
// }
//
// ⚠️ DUAL ENVIRONMENT SYNC WARNING:
// This localhost Express.js endpoint must stay synchronized with apps/web/api/poi-locations.js (Vercel)
// Key sync points: query logic, response format, column names, error handling
//
// @SYNC_TARGET: apps/web/api/poi-locations.js (Vercel serverless function)
// @SCHEMA_TABLE: poi_locations (138 Minnesota outdoor recreation destinations)
// @BUSINESS_MODEL: B2C outdoor recreation platform, NOT weather stations or cities
// @LAST_UPDATED: 2025-08-05 (Eliminated legacy locations table, POI-only architecture)
//
// 📋 ENDPOINT: GET /api/poi-locations
// Query Parameters:
// - lat, lng: User coordinates for proximity search
// - radius: Legacy parameter (not enforced, all results returned by distance)
// - limit: Max results (default 20, max 500)
//
app.get('/api/poi-locations', async (req, res) => {
  try {
    const client = await pool.connect()

    try {
      const { lat, lng, radius = '50', limit = '20' } = req.query

      // Use shared POI query builder (single source of truth for the Haversine
      // distance formula + expanded/basic schema fallback). See
      // shared/database/queries.js — the formula lives in haversineMilesSQL().
      const { primaryQuery, fallbackQuery, params } = buildPOIQuery({ lat, lng, limit })

      // Try expanded-schema query first, fall back to the basic poi_locations table
      let result
      try {
        result = await client.query(primaryQuery, params)
      } catch (error) {
        console.log('POI query failed, trying fallback:', error.message)

        if (error.message.includes('poi_locations_expanded')) {
          console.log('Expanded table not found, falling back to original poi_locations table')
          result = await client.query(fallbackQuery, params)

          // Normalize missing columns from the basic schema
          result.rows = result.rows.map(row => ({
            ...row,
            park_type: null,
            data_source: 'unknown',
            description: null,
            place_rank: 1
          }))
        } else {
          throw error
        }
      }

      const pois = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        park_type: row.park_type || null,
        park_level: row.park_level || null,
        ownership: row.ownership || null,
        operator: row.operator || null,
        data_source: row.data_source || 'unknown',
        description: row.description || null,
        importance_rank: row.place_rank || 1,
        phone: row.phone || null,
        website: row.website || null,
        amenities: row.amenities || [],
        activities: row.activities || [],
        place_rank: row.place_rank || row.importance_rank,
        distance_miles: row.distance_miles ? parseFloat(row.distance_miles).toFixed(2) : null
      }))

      res.json({
        success: true,
        data: pois,
        count: pois.length,
        timestamp: new Date().toISOString(),
        debug: {
          query_type: lat && lng ? 'proximity_poi' : 'all_pois',
          user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
          radius: radius + ' miles (for reference)',
          limit: limit,
          data_source: 'poi_locations_table'
        }
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('POI locations API error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve POI data',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// ====================================================================
// 🏞️🌤️ POI LOCATIONS WITH WEATHER API - PRIMARY FRONTEND DATA SOURCE
// ====================================================================
//
// 🎯 BUSINESS PURPOSE:
// **This is the MAIN API endpoint used by the frontend map interface.**
// Combines outdoor recreation POIs with current weather data for each location.
// Powers the core user experience: "Show me parks with nice weather nearby."
//
// 🔗 FRONTEND INTEGRATION:
// - Used by: apps/web/src/hooks/usePOINavigation.ts (PRIMARY)
// - Used by: apps/web/src/hooks/usePOILocations.ts (SECONDARY)
// - Called from: Main map interface, POI navigation system, auto-expand search
//
// 📊 DATA SOURCES COMBINED:
// 1. POI_LOCATIONS TABLE: Minnesota outdoor recreation destinations (parks, trails, forests)
// 2. WEATHER SERVICE: Real-time weather data via OpenWeather API (null when unavailable — no mock fallback)
// 3. PROXIMITY CALCULATION: Haversine distance formula for user-based ranking
//
// 🌤️ WEATHER DATA INTEGRATION:
// - Source: Live weather from apps/web/utils/weatherService.js (OpenWeather API)
// - Unavailable: when no API key / API error, weather fields are null (weather_source:'unavailable') — never fabricated
// - Cache: 5-minute weather data caching to prevent API rate limiting
// - Format: temperature, condition, description, precipitation%, wind_speed
//
// 🔍 QUERY BEHAVIOR:
// - WITH lat/lng: Returns POIs ordered by distance from user location
// - WITHOUT lat/lng: Returns POIs ordered by importance (place_rank)
// - Auto-expand compatible: Frontend can request increasing radius limits
// - Filters: Only returns actual recreation POIs (park_type IS NOT NULL)
//
// 🌐 API RESPONSE FORMAT (Enhanced POI + Weather):
// {
//   "success": true,
//   "data": [
//     {
//       // POI Data (from poi_locations table)
//       "id": "123", "name": "Gooseberry Falls State Park",
//       "lat": 47.1389, "lng": -91.4706,
//       "park_type": "State Park", "data_source": "seed_script",
//       "description": "Famous waterfalls on Lake Superior shore",
//       "importance_rank": 15, "distance_miles": "23.45",
//
//       // Weather Data (from weatherService.js)
//       "temperature": 72, "condition": "Partly Cloudy",
//       "weather_description": "Perfect weather for outdoor activities",
//       "precipitation": 10, "wind_speed": 8,
//       "weather_station_name": "Nearby Weather Station",
//       "weather_distance_miles": 5
//     }
//   ],
//   "debug": {
//     "query_type": "proximity_with_weather",
//     "data_source": "poi_with_real_weather"
//   }
// }
//
// ⚠️ DUAL ENVIRONMENT SYNC WARNING:
// This localhost Express.js endpoint must stay synchronized with apps/web/api/poi-locations-with-weather.js (Vercel)
// Key sync points: POI query logic, weather integration, response format, error handling
//
// @SYNC_TARGET: apps/web/api/poi-locations-with-weather.js (Vercel serverless function)
// @FRONTEND_DEPENDENCY: PRIMARY - Main map interface depends on this endpoint
// @BUSINESS_CRITICAL: Core feature - outdoor recreation discovery with weather context
// @LAST_UPDATED: 2025-08-05 (POI-only architecture, weather service integration)
//
// 📋 ENDPOINT: GET /api/poi-locations-with-weather
// Query Parameters:
// - lat, lng: User coordinates for proximity-based ranking
// - radius: Reference only (not enforced, distance-based ordering used)
// - limit: Max results (default 200, max 500)
//
app.get('/api/poi-locations-with-weather', async (req, res) => {
  // Matches production: real OpenWeather data, null when unavailable (no mock fallback)
  // @SYNC_NOTE: Using same simplified approach as production until schema unified
  const client = await pool.connect()

  try {
    console.log('🔍 Query parameters:', req.query)

    // Thin Express/pg adapter: inject the node-postgres query runner (with
    // schema fallback) and the cached OpenWeather fetcher into the shared core.
    const body = await getPOILocationsWithWeather(req.query, {
      runPOIQuery: async ({ lat, lng, limit }) => {
        const { primaryQuery, fallbackQuery, params } = buildPOIQuery({ lat, lng, limit })
        let result
        try {
          result = await client.query(primaryQuery, params)
        } catch (error) {
          console.log('POI-weather query failed, trying fallback:', error.message)
          result = await client.query(fallbackQuery, params)
        }
        return result.rows
      },
      fetchWeather: fetchWeatherData,
      logger: console,
    })

    res.json(body)

  } catch (error) {
    console.error('POI locations with weather API error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve POI data with weather',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  } finally {
    client.release()
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    port: port
  })
})

// Start server
app.listen(port, () => {
  console.log(`🚀 Development API server running on http://localhost:${port}`)
  console.log(`📝 Feedback endpoint: http://localhost:${port}/api/feedback`)
  console.log(`🏥 Health check: http://localhost:${port}/api/health`)
  console.log(`🗄️  Database test: http://localhost:${port}/api/test-db`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await pool.end()
  process.exit(0)
})
