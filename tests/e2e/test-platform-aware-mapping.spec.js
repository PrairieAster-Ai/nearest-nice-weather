import { test, expect } from '@playwright/test';

test.describe('Platform-Aware Mapping URLs', () => {
  test('verify platform-specific mapping URLs are generated correctly', async ({ page }) => {
    console.log('🔍 Testing platform-aware mapping URL generation on localhost:3001');
    
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
      console.log(`🔗 Current directions URL: ${buttonHref}`);
      
      // Get user agent info from the browser
      const userAgent = await page.evaluate(() => navigator.userAgent);
      console.log(`🖥️  Browser User Agent: ${userAgent}`);
      
      // Analyze what type of URL should be generated based on user agent
      const isDesktop = !/Mobi|Android|iPad|iPhone|iPod/i.test(userAgent);
      console.log(`📱 Is Desktop Browser: ${isDesktop}`);
      
      if (isDesktop) {
        // Desktop should use Google Maps web URL
        expect(buttonHref).toContain('google.com/maps');
        expect(buttonHref).toContain('destination=');
        console.log('✅ Desktop browser correctly using Google Maps web URL');
      } else {
        // Mobile should use platform-specific URLs
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        
        if (isIOS) {
          expect(buttonHref).toContain('maps.apple.com');
          console.log('✅ iOS browser correctly using Apple Maps URL');
        } else if (isAndroid) {
          expect(buttonHref).toContain('geo:');
          console.log('✅ Android browser correctly using geo: URL');
        } else {
          // Other mobile devices
          expect(buttonHref).toContain('geo:');
          console.log('✅ Mobile browser correctly using geo: URL');
        }
      }
      
      // Test that the URL contains coordinate information
      const hasCoordinates = /(-?\d+\.\d+),(-?\d+\.\d+)/.test(buttonHref);
      expect(hasCoordinates).toBe(true);
      console.log('✅ URL contains valid coordinates');
      
    } else {
      console.log('❌ Directions button not found');
      throw new Error('Directions button not visible in popup');
    }
  });
  
  test('simulate different user agents and verify URL generation', async ({ page }) => {
    console.log('🔍 Testing URL generation with simulated user agents');
    
    // Test different user agent scenarios
    const testCases = [
      {
        name: 'Desktop Chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        expectedPattern: 'google.com/maps',
        expectedType: 'Google Maps Web'
      },
      {
        name: 'iPhone Safari',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1',
        expectedPattern: 'maps.apple.com',
        expectedType: 'Apple Maps'
      },
      {
        name: 'Android Chrome',
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        expectedPattern: 'geo:',
        expectedType: 'Android geo: URL'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      // Set user agent for this test
      await page.setExtraHTTPHeaders({
        'User-Agent': testCase.userAgent
      });
      
      // Navigate to app
      await page.goto('http://localhost:3001');
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Click a POI marker
      const markers = await page.locator('.leaflet-marker-icon').all();
      if (markers.length > 1) {
        // Find POI marker or use second marker as fallback
        let clicked = false;
        for (const marker of markers) {
          const src = await marker.getAttribute('src');
          if (src && src.includes('aster-marker')) {
            await marker.click();
            clicked = true;
            break;
          }
        }
        if (!clicked) {
          await markers[1].click();
        }
        
        await page.waitForSelector('.leaflet-popup-content', { timeout: 5000 });
        
        const directionsButton = await page.locator('a[title="Get directions"]').first();
        if (await directionsButton.isVisible()) {
          const href = await directionsButton.getAttribute('href');
          console.log(`   Generated URL: ${href}`);
          
          expect(href).toContain(testCase.expectedPattern);
          console.log(`   ✅ Correctly generated ${testCase.expectedType} URL`);
        }
      }
    }
    
    console.log('\n✅ All user agent simulations passed!');
  });
});