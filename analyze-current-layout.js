#!/usr/bin/env node

// Simple layout analyzer using curl to check CSS and DOM
const fs = require('fs');

async function analyzeCurrentLayout() {
  console.log('🔍 Layout Analysis - Current State Check');
  console.log('=' . repeat(50));
  
  try {
    // Check if CSS changes are actually applied
    const { execSync } = require('child_process');
    
    console.log('1. 🎨 Checking CSS Configuration...');
    
    // Check reveal.js config
    const jsContent = execSync('curl -s http://localhost:3001/presentation/index-reveal.html').toString();
    const hasControlsDisabled = jsContent.includes('controls: false');
    const hasCenterDisabled = jsContent.includes('center: false');
    const hasTouchDisabled = jsContent.includes('touch: false');
    
    console.log(`   Controls disabled: ${hasControlsDisabled ? '✅' : '❌'}`);
    console.log(`   Center disabled: ${hasCenterDisabled ? '✅' : '❌'}`);
    console.log(`   Touch disabled: ${hasTouchDisabled ? '✅' : '❌'}`);
    
    // Check CSS rules
    const cssContent = execSync('curl -s http://localhost:3001/presentation/theme/prairieaster-reveal.css').toString();
    const hasUnifiedRule = cssContent.includes('UNIFIED: Content Adjustments');
    const hasFlexbox = cssContent.includes('justify-content: flex-start');
    const hasTopPosition = cssContent.includes('top: 60px !important');
    
    console.log('\n2. 📐 Checking CSS Rules...');
    console.log(`   Unified section rule: ${hasUnifiedRule ? '✅' : '❌'}`);
    console.log(`   Flexbox flex-start: ${hasFlexbox ? '✅' : '❌'}`);
    console.log(`   Top positioning: ${hasTopPosition ? '✅' : '❌'}`);
    
    // Count conflicting rules
    const sectionRules = (cssContent.match(/\.reveal \.slides section \{/g) || []).length;
    console.log(`   Section rule count: ${sectionRules} ${sectionRules > 2 ? '⚠️ (may conflict)' : '✅'}`);
    
    // Extract mobile media query
    const mobileMediaQuery = cssContent.match(/@media \(max-width: 480px\).*?\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (mobileMediaQuery) {
      const mobileCSS = mobileMediaQuery[1];
      const hasMobilePadding = mobileCSS.includes('padding: 0px 15px');
      const hasMobileTop = mobileCSS.includes('top: 40px');
      
      console.log('\n3. 📱 Mobile Media Query...');
      console.log(`   Mobile padding: ${hasMobilePadding ? '✅' : '❌'}`);
      console.log(`   Mobile top: ${hasMobileTop ? '✅' : '❌'}`);
    }
    
    // Analyze potential issues
    console.log('\n4. 🔧 Potential Issues...');
    
    if (sectionRules > 2) {
      console.log('   ⚠️ Multiple section rules may be conflicting');
    }
    
    const hasSlideContentRule = cssContent.includes('.slide-content {');
    if (hasSlideContentRule) {
      console.log('   ✅ Slide-content wrapper has specific styling');
    } else {
      console.log('   ⚠️ Slide-content wrapper may need specific styling');
    }
    
    // Check for cache busting
    const cacheControl = execSync('curl -s -I http://localhost:3001/presentation/theme/prairieaster-reveal.css | grep -i cache-control || echo "No cache control"').toString().trim();
    console.log(`   Cache control: ${cacheControl}`);
    
    console.log('\n5. 🎯 Recommendations...');
    
    if (!hasControlsDisabled || !hasCenterDisabled) {
      console.log('   💡 Disable reveal.js controls and centering');
    }
    
    if (sectionRules > 2) {
      console.log('   💡 Consolidate conflicting CSS section rules');
    }
    
    console.log('   💡 Force refresh browser (Ctrl+F5) to load new CSS');
    console.log('   💡 Check browser dev tools for applied styles');
    
    return {
      jsConfig: { hasControlsDisabled, hasCenterDisabled, hasTouchDisabled },
      cssRules: { hasUnifiedRule, hasFlexbox, hasTopPosition, sectionRules },
      mobileQuery: mobileMediaQuery ? true : false
    };
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    return null;
  }
}

if (require.main === module) {
  analyzeCurrentLayout()
    .then(result => {
      if (result) {
        console.log('\n🎯 Analysis complete! Check browser with hard refresh.');
      }
    })
    .catch(console.error);
}

module.exports = { analyzeCurrentLayout };