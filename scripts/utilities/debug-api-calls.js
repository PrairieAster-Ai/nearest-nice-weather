#!/usr/bin/env node

/**
 * DEBUG API CALLS - Monitor frontend API requests
 *
 * PURPOSE: Monitor what API calls the frontend is actually making
 * - Intercept network requests
 * - Check if POI endpoints are being called
 * - Verify response data is being received
 * - Correlate with infinite loop timing
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3001';

async function debugApiCalls() {
  console.log('🔍 DEBUGGING FRONTEND API CALLS');
  console.log('=' + '='.repeat(40));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const page = await browser.newPage();

  const apiCalls = [];
  const consoleErrors = [];

  // Monitor all network requests
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/')) {
      console.log(`📤 API REQUEST: ${request.method()} ${url}`);
      apiCalls.push({
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: url,
        type: 'request'
      });
    }
  });

  // Monitor all network responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      console.log(`📥 API RESPONSE: ${status} ${url}`);

      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const responseText = await response.text();
          const responseData = responseText.length > 200 ?
            responseText.substring(0, 200) + '...' :
            responseText;

          console.log(`   Response: ${responseData}`);

          apiCalls.push({
            timestamp: new Date().toISOString(),
            method: response.request().method(),
            url: url,
            status: status,
            response: responseText.substring(0, 500),
            type: 'response'
          });
        }
      } catch (error) {
        console.log(`   Error reading response: ${error.message}`);
      }
    }
  });

  // Monitor console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const errorText = msg.text();
      console.log(`❌ CONSOLE ERROR: ${errorText}`);
      consoleErrors.push({
        timestamp: new Date().toISOString(),
        text: errorText
      });
    } else if (msg.type() === 'log' && msg.text().includes('POI')) {
      console.log(`📋 POI LOG: ${msg.text()}`);
    }
  });

  try {
    console.log('🌐 Loading localhost frontend...');
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for initial load and API calls
    console.log('⏱️ Monitoring API calls for 10 seconds...');
    await page.waitForTimeout(10000);

    // Check if any markers appeared
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    console.log(`\n📍 MARKER CHECK: ${markerCount} markers found on map`);

    // Summary
    console.log('\n📊 API CALL SUMMARY:');
    console.log('=' + '='.repeat(30));

    const requests = apiCalls.filter(call => call.type === 'request');
    const responses = apiCalls.filter(call => call.type === 'response');
    const successfulResponses = responses.filter(resp => resp.status >= 200 && resp.status < 300);
    const failedResponses = responses.filter(resp => resp.status >= 400);

    console.log(`Total API requests: ${requests.length}`);
    console.log(`Total API responses: ${responses.length}`);
    console.log(`Successful responses: ${successfulResponses.length}`);
    console.log(`Failed responses: ${failedResponses.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);

    if (requests.length === 0) {
      console.log('\n🚨 NO API CALLS DETECTED!');
      console.log('   This suggests the POI hook is not running or being blocked');
      console.log('   Possible causes:');
      console.log('   - Infinite loops preventing hook execution');
      console.log('   - Component not mounting properly');
      console.log('   - useEffect dependencies preventing API calls');
    }

    if (failedResponses.length > 0) {
      console.log('\n❌ FAILED API CALLS:');
      failedResponses.forEach((resp, index) => {
        console.log(`${index + 1}. ${resp.method} ${resp.url} (${resp.status})`);
      });
    }

    if (successfulResponses.length > 0 && markerCount === 0) {
      console.log('\n⚠️  API CALLS SUCCESSFUL BUT NO MARKERS RENDERED!');
      console.log('   This suggests a rendering issue, not an API issue');
      console.log('   Possible causes:');
      console.log('   - Data processing issues in hooks');
      console.log('   - Map marker creation failing');
      console.log('   - Infinite loops interfering with rendering');
    }

    return {
      apiCalls,
      consoleErrors,
      markerCount,
      summary: {
        totalRequests: requests.length,
        successfulResponses: successfulResponses.length,
        failedResponses: failedResponses.length,
        errorsPerSecond: consoleErrors.length / 10
      }
    };

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run debugging
debugApiCalls()
  .then((results) => {
    console.log('\n🎯 DEBUGGING COMPLETE');
    console.log('=' + '='.repeat(40));

    if (results.summary.totalRequests > 0 && results.markerCount === 0) {
      console.log('🔧 NEXT STEPS: Check marker rendering logic');
    } else if (results.summary.totalRequests === 0) {
      console.log('🔧 NEXT STEPS: Fix infinite loops blocking API calls');
    } else {
      console.log('✅ API and rendering appear to be working');
    }
  })
  .catch((error) => {
    console.error('💥 API debugging failed:', error.message);
    process.exit(1);
  });
