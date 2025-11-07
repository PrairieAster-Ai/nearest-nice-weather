#!/usr/bin/env node

/**
 * ========================================================================
 * MINNESOTA POI IMPORT CLI - Production Overpass API Integration
 * ========================================================================
 *
 * @CLAUDE_CONTEXT: Command-line tool for importing Minnesota POIs from OSM
 * @BUSINESS_PURPOSE: Enrich POI database with OpenStreetMap metadata
 * @TECHNICAL_APPROACH: Overpass API + checkpoint recovery + usage tracking
 *
 * Story: Minnesota POI Database Deployment (#155)
 * Phase: 1.1 - CLI Import Script
 * Created: 2025-11-06
 * ========================================================================
 */

// Load environment variables from .env file
require('dotenv').config()

const OSMIntegration = require('./osm-integration.cjs')
const DatabaseImporter = require('./database-importer.cjs')
const ImportCoordinator = require('./import-coordinator.cjs')
const UsageTracker = require('./usage-tracker.cjs')
const { Pool } = require('pg')
const fs = require('fs').promises

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    environment: 'localhost',
    dryRun: false,
    skipBackup: false,
    skipStatusCheck: false,
    verbose: false,
    help: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--environment' || arg === '-e') {
      options.environment = args[++i]
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true
    } else if (arg === '--skip-backup') {
      options.skipBackup = true
    } else if (arg === '--skip-status-check') {
      options.skipStatusCheck = true
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true
    } else {
      console.log(`⚠️  Unknown argument: ${arg}`)
      options.help = true
    }
  }

  return options
}

// Print usage help
function printHelp() {
  console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  Minnesota POI Import - Overpass API Integration               │
│  Phase 1.1: CLI Import Script                                  │
└─────────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/run-minnesota-import.js [OPTIONS]

OPTIONS:
  -e, --environment <env>    Target environment (default: localhost)
                             Options: localhost, preview, production

  -d, --dry-run             Validate query without database import
                             (Tests Overpass API + displays results)

  --skip-backup             Skip database backup (not recommended)

  --skip-status-check       Skip Overpass API server status check

  -v, --verbose             Enable verbose logging

  -h, --help                Show this help message

EXAMPLES:
  # Dry-run to test Overpass query
  node scripts/run-minnesota-import.js --dry-run

  # Import to localhost (default)
  node scripts/run-minnesota-import.js

  # Import to preview environment
  node scripts/run-minnesota-import.js --environment preview

  # Verbose mode with status check
  node scripts/run-minnesota-import.js -v

ENVIRONMENT VARIABLES:
  DATABASE_URL              PostgreSQL connection string (required)
  OVERPASS_URL              Custom Overpass endpoint (optional)
  OVERPASS_TIMEOUT          Query timeout in ms (default: 30000)

OUTPUT:
  - Progress updates every 10 POIs
  - Final statistics report
  - Checkpoint file: .osm-import-checkpoint.json
  - Usage tracking: .overpass-usage.json

SAFETY FEATURES:
  ✅ Database transaction rollback on errors
  ✅ Checkpoint-based recovery (resume after failure)
  ✅ Duplicate detection (10-meter threshold)
  ✅ Usage quota tracking (10,000 req/day, 1 GB/day)
  ✅ Exponential backoff on 429 rate limits
  ✅ Server health checks before import

For more information, see:
  PRD-OVERPASS-PRODUCTION-DEPLOYMENT.md
  OVERPASS-API-BEST-PRACTICES.md
  `)
}

// Get database connection for environment
function getDatabaseConnection(environment) {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set')
  }

  console.log(`📊 Connecting to ${environment} database...`)
  return new Pool({ connectionString: dbUrl })
}

// Create database backup
async function createDatabaseBackup(dbClient) {
  console.log('\n📦 Creating database backup...')

  const backupFile = `.poi-backup-${new Date().toISOString().split('T')[0]}.json`

  try {
    const result = await dbClient.query(`
      SELECT
        id, name, lat, lng, park_type, park_level, ownership, operator,
        data_source, description, place_rank, phone, website, amenities, activities
      FROM poi_locations
      ORDER BY id
    `)

    await fs.writeFile(
      backupFile,
      JSON.stringify(result.rows, null, 2),
      'utf-8'
    )

    console.log(`✅ Backup created: ${backupFile} (${result.rows.length} POIs)`)
    return backupFile

  } catch (error) {
    console.log(`⚠️  Backup failed: ${error.message}`)
    console.log('   Continuing without backup (use --skip-backup to suppress this warning)')
    return null
  }
}

// Run dry-run validation
// Multi-query dry-run function (optimized for timeout prevention)
async function runMultiQueryDryRun(osmClient) {
  console.log('\n🔍 DRY-RUN MODE: Testing multi-query Overpass approach (no database changes)\n')

  // Check server status
  console.log('📡 Checking Overpass API server status...')
  const status = await osmClient.checkServerStatus()

  if (!status.healthy) {
    console.log('⚠️  Warning: Server may be congested')
  }

  // Define query categories - focus on pedestrian-friendly outdoor recreation
  const categories = [
    { name: 'State Parks', method: 'buildStateParksQuery' },
    { name: 'County Parks', method: 'buildCountyParksQuery' },
    { name: 'Nature Reserves', method: 'buildNatureReservesQuery' },
    { name: 'Walking Areas & Trails', method: 'buildWalkingAreasQuery' }
  ]

  let totalPOIs = 0
  let totalElements = 0
  const categoryResults = []

  // Query each category
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]

    console.log(`\n${'━'.repeat(60)}`)
    console.log(`📂 Category ${i + 1}/${categories.length}: ${category.name}`)
    console.log('━'.repeat(60))

    // Build and display query
    const query = osmClient[category.method]()
    console.log('\n📝 Overpass Query:')
    console.log('─'.repeat(60))
    console.log(query)
    console.log('─'.repeat(60))

    // Execute query
    console.log(`\n🌐 Querying ${category.name}...`)
    const startTime = Date.now()

    try {
      const osmData = await osmClient.queryOverpassAPI(query)
      const duration = Date.now() - startTime
      const elements = osmData.elements || []

      console.log(`✅ Query completed in ${(duration / 1000).toFixed(2)}s`)
      console.log(`📊 Received ${elements.length} OSM elements`)

      // Normalize POIs
      const pois = []
      for (const element of elements) {
        const poi = osmClient.normalizeToPOI(element)
        if (poi) pois.push(poi)
      }

      console.log(`✅ Normalized ${pois.length} valid POIs`)

      totalElements += elements.length
      totalPOIs += pois.length

      categoryResults.push({
        category: category.name,
        elements: elements.length,
        pois: pois.length,
        duration: (duration / 1000).toFixed(2),
        samplePOIs: pois.slice(0, 2)
      })

      // Rate limiting between queries
      if (i < categories.length - 1) {
        console.log('\n⏳ Rate limiting delay (350ms)...')
        await new Promise(resolve => setTimeout(resolve, 350))
      }

    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`)
      categoryResults.push({
        category: category.name,
        elements: 0,
        pois: 0,
        error: error.message
      })
    }
  }

  // Collect all POIs from all categories for deduplication check
  const allSamplePOIs = categoryResults
    .filter(r => r.samplePOIs)
    .flatMap(r => r.samplePOIs)

  // Check for duplicates in sample data
  const uniqueNames = new Set(allSamplePOIs.map(p => p.name.toLowerCase()))
  const sampleDuplicateCount = allSamplePOIs.length - uniqueNames.size

  // Display summary
  console.log(`\n${'━'.repeat(60)}`)
  console.log('📊 MULTI-QUERY DRY-RUN SUMMARY')
  console.log('━'.repeat(60))

  if (sampleDuplicateCount > 0) {
    console.log(`\n🔄 Deduplication: ${sampleDuplicateCount} duplicates detected in sample (will be removed during actual import)`)
  }

  console.log('\n📋 Category Breakdown:')
  for (const result of categoryResults) {
    if (result.error) {
      console.log(`   ${result.category}: ❌ ERROR - ${result.error}`)
    } else {
      console.log(`   ${result.category}: ${result.pois} POIs (${result.duration}s)`)
    }
  }

  console.log(`\n📊 Total Results:`)
  console.log(`   Elements: ${totalElements}`)
  console.log(`   Valid POIs: ${totalPOIs}`)
  console.log(`   Categories: ${categories.length}`)

  // Display samples
  console.log('\n📍 Sample POIs (2 per category):')
  for (const result of categoryResults) {
    if (result.samplePOIs && result.samplePOIs.length > 0) {
      console.log(`\n   ${result.category}:`)
      result.samplePOIs.forEach((poi, i) => {
        console.log(`   ${i + 1}. ${poi.name}`)
        console.log(`      Location: ${poi.lat.toFixed(4)}, ${poi.lng.toFixed(4)}`)
        console.log(`      Type: ${poi.park_type || 'N/A'}`)
      })
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ DRY-RUN COMPLETE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return totalPOIs
}

// Main import function
async function main() {
  const options = parseArgs()

  if (options.help) {
    printHelp()
    process.exit(0)
  }

  console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  🌲 Minnesota POI Import - Overpass API Integration           │
│  Phase 1.1: CLI Import Script                                  │
└─────────────────────────────────────────────────────────────────┘
`)

  console.log(`📋 Configuration:`)
  console.log(`   Environment: ${options.environment}`)
  console.log(`   Dry-run: ${options.dryRun ? 'YES' : 'NO'}`)
  console.log(`   Backup: ${options.skipBackup ? 'SKIP' : 'CREATE'}`)
  console.log(`   Status Check: ${options.skipStatusCheck ? 'SKIP' : 'RUN'}`)
  console.log(`   Verbose: ${options.verbose ? 'YES' : 'NO'}`)

  try {
    // Initialize usage tracker
    console.log('\n📊 Initializing usage tracker...')
    const usageTracker = new UsageTracker({ silent: !options.verbose })
    await usageTracker.load()
    usageTracker.printSummary()

    // Check if we can proceed
    const stats = usageTracker.getStats()
    if (!stats.canProceed) {
      console.log('🚨 CRITICAL: Daily usage quota exceeded')
      console.log('   Wait until tomorrow or use alternative Overpass instance')
      process.exit(1)
    }

    // Initialize OSM client
    console.log('\n🗺️  Initializing OSM Integration...')
    const nodeFetch = await import('node-fetch')
    const httpClient = nodeFetch.default
    const osmClient = new OSMIntegration(httpClient, {
      overpassUrl: process.env.OVERPASS_URL,
      timeout: parseInt(process.env.OVERPASS_TIMEOUT || '30000'),
      silent: !options.verbose
    })

    // Check server status
    if (!options.skipStatusCheck && !options.dryRun) {
      console.log('\n📡 Checking Overpass API server status...')
      const serverStatus = await osmClient.checkServerStatus()

      if (!serverStatus.healthy) {
        console.log('⚠️  Warning: Server may be congested')
        console.log('   Consider postponing import or proceed with caution')

        // Wait for user confirmation in non-dry-run mode
        if (!options.dryRun) {
          console.log('\n   Press Ctrl+C to abort, or wait 5 seconds to continue...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
    }

    // Dry-run mode
    if (options.dryRun) {
      const poiCount = await runMultiQueryDryRun(osmClient)
      process.exit(poiCount > 0 ? 0 : 1)
    }

    // Production import
    console.log('\n💾 Connecting to database...')
    const dbPool = getDatabaseConnection(options.environment)

    // Create backup
    let backupFile = null
    if (!options.skipBackup) {
      backupFile = await createDatabaseBackup(dbPool)
    }

    // Initialize database importer
    console.log('\n💾 Initializing Database Importer...')
    const dbImporter = new DatabaseImporter(dbPool, {
      silent: !options.verbose
    })

    // Initialize import coordinator
    console.log('\n🎯 Initializing Import Coordinator...')
    const coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: !options.verbose,
      checkpointFile: '.osm-import-checkpoint.json',
      rateLimitDelay: 350, // ~171 queries/min (under 180 limit)
      batchSize: 100
    })

    // Check for existing checkpoint
    const hasCheckpoint = await coordinator.hasCheckpoint()
    if (hasCheckpoint) {
      const checkpointStats = await coordinator.getCheckpointStats()
      console.log('\n📌 CHECKPOINT FOUND')
      console.log(`   Region: ${checkpointStats.region}`)
      console.log(`   Processed: ${checkpointStats.processed} POIs`)
      console.log(`   Inserted: ${checkpointStats.inserted}`)
      console.log(`   Has Error: ${checkpointStats.hasError ? 'YES' : 'NO'}`)
      console.log('\n   Resuming from checkpoint...')
    }

    // Multi-query import (run each category separately to avoid timeouts)
    console.log('\n🚀 Starting Multi-Category Minnesota POI import...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const importStartTime = Date.now()

    // Define query categories
    const categories = [
      { name: 'State Parks', method: 'buildStateParksQuery' },
      { name: 'County Parks', method: 'buildCountyParksQuery' },
      { name: 'Nature Reserves', method: 'buildNatureReservesQuery' },
      { name: 'Walking Areas & Trails', method: 'buildWalkingAreasQuery' }
    ]

    // Run imports for each category
    let totalInserted = 0
    let totalSkipped = 0
    let totalErrors = 0

    for (const category of categories) {
      console.log(`\n📂 Importing ${category.name}...`)
      const query = osmClient[category.method]()
      const categoryStats = await coordinator.regionalImport(`Minnesota-${category.name}`, query)

      totalInserted += categoryStats.inserted
      totalSkipped += categoryStats.skipped
      totalErrors += categoryStats.errors

      console.log(`✅ ${category.name}: ${categoryStats.inserted} inserted, ${categoryStats.skipped} skipped`)
    }

    const importDuration = Date.now() - importStartTime

    // Create combined stats
    const importStats = {
      region: 'Minnesota',
      total: totalInserted + totalSkipped,
      processed: totalInserted + totalSkipped,
      inserted: totalInserted,
      skipped: totalSkipped,
      errors: totalErrors,
      batches: categories.length
    }

    // Track usage
    const responseSize = JSON.stringify(importStats).length
    await usageTracker.trackRequest(responseSize, importDuration)

    // Print final statistics
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ IMPORT COMPLETE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Region: ${importStats.region}`)
    console.log(`   Total POIs: ${importStats.total}`)
    console.log(`   Processed: ${importStats.processed}`)
    console.log(`   Inserted: ${importStats.inserted}`)
    console.log(`   Skipped: ${importStats.skipped}`)
    console.log(`   Errors: ${importStats.errors}`)
    console.log(`   Batches: ${importStats.batches}`)
    console.log(`   Duration: ${(importDuration / 1000).toFixed(2)}s`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Print updated usage
    console.log('\n📊 Updated Usage Statistics:')
    usageTracker.printSummary()

    // Print backup info
    if (backupFile) {
      console.log(`\n💾 Backup: ${backupFile}`)
    }

    // Success message
    if (importStats.inserted > 0) {
      console.log('\n🎉 SUCCESS: Minnesota POI data enriched with OSM metadata')
      console.log(`   ${importStats.inserted} POIs imported from OpenStreetMap`)
      console.log('\n   Next steps:')
      console.log('   1. Verify data via API: curl "http://localhost:4000/api/poi-locations?limit=5"')
      console.log('   2. Check park_type populated: Look for non-null park_type values')
      console.log('   3. Validate amenities/activities: Check for populated arrays')
    } else {
      console.log('\n⚠️  WARNING: No POIs were inserted')
      console.log('   This may indicate:')
      console.log('   - All POIs already exist in database (duplicates)')
      console.log('   - Data validation rejected all POIs')
      console.log('   - Empty Overpass API response')
    }

    // Close database connection
    await dbPool.end()

    process.exit(importStats.errors > 0 ? 1 : 0)

  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('❌ IMPORT FAILED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Error: ${error.message}`)
    if (error.stack && options.verbose) {
      console.log(`\n   Stack Trace:\n${error.stack}`)
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Check for checkpoint
    const coordinator = new ImportCoordinator(null, null, { silent: true })
    const hasCheckpoint = await coordinator.hasCheckpoint()

    if (hasCheckpoint) {
      console.log('📌 Checkpoint saved - you can resume the import by running:')
      console.log(`   node scripts/run-minnesota-import.js --environment ${options.environment}`)
    }

    console.log('\n💡 Troubleshooting:')
    console.log('   - Check DATABASE_URL environment variable')
    console.log('   - Verify Overpass API is accessible')
    console.log('   - Review .osm-import-checkpoint.json for details')
    console.log('   - Use --dry-run to test Overpass query')
    console.log('   - Use --verbose for detailed logging\n')

    process.exit(1)
  }
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { parseArgs, runMultiQueryDryRun }
