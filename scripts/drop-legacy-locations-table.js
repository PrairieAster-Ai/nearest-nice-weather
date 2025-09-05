#!/usr/bin/env node

/**
 * 🗑️ DROP LEGACY LOCATIONS TABLE - Optional Database Cleanup
 * ========================================================
 *
 * 🎯 PURPOSE: Remove legacy 'locations' table containing Minnesota cities
 *
 * 📊 WHAT THIS REMOVES:
 * - locations table: 50 Minnesota cities (Minneapolis, Saint Paul, Brainerd, etc.)
 * - weather_conditions table: Weather data linked to cities (if exists)
 * - Associated indexes and constraints
 *
 * ✅ SAFE TO RUN BECAUSE:
 * - Frontend uses POI system exclusively (poi_locations table)
 * - All APIs migrated from 'locations' to 'poi_locations'
 * - Legacy weather-locations endpoint removed
 * - No business value in city weather stations
 *
 * ⚠️  BACKUP RECOMMENDATION:
 * Consider backing up the locations table data before dropping:
 * pg_dump --table=locations --data-only $DATABASE_URL > locations_backup.sql
 *
 * @REMOVES: locations table, weather_conditions table
 * @KEEPS: poi_locations table (138 Minnesota outdoor recreation destinations)
 * @BUSINESS_IMPACT: None (cities not used in outdoor recreation business model)
 */

import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function dropLegacyTables() {
  console.log('🗑️ LEGACY TABLE CLEANUP - Removing city-based weather station architecture')
  console.log('=============================================================================')

  const client = await pool.connect()

  try {
    // Check what we're about to remove
    console.log('📊 Analyzing legacy tables before removal...')

    try {
      const locationCount = await client.query('SELECT COUNT(*) FROM locations')
      console.log(`   📍 locations table: ${locationCount.rows[0].count} cities found`)

      const locationSample = await client.query('SELECT name FROM locations LIMIT 5')
      console.log(`   🏙️  Sample cities: ${locationSample.rows.map(r => r.name).join(', ')}`)
    } catch (error) {
      console.log('   ℹ️  locations table does not exist (already removed)')
    }

    try {
      const weatherCount = await client.query('SELECT COUNT(*) FROM weather_conditions')
      console.log(`   🌤️  weather_conditions table: ${weatherCount.rows[0].count} weather records found`)
    } catch (error) {
      console.log('   ℹ️  weather_conditions table does not exist')
    }

    // Check that POI system is intact
    try {
      const poiCount = await client.query('SELECT COUNT(*) FROM poi_locations')
      console.log(`   ✅ poi_locations table: ${poiCount.rows[0].count} outdoor recreation POIs (KEEPING THIS)`)
    } catch (error) {
      console.error('   ❌ ERROR: poi_locations table missing! This is required for the app to work.')
      throw new Error('Cannot proceed - poi_locations table is missing')
    }

    console.log('\n🧹 Beginning cleanup...')

    // Drop tables in correct order (foreign key dependencies)
    console.log('   🗑️  Dropping weather_conditions table...')
    await client.query('DROP TABLE IF EXISTS weather_conditions CASCADE')

    console.log('   🗑️  Dropping locations table...')
    await client.query('DROP TABLE IF EXISTS locations CASCADE')

    // Verify cleanup
    console.log('\n✅ Cleanup verification:')

    try {
      await client.query('SELECT 1 FROM locations LIMIT 1')
      console.log('   ❌ locations table still exists')
    } catch (error) {
      console.log('   ✅ locations table successfully removed')
    }

    try {
      await client.query('SELECT 1 FROM weather_conditions LIMIT 1')
      console.log('   ❌ weather_conditions table still exists')
    } catch (error) {
      console.log('   ✅ weather_conditions table successfully removed')
    }

    // Verify POI system still works
    const finalPOICount = await client.query('SELECT COUNT(*) FROM poi_locations')
    console.log(`   ✅ poi_locations table intact: ${finalPOICount.rows[0].count} outdoor recreation POIs`)

    console.log('\n🎉 Legacy cleanup completed successfully!')
    console.log('📈 Benefits achieved:')
    console.log('   - Reduced database size and complexity')
    console.log('   - Eliminated unused city/weather-station data')
    console.log('   - Pure POI-centric architecture')
    console.log('   - Aligned with outdoor recreation business model')

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run cleanup with confirmation
console.log('⚠️  This will permanently remove legacy city weather data.')
console.log('   POI outdoor recreation data will be preserved.')
console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...')

setTimeout(() => {
  dropLegacyTables().catch(console.error)
}, 5000)
