#!/usr/bin/env node

/**
 * VISUAL LOCATION AVATAR INSPECTION
 *
 * PURPOSE: Use Playwright to visually locate and analyze the user location marker
 * - Take detailed screenshots of map area
 * - Inspect marker elements and positioning
 * - Analyze if marker is visible or hidden
 * - Check marker styling and icon rendering
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = '/home/robertspeer/Projects/screenshots';
const REPORT_FILE = '/home/robertspeer/Projects/GitRepo/nearest-nice-weather/location-avatar-analysis.json';

async function inspectLocationAvatar() {
  console.log('🔍 VISUAL LOCATION AVATAR INSPECTION');
  console.log('=' + '='.repeat(50));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const page = await browser.newPage();

  // Set larger viewport for better visibility
  await page.setViewportSize({ width: 1920, height: 1080 });

  const analysis = {
    timestamp: new Date().toISOString(),
    url: BASE_URL,
    markerAnalysis: {},
    screenshots: [],
    consoleErrors: [],
    recommendations: []
  };

  // Collect console errors for infinite loop analysis
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      analysis.consoleErrors.push({
        timestamp: new Date().toISOString(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  try {
    console.log('🌐 Loading localhost frontend...');
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for React app and map to initialize
    console.log('⏱️ Waiting for map initialization...');
    await page.waitForTimeout(5000);

    // Take initial full page screenshot
    const initialScreenshot = 'location-avatar-fullpage.png';
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, initialScreenshot),
      fullPage: true
    });
    analysis.screenshots.push({ type: 'fullpage', filename: initialScreenshot });
    console.log('📸 Full page screenshot captured');

    // Focus on map area and take detailed screenshot
    const mapContainer = page.locator('.leaflet-container').first();
    const mapExists = await mapContainer.count() > 0;

    if (mapExists) {
      console.log('✅ Map container found');

      // Take map-focused screenshot
      const mapScreenshot = 'location-avatar-map-focus.png';
      await mapContainer.screenshot({
        path: path.join(SCREENSHOTS_DIR, mapScreenshot)
      });
      analysis.screenshots.push({ type: 'map-focused', filename: mapScreenshot });
      console.log('📸 Map-focused screenshot captured');

      // Get map dimensions and center
      const mapBox = await mapContainer.boundingBox();
      analysis.markerAnalysis.mapDimensions = {
        width: mapBox?.width,
        height: mapBox?.height,
        x: mapBox?.x,
        y: mapBox?.y
      };
    }

    // Inspect all leaflet markers
    console.log('\n🎯 LEAFLET MARKER ANALYSIS:');
    console.log('=' + '='.repeat(35));

    const allMarkers = page.locator('.leaflet-marker-pane .leaflet-marker-icon');
    const markerCount = await allMarkers.count();

    console.log(`Found ${markerCount} leaflet markers total`);
    analysis.markerAnalysis.totalMarkers = markerCount;
    analysis.markerAnalysis.markers = [];

    for (let i = 0; i < markerCount; i++) {
      const marker = allMarkers.nth(i);

      // Get marker properties
      const isVisible = await marker.isVisible();
      const boundingBox = await marker.boundingBox();
      const innerHTML = await marker.innerHTML().catch(() => 'Unable to read');
      const className = await marker.getAttribute('class');
      const style = await marker.getAttribute('style');

      const markerData = {
        index: i,
        isVisible,
        boundingBox,
        innerHTML: innerHTML.substring(0, 200), // Truncate for readability
        className,
        style,
        isUserMarker: false
      };

      // Check if this looks like a user marker
      if (innerHTML.includes('😎') || innerHTML.includes('user') || style?.includes('z-index: 1000')) {
        markerData.isUserMarker = true;
        console.log(`🎯 POTENTIAL USER MARKER #${i}:`);
      } else {
        console.log(`📍 Regular marker #${i}:`);
      }

      console.log(`   Visible: ${isVisible}`);
      console.log(`   Position: ${boundingBox ? `${boundingBox.x}, ${boundingBox.y}` : 'unknown'}`);
      console.log(`   Size: ${boundingBox ? `${boundingBox.width}x${boundingBox.height}` : 'unknown'}`);
      console.log(`   Content: ${innerHTML.substring(0, 100)}...`);
      console.log(`   Style: ${style?.substring(0, 100)}...`);

      // Take individual marker screenshot if visible
      if (isVisible && boundingBox) {
        try {
          const markerScreenshot = `marker-${i}-${markerData.isUserMarker ? 'user' : 'poi'}.png`;
          await marker.screenshot({
            path: path.join(SCREENSHOTS_DIR, markerScreenshot)
          });
          analysis.screenshots.push({
            type: 'individual-marker',
            filename: markerScreenshot,
            markerIndex: i,
            isUserMarker: markerData.isUserMarker
          });
          console.log(`   📸 Individual marker screenshot: ${markerScreenshot}`);
        } catch (error) {
          console.log(`   ⚠️ Could not screenshot marker: ${error.message}`);
        }
      }

      analysis.markerAnalysis.markers.push(markerData);
      console.log('');
    }

    // Look for user location specifically by content
    console.log('🔍 SEARCHING FOR USER LOCATION MARKERS:');
    const userMarkerSelectors = [
      'img[src*="user"]',
      'div:has-text("😎")',
      '[aria-label*="user"]',
      '[aria-label*="location"]',
      '.leaflet-marker-icon:has-text("😎")'
    ];

    let userMarkerFound = false;
    for (const selector of userMarkerSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`✅ Found ${elements.length} user marker(s) with selector: ${selector}`);
          userMarkerFound = true;

          // Take screenshot of first user marker found
          const userMarkerScreenshot = `user-marker-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
          await elements[0].screenshot({
            path: path.join(SCREENSHOTS_DIR, userMarkerScreenshot)
          });
          analysis.screenshots.push({
            type: 'user-marker-specific',
            filename: userMarkerScreenshot,
            selector
          });
        }
      } catch (error) {
        // Selector not found or invalid, continue
      }
    }

    if (!userMarkerFound) {
      console.log('❌ No user markers found with specific selectors');
    }

    // Check if markers are outside viewport
    console.log('\n📐 VIEWPORT ANALYSIS:');
    const viewport = page.viewportSize();
    console.log(`Viewport: ${viewport?.width}x${viewport?.height}`);

    let markersOutsideViewport = 0;
    analysis.markerAnalysis.markers.forEach((marker, index) => {
      if (marker.boundingBox) {
        const inViewport = marker.boundingBox.x >= 0 &&
                          marker.boundingBox.y >= 0 &&
                          marker.boundingBox.x + marker.boundingBox.width <= (viewport?.width || 1920) &&
                          marker.boundingBox.y + marker.boundingBox.height <= (viewport?.height || 1080);

        if (!inViewport) {
          markersOutsideViewport++;
          console.log(`⚠️ Marker #${index} is outside viewport: ${marker.boundingBox.x}, ${marker.boundingBox.y}`);
        }
      }
    });

    analysis.markerAnalysis.markersOutsideViewport = markersOutsideViewport;

    // Monitor console errors for 3 seconds to analyze infinite loop frequency
    console.log('\n🔄 MONITORING CONSOLE ERRORS:');
    const errorCountBefore = analysis.consoleErrors.length;
    await page.waitForTimeout(3000);
    const errorCountAfter = analysis.consoleErrors.length;
    const errorsPerSecond = (errorCountAfter - errorCountBefore) / 3;

    console.log(`Console errors in 3 seconds: ${errorCountAfter - errorCountBefore}`);
    console.log(`Error frequency: ${errorsPerSecond.toFixed(1)} errors/second`);

    analysis.infiniteLoopAnalysis = {
      errorsIn3Seconds: errorCountAfter - errorCountBefore,
      errorsPerSecond,
      severity: errorsPerSecond > 2 ? 'high' : errorsPerSecond > 1 ? 'medium' : 'low'
    };

    // Generate recommendations
    analysis.recommendations = [];

    if (analysis.markerAnalysis.totalMarkers === 0) {
      analysis.recommendations.push({
        priority: 'high',
        issue: 'No markers found on map',
        solution: 'Check if location data is loading properly and markers are being created'
      });
    }

    if (markersOutsideViewport > 0) {
      analysis.recommendations.push({
        priority: 'medium',
        issue: `${markersOutsideViewport} markers outside viewport`,
        solution: 'Implement auto-centering to fit all markers in view or adjust initial map center/zoom'
      });
    }

    if (!userMarkerFound && markerCount > 0) {
      analysis.recommendations.push({
        priority: 'medium',
        issue: 'User location marker not clearly identifiable',
        solution: 'Add distinct styling, icon, or aria-label to user location marker'
      });
    }

    if (errorsPerSecond > 2) {
      analysis.recommendations.push({
        priority: 'high',
        issue: `High frequency console errors (${errorsPerSecond.toFixed(1)}/sec)`,
        solution: 'Fix React infinite loop by stabilizing useEffect dependencies'
      });
    }

    // Save detailed analysis
    await fs.writeFile(REPORT_FILE, JSON.stringify(analysis, null, 2));
    console.log(`\n📋 Detailed analysis saved to: ${REPORT_FILE}`);

    return analysis;

  } catch (error) {
    console.error('💥 Inspection failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run inspection
inspectLocationAvatar()
  .then((analysis) => {
    console.log('\n🎯 VISUAL INSPECTION COMPLETE');
    console.log('=' + '='.repeat(40));
    console.log(`Screenshots captured: ${analysis.screenshots.length}`);
    console.log(`Total markers found: ${analysis.markerAnalysis.totalMarkers}`);
    console.log(`User markers identified: ${analysis.markerAnalysis.markers.filter(m => m.isUserMarker).length}`);
    console.log(`Console errors per second: ${analysis.infiniteLoopAnalysis.errorsPerSecond.toFixed(1)}`);

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
        console.log(`   Solution: ${rec.solution}`);
      });
    }

    console.log(`\n📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log(`📋 Full analysis in: ${REPORT_FILE}`);
  })
  .catch((error) => {
    console.error('💥 Visual inspection failed:', error.message);
    process.exit(1);
  });
