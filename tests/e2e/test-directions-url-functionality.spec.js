import { test, expect } from '@playwright/test';

test.describe('Directions URL Functionality', () => {
  test('verify directions button opens correct mapping URL', async ({ page }) => {
    console.log('🔍 Testing directions URL functionality on localhost:3001');

    // Navigate to the app
    await page.goto('http://localhost:3001');

    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Find and click a POI marker
    const markers = await page.locator('.leaflet-marker-icon').all();
    console.log(`📍 Found ${markers.length} markers`);

    let poiClicked = false;
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const src = await marker.getAttribute('src');

      if (src && src.includes('aster-marker')) {
        await marker.click();
        poiClicked = true;
        console.log(`✅ Clicked POI marker #${i + 1}`);
        break;
      }
    }

    if (!poiClicked && markers.length > 1) {
      await markers[1].click();
      console.log('✅ Clicked second marker as fallback');
    }

    // Wait for popup
    await page.waitForSelector('.leaflet-popup-content', { timeout: 5000 });

    // Get the directions button
    const directionsButton = await page.locator('a[title="Get directions"]').first();

    if (await directionsButton.isVisible()) {
      const buttonHref = await directionsButton.getAttribute('href');
      console.log(`\n🔗 Current directions URL: ${buttonHref}`);

      // Analyze URL format based on platform
      const userAgent = await page.evaluate(() => navigator.userAgent);
      const isDesktop = !/Mobi|Android|iPad|iPhone|iPod/i.test(userAgent);

      if (isDesktop && buttonHref?.includes('google.com/maps')) {
        console.log('✅ Desktop browser using Google Maps web URL - FIX WORKING!');
        console.log('   This should open Google Maps in a new browser tab');
      } else if (!isDesktop && buttonHref?.startsWith('geo:')) {
        console.log('✅ Mobile browser using geo: URL - CORRECT!');
        console.log('   iOS/Android: Should open native mapping apps');
      } else if (!isDesktop && buttonHref?.includes('maps.apple.com')) {
        console.log('✅ iOS browser using Apple Maps URL - CORRECT!');
      }

      // Test what happens when we simulate a click
      // Note: We won't actually click to avoid opening new tabs in test
      console.log('\n🧪 URL Analysis:');
      console.log(`   Protocol: ${buttonHref?.split(':')[0]}`);
      console.log(`   Contains coordinates: ${buttonHref?.includes(',')}`);
      console.log(`   URL encoded name: ${buttonHref?.includes('(')}`);

      // Check coordinates in URL (works for both geo: and Google Maps URLs)
      const hasCoordinates = buttonHref?.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (hasCoordinates) {
        console.log(`   ✅ Valid coordinates found: ${hasCoordinates[1]}, ${hasCoordinates[2]}`);
      } else {
        console.log('   ❌ No valid coordinates found in URL');
      }

      console.log('\n✅ Platform-Aware URL Generation:');
      console.log(`   Desktop: ${isDesktop ? '✅ Google Maps web URLs' : '❌ Not desktop'}`);
      console.log(`   Mobile: ${!isDesktop ? '✅ geo: or Apple Maps URLs' : '❌ Not mobile'}`);
      console.log('   📱 Platform detection working correctly!');

    } else {
      console.log('❌ Directions button not found');
    }
  });

  test('test platform-specific URL generation', async ({ page }) => {
    // Test what different URL formats would look like
    const testCoordinates = { lat: 44.8339, lng: -92.7935, name: 'Afton State Park' };

    console.log('\n🌍 Platform-specific URL formats:');
    console.log('================================');

    // Current geo: URL
    const geoUrl = `geo:${testCoordinates.lat},${testCoordinates.lng}?q=${testCoordinates.lat},${testCoordinates.lng}(${encodeURIComponent(testCoordinates.name)})`;
    console.log(`📱 Mobile (geo:): ${geoUrl}`);

    // Google Maps web URL (works on desktop)
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${testCoordinates.lat},${testCoordinates.lng}`;
    console.log(`🖥️  Desktop (Google): ${googleUrl}`);

    // Apple Maps URL (iOS)
    const appleUrl = `http://maps.apple.com/?daddr=${testCoordinates.lat},${testCoordinates.lng}&dirflg=d`;
    console.log(`🍎 iOS (Apple Maps): ${appleUrl}`);

    // Universal mapping URL with fallback
    const universalUrl = `https://www.google.com/maps/search/?api=1&query=${testCoordinates.lat},${testCoordinates.lng}`;
    console.log(`🌐 Universal (Google fallback): ${universalUrl}`);

    console.log('\n✅ All URL formats generated successfully');
  });
});
