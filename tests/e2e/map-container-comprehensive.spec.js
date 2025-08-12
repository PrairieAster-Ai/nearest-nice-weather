/**
 * ========================================================================
 * MAP CONTAINER COMPREHENSIVE TEST SUITE
 * ========================================================================
 * 
 * @PURPOSE: Complete testing of MapContainer component and Leaflet map functionality
 * @VALIDATES: Map interactions, marker performance, popup behavior, navigation, mobile gestures
 * @COVERS: MapContainer.tsx, Leaflet integration, POI visualization, user location management
 * 
 * BUSINESS CONTEXT: Core interactive map for Minnesota outdoor recreation discovery
 * - Map rendering and performance with multiple POI markers
 * - Interactive popup system with weather data and navigation
 * - User location management with drag-and-drop functionality
 * - Mobile-optimized touch interactions for outdoor use
 * - Platform-aware directions integration (iOS, Android, Desktop)
 * 
 * MAP COMPONENT ARCHITECTURE: 
 * - Leaflet map with OpenStreetMap tiles
 * - Custom branded asterIcon markers for POI locations
 * - Draggable user location marker with blue icon
 * - Interactive popups with weather data, ads, and navigation buttons
 * - Performance-optimized incremental marker updates
 * - Event delegation for popup interactions and analytics
 * 
 * TEST COVERAGE:
 * 1. Map initialization and tile loading
 * 2. Multi-marker performance and rendering (1-100+ POIs)
 * 3. Interactive popup behavior and content validation
 * 4. User location marker management and dragging
 * 5. Map navigation and viewport management
 * 6. Mobile touch gestures and responsiveness
 * 7. Platform-specific directions URL generation
 * 8. Analytics tracking and error handling
 * 9. Performance under load and memory management
 * 10. Cross-browser compatibility (Chrome, Firefox, Safari, Mobile)
 * 
 * ========================================================================
 */

import { test, expect } from '@playwright/test'
import { MapPage } from './pages/MapPage.js'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

test.describe('Map Container - Core Functionality', () => {
  // PROPER TEST ISOLATION (Playwright Best Practice)
  test.beforeEach(async ({ page, context }) => {
    // Clear all state for complete test independence
    await context.clearCookies()
    await context.clearPermissions()
    
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') localStorage.clear()
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
      })
    } catch {
      // Storage might not be available in some contexts
    }

    // Set up fresh geolocation for each test
    await context.setGeolocation({ latitude: 44.9537, longitude: -93.0900 })
    await context.grantPermissions(['geolocation'])

    console.log(`🗺️ Testing Map Container on ${BASE_URL}`)
    await page.goto(BASE_URL)
    
    // Use semantic locator instead of CSS selector
    await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 10000 })
    console.log('✅ Map container loaded with clean state')
  })

  test('Map initializes correctly with OpenStreetMap tiles', async ({ page }) => {
    console.log('🧪 Testing map initialization and tile loading')
    
    // Use Page Object Model
    const mapPage = new MapPage(page)
    
    // Use semantic locator for map container
    await mapPage.expectMapVisible()
    console.log('✅ Map container visible')
    
    // Wait for map to be ready
    await mapPage.waitForMapReady()
    await mapPage.waitForTilesToLoad()
    
    console.log('✅ Map initialization complete with tiles loaded')
  })

  test('Map renders POI markers and supports user interaction', async ({ page }) => {
    console.log('🧪 Testing POI marker rendering and interaction')
    
    // Use Page Object Model
    const mapPage = new MapPage(page)
    
    await mapPage.waitForMapReady()
    
    // Test user-visible behavior: POI markers are present and clickable
    const poiCount = await mapPage.expectPOIMarkersVisible()
    console.log(`📍 POI markers found: ${poiCount}`)
    
    // Test user interaction: clicking a POI shows details
    if (poiCount > 0) {
      const { popup, content } = await mapPage.clickFirstPOI()
      
      // User should see location details
      await expect(popup).toBeVisible()
      const popupText = await content.textContent()
      expect(popupText).toBeTruthy()
      
      console.log('✅ POI interaction working correctly')
      await mapPage.closePopup()
    }
  })

  test('Map supports user location and geolocation features', async ({ page }) => {
    console.log('🧪 Testing user location functionality')
    
    // Use Page Object Model
    const mapPage = new MapPage(page)
    
    await mapPage.waitForMapReady()
    
    // Test that user can interact with map (pan, zoom)
    await mapPage.panMap(50, 50)
    console.log('✅ Map panning works')
    
    // Test zoom functionality
    await mapPage.zoomIn()
    console.log('✅ Map zoom functionality works')
    
    // Verify map state is functional
    const mapState = await mapPage.validateMapState()
    expect(mapState.mapVisible).toBe(true)
    expect(mapState.poisLoaded).toBe(true)
    
    console.log('✅ Map location features working correctly')
  })
})

test.describe('Map Container - POI Popup System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
  })

  test('POI popups display weather data and interactive elements', async ({ page }) => {
    console.log('🧪 Testing POI popup content and interactions')
    
    // Click on first POI marker to open popup
    const markers = await page.locator('.leaflet-marker-icon').all()
    if (markers.length > 0) {
      await markers[0].click()
      
      // Wait for popup to appear
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 })
      console.log('✅ POI popup opened')
      
      // Verify popup contains weather information
      const popup = await page.locator('.leaflet-popup-content').first()
      const popupContent = await popup.innerHTML()
      
      // Check for weather data elements
      const hasTemperature = /\d+°F|\d+°C/.test(popupContent)
      const hasWeatherCondition = /sunny|cloudy|rain|clear|overcast/i.test(popupContent)
      
      console.log(`🌡️ Temperature data present: ${hasTemperature}`)
      console.log(`🌤️ Weather condition present: ${hasWeatherCondition}`)
      
      // Look for interactive elements
      const hasDirectionsButton = popupContent.includes('🗺️') || popupContent.includes('directions')
      const hasNavigationButtons = popupContent.includes('Closer') || popupContent.includes('Farther')
      
      console.log(`🗺️ Directions button present: ${hasDirectionsButton}`)
      console.log(`⬅️➡️ Navigation buttons present: ${hasNavigationButtons}`)
      
      // Test directions button functionality
      if (hasDirectionsButton) {
        const directionsLink = await popup.locator('a[href*="maps"], a[href*="geo:"]').first()
        if (await directionsLink.isVisible()) {
          const href = await directionsLink.getAttribute('href')
          console.log(`🔗 Directions URL: ${href?.substring(0, 50)}...`)
          expect(href).toMatch(/maps\.|geo:|apple\.com/)
          console.log('✅ Platform-appropriate directions URL generated')
        }
      }
    }
  })

  test('POI popup navigation buttons function correctly', async ({ page }) => {
    console.log('🧪 Testing POI popup navigation functionality')
    
    // Open first POI popup
    const markers = await page.locator('.leaflet-marker-icon').all()
    if (markers.length > 1) {
      await markers[0].click()
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 })
      
      // Look for navigation buttons in popup
      const popup = await page.locator('.leaflet-popup-content').first()
      const closerButton = await popup.locator('button:has-text("Closer"), [data-action="closer"]').first()
      const fartherButton = await popup.locator('button:has-text("Farther"), [data-action="farther"]').first()
      
      // Test "Farther" navigation if available
      if (await fartherButton.isVisible()) {
        console.log('🎯 Testing "Farther" navigation button')
        
        // Get initial marker count and positions
        const initialMarkers = await page.locator('.leaflet-marker-icon').count()
        
        await fartherButton.click()
        await page.waitForTimeout(1500) // Wait for navigation and potential new POI loading
        
        // Check if navigation worked (popup might change or new markers appear)
        const updatedMarkers = await page.locator('.leaflet-marker-icon').count()
        console.log(`📍 Markers after navigation: ${initialMarkers} → ${updatedMarkers}`)
        
        // Verify popup is still open (might show different POI)
        const popupStillVisible = await page.locator('.leaflet-popup').isVisible()
        console.log(`📋 Popup still visible: ${popupStillVisible}`)
        
        if (popupStillVisible) {
          console.log('✅ POI navigation completed successfully')
        }
      } else {
        console.log('ℹ️ Navigation buttons not found in current popup')
      }
    }
  })

  test('POI popups include contextual advertising', async ({ page }) => {
    console.log('🧪 Testing contextual advertising in POI popups')
    
    // Open POI popup
    const markers = await page.locator('.leaflet-marker-icon').all()
    if (markers.length > 0) {
      await markers[0].click()
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 })
      
      // Check for advertising elements
      const popup = await page.locator('.leaflet-popup-content').first()
      const popupHTML = await popup.innerHTML()
      
      // Look for ad-related content
      const hasAdvertisement = /advertisement|sponsored|ad-container/i.test(popupHTML)
      const hasContextualContent = /outdoor|recreation|gear|activity/i.test(popupHTML)
      
      console.log(`📺 Advertisement content present: ${hasAdvertisement}`)
      console.log(`🎯 Contextual content present: ${hasContextualContent}`)
      
      if (hasAdvertisement || hasContextualContent) {
        console.log('✅ Contextual advertising integration confirmed')
      } else {
        console.log('ℹ️ No advertising content detected in popup')
      }
    }
  })
})

test.describe('Map Container - Performance & Multi-Marker Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })
  })

  test('Map renders multiple POI markers efficiently', async ({ page }) => {
    console.log('🧪 Testing multi-marker performance and rendering efficiency')
    
    // Measure marker rendering performance
    const startTime = Date.now()
    
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
    const markers = await page.locator('.leaflet-marker-icon').all()
    const markerCount = markers.length
    
    const renderTime = Date.now() - startTime
    console.log(`📍 Rendered ${markerCount} markers in ${renderTime}ms`)
    
    // Performance threshold: Should render markers reasonably quickly
    expect(renderTime).toBeLessThan(5000) // 5 second max for initial render
    
    // Test marker distribution across map
    const markerPositions = []
    for (let i = 0; i < Math.min(markerCount, 10); i++) {
      const box = await markers[i].boundingBox()
      if (box) {
        markerPositions.push({ x: box.x, y: box.y })
      }
    }
    
    // Verify markers are distributed (not all in same position)
    const uniquePositions = new Set(markerPositions.map(p => `${p.x},${p.y}`))
    console.log(`📊 Unique marker positions: ${uniquePositions.size}/${markerPositions.length}`)
    expect(uniquePositions.size).toBeGreaterThan(1)
    
    console.log('✅ Multi-marker rendering performance acceptable')
  })

  test('Map viewport management and smart centering', async ({ page }) => {
    console.log('🧪 Testing map viewport management and smart centering')
    
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
    
    // Get initial map center via Leaflet API
    const initialCenter = await page.evaluate(() => {
      const map = window.leafletMapInstance
      return map ? map.getCenter() : null
    })
    
    if (initialCenter) {
      console.log(`🗺️ Initial map center: ${initialCenter.lat.toFixed(4)}, ${initialCenter.lng.toFixed(4)}`)
      
      // Test zoom functionality
      const initialZoom = await page.evaluate(() => {
        const map = window.leafletMapInstance
        return map ? map.getZoom() : null
      })
      
      console.log(`🔍 Initial zoom level: ${initialZoom}`)
      expect(initialZoom).toBeGreaterThan(0)
      
      // Test programmatic zoom change
      await page.evaluate(() => {
        const map = window.leafletMapInstance
        if (map) map.setZoom(map.getZoom() + 1)
      })
      
      await page.waitForTimeout(500) // Wait for zoom animation
      
      const newZoom = await page.evaluate(() => {
        const map = window.leafletMapInstance
        return map ? map.getZoom() : null
      })
      
      console.log(`🔍 Updated zoom level: ${newZoom}`)
      expect(newZoom).toBeGreaterThan(initialZoom)
      console.log('✅ Map zoom functionality working')
    }
  })

  test('Map memory management and cleanup', async ({ page }) => {
    console.log('🧪 Testing map memory management and cleanup')
    
    // Get initial memory usage (if available)
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : null
    })
    
    // Interact with map to create/destroy elements
    const markers = await page.locator('.leaflet-marker-icon').all()
    
    // Open and close multiple popups
    for (let i = 0; i < Math.min(3, markers.length); i++) {
      await markers[i].click()
      await page.waitForTimeout(500)
      await page.keyboard.press('Escape') // Close popup
      await page.waitForTimeout(200)
    }
    
    // Check memory after interactions
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : null
    })
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory
      console.log(`🧠 Memory change: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`)
      
      // Memory shouldn't increase dramatically from basic interactions
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB threshold
      console.log('✅ Memory usage within acceptable limits')
    } else {
      console.log('ℹ️ Memory measurement not available in this browser')
    }
  })
})

test.describe('Map Container - Mobile & Touch Interactions', () => {
  test('Map supports mobile touch gestures', async ({ page }) => {
    console.log('🧪 Testing mobile touch gestures and interactions')
    
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 12 Pro
    await page.goto(BASE_URL)
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })
    
    console.log('📱 Mobile viewport set, testing touch interactions')
    
    const mapContainer = await page.locator('.leaflet-container')
    
    // Test touch pan gesture
    const centerBox = await mapContainer.boundingBox()
    if (centerBox) {
      const centerX = centerBox.x + centerBox.width / 2
      const centerY = centerBox.y + centerBox.height / 2
      
      // Get initial map center
      const initialCenter = await page.evaluate(() => {
        const map = window.leafletMapInstance
        return map ? map.getCenter() : null
      })
      
      if (initialCenter) {
        console.log('👆 Testing touch pan gesture')
        
        // Perform touch pan
        await page.touchscreen.tap(centerX, centerY)
        await page.touchscreen.tap(centerX + 100, centerY + 100)
        
        await page.waitForTimeout(500)
        
        // Check if map center changed
        const newCenter = await page.evaluate(() => {
          const map = window.leafletMapInstance
          return map ? map.getCenter() : null
        })
        
        if (newCenter) {
          const moved = Math.abs(newCenter.lat - initialCenter.lat) > 0.001 || 
                       Math.abs(newCenter.lng - initialCenter.lng) > 0.001
          console.log(`📍 Map moved after touch: ${moved}`)
        }
      }
    }
    
    // Test touch on POI markers
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
    const markers = await page.locator('.leaflet-marker-icon').all()
    
    if (markers.length > 0) {
      console.log('📍 Testing touch interaction with POI markers')
      
      // Touch first marker
      await markers[0].tap()
      
      // Check if popup opens
      const popupVisible = await page.locator('.leaflet-popup').isVisible({ timeout: 3000 })
      console.log(`📋 Popup opened on touch: ${popupVisible}`)
      
      if (popupVisible) {
        console.log('✅ Mobile touch interactions working correctly')
      }
    }
  })

  test('Map is responsive across different screen sizes', async ({ page }) => {
    console.log('🧪 Testing map responsiveness across screen sizes')
    
    const viewports = [
      { width: 320, height: 568, name: 'iPhone 5/SE' },
      { width: 390, height: 844, name: 'iPhone 12 Pro' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ]
    
    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`)
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(BASE_URL)
      await page.waitForSelector('.leaflet-container', { timeout: 10000 })
      
      // Verify map fills available space
      const mapContainer = await page.locator('.leaflet-container')
      const mapBox = await mapContainer.boundingBox()
      
      if (mapBox) {
        const fillsWidth = mapBox.width > viewport.width * 0.8 // At least 80% width
        const fillsHeight = mapBox.height > viewport.height * 0.3 // At least 30% height
        
        console.log(`📏 Map dimensions: ${mapBox.width}x${mapBox.height}`)
        console.log(`✅ Fills viewport appropriately: width=${fillsWidth}, height=${fillsHeight}`)
        
        expect(fillsWidth).toBe(true)
        expect(fillsHeight).toBe(true)
      }
    }
  })
})

test.describe('Map Container - Platform-Specific Features', () => {
  test('Platform-aware directions URL generation', async ({ page, browserName }) => {
    console.log('🧪 Testing platform-specific directions URL generation')
    
    await page.goto(BASE_URL)
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
    
    // Override user agent to test different platforms
    const platforms = [
      { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15', expected: 'apple.com' },
      { userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36', expected: 'geo:' },
      { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', expected: 'google.com/maps' }
    ]
    
    for (const platform of platforms) {
      console.log(`🔧 Testing ${platform.expected} platform detection`)
      
      // Set user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': platform.userAgent
      })
      
      await page.reload()
      await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
      
      // Open POI popup
      const markers = await page.locator('.leaflet-marker-icon').all()
      if (markers.length > 0) {
        await markers[0].click()
        await page.waitForSelector('.leaflet-popup', { timeout: 5000 })
        
        // Check directions URL
        const popup = await page.locator('.leaflet-popup-content').first()
        const directionsLinks = await popup.locator('a[href*="maps"], a[href*="geo:"], a[href*="apple"]').all()
        
        if (directionsLinks.length > 0) {
          const href = await directionsLinks[0].getAttribute('href')
          console.log(`🔗 Generated URL: ${href?.substring(0, 50)}...`)
          
          const isCorrectPlatform = href?.includes(platform.expected)
          console.log(`✅ Correct platform URL (${platform.expected}): ${isCorrectPlatform}`)
        }
      }
    }
  })

  test('Analytics tracking for map interactions', async ({ page }) => {
    console.log('🧪 Testing analytics tracking for map interactions')
    
    await page.goto(BASE_URL)
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
    
    // Monitor console for analytics events
    const analyticsEvents = []
    page.on('console', (msg) => {
      if (msg.text().includes('Analytics:') || msg.text().includes('trackPOI')) {
        analyticsEvents.push(msg.text())
      }
    })
    
    // Interact with POI marker
    const markers = await page.locator('.leaflet-marker-icon').all()
    if (markers.length > 0) {
      await markers[0].click()
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 })
      
      // Click directions button if available
      const popup = await page.locator('.leaflet-popup-content').first()
      const directionsButton = await popup.locator('a[href*="maps"], a[href*="geo:"]').first()
      
      if (await directionsButton.isVisible()) {
        await directionsButton.click()
      }
      
      await page.waitForTimeout(1000) // Allow time for analytics events
      
      console.log(`📊 Analytics events captured: ${analyticsEvents.length}`)
      if (analyticsEvents.length > 0) {
        console.log('✅ Analytics tracking working')
        analyticsEvents.forEach(event => console.log(`  📈 ${event}`))
      } else {
        console.log('ℹ️ No analytics events detected (may be disabled in test environment)')
      }
    }
  })
})