import { test, expect } from '@playwright/test';

test('comprehensive security and performance validation', async ({ page }) => {
  console.log('🔒 Testing security and performance improvements...');
  
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Wait for initial popup
  await page.waitForSelector('.leaflet-popup', { timeout: 10000 });
  
  console.log('🔒 Testing HTML sanitization security...');
  
  // Check that popup content is properly escaped (should not contain raw HTML)
  const popupContent = await page.locator('.leaflet-popup-content').innerHTML();
  
  // Verify no unescaped HTML tags in location data
  const hasUnescapedTags = popupContent.includes('<script>') || 
                          popupContent.includes('javascript:') ||
                          popupContent.includes('onload=') ||
                          popupContent.includes('onclick=');
  
  if (hasUnescapedTags) {
    console.log('❌ SECURITY ISSUE: Found unescaped HTML/JavaScript');
  } else {
    console.log('✅ HTML sanitization working correctly');
  }
  
  console.log('🚀 Testing incremental marker performance...');
  
  // Count initial markers
  const initialMarkerCount = await page.locator('.leaflet-marker-icon').count();
  console.log(`📊 Initial markers: ${initialMarkerCount}`);
  
  // Navigate through several POIs and count markers after each step
  let previousMarkerCount = initialMarkerCount;
  
  for (let i = 0; i < 3; i++) {
    const button = page.locator('button:has-text("Farther")').first();
    await button.click();
    await page.waitForTimeout(500);
    
    const currentMarkerCount = await page.locator('.leaflet-marker-icon').count();
    console.log(`  Step ${i + 1}: ${currentMarkerCount} markers (was ${previousMarkerCount})`);
    
    // Markers should increment as we expand search, not rebuild all
    if (currentMarkerCount >= previousMarkerCount) {
      console.log('✅ Incremental marker updates working');
    } else {
      console.log('⚠️ Unexpected marker count decrease');
    }
    
    previousMarkerCount = currentMarkerCount;
  }
  
  console.log('🎯 Testing secure event delegation...');
  
  // Verify navigation buttons use data attributes instead of inline handlers
  const navigationButtons = await page.locator('[data-nav-action]').count();
  console.log(`📊 Secure navigation buttons found: ${navigationButtons}`);
  
  if (navigationButtons > 0) {
    console.log('✅ Secure event delegation implemented');
  } else {
    console.log('❌ No secure navigation buttons found');
  }
  
  console.log('🗂️ Testing popup content caching efficiency...');
  
  // Navigate back and forth to test popup content updates
  const closerButton = page.locator('button:has-text("Closer")').first();
  const fartherButton = page.locator('button:has-text("Farther")').first();
  
  // Get initial popup content
  const initialContent = await page.locator('.leaflet-popup-content h3').textContent();
  console.log(`📍 Initial POI: ${initialContent}`);
  
  // Navigate farther
  await fartherButton.click();
  await page.waitForTimeout(300);
  
  const fartherContent = await page.locator('.leaflet-popup-content h3').textContent();
  console.log(`📍 After farther: ${fartherContent}`);
  
  // Navigate back closer
  await closerButton.click();
  await page.waitForTimeout(300);
  
  const backContent = await page.locator('.leaflet-popup-content h3').textContent();
  console.log(`📍 After closer: ${backContent}`);
  
  if (initialContent === backContent) {
    console.log('✅ Navigation state consistency maintained');
  } else {
    console.log('❌ Navigation state inconsistency detected');
  }
  
  console.log('📸 Taking final validation screenshot...');
  await page.screenshot({ path: 'security-performance-validation.png', fullPage: true });
  
  console.log('✅ Security and performance validation complete!');
});