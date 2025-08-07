#!/usr/bin/env node
/**
 * ========================================================================
 * POI DATA CONSISTENCY VALIDATION
 * ========================================================================
 * 
 * Validates that POI data is consistent across all environments
 * and tests API functionality
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENTS = {
  development: process.env.DATABASE_URL,
  preview: process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL,
  production: process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL
}

const API_ENDPOINTS = {
  localhost: 'http://localhost:4000',
  preview: 'https://p.nearestniceweather.com',
  production: 'https://www.nearestniceweather.com'
}

async function validateDatabaseConsistency() {
  console.log('📊 VALIDATING DATABASE CONSISTENCY')
  console.log('=' .repeat(60))
  
  const results = {}
  
  for (const [env, dbUrl] of Object.entries(ENVIRONMENTS)) {
    try {
      const sql = neon(dbUrl)
      
      // Check expanded table exists
      const expandedExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'poi_locations_expanded'
        );
      `
      
      // Count comprehensive import POIs
      const comprehensiveCount = await sql`
        SELECT COUNT(*) as count 
        FROM poi_locations_expanded 
        WHERE data_source = 'comprehensive_import'
      `
      
      // Sample POI data
      const sampleData = await sql`
        SELECT name, park_type, park_level, ownership, data_source, place_rank
        FROM poi_locations_expanded 
        WHERE data_source = 'comprehensive_import'
        ORDER BY place_rank ASC, name ASC 
        LIMIT 5
      `
      
      // Total POI count
      const totalCount = await sql`SELECT COUNT(*) as count FROM poi_locations_expanded`
      
      results[env] = {
        expandedTableExists: expandedExists[0].exists,
        comprehensivePOIs: parseInt(comprehensiveCount[0].count),
        totalPOIs: parseInt(totalCount[0].count),
        sampleData: sampleData
      }
      
      console.log(`\n🗄️ ${env.toUpperCase()}:`)
      console.log(`  Expanded table exists: ${expandedExists[0].exists}`)
      console.log(`  Comprehensive POIs: ${comprehensiveCount[0].count}`)
      console.log(`  Total POIs: ${totalCount[0].count}`)
      console.log(`  Sample POIs:`)
      sampleData.slice(0, 3).forEach(poi => {
        console.log(`    - ${poi.name} (${poi.park_level}) - Rank: ${poi.place_rank}`)
      })
      
    } catch (error) {
      console.log(`❌ ${env}: Database error - ${error.message}`)
      results[env] = { error: error.message }
    }
  }
  
  return results
}

async function validateAPIConsistency() {
  console.log('\n🔌 VALIDATING API CONSISTENCY')
  console.log('=' .repeat(60))
  
  const results = {}
  
  for (const [env, apiBase] of Object.entries(API_ENDPOINTS)) {
    try {
      console.log(`\n📡 Testing ${env}...`)
      
      // Test POI locations endpoint
      const poiResponse = await fetch(`${apiBase}/api/poi-locations?limit=5`)
      const poiData = await poiResponse.json()
      
      // Test weather endpoint  
      const weatherResponse = await fetch(`${apiBase}/api/poi-locations-with-weather?limit=3`)
      const weatherData = await weatherResponse.json()
      
      results[env] = {
        poiEndpoint: {
          status: poiResponse.status,
          success: poiData.success,
          count: poiData.count,
          hasExpandedFields: poiData.data?.[0]?.park_level || poiData.data?.[0]?.ownership,
          samplePOI: poiData.data?.[0]?.name,
          dataSource: poiData.data?.[0]?.data_source
        },
        weatherEndpoint: {
          status: weatherResponse.status,
          success: weatherData.success,
          count: weatherData.count,
          hasWeatherData: weatherData.data?.[0]?.temperature && weatherData.data?.[0]?.condition,
          sampleWeather: `${weatherData.data?.[0]?.temperature}°F, ${weatherData.data?.[0]?.condition}`
        }
      }
      
      console.log(`  POI API: ${poiResponse.status} - ${poiData.count} POIs`)
      console.log(`  Expanded fields: ${results[env].poiEndpoint.hasExpandedFields ? 'Yes' : 'No'}`)
      console.log(`  Sample: ${poiData.data?.[0]?.name} (${poiData.data?.[0]?.data_source})`)
      console.log(`  Weather API: ${weatherResponse.status} - ${weatherData.count} POIs with weather`)
      console.log(`  Weather sample: ${results[env].weatherEndpoint.sampleWeather}`)
      
    } catch (error) {
      console.log(`❌ ${env}: API error - ${error.message}`)
      results[env] = { error: error.message }
    }
  }
  
  return results
}

async function testEdgeCases() {
  console.log('\n🎯 TESTING API EDGE CASES')
  console.log('=' .repeat(60))
  
  const testCases = [
    {
      name: "Large limit parameter",
      url: `${API_ENDPOINTS.localhost}/api/poi-locations?limit=1000`,
      expectedBehavior: "Should cap at reasonable limit"
    },
    {
      name: "Invalid coordinates", 
      url: `${API_ENDPOINTS.localhost}/api/poi-locations?lat=999&lng=-999&limit=5`,
      expectedBehavior: "Should return results without proximity"
    },
    {
      name: "Boundary coordinates",
      url: `${API_ENDPOINTS.localhost}/api/poi-locations?lat=49.4&lng=-89.5&limit=5`, 
      expectedBehavior: "Should return Minnesota POIs"
    },
    {
      name: "Empty/zero limit",
      url: `${API_ENDPOINTS.localhost}/api/poi-locations?limit=0`,
      expectedBehavior: "Should return default amount"
    }
  ]
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 ${testCase.name}:`)
      const response = await fetch(testCase.url)
      const data = await response.json()
      
      console.log(`  Status: ${response.status}`)
      console.log(`  Success: ${data.success}`)
      console.log(`  Count: ${data.count}`)
      console.log(`  Expected: ${testCase.expectedBehavior}`)
      
      if (data.data?.length > 0) {
        console.log(`  First result: ${data.data[0].name}`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  }
}

async function generateConsistencyReport(dbResults, apiResults) {
  console.log('\n📋 CONSISTENCY REPORT')
  console.log('=' .repeat(60))
  
  // Database consistency
  let dbIssues = []
  const targetPOIs = 27 // Our comprehensive import count
  
  for (const [env, result] of Object.entries(dbResults)) {
    if (result.error) {
      dbIssues.push(`${env}: Database connection failed`)
    } else if (!result.expandedTableExists) {
      dbIssues.push(`${env}: Missing expanded POI table`)
    } else if (result.comprehensivePOIs !== targetPOIs) {
      dbIssues.push(`${env}: Expected ${targetPOIs} comprehensive POIs, found ${result.comprehensivePOIs}`)
    }
  }
  
  // API consistency
  let apiIssues = []
  
  for (const [env, result] of Object.entries(apiResults)) {
    if (result.error) {
      apiIssues.push(`${env}: API connection failed`)
    } else {
      if (!result.poiEndpoint.success) {
        apiIssues.push(`${env}: POI endpoint not successful`)
      }
      if (!result.weatherEndpoint.success) {
        apiIssues.push(`${env}: Weather endpoint not successful`) 
      }
      if (!result.poiEndpoint.hasExpandedFields) {
        apiIssues.push(`${env}: Using fallback POI table (missing expanded fields)`)
      }
      if (!result.weatherEndpoint.hasWeatherData) {
        apiIssues.push(`${env}: Missing weather data`)
      }
    }
  }
  
  // Summary
  console.log('📊 DATABASE CONSISTENCY:')
  if (dbIssues.length === 0) {
    console.log('✅ All databases are consistent')
  } else {
    console.log(`❌ Found ${dbIssues.length} database issues:`)
    dbIssues.forEach(issue => console.log(`  - ${issue}`))
  }
  
  console.log('\n📊 API CONSISTENCY:')
  if (apiIssues.length === 0) {
    console.log('✅ All APIs are consistent')
  } else {
    console.log(`❌ Found ${apiIssues.length} API issues:`)
    apiIssues.forEach(issue => console.log(`  - ${issue}`))
  }
  
  const totalIssues = dbIssues.length + apiIssues.length
  console.log(`\n🏆 OVERALL HEALTH: ${totalIssues === 0 ? '✅ EXCELLENT' : `⚠️ ${totalIssues} ISSUES FOUND`}`)
  
  if (totalIssues > 0) {
    console.log('\n📋 RECOMMENDED ACTIONS:')
    if (apiIssues.some(issue => issue.includes('fallback POI table'))) {
      console.log('1. Redeploy preview/production to pick up expanded table support')
    }
    if (dbIssues.some(issue => issue.includes('comprehensive POIs'))) {
      console.log('2. Re-run comprehensive POI import for affected environments')
    }
  }
  
  return {
    databaseIssues: dbIssues.length,
    apiIssues: apiIssues.length,
    totalIssues: totalIssues
  }
}

async function main() {
  console.log('🔍 POI DATA CONSISTENCY VALIDATION')
  console.log('=' .repeat(80))
  
  try {
    const dbResults = await validateDatabaseConsistency()
    const apiResults = await validateAPIConsistency()
    await testEdgeCases()
    
    const report = await generateConsistencyReport(dbResults, apiResults)
    
    console.log('\n✅ Validation Complete!')
    process.exit(report.totalIssues === 0 ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  }
}

main()