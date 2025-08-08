#!/usr/bin/env node

import { chromium } from 'playwright';

async function testNativeLeafletDrag() {
  console.log('🔍 TESTING NATIVE LEAFLET DRAG SIMULATION');
  console.log('========================================');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  // Monitor console messages
  page.on('console', (msg) => {
    if (msg.text().includes('🎯') || msg.text().includes('📍') || msg.text().includes('location changed')) {
      console.log(`📋 ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🌐 Loading localhost...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for map and location to load
    await page.waitForTimeout(8000);
    
    console.log('📍 Getting initial localStorage...');
    const initial = await page.evaluate(() => {
      return {
        userLocation: localStorage.getItem('userLocation'),
        locationMethod: localStorage.getItem('locationMethod')
      };
    });
    console.log('Initial state:', initial);
    
    console.log('🎯 Simulating drag using Leaflet API directly...');
    
    // Use JavaScript to simulate the drag operation directly through Leaflet
    const dragResult = await page.evaluate(() => {
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
          console.log('🎯 Found user marker via isUserMarker flag');
        }
      });
      
      if (!userMarker) {
        return { error: 'No user marker found' };
      }
      
      console.log('📍 User marker found:', {
        position: userMarker.getLatLng(),
        draggable: userMarker.options.draggable,
        isUserMarker: userMarker.options.isUserMarker
      });
      
      // Get current position
      const currentPos = userMarker.getLatLng();
      
      // Define new position (move ~1 mile north and east)
      const newLat = currentPos.lat + 0.01; // ~1 mile north
      const newLng = currentPos.lng + 0.01; // ~1 mile east
      
      console.log('📍 Moving marker from:', [currentPos.lat, currentPos.lng]);
      console.log('📍 Moving marker to:', [newLat, newLng]);
      
      // Directly set the new position (this should trigger dragend if properly configured)
      userMarker.setLatLng([newLat, newLng]);
      
      // Manually fire the dragend event to test the event handler
      console.log('🎯 Manually firing dragend event...');
      userMarker.fire('dragend', {
        target: userMarker,
        type: 'dragend'
      });
      
      return {
        success: true,
        oldPosition: [currentPos.lat, currentPos.lng],
        newPosition: [newLat, newLng]
      };
    });
    
    console.log('Drag simulation result:', dragResult);
    
    // Wait for any async updates
    await page.waitForTimeout(3000);
    
    console.log('📍 Checking updated localStorage...');
    const updated = await page.evaluate(() => {
      return {
        userLocation: localStorage.getItem('userLocation'),
        locationMethod: localStorage.getItem('locationMethod')
      };
    });
    
    console.log('🔍 RESULTS:');
    console.log('Initial:', initial);
    console.log('Updated:', updated);
    
    if (updated.userLocation && updated.userLocation !== initial.userLocation) {
      console.log('✅ SUCCESS: localStorage was updated after programmatic drag!');
      
      const parsedLocation = JSON.parse(updated.userLocation);
      console.log('📍 New location coordinates:', parsedLocation);
      
    } else {
      console.log('❌ FAILURE: localStorage was not updated');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'native-leaflet-drag-test.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🎯 NATIVE LEAFLET DRAG TEST COMPLETE');
}

testNativeLeafletDrag().catch(console.error);