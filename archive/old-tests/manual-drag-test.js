#!/usr/bin/env node

import { chromium } from 'playwright';

async function manualDragTest() {
  console.log('🔍 MANUAL DRAG TEST - STEP BY STEP');
  console.log('==================================');
  console.log('This test will help you verify drag manually');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  // Monitor all console messages for drag events
  page.on('console', (msg) => {
    console.log(`📋 ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    console.log('🌐 Loading localhost...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for map and location to load
    await page.waitForTimeout(8000);
    
    console.log('📍 Getting initial state...');
    const initial = await page.evaluate(() => {
      return {
        userLocation: localStorage.getItem('userLocation'),
        locationMethod: localStorage.getItem('locationMethod')
      };
    });
    console.log('Initial state:', initial);
    
    console.log('\n🎯 MANUAL TEST INSTRUCTIONS:');
    console.log('===========================');
    console.log('1. Look for the "cool guy" emoji marker (😎) on the map');
    console.log('2. Try to drag it to a new location');
    console.log('3. Watch the console for any drag-related messages');
    console.log('4. Press SPACE when you have finished trying to drag');
    console.log('\nThe browser will stay open for 60 seconds...\n');
    
    // Highlight the user marker for easier identification
    await page.evaluate(() => {
      const userMarkerEl = document.querySelector('.leaflet-marker-draggable');
      if (userMarkerEl) {
        // Add a pulsing red border to make it obvious
        userMarkerEl.style.border = '3px solid red';
        userMarkerEl.style.animation = 'pulse 1s infinite';
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `;
        document.head.appendChild(style);
        
        console.log('🎯 User marker highlighted with red pulsing border');
      } else {
        console.log('❌ Could not find user marker to highlight');
      }
    });
    
    // Wait for user interaction or timeout
    let userFinished = false;
    
    page.on('keydown', async (key) => {
      if (key === 'Space') {
        userFinished = true;
        console.log('🎯 User pressed SPACE - ending manual test');
      }
    });
    
    // Wait up to 60 seconds for user testing
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1000);
      if (userFinished) break;
      
      if (i % 10 === 9) {
        console.log(`⏱️ ${60 - i - 1} seconds remaining (press SPACE to continue)`);
      }
    }
    
    console.log('\n📍 Checking final state...');
    const final = await page.evaluate(() => {
      return {
        userLocation: localStorage.getItem('userLocation'),
        locationMethod: localStorage.getItem('locationMethod')
      };
    });
    
    console.log('\n🔍 MANUAL TEST RESULTS:');
    console.log('=======================');
    console.log('Initial:', initial);
    console.log('Final:', final);
    
    const changed = final.userLocation !== initial.userLocation || 
                   final.locationMethod !== initial.locationMethod;
    
    if (changed) {
      console.log('✅ SUCCESS: Manual drag worked! localStorage was updated');
      
      if (initial.userLocation && final.userLocation) {
        const initialPos = JSON.parse(initial.userLocation);
        const finalPos = JSON.parse(final.userLocation);
        console.log(`📍 Position changed from [${initialPos[0].toFixed(4)}, ${initialPos[1].toFixed(4)}] to [${finalPos[0].toFixed(4)}, ${finalPos[1].toFixed(4)}]`);
      }
    } else {
      console.log('❌ FAILURE: Manual drag did not work - no localStorage changes detected');
      
      console.log('\n🔍 Let me check if there are React re-rendering issues...');
      
      // Check if the marker gets recreated frequently
      const rerenderCheck = await page.evaluate(() => {
        const userMarkerEl = document.querySelector('.leaflet-marker-draggable');
        if (!userMarkerEl) {
          return { error: 'No user marker found' };
        }
        
        // Add a marker to the DOM element
        userMarkerEl.dataset.testMarker = 'original';
        
        return { marked: true };
      });
      
      console.log('Marker tagged for re-render detection...');
      await page.waitForTimeout(5000);
      
      const stillSameElement = await page.evaluate(() => {
        const userMarkerEl = document.querySelector('.leaflet-marker-draggable');
        return {
          found: !!userMarkerEl,
          sameElement: userMarkerEl && userMarkerEl.dataset.testMarker === 'original'
        };
      });
      
      if (!stillSameElement.sameElement) {
        console.log('❌ PROBLEM: User marker element was recreated (React re-rendering issue)');
        console.log('This would destroy drag event handlers and prevent dragging');
      } else {
        console.log('✅ Marker element remained stable (no re-rendering issue)');
      }
    }
    
    console.log('\n🎯 Manual test complete. You can close the browser.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Don't close browser - let user close it manually
  console.log('\n🎯 MANUAL DRAG TEST COMPLETE');
  console.log('Browser left open for you to examine');
}

manualDragTest().catch(console.error);