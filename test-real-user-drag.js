#!/usr/bin/env node

import { chromium } from 'playwright';

async function testRealUserDrag() {
  console.log('🔍 TESTING REAL USER DRAG WITH DOM EVENTS');
  console.log('========================================');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Monitor console messages
  page.on('console', (msg) => {
    if (msg.text().includes('🎯') || msg.text().includes('📍') || msg.text().includes('drag') || msg.text().includes('User location changed')) {
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
      return localStorage.getItem('userLocation');
    });
    console.log('Initial userLocation:', initial);
    
    console.log('📍 Finding user location marker...');
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    
    const markers = await page.$$('.leaflet-marker-icon');
    console.log(`Found ${markers.length} markers`);
    
    // Find user marker by popup content
    let userMarker = null;
    for (let i = 0; i < Math.min(markers.length, 3); i++) {
      await markers[i].click();
      await page.waitForTimeout(500);
      
      const popup = await page.$('.leaflet-popup-content');
      if (popup) {
        const content = await popup.textContent();
        if (content && content.includes('best guess')) {
          console.log(`✅ Found user location marker at index ${i}`);
          userMarker = markers[i];
          await page.keyboard.press('Escape'); // Close popup
          break;
        }
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    
    if (!userMarker) {
      console.log('❌ Could not find user location marker');
      return;
    }
    
    console.log('🎯 Testing REAL DOM drag events...');
    
    // Get marker position
    const markerBox = await userMarker.boundingBox();
    const startX = markerBox.x + markerBox.width / 2;
    const startY = markerBox.y + markerBox.height / 2;
    
    // Target position (move 150px down and right for visibility)
    const targetX = startX + 150;
    const targetY = startY + 150;
    
    console.log(`📍 Dragging from [${startX}, ${startY}] to [${targetX}, ${targetY}]`);
    
    // Use dispatchEvent to create proper DOM drag events
    const dragResult = await page.evaluate(({startX, startY, targetX, targetY}) => {
      const marker = document.elementFromPoint(startX, startY);
      if (!marker) {
        return { error: 'No element found at start position' };
      }
      
      console.log('🎯 Found DOM element:', marker.tagName, marker.className);
      
      // Create proper mousedown event
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: startX,
        clientY: startY,
        button: 0,
        buttons: 1
      });
      
      // Create mousemove events 
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: targetX,
        clientY: targetY,
        button: 0,
        buttons: 1
      });
      
      // Create mouseup event
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: targetX,
        clientY: targetY,
        button: 0,
        buttons: 0
      });
      
      console.log('🎯 Dispatching mousedown event...');
      marker.dispatchEvent(mouseDownEvent);
      
      console.log('🎯 Dispatching mousemove events...');
      // Dispatch several mousemove events to simulate drag
      for (let i = 1; i <= 5; i++) {
        const intermediateX = startX + ((targetX - startX) * i / 5);
        const intermediateY = startY + ((targetY - startY) * i / 5);
        
        const moveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: intermediateX,
          clientY: intermediateY,
          button: 0,
          buttons: 1
        });
        
        marker.dispatchEvent(moveEvent);
        // Also dispatch on document for global drag detection
        document.dispatchEvent(moveEvent);
      }
      
      console.log('🎯 Dispatching mouseup event...');
      marker.dispatchEvent(mouseUpEvent);
      document.dispatchEvent(mouseUpEvent);
      
      return { success: true };
    }, {startX, startY, targetX, targetY});
    
    console.log('DOM drag result:', dragResult);
    
    // Wait for any drag processing
    await page.waitForTimeout(3000);
    
    console.log('📍 Checking if localStorage was updated...');
    const updated = await page.evaluate(() => {
      return localStorage.getItem('userLocation');
    });
    
    console.log('🔍 RESULTS:');
    console.log('Initial:', initial);
    console.log('Updated:', updated);
    
    if (updated && updated !== initial) {
      console.log('✅ SUCCESS: Real DOM drag events triggered localStorage update!');
    } else {
      console.log('❌ FAILURE: Real DOM drag events did not trigger update');
      
      console.log('🔍 Let me also try HTML5 drag and drop API...');
      
      // Try HTML5 drag and drop API as alternative
      const dragDropResult = await page.evaluate(() => {
        // Find user marker element
        const markers = document.querySelectorAll('.leaflet-marker-icon');
        let userMarkerEl = null;
        
        // Try to identify user marker by looking for the one with draggable parent
        for (const marker of markers) {
          if (marker.parentElement && marker.parentElement.classList.contains('leaflet-marker-draggable')) {
            userMarkerEl = marker;
            console.log('🎯 Found draggable marker element');
            break;
          }
        }
        
        if (!userMarkerEl) {
          return { error: 'No draggable marker element found' };
        }
        
        // Try HTML5 drag events
        const dragStartEvent = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        });
        
        const dragEndEvent = new DragEvent('dragend', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        });
        
        console.log('🎯 Dispatching HTML5 drag events...');
        userMarkerEl.dispatchEvent(dragStartEvent);
        userMarkerEl.dispatchEvent(dragEndEvent);
        
        return { success: true };
      });
      
      console.log('HTML5 drag result:', dragDropResult);
      
      await page.waitForTimeout(2000);
      
      const finalCheck = await page.evaluate(() => {
        return localStorage.getItem('userLocation');
      });
      
      if (finalCheck && finalCheck !== initial) {
        console.log('✅ SUCCESS: HTML5 drag events worked!');
      } else {
        console.log('❌ FAILURE: Neither DOM events nor HTML5 drag worked');
        console.log('This matches your manual testing - the drag events are not properly connected');
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'real-user-drag-test.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🎯 REAL USER DRAG TEST COMPLETE');
}

testRealUserDrag().catch(console.error);