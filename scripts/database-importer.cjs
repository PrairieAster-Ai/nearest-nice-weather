#!/usr/bin/env node

/**
 * ========================================================================
 * DATABASE IMPORTER - Safe POI Batch Import with Transaction Support
 * ========================================================================
 *
 * @CLAUDE_CONTEXT: Database import safety for Overpass API integration
 * @BUSINESS_PURPOSE: Safely import 1,000+ POIs from OSM with validation
 * @TECHNICAL_APPROACH: PostgreSQL transactions with rollback on error
 *
 * Story: Minnesota POI Database Deployment (#155)
 * Phase: 2 - Database Import Safety
 * Created: 2025-01-30
 * ========================================================================
 */

const { Pool } = require('pg')

class DatabaseImporter {
  /**
   * @param {Pool} dbClient - PostgreSQL client pool
   * @param {Object} options - Configuration options
   */
  constructor(dbClient, options = {}) {
    this.dbClient = dbClient
    this.minnesotaBounds = options.minnesotaBounds || {
      south: 43.499356,
      north: 49.384472,
      west: -97.239209,
      east: -89.491739
    }
    this.duplicateThresholdMeters = options.duplicateThresholdMeters || 10
    this.batchSize = options.batchSize || 100

    if (!options.silent) {
      console.log('💾 DatabaseImporter initialized')
    }
  }

  /**
   * BATCH IMPORT WITH TRANSACTION SAFETY
   * Imports POI array with rollback on any error
   */
  async batchImport(pois) {
    const client = await this.dbClient.connect()
    const stats = {
      inserted: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0,
      invalidated: 0
    }

    try {
      // BEGIN TRANSACTION
      await client.query('BEGIN')

      console.log(`📦 Importing ${pois.length} POIs in transaction...`)

      for (const poi of pois) {
        try {
          // Validate POI before inserting
          const validation = this.validatePOI(poi)
          if (!validation.valid) {
            console.log(`⚠️  Skipping invalid POI: ${validation.reason}`)
            stats.invalidated++
            stats.skipped++
            continue
          }

          // Check for duplicates (within 10 meters)
          const isDuplicate = await this.checkDuplicate(client, poi.lat, poi.lng)
          if (isDuplicate) {
            console.log(`🔁 Skipping duplicate: ${poi.name} (within ${this.duplicateThresholdMeters}m)`)
            stats.duplicates++
            stats.skipped++
            continue
          }

          // Insert POI
          await this.insertPOI(client, poi)
          stats.inserted++

        } catch (error) {
          console.log(`❌ Error processing POI ${poi.name}: ${error.message}`)
          console.log(`   POI Data:`, JSON.stringify(poi, null, 2))
          stats.errors++
          throw error // Rollback transaction on error
        }
      }

      // COMMIT TRANSACTION
      await client.query('COMMIT')
      console.log(`✅ Transaction committed: ${stats.inserted} POIs inserted`)

      return stats

    } catch (error) {
      // ROLLBACK TRANSACTION
      await client.query('ROLLBACK')
      console.log(`🔄 Transaction rolled back: ${error.message}`)
      throw error

    } finally {
      client.release()
    }
  }

  /**
   * VALIDATE POI DATA
   * Checks required fields and Minnesota bounds
   */
  validatePOI(poi) {
    // Required field: name (min 3 chars)
    if (!poi.name || typeof poi.name !== 'string' || poi.name.length < 3) {
      return { valid: false, reason: 'Name required (min 3 characters)' }
    }

    // Required field: lat
    if (typeof poi.lat !== 'number' || isNaN(poi.lat)) {
      return { valid: false, reason: 'Valid latitude required' }
    }

    // Required field: lng
    if (typeof poi.lng !== 'number' || isNaN(poi.lng)) {
      return { valid: false, reason: 'Valid longitude required' }
    }

    // Minnesota bounds validation
    if (!this.isInMinnesotaBounds(poi.lat, poi.lng)) {
      return { valid: false, reason: `Coordinates outside Minnesota bounds: ${poi.lat}, ${poi.lng}` }
    }

    return { valid: true }
  }

  /**
   * CHECK MINNESOTA BOUNDS
   */
  isInMinnesotaBounds(lat, lng) {
    return (
      lat >= this.minnesotaBounds.south &&
      lat <= this.minnesotaBounds.north &&
      lng >= this.minnesotaBounds.west &&
      lng <= this.minnesotaBounds.east
    )
  }

  /**
   * CHECK FOR DUPLICATE POIS
   * Uses Haversine formula to find POIs within threshold distance
   */
  async checkDuplicate(client, lat, lng) {
    const thresholdMiles = this.duplicateThresholdMeters / 1609.34 // Convert meters to miles

    // Use GREATEST/LEAST to clamp acos input to valid range [-1, 1]
    // This prevents "input is out of range" errors from floating-point precision issues
    const result = await client.query(`
      SELECT id, name,
        (3959 * acos(
          GREATEST(-1, LEAST(1,
            cos(radians($1)) * cos(radians(lat)) *
            cos(radians(lng) - radians($2)) +
            sin(radians($1)) * sin(radians(lat))
          ))
        )) as distance_miles
      FROM poi_locations
      WHERE (3959 * acos(
        GREATEST(-1, LEAST(1,
          cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        ))
      )) < $3
      LIMIT 1
    `, [lat, lng, thresholdMiles])

    return result.rows.length > 0
  }

  /**
   * INSERT POI INTO DATABASE
   * Handles all poi_locations table fields
   */
  async insertPOI(client, poi) {
    await client.query(`
      INSERT INTO poi_locations (
        name, lat, lng, park_type, park_level, ownership, operator,
        data_source, description, place_rank, phone, website, amenities, activities
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
    `, [
      poi.name,
      poi.lat,
      poi.lng,
      poi.park_type || null,
      poi.park_level || null,
      poi.ownership || null,
      poi.operator || null,
      poi.data_source || 'osm_overpass',
      poi.description || null,
      poi.place_rank || 50,
      poi.phone || null,
      poi.website || null,
      poi.amenities || [],  // Pass as array, not JSON string
      poi.activities || []  // Pass as array, not JSON string
    ])
  }

  /**
   * GET IMPORT STATISTICS
   * Returns POI counts by data source
   */
  async getImportStats(client) {
    const result = await client.query(`
      SELECT
        data_source,
        COUNT(*) as count
      FROM poi_locations
      GROUP BY data_source
      ORDER BY count DESC
    `)

    return result.rows
  }
}

// Export for both ES6 and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseImporter
  module.exports.default = DatabaseImporter
}
