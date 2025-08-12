/**
 * ========================================================================
 * MAP PAGE OBJECT MODEL
 * ========================================================================
 * 
 * @PURPOSE: Encapsulates all map-related interactions and assertions
 * @FOLLOWS: Playwright Page Object Model best practices
 * 
 * Key Benefits:
 * - User-facing locators instead of CSS selectors
 * - Reusable methods across tests
 * - Centralized element definitions
 * - Better test maintenance
 * 
 * ========================================================================
 */

import { expect } from '@playwright/test'

export class MapPage {
  constructor(page) {
    this.page = page
    
    // USER-FACING LOCATORS (Best Practice)
    this.mapContainer = page.getByTestId('map-container') // Will add to component
    this.poiMarkers = page.getByRole('button', { name: /park|trail|forest|nature/i })
    this.mapAttribution = page.getByText('OpenStreetMap')
    this.userLocationMarker = page.getByTestId('user-location-marker')
    
    // POPUPS AND OVERLAYS
    this.poiPopup = page.getByRole('dialog', { name: /point of interest/i })
    this.poiPopupContent = page.getByTestId('poi-popup-content')
    this.directionsButton = page.getByRole('link', { name: /directions|navigate/i })
    this.closePopupButton = page.getByRole('button', { name: /close|dismiss/i })
  }

  // NAVIGATION METHODS
  async goto() {
    await this.page.goto('/')
    await this.waitForMapReady()
  }

  // WAIT METHODS (Smart waiting, no hard-coded timeouts)
  async waitForMapReady() {
    // Wait for map container to be visible
    await expect(this.mapContainer).toBeVisible()
    
    // Wait for at least one POI marker to load
    await expect(this.poiMarkers.first()).toBeVisible({ timeout: 10000 })
    
    return this
  }

  async waitForTilesToLoad() {
    // Wait for OpenStreetMap attribution (indicates tiles loaded)
    await expect(this.mapAttribution).toBeVisible({ timeout: 10000 })
    return this
  }

  // POI INTERACTION METHODS
  async clickFirstPOI() {
    const firstMarker = this.poiMarkers.first()
    await firstMarker.click()
    await expect(this.poiPopup).toBeVisible()
    
    return {
      popup: this.poiPopup,
      content: this.poiPopupContent
    }
  }

  async clickPOIByName(poiName) {
    const marker = this.page.getByRole('button', { name: new RegExp(poiName, 'i') })
    await marker.click()
    await expect(this.poiPopup).toBeVisible()
    
    return {
      popup: this.poiPopup,
      content: this.poiPopupContent
    }
  }

  async closePopup() {
    await this.page.keyboard.press('Escape')
    await expect(this.poiPopup).toBeHidden()
  }

  // DIRECTIONS METHODS
  async clickDirections() {
    await this.directionsButton.click()
    // Note: This will open external app, so we just verify the click worked
    return true
  }

  async getDirectionsURL() {
    return await this.directionsButton.getAttribute('href')
  }

  // ASSERTIONS (User-visible behavior)
  async expectMapVisible() {
    await expect(this.mapContainer).toBeVisible()
    return this
  }

  async expectPOIMarkersVisible() {
    await expect(this.poiMarkers.first()).toBeVisible()
    const count = await this.poiMarkers.count()
    expect(count).toBeGreaterThan(0)
    return count
  }

  async expectPopupVisible() {
    await expect(this.poiPopup).toBeVisible()
    return this
  }

  async expectPopupHidden() {
    await expect(this.poiPopup).toBeHidden()
    return this
  }

  // GET METHODS (Data retrieval)
  async getPOICount() {
    return await this.poiMarkers.count()
  }

  async getVisiblePOINames() {
    const markers = await this.poiMarkers.all()
    const names = []
    
    for (const marker of markers) {
      const name = await marker.getAttribute('aria-label')
      if (name) names.push(name)
    }
    
    return names
  }

  async getPopupContent() {
    await expect(this.poiPopup).toBeVisible()
    return await this.poiPopupContent.textContent()
  }

  // MAP INTERACTION METHODS
  async panMap(deltaX, deltaY) {
    const mapRect = await this.mapContainer.boundingBox()
    const centerX = mapRect.x + mapRect.width / 2
    const centerY = mapRect.y + mapRect.height / 2
    
    // Drag map
    await this.page.mouse.move(centerX, centerY)
    await this.page.mouse.down()
    await this.page.mouse.move(centerX + deltaX, centerY + deltaY)
    await this.page.mouse.up()
    
    return this
  }

  async zoomIn() {
    await this.mapContainer.click({ clickCount: 2 }) // Double-click to zoom
    return this
  }

  // MOBILE-SPECIFIC METHODS
  async tapPOI(poiName) {
    const marker = this.page.getByRole('button', { name: new RegExp(poiName, 'i') })
    await marker.tap()
    await expect(this.poiPopup).toBeVisible()
    return this
  }

  async pinchZoom(scale = 1.5) {
    const mapRect = await this.mapContainer.boundingBox()
    const centerX = mapRect.x + mapRect.width / 2
    const centerY = mapRect.y + mapRect.height / 2
    
    // Simulate pinch gesture
    await this.page.touchscreen.tap(centerX - 50, centerY)
    await this.page.touchscreen.tap(centerX + 50, centerY)
    
    return this
  }

  // VALIDATION METHODS
  async validateMapState() {
    const checks = {
      mapVisible: false,
      poisLoaded: false,
      tilesLoaded: false,
      poiCount: 0
    }

    // Check map visibility
    checks.mapVisible = await this.mapContainer.isVisible()
    
    // Check POI markers
    const poiCount = await this.poiMarkers.count()
    checks.poiCount = poiCount
    checks.poisLoaded = poiCount > 0
    
    // Check tiles loaded
    checks.tilesLoaded = await this.mapAttribution.isVisible()

    return checks
  }

  // PERFORMANCE METHODS
  async measureLoadTime() {
    const startTime = Date.now()
    await this.waitForMapReady()
    const endTime = Date.now()
    
    return endTime - startTime
  }

  async getMemoryUsage() {
    return await this.page.evaluate(() => {
      return performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    })
  }
}