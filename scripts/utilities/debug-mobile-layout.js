#!/usr/bin/env node

// Simple mobile layout debugger without Playwright
// Simulates CSS media query behavior and computes layout

const fs = require('fs');

// Mobile viewport dimensions
const IPHONE_PORTRAIT = { width: 375, height: 812 };

async function debugMobileLayout() {
  console.log('🔍 Mobile Layout Debugger - iPhone Portrait (375x812)');
  console.log('=' . repeat(60));

  try {
    // Read the CSS file
    const cssContent = fs.readFileSync('./apps/web/public/presentation/theme/prairieaster-reveal.css', 'utf8');

    // Extract iPhone portrait media query
    const iphonePortraitMatch = cssContent.match(
      /@media \(max-width: 480px\) and \(orientation: portrait\) \{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s
    );

    if (iphonePortraitMatch) {
      console.log('📱 iPhone Portrait Media Query Found:');
      console.log(iphonePortraitMatch[0].substring(0, 500) + '...');

      // Extract key values
      const headerHeight = iphonePortraitMatch[0].match(/height: (\d+)px/);
      const paddingMatch = iphonePortraitMatch[0].match(/padding: ([^;]+)/);
      const topMatch = iphonePortraitMatch[0].match(/top: ([^;]+)/);

      console.log('\n📊 Extracted Values:');
      console.log(`Header Height: ${headerHeight ? headerHeight[1] + 'px' : 'Not found'}`);
      console.log(`Padding: ${paddingMatch ? paddingMatch[1] : 'Not found'}`);
      console.log(`Top Position: ${topMatch ? topMatch[1] : 'Not found'}`);

    } else {
      console.log('❌ iPhone Portrait Media Query NOT FOUND!');
    }

    // Check base reveal section styles
    const baseSectionMatch = cssContent.match(/\.reveal \.slides section \{([^}]+)\}/);
    if (baseSectionMatch) {
      console.log('\n🎯 Base Section Styles:');
      console.log(baseSectionMatch[1]);
    }

    // Look for conflicting styles
    const allSectionMatches = cssContent.match(/\.reveal \.slides section[^{]*\{[^}]+\}/g);
    console.log(`\n⚠️  Found ${allSectionMatches ? allSectionMatches.length : 0} section style rules`);

    if (allSectionMatches && allSectionMatches.length > 3) {
      console.log('❗ Multiple section styles detected - potential conflicts:');
      allSectionMatches.forEach((match, i) => {
        if (match.includes('padding') || match.includes('top')) {
          console.log(`${i + 1}: ${match.substring(0, 100)}...`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

if (require.main === module) {
  debugMobileLayout().catch(console.error);
}

module.exports = { debugMobileLayout };
