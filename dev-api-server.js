const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const path = require('path')

const app = express()
const port = 4000

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/weather_intelligence',
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Middleware
app.use(cors())
app.use(express.json())

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
    console.error('Database connection error:', error)
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
        finalCategories,
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
    console.error('Feedback submission error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback. Please try again.',
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