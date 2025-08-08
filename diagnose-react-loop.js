#!/usr/bin/env node

/**
 * REACT INFINITE LOOP DIAGNOSTIC
 * 
 * PURPOSE: Identify the specific useEffect causing infinite loops
 * - Monitor console errors in real-time
 * - Track timing patterns to identify loop source
 * - Capture component stack traces if possible
 */

import { chromium } from 'playwright';

async function diagnoseReactLoop() {
  console.log('🔍 REACT INFINITE LOOP DIAGNOSTIC');
  console.log('=' + '='.repeat(40));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let errorCount = 0;
  const errorTimestamps = [];
  let firstError = null;
  
  page.on('console', (msg) => {
    const timestamp = new Date();
    
    if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
      errorCount++;
      errorTimestamps.push(timestamp);
      
      if (!firstError) {
        firstError = timestamp;
      }
      
      console.log(`❌ Error #${errorCount} at ${timestamp.toISOString().split('T')[1]}`);
      
      // Check error frequency
      if (errorTimestamps.length >= 5) {
        const last5 = errorTimestamps.slice(-5);
        const timeSpan = last5[4].getTime() - last5[0].getTime();
        const frequency = 5000 / timeSpan; // errors per second
        console.log(`   Error frequency: ${frequency.toFixed(1)} errors/second`);
      }
      
      // Stop after analyzing pattern
      if (errorCount >= 10) {
        console.log('\n📊 PATTERN ANALYSIS:');
        console.log(`   Total errors in ${(timestamp.getTime() - firstError.getTime())/1000}s: ${errorCount}`);
        
        // Calculate intervals
        const intervals = [];
        for (let i = 1; i < errorTimestamps.length; i++) {
          intervals.push(errorTimestamps[i].getTime() - errorTimestamps[i-1].getTime());
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        console.log(`   Average interval between errors: ${avgInterval.toFixed(0)}ms`);
        
        if (avgInterval < 100) {
          console.log('   🚨 HIGH FREQUENCY LOOP - React render cycle issue');
        } else if (avgInterval < 1000) {
          console.log('   ⚠️  MEDIUM FREQUENCY LOOP - useEffect dependency issue');
        } else {
          console.log('   ℹ️  LOW FREQUENCY LOOP - Timer or async operation issue');
        }
        
        browser.close();
        return;
      }
    }
  });

  try {
    console.log('🌐 Loading localhost to monitor loop pattern...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    // Wait and monitor
    console.log('⏱️ Monitoring for 10 seconds...');
    await page.waitForTimeout(10000);
    
    if (errorCount === 0) {
      console.log('✅ No infinite loop errors detected in monitoring period');
    }
    
  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message);
  } finally {
    await browser.close();
  }
}

diagnoseReactLoop();