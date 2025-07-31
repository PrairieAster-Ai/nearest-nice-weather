#!/usr/bin/env node

/**
 * ========================================================================
 * ETL FRAMEWORK - Minnesota POI Database Deployment
 * ========================================================================
 * 
 * @CLAUDE_CONTEXT: Phase 2 - ETL Pipeline Implementation
 * @BUSINESS_PURPOSE: Load 200+ Minnesota parks from external APIs
 * @TECHNICAL_APPROACH: OSS-proven patterns with error handling and retry logic
 * 
 * Story: Minnesota POI Database Deployment (#155)
 * Phase: 2 - ETL Pipeline Implementation
 * Created: 2025-01-30
 * ========================================================================
 */

import dotenv from 'dotenv'
import pkg from 'pg'
const { Pool } = pkg
import fs from 'fs'

// Load environment variables
dotenv.config()

class ETLFramework {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    
    this.stats = {
      totalAttempted: 0,
      totalInserted: 0,
      totalSkipped: 0,
      totalErrors: 0,
      sources: {}
    }
    
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000, // milliseconds
      batchSize: 50,
      duplicateThreshold: 0.009 // degrees (~1km)
    }
    
    console.log('🚀 ETL Framework initialized')
  }
  
  /**
   * PROGRESS REPORTING SYSTEM
   * Updates development status file for real-time monitoring
   */
  updateProgress(phase, task, progress, details = '') {
    const timestamp = new Date().toISOString()
    const statusUpdate = `
## 📊 PHASE 2 PROGRESS UPDATE
**Time**: ${timestamp}
**Current Task**: ${task}
**Progress**: ${progress}%
**Details**: ${details}

**Statistics**:
- Attempted: ${this.stats.totalAttempted}
- Inserted: ${this.stats.totalInserted} 
- Skipped: ${this.stats.totalSkipped}
- Errors: ${this.stats.totalErrors}
`
    
    console.log(`📊 Progress: ${task} - ${progress}% ${details ? '- ' + details : ''}`)
    
    // Update development status file
    this.appendToStatusFile(statusUpdate)
  }
  
  appendToStatusFile(content) {
    try {
      fs.appendFileSync('DEVELOPMENT-STATUS.md', '\n' + content)
    } catch (error) {
      console.log('Note: Could not update status file:', error.message)
    }
  }
  
  /**
   * ERROR HANDLING WITH RETRY LOGIC
   * Implements exponential backoff for external API calls
   */
  async executeWithRetry(operation, context = '') {
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        console.log(`⚠️  Attempt ${attempt}/${this.config.retryAttempts} failed for ${context}: ${error.message}`)
        
        if (attempt === this.config.retryAttempts) {
          this.stats.totalErrors++
          throw new Error(`Failed after ${this.config.retryAttempts} attempts: ${error.message}`)
        }
        
        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ Retrying in ${delay}ms...`)
        await this.sleep(delay)
      }
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * DUPLICATE DETECTION AND PREVENTION
   * Uses geographic proximity to prevent duplicate POIs
   */
  async checkDuplicate(lat, lng, name) {
    const client = await this.pool.connect()
    
    try {
      const result = await client.query(`
        SELECT id, name, 
               ABS(lat - $1) + ABS(lng - $2) as proximity
        FROM poi_locations 
        WHERE ABS(lat - $1) < $3 AND ABS(lng - $2) < $3
        ORDER BY proximity ASC
        LIMIT 1
      `, [lat, lng, this.config.duplicateThreshold])
      
      if (result.rows.length > 0) {
        const existing = result.rows[0]
        console.log(`🔍 Potential duplicate: "${name}" near existing "${existing.name}" (ID: ${existing.id})`)
        return { isDuplicate: true, existing: existing }
      }
      
      return { isDuplicate: false }
      
    } finally {
      client.release()
    }
  }
  
  /**
   * BULK INSERT WITH TRANSACTION SAFETY
   * Processes POIs in batches with rollback capability
   */
  async insertPOI(poiData) {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Validate required fields
      if (!poiData.name || !poiData.lat || !poiData.lng) {
        throw new Error('Missing required fields: name, lat, lng')
      }
      
      // Validate Minnesota bounds
      if (poiData.lat < 43.499356 || poiData.lat > 49.384472 ||
          poiData.lng < -97.239209 || poiData.lng > -89.491739) {
        throw new Error(`GPS coordinates outside Minnesota bounds: ${poiData.lat}, ${poiData.lng}`)
      }
      
      // Check for duplicates
      const duplicateCheck = await this.checkDuplicate(poiData.lat, poiData.lng, poiData.name)
      if (duplicateCheck.isDuplicate) {
        this.stats.totalSkipped++
        await client.query('ROLLBACK')
        return { success: false, reason: 'duplicate', existing: duplicateCheck.existing }
      }
      
      // Insert POI
      const result = await client.query(`
        INSERT INTO poi_locations (
          name, lat, lng, park_type, data_source, description,
          osm_id, osm_type, search_name, place_rank, external_id, last_modified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        poiData.name,
        poiData.lat, 
        poiData.lng,
        poiData.park_type || 'Park',
        poiData.data_source || 'etl',
        poiData.description || `${poiData.name} - Minnesota outdoor recreation location`,
        poiData.osm_id || null,
        poiData.osm_type || null,
        JSON.stringify({
          primary: poiData.name,
          variations: [poiData.name, ...(poiData.name_variations || [])]
        }),
        this.calculateImportanceRank(poiData),
        poiData.external_id || null
      ])
      
      await client.query('COMMIT')
      this.stats.totalInserted++
      
      console.log(`✅ Inserted: ${poiData.name} (ID: ${result.rows[0].id}) from ${poiData.data_source}`)
      return { success: true, id: result.rows[0].id }
      
    } catch (error) {
      await client.query('ROLLBACK')
      this.stats.totalErrors++
      console.log(`❌ Failed to insert ${poiData.name}: ${error.message}`)
      throw error
      
    } finally {
      client.release()
    }
  }
  
  /**
   * IMPORTANCE RANKING ALGORITHM
   * Assigns priority ranking based on park type and features
   */
  calculateImportanceRank(poiData) {
    // Lower numbers = higher importance (1-30 scale)
    const rankMap = {
      'National Park': 5,
      'State Park': 10, 
      'County Park': 20,
      'Regional Park': 20,
      'Wildlife Area': 25,
      'Local Park': 30,
      'Park': 25 // default
    }
    
    return rankMap[poiData.park_type] || 25
  }
  
  /**
   * DATA SOURCE ORCHESTRATION
   * Coordinates multiple data source integrations
   */
  async processDataSource(sourceName, extractFunction) {
    console.log(`\n🔄 Processing data source: ${sourceName}`)
    this.updateProgress('ETL Pipeline', `Processing ${sourceName}`, 0, 'Starting data extraction')
    
    this.stats.sources[sourceName] = {
      attempted: 0,
      inserted: 0,
      skipped: 0,
      errors: 0
    }
    
    try {
      const data = await this.executeWithRetry(extractFunction, sourceName)
      console.log(`📊 ${sourceName}: ${data.length} POIs to process`)
      
      let processed = 0
      for (const poi of data) {
        this.stats.totalAttempted++
        this.stats.sources[sourceName].attempted++
        
        try {
          const result = await this.insertPOI(poi)
          if (result.success) {
            this.stats.sources[sourceName].inserted++
          } else {
            this.stats.sources[sourceName].skipped++
          }
        } catch (error) {
          this.stats.sources[sourceName].errors++
          console.log(`⚠️  Skipping ${poi.name}: ${error.message}`)
        }
        
        processed++
        if (processed % 10 === 0) {
          const progress = Math.round((processed / data.length) * 100)
          this.updateProgress('ETL Pipeline', `Processing ${sourceName}`, progress, `${processed}/${data.length} POIs`)
        }
      }
      
      console.log(`✅ ${sourceName} complete: ${this.stats.sources[sourceName].inserted} inserted, ${this.stats.sources[sourceName].skipped} skipped, ${this.stats.sources[sourceName].errors} errors`)
      this.updateProgress('ETL Pipeline', `${sourceName} Complete`, 100, `${this.stats.sources[sourceName].inserted} POIs added`)
      
    } catch (error) {
      console.log(`❌ ${sourceName} failed: ${error.message}`)
      this.updateProgress('ETL Pipeline', `${sourceName} Failed`, 0, error.message)
      this.stats.sources[sourceName].errors++
    }
  }
  
  /**
   * FINAL STATISTICS AND REPORTING
   * Generates completion report for monitoring
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_attempted: this.stats.totalAttempted,
        total_inserted: this.stats.totalInserted,
        total_skipped: this.stats.totalSkipped,
        total_errors: this.stats.totalErrors,
        success_rate: this.stats.totalAttempted > 0 ? 
          Math.round((this.stats.totalInserted / this.stats.totalAttempted) * 100) : 0
      },
      sources: this.stats.sources
    }
    
    console.log('\n📊 ETL PIPELINE COMPLETION REPORT')
    console.log('=====================================')
    console.log(`Total Attempted: ${report.summary.total_attempted}`)
    console.log(`Successfully Inserted: ${report.summary.total_inserted}`)
    console.log(`Skipped (Duplicates): ${report.summary.total_skipped}`) 
    console.log(`Errors: ${report.summary.total_errors}`)
    console.log(`Success Rate: ${report.summary.success_rate}%`)
    console.log('\nSource Breakdown:')
    
    Object.entries(report.sources).forEach(([source, stats]) => {
      console.log(`  ${source}: ${stats.inserted} inserted, ${stats.skipped} skipped, ${stats.errors} errors`)
    })
    
    // Update final status
    this.updateProgress('ETL Pipeline', 'Complete', 100, `${report.summary.total_inserted} total POIs loaded`)
    
    return report
  }
  
  /**
   * CLEANUP AND SHUTDOWN
   * Proper resource cleanup
   */
  async cleanup() {
    console.log('🧹 Cleaning up ETL framework...')
    await this.pool.end()
    console.log('✅ ETL Framework shutdown complete')
  }
}

export default ETLFramework