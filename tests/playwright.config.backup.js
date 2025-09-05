/**
 * Enhanced Playwright Configuration for Nearest Nice Weather
 * Comprehensive QA automation with cross-browser testing, performance monitoring,
 * and business model validation for Claude Code MCP integration
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory structure
  testDir: './tests',

  // Enhanced timeout for complex POI discovery workflows
  timeout: 120000,

  // Expect timeout (optimized for map rendering and API calls)
  expect: {
    timeout: 15000
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Enhanced retry strategy for reliability
  retries: process.env.CI ? 3 : 1,

  // Parallel execution (safe for independent tests)
  workers: process.env.CI ? 2 : 1,

  // Comprehensive reporting for MCP integration
  reporter: [
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never' // Prevent auto-opening in headless environments
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'] // Console output for CI/CD
  ],

  // Enhanced global settings
  use: {
    // Base URL for tests (dynamically configurable)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',

    // Optimized viewport for POI map testing
    viewport: { width: 1280, height: 720 },

    // Comprehensive debugging configuration
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Performance and reliability settings
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Browser launch options for enhanced debugging
    launchOptions: {
      slowMo: process.env.PLAYWRIGHT_SLOW_MO ? parseInt(process.env.PLAYWRIGHT_SLOW_MO) : 0,
    },
  },

  // Multi-browser testing matrix for comprehensive QA
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet testing
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Enhanced web server configuration with health checks
  webServer: [
    {
      command: 'node dev-api-server.js',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      timeout: 60000, // Allow more time for API server startup
      env: {
        NODE_ENV: 'test'
      }
    },
    {
      command: 'cd apps/web && npm run dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 90000, // Allow more time for frontend compilation
      env: {
        NODE_ENV: 'test',
        VITE_API_BASE_URL: 'http://localhost:4000'
      }
    },
  ],

  // Enhanced output configuration
  outputDir: 'test-results/',

  // Global setup for business context validation
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',

  // Test metadata for MCP integration
  metadata: {
    businessModel: 'B2C outdoor recreation platform',
    primaryTable: 'poi_locations',
    targetGeography: 'Minnesota',
    criticalUserJourney: 'POI discovery with auto-expand'
  }
});
