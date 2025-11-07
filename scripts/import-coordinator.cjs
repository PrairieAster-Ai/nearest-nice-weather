#!/usr/bin/env node

/**
 * ========================================================================
 * IMPORT COORDINATOR - Incremental POI Import with Checkpoint Recovery
 * ========================================================================
 *
 * @CLAUDE_CONTEXT: Regional import coordinator for 1,000+ POI Overpass imports
 * @BUSINESS_PURPOSE: Import entire USA POI data with fault tolerance
 * @TECHNICAL_APPROACH: Checkpoint-based recovery with rate limiting
 *
 * Story: Minnesota POI Database Deployment (#155)
 * Phase: 3 - Incremental Import Strategy
 * Created: 2025-01-30
 * ========================================================================
 */

const fs = require('fs').promises
const path = require('path')

class ImportCoordinator {
  /**
   * @param {OSMIntegration} osmClient - OSM API client
   * @param {DatabaseImporter} dbImporter - Database importer
   * @param {Object} options - Configuration options
   */
  constructor(osmClient, dbImporter, options = {}) {
    this.osmClient = osmClient
    this.dbImporter = dbImporter
    this.checkpointFile = options.checkpointFile || '.osm-import-checkpoint.json'
    this.rateLimitDelay = options.rateLimitDelay !== undefined ? options.rateLimitDelay : 350 // ~180 queries/minute
    this.batchSize = options.batchSize || 100
    this.maxRetries = options.maxRetries || 3

    if (!options.silent) {
      console.log('🎯 ImportCoordinator initialized')
    }
  }

  /**
   * REGIONAL IMPORT WITH CHECKPOINTS
   * Imports POIs for a specific region with save/resume capability
   */
  async regionalImport(regionName, overpassQuery) {
    console.log(`🌎 Starting regional import: ${regionName}`)

    try {
      // Check for existing checkpoint
      const checkpoint = await this.loadCheckpoint()

      if (checkpoint && checkpoint.region === regionName) {
        console.log(`📌 Resuming from checkpoint: ${checkpoint.processed} POIs processed`)
      } else {
        console.log(`🆕 Starting new import for ${regionName}`)
      }

      // Fetch OSM data with rate limiting
      console.log('🌐 Querying Overpass API...')
      await this.waitForRateLimit()

      const osmData = await this.osmClient.queryOverpassAPI(overpassQuery)
      const elements = osmData.elements || []

      console.log(`📦 Received ${elements.length} OSM elements`)

      // Normalize OSM elements to POI format
      const pois = []
      for (const element of elements) {
        const poi = this.osmClient.normalizeToPOI(element)
        if (poi) {
          pois.push(poi)
        }
      }

      console.log(`✅ Normalized ${pois.length} valid POIs`)

      // Deduplicate POIs by name and location (within 10 meters)
      const deduplicated = this.deduplicatePOIs(pois)
      const duplicatesRemoved = pois.length - deduplicated.length
      if (duplicatesRemoved > 0) {
        console.log(`🔄 Removed ${duplicatesRemoved} duplicate POIs`)
      }

      // Import in batches with checkpoint saving
      const stats = await this.batchImportWithCheckpoints(regionName, deduplicated, checkpoint)

      // Clear checkpoint on success
      await this.clearCheckpoint()

      console.log(`🎉 Regional import complete: ${regionName}`)
      return stats

    } catch (error) {
      console.log(`❌ Regional import failed: ${error.message}`)
      throw error
    }
  }

  /**
   * BATCH IMPORT WITH CHECKPOINT SAVING
   * Imports POIs in batches, saving checkpoint after each batch
   */
  async batchImportWithCheckpoints(regionName, pois, checkpoint) {
    const startIndex = checkpoint?.processed || 0
    const totalPois = pois.length
    const stats = {
      region: regionName,
      total: totalPois,
      processed: startIndex,
      inserted: checkpoint?.inserted || 0,
      skipped: checkpoint?.skipped || 0,
      errors: checkpoint?.errors || 0,
      batches: checkpoint?.batches || 0
    }

    console.log(`📊 Processing ${totalPois - startIndex} POIs in batches of ${this.batchSize}`)

    for (let i = startIndex; i < totalPois; i += this.batchSize) {
      const batch = pois.slice(i, Math.min(i + this.batchSize, totalPois))
      const batchNum = Math.floor(i / this.batchSize) + 1

      console.log(`📦 Processing batch ${batchNum}: ${batch.length} POIs (${i + 1}-${i + batch.length} of ${totalPois})`)

      try {
        // Import batch
        const batchStats = await this.dbImporter.batchImport(batch)

        // Update stats
        stats.processed = i + batch.length
        stats.inserted += batchStats.inserted
        stats.skipped += batchStats.skipped
        stats.errors += batchStats.errors
        stats.batches++

        // Save checkpoint
        await this.saveCheckpoint({
          region: regionName,
          processed: stats.processed,
          inserted: stats.inserted,
          skipped: stats.skipped,
          errors: stats.errors,
          batches: stats.batches,
          timestamp: new Date().toISOString()
        })

        console.log(`✅ Batch ${batchNum} complete: +${batchStats.inserted} inserted, ${batchStats.skipped} skipped`)

        // Rate limiting between batches
        if (i + batch.length < totalPois) {
          await this.waitForRateLimit()
        }

      } catch (error) {
        console.log(`❌ Batch ${batchNum} failed: ${error.message}`)
        stats.errors++

        // Save checkpoint before failing
        await this.saveCheckpoint({
          region: regionName,
          processed: stats.processed,
          inserted: stats.inserted,
          skipped: stats.skipped,
          errors: stats.errors,
          batches: stats.batches,
          error: error.message,
          timestamp: new Date().toISOString()
        })

        throw error
      }
    }

    return stats
  }

  /**
   * DEDUPLICATE POIs
   * Removes duplicate POIs based on name and proximity (within 10 meters)
   * OSM data often has the same feature as multiple element types (node/way/relation)
   *
   * @param {Array} pois - Array of POI objects
   * @returns {Array} Deduplicated array of POIs
   */
  deduplicatePOIs(pois) {
    const seen = new Map()
    const deduplicated = []

    for (const poi of pois) {
      // Create a normalized key: lowercase name + rounded coordinates
      const normalizedName = poi.name.toLowerCase().trim()
      const roundedLat = Math.round(poi.latitude * 1000) / 1000  // ~111 meter precision
      const roundedLng = Math.round(poi.longitude * 1000) / 1000
      const key = `${normalizedName}:${roundedLat}:${roundedLng}`

      if (!seen.has(key)) {
        seen.set(key, poi)
        deduplicated.push(poi)
      } else {
        // If duplicate found, prefer the one with more complete data
        const existing = seen.get(key)
        if (this.isMoreCompletePOI(poi, existing)) {
          // Replace existing with more complete version
          const index = deduplicated.indexOf(existing)
          deduplicated[index] = poi
          seen.set(key, poi)
        }
      }
    }

    return deduplicated
  }

  /**
   * IS MORE COMPLETE POI
   * Compares two POIs and returns true if the first has more complete data
   *
   * @param {Object} poi1 - First POI
   * @param {Object} poi2 - Second POI
   * @returns {boolean} True if poi1 is more complete than poi2
   */
  isMoreCompletePOI(poi1, poi2) {
    // Count non-null fields
    const count1 = Object.values(poi1).filter(v => v != null && v !== '').length
    const count2 = Object.values(poi2).filter(v => v != null && v !== '').length

    return count1 > count2
  }

  /**
   * RATE LIMITING
   * Waits to comply with Overpass API rate limits (180 queries/minute)
   */
  async waitForRateLimit() {
    if (this.rateLimitDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
    }
  }

  /**
   * SAVE CHECKPOINT
   * Saves import progress to file
   */
  async saveCheckpoint(checkpoint) {
    try {
      await fs.writeFile(
        this.checkpointFile,
        JSON.stringify(checkpoint, null, 2),
        'utf-8'
      )
    } catch (error) {
      console.log(`⚠️  Failed to save checkpoint: ${error.message}`)
    }
  }

  /**
   * LOAD CHECKPOINT
   * Loads import progress from file
   */
  async loadCheckpoint() {
    try {
      const data = await fs.readFile(this.checkpointFile, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null // No checkpoint file exists
      }
      console.log(`⚠️  Failed to load checkpoint: ${error.message}`)
      return null
    }
  }

  /**
   * CLEAR CHECKPOINT
   * Removes checkpoint file after successful import
   */
  async clearCheckpoint() {
    try {
      await fs.unlink(this.checkpointFile)
      console.log('🗑️  Checkpoint cleared')
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`⚠️  Failed to clear checkpoint: ${error.message}`)
      }
    }
  }

  /**
   * RESUME FROM CHECKPOINT
   * Checks if there's a checkpoint to resume from
   */
  async hasCheckpoint() {
    const checkpoint = await this.loadCheckpoint()
    return checkpoint !== null
  }

  /**
   * GET CHECKPOINT STATS
   * Returns current checkpoint statistics
   */
  async getCheckpointStats() {
    const checkpoint = await this.loadCheckpoint()
    if (!checkpoint) {
      return null
    }

    return {
      region: checkpoint.region,
      processed: checkpoint.processed,
      inserted: checkpoint.inserted,
      skipped: checkpoint.skipped,
      errors: checkpoint.errors,
      batches: checkpoint.batches,
      timestamp: checkpoint.timestamp,
      hasError: !!checkpoint.error
    }
  }
}

// Export for both ES6 and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImportCoordinator
  module.exports.default = ImportCoordinator
}
