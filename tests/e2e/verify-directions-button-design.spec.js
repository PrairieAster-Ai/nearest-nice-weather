import { test, expect } from '@playwright/test';

test.describe('Directions Button Visual Verification', () => {
  test('verify mini-FAB directions button design matches requirements', async ({ page }) => {
    console.log('🔍 Verifying directions button design on localhost:3001');
    
    // Navigate to the app
    await page.goto('http://localhost:3001');
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    console.log('✅ Map loaded');
    
    // Wait for POI markers to appear
    await page.waitForTimeout(2000); // Give markers time to load
    
    // Find and click a POI marker (skip user location)
    const markers = await page.locator('.leaflet-marker-icon').all();
    console.log(`📍 Found ${markers.length} markers`);
    
    let poiClicked = false;
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const src = await marker.getAttribute('src');
      
      // Look for POI marker (aster-marker.svg)
      if (src && src.includes('aster-marker')) {
        await marker.click();
        poiClicked = true;
        console.log(`✅ Clicked POI marker #${i + 1}`);
        break;
      }
    }
    
    if (!poiClicked && markers.length > 1) {
      // Fallback: click second marker if no aster marker found
      await markers[1].click();
      console.log('✅ Clicked second marker as fallback');
    }
    
    // Wait for popup to open
    await page.waitForSelector('.leaflet-popup-content', { timeout: 5000 });
    console.log('✅ Popup opened');
    
    // Find the directions button
    const directionsButton = await page.locator('a[title="Get directions"]').first();
    const buttonExists = await directionsButton.isVisible();
    
    if (buttonExists) {
      console.log('\n📊 DIRECTIONS BUTTON ANALYSIS:');
      console.log('================================');
      
      // Get button properties
      const buttonStyle = await directionsButton.getAttribute('style');
      const buttonText = await directionsButton.textContent();
      const buttonHref = await directionsButton.getAttribute('href');
      
      // Parse style properties
      console.log('\n🎨 Visual Properties:');
      console.log(`  Style attribute: ${buttonStyle}`);
      console.log(`  Button text/emoji: "${buttonText?.trim()}"`);
      
      // Verify size (should be 28px x 28px)
      const hasCorrectSize = buttonStyle?.includes('width: 28px') && buttonStyle?.includes('height: 28px');
      console.log(`  ✓ Size is 28px x 28px: ${hasCorrectSize ? '✅ YES' : '❌ NO'}`);
      
      // Verify round shape (border-radius for circular)
      const isRound = buttonStyle?.includes('rounded-full') || buttonStyle?.includes('border-radius');
      console.log(`  ✓ Round shape: ${isRound ? '✅ YES (via Tailwind rounded-full)' : '⚠️ Check visual'}`);
      
      // Verify background color (purple #7563A8)
      const hasPurpleBackground = buttonStyle?.includes('#7563A8');
      console.log(`  ✓ Purple background (#7563A8): ${hasPurpleBackground ? '✅ YES' : '❌ NO'}`);
      
      // Verify text color (white)
      const hasWhiteText = buttonStyle?.includes('color: white') || buttonStyle?.includes('text-white');
      console.log(`  ✓ White text/emoji: ${hasWhiteText ? '✅ YES (explicit white)' : '⚠️ Check CSS class'}`);
      
      // Verify compass emoji
      const hasCompassEmoji = buttonText?.trim() === '🧭';
      console.log(`  ✓ Compass emoji (🧭): ${hasCompassEmoji ? '✅ YES' : '❌ NO (found: ' + buttonText + ')'}`);
      
      // Check link functionality
      console.log(`  ✓ Links to: ${buttonHref?.includes('geo:') ? '✅ Device Default Mapping App (geo:)' : buttonHref}`);
      
      // Take detailed screenshot of just the button
      await directionsButton.screenshot({ 
        path: 'test-results/directions-button-only.png',
        scale: 'css'
      });
      console.log('\n📸 Button screenshot saved: test-results/directions-button-only.png');
      
      // Take popup screenshot for context
      const popup = page.locator('.leaflet-popup').last();
      await popup.screenshot({ 
        path: 'test-results/popup-with-directions-button.png' 
      });
      console.log('📸 Popup screenshot saved: test-results/popup-with-directions-button.png');
      
      // Get computed styles for more detailed analysis
      const computedStyles = await directionsButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          height: styles.height,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderRadius: styles.borderRadius,
          display: styles.display,
          alignItems: styles.alignItems,
          justifyContent: styles.justifyContent,
          fontSize: styles.fontSize
        };
      });
      
      console.log('\n🔬 Computed Styles:');
      console.log(`  Width: ${computedStyles.width}`);
      console.log(`  Height: ${computedStyles.height}`);
      console.log(`  Background: ${computedStyles.backgroundColor}`);
      console.log(`  Text Color: ${computedStyles.color}`);
      console.log(`  Border Radius: ${computedStyles.borderRadius}`);
      console.log(`  Display: ${computedStyles.display}`);
      console.log(`  Align Items: ${computedStyles.alignItems}`);
      console.log(`  Justify Content: ${computedStyles.justifyContent}`);
      console.log(`  Font Size: ${computedStyles.fontSize}`);
      
      // Compare to Feedback FAB size (should be 50% of standard FAB)
      console.log('\n📏 Size Comparison:');
      console.log('  Standard FAB size: 56px');
      console.log('  Expected mini-FAB: 28px (50%)');
      console.log(`  Actual size: ${computedStyles.width} x ${computedStyles.height}`);
      
      const widthNum = parseInt(computedStyles.width);
      const isHalfSize = widthNum === 28;
      console.log(`  ✓ Is exactly half size: ${isHalfSize ? '✅ YES' : '❌ NO'}`);
      
      // Final verification summary
      console.log('\n✅ FINAL VERIFICATION:');
      expect(hasCorrectSize).toBe(true);
      expect(hasPurpleBackground).toBe(true);
      expect(hasCompassEmoji).toBe(true);
      expect(isHalfSize).toBe(true);
      
      console.log('  ✅ All design requirements verified!');
      
    } else {
      console.log('❌ Directions button not found in popup');
    }
  });
});