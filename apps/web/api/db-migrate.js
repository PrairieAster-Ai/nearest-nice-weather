/**
 * ========================================================================
 * VERCEL SERVERLESS FUNCTION: Database Migration Management API
 * ========================================================================
 * 
 * BUSINESS CONTEXT: Enables safe database schema evolution for MVP development
 * - Supports iterative feature development with database changes
 * - Provides rollback capability for failed deployments
 * - Tracks migration history for development team coordination
 * - Enables rapid prototyping with database schema modifications
 * 
 * TECHNICAL PURPOSE: RESTful API for executing SQL migrations
 * - Accepts SQL migration scripts via POST requests
 * - Maintains migration tracking table for history and duplicate prevention
 * - Supports both forward (up) and rollback (down) migrations
 * - Provides execution time metrics for performance monitoring
 * 
 * DEPENDENCIES:
 * - @neondatabase/serverless: Neon PostgreSQL serverless driver
 * - Vercel Edge Runtime: Serverless execution environment
 * - Helper script: scripts/migrate.sh for user-friendly interface
 * - Migration files: database/migrations/*.sql containing actual SQL
 * 
 * DATA FLOW:
 * 1. Developer creates migration files (up.sql and down.sql)
 * 2. Helper script calls this API with migration content
 * 3. API validates migration hasn't been applied already
 * 4. Executes SQL against production/preview database
 * 5. Records migration in tracking table for history
 * 6. Returns success/failure status with execution metrics
 * 
 * USAGE PATTERNS:
 * - POST /api/db-migrate (with migration_sql, migration_name, direction)
 * - Called via scripts/migrate.sh helper script
 * - Used for MVP development database schema changes
 * 
 * SECURITY NOTES: ⚠️ DEMO CONFIGURATION - NO AUTHENTICATION
 * - Current setup allows unrestricted database modifications
 * - Acceptable for demo/development with non-sensitive data
 * - Production deployment should add authentication layer
 * 
 * @CLAUDE_CONTEXT: Critical infrastructure for database schema management
 * @BUSINESS_RULE: Additive migrations preferred to avoid data loss
 * @ARCHITECTURE_NOTE: Shared database between preview and production
 * @INTEGRATION_POINT: Works with scripts/migrate.sh helper utility
 * @SECURITY_SENSITIVE: Direct database modification capabilities
 * @PERFORMANCE_CRITICAL: Schema changes affect all API endpoints
 * 
 * LAST UPDATED: 2025-07-25
 */

import { neon } from '@neondatabase/serverless'

/**
 * DATABASE CONNECTION FOR MIGRATION OPERATIONS
 * @CLAUDE_CONTEXT: Same connection strategy as all other API endpoints
 * 
 * ENVIRONMENT STRATEGY: Uses unified database connection pattern
 * - Localhost: Development database branch (safe for testing)
 * - Preview/Production: Shared production database branch
 * - Ensures migrations affect the correct environment
 * 
 * BUSINESS IMPACT: Schema changes affect all environments using this database
 * - Preview and production share same database (per requirements)
 * - Schema changes immediately visible to both environments
 * - Critical for coordinated deployments and testing
 * 
 * @SECURITY_SENSITIVE: Migration operations have full database access
 */
const sql = neon(process.env.DATABASE_URL)

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