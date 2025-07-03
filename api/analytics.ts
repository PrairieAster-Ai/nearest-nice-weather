import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

interface AnalyticsEvent {
  event_type: string
  event_data: Record<string, any>
  session_id?: string
  user_location?: { lat: number; lng: number }
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
    const { event_type, event_data, session_id, user_location, page_url }: AnalyticsEvent = req.body

    if (!event_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event type is required' 
      })
    }

    // Get client info
    const userAgent = req.headers['user-agent'] || ''
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Convert user_location to PostGIS point if provided
    let userLocationPoint = null
    if (user_location && user_location.lat && user_location.lng) {
      userLocationPoint = `POINT(${user_location.lng} ${user_location.lat})`
    }

    const client = await pool.connect()
    
    try {
      const query = `
        INSERT INTO user_events 
        (session_id, event_type, event_data, user_location, user_agent, ip_address, page_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, created_at
      `
      
      const result = await client.query(query, [
        sessionId,
        event_type,
        JSON.stringify(event_data || {}),
        userLocationPoint,
        userAgent,
        Array.isArray(clientIp) ? clientIp[0] : clientIp,
        page_url || null
      ])

      const eventRecord = result.rows[0]

      res.status(200).json({
        success: true,
        event_id: eventRecord.id,
        timestamp: eventRecord.created_at.toISOString()
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Analytics tracking error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}