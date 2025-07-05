import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

// Initialize PostgreSQL connection pool  
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
console.log('Database connection attempt:', {
  hasDatabase: !!connectionString,
  length: connectionString?.length || 0,
  nodeEnv: process.env.NODE_ENV
});

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

interface FeedbackRequest {
  email?: string
  feedback: string
  rating?: number
  categories?: string[]
  session_id?: string
  page_url?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, feedback, rating, categories, session_id, page_url }: FeedbackRequest = req.body

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Feedback text is required' 
      })
    }

    // Get client info
    const userAgent = req.headers['user-agent'] || ''
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Try to insert feedback into database, fallback to logging if DB unavailable
    try {
      const client = await pool.connect()
      
      try {
        const query = `
          INSERT INTO user_feedback 
          (email, feedback_text, rating, categories, user_agent, ip_address, session_id, page_url, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING id, created_at
        `
        
        const result = await client.query(query, [
          email || null,
          feedback.trim(),
          rating || null,
          categories ? JSON.stringify(categories) : null,
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
    } catch (dbError) {
      // Database connection failed - provide detailed error for debugging
      console.error('Database connection failed:', {
        error: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        environment: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasPgUrl: !!process.env.POSTGRES_URL,
        dbUrlLength: process.env.DATABASE_URL?.length || 0,
        dbUrlStart: process.env.DATABASE_URL?.substring(0, 20) || 'not set'
      });
      
      // Log feedback and return success with debug info
      console.log('Logging feedback to console:', {
        email: email || 'anonymous',
        feedback: feedback.trim(),
        rating,
        categories,
        userAgent,
        clientIp,
        sessionId,
        timestamp: new Date().toISOString()
      })

      res.status(200).json({
        success: true,
        feedback_id: `logged_${Date.now()}`,
        message: 'Feedback received successfully',
        debug: {
          database_error: dbError.message,
          has_database_url: !!process.env.DATABASE_URL,
          db_url_length: process.env.DATABASE_URL?.length || 0,
          environment: process.env.NODE_ENV
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Feedback submission error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}