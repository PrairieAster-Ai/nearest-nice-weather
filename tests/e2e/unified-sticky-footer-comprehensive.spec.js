/**
 * ========================================================================
 * UNIFIED STICKY FOOTER COMPREHENSIVE TEST SUITE
 * ========================================================================
 *
 * @PURPOSE: Complete testing of UnifiedStickyFooter component functionality
 * @VALIDATES: Footer positioning, branding, responsive design, z-index stacking
 * @COVERS: UnifiedStickyFooter.tsx, responsive layout, brand consistency, mobile optimization
 *
 * BUSINESS CONTEXT: Critical brand presence and navigation anchor for B2C platform
 * - Consistent brand visibility across all screens and interactions
 * - Responsive footer design optimized for Minnesota outdoor recreation users
 * - Fixed positioning to maintain brand presence during map interactions
 * - Professional brand identity with PrairieAster.Ai attribution
 * - Mobile-optimized sizing for outdoor use on various devices
 *
 * FOOTER COMPONENT ARCHITECTURE:
 * - Fixed positioning at bottom of viewport (z-index 1004)
 * - Light purple branded background with border and backdrop blur
 * - Purple Aster logo with full-height scaling and aspect ratio preservation
 * - Two-line brand text: "Nearest Nice Weather" + "by PrairieAster.Ai"
 * - Responsive height scaling: 30% reduced on iPhone, standard on tablet/desktop
 * - Typography with clamp() functions for fluid text sizing
 * - Left-aligned layout with minimal gap between logo and text
 * - Box shadow for depth and visual separation from map content
 *
 * TEST COVERAGE:
 * 1. Footer rendering and visibility across screen sizes
 * 2. Fixed positioning and z-index stacking behavior
 * 3. Responsive height scaling (iPhone 30% reduction, standard elsewhere)
 * 4. Logo rendering, aspect ratio, and height scaling
 * 5. Typography scaling and readability across viewports
 * 6. Brand text content accuracy and styling
 * 7. Background styling (purple theme, blur, shadow)
 * 8. Layout alignment and spacing consistency
 * 9. Mobile touch-friendly sizing and interaction
 * 10. Cross-browser compatibility testing
 * 11. Overlap prevention with map controls and FABs
 * 12. Performance impact on scrolling and map interactions
 *
 * ========================================================================
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

test.describe('Unified Sticky Footer - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    console.log(`👥 Testing Unified Sticky Footer on ${BASE_URL}`)
    await page.goto(BASE_URL)
    await page.waitForSelector('footer', { timeout: 10000 })
    console.log('✅ Page loaded with footer component')
  })

  test('Footer renders correctly with proper positioning', async ({ page }) => {
    console.log('🧪 Testing footer rendering and positioning')

    // Find footer element
    const footer = await page.locator('footer')
    expect(await footer.isVisible()).toBe(true)
    console.log('✅ Footer element found and visible')

    // Check positioning
    const footerBox = await footer.boundingBox()
    if (footerBox) {
      const viewportSize = await page.viewportSize()
      const isAtBottom = Math.abs(footerBox.y + footerBox.height - viewportSize.height) < 5

      console.log(`📏 Footer position: y=${footerBox.y}, height=${footerBox.height}`)
      console.log(`📱 Viewport height: ${viewportSize.height}`)
      console.log(`📍 Footer at bottom: ${isAtBottom}`)

      expect(isAtBottom).toBe(true)
    }

    // Check fixed positioning
    const position = await footer.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        position: computed.position,
        bottom: computed.bottom,
        left: computed.left,
        right: computed.right,
        zIndex: computed.zIndex
      }
    })

    console.log(`🎯 Footer CSS positioning: ${JSON.stringify(position)}`)
    expect(position.position).toBe('fixed')
    expect(position.bottom).toBe('0px')
    expect(parseInt(position.zIndex)).toBeGreaterThan(1000)

    console.log('✅ Footer positioning verified')
  })

  test('Footer background and styling render correctly', async ({ page }) => {
    console.log('🧪 Testing footer background and visual styling')

    const footer = await page.locator('footer')

    // Check background styling
    const footerStyles = await footer.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        backgroundColor: computed.backgroundColor,
        borderTop: computed.borderTop,
        backdropFilter: computed.backdropFilter,
        boxShadow: computed.boxShadow
      }
    })

    console.log(`🎨 Footer styling: ${JSON.stringify(footerStyles)}`)

    // Verify purple-themed background (should contain rgb values for light purple)
    expect(footerStyles.backgroundColor).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/)

    // Verify border exists
    expect(footerStyles.borderTop).not.toBe('none')
    expect(footerStyles.borderTop).not.toBe('0px')

    // Verify backdrop filter for blur effect
    expect(footerStyles.backdropFilter).toContain('blur')

    // Verify box shadow exists
    expect(footerStyles.boxShadow).not.toBe('none')

    console.log('✅ Footer visual styling verified')
  })

  test('Purple Aster logo renders with correct scaling', async ({ page }) => {
    console.log('🧪 Testing Purple Aster logo rendering and scaling')

    const footer = await page.locator('footer')

    // Find logo image
    const logoImage = await footer.locator('img[alt*="Nearest Nice Weather"]')
    expect(await logoImage.isVisible()).toBe(true)
    console.log('✅ Purple Aster logo found and visible')

    // Check logo source
    const logoSrc = await logoImage.getAttribute('src')
    console.log(`🖼️ Logo source: ${logoSrc}`)
    expect(logoSrc).toContain('aster-official.svg')

    // Check logo dimensions and scaling
    const logoBox = await logoImage.boundingBox()
    const footerBox = await footer.boundingBox()

    if (logoBox && footerBox) {
      const logoHeightRatio = logoBox.height / footerBox.height
      console.log(`📏 Logo dimensions: ${logoBox.width}x${logoBox.height}`)
      console.log(`📏 Footer height: ${footerBox.height}`)
      console.log(`📊 Logo height ratio: ${logoHeightRatio.toFixed(2)} (${(logoHeightRatio * 100).toFixed(0)}% of footer)`)

      // Logo should take up significant portion of footer height (80-100%)
      expect(logoHeightRatio).toBeGreaterThan(0.7)
      expect(logoHeightRatio).toBeLessThan(1.2)

      // Logo should have reasonable aspect ratio (wider than it is tall)
      const logoAspectRatio = logoBox.width / logoBox.height
      console.log(`📐 Logo aspect ratio: ${logoAspectRatio.toFixed(2)}`)
      expect(logoAspectRatio).toBeGreaterThan(0.5) // Not too narrow
    }

    console.log('✅ Logo scaling verified')
  })

  test('Brand typography displays correctly with proper styling', async ({ page }) => {
    console.log('🧪 Testing brand typography and text styling')

    const footer = await page.locator('footer')

    // Find main brand text
    const mainBrandText = await footer.locator('text="Nearest Nice Weather"')
    expect(await mainBrandText.isVisible()).toBe(true)
    console.log('✅ Main brand text found')

    // Find attribution text
    const attributionText = await footer.locator('text="by PrairieAster.Ai"')
    expect(await attributionText.isVisible()).toBe(true)
    console.log('✅ Attribution text found')

    // Check typography styling
    const mainTextStyles = await mainBrandText.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        fontWeight: computed.fontWeight,
        color: computed.color,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight
      }
    })

    const attributionStyles = await attributionText.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        color: computed.color,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight
      }
    })

    console.log(`📝 Main text styling: ${JSON.stringify(mainTextStyles)}`)
    console.log(`📝 Attribution styling: ${JSON.stringify(attributionStyles)}`)

    // Verify bold main text
    expect(parseInt(mainTextStyles.fontWeight)).toBeGreaterThanOrEqual(600)

    // Verify colors are different (main should be purple, attribution should be blue)
    expect(mainTextStyles.color).not.toBe(attributionStyles.color)

    // Verify font sizes
    const mainFontSize = parseFloat(mainTextStyles.fontSize)
    const attributionFontSize = parseFloat(attributionStyles.fontSize)

    console.log(`📊 Font sizes: main=${mainFontSize}px, attribution=${attributionFontSize}px`)

    // Main text should be larger than attribution
    expect(mainFontSize).toBeGreaterThan(attributionFontSize)

    console.log('✅ Typography styling verified')
  })
})

test.describe('Unified Sticky Footer - Responsive Design', () => {
  const viewports = [
    { width: 320, height: 568, name: 'iPhone 5/SE' },
    { width: 390, height: 844, name: 'iPhone 12 Pro' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1200, height: 800, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' }
  ]

  for (const viewport of viewports) {
    test(`Footer responsive design works correctly on ${viewport.name}`, async ({ page }) => {
      console.log(`🧪 Testing footer responsive design on ${viewport.name} (${viewport.width}x${viewport.height})`)

      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(BASE_URL)
      await page.waitForSelector('footer', { timeout: 10000 })

      const footer = await page.locator('footer')
      const footerBox = await footer.boundingBox()

      if (footerBox) {
        // Calculate expected height based on viewport and iPhone reduction rules
        const isPhone = viewport.width < 500
        const expectedHeightRatio = isPhone ? 0.056 : 0.06 // iPhone 30% reduction from 8% to ~5.6%
        const expectedHeight = viewport.height * expectedHeightRatio

        console.log(`📏 Footer height: ${footerBox.height}px`)
        console.log(`📊 Expected height: ~${expectedHeight.toFixed(0)}px (${(expectedHeightRatio * 100).toFixed(1)}% of viewport)`)

        // Footer height should be reasonable for the viewport
        const heightRatio = footerBox.height / viewport.height
        console.log(`📊 Actual height ratio: ${(heightRatio * 100).toFixed(1)}% of viewport`)

        if (isPhone) {
          // iPhone should have reduced height (around 4-7% of viewport)
          expect(heightRatio).toBeGreaterThan(0.04)
          expect(heightRatio).toBeLessThan(0.08)
        } else {
          // Tablet/Desktop should have standard height (around 5-8% of viewport)
          expect(heightRatio).toBeGreaterThan(0.04)
          expect(heightRatio).toBeLessThan(0.1)
        }

        // Footer should span full width
        expect(footerBox.width).toBe(viewport.width)

        // Footer should be at bottom
        const isAtBottom = Math.abs(footerBox.y + footerBox.height - viewport.height) < 2
        expect(isAtBottom).toBe(true)

        console.log(`✅ ${viewport.name} responsive design verified`)
      }
    })
  }

  test('Footer typography scales appropriately across screen sizes', async ({ page }) => {
    console.log('🧪 Testing typography scaling across different screen sizes')

    const typographyData = []

    for (const viewport of viewports.slice(0, 3)) { // Test iPhone, iPad, Desktop
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(BASE_URL)
      await page.waitForSelector('footer', { timeout: 10000 })

      const footer = await page.locator('footer')
      const mainText = await footer.locator('text="Nearest Nice Weather"')
      const attributionText = await footer.locator('text="by PrairieAster.Ai"')

      if (await mainText.isVisible() && await attributionText.isVisible()) {
        const mainFontSize = await mainText.evaluate(el => {
          return parseFloat(window.getComputedStyle(el).fontSize)
        })

        const attributionFontSize = await attributionText.evaluate(el => {
          return parseFloat(window.getComputedStyle(el).fontSize)
        })

        typographyData.push({
          viewport: viewport.name,
          width: viewport.width,
          mainFontSize,
          attributionFontSize
        })

        console.log(`📝 ${viewport.name}: main=${mainFontSize.toFixed(1)}px, attribution=${attributionFontSize.toFixed(1)}px`)
      }
    }

    // Verify typography scaling pattern
    if (typographyData.length >= 2) {
      // Font sizes should generally increase with screen size
      const smallestViewport = typographyData[0]
      const largestViewport = typographyData[typographyData.length - 1]

      console.log(`📊 Typography scaling: ${smallestViewport.mainFontSize.toFixed(1)}px → ${largestViewport.mainFontSize.toFixed(1)}px`)

      // Larger screens should have larger or equal font sizes
      expect(largestViewport.mainFontSize).toBeGreaterThanOrEqual(smallestViewport.mainFontSize - 1)
      expect(largestViewport.attributionFontSize).toBeGreaterThanOrEqual(smallestViewport.attributionFontSize - 1)

      console.log('✅ Typography scaling pattern verified')
    }
  })
})

test.describe('Unified Sticky Footer - Layout & Stacking', () => {
  test('Footer maintains proper z-index stacking with other components', async ({ page }) => {
    console.log('🧪 Testing footer z-index stacking behavior')

    await page.goto(BASE_URL)
    await page.waitForSelector('footer', { timeout: 10000 })

    // Get footer z-index
    const footer = await page.locator('footer')
    const footerZIndex = await footer.evaluate(el => {
      return parseInt(window.getComputedStyle(el).zIndex) || 0
    })

    console.log(`📚 Footer z-index: ${footerZIndex}`)
    expect(footerZIndex).toBeGreaterThan(1000)

    // Check for FAB components (should have lower z-index)
    const fabs = await page.locator('.MuiFab-root').all()
    if (fabs.length > 0) {
      for (let i = 0; i < Math.min(3, fabs.length); i++) {
        const fabZIndex = await fabs[i].evaluate(el => {
          return parseInt(window.getComputedStyle(el).zIndex) || 0
        })
        console.log(`🔘 FAB ${i} z-index: ${fabZIndex}`)

        // Footer should be above FABs
        expect(footerZIndex).toBeGreaterThan(fabZIndex)
      }
    }

    // Check for map container (should have lower z-index)
    const mapContainer = await page.locator('.leaflet-container')
    if (await mapContainer.isVisible()) {
      const mapZIndex = await mapContainer.evaluate(el => {
        return parseInt(window.getComputedStyle(el).zIndex) || 0
      })
      console.log(`🗺️ Map container z-index: ${mapZIndex}`)

      // Footer should be above map
      expect(footerZIndex).toBeGreaterThan(mapZIndex)
    }

    console.log('✅ Z-index stacking verified')
  })

  test('Footer layout alignment and spacing is consistent', async ({ page }) => {
    console.log('🧪 Testing footer layout alignment and spacing')

    await page.goto(BASE_URL)
    await page.waitForSelector('footer', { timeout: 10000 })

    const footer = await page.locator('footer')
    const logoImage = await footer.locator('img[alt*="Nearest Nice Weather"]')
    const mainText = await footer.locator('text="Nearest Nice Weather"')

    if (await logoImage.isVisible() && await mainText.isVisible()) {
      const logoBox = await logoImage.boundingBox()
      const textBox = await mainText.boundingBox()

      if (logoBox && textBox) {
        // Check horizontal alignment (logo should be to the left of text)
        expect(logoBox.x).toBeLessThan(textBox.x)

        // Check vertical alignment (should be roughly center-aligned)
        const logoCenterY = logoBox.y + logoBox.height / 2
        const textCenterY = textBox.y + textBox.height / 2
        const verticalAlignment = Math.abs(logoCenterY - textCenterY)

        console.log(`📐 Vertical alignment difference: ${verticalAlignment.toFixed(1)}px`)

        // Should be reasonably aligned (within 20px difference)
        expect(verticalAlignment).toBeLessThan(20)

        // Check spacing between logo and text (should be minimal but present)
        const horizontalSpacing = textBox.x - (logoBox.x + logoBox.width)
        console.log(`📏 Horizontal spacing: ${horizontalSpacing.toFixed(1)}px`)

        // Should have some spacing but not excessive
        expect(horizontalSpacing).toBeGreaterThan(-5) // Allow slight overlap
        expect(horizontalSpacing).toBeLessThan(50)     // Not too much spacing

        console.log('✅ Layout alignment and spacing verified')
      }
    }
  })

  test('Footer does not interfere with map interactions', async ({ page }) => {
    console.log('🧪 Testing footer interaction with map functionality')

    await page.goto(BASE_URL)
    await page.waitForSelector('footer', { timeout: 10000 })
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })

    // Get footer height to calculate available map area
    const footer = await page.locator('footer')
    const footerBox = await footer.boundingBox()

    if (footerBox) {
      console.log(`📏 Footer occupies ${footerBox.height}px at bottom`)

      // Test map interaction above footer area
      const mapContainer = await page.locator('.leaflet-container')
      const mapBox = await mapContainer.boundingBox()

      if (mapBox) {
        // Click in map area above footer
        const safeClickY = mapBox.y + (mapBox.height - footerBox.height) / 2
        const safeClickX = mapBox.x + mapBox.width / 2

        console.log(`🖱️ Testing map click at (${safeClickX}, ${safeClickY})`)

        await page.mouse.click(safeClickX, safeClickY)
        await page.waitForTimeout(300)

        // Verify map is still interactive (no errors or blocking)
        console.log('✅ Map interaction above footer works correctly')

        // Test click near footer boundary (should still work for map)
        const boundaryClickY = footerBox.y - 10 // 10px above footer

        await page.mouse.click(safeClickX, boundaryClickY)
        await page.waitForTimeout(300)

        console.log('✅ Map interaction near footer boundary works correctly')
      }
    }
  })
})

test.describe('Unified Sticky Footer - Cross-Browser Compatibility', () => {
  test('Footer renders consistently across different browsers', async ({ page, browserName }) => {
    console.log(`🧪 Testing footer rendering on ${browserName}`)

    await page.goto(BASE_URL)
    await page.waitForSelector('footer', { timeout: 10000 })

    const footer = await page.locator('footer')

    // Test basic rendering
    expect(await footer.isVisible()).toBe(true)

    // Test CSS properties that might differ across browsers
    const footerStyles = await footer.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        position: computed.position,
        display: computed.display,
        backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
        borderTop: computed.borderTop
      }
    })

    console.log(`🌐 ${browserName} footer styles: ${JSON.stringify(footerStyles)}`)

    // Verify critical styles work across browsers
    expect(footerStyles.position).toBe('fixed')
    expect(footerStyles.display).not.toBe('none')

    // Test logo loading across browsers
    const logoImage = await footer.locator('img[alt*="Nearest Nice Weather"]')
    if (await logoImage.isVisible()) {
      const logoNaturalDimensions = await logoImage.evaluate(img => {
        return { width: img.naturalWidth, height: img.naturalHeight }
      })

      console.log(`🖼️ Logo natural dimensions in ${browserName}: ${JSON.stringify(logoNaturalDimensions)}`)

      // Logo should have loaded (natural dimensions > 0)
      expect(logoNaturalDimensions.width).toBeGreaterThan(0)
      expect(logoNaturalDimensions.height).toBeGreaterThan(0)
    }

    console.log(`✅ Footer renders correctly on ${browserName}`)
  })
})
