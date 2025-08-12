/**
 * ========================================================================
 * PLAYWRIGHT VIDEO RECORDING CONFIGURATION
 * ========================================================================
 * 
 * @PURPOSE: Configuration optimized for creating video demonstrations
 * @FEATURES: Video recording, slower execution for visibility, headed mode
 * 
 * This configuration is specifically designed for creating demonstration
 * videos of the Playwright test suite running.
 * 
 * ========================================================================
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Longer timeout for video recording (tests run slower when recording)
  timeout: 60000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },
  
  // Test execution settings for video recording
  fullyParallel: false,  // Sequential execution for cleaner video
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // Single worker for sequential, predictable execution
  
  // Reporter configuration for video demo
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  // Global test configuration for video recording
  use: {
    // Base URL for testing
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    
    // Browser settings optimized for video recording
    headless: false,  // Show browser for video capture
    
    // Video recording settings
    video: {
      mode: 'on',  // Always record video
      size: { width: 1280, height: 720 }  // HD recording resolution
    },
    
    // Screenshot settings
    screenshot: {
      mode: 'on',  // Always take screenshots
      fullPage: true
    },
    
    // Trace recording for debugging
    trace: 'on',
    
    // Slower execution for better video visibility
    actionTimeout: 5000,  // 5 second timeout for actions
    navigationTimeout: 10000,  // 10 second navigation timeout
    
    // Viewport settings for consistent video
    viewport: { width: 1280, height: 720 },
    
    // Additional settings
    ignoreHTTPSErrors: true,
    
    // Slower interactions for video visibility
    launchOptions: {
      slowMo: 1000,  // 1 second delay between actions
    }
  },

  // Test output directories
  outputDir: 'test-results/',
  
  // Projects configuration
  projects: [
    // Desktop Chrome - Primary for video recording
    {
      name: 'chromium-video',
      use: { 
        ...devices['Desktop Chrome'],
        // Override with video-specific settings
        launchOptions: {
          slowMo: 1000,  // Slow motion for video
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--start-maximized'
          ]
        }
      },
    },
    
    // Mobile view for demonstration (optional)
    {
      name: 'mobile-video',
      use: { 
        ...devices['iPhone 12'],
        launchOptions: {
          slowMo: 800,  // Slightly faster for mobile
        }
      },
    },
  ],

  // Development server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});