/**
 * Global Test Setup for Nearest Nice Weather
 * Business Context Validation and Environment Preparation
 */

import { chromium } from '@playwright/test';

export default async function globalSetup(config) {
  console.log('🚀 Starting Global Test Setup...');

  // 1. Business Model Validation
  console.log('📋 Validating Business Model Context...');
  const businessChecks = await validateBusinessContext();

  if (!businessChecks.valid) {
    throw new Error(`❌ Business Model Validation Failed: ${businessChecks.errors.join(', ')}`);
  }

  // 2. Environment Health Check
  console.log('🏥 Running Environment Health Check...');
  const healthCheck = await validateEnvironmentHealth();

  if (!healthCheck.healthy) {
    throw new Error(`❌ Environment Health Check Failed: ${healthCheck.issues.join(', ')}`);
  }

  // 3. POI Data Validation
  console.log('📍 Validating POI Data Integrity...');
  const poiValidation = await validatePOIData();

  if (!poiValidation.valid) {
    console.warn(`⚠️ POI Data Issues: ${poiValidation.warnings.join(', ')}`);
  }

  // 4. Performance Baseline Capture
  console.log('📊 Capturing Performance Baseline...');
  await capturePerformanceBaseline();

  // 5. Create Visual Regression Baseline
  console.log('📸 Setting up Visual Regression Baseline...');
  await setupVisualBaseline();

  console.log('✅ Global Setup Complete - Ready for Testing!');
}

/**
 * Validate Business Model Context
 * Ensures tests align with B2C outdoor recreation focus
 */
async function validateBusinessContext() {
  const checks = {
    valid: true,
    errors: []
  };

  try {
    // Check for B2B references in codebase
    const fs = await import('fs');
    const path = await import('path');

    const codebaseFiles = [
      'dev-api-server.js',
      'apps/web/src/hooks/usePOINavigation.ts',
      'README.md'
    ];

    for (const file of codebaseFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        // Check for anti-patterns
        if (content.includes('tourism_operators') && content.includes('B2B')) {
          checks.errors.push(`B2B references found in ${file}`);
        }

        if (content.includes('locations') && !content.includes('poi_locations')) {
          checks.errors.push(`Legacy locations table referenced in ${file}`);
        }
      }
    }

    if (checks.errors.length > 0) {
      checks.valid = false;
    }

  } catch (error) {
    checks.valid = false;
    checks.errors.push(`Business validation error: ${error.message}`);
  }

  return checks;
}

/**
 * Validate Environment Health
 * Ensures API and frontend servers are operational
 */
async function validateEnvironmentHealth() {
  const health = {
    healthy: true,
    issues: []
  };

  try {
    // Test API server
    const apiResponse = await fetch('http://localhost:4000/api/health');
    if (!apiResponse.ok) {
      health.issues.push('API server not responding');
    }

    // Test POI endpoint
    const poiResponse = await fetch('http://localhost:4000/api/poi-locations?limit=1');
    if (!poiResponse.ok) {
      health.issues.push('POI endpoint not responding');
    }

    // Test frontend server
    const frontendResponse = await fetch('http://localhost:3001/');
    if (!frontendResponse.ok) {
      health.issues.push('Frontend server not responding');
    }

    if (health.issues.length > 0) {
      health.healthy = false;
    }

  } catch (error) {
    health.healthy = false;
    health.issues.push(`Health check error: ${error.message}`);
  }

  return health;
}

/**
 * Validate POI Data Integrity
 * Ensures Minnesota POI data is properly loaded
 */
async function validatePOIData() {
  const validation = {
    valid: true,
    warnings: []
  };

  try {
    const response = await fetch('http://localhost:4000/api/poi-locations?limit=100');
    const data = await response.json();

    if (!data.pois || data.pois.length === 0) {
      validation.valid = false;
      validation.warnings.push('No POI data found');
      return validation;
    }

    // Check for Minnesota geographic bounds
    const minnesotaPOIs = data.pois.filter(poi =>
      poi.latitude >= 43.0 && poi.latitude <= 49.5 &&
      poi.longitude >= -97.5 && poi.longitude <= -89.0
    );

    if (minnesotaPOIs.length !== data.pois.length) {
      validation.warnings.push(`${data.pois.length - minnesotaPOIs.length} POIs outside Minnesota bounds`);
    }

    // Check for required fields
    const requiredFields = ['name', 'latitude', 'longitude', 'park_type'];
    data.pois.forEach((poi, index) => {
      requiredFields.forEach(field => {
        if (!poi[field]) {
          validation.warnings.push(`POI ${index} missing required field: ${field}`);
        }
      });
    });

  } catch (error) {
    validation.valid = false;
    validation.warnings.push(`POI validation error: ${error.message}`);
  }

  return validation;
}

/**
 * Capture Performance Baseline
 * Records performance metrics for comparison
 */
async function capturePerformanceBaseline() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to app and capture metrics
    await page.goto('http://localhost:3001/');

    // Wait for map initialization
    await page.waitForSelector('.leaflet-container', { timeout: 30000 });

    // Capture performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation')[0]);
    });

    // Save baseline metrics
    const fs = await import('fs');
    fs.writeFileSync('test-results/performance-baseline.json', performanceMetrics);

  } catch (error) {
    console.warn(`⚠️ Performance baseline capture failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Setup Visual Regression Baseline
 * Creates reference screenshots for visual comparison
 */
async function setupVisualBaseline() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate and capture baseline screenshots
    await page.goto('http://localhost:3001/');

    // Wait for initial load
    await page.waitForSelector('.leaflet-container', { timeout: 30000 });
    await page.waitForTimeout(3000); // Allow map to stabilize

    // Create baseline directory
    const fs = await import('fs');
    if (!fs.existsSync('test-results/visual-baseline')) {
      fs.mkdirSync('test-results/visual-baseline', { recursive: true });
    }

    // Capture full page baseline
    await page.screenshot({
      path: 'test-results/visual-baseline/homepage-full.png',
      fullPage: true
    });

    // Capture map area baseline
    await page.locator('.leaflet-container').screenshot({
      path: 'test-results/visual-baseline/map-area.png'
    });

  } catch (error) {
    console.warn(`⚠️ Visual baseline setup failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}
