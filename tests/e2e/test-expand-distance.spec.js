import { test, expect } from '@playwright/test';

test.describe('POI Distance Expansion Test', () => {
  test('should show POI markers when expanding distance', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('Browser:', msg.text()));

    await page.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Initial state
    console.log('\n=== INITIAL STATE ===');
    const initialMarkers = await page.locator('.leaflet-marker-icon').count();
    console.log('Initial markers:', initialMarkers);

    // Find navigation buttons
    const navigationButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => ({
        text: btn.textContent,
        disabled: btn.disabled,
        visible: btn.offsetParent !== null
      })).filter(btn => btn.text?.includes('Closer') || btn.text?.includes('Farther'));
    });
    console.log('Navigation buttons:', navigationButtons);

    // Click Farther button to expand to 60 miles
    console.log('\n=== CLICKING FARTHER BUTTON ===');
    const fartherButton = await page.locator('button:has-text("Farther")').first();
    
    if (await fartherButton.isVisible()) {
      await fartherButton.click();
      console.log('Clicked Farther button');
      await page.waitForTimeout(2000);
      
      // Check for notifications
      const notification = await page.locator('.notification, [role="alert"]').first();
      if (await notification.isVisible()) {
        const notificationText = await notification.textContent();
        console.log('Notification:', notificationText);
      }
      
      // Count markers after expansion
      const expandedMarkers = await page.locator('.leaflet-marker-icon').count();
      console.log('Markers after expanding to 60mi:', expandedMarkers);
      
      // Get POI details from markers
      const poiMarkers = await page.evaluate(() => {
        const markers = document.querySelectorAll('.leaflet-marker-icon');
        const poiData = [];
        
        markers.forEach((marker) => {
          // Check if it's a POI marker (not the user location marker)
          const isUserMarker = marker.src?.includes('marker-icon-2x') || 
                               marker.classList.contains('leaflet-marker-draggable');
          
          if (!isUserMarker) {
            const transform = marker.style.transform || marker.parentElement?.style.transform;
            poiData.push({
              transform,
              src: marker.src,
              alt: marker.alt,
              title: marker.title
            });
          }
        });
        
        return poiData;
      });
      
      console.log('\nPOI Markers found:', poiMarkers.length);
      poiMarkers.forEach((poi, i) => {
        console.log(`POI ${i + 1}:`, poi);
      });
      
      // Try clicking a POI marker to see popup
      if (poiMarkers.length > 0) {
        console.log('\n=== CLICKING FIRST POI MARKER ===');
        await page.locator('.leaflet-marker-icon').nth(1).click(); // Skip user marker
        await page.waitForTimeout(1000);
        
        const popup = await page.locator('.leaflet-popup-content').first();
        if (await popup.isVisible()) {
          const popupText = await popup.textContent();
          console.log('Popup content:', popupText);
        }
      }
      
      // Take screenshot
      await page.screenshot({ path: 'map-expanded-60mi.png', fullPage: true });
    }

    // Try expanding again to 90 miles
    console.log('\n=== EXPANDING TO 90 MILES ===');
    const fartherButton2 = await page.locator('button:has-text("Farther")').first();
    
    if (await fartherButton2.isVisible() && !await fartherButton2.isDisabled()) {
      await fartherButton2.click();
      console.log('Clicked Farther again for 90mi');
      await page.waitForTimeout(2000);
      
      const markers90mi = await page.locator('.leaflet-marker-icon').count();
      console.log('Markers at 90mi:', markers90mi);
      
      await page.screenshot({ path: 'map-expanded-90mi.png', fullPage: true });
    }

    // Get final state info
    const finalState = await page.evaluate(() => {
      const debugElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.includes('total,') && el.textContent?.includes('visible within')
      );
      
      return debugElements.map(el => el.textContent)[0] || 'No debug info found';
    });
    
    console.log('\nFinal state:', finalState);
  });
});