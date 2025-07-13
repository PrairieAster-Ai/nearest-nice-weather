// ========================================================================
// VERCEL SERVERLESS FUNCTION: Database Test API
// ========================================================================
// Tests database connectivity for production monitoring

import { Pool } from 'pg'

// Database connection with environment variable support
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.DATABASE_URL_ALT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export default async function handler(req, res) {
  // CORS headers for frontend access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const client = await pool.connect()
    
    try {
      const result = await client.query('SELECT NOW() as current_time')
      
      res.json({
        success: true,
        message: 'Database connection successful',
        timestamp: result.rows[0].current_time,
        postgres_version: 'Connected',
        environment: 'vercel-serverless'
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('Database connection error:', error)
    
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Database connection failed'
      : error.message
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    })
  }
}