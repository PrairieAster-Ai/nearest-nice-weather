import { test, expect } from '@playwright/test'

test.describe('Preview Frontend Map Debugging', () => {
  test('Debug map markers visibility on preview environment', async ({ page }) => {
    const previewUrl = 'https://p.nearestniceweather.com'
    
    console.log('🔍 Navigating to preview environment...')
    await page.goto(previewUrl, { waitUntil: 'networkidle' })
    
    // Wait for page to load
    await page.waitForTimeout(3000)
    
    // Check page title
    const title = await page.title()
    console.log(`📄 Page title: ${title}`)
    
    // Check if map container exists
    const mapContainer = page.locator('#map-container, .map-container, [data-testid="map-container"]')
    const mapExists = await mapContainer.count()
    console.log(`🗺️  Map container found: ${mapExists > 0 ? 'YES' : 'NO'}`)
    
    if (mapExists > 0) {
      const mapElement = mapContainer.first()
      const isVisible = await mapElement.isVisible()
      console.log(`👁️  Map container visible: ${isVisible}`)
      
      if (isVisible) {
        const boundingBox = await mapElement.boundingBox()
        console.log(`📐 Map dimensions: ${boundingBox?.width}x${boundingBox?.height}`)
      }
    }
    
    // Check for API calls in network tab
    console.log('🌐 Monitoring network requests...')
    const apiRequests = []
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
        })
        console.log(`📡 API Request: ${request.method()} ${request.url()}`)
      }
    })
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📨 API Response: ${response.status()} ${response.url()}`)
      }
    })
    
    // Reload page to capture API calls
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(5000)
    
    // Check for POI markers specifically
    const markerSelectors = [
      '.leaflet-marker-icon',
      '.mapbox-marker',
      '[data-testid="poi-marker"]',
      '.poi-marker',
      '.map-marker'
    ]
    
    let totalMarkers = 0
    for (const selector of markerSelectors) {
      const markers = await page.locator(selector).count()
      if (markers > 0) {
        console.log(`🎯 Found ${markers} markers with selector: ${selector}`)
        totalMarkers += markers
      }
    }
    
    console.log(`📍 Total map markers found: ${totalMarkers}`)
    
    // Check console errors
    const consoleMessages = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
        console.log(`❌ Console Error: ${msg.text()}`)
      }
    })
    
    // Check for JavaScript errors
    const jsErrors = []
    page.on('pageerror', error => {
      jsErrors.push(error.message)
      console.log(`🚨 JavaScript Error: ${error.message}`)
    })
    
    // Take screenshot for visual inspection
    await page.screenshot({ 
      path: 'documentation/Branding/preview-map-debug.png',
      fullPage: true 
    })
    console.log('📸 Screenshot saved: documentation/Branding/preview-map-debug.png')
    
    // Try to interact with filter controls
    const filterControls = page.locator('select, input[type="radio"], input[type="checkbox"]').filter({ hasText: /temperature|weather|precipitation/i })
    const filterCount = await filterControls.count()
    console.log(`🎛️  Filter controls found: ${filterCount}`)
    
    if (filterCount > 0) {
      console.log('🎛️  Testing filter interactions...')
      // Try changing a filter to trigger API calls
      const firstFilter = filterControls.first()
      const isVisible = await firstFilter.isVisible()
      if (isVisible) {
        await firstFilter.click()
        await page.waitForTimeout(2000)
      }
    }
    
    // Check if there are any loading indicators
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      '.map-loading'
    ]
    
    for (const selector of loadingSelectors) {
      const loading = await page.locator(selector).count()
      if (loading > 0) {
        console.log(`⏳ Loading indicator found: ${selector}`)
      }
    }
    
    // Final API request summary
    console.log(`\n📊 SUMMARY:`)
    console.log(`API Requests Made: ${apiRequests.length}`)
    console.log(`Map Markers Visible: ${totalMarkers}`)
    console.log(`Console Errors: ${consoleMessages.length}`)
    console.log(`JavaScript Errors: ${jsErrors.length}`)
    
    // Test specific API endpoints directly
    console.log('\n🧪 Testing API endpoints directly...')
    
    const endpoints = [
      '/api/health',
      '/api/poi-locations-with-weather?limit=5',
      '/api/weather-locations?limit=5'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(`${previewUrl}${endpoint}`)
        const status = response.status()
        const responseText = await response.text()
        
        console.log(`🔍 ${endpoint}: ${status}`)
        
        if (status === 200) {
          try {
            const data = JSON.parse(responseText)
            if (data.data && Array.isArray(data.data)) {
              console.log(`   📊 Data count: ${data.data.length}`)
            }
            if (data.success !== undefined) {
              console.log(`   ✅ Success: ${data.success}`)
            }
          } catch (e) {
            console.log(`   📄 Response length: ${responseText.length} chars`)
          }
        } else {
          console.log(`   ❌ Error response: ${responseText.substring(0, 100)}...`)
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Request failed - ${error.message}`)
      }
    }
    
    // Assertions for test validation
    expect(totalMarkers >= 0).toBeTruthy() // Allow 0 markers for debugging
    expect(title).toContain('Nearest Nice Weather')
  })
})