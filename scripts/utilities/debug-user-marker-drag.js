#!/usr/bin/env node

import { chromium } from 'playwright';

async function debugUserMarkerDrag() {
  console.log('🔍 DEBUGGING USER MARKER DRAG FUNCTIONALITY');
  console.log('==========================================');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  // Monitor ALL console messages
  page.on('console', (msg) => {
    console.log(`📋 ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Monitor page errors
  page.on('pageerror', (error) => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('🌐 Loading localhost...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for map and location to load
    await page.waitForTimeout(8000);
    
    console.log('📍 Getting initial location from localStorage...');
    const initialLocation = await page.evaluate(() => {
      return localStorage.getItem('userLocation');
    });
    console.log('Initial localStorage userLocation:', initialLocation);
    
    console.log('📍 Looking for markers...');
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    
    const markers = await page.$$('.leaflet-marker-icon');
    console.log(`Found ${markers.length} markers`);
    
    if (markers.length === 0) {
      console.log('❌ No markers found!');
      return;
    }
    
    // Try to identify the user location marker by clicking each one and checking popup
    let userMarker = null;
    let userMarkerIndex = -1;
    
    for (let i = 0; i < Math.min(markers.length, 5); i++) {  // Check first 5 markers
      console.log(`📍 Testing marker ${i}...`);
      
      try {
        await markers[i].click();
        await page.waitForTimeout(1000);
        
        const popup = await page.$('.leaflet-popup-content');
        if (popup) {
          const content = await popup.textContent();
          console.log(`  Popup content: "${content}"`);
          
          if (content && content.includes('best guess')) {
            console.log(`✅ Found user location marker at index ${i}!`);
            userMarker = markers[i];
            userMarkerIndex = i;
            
            // Close popup
            await page.keyboard.press('Escape');
            break;
          }
        }
        
        // Close any popup
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
      } catch (e) {
        console.log(`  Error testing marker ${i}: ${e.message}`);
      }
    }
    
    if (!userMarker) {
      console.log('❌ Could not find user location marker by popup content');
      userMarker = markers[0];  // Fallback to first marker
      userMarkerIndex = 0;
      console.log('📍 Using first marker as fallback');
    }
    
    console.log(`📍 About to drag marker ${userMarkerIndex}...`);
    
    // Get marker position
    const markerBox = await userMarker.boundingBox();
    console.log('Marker position:', markerBox);
    
    const startX = markerBox.x + markerBox.width/2;
    const startY = markerBox.y + markerBox.height/2;
    
    // Define target position (move 200px right and down)
    const targetX = startX + 200;
    const targetY = startY + 200;
    
    console.log(`📍 Dragging from [${startX}, ${startY}] to [${targetX}, ${targetY}]`);
    
    // Add extra console monitoring specifically for location changes
    await page.evaluate(() => {
      console.log('🔍 Setting up drag event monitoring...');
    });
    
    // Perform drag operation
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(1000);
    console.log('📍 Mouse positioned at marker');
    
    await page.mouse.down();
    await page.waitForTimeout(1000);
    console.log('📍 Mouse down');
    
    await page.mouse.move(targetX, targetY);
    await page.waitForTimeout(1000);
    console.log('📍 Mouse moved to target');
    
    await page.mouse.up();
    await page.waitForTimeout(2000);
    console.log('📍 Mouse up - drag complete');
    
    // Check if localStorage was updated
    const updatedLocation = await page.evaluate(() => {
      return localStorage.getItem('userLocation');
    });
    
    console.log('🔍 RESULTS:');
    console.log('Initial location:', initialLocation);
    console.log('Updated location:', updatedLocation);
    
    if (updatedLocation && updatedLocation !== initialLocation) {
      console.log('✅ SUCCESS: localStorage was updated!');
    } else {
      console.log('❌ FAILURE: localStorage was not updated');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'debug-user-marker-drag.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: debug-user-marker-drag.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🎯 DEBUG COMPLETE');
}

debugUserMarkerDrag().catch(console.error);