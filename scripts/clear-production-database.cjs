#!/usr/bin/env node

// Clear production database for fresh migration
// Usage: DATABASE_URL="postgresql://..." node scripts/clear-production-database.cjs
const { Pool } = require('pg')

// Get database URL from environment variable or command line argument
const databaseUrl = process.env.DATABASE_URL || process.argv[2]

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable or connection string argument required')
  console.error('Usage: DATABASE_URL="postgresql://..." node scripts/clear-production-database.cjs')
  console.error('   or: node scripts/clear-production-database.cjs "postgresql://..."')
  process.exit(1)
}

async function clearDatabase() {
  const pool = new Pool({ connectionString: databaseUrl })

  try {
    console.log('🗑️  Connecting to production database...')
    const countBefore = await pool.query('SELECT COUNT(*) FROM poi_locations')
    console.log(`📊 Current POI count: ${countBefore.rows[0].count}`)

    console.log('🗑️  Deleting all POIs from production...')
    await pool.query('DELETE FROM poi_locations')

    const countAfter = await pool.query('SELECT COUNT(*) FROM poi_locations')
    console.log(`✅ Production database cleared: ${countAfter.rows[0].count} POIs remaining`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

clearDatabase()
