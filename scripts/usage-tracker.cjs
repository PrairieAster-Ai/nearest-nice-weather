#!/usr/bin/env node

/**
 * ========================================================================
 * USAGE TRACKER - Overpass API Usage Monitoring
 * ========================================================================
 *
 * @CLAUDE_CONTEXT: Track daily Overpass API usage to stay within limits
 * @BUSINESS_PURPOSE: Prevent exceeding Overpass public instance quotas
 * @TECHNICAL_APPROACH: Daily request/bandwidth tracking with warning thresholds
 *
 * Overpass API Public Instance Limits:
 * - ~10,000 requests/day maximum
 * - ~1 GB download volume/day maximum
 *
 * Story: Minnesota POI Database Deployment (#155)
 * Phase: 3 - Production-Ready API Integration
 * Created: 2025-11-06
 * ========================================================================
 */

const fs = require('fs').promises
const path = require('path')

class UsageTracker {
  /**
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.storageFile = options.storageFile || '.overpass-usage.json'
    this.dailyRequestLimit = options.dailyRequestLimit || 10000
    this.dailyBytesLimit = options.dailyBytesLimit || 1073741824 // 1 GB
    this.warningThreshold = options.warningThreshold || 0.8 // 80%

    // In-memory state (loaded from file)
    this.dailyRequests = 0
    this.dailyBytes = 0
    this.lastResetDate = new Date().toDateString()
    this.requestHistory = [] // Array of {timestamp, bytes, duration}

    if (!options.silent) {
      console.log('📊 UsageTracker initialized')
    }
  }

  /**
   * LOAD USAGE DATA FROM FILE
   * Restores state from persistent storage
   */
  async load() {
    try {
      const data = await fs.readFile(this.storageFile, 'utf-8')
      const state = JSON.parse(data)

      this.dailyRequests = state.dailyRequests || 0
      this.dailyBytes = state.dailyBytes || 0
      this.lastResetDate = state.lastResetDate || new Date().toDateString()
      this.requestHistory = state.requestHistory || []

      // Reset if it's a new day
      const today = new Date().toDateString()
      if (today !== this.lastResetDate) {
        await this.reset()
      }

      console.log(`📊 Loaded usage: ${this.dailyRequests} requests, ${(this.dailyBytes / (1024 * 1024)).toFixed(2)} MB`)

    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, start fresh
        console.log('📊 Starting fresh usage tracking')
        await this.save()
      } else {
        console.log(`⚠️  Failed to load usage data: ${error.message}`)
      }
    }
  }

  /**
   * SAVE USAGE DATA TO FILE
   * Persists state for cross-session tracking
   */
  async save() {
    try {
      const state = {
        dailyRequests: this.dailyRequests,
        dailyBytes: this.dailyBytes,
        lastResetDate: this.lastResetDate,
        requestHistory: this.requestHistory.slice(-100), // Keep last 100 requests
        lastUpdated: new Date().toISOString()
      }

      await fs.writeFile(
        this.storageFile,
        JSON.stringify(state, null, 2),
        'utf-8'
      )

    } catch (error) {
      console.log(`⚠️  Failed to save usage data: ${error.message}`)
    }
  }

  /**
   * RESET DAILY COUNTERS
   * Called automatically at midnight (new day)
   */
  async reset() {
    console.log(`🔄 Resetting daily usage counters (previous: ${this.dailyRequests} requests, ${(this.dailyBytes / (1024 * 1024)).toFixed(2)} MB)`)

    this.dailyRequests = 0
    this.dailyBytes = 0
    this.lastResetDate = new Date().toDateString()
    this.requestHistory = []

    await this.save()
  }

  /**
   * TRACK API REQUEST
   * Records request and checks thresholds
   * @param {number} responseSize - Response size in bytes
   * @param {number} duration - Request duration in milliseconds
   */
  async trackRequest(responseSize, duration = 0) {
    const today = new Date().toDateString()

    // Reset counters at midnight
    if (today !== this.lastResetDate) {
      await this.reset()
    }

    // Update counters
    this.dailyRequests++
    this.dailyBytes += responseSize

    // Record in history
    this.requestHistory.push({
      timestamp: new Date().toISOString(),
      bytes: responseSize,
      duration
    })

    // Persist to file
    await this.save()

    // Check thresholds and warn
    this.checkThresholds()

    return {
      dailyRequests: this.dailyRequests,
      dailyBytes: this.dailyBytes,
      percentUsed: {
        requests: (this.dailyRequests / this.dailyRequestLimit) * 100,
        bandwidth: (this.dailyBytes / this.dailyBytesLimit) * 100
      }
    }
  }

  /**
   * CHECK USAGE THRESHOLDS
   * Warns when approaching daily limits
   */
  checkThresholds() {
    const requestPercent = this.dailyRequests / this.dailyRequestLimit
    const bandwidthPercent = this.dailyBytes / this.dailyBytesLimit

    // Request threshold warnings
    if (requestPercent >= 1.0) {
      console.log(`🚨 CRITICAL: Daily request limit exceeded (${this.dailyRequests}/${this.dailyRequestLimit})`)
      console.log('   Stop imports immediately to avoid being blocked')
    } else if (requestPercent >= this.warningThreshold) {
      console.log(`⚠️  Warning: ${(requestPercent * 100).toFixed(0)}% of daily requests used (${this.dailyRequests}/${this.dailyRequestLimit})`)
    }

    // Bandwidth threshold warnings
    const dailyMB = this.dailyBytes / (1024 * 1024)
    const limitMB = this.dailyBytesLimit / (1024 * 1024)
    if (bandwidthPercent >= 1.0) {
      console.log(`🚨 CRITICAL: Daily bandwidth limit exceeded (${dailyMB.toFixed(0)}/${limitMB.toFixed(0)} MB)`)
      console.log('   Stop imports immediately to avoid being blocked')
    } else if (bandwidthPercent >= this.warningThreshold) {
      console.log(`⚠️  Warning: ${(bandwidthPercent * 100).toFixed(0)}% of daily bandwidth used (${dailyMB.toFixed(0)}/${limitMB.toFixed(0)} MB)`)
    }
  }

  /**
   * GET USAGE STATISTICS
   * Returns current usage summary
   */
  getStats() {
    const dailyMB = this.dailyBytes / (1024 * 1024)
    const limitMB = this.dailyBytesLimit / (1024 * 1024)

    return {
      dailyRequests: this.dailyRequests,
      dailyRequestLimit: this.dailyRequestLimit,
      requestsRemaining: Math.max(0, this.dailyRequestLimit - this.dailyRequests),
      requestPercentUsed: (this.dailyRequests / this.dailyRequestLimit) * 100,

      dailyMB: dailyMB,
      dailyMBLimit: limitMB,
      bandwidthRemaining: Math.max(0, limitMB - dailyMB),
      bandwidthPercentUsed: (this.dailyBytes / this.dailyBytesLimit) * 100,

      lastResetDate: this.lastResetDate,
      totalRequests: this.requestHistory.length,

      canProceed: this.dailyRequests < this.dailyRequestLimit && this.dailyBytes < this.dailyBytesLimit
    }
  }

  /**
   * ESTIMATE REMAINING CAPACITY
   * Estimates how many more imports can be performed today
   * @param {number} avgRequestSize - Average request size in bytes (default 100KB)
   * @returns {number} Estimated number of remaining imports
   */
  estimateRemainingCapacity(avgRequestSize = 102400) {
    const requestsRemaining = Math.max(0, this.dailyRequestLimit - this.dailyRequests)
    const bytesRemaining = Math.max(0, this.dailyBytesLimit - this.dailyBytes)

    const requestCapacity = requestsRemaining
    const bandwidthCapacity = Math.floor(bytesRemaining / avgRequestSize)

    // Return the more restrictive limit
    return Math.min(requestCapacity, bandwidthCapacity)
  }

  /**
   * PRINT USAGE SUMMARY
   * Displays formatted usage statistics
   */
  printSummary() {
    const stats = this.getStats()

    console.log('\n📊 Overpass API Usage Summary')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Requests:  ${stats.dailyRequests}/${stats.dailyRequestLimit} (${stats.requestPercentUsed.toFixed(1)}%)`)
    console.log(`Bandwidth: ${stats.dailyMB.toFixed(1)}/${stats.dailyMBLimit.toFixed(0)} MB (${stats.bandwidthPercentUsed.toFixed(1)}%)`)
    console.log(`Date:      ${stats.lastResetDate}`)
    console.log(`Status:    ${stats.canProceed ? '✅ Can proceed' : '🚨 LIMIT EXCEEDED'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }
}

// Export for both ES6 and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UsageTracker
  module.exports.default = UsageTracker
}
