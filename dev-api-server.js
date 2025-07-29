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

const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const path = require('path')

// Load environment variables
require('dotenv').config()

const app = express()
const port = 4000

// ====================================================================
// DATABASE CONNECTION - Stable Schema Integration
// ====================================================================
// Connects to the stable locations + weather_conditions schema
// No PostGIS dependency - uses simple lat/lng for broad compatibility
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: false,
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