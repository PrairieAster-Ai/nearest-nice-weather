/**
 * ========================================================================
 * CLEAR ALL DATABASE TABLES API - Complete Database Reset
 * ========================================================================
 * 
 * @CLAUDE_CONTEXT: Data consistency fix for localhost/preview parity
 * @BUSINESS_PURPOSE: Ensure preview environment matches localhost exactly
 * @TECHNICAL_APPROACH: Clear all tables respecting foreign key constraints
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    })
  }

  try {
    // Clear tables in correct order (respecting foreign key constraints)
    
    // 1. Clear weather_conditions first (has foreign key to locations)
    await sql`DELETE FROM weather_conditions`
    const weatherConditionsResult = await sql`SELECT COUNT(*) as count FROM weather_conditions`
    
    // 2. Clear locations table
    await sql`DELETE FROM locations`
    const locationsResult = await sql`SELECT COUNT(*) as count FROM locations`
    
    // 3. Clear poi_locations table
    await sql`DELETE FROM poi_locations`  
    const poiResult = await sql`SELECT COUNT(*) as count FROM poi_locations`

    return res.status(200).json({
      success: true,
      message: 'All tables cleared successfully',
      timestamp: new Date().toISOString(),
      results: {
        poi_locations_count: poiResult[0].count,
        locations_count: locationsResult[0].count,
        weather_conditions_count: weatherConditionsResult[0].count
      },
      environment: {
        vercel_env: process.env.VERCEL_ENV || 'development',
        has_database_url: !!process.env.DATABASE_URL
      }
    })

  } catch (error) {
    console.error('Clear All Data Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Clear operation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}