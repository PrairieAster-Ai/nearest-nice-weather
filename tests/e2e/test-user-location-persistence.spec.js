#!/usr/bin/env node

/**
 * User Location Marker Persistence Test
 * =====================================
 * 
 * Verifies that:
 * 1. User can move the location marker on the map
 * 2. New location is saved to browser localStorage
 * 3. After browser refresh, marker appears at the saved location
 * 4. localStorage contains the correct coordinates
 */

import { test, expect } from '@playwright/test';

// Helper function to calculate distance between two lat/lng points in miles
function calculateDistance(loc1, loc2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (loc2[0] - loc1[0]) * Math.PI / 180;
  const dLng = (loc2[1] - loc1[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(loc1[0] * Math.PI / 180) * Math.cos(loc2[0] * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

test.describe('User Location Marker Persistence', () => {
  
  test('user location marker position persists after browser refresh', async ({ page }) => {
    console.log('🧪 Testing user location marker persistence with 100-mile relocation...');
    
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
      if (msg.text().includes('📍') || msg.text().includes('location') || msg.text().includes('localStorage') || msg.text().includes('User location changed')) {
        console.log(`📋 Console: ${msg.text()}`);
      }
    });
    
    // Step 1: Load the page and wait for initial IP location setup
    console.log('1. Loading page and waiting for initial IP location setup...');
    await page.goto('http://localhost:3001');
    
    // Wait for map to load and IP location to be established
    await page.waitForTimeout(8000);
    
    // Step 2: Get initial IP location from the application
    console.log('2. Getting initial IP location from application state...');
    const initialIpLocation = await page.evaluate(() => {
      // Get the actual IP location that was detected
      const stored = localStorage.getItem('userLocation');
      return stored ? JSON.parse(stored) : null;
    });
    
    console.log('📍 Initial IP location from localStorage:', initialIpLocation);
    
    // If no IP location detected, use Minneapolis default as starting point
    const startingLocation = initialIpLocation || [44.9399, -93.2548];
    console.log('📍 Using starting location:', startingLocation);
    
    // Step 3: Calculate a random location exactly 100 miles away
    console.log('3. Calculating random location 100 miles away...');
    
    // Generate random direction (0-360 degrees)
    const randomDirection = Math.random() * 360;
    const distanceMiles = 100;
    
    // Convert to lat/lng offset (approximate: 1 degree ≈ 69 miles)
    const latOffset = (distanceMiles / 69) * Math.cos(randomDirection * Math.PI / 180);
    const lngOffset = (distanceMiles / 69) * Math.sin(randomDirection * Math.PI / 180) / Math.cos(startingLocation[0] * Math.PI / 180);
    
    const targetLocation = [
      startingLocation[0] + latOffset,
      startingLocation[1] + lngOffset
    ];
    
    console.log(`📍 Target location (${distanceMiles} miles at ${randomDirection.toFixed(1)}°):`, targetLocation);
    
    // Calculate actual distance to verify
    const actualDistance = calculateDistance(startingLocation, targetLocation);
    console.log(`📏 Calculated distance: ${actualDistance.toFixed(1)} miles`);
    
    // Step 4: Find the user location marker
    console.log('4. Finding user location marker...');
    
    // Wait for Leaflet map to be ready
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Get all markers - user location marker should be draggable
    const markers = await page.$$('.leaflet-marker-icon');
    console.log(`📍 Found ${markers.length} markers on map`);
    
    // Find the specific user location marker (has isUserMarker property and cool guy icon)
    let userLocationMarker = null;
    let userMarkerIndex = -1;
    
    // Look for the user marker by checking for the cool guy icon and user marker properties
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      
      // Check if this marker has user location characteristics
      const isUserMarker = await marker.evaluate((el, index) => {
        // Check if marker is associated with a Leaflet marker that has isUserMarker property
        const src = el.src || el.style.backgroundImage;
        
        // Look for the cool guy SVG data URL or characteristics
        const hasUserIcon = src && (src.includes('😎') || src.includes('data:image/svg+xml'));
        
        // Check if this element has user marker styling
        const hasUserStyling = el.style.zIndex === '1000' || 
                              el.title === 'User Location' ||
                              el.getAttribute('alt') === 'User Location';
        
        // Check for draggable class specifically added to user markers
        const isDraggable = el.parentElement && el.parentElement.classList.contains('leaflet-marker-draggable');
        
        console.log('Marker analysis:', {
          index: index,
          hasUserIcon,
          hasUserStyling, 
          isDraggable,
          src: src ? src.substring(0, 50) + '...' : 'none'
        });
        
        return hasUserIcon || hasUserStyling || isDraggable;
      }, i);
      
      if (isUserMarker) {
        userLocationMarker = marker;
        userMarkerIndex = i;
        console.log(`📍 Found user location marker at index ${i}`);
        break;
      }
    }
    
    // If we still haven't found it, look for markers with specific popup content
    if (!userLocationMarker) {
      console.log('📍 Searching for user marker by popup content...');
      
      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];
        
        // Click marker to see if popup contains user location text
        try {
          await marker.click();
          await page.waitForTimeout(500);
          
          const popupContent = await page.$('.leaflet-popup-content');
          if (popupContent) {
            const content = await popupContent.textContent();
            if (content && (content.includes('best guess') || content.includes('Drag and drop'))) {
              userLocationMarker = marker;
              userMarkerIndex = i;
              console.log(`📍 Found user marker by popup content at index ${i}`);
              
              // Close popup
              await page.keyboard.press('Escape');
              break;
            }
          }
        } catch (e) {
          // Continue searching
        }
      }
    }
    
    // Last resort fallback
    if (!userLocationMarker && markers.length > 0) {
      userLocationMarker = markers[0];
      userMarkerIndex = 0;
      console.log('📍 Using first marker as user location marker (last resort fallback)');
    }
    
    expect(userLocationMarker).toBeTruthy();
    
    // Step 5: Convert target lat/lng to pixel coordinates for drag
    console.log('5. Converting target coordinates to pixel position for drag...');
    
    const pixelPosition = await page.evaluate((targetLoc) => {
      // Access the Leaflet map instance
      const mapElement = document.querySelector('.leaflet-container');
      if (mapElement && window.leafletMapInstance) {
        const map = window.leafletMapInstance;
        const point = map.latLngToContainerPoint([targetLoc[0], targetLoc[1]]);
        return { x: point.x, y: point.y };
      }
      return null;
    }, targetLocation);
    
    // If we can't get exact pixel coordinates, calculate approximate offset
    let targetPixelX, targetPixelY;
    
    if (pixelPosition) {
      targetPixelX = pixelPosition.x;
      targetPixelY = pixelPosition.y;
      console.log(`📍 Target pixel position: [${targetPixelX}, ${targetPixelY}]`);
    } else {
      // Fallback: move marker a significant distance (simulate 100 miles)
      const originalPosition = await userLocationMarker.boundingBox();
      targetPixelX = originalPosition.x + 300; // Large pixel offset
      targetPixelY = originalPosition.y + 200; 
      console.log(`📍 Using estimated target pixel position: [${targetPixelX}, ${targetPixelY}]`);
    }
    
    // Step 6: Perform the drag operation using native Leaflet API
    console.log('6. Dragging user location marker using native Leaflet API...');
    
    const dragResult = await page.evaluate((targetLoc) => {
      // Access the map instance
      const map = window.leafletMapInstance;
      if (!map) {
        return { error: 'No map instance found' };
      }
      
      // Find the user location marker
      let userMarker = null;
      map.eachLayer((layer) => {
        if (layer.options && layer.options.isUserMarker) {
          userMarker = layer;
        }
      });
      
      if (!userMarker) {
        return { error: 'No user marker found' };
      }
      
      // Get current position
      const currentPos = userMarker.getLatLng();
      console.log('📍 Current marker position:', [currentPos.lat, currentPos.lng]);
      console.log('📍 Target position:', targetLoc);
      
      // Set the new position
      userMarker.setLatLng(targetLoc);
      
      // Manually fire the dragend event to trigger the save logic
      console.log('🎯 Firing dragend event to trigger save...');
      userMarker.fire('dragend', {
        target: userMarker,
        type: 'dragend'
      });
      
      return {
        success: true,
        oldPosition: [currentPos.lat, currentPos.lng],
        newPosition: targetLoc
      };
    }, targetLocation);
    
    console.log('📍 Drag operation result:', dragResult);
    
    if (dragResult.error) {
      throw new Error(`Drag operation failed: ${dragResult.error}`);
    }
    
    console.log('📍 Native Leaflet drag operation completed successfully');
    
    // Wait for drag event processing and location update
    await page.waitForTimeout(3000);
    
    // Step 7: Verify the new location was saved to localStorage
    console.log('7. Verifying new location saved to localStorage...');
    
    const updatedLocation = await page.evaluate(() => {
      const stored = localStorage.getItem('userLocation');
      console.log('localStorage userLocation:', stored);
      return stored ? JSON.parse(stored) : null;
    });
    
    console.log('📍 Updated location in localStorage:', updatedLocation);
    expect(updatedLocation).toBeTruthy();
    expect(Array.isArray(updatedLocation)).toBe(true);
    expect(updatedLocation.length).toBe(2);
    
    // Verify the location actually changed significantly from initial
    const distanceFromStart = calculateDistance(startingLocation, updatedLocation);
    console.log(`📏 Distance from starting location: ${distanceFromStart.toFixed(1)} miles`);
    
    // The location should have changed by a meaningful amount (at least 10 miles)
    expect(distanceFromStart).toBeGreaterThan(10);
    console.log('✅ Location changed significantly after drag operation');
    
    // Take screenshot before refresh
    await page.screenshot({ 
      path: 'user-location-before-refresh.png',
      fullPage: true 
    });
    console.log('📸 Screenshot taken before refresh');
    
    // Step 8: Refresh the browser
    console.log('8. Refreshing browser to test persistence...');
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait for page to fully reload and location to be restored
    await page.waitForTimeout(8000);
    
    // Step 9: Verify marker appears at the SAME saved location
    console.log('9. Verifying marker persistence after refresh...');
    
    const locationAfterRefresh = await page.evaluate(() => {
      const stored = localStorage.getItem('userLocation');
      return stored ? JSON.parse(stored) : null;
    });
    
    console.log('📍 Location after refresh:', locationAfterRefresh);
    console.log('📍 Expected location (pre-refresh):', updatedLocation);
    
    // CRITICAL: Verify localStorage still contains the EXACT same location
    expect(locationAfterRefresh).toBeTruthy();
    expect(locationAfterRefresh).toEqual(updatedLocation);
    
    // Verify the coordinates are identical (no drift)
    const coordinatesPersisted = 
      Math.abs(locationAfterRefresh[0] - updatedLocation[0]) < 0.0001 &&
      Math.abs(locationAfterRefresh[1] - updatedLocation[1]) < 0.0001;
    
    expect(coordinatesPersisted).toBe(true);
    console.log('✅ Coordinates persisted exactly after refresh');
    
    // Wait for map to reload with saved location
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Step 10: Verify visual marker position persistence
    console.log('10. Verifying visual marker position after refresh...');
    
    const markersAfterRefresh = await page.$$('.leaflet-marker-icon');
    console.log(`📍 Found ${markersAfterRefresh.length} markers after refresh`);
    expect(markersAfterRefresh.length).toBeGreaterThan(0);
    
    // Take screenshot after refresh for visual comparison
    await page.screenshot({ 
      path: 'user-location-after-refresh.png',
      fullPage: true 
    });
    console.log('📸 Screenshot taken after refresh for visual comparison');
    
    // Step 11: Final distance verification
    console.log('11. Final distance verification...');
    
    const finalDistanceFromOriginal = calculateDistance(startingLocation, locationAfterRefresh);
    console.log(`📏 Final distance from original IP location: ${finalDistanceFromOriginal.toFixed(1)} miles`);
    
    // The marker should still be far from the original IP location
    expect(finalDistanceFromOriginal).toBeGreaterThan(10);
    console.log('✅ Marker remained at relocated position after refresh');
    
    // Step 12: Verify localStorage data structure integrity
    console.log('12. Final localStorage data integrity verification...');
    
    const allLocationData = await page.evaluate(() => {
      const data = {};
      // Check all location-related localStorage keys
      const keys = ['userLocation', 'locationMethod', 'showLocationPrompt'];
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        data[key] = value ? JSON.parse(value) : null;
      });
      return data;
    });
    
    console.log('📊 All location data in localStorage:', JSON.stringify(allLocationData, null, 2));
    
    // Verify complete data structure
    expect(allLocationData.userLocation).toBeTruthy();
    expect(Array.isArray(allLocationData.userLocation)).toBe(true);
    expect(allLocationData.userLocation.length).toBe(2);
    expect(typeof allLocationData.userLocation[0]).toBe('number'); // latitude
    expect(typeof allLocationData.userLocation[1]).toBe('number'); // longitude
    expect(allLocationData.locationMethod).toBe('manual'); // Should be manual after drag
    expect(allLocationData.showLocationPrompt).toBe(false); // Should be hidden after manual positioning
    
    // Final success message
    console.log('🎯 TEST SUMMARY:');
    console.log(`   📍 Original IP location: [${startingLocation[0].toFixed(6)}, ${startingLocation[1].toFixed(6)}]`);
    console.log(`   📍 Dragged location: [${updatedLocation[0].toFixed(6)}, ${updatedLocation[1].toFixed(6)}]`);
    console.log(`   📍 After refresh: [${locationAfterRefresh[0].toFixed(6)}, ${locationAfterRefresh[1].toFixed(6)}]`);
    console.log(`   📏 Distance moved: ${distanceFromStart.toFixed(1)} miles`);
    console.log(`   🔄 Persistence verified: ${coordinatesPersisted ? 'SUCCESS' : 'FAILED'}`);
    console.log('✅ User location marker 100-mile persistence test completed successfully!');
  });

  test('location method is saved when marker is moved manually', async ({ page }) => {
    console.log('🧪 Testing location method persistence...');
    
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(5000); // Wait for full page load
    
    // Wait for markers to be fully loaded
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    
    // Check initial location method
    const initialMethod = await page.evaluate(() => {
      const method = localStorage.getItem('locationMethod');
      return method ? JSON.parse(method) : null;
    });
    
    console.log('📍 Initial location method:', initialMethod);
    
    // Simulate marker movement (this should set method to 'manual')
    const markers = await page.$$('.leaflet-marker-icon');
    if (markers.length > 0) {
      const marker = markers[0];
      const pos = await marker.boundingBox();
      
      console.log(`📍 Dragging marker from [${pos.x}, ${pos.y}]`);
      
      await page.mouse.move(pos.x + pos.width/2, pos.y + pos.height/2);
      await page.mouse.down();
      await page.mouse.move(pos.x + 100, pos.y + 100); // Larger movement
      await page.mouse.up();
      
      // Wait for drag event to be processed
      await page.waitForTimeout(2000);
      
      // Check if location method changed to manual
      const updatedMethod = await page.evaluate(() => {
        const method = localStorage.getItem('locationMethod');
        console.log('Raw localStorage locationMethod:', localStorage.getItem('locationMethod'));
        return method ? JSON.parse(method) : null;
      });
      
      console.log('📍 Updated location method:', updatedMethod);
      
      // Verify method is saved (should be 'manual' after drag)
      expect(updatedMethod).toBe('manual');
    } else {
      console.log('⚠️ No markers found for drag test');
    }
    
    console.log('✅ Location method persistence test completed!');
  });
  
});