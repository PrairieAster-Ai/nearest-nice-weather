import { test, expect } from '@playwright/test';

test('Verify parks are showing instead of cities', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3003/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait for the app to load and POI data to be fetched
  await page.waitForTimeout(5000);

  // Take a screenshot
  await page.screenshot({ path: 'parks-verification.png', fullPage: true });

  // Look for park names in the console or DOM
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
  });

  // Check if we can find park names in the page
  const pageText = await page.textContent('body');

  console.log('\n=== PAGE CONTENT ANALYSIS ===');
  console.log('Looking for park indicators in page...');

  // Check for park-related terms
  const parkIndicators = [
    'State Park', 'Recreation Area', 'State Forest', 'Nature Center',
    'Gooseberry', 'Itasca', 'Deep Portage', 'Foot Hills'
  ];

  const cityIndicators = [
    'Minneapolis', 'Saint Paul', 'Brainerd', 'Bemidji', 'Alexandria'
  ];

  let parksFound = 0;
  let citiesFound = 0;

  for (const indicator of parkIndicators) {
    if (pageText.includes(indicator)) {
      console.log(`✅ Found park indicator: ${indicator}`);
      parksFound++;
    }
  }

  for (const indicator of cityIndicators) {
    if (pageText.includes(indicator)) {
      console.log(`❌ Found city indicator: ${indicator}`);
      citiesFound++;
    }
  }

  console.log(`\nPark indicators found: ${parksFound}`);
  console.log(`City indicators found: ${citiesFound}`);

  if (parksFound > 0) {
    console.log('🎉 SUCCESS: Parks are now showing in the frontend!');
  } else if (citiesFound > 0) {
    console.log('❌ ISSUE: Still showing cities instead of parks');
  } else {
    console.log('⚠️  UNCLEAR: No clear indicators found - may need to check API calls');
  }

  // Check console logs for API calls
  console.log('\n=== CONSOLE LOGS ===');
  consoleMessages.forEach(msg => {
    if (msg.includes('POI') || msg.includes('park') || msg.includes('Auto-expand')) {
      console.log(msg);
    }
  });
});
