/**
 * ========================================================================
 * POI POPUP REFACTOR TEST - Validate Layout Changes
 * ========================================================================
 * 
 * @PURPOSE: Test the refactored POI popup layout on localhost
 * @VALIDATES: MN DNR removal, map emoji driving directions, contextual ads
 * 
 * ========================================================================
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3005'

test.describe('POI Popup Refactor Validation', () => {
  test('POI popup has new layout with map emoji and contextual ad', async ({ page }) => {
    console.log(`🔍 Testing POI popup refactor on ${BASE_URL}`)
    
    // Navigate to the app
    await page.goto(BASE_URL)
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })
    console.log('✅ Map loaded')
    
    // Wait for POI markers to appear
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
    const markers = await page.locator('.leaflet-marker-icon').all()
    console.log(`✅ Found ${markers.length} POI markers`)
    
    if (markers.length > 0) {
      // Click the first POI marker (skip user location marker if present)
      let poiMarker = null
      for (const marker of markers) {
        const src = await marker.getAttribute('src')
        if (src && src.includes('aster-marker')) {
          poiMarker = marker
          break
        }
      }
      
      if (poiMarker) {
        await poiMarker.click()
        console.log('✅ Clicked POI marker')
        
        // Wait for popup to open
        await page.waitForSelector('.leaflet-popup-content', { timeout: 5000 })
        console.log('✅ Popup opened')
        
        // Get popup content
        const popupContent = await page.locator('.leaflet-popup-content').innerHTML()
        
        // TEST 1: Verify MN DNR link is removed
        const hasDNRLink = popupContent.includes('MN DNR') || popupContent.includes('dnr.state.mn.us')
        expect(hasDNRLink).toBe(false)
        console.log('✅ MN DNR link successfully removed')
        
        // TEST 2: Verify map emoji for driving directions exists
        const hasMapEmoji = popupContent.includes('🗺️')
        expect(hasMapEmoji).toBe(true)
        console.log('✅ Map emoji for driving directions present')
        
        // TEST 3: Verify map emoji is a clickable link
        const mapLink = await page.locator('a:has-text("🗺️")').first()
        if (await mapLink.isVisible()) {
          const href = await mapLink.getAttribute('href')
          expect(href).toContain('google.com/maps')
          console.log('✅ Map emoji is clickable with Google Maps link')
        }
        
        // TEST 4: Verify contextual ad container exists
        const hasAdContainer = popupContent.includes('Advertisement') || 
                              popupContent.includes('Outdoor Recreation') ||
                              popupContent.includes('Weather Gear') ||
                              popupContent.includes('Park Activities')
        expect(hasAdContainer).toBe(true)
        console.log('✅ Contextual ad container present')
        
        // TEST 5: Verify layout structure (map emoji near description)
        const hasProperLayout = popupContent.includes('flex') && popupContent.includes('gap')
        expect(hasProperLayout).toBe(true)
        console.log('✅ Proper flex layout structure confirmed')
        
        // Take screenshot for visual verification
        await page.screenshot({ 
          path: 'test-results/poi-popup-refactor.png',
          fullPage: true 
        })
        console.log('📸 Screenshot saved: test-results/poi-popup-refactor.png')
        
        // Log popup structure for debugging
        console.log('\n📋 Popup Structure Analysis:')
        console.log('- Has POI name:', popupContent.includes('class="font-bold text-sm'))
        console.log('- Has weather info:', popupContent.includes('°F'))
        console.log('- Has navigation buttons:', popupContent.includes('Closer') || popupContent.includes('Farther'))
        console.log('- Has contextual targeting:', popupContent.includes('°F') && popupContent.includes('Advertisement'))
        
      } else {
        console.log('⚠️ No POI markers found (only user location marker)')
      }
    }
    
    console.log('\n✅ POI popup refactor validation complete!')
  })
  
  test('Homepage banner ad is removed', async ({ page }) => {
    console.log(`🔍 Testing homepage banner removal on ${BASE_URL}`)
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Check that homepage banner ad is not present
    const pageContent = await page.content()
    const hasBannerAd = pageContent.includes('homepage-banner') || 
                        pageContent.includes('Test Ad Unit homepage-banner')
    
    expect(hasBannerAd).toBe(false)
    console.log('✅ Homepage banner ad successfully removed')
    
    // Check page doesn't have extra whitespace at top
    const mapContainer = await page.locator('.leaflet-container').boundingBox()
    if (mapContainer) {
      // Map should be near the top of the viewport (accounting for any small headers)
      expect(mapContainer.y).toBeLessThan(100)
      console.log(`✅ Map positioned correctly at top (y: ${mapContainer.y}px)`)
    }
  })
})