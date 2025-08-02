import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Check applied migrations
    const migrations = await sql`
      SELECT migration_name, direction, applied_at, sql_executed 
      FROM applied_migrations 
      ORDER BY applied_at DESC 
      LIMIT 10
    `

    // Check if poi_locations table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'poi_locations'
      )
    `

    // Check current locations data
    const locationCount = await sql`
      SELECT COUNT(*) as count FROM locations
    `

    // Check POI columns in locations table
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'locations'
      ORDER BY column_name
    `

    return res.status(200).json({
      success: true,
      migrations: migrations,
      poi_table_exists: tableExists[0].exists,
      locations_count: locationCount[0].count,
      locations_columns: columns.map(c => c.column_name),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug migrations error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }
}