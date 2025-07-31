/**
 * ========================================================================
 * POI LOCATIONS DEBUG API - Simplified version for debugging
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed'
    })
  }

  try {
    // Simple query first - no parameters
    const result = await sql`
      SELECT 
        id, name, lat, lng, park_type
      FROM poi_locations 
      ORDER BY name ASC
      LIMIT 3
    `

    return res.status(200).json({
      success: true,
      data: result,
      count: result.length,
      timestamp: new Date().toISOString(),
      debug: {
        query_type: 'simple_debug',
        data_source: 'poi_locations_table'
      }
    })

  } catch (error) {
    console.error('POI Debug API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Database query failed',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }
}