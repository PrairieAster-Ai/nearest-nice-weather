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

interface WeatherLocation {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number // 0-100 scale
  windSpeed: number // mph
}

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
    // Get query parameters for filtering
    const { 
      lat, 
      lng, 
      radius = '50', // miles (legacy parameter, not used for distance restriction)
      limit = '150' // Increased sensible maximum for nearest nice weather
    } = req.query

    const client = await pool.connect()
    
    try {
      let query: string
      let queryParams: any[]

      if (lat && lng) {
        // Query all locations ordered by distance from user location (no radius restriction)
        query = `
          SELECT 
            wl.id,
            wl.name,
            ST_Y(wl.coordinates) as lat,
            ST_X(wl.coordinates) as lng,
            COALESCE(wd.temperature, 65 + (RANDOM() * 30)::int) as temperature,
            COALESCE(wd.condition, 
              CASE 
                WHEN RANDOM() < 0.3 THEN 'Sunny'
                WHEN RANDOM() < 0.6 THEN 'Partly Cloudy'
                WHEN RANDOM() < 0.8 THEN 'Clear'
                ELSE 'Overcast'
              END
            ) as condition,
            COALESCE(wd.description, wl.name || ' area weather') as description,
            COALESCE(wd.precipitation, (RANDOM() * 100)::int) as precipitation,
            COALESCE(wd.wind_speed, (5 + RANDOM() * 30)::int) as wind_speed,
            ST_Distance(
              ST_Transform(wl.coordinates, 3857),
              ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 3857)
            ) / 1609.34 as distance_miles
          FROM weather.locations wl
          LEFT JOIN weather.current_data wd ON wl.id = wd.location_id
          ORDER BY distance_miles ASC
          LIMIT $3
        `
        queryParams = [parseFloat(lng as string), parseFloat(lat as string), parseInt(limit as string)]
      } else {
        // Query all available locations with mock weather data (no geographic restrictions)
        query = `
          SELECT 
            wl.id,
            wl.name,
            ST_Y(wl.coordinates) as lat,
            ST_X(wl.coordinates) as lng,
            COALESCE(wd.temperature, 65 + (RANDOM() * 30)::int) as temperature,
            COALESCE(wd.condition, 
              CASE 
                WHEN RANDOM() < 0.3 THEN 'Sunny'
                WHEN RANDOM() < 0.6 THEN 'Partly Cloudy'
                WHEN RANDOM() < 0.8 THEN 'Clear'
                ELSE 'Overcast'
              END
            ) as condition,
            COALESCE(wd.description, wl.name || ' area weather') as description,
            COALESCE(wd.precipitation, (RANDOM() * 100)::int) as precipitation,
            COALESCE(wd.wind_speed, (5 + RANDOM() * 30)::int) as wind_speed
          FROM weather.locations wl
          LEFT JOIN weather.current_data wd ON wl.id = wd.location_id
          ORDER BY wl.name ASC
          LIMIT $1
        `
        queryParams = [parseInt(limit as string)]
      }

      const result = await client.query(query, queryParams)

      // Transform results to match frontend interface
      const locations: WeatherLocation[] = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        temperature: parseInt(row.temperature),
        condition: row.condition,
        description: row.description,
        precipitation: parseInt(row.precipitation),
        windSpeed: parseInt(row.wind_speed)
      }))

      res.status(200).json({
        success: true,
        data: locations,
        count: locations.length,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            query_type: lat && lng ? 'proximity_unlimited' : 'all_locations',
            user_location: lat && lng ? { lat, lng } : null,
            radius: radius + ' (legacy parameter, not used for distance restriction)',
            limit: limit,
            data_source: 'database'
          }
        })
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Weather locations API error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather locations',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}