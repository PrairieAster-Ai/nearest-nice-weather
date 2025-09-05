#!/usr/bin/env node

/**
 * ========================================================================
 * POI TABLE REFACTORING SCRIPT
 * ========================================================================
 *
 * PURPOSE: Refactor poi_locations_expanded back to poi_locations
 *          Consolidates all POI data into single table with enhanced schema
 *
 * USAGE:
 *   node scripts/refactor-poi-tables.js [environment]
 *
 * ENVIRONMENTS:
 *   - localhost (default) - Uses DATABASE_URL from .env
 *   - preview - Uses preview branch connection
 *   - production - Uses production branch connection (requires confirmation)
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

// Get environment from command line
const environment = process.argv[2] || 'localhost'

// Connection strings for different environments
const connectionStrings = {
  localhost: process.env.DATABASE_URL,
  preview: process.env.PREVIEW_DATABASE_URL || process.env.DATABASE_URL,
  production: process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL
}

// Safety check for production
if (environment === 'production') {
  console.log('⚠️  WARNING: You are about to modify the PRODUCTION database!')
  console.log('Type "REFACTOR-PRODUCTION" to continue:')

  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('> ', (answer) => {
    if (answer !== 'REFACTOR-PRODUCTION') {
      console.log('❌ Aborted')
      process.exit(1)
    }
    rl.close()
    runMigration()
  })
} else {
  runMigration()
}

async function runMigration() {
  console.log(`🚀 Starting POI table refactoring for ${environment}`)

  const connectionString = connectionStrings[environment]

  if (!connectionString) {
    console.error(`❌ No connection string found for environment: ${environment}`)
    process.exit(1)
  }

  const sql = neon(connectionString)

  try {
    // Step 1: Check current state
    console.log('📊 Checking current database state...')

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('poi_locations', 'poi_locations_expanded')
    `

    console.log('Found tables:', tables.map(t => t.table_name))

    // Count records in each table
    for (const table of tables) {
      const tableName = table.table_name
      let count
      if (tableName === 'poi_locations') {
        count = await sql`SELECT COUNT(*) as count FROM poi_locations`
      } else if (tableName === 'poi_locations_expanded') {
        count = await sql`SELECT COUNT(*) as count FROM poi_locations_expanded`
      }
      console.log(`  ${tableName}: ${count[0].count} records`)
    }

    // Step 2: Run migration
    console.log('\\n🔧 Running table refactoring...')

    // Add missing columns to poi_locations
    console.log('  Adding missing columns to poi_locations...')
    await sql`
      ALTER TABLE poi_locations
      ADD COLUMN IF NOT EXISTS park_level VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ownership VARCHAR(100),
      ADD COLUMN IF NOT EXISTS operator VARCHAR(255),
      ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS amenities TEXT[],
      ADD COLUMN IF NOT EXISTS activities TEXT[],
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `

    // Check if poi_locations_expanded exists
    const expandedExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'poi_locations_expanded'
      )
    `

    if (expandedExists[0].exists) {
      console.log('  poi_locations_expanded found, checking for data to migrate...')

      const expandedCount = await sql`SELECT COUNT(*) as count FROM poi_locations_expanded`
      const poiCount = await sql`SELECT COUNT(*) as count FROM poi_locations`

      console.log(`    poi_locations_expanded: ${expandedCount[0].count} records`)
      console.log(`    poi_locations: ${poiCount[0].count} records`)

      if (parseInt(expandedCount[0].count) > parseInt(poiCount[0].count)) {
        console.log('  📦 Migrating data from poi_locations_expanded to poi_locations...')

        // Clear and migrate
        await sql`TRUNCATE poi_locations RESTART IDENTITY CASCADE`

        const migrated = await sql`
          INSERT INTO poi_locations (
            name, lat, lng,
            park_type, park_level, ownership, operator,
            description, data_source, place_rank,
            phone, website, amenities, activities
          )
          SELECT
            name, lat, lng,
            park_type, park_level, ownership, operator,
            description,
            COALESCE(data_source, 'imported'),
            COALESCE(place_rank, 50),
            phone, website, amenities, activities
          FROM poi_locations_expanded
          RETURNING id
        `

        console.log(`  ✅ Migrated ${migrated.length} records`)
      } else if (parseInt(poiCount[0].count) === 0 && parseInt(expandedCount[0].count) === 0) {
        console.log('  ⚠️  Both tables are empty - need to import POI data')
      } else {
        console.log('  ✅ poi_locations already has sufficient data')
      }

      // Step 3: Drop expanded table (optional - commented out for safety)
      // console.log('  🗑️  Dropping poi_locations_expanded...')
      // await sql`DROP TABLE IF EXISTS poi_locations_expanded`

    } else {
      console.log('  ℹ️  poi_locations_expanded does not exist')
    }

    // Step 4: Create indexes
    console.log('\\n📐 Creating indexes for performance...')

    await sql`CREATE INDEX IF NOT EXISTS idx_poi_locations_coords ON poi_locations(lat, lng)`
    await sql`CREATE INDEX IF NOT EXISTS idx_poi_locations_park_type ON poi_locations(park_type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_poi_locations_data_source ON poi_locations(data_source)`
    await sql`CREATE INDEX IF NOT EXISTS idx_poi_locations_place_rank ON poi_locations(place_rank)`

    // Step 5: Final status
    console.log('\\n📊 Final status:')

    const finalCount = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT park_type) as park_types,
        COUNT(DISTINCT data_source) as data_sources,
        MIN(lat) as min_lat,
        MAX(lat) as max_lat,
        MIN(lng) as min_lng,
        MAX(lng) as max_lng
      FROM poi_locations
    `

    const result = finalCount[0]
    console.log(`  Total POIs: ${result.total}`)
    console.log(`  Park Types: ${result.park_types}`)
    console.log(`  Data Sources: ${result.data_sources}`)
    console.log(`  Lat Range: ${result.min_lat} to ${result.max_lat}`)
    console.log(`  Lng Range: ${result.min_lng} to ${result.max_lng}`)

    if (parseInt(result.total) === 0) {
      console.log('\\n⚠️  WARNING: poi_locations is empty!')
      console.log('Run data import script to populate with POI data')
    } else {
      console.log(`\\n✅ Refactoring complete! poi_locations is now the primary table with ${result.total} POIs`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}
