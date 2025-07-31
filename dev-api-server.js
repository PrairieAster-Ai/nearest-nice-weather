// ========================================================================
// WEATHER INTELLIGENCE API SERVER - Minnesota Outdoor Recreation Platform
// ========================================================================
//
// @CLAUDE_CONTEXT: Core API server for weather intelligence platform
// @BUSINESS_CONTEXT: See CLAUDE.md Project Overview for complete business context
// @PERSONA_DOCUMENTATION: API designed for 3 primary consumer personas:
//   - Jessica Chen (documentation/appendices/user-personas.md) - Primary mass market
//   - Mark Anderson (COMPOSITE-PERSONA-2025.md) - B2C→B2B bridge  
//   - Andrea Thompson (documentation/appendices/user-personas.md) - Legacy validated
//
// @ARCHITECTURE_NOTE: Persona-first API design with proximity-aware weather data
// @INTEGRATION_POINT: Connects Neon PostgreSQL with React frontend via Vercel functions
// @ENHANCEMENT_OPPORTUNITIES: Persona-specific endpoints, activity filtering, weather alerting
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
// DATABASE CONNECTION - Neon Cloud Database Only
// ====================================================================
// ⚠️  NEON CLOUD DATABASE ONLY - Never connects to local PostgreSQL
// SSL is required for Neon connections (ssl: false caused 8-hour debugging session)
// Connects to the stable locations + weather_conditions schema
// No PostGIS dependency - uses simple lat/lng for broad compatibility
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Neon cloud database
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
// WEATHER LOCATIONS ENDPOINT - Core B2C Consumer API
// ====================================================================
// @CLAUDE_CONTEXT: Primary weather data endpoint for persona-driven consumer platform
// @PERSONA_PATTERNS: Serves 3 primary consumer personas (see file header for persona documentation)
// @TECHNICAL_IMPLEMENTATION: Proximity-based queries with Haversine distance calculations
// @BUSINESS_RULE: Persona-first design with activity-weather matching optimization
// @ENHANCEMENT_OPPORTUNITIES: Persona-specific filtering, constraint optimization, weather alerting
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

// POI test endpoint - validate POI data and test proximity queries
app.get('/api/poi-locations', async (req, res) => {
  try {
    const client = await pool.connect()
    
    try {
      const { lat, lng, radius = '50', limit = '20' } = req.query
      
      let query, queryParams
      
      if (lat && lng) {
        // Proximity query using Haversine formula (same as weather-locations)
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