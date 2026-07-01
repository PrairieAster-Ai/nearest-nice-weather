#!/usr/bin/env node

/**
 * ========================================================================
 * STANDALONE PREVIEW DEBUGGING SCRIPT
 * ========================================================================
 *
 * @PURPOSE: Debug preview environment map markers without test framework
 * @USAGE: node debug-preview-standalone.js
 *
 * This script uses Playwright programmatically to investigate why
 * 0 map markers are visible on the preview environment.
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const PREVIEW_URL = 'https://p.nearestniceweather.com'

async function debugPreviewEnvironment() {
  console.log('🚀 Starting Preview Environment Debug Session')
  console.log(`🌐 Target URL: ${PREVIEW_URL}`)

  const browser = await chromium.launch({
    headless: false, // Show browser for visual debugging
    devtools: true   // Open dev tools
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })

  const page = await context.newPage()

  // Track all console messages
  const consoleMessages = []
  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()
    consoleMessages.push({ type, text })
    console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`)
  })

  // Track all network requests
  const apiRequests = []
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiRequests.push({
        method: request.method(),
        url: request.url()
      })
      console.log(`📡 [REQUEST] ${request.method()} ${request.url()}`)
    }
  })

  // Track all network responses
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📨 [RESPONSE] ${response.status()} ${response.url()}`)
    }
  })

  // Track JavaScript errors
  const jsErrors = []
  page.on('pageerror', error => {
    jsErrors.push(error.message)
    console.log(`🚨 [JS ERROR] ${error.message}`)
  })

  try {
    console.log('\\n🔍 Step 1: Navigating to preview environment...')
    await page.goto(PREVIEW_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    console.log('✅ Page loaded successfully')

    // Wait for initial load
    await page.waitForTimeout(3000)

    console.log('\\n📄 Step 2: Checking page metadata...')
    const title = await page.title()
    console.log(`Page Title: ${title}`)

    const url = page.url()
    console.log(`Current URL: ${url}`)

    console.log('\\n🗺️  Step 3: Checking map container...')

    // Look for various map container selectors
    const mapSelectors = [
      '#map-container',
      '.map-container',
      '[data-testid="map-container"]',
      '.leaflet-container',
      '.mapbox-container',
      '#mapElement',
      '.map-component'
    ]

    let mapFound = false
    for (const selector of mapSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        console.log(`✅ Map container found: ${selector} (${count} elements)`)
        mapFound = true

        // Check if visible
        const isVisible = await page.locator(selector).first().isVisible()
        console.log(`   Visibility: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`)

        if (isVisible) {
          const boundingBox = await page.locator(selector).first().boundingBox()
          console.log(`   Dimensions: ${boundingBox?.width}x${boundingBox?.height}`)
        }
        break
      }
    }

    if (!mapFound) {
      console.log('❌ No map container found with common selectors')
    }

    console.log('\\n📍 Step 4: Checking for map markers...')

    // Look for various marker selectors
    const markerSelectors = [
      '.leaflet-marker-icon',
      '.mapbox-marker',
      '[data-testid="poi-marker"]',
      '.poi-marker',
      '.map-marker',
      '.marker',
      'img[src*="marker"]',
      'svg[class*="marker"]'
    ]

    let totalMarkers = 0
    for (const selector of markerSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        console.log(`📍 Found ${count} markers: ${selector}`)
        totalMarkers += count
      }
    }

    console.log(`📊 Total markers found: ${totalMarkers}`)

    console.log('\\n🎛️  Step 5: Checking filter controls...')

    // Look for filter controls
    const filterSelectors = [
      'select',
      'input[type="radio"]',
      'input[type="checkbox"]',
      'button[role="option"]',
      '.filter-button',
      '.weather-filter'
    ]

    let totalFilters = 0
    for (const selector of filterSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        console.log(`🎛️  Found ${count} filter controls: ${selector}`)
        totalFilters += count
      }
    }

    console.log(`🎛️  Total filter controls: ${totalFilters}`)

    console.log('\\n🧪 Step 6: Testing API endpoints directly...')

    const endpoints = [
      '/api/health',
      '/api/poi-locations-with-weather?limit=5',
      '/api/poi-locations-with-weather?limit=5',
      '/api/poi-locations?limit=5'
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`\\n🔍 Testing: ${endpoint}`)
        const response = await page.request.get(`${PREVIEW_URL}${endpoint}`)
        const status = response.status()

        console.log(`   Status: ${status}`)

        if (status === 200) {
          const responseText = await response.text()
          try {
            const data = JSON.parse(responseText)
            console.log(`   Success: ${data.success || 'undefined'}`)
            if (data.data && Array.isArray(data.data)) {
              console.log(`   Data count: ${data.data.length}`)
              if (data.data.length > 0) {
                console.log(`   First item: ${JSON.stringify(data.data[0], null, 2).substring(0, 200)}...`)
              }
            }
            if (data.debug) {
              console.log(`   Debug info: ${JSON.stringify(data.debug, null, 2)}`)
            }
          } catch (e) {
            console.log(`   Response (text): ${responseText.substring(0, 200)}...`)
          }
        } else {
          const errorText = await response.text()
          console.log(`   Error: ${errorText.substring(0, 100)}...`)
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`)
      }
    }

    console.log('\\n📸 Step 7: Taking screenshot...')
    await page.screenshot({
      path: 'documentation/Branding/preview-debug-full.png',
      fullPage: true
    })
    console.log('✅ Screenshot saved: documentation/Branding/preview-debug-full.png')

    console.log('\\n📋 Step 8: Summary Report...')
    console.log('=====================================')
    console.log(`API Requests Made: ${apiRequests.length}`)
    console.log(`Map Markers Found: ${totalMarkers}`)
    console.log(`Filter Controls: ${totalFilters}`)
    console.log(`Console Messages: ${consoleMessages.length}`)
    console.log(`JavaScript Errors: ${jsErrors.length}`)

    if (apiRequests.length > 0) {
      console.log('\\n📡 API Requests:')
      apiRequests.forEach(req => {
        console.log(`   ${req.method} ${req.url}`)
      })
    }

    if (jsErrors.length > 0) {
      console.log('\\n🚨 JavaScript Errors:')
      jsErrors.forEach(error => {
        console.log(`   ${error}`)
      })
    }

    if (consoleMessages.length > 0) {
      console.log('\\n💬 Console Messages (last 10):')
      consoleMessages.slice(-10).forEach(msg => {
        console.log(`   [${msg.type}] ${msg.text}`)
      })
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: PREVIEW_URL,
      summary: {
        apiRequestsCount: apiRequests.length,
        mapMarkersFound: totalMarkers,
        filterControlsFound: totalFilters,
        consoleMessagesCount: consoleMessages.length,
        jsErrorsCount: jsErrors.length
      },
      apiRequests,
      jsErrors,
      consoleMessages: consoleMessages.slice(-20), // Keep last 20
      recommendations: []
    }

    // Add recommendations based on findings
    if (totalMarkers === 0) {
      report.recommendations.push('No map markers found - check POI data loading and map rendering')
    }

    if (apiRequests.length === 0) {
      report.recommendations.push('No API requests detected - check if frontend is making API calls')
    }

    if (jsErrors.length > 0) {
      report.recommendations.push('JavaScript errors detected - fix these first as they may block map functionality')
    }

    // Save report
    fs.writeFileSync('preview-debug-report.json', JSON.stringify(report, null, 2))
    console.log('\\n💾 Detailed report saved: preview-debug-report.json')

    console.log('\\n🎯 Key Findings:')
    if (totalMarkers === 0) {
      console.log('❌ ISSUE: No map markers visible')
    } else {
      console.log(`✅ Map markers found: ${totalMarkers}`)
    }

    // Keep browser open for 30 seconds for manual inspection
    console.log('\\n👀 Browser will stay open for 30 seconds for manual inspection...')
    await page.waitForTimeout(30000)

  } catch (error) {
    console.error(`❌ Debug session failed: ${error.message}`)
    console.error(error.stack)
  } finally {
    await browser.close()
    console.log('\\n🏁 Debug session completed')
  }
}

// Run the debug session
debugPreviewEnvironment().catch(console.error)
