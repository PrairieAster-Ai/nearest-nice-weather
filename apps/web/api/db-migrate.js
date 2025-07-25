// ========================================================================
// VERCEL SERVERLESS FUNCTION: Database Migration API
// ========================================================================
// Safely applies database migrations with rollback capability
// ⚠️  DEMO USE ONLY - Remove authentication for quick testing

import { neon } from '@neondatabase/serverless'

// Neon serverless database connection
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { migration_sql, migration_name, direction = 'up' } = req.body

    if (!migration_sql || !migration_name) {
      return res.status(400).json({
        success: false,
        error: 'migration_sql and migration_name are required'
      })
    }

    // Create migrations tracking table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS applied_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        direction VARCHAR(10) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        sql_executed TEXT
      )
    `

    // Check if migration already applied (for up migrations)
    if (direction === 'up') {
      const existing = await sql`
        SELECT id FROM applied_migrations 
        WHERE migration_name = ${migration_name} AND direction = 'up'
      `
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Migration ${migration_name} already applied`
        })
      }
    }

    // Execute the migration
    const startTime = Date.now()
    await sql.unsafe(migration_sql)
    const executionTime = Date.now() - startTime

    // Record the migration
    await sql`
      INSERT INTO applied_migrations (migration_name, direction, sql_executed)
      VALUES (${migration_name}, ${direction}, ${migration_sql})
    `

    res.status(200).json({
      success: true,
      message: `Migration ${migration_name} (${direction}) applied successfully`,
      execution_time_ms: executionTime,
      migration_name,
      direction,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Migration error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Migration failed: ' + error.message,
      timestamp: new Date().toISOString()
    })
  }
}