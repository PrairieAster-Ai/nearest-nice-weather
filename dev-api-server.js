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
// WEATHER LOCATIONS ENDPOINT - DUPLICATED API WARNING
// ====================================================================
// ⚠️  CODE DUPLICATION ALERT: This endpoint is duplicated in apps/web/api/weather-locations.js
//
// LOCALHOST VERSION (this file):
// - Uses 'pg' library with $1, $2 parameter binding
// - Connection pooling with client.connect() and client.release()
// - Error handling optimized for development debugging
// - Returns data types as pg client provides them
//
// VERCEL VERSION (apps/web/api/weather-locations.js):
// - Uses '@neondatabase/serverless' with template literal queries
// - Serverless connection (no pooling)
// - Error handling optimized for production logging
// - May have different data type coercion behavior
//
// SYNC REQUIREMENTS:
// ✅ Query logic must remain identical
// ✅ Response format must match exactly
// ✅ Business rule implementations must be consistent
// ✅ Haversine distance calculations must be identical
//
// CURRENT SYNC CHALLENGES:
// - Different query parameter styles: $1, $2 vs template literals  
// - Different type coercion: pg may return strings, neon may return numbers
// - Different error message formats and stack traces
//
// MAINTENANCE PROTOCOL:
// 1. When modifying this endpoint, also update apps/web/api/weather-locations.js
// 2. Test both localhost and preview environments before deployment
// 3. Verify response format consistency with curl testing
// 4. Run ./scripts/environment-validation.sh to confirm API parity
//
// @SYNC_TARGET: apps/web/api/weather-locations.js
// @LAST_SYNC: 2025-07-31 (schema consistency fixes)
// @MIGRATION_CANDIDATE: High priority for Vercel-only migration due to complexity
//
app.get('/api/weather-locations', async (req, res) => {
  try {
    const { lat, lng, radius = '50', limit = '150' } = req.query

    const client = await pool.connect()
    
    try {
      let query
      let queryParams

      if (lat && lng) {
        // @CLAUDE_CONTEXT: Proximity query using Haversine distance for "nearest" weather
        // @BUSINESS_RULE: All personas require location-based weather discovery
        // @TECHNICAL_NOTE: Manual Haversine formula (could be replaced with PostGIS ST_Distance for better accuracy)
        query = `
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
                cos(radians($2)) * cos(radians(l.lat)) * 
                cos(radians(l.lng) - radians($1)) + 
                sin(radians($2)) * sin(radians(l.lat))
              )
            ) as distance_miles
          FROM locations l
          LEFT JOIN weather_conditions w ON l.id = w.location_id
          ORDER BY distance_miles ASC
          LIMIT $3
        `
        queryParams = [parseFloat(lng), parseFloat(lat), parseInt(limit)]
      } else {
        // Query all available locations with stable weather data
        query = `
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
          LIMIT $1
        `
        queryParams = [parseInt(limit)]
      }

      const result = await client.query(query, queryParams)

      // Transform results to match frontend interface
      const locations = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        temperature: parseInt(row.temperature || 70),
        condition: row.condition || 'Clear',
        description: row.description || `${row.name} area weather`,
        precipitation: parseInt(row.precipitation || 15),
        windSpeed: parseInt(row.wind_speed || 8)
      }))

      res.json({
        success: true,
        data: locations,
        count: locations.length,
        timestamp: new Date().toISOString(),
        debug: {
          query_type: lat && lng ? 'proximity_unlimited' : 'all_locations',
          user_location: lat && lng ? { lat, lng } : null,
          radius: radius + ' (legacy parameter, not used for distance restriction)',
          limit: limit,
          data_source: 'database'
        }
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Weather locations API error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Database connection required - no fallback data available',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

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
// POI LOCATIONS ENDPOINT - CRITICAL SCHEMA SYNC POINT
// ====================================================================
// ⚠️  CRITICAL DUPLICATION: This endpoint has different schema handling vs Vercel
//
// RECENT SYNC ISSUE (2025-07-31):
// - Localhost correctly uses: place_rank (actual column name)
// - Vercel incorrectly used: importance_rank (causing "column does not exist" error)
// - Fixed by aliasing: place_rank as importance_rank in Vercel version
//
// SCHEMA CONSISTENCY REQUIREMENTS:
// ✅ Both environments must use same column aliasing: place_rank as importance_rank
// ✅ Haversine distance formula must be identical (validated with curl testing)
// ✅ Response transformation must match: importance_rank: row.place_rank
// ✅ Query parameter validation must be consistent
//
// CURRENT SYNC STATE:
// - Localhost: Uses place_rank directly, aliases in response transformation
// - Vercel: Uses "place_rank as importance_rank" in SELECT, uses directly in response
// - Both approaches work but use different implementation patterns
//
// MAINTENANCE PROTOCOL FOR POI SCHEMA:
// 1. Any schema changes must be tested in both localhost AND preview environments
// 2. Column name mismatches are HIGH-RISK and cause immediate API failures
// 3. Always use curl testing to verify both environments before deployment
// 4. Schema migration requires coordinated deployment of both versions
//
// @SYNC_TARGET: apps/web/api/poi-locations.js
// @SCHEMA_RISK: HIGH - Column name mismatches cause immediate API failures
// @LAST_SCHEMA_SYNC: 2025-07-31 (Fixed importance_rank column reference)
//
// POI test endpoint - validate POI data and test proximity queries
app.get('/api/poi-locations', async (req, res) => {
  try {
    const client = await pool.connect()
    
    try {
      const { lat, lng, radius = '50', limit = '20' } = req.query
      
      let query, queryParams
      
      if (lat && lng) {
        // ⚠️  DUPLICATED HAVERSINE FORMULA - Appears in 3+ locations
        // DUPLICATE LOCATIONS:
        // 1. This POI endpoint (lines ~607-612)
        // 2. Weather-locations endpoint in this file (lines ~270-275)
        // 3. apps/web/api/weather-locations.js (Vercel version)
        // 4. Potentially apps/web/api/poi-locations.js (Vercel version)
        //
        // FORMULA CONSISTENCY CRITICAL:
        // - 3959 = Earth radius in miles (could be 6371 for kilometers)
        // - Parameter order: lng=$1, lat=$2 (MUST match across all implementations)
        // - Mathematical accuracy depends on identical implementation
        //
        // SYNC RISK: HIGH - Math errors cause incorrect distance calculations
        // MITIGATION: Extract to shared GeographyUtils class (post-MVP)
        query = `
          SELECT 
            id,
            name,
            lat,
            lng,
            park_type,
            data_source,
            description,
            place_rank,
            (
              3959 * acos(
                cos(radians($2)) * cos(radians(lat)) * 
                cos(radians(lng) - radians($1)) + 
                sin(radians($2)) * sin(radians(lat))
              )
            ) as distance_miles
          FROM poi_locations
          ORDER BY distance_miles ASC
          LIMIT $3
        `
        queryParams = [parseFloat(lng), parseFloat(lat), parseInt(limit)]
      } else {
        // All POIs ordered by importance
        query = `
          SELECT 
            id, name, lat, lng, park_type, data_source, 
            description, place_rank
          FROM poi_locations
          ORDER BY place_rank ASC, name ASC
          LIMIT $1
        `
        queryParams = [parseInt(limit)]
      }
      
      const result = await client.query(query, queryParams)
      
      const pois = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        park_type: row.park_type,
        data_source: row.data_source,
        description: row.description,
        importance_rank: row.place_rank,
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
// POI LOCATIONS WITH WEATHER API - LOCALHOST VERSION
// ====================================================================
// ⚠️  SYNC TARGET: apps/web/api/poi-locations-with-weather.js
// @CLAUDE_CONTEXT: Unified POI-weather integration for POI-centric architecture
//
// BUSINESS PURPOSE: Core API for showing parks with weather data
// ARCHITECTURAL SHIFT: From weather-station-centric to POI-centric display
// 
// SYNC REQUIREMENTS:
// 🔴 CRITICAL: Business logic must match Vercel serverless version exactly
// 🔴 CRITICAL: Response format must be identical for frontend compatibility
// 🔴 CRITICAL: Distance calculations must use same Haversine formula
// 🟡 DIFFERENT: Database connection patterns (pg vs @neondatabase/serverless)
//
// @MAINTENANCE_PROTOCOL: Changes here must be replicated in Vercel version
app.get('/api/poi-locations-with-weather', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { 
      lat, 
      lng, 
      radius = '50', 
      limit = '200',
      weather_radius = '25'
    } = req.query

    const limitNum = Math.min(parseInt(limit) || 200, 500)
    const radiusNum = parseFloat(radius) || 50
    const weatherRadiusNum = parseFloat(weather_radius) || 25

    let query, queryParams

    if (lat && lng) {
      // Proximity-based POI query with real weather JOIN
      // Uses LATERAL JOIN to find closest weather station for each POI
      query = `
        SELECT DISTINCT ON (p.id)
          p.id,
          p.name,
          p.lat,
          p.lng,
          p.park_type,
          p.description,
          p.data_source,
          p.place_rank,
          (
            3959 * acos(
              cos(radians($1)) * cos(radians(p.lat)) * 
              cos(radians(p.lng) - radians($2)) + 
              sin(radians($1)) * sin(radians(p.lat))
            )
          ) as distance_miles,
          COALESCE(w.temperature, 70) as temperature,
          COALESCE(w.condition, 'Clear') as condition,
          COALESCE(w.description, p.name || ' area weather') as weather_description,
          COALESCE(w.precipitation, 15) as precipitation,
          COALESCE(w.wind_speed, 8) as wind_speed,
          l.name as weather_station_name,
          (
            3959 * acos(
              cos(radians(p.lat)) * cos(radians(l.lat)) * 
              cos(radians(l.lng) - radians(p.lng)) + 
              sin(radians(p.lat)) * sin(radians(l.lat))
            )
          ) as weather_distance_miles
        FROM poi_locations p
        LEFT JOIN LATERAL (
          SELECT 
            l.id, l.name, l.lat, l.lng,
            (
              3959 * acos(
                cos(radians(p.lat)) * cos(radians(l.lat)) * 
                cos(radians(l.lng) - radians(p.lng)) + 
                sin(radians(p.lat)) * sin(radians(l.lat))
              )
            ) as distance
          FROM locations l
          WHERE (
            3959 * acos(
              cos(radians(p.lat)) * cos(radians(l.lat)) * 
              cos(radians(l.lng) - radians(p.lng)) + 
              sin(radians(p.lat)) * sin(radians(l.lat))
            )
          ) <= $4
          ORDER BY distance
          LIMIT 1
        ) l ON true
        LEFT JOIN weather_conditions w ON l.id = w.location_id
        WHERE (
          3959 * acos(
            cos(radians($1)) * cos(radians(p.lat)) * 
            cos(radians(p.lng) - radians($2)) + 
            sin(radians($1)) * sin(radians(p.lat))
          )
        ) <= $3
        ORDER BY p.id, distance_miles ASC
        LIMIT $5
      `
      queryParams = [parseFloat(lat), parseFloat(lng), radiusNum, weatherRadiusNum, limitNum]
    } else {
      // General POI browsing with real weather JOIN
      query = `
        SELECT DISTINCT ON (p.id)
          p.id,
          p.name,
          p.lat,
          p.lng,
          p.park_type,
          p.description,
          p.data_source,
          p.place_rank,
          NULL as distance_miles,
          COALESCE(w.temperature, 70) as temperature,
          COALESCE(w.condition, 'Clear') as condition,
          COALESCE(w.description, p.name || ' area weather') as weather_description,
          COALESCE(w.precipitation, 15) as precipitation,
          COALESCE(w.wind_speed, 8) as wind_speed,
          l.name as weather_station_name,
          (
            3959 * acos(
              cos(radians(p.lat)) * cos(radians(l.lat)) * 
              cos(radians(l.lng) - radians(p.lng)) + 
              sin(radians(p.lat)) * sin(radians(l.lat))
            )
          ) as weather_distance_miles
        FROM poi_locations p
        LEFT JOIN LATERAL (
          SELECT 
            l.id, l.name, l.lat, l.lng,
            (
              3959 * acos(
                cos(radians(p.lat)) * cos(radians(l.lat)) * 
                cos(radians(l.lng) - radians(p.lng)) + 
                sin(radians(p.lat)) * sin(radians(l.lat))
              )
            ) as distance
          FROM locations l
          WHERE (
            3959 * acos(
              cos(radians(p.lat)) * cos(radians(l.lat)) * 
              cos(radians(l.lng) - radians(p.lng)) + 
              sin(radians(p.lat)) * sin(radians(l.lat))
            )
          ) <= $1
          ORDER BY distance
          LIMIT 1
        ) l ON true
        LEFT JOIN weather_conditions w ON l.id = w.location_id
        ORDER BY p.id, p.place_rank ASC, p.name ASC
        LIMIT $2
      `
      queryParams = [weatherRadiusNum, limitNum]
    }

    const result = await client.query(query, queryParams)

    // Transform results to match frontend interface
    const poiLocations = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      park_type: row.park_type,
      description: row.description,
      data_source: row.data_source,
      place_rank: row.place_rank,
      temperature: parseInt(row.temperature),
      condition: row.condition,
      weather_description: row.weather_description || row.description,
      precipitation: parseInt(row.precipitation),
      windSpeed: parseInt(row.wind_speed),
      distance_miles: row.distance_miles ? parseFloat(row.distance_miles).toFixed(2) : null,
      weather_station_name: row.weather_station_name,
      weather_distance_miles: row.weather_distance_miles ? parseFloat(row.weather_distance_miles).toFixed(2) : null
    }))

    res.json({
      success: true,
      data: poiLocations,
      count: poiLocations.length,
      timestamp: new Date().toISOString(),
      debug: {
        query_type: lat && lng ? 'poi_proximity_with_weather' : 'all_pois_with_weather',
        user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        poi_radius: lat && lng ? `${radius} miles` : 'N/A',
        weather_radius: `${weather_radius} miles`,
        limit: limitNum.toString(),
        data_source: 'poi_locations_with_real_weather',
        cache_strategy: 'development',
        cache_duration: 'POI: 0s, Weather: 0s (no caching for fast iteration)'
      }
    })

  } catch (error) {
    console.error('POI locations with weather API error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve POI data with weather',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
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