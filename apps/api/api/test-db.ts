import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Test database connection
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

    const client = await pool.connect()

    // Test query
    const result = await client.query('SELECT NOW() as current_time')

    client.release()

    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      time: result.rows[0].current_time,
      env: process.env.NODE_ENV
    })

  } catch (error) {
    console.error('Database connection error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    })
  }
}
