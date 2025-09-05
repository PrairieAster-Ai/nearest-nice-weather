/**
 * Lighthouse CI Configuration
 * Performance testing and Core Web Vitals monitoring
 */

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Server ready at',
      url: [
        'http://localhost:3001',
        'http://localhost:3001/?lat=44.9537&lng=-93.0900',
        'http://localhost:3001/?temperature=mild&precipitation=none'
      ],
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        preset: 'desktop',
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // Additional performance metrics
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        'server-response-time': ['warn', { maxNumericValue: 600 }],

        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 50000 }],
        'modern-image-formats': ['warn', {}],

        // Accessibility requirements
        'color-contrast': ['error', {}],
        'focus-traps': ['error', {}],
        'focusable-controls': ['error', {}],
        'heading-order': ['warn', {}],

        // Best practices
        'uses-https': ['error', {}],
        'is-on-https': ['off', {}], // Disabled for localhost testing
        'uses-http2': ['warn', {}],
        'no-vulnerable-libraries': ['error', {}]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    wizard: {
      preset: 'desktop'
    }
  }
};
