/**
 * Playwright Configuration for Nearest Nice Weather
 * Optimized for Claude Code MCP integration and frontend testing
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Timeout per test (increased for expansion cycle tests)
  timeout: 120000,
  
  // Expect timeout (increased for marker assertions)
  expect: {
    timeout: 10000
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests (expansion tests modify app state)
  workers: 1,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3001',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Global test timeout
    actionTimeout: 10000,
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable DevTools for debugging
        launchOptions: {
          // args: ['--start-maximized']
        }
      },
    },
    
    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // 
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'node dev-api-server.js',
      port: 4000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd apps/web && npm run dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
  ],
  
  // Output directory for test artifacts
  outputDir: 'test-results/',
});