import { test, expect } from '@playwright/test';

test.describe('Directions Button Fix Verification', () => {
  test('verify directions button now works correctly on desktop browsers', async ({ page }) => {
    console.log('🔍 Verifying directions button fix for desktop browsers');

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

      // Verify platform detection logic
      const platformInfo = await page.evaluate(() => {
        const userAgent = navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isMobile = /Mobi|Android/i.test(userAgent);
        const isDesktop = !isMobile;

        return { isIOS, isAndroid, isMobile, isDesktop };
      });

      console.log('📱 Platform Detection:');
      console.log(`  iOS: ${platformInfo.isIOS}`);
      console.log(`  Android: ${platformInfo.isAndroid}`);
      console.log(`  Mobile: ${platformInfo.isMobile}`);
      console.log(`  Desktop: ${platformInfo.isDesktop}`);

      // Main test: Desktop browsers should use Google Maps web URL (not geo:)
      if (platformInfo.isDesktop) {
        expect(buttonHref).toContain('google.com/maps');
        expect(buttonHref).not.toContain('geo:');
        console.log('✅ Desktop browser correctly using Google Maps web URL');
        console.log('🔧 FIX VERIFIED: geo: URLs replaced with Google Maps web URLs for desktop');
      } else if (platformInfo.isIOS) {
        expect(buttonHref).toContain('maps.apple.com');
        console.log('✅ iOS browser correctly using Apple Maps URL');
      } else if (platformInfo.isAndroid || platformInfo.isMobile) {
        expect(buttonHref).toContain('geo:');
        console.log('✅ Mobile browser correctly using geo: URL');
      }

      // Verify URL contains coordinates
      const hasCoordinates = /(-?\d+\.\d+),(-?\d+\.\d+)/.test(buttonHref);
      expect(hasCoordinates).toBe(true);
      console.log('✅ URL contains valid coordinates');

      // Test button behavior (check that it opens in new tab)
      const hasTargetBlank = await directionsButton.getAttribute('target');
      expect(hasTargetBlank).toBe('_blank');
      console.log('✅ Button opens in new tab/window');

      // Final verification summary
      console.log('\n📊 VERIFICATION SUMMARY:');
      console.log('=========================');
      console.log(`✅ Platform detected correctly: ${platformInfo.isDesktop ? 'Desktop' : 'Mobile'}`);
      console.log(`✅ URL format appropriate: ${buttonHref.includes('google.com/maps') ? 'Google Maps Web' : buttonHref.includes('geo:') ? 'geo: URL' : buttonHref.includes('maps.apple.com') ? 'Apple Maps' : 'Unknown'}`);
      console.log(`✅ Coordinates included: ${hasCoordinates ? 'Yes' : 'No'}`);
      console.log(`✅ Opens in new tab: ${hasTargetBlank === '_blank' ? 'Yes' : 'No'}`);

      // The key fix: Desktop browsers should NOT get geo: URLs anymore
      if (platformInfo.isDesktop && !buttonHref.includes('geo:')) {
        console.log('🎉 SUCCESS: Desktop geo: URL issue has been FIXED!');
      }

    } else {
      console.log('❌ Directions button not found');
      throw new Error('Directions button not visible in popup');
    }
  });

  test('verify button styling remains correct after platform detection fix', async ({ page }) => {
    console.log('🎨 Verifying button styling is preserved after platform detection changes');

    await page.goto('http://localhost:3001');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click a POI marker
    const markers = await page.locator('.leaflet-marker-icon').all();
    if (markers.length > 1) {
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
    }

    await page.waitForSelector('.leaflet-popup-content', { timeout: 5000 });

    const directionsButton = await page.locator('a[title="Get directions"]').first();

    if (await directionsButton.isVisible()) {
      // Verify visual styling
      const computedStyles = await directionsButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          height: styles.height,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderRadius: styles.borderRadius
        };
      });

      console.log('🎨 Button Styling:');
      console.log(`  Size: ${computedStyles.width} x ${computedStyles.height}`);
      console.log(`  Background: ${computedStyles.backgroundColor}`);
      console.log(`  Text Color: ${computedStyles.color}`);
      console.log(`  Border Radius: ${computedStyles.borderRadius}`);

      // Verify it's still a mini-FAB button (28px)
      const width = parseInt(computedStyles.width);
      expect(width).toBe(28);
      console.log('✅ Button size correctly maintained at 28px');

      // Verify round shape (border-radius should be 50% = 14px for 28px width)
      const borderRadius = parseInt(computedStyles.borderRadius);
      expect(borderRadius).toBeGreaterThanOrEqual(14);
      console.log('✅ Button shape correctly maintained as round');

      // Verify compass emoji
      const buttonText = await directionsButton.textContent();
      expect(buttonText?.trim()).toBe('🧭');
      console.log('✅ Compass emoji correctly maintained');

      console.log('🎉 All styling preserved correctly after platform detection fix!');
    }
  });
});
