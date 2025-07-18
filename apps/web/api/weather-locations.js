// ========================================================================
// VERCEL SERVERLESS FUNCTION: Weather Locations API
// ========================================================================
// Provides Minnesota weather data for travel-time based weather discovery
// Supports both proximity-based and general location queries

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
    const { lat, lng, radius = '50', limit = '150' } = req.query

    let result

    if (lat && lng) {
      // Proximity-based query for Minnesota weather locations
      // Uses Haversine formula for distance calculation
      result = await sql`
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
              cos(radians(${parseFloat(lat)})) * cos(radians(l.lat)) * 
              cos(radians(l.lng) - radians(${parseFloat(lng)})) + 
              sin(radians(${parseFloat(lat)})) * sin(radians(l.lat))
            )
          ) as distance_miles
        FROM locations l
        LEFT JOIN weather_conditions w ON l.id = w.location_id
        ORDER BY distance_miles ASC
        LIMIT ${parseInt(limit)}
      `
    } else {
      // General query for all Minnesota locations
      result = await sql`
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
        LIMIT ${parseInt(limit)}
      `
    }

    // Transform results to match frontend interface
    const locations = result.map(row => ({
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
          user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
          radius: radius + ' (legacy parameter, not used for distance restriction)',
          limit: limit,
          data_source: 'database'
        }
      })


  } catch (error) {
    console.error('Weather locations API error:', error)
    
    // Return detailed error for development, generic for production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Internal server error'
      : error.message

    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}