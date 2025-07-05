import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

// Initialize PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const client = await pool.connect()
    
    try {
      // Get latest 5 feedback entries
      const query = `
        SELECT 
          id,
          email,
          feedback_text,
          rating,
          categories,
          created_at
        FROM user_feedback 
        ORDER BY created_at DESC 
        LIMIT 5
      `
      
      const result = await client.query(query)

      res.status(200).json({
        success: true,
        count: result.rows.length,
        feedback: result.rows,
        timestamp: new Date().toISOString()
      })

    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Database query error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback entries',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}