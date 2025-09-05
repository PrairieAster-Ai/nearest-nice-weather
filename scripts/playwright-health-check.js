#!/usr/bin/env node
/**
 * Playwright Health Check Script
 * Replaces BrowserToolsMCP functionality with Playwright automation
 *
 * Usage: node scripts/playwright-health-check.js [environment]
 * Environment: localhost (default), preview, production, or custom URL
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ENVIRONMENTS = {
  localhost: 'http://localhost:3001',
  preview: 'https://p.nearestniceweather.com',
  production: 'https://nearestniceweather.com'
};

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const TIMEOUT = 30000;

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class PlaywrightHealthChecker {
  constructor(environment = 'localhost') {
    this.baseUrl = ENVIRONMENTS[environment] || environment;
    this.environment = environment;
    this.browser = null;
    this.page = null;
    this.results = {
      environment: this.environment,
      url: this.baseUrl,
      timestamp: new Date().toISOString(),
      checks: {},
      screenshots: [],
      console_logs: [],
      network_requests: [],
      overall_status: 'unknown'
    };
  }

  async init() {
    console.log(`🚀 Starting Playwright health check for: ${this.baseUrl}`);

    // Launch browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    // Create page
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    this.page = await context.newPage();

    // Setup monitoring
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor console messages
    this.page.on('console', msg => {
      const log = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      this.results.console_logs.push(log);

      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Monitor network requests
    this.page.on('request', request => {
      this.results.network_requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });

    // Monitor page errors
    this.page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
      this.results.console_logs.push({
        type: 'pageerror',
        text: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  async takeScreenshot(name, fullPage = true) {
    const filename = `${this.environment}-${name}-${Date.now()}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: fullPage
    });

    this.results.screenshots.push({
      name: name,
      filename: filename,
      path: filepath,
      timestamp: new Date().toISOString()
    });

    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async checkPageLoad() {
    console.log('🔍 Checking page load...');

    try {
      const response = await this.page.goto(this.baseUrl, {
        waitUntil: 'networkidle',
        timeout: TIMEOUT
      });

      const status = response.status();
      const success = status >= 200 && status < 400;

      this.results.checks.page_load = {
        status: success ? 'pass' : 'fail',
        http_status: status,
        load_time: Date.now() - this.startTime,
        message: success ? 'Page loaded successfully' : `HTTP ${status} error`
      };

      if (success) {
        console.log(`✅ Page Load: HTTP ${status}`);
        await this.takeScreenshot('page-load');
      } else {
        console.log(`❌ Page Load: HTTP ${status}`);
      }

      return success;
    } catch (error) {
      this.results.checks.page_load = {
        status: 'fail',
        error: error.message,
        message: 'Failed to load page'
      };
      console.log(`❌ Page Load Failed: ${error.message}`);
      return false;
    }
  }

  async checkTitle() {
    console.log('🔍 Checking page title...');

    try {
      const title = await this.page.title();
      const expectedTitle = 'Nearest Nice Weather';
      const success = title.includes(expectedTitle);

      this.results.checks.title = {
        status: success ? 'pass' : 'fail',
        actual: title,
        expected: expectedTitle,
        message: success ? 'Title correct' : 'Title mismatch'
      };

      if (success) {
        console.log(`✅ Title Check: "${title}"`);
      } else {
        console.log(`❌ Title Check: Expected "${expectedTitle}", got "${title}"`);
      }

      return success;
    } catch (error) {
      this.results.checks.title = {
        status: 'fail',
        error: error.message,
        message: 'Failed to get page title'
      };
      console.log(`❌ Title Check Failed: ${error.message}`);
      return false;
    }
  }

  async checkMapLoading() {
    console.log('🔍 Checking map loading...');

    try {
      // Wait for map container
      await this.page.waitForSelector('#map-container', { timeout: 10000 });

      // Wait a bit for map to initialize
      await this.page.waitForTimeout(3000);

      // Check if Leaflet map is initialized
      const mapInitialized = await this.page.evaluate(() => {
        const container = document.getElementById('map-container');
        return container && container.children.length > 0;
      });

      this.results.checks.map_loading = {
        status: mapInitialized ? 'pass' : 'fail',
        message: mapInitialized ? 'Map loaded successfully' : 'Map failed to initialize'
      };

      if (mapInitialized) {
        console.log('✅ Map Loading: Map initialized');
        await this.takeScreenshot('map-loaded');
      } else {
        console.log('❌ Map Loading: Map not initialized');
        await this.takeScreenshot('map-failed');
      }

      return mapInitialized;
    } catch (error) {
      this.results.checks.map_loading = {
        status: 'fail',
        error: error.message,
        message: 'Failed to check map loading'
      };
      console.log(`❌ Map Loading Failed: ${error.message}`);
      await this.takeScreenshot('map-error');
      return false;
    }
  }

  async checkAPIEndpoints() {
    console.log('🔍 Checking API endpoints...');

    const endpoints = [
      '/api/health',
      '/api/poi-locations-with-weather?lat=44.9537&lng=-93.0900&limit=3'
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      try {
        const response = await this.page.goto(`${this.baseUrl}${endpoint}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        const status = response.status();
        const success = status === 200;

        if (success) {
          const content = await response.text();
          const isJson = content.startsWith('{');

          this.results.checks[`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`] = {
            status: 'pass',
            http_status: status,
            is_json: isJson,
            message: `API endpoint working`
          };

          console.log(`✅ API ${endpoint}: HTTP ${status}`);
        } else {
          allPassed = false;
          this.results.checks[`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`] = {
            status: 'fail',
            http_status: status,
            message: `API endpoint failed: HTTP ${status}`
          };

          console.log(`❌ API ${endpoint}: HTTP ${status}`);
        }
      } catch (error) {
        allPassed = false;
        this.results.checks[`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`] = {
          status: 'fail',
          error: error.message,
          message: 'API endpoint request failed'
        };

        console.log(`❌ API ${endpoint}: ${error.message}`);
      }
    }

    return allPassed;
  }

  async runAllChecks() {
    this.startTime = Date.now();

    try {
      await this.init();

      // Run all health checks
      const checks = await Promise.all([
        this.checkPageLoad(),
        this.checkTitle(),
        this.checkMapLoading(),
        this.checkAPIEndpoints()
      ]);

      // Determine overall status
      const allPassed = checks.every(check => check === true);
      this.results.overall_status = allPassed ? 'healthy' : 'unhealthy';

      // Final screenshot
      await this.takeScreenshot('final-state');

      console.log(`\n📋 Health Check Summary:`);
      console.log(`Environment: ${this.environment}`);
      console.log(`URL: ${this.baseUrl}`);
      console.log(`Overall Status: ${this.results.overall_status.toUpperCase()}`);
      console.log(`Screenshots: ${this.results.screenshots.length} saved to ${SCREENSHOT_DIR}`);
      console.log(`Console Logs: ${this.results.console_logs.length} messages`);
      console.log(`Network Requests: ${this.results.network_requests.length} requests`);

      // Save results
      const resultsFile = path.join(SCREENSHOT_DIR, `health-check-${this.environment}-${Date.now()}.json`);
      fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
      console.log(`📄 Results saved: ${resultsFile}`);

      return this.results;

    } catch (error) {
      console.error(`❌ Health check failed: ${error.message}`);
      this.results.overall_status = 'error';
      this.results.error = error.message;
      return this.results;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const environment = process.argv[2] || 'localhost';

  const checker = new PlaywrightHealthChecker(environment);
  checker.runAllChecks()
    .then(results => {
      const exitCode = results.overall_status === 'healthy' ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export default PlaywrightHealthChecker;
