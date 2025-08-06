#!/usr/bin/env node

/**
 * ========================================================================
 * DATABASE MIGRATION SCRIPT - Multi-Environment POI Data Sync
 * ========================================================================
 * 
 * @BUSINESS_PURPOSE: Sync POI data from development (source of truth) to preview/production
 * @TECHNICAL_APPROACH: Export from development branch, import to target branches
 * 
 * USAGE:
 * node scripts/database-migration.js export-dev > poi-data.json
 * node scripts/database-migration.js import-preview < poi-data.json
 * node scripts/database-migration.js import-production < poi-data.json
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - DEV_DATABASE_URL: Development branch connection
 * - PREVIEW_DATABASE_URL: Preview branch connection  
 * - PRODUCTION_DATABASE_URL: Production branch connection
 * ========================================================================
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '..', '.env') })

// Database connection function
async function connectToDatabase(databaseUrl) {
  try {
    // Try serverless first (for deployed environments)
    const { neon } = await import('@neondatabase/serverless')
    return neon(databaseUrl)
  } catch (error) {
    // Fallback to pg for local development
    const { Pool } = await import('pg')
    const pool = new Pool({ connectionString: databaseUrl })
    return pool
  }
}

// Export POI data from development database
async function exportPOIData() {
  const devDatabaseUrl = process.env.DATABASE_URL
  
  if (!devDatabaseUrl) {
    console.error('❌ DATABASE_URL not configured')
    process.exit(1)
  }
  
  console.error('🔍 Connecting to development database...')
  const sql = await connectToDatabase(devDatabaseUrl)
  
  try {
    // Export POI data with all available fields
    const result = await sql`
      SELECT 
        id, name, lat, lng, park_type, data_source, description,
        place_rank, osm_id, osm_type, search_name, external_id
      FROM poi_locations
      WHERE data_source = 'manual' OR park_type IS NOT NULL
      ORDER BY place_rank ASC, name ASC
    `
    
    const exportData = {
      timestamp: new Date().toISOString(),
      source: 'development',
      poi_count: result.length,
      data: result
    }
    
    console.error(`✅ Exported ${result.length} POI records from development`)
    console.log(JSON.stringify(exportData, null, 2))
    
  } catch (error) {
    console.error('❌ Export failed:', error.message)
    process.exit(1)
  }
}

// Import POI data to target database
async function importPOIData(targetEnv) {
  const envVarMap = {
    'preview': 'PREVIEW_DATABASE_URL',
    'production': 'PRODUCTION_DATABASE_URL'
  }
  
  const databaseUrl = process.env[envVarMap[targetEnv]]
  
  if (!databaseUrl) {
    console.error(`❌ ${envVarMap[targetEnv]} not configured`)
    process.exit(1)
  }
  
  // Read JSON from stdin
  let inputData = ''
  process.stdin.on('data', chunk => inputData += chunk)
  process.stdin.on('end', async () => {
    try {
      const exportData = JSON.parse(inputData)
      
      console.error(`🔍 Connecting to ${targetEnv} database...`)
      const sql = await connectToDatabase(databaseUrl)
      
      console.error(`📥 Importing ${exportData.poi_count} POI records to ${targetEnv}...`)
      
      // Clear existing POI data (optional - could be made safer)
      await sql`DELETE FROM poi_locations WHERE data_source = 'manual' OR park_type IS NOT NULL`
      console.error('🗑️ Cleared existing POI data')
      
      // Import new POI data
      for (const poi of exportData.data) {
        await sql`
          INSERT INTO poi_locations (
            id, name, lat, lng, park_type, data_source, description,
            place_rank, osm_id, osm_type, search_name, external_id
          ) VALUES (
            ${poi.id}, ${poi.name}, ${poi.lat}, ${poi.lng}, 
            ${poi.park_type}, ${poi.data_source}, ${poi.description},
            ${poi.place_rank}, ${poi.osm_id}, ${poi.osm_type}, 
            ${poi.search_name}, ${poi.external_id}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            lat = EXCLUDED.lat,
            lng = EXCLUDED.lng,
            park_type = EXCLUDED.park_type,
            data_source = EXCLUDED.data_source,
            description = EXCLUDED.description,
            place_rank = EXCLUDED.place_rank
        `
      }
      
      console.error(`✅ Successfully imported ${exportData.poi_count} POI records to ${targetEnv}`)
      console.error(`📊 Data from: ${exportData.source} (${exportData.timestamp})`)
      
    } catch (error) {
      console.error(`❌ Import to ${targetEnv} failed:`, error.message)
      process.exit(1)
    }
  })
}

// Validate POI data in target database
async function validatePOIData(targetEnv) {
  const envVarMap = {
    'development': 'DATABASE_URL', // Use existing DATABASE_URL for localhost
    'preview': 'PREVIEW_DATABASE_URL', 
    'production': 'PRODUCTION_DATABASE_URL'
  }
  
  const databaseUrl = process.env[envVarMap[targetEnv]]
  
  if (!databaseUrl) {
    console.error(`❌ ${envVarMap[targetEnv]} not configured`)
    process.exit(1)
  }
  
  console.error(`🔍 Validating ${targetEnv} database...`)
  const sql = await connectToDatabase(databaseUrl)
  
  try {
    // Count POI records
    const poiCount = await sql`
      SELECT COUNT(*) as count 
      FROM poi_locations 
      WHERE data_source = 'manual' OR park_type IS NOT NULL
    `
    
    // Sample POI data
    const samplePOIs = await sql`
      SELECT name, park_type, data_source, place_rank
      FROM poi_locations 
      WHERE data_source = 'manual' OR park_type IS NOT NULL
      ORDER BY place_rank ASC
      LIMIT 5
    `
    
    console.error(`✅ ${targetEnv} database validation:`)
    console.error(`   📊 POI Count: ${poiCount[0].count}`)
    console.error(`   🎯 Sample POIs:`)
    samplePOIs.forEach((poi, i) => {
      console.error(`      ${i+1}. ${poi.name} (${poi.park_type || 'No type'})`)
    })
    
    return {
      environment: targetEnv,
      poi_count: parseInt(poiCount[0].count),
      sample_pois: samplePOIs
    }
    
  } catch (error) {
    console.error(`❌ Validation failed for ${targetEnv}:`, error.message)
    process.exit(1)
  }
}

// Main script execution
const command = process.argv[2]

switch (command) {
  case 'export-dev':
    await exportPOIData()
    break
    
  case 'import-preview':
    await importPOIData('preview')
    break
    
  case 'import-production':
    await importPOIData('production')
    break
    
  case 'validate':
    const env = process.argv[3] || 'development'
    const result = await validatePOIData(env)
    console.log(JSON.stringify(result, null, 2))
    break
    
  default:
    console.error(`
🗄️  DATABASE MIGRATION SCRIPT

Usage:
  node scripts/database-migration.js export-dev > poi-data.json
  node scripts/database-migration.js import-preview < poi-data.json  
  node scripts/database-migration.js import-production < poi-data.json
  node scripts/database-migration.js validate [development|preview|production]

Environment Variables Required:
  DEV_DATABASE_URL      - Development branch database
  PREVIEW_DATABASE_URL  - Preview branch database  
  PRODUCTION_DATABASE_URL - Production branch database

Examples:
  # Export from development
  DEV_DATABASE_URL="postgresql://..." node scripts/database-migration.js export-dev > backup.json
  
  # Import to preview
  PREVIEW_DATABASE_URL="postgresql://..." node scripts/database-migration.js import-preview < backup.json
  
  # Validate any environment
  DATABASE_URL="postgresql://..." node scripts/database-migration.js validate development
`)
    process.exit(1)
}