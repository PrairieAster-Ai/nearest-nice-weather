#!/usr/bin/env node
/**
 * ========================================================================
 * PLAYWRIGHT POI INSPECTION - Edge Case Testing
 * ========================================================================
 * 
 * Comprehensive inspection of POI functionality across environments
 * Tests edge cases, error handling, and user interaction scenarios
 */

import { chromium } from 'playwright'
import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENTS = {
  localhost: 'http://localhost:3002',
  preview: 'https://p.nearestniceweather.com', 
  production: 'https://www.nearestniceweather.com'
}

const API_ENDPOINTS = {
  localhost: 'http://localhost:4000',
  preview: 'https://p.nearestniceweather.com',
  production: 'https://www.nearestniceweather.com'
}

class POIInspector {
  constructor() {
    this.browser = null
    this.context = null
    this.results = {
      environments: {},
      edgeCases: {},
      apiTests: {},
      userScenarios: {}
    }
  }

  async initialize() {
    console.log('🚀 Initializing Playwright POI Inspector')
    this.browser = await chromium.launch({ headless: false, slowMo: 1000 })
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (compatible; POI-Inspector/1.0; +https://nearestniceweather.com)'
    })
    console.log('✅ Browser initialized')
  }

  async testEnvironmentHealth(envName, baseUrl) {
    console.log(`\n🔍 Testing ${envName} environment: ${baseUrl}`)
    const page = await this.context.newPage()
    const envResults = {
      pageLoad: false,
      mapVisible: false,
      poisLoaded: false,
      navigationWorking: false,
      weatherData: false,
      errors: []
    }

    try {
      // Test 1: Page Load
      console.log('  📄 Testing page load...')
      const response = await page.goto(baseUrl, { waitUntil: 'networkidle' })
      envResults.pageLoad = response.status() === 200
      console.log(`  ${envResults.pageLoad ? '✅' : '❌'} Page load: ${response.status()}`)

      // Test 2: Map Visibility
      console.log('  🗺️ Testing map visibility...')
      await page.waitForSelector('#map', { timeout: 10000 })
      const mapVisible = await page.isVisible('#map')
      envResults.mapVisible = mapVisible
      console.log(`  ${mapVisible ? '✅' : '❌'} Map visible: ${mapVisible}`)

      // Test 3: POI Loading
      console.log('  📍 Testing POI loading...')
      await page.waitForTimeout(3000) // Wait for POIs to load
      const poisMarkers = await page.locator('.leaflet-marker-icon').count()
      envResults.poisLoaded = poisMarkers > 0
      console.log(`  ${envResults.poisLoaded ? '✅' : '❌'} POI markers found: ${poisMarkers}`)

      // Test 4: POI Popup Interaction
      if (poisMarkers > 0) {
        console.log('  🔄 Testing POI popup interaction...')
        try {
          await page.locator('.leaflet-marker-icon').first().click()
          await page.waitForSelector('.leaflet-popup', { timeout: 5000 })
          const popupVisible = await page.isVisible('.leaflet-popup')
          console.log(`  ${popupVisible ? '✅' : '❌'} POI popup visible: ${popupVisible}`)
          
          // Check for navigation buttons
          const navButtons = await page.locator('[data-popup-nav="true"] button').count()
          envResults.navigationWorking = navButtons > 0
          console.log(`  ${envResults.navigationWorking ? '✅' : '❌'} Navigation buttons: ${navButtons}`)
        } catch (error) {
          envResults.errors.push(`POI interaction failed: ${error.message}`)
        }
      }

      // Test 5: Console Errors
      const consoleErrors = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      await page.waitForTimeout(2000)
      if (consoleErrors.length > 0) {
        envResults.errors.push(...consoleErrors)
        console.log(`  ⚠️ Console errors found: ${consoleErrors.length}`)
      } else {
        console.log('  ✅ No console errors detected')
      }

    } catch (error) {
      envResults.errors.push(`Environment test failed: ${error.message}`)
      console.log(`  ❌ Environment test failed: ${error.message}`)
    } finally {
      await page.close()
    }

    this.results.environments[envName] = envResults
    return envResults
  }

  async testAPIEndpoints(envName, apiBase) {
    console.log(`\n🔌 Testing API endpoints for ${envName}`)
    const page = await this.context.newPage()
    const apiResults = {
      poiLocations: false,
      poiWithWeather: false,
      health: false,
      feedback: false,
      responseFormat: false,
      expandedFields: false,
      errors: []
    }

    try {
      // Test POI Locations endpoint
      console.log('  📍 Testing /api/poi-locations...')
      const poiResponse = await page.evaluate(async (url) => {
        const response = await fetch(`${url}/api/poi-locations?limit=5`)
        return {
          status: response.status,
          data: await response.json()
        }
      }, apiBase)
      
      apiResults.poiLocations = poiResponse.status === 200
      console.log(`  ${apiResults.poiLocations ? '✅' : '❌'} POI locations API: ${poiResponse.status}`)
      
      // Check for expanded fields
      if (poiResponse.data?.data?.length > 0) {
        const firstPoi = poiResponse.data.data[0]
        const hasExpandedFields = firstPoi.park_level || firstPoi.ownership || firstPoi.amenities
        apiResults.expandedFields = !!hasExpandedFields
        console.log(`  ${apiResults.expandedFields ? '✅' : '❌'} Expanded fields present: ${!!hasExpandedFields}`)
        
        // Log sample POI for inspection
        console.log(`  📋 Sample POI: ${firstPoi.name} (${firstPoi.park_type}) - Source: ${firstPoi.data_source}`)
      }

      // Test POI with Weather endpoint
      console.log('  🌤️ Testing /api/poi-locations-with-weather...')
      const weatherResponse = await page.evaluate(async (url) => {
        const response = await fetch(`${url}/api/poi-locations-with-weather?limit=3`)
        return {
          status: response.status,
          data: await response.json()
        }
      }, apiBase)
      
      apiResults.poiWithWeather = weatherResponse.status === 200
      console.log(`  ${apiResults.poiWithWeather ? '✅' : '❌'} POI with weather API: ${weatherResponse.status}`)
      
      // Check weather data
      if (weatherResponse.data?.data?.length > 0) {
        const firstPoi = weatherResponse.data.data[0]
        const hasWeatherData = firstPoi.temperature && firstPoi.condition
        apiResults.weatherData = !!hasWeatherData
        console.log(`  ${apiResults.weatherData ? '✅' : '❌'} Weather data present: ${!!hasWeatherData}`)
        console.log(`  🌡️ Sample weather: ${firstPoi.temperature}°F, ${firstPoi.condition}`)
      }

      // Test Health endpoint
      if (envName === 'localhost') {
        console.log('  🏥 Testing /api/health...')
        const healthResponse = await page.evaluate(async (url) => {
          const response = await fetch(`${url}/api/health`)
          return {
            status: response.status,
            data: await response.json()
          }
        }, apiBase)
        
        apiResults.health = healthResponse.status === 200
        console.log(`  ${apiResults.health ? '✅' : '❌'} Health API: ${healthResponse.status}`)
      }

    } catch (error) {
      apiResults.errors.push(`API test failed: ${error.message}`)
      console.log(`  ❌ API test error: ${error.message}`)
    } finally {
      await page.close()
    }

    this.results.apiTests[envName] = apiResults
    return apiResults
  }

  async testEdgeCases(envName, baseUrl) {
    console.log(`\n🎯 Testing edge cases for ${envName}`)
    const page = await this.context.newPage()
    const edgeResults = {
      noLocationPermission: false,
      slowNetwork: false,
      multipleClicks: false,
      boundaryCoordinates: false,
      emptyResults: false,
      errors: []
    }

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' })

      // Test 1: Deny location permission
      console.log('  🚫 Testing location permission denial...')
      await page.context().grantPermissions([], { origin: baseUrl })
      await page.waitForTimeout(2000)
      // Check if app still functions without location
      const mapStillVisible = await page.isVisible('#map')
      edgeResults.noLocationPermission = mapStillVisible
      console.log(`  ${edgeResults.noLocationPermission ? '✅' : '❌'} App works without location: ${mapStillVisible}`)

      // Test 2: Rapid multiple clicks
      console.log('  ⚡ Testing rapid multiple clicks...')
      const markers = await page.locator('.leaflet-marker-icon')
      const markerCount = await markers.count()
      if (markerCount > 0) {
        // Click first marker multiple times rapidly
        for (let i = 0; i < 5; i++) {
          await markers.first().click()
          await page.waitForTimeout(100)
        }
        // Check if popup is still functional
        const popupVisible = await page.isVisible('.leaflet-popup')
        edgeResults.multipleClicks = popupVisible
        console.log(`  ${edgeResults.multipleClicks ? '✅' : '❌'} Handles rapid clicks: ${popupVisible}`)
      }

      // Test 3: Boundary coordinates (edge of Minnesota)
      console.log('  🗺️ Testing boundary coordinates...')
      const boundaryTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/poi-locations?lat=49.4&lng=-89.5&limit=5')
          return response.status === 200
        } catch (error) {
          return false
        }
      })
      edgeResults.boundaryCoordinates = boundaryTest
      console.log(`  ${edgeResults.boundaryCoordinates ? '✅' : '❌'} Boundary coordinates work: ${boundaryTest}`)

      // Test 4: Invalid coordinates
      console.log('  ❌ Testing invalid coordinates...')
      const invalidTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/poi-locations?lat=999&lng=-999&limit=5')
          const data = await response.json()
          return response.status === 200 && data.success
        } catch (error) {
          return false
        }
      })
      console.log(`  ${invalidTest ? '✅' : '❌'} Handles invalid coordinates: ${invalidTest}`)

    } catch (error) {
      edgeResults.errors.push(`Edge case test failed: ${error.message}`)
      console.log(`  ❌ Edge case error: ${error.message}`)
    } finally {
      await page.close()
    }

    this.results.edgeCases[envName] = edgeResults
    return edgeResults
  }

  async testUserScenarios(envName, baseUrl) {
    console.log(`\n👤 Testing user scenarios for ${envName}`)
    const page = await this.context.newPage()
    const userResults = {
      findNearbyParks: false,
      navigateBetweenPois: false,
      expandSearch: false,
      viewWeatherInfo: false,
      errors: []
    }

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000)

      // Scenario 1: Find nearby parks
      console.log('  🔍 Scenario: Find nearby parks...')
      const markers = await page.locator('.leaflet-marker-icon')
      const markerCount = await markers.count()
      userResults.findNearbyParks = markerCount > 0
      console.log(`  ${userResults.findNearbyParks ? '✅' : '❌'} Parks visible on map: ${markerCount}`)

      if (markerCount > 0) {
        // Scenario 2: Navigate between POIs
        console.log('  🔄 Scenario: Navigate between POIs...')
        await markers.first().click()
        await page.waitForSelector('.leaflet-popup', { timeout: 5000 })
        
        const navButtons = await page.locator('[data-popup-nav="true"] button')
        const navCount = await navButtons.count()
        if (navCount > 0) {
          try {
            await navButtons.last().click() // Click "Farther" button
            await page.waitForTimeout(1000)
            userResults.navigateBetweenPois = true
            console.log('  ✅ Navigation between POIs works')
          } catch (error) {
            console.log(`  ❌ Navigation failed: ${error.message}`)
          }
        }

        // Scenario 3: View detailed POI information
        console.log('  📋 Scenario: View POI details...')
        const popupContent = await page.locator('.leaflet-popup-content').textContent()
        const hasDetails = popupContent && popupContent.length > 50
        userResults.viewWeatherInfo = hasDetails
        console.log(`  ${userResults.viewWeatherInfo ? '✅' : '❌'} POI details visible: ${hasDetails}`)
      }

    } catch (error) {
      userResults.errors.push(`User scenario failed: ${error.message}`)
      console.log(`  ❌ User scenario error: ${error.message}`)
    } finally {
      await page.close()
    }

    this.results.userScenarios[envName] = userResults
    return userResults
  }

  async generateReport() {
    console.log('\n📊 GENERATING COMPREHENSIVE POI INSPECTION REPORT')
    console.log('=' .repeat(80))
    
    // Environment Health Summary
    console.log('\n🌍 ENVIRONMENT HEALTH')
    console.log('-' .repeat(50))
    for (const [env, results] of Object.entries(this.results.environments)) {
      const score = Object.values(results).filter(v => v === true).length
      const total = Object.keys(results).length - 1 // Subtract errors array
      console.log(`${env}: ${score}/${total} checks passed`)
      
      if (results.errors.length > 0) {
        console.log(`  ⚠️ Errors: ${results.errors.length}`)
        results.errors.slice(0, 3).forEach(err => console.log(`    - ${err}`))
      }
    }

    // API Health Summary  
    console.log('\n🔌 API ENDPOINTS')
    console.log('-' .repeat(50))
    for (const [env, results] of Object.entries(this.results.apiTests)) {
      const score = Object.values(results).filter(v => v === true).length
      const total = Object.keys(results).length - 1 // Subtract errors array
      console.log(`${env}: ${score}/${total} endpoints working`)
      
      if (!results.expandedFields) {
        console.log(`  ⚠️ Using fallback POI table (missing expanded fields)`)
      }
    }

    // Edge Cases Summary
    console.log('\n🎯 EDGE CASES')
    console.log('-' .repeat(50))
    for (const [env, results] of Object.entries(this.results.edgeCases)) {
      const score = Object.values(results).filter(v => v === true).length
      const total = Object.keys(results).length - 1 // Subtract errors array
      console.log(`${env}: ${score}/${total} edge cases handled`)
    }

    // User Scenarios Summary
    console.log('\n👤 USER SCENARIOS')
    console.log('-' .repeat(50))
    for (const [env, results] of Object.entries(this.results.userScenarios)) {
      const score = Object.values(results).filter(v => v === true).length
      const total = Object.keys(results).length - 1 // Subtract errors array
      console.log(`${env}: ${score}/${total} scenarios working`)
    }

    // Overall Assessment
    console.log('\n🏆 OVERALL ASSESSMENT')
    console.log('-' .repeat(50))
    
    let totalScore = 0
    let totalPossible = 0
    
    for (const category of Object.values(this.results)) {
      for (const envResults of Object.values(category)) {
        if (typeof envResults === 'object' && envResults.errors) {
          const score = Object.values(envResults).filter(v => v === true).length
          const total = Object.keys(envResults).length - 1
          totalScore += score
          totalPossible += total
        }
      }
    }
    
    const overallScore = Math.round((totalScore / totalPossible) * 100)
    console.log(`Overall Health Score: ${overallScore}%`)
    
    if (overallScore >= 90) {
      console.log('🎉 EXCELLENT: POI system is working well across all environments')
    } else if (overallScore >= 75) {
      console.log('✅ GOOD: POI system is mostly functional with minor issues')
    } else if (overallScore >= 60) {
      console.log('⚠️ FAIR: POI system has some significant issues that need attention')
    } else {
      console.log('❌ POOR: POI system has major issues requiring immediate fixes')
    }

    return {
      overallScore,
      totalTests: totalPossible,
      passedTests: totalScore,
      results: this.results
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      console.log('🧹 Browser cleanup completed')
    }
  }
}

// Main execution
async function main() {
  const inspector = new POIInspector()
  
  try {
    await inspector.initialize()
    
    // Test all environments
    for (const [envName, baseUrl] of Object.entries(ENVIRONMENTS)) {
      if (envName === 'localhost') {
        // For localhost, check if server is running
        try {
          const response = await fetch('http://localhost:4000/api/health')
          if (!response.ok) {
            console.log(`⚠️ Localhost server not running, skipping ${envName}`)
            continue
          }
        } catch (error) {
          console.log(`⚠️ Localhost server not accessible, skipping ${envName}`)
          continue
        }
      }
      
      console.log(`\n🔍 INSPECTING ${envName.toUpperCase()} ENVIRONMENT`)
      console.log('=' .repeat(60))
      
      await inspector.testEnvironmentHealth(envName, baseUrl)
      await inspector.testAPIEndpoints(envName, API_ENDPOINTS[envName])
      await inspector.testEdgeCases(envName, baseUrl)
      await inspector.testUserScenarios(envName, baseUrl)
    }
    
    // Generate comprehensive report
    const report = await inspector.generateReport()
    
    console.log('\n📋 RECOMMENDATIONS')
    console.log('-' .repeat(50))
    
    if (report.results.apiTests.preview?.expandedFields === false) {
      console.log('1. Redeploy preview environment to pick up expanded POI table support')
    }
    if (report.results.apiTests.production?.expandedFields === false) {
      console.log('2. Deploy to production environment with expanded POI table support')  
    }
    if (report.overallScore < 90) {
      console.log('3. Address identified issues to improve system reliability')
    }
    
    console.log('\n✅ POI Inspection Complete!')
    
  } catch (error) {
    console.error('❌ Inspection failed:', error)
    process.exit(1)
  } finally {
    await inspector.cleanup()
  }
}

// Execute main function
main()