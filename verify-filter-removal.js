#!/usr/bin/env node

import { chromium } from 'playwright';

async function verifyFilterRemoval() {
  console.log('📸 Verifying Active Filters box removal');
  console.log('====================================');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Loading localhost...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking screenshot of filter area...');
    await page.screenshot({ 
      path: 'filters-without-active-box.png',
      fullPage: true 
    });
    
    // Check if Active Filters box is present
    const activeFiltersBox = await page.locator('text=Active Filters').count();
    console.log(`🔍 Active Filters boxes found: ${activeFiltersBox}`);
    
    // Look for FAB buttons
    const fabButtons = await page.locator('[class*="MuiFab"]').count();
    console.log(`🔘 FAB buttons found: ${fabButtons}`);
    
    if (activeFiltersBox === 0) {
      console.log('✅ SUCCESS: Active Filters content box has been removed');
    } else {
      console.log('❌ ISSUE: Active Filters box still present');
    }
    
    if (fabButtons > 0) {
      console.log('✅ SUCCESS: Filter buttons are still working');
    } else {
      console.log('❌ ISSUE: No filter buttons found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🎯 Verification complete!');
}

verifyFilterRemoval().catch(console.error);