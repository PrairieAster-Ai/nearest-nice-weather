#!/usr/bin/env node

// Run Database Migration - Apply the final stable schema
const { Pool } = require('pg')
const fs = require('fs')

require('dotenv').config()

async function runMigration() {
  console.log('🚀 Running final database migration...')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('./migration_final.sql', 'utf8')

    console.log('📝 Executing migration SQL...')

    // Execute the migration
    const client = await pool.connect()

    try {
      await client.query(migrationSQL)
      console.log('✅ Migration completed successfully')

      // Verify the migration worked
      const locationCheck = await client.query('SELECT COUNT(*) FROM locations')
      const weatherCheck = await client.query('SELECT COUNT(*) FROM weather_conditions')

      console.log(`✅ Found ${locationCheck.rows[0].count} locations`)
      console.log(`✅ Found ${weatherCheck.rows[0].count} weather records`)

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Database migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error.message)
      process.exit(1)
    })
}

module.exports = { runMigration }
