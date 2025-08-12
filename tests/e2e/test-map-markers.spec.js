import { test, expect } from '@playwright/test';

test.describe('Map Markers Investigation', () => {
  test('should display map markers for POI locations', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser console:', msg.text());
      }
    });

    // Navigate to the correct port
    await page.goto('http://localhost:3002/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for the app to fully load
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'map-initial-state.png', fullPage: true });

    // Check if map container exists
    const mapContainer = await page.locator('#map-container, .leaflet-container, [id*="map"], [class*="map"]').first();
    const mapExists = await mapContainer.isVisible();
    console.log('Map container exists:', mapExists);

    if (mapExists) {
      // Get map bounds for debugging
      const mapBounds = await mapContainer.boundingBox();
      console.log('Map bounds:', mapBounds);
    }

    // Check for Leaflet map instance
    const hasLeafletMap = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             typeof window.L !== 'undefined' && 
             document.querySelector('.leaflet-container') !== null;
    });
    console.log('Leaflet map loaded:', hasLeafletMap);

    // Count visible markers
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    console.log('Initial marker count:', markerCount);

    // Get POI navigation state
    const poiInfo = await page.evaluate(() => {
      const consoleOutput = [];
      // Capture any POI-related info from the page
      const debugInfo = document.body.innerText;
      return debugInfo;
    });

    // Click "Farther" button to expand distance if no markers are visible
    if (markerCount === 0) {
      console.log('No markers visible, trying to expand distance...');
      
      // Look for the Farther button
      const fartherButton = await page.locator('button:has-text("Farther"), button:has-text("→")').first();
      const buttonExists = await fartherButton.isVisible();
      
      if (buttonExists) {
        console.log('Found Farther button, clicking to expand distance...');
        await fartherButton.click();
        await page.waitForTimeout(2000);
        
        // Take screenshot after expanding
        await page.screenshot({ path: 'map-after-farther-click.png', fullPage: true });
        
        // Recount markers
        const newMarkerCount = await page.locator('.leaflet-marker-icon').count();
        console.log('Marker count after expanding distance:', newMarkerCount);
        
        // Get marker details
        if (newMarkerCount > 0) {
          const markerDetails = await page.evaluate(() => {
            const markers = document.querySelectorAll('.leaflet-marker-icon');
            return Array.from(markers).map((marker, index) => {
              const transform = marker.style.transform || marker.parentElement?.style.transform;
              return {
                index,
                transform,
                visible: marker.offsetParent !== null,
                classList: Array.from(marker.classList)
              };
            });
          });
          console.log('Marker details:', JSON.stringify(markerDetails, null, 2));
        }
      }
    }

    // Check API responses
    const apiResponses = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Intercept the next API call
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);
          if (args[0].includes('api/poi')) {
            const clone = response.clone();
            const data = await clone.json();
            resolve({
              url: args[0],
              poiCount: data.data?.length || 0,
              firstPoi: data.data?.[0],
              debug: data.debug
            });
          }
          return response;
        };
        
        // Trigger a refresh if needed
        setTimeout(() => {
          resolve({ error: 'No API calls intercepted' });
        }, 5000);
      });
    });

    console.log('API Response info:', JSON.stringify(apiResponses, null, 2));

    // Get current location from the app
    const locationInfo = await page.evaluate(() => {
      // Try to find location info in the DOM
      const locationElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.includes('46.7296') || 
        el.textContent?.includes('User location') ||
        el.textContent?.includes('within 30mi')
      );
      
      return locationElements.map(el => ({
        tag: el.tagName,
        text: el.textContent?.substring(0, 100)
      }));
    });
    
    console.log('Location info from DOM:', JSON.stringify(locationInfo, null, 2));

    // Final marker inspection
    const finalMarkerData = await page.evaluate(() => {
      const markers = document.querySelectorAll('.leaflet-marker-icon, .leaflet-marker-pane img, [class*="marker"]');
      const markerInfo = Array.from(markers).map(marker => ({
        className: marker.className,
        visible: marker.offsetParent !== null,
        style: {
          display: marker.style.display,
          visibility: marker.style.visibility,
          opacity: marker.style.opacity,
          transform: marker.style.transform || marker.parentElement?.style.transform
        },
        parent: marker.parentElement?.className
      }));
      
      // Also check for any POI data in window
      const windowData = {
        hasLeaflet: typeof L !== 'undefined',
        mapLayers: typeof L !== 'undefined' && L.layers ? Object.keys(L.layers).length : 0
      };
      
      return { markers: markerInfo, windowData };
    });
    
    console.log('Final marker data:', JSON.stringify(finalMarkerData, null, 2));

    // Take final screenshot
    await page.screenshot({ path: 'map-final-state.png', fullPage: true });

    // Assertions
    expect(mapExists).toBe(true);
    expect(hasLeafletMap).toBe(true);
  });
});