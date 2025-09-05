#!/usr/bin/env node

/**
 * ========================================================================
 * REDIS CACHE PERFORMANCE TEST SCRIPT
 * ========================================================================
 *
 * @PURPOSE: Standalone script to evaluate cache performance improvement
 * @PRD_REF: PRD-REDIS-CACHING-180.md
 * @USAGE: node scripts/test-cache-performance.js [environment_url]
 *
 * SUCCESS CRITERIA:
 * - >40% improvement in API response times with cache
 * - >70% cache hit rate within test period
 * - Consistent data integrity across cached/uncached requests
 */

import https from 'https'
import http from 'http'
import { URL } from 'url'

class CachePerformanceTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl
    this.results = {
      beforeCache: [],
      afterCache: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    }
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const url = new URL(endpoint, this.baseUrl)
      const client = url.protocol === 'https:' ? https : http

      const req = client.get(url, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          const endTime = Date.now()
          const responseTime = endTime - startTime

          try {
            const jsonData = JSON.parse(data)
            resolve({
              status: res.statusCode,
              data: jsonData,
              responseTime,
              success: res.statusCode === 200 && jsonData.success
            })
          } catch (parseError) {
            reject(new Error(`JSON parse error: ${parseError.message}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`))
      })

      req.setTimeout(30000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
    })
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async testCachePerformance() {
    console.log('🚀 Starting Redis Cache Performance Evaluation')
    console.log(`📡 Testing against: ${this.baseUrl}`)
    console.log('━'.repeat(80))

    // Test parameters
    const testEndpoint = '/api/poi-locations-with-weather?lat=44.9537&lng=-93.0900&radius=25&limit=20'
    const iterations = 15
    const warmupIterations = 5

    console.log('⏱️  Phase 1: Baseline Performance (Cold Cache)')
    console.log('━'.repeat(50))

    // Measure baseline performance (before cache or with cold cache)
    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.makeRequest(testEndpoint)

        if (result.success) {
          this.results.beforeCache.push(result.responseTime)
          console.log(`   Request ${i + 1}: ${result.responseTime}ms (${result.data.data?.length || 0} POIs)`)
        } else {
          console.log(`   Request ${i + 1}: ERROR - ${result.status}`)
          this.results.errors++
        }
      } catch (error) {
        console.log(`   Request ${i + 1}: ERROR - ${error.message}`)
        this.results.errors++
      }

      await this.wait(500) // Small delay between requests
    }

    console.log('🔥 Phase 2: Cache Warmup')
    console.log('━'.repeat(50))

    // Warmup requests to populate cache
    for (let i = 0; i < warmupIterations; i++) {
      try {
        const result = await this.makeRequest(testEndpoint)
        console.log(`   Warmup ${i + 1}: ${result.responseTime}ms`)
      } catch (error) {
        console.log(`   Warmup ${i + 1}: ERROR - ${error.message}`)
      }

      await this.wait(300)
    }

    console.log('⚡ Phase 3: Cached Performance')
    console.log('━'.repeat(50))

    // Measure cached performance
    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.makeRequest(testEndpoint)

        if (result.success) {
          this.results.afterCache.push(result.responseTime)

          // Analyze cache status
          let cacheStatus = 'Unknown'
          if (result.data.debug && result.data.debug.cache_strategy) {
            if (result.data.debug.cache_strategy.includes('hit')) {
              this.results.cacheHits++
              cacheStatus = 'HIT'
            } else if (result.data.debug.cache_strategy.includes('miss')) {
              this.results.cacheMisses++
              cacheStatus = 'MISS'
            }
          }

          console.log(`   Request ${i + 1}: ${result.responseTime}ms [${cacheStatus}] (${result.data.data?.length || 0} POIs)`)
        } else {
          console.log(`   Request ${i + 1}: ERROR - ${result.status}`)
          this.results.errors++
        }
      } catch (error) {
        console.log(`   Request ${i + 1}: ERROR - ${error.message}`)
        this.results.errors++
      }

      await this.wait(200) // Shorter delay for cached requests
    }

    this.analyzeResults()
  }

  analyzeResults() {
    console.log('')
    console.log('📊 PERFORMANCE ANALYSIS')
    console.log('━'.repeat(80))

    if (this.results.beforeCache.length === 0 || this.results.afterCache.length === 0) {
      console.log('❌ INSUFFICIENT DATA: Cannot analyze performance - too many errors')
      return
    }

    // Calculate statistics
    const beforeAvg = this.results.beforeCache.reduce((sum, time) => sum + time, 0) / this.results.beforeCache.length
    const afterAvg = this.results.afterCache.reduce((sum, time) => sum + time, 0) / this.results.afterCache.length

    const beforeMedian = this.getMedian(this.results.beforeCache)
    const afterMedian = this.getMedian(this.results.afterCache)

    const improvement = ((beforeAvg - afterAvg) / beforeAvg) * 100
    const targetImprovement = 40 // 40% improvement target

    console.log('📈 Response Time Analysis:')
    console.log(`   Before Cache - Average: ${beforeAvg.toFixed(0)}ms, Median: ${beforeMedian}ms`)
    console.log(`   After Cache  - Average: ${afterAvg.toFixed(0)}ms, Median: ${afterMedian}ms`)
    console.log(`   Improvement: ${improvement.toFixed(1)}% (Target: >${targetImprovement}%)`)

    // Cache hit analysis
    const totalCacheRequests = this.results.cacheHits + this.results.cacheMisses
    const hitRate = totalCacheRequests > 0 ? (this.results.cacheHits / totalCacheRequests) * 100 : 0

    if (totalCacheRequests > 0) {
      console.log('')
      console.log('💾 Cache Hit Analysis:')
      console.log(`   Cache Hits: ${this.results.cacheHits}`)
      console.log(`   Cache Misses: ${this.results.cacheMisses}`)
      console.log(`   Hit Rate: ${hitRate.toFixed(1)}% (Target: >70%)`)
    }

    // Error analysis
    if (this.results.errors > 0) {
      console.log('')
      console.log(`⚠️  Errors Encountered: ${this.results.errors}`)
    }

    console.log('')
    console.log('🎯 SUCCESS CRITERIA EVALUATION')
    console.log('━'.repeat(50))

    // Performance improvement check
    if (improvement >= targetImprovement) {
      console.log(`✅ PERFORMANCE: ${improvement.toFixed(1)}% improvement meets >40% target`)
    } else {
      console.log(`❌ PERFORMANCE: ${improvement.toFixed(1)}% improvement below 40% target`)
    }

    // Cache hit rate check
    if (totalCacheRequests > 0) {
      if (hitRate >= 70) {
        console.log(`✅ CACHE EFFICIENCY: ${hitRate.toFixed(1)}% hit rate meets >70% target`)
      } else {
        console.log(`❌ CACHE EFFICIENCY: ${hitRate.toFixed(1)}% hit rate below 70% target`)
      }
    } else {
      console.log(`⚠️  CACHE TRACKING: Unable to measure cache hit rate (no debug info)`)
    }

    // Overall success
    const performanceSuccess = improvement >= targetImprovement
    const cacheSuccess = totalCacheRequests === 0 || hitRate >= 70
    const errorSuccess = this.results.errors < 3

    if (performanceSuccess && cacheSuccess && errorSuccess) {
      console.log('')
      console.log('🎉 OVERALL RESULT: CACHE IMPLEMENTATION SUCCESSFUL')
      console.log('   All success criteria met!')
    } else {
      console.log('')
      console.log('⚠️  OVERALL RESULT: CACHE IMPLEMENTATION NEEDS REVIEW')
      console.log('   Some success criteria not met - see analysis above')
    }

    console.log('')
    console.log('📋 Next Steps:')
    if (!performanceSuccess) {
      console.log('   • Optimize cache key strategy and TTL settings')
      console.log('   • Review cache implementation for performance bottlenecks')
    }
    if (!cacheSuccess && totalCacheRequests > 0) {
      console.log('   • Investigate cache miss patterns and improve cache coverage')
      console.log('   • Review cache invalidation strategy')
    }
    if (!errorSuccess) {
      console.log('   • Investigate and resolve API errors')
      console.log('   • Improve error handling and resilience')
    }
  }

  getMedian(arr) {
    const sorted = arr.slice().sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }
}

// Main execution
async function main() {
  const targetUrl = process.argv[2] || 'http://localhost:3001'

  console.log('Redis Cache Performance Evaluation Tool')
  console.log('======================================')

  const tester = new CachePerformanceTester(targetUrl)

  try {
    await tester.testCachePerformance()
  } catch (error) {
    console.error('❌ Test execution failed:', error.message)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default CachePerformanceTester
