// ========================================================================
// VERCEL SERVERLESS FUNCTION: Database Test API
// ========================================================================
// Tests database connectivity for production monitoring

import { neon } from '@neondatabase/serverless'

// Neon serverless database connection
const sql = neon(process.env.WEATHERDB_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL)

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
    const time_result = await sql`SELECT NOW() as current_time`
    const tables_result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: time_result[0].current_time,
      postgres_version: 'Connected via Neon Serverless',
      environment: 'vercel-serverless',
      tables: tables_result.map(row => row.table_name)
    })
    
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