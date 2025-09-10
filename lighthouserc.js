module.exports = {
  ci: {
    // Build directory for Lighthouse analysis
    buildDir: './apps/web/dist',

    // Collection settings
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/about',
      ],
      startServerCommand: 'cd apps/web && npm run preview',
      startServerReadyPattern: 'ready in',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        // Mobile-first testing (primary use case)
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638,
          cpuSlowdownMultiplier: 4
        },
        // Categories to audit
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
          'pwa'
        ]
      }
    },

    // Performance budgets aligned with outdoor recreation app needs
    budgets: [
      {
        path: '/*',
        timings: [
          {
            metric: 'interactive',
            budget: 5000,  // 5s for outdoor/mobile use case
            tolerance: 1000
          },
          {
            metric: 'first-meaningful-paint',
            budget: 2000,  // 2s for immediate feedback
            tolerance: 500
          },
          {
            metric: 'largest-contentful-paint',
            budget: 4000,  // 4s for main content (map/POIs)
            tolerance: 1000
          }
        ],
        resourceSizes: [
          {
            resourceType: 'script',
            budget: 400,  // 400KB JS budget
            tolerance: 50
          },
          {
            resourceType: 'stylesheet',
            budget: 50,   // 50KB CSS budget
            tolerance: 10
          },
          {
            resourceType: 'image',
            budget: 200,  // 200KB images budget
            tolerance: 50
          },
          {
            resourceType: 'total',
            budget: 800,  // 800KB total budget
            tolerance: 100
          }
        ]
      }
    ],

    // Assertions for quality gates
    assert: {
      assertions: {
        'categories:performance': ['warn', {minScore: 0.8}],
        'categories:accessibility': ['warn', {minScore: 0.9}],
        'categories:best-practices': ['warn', {minScore: 0.8}],
        'categories:seo': ['warn', {minScore: 0.8}],
        'categories:pwa': ['warn', {minScore: 0.7}],

        // Outdoor recreation app specific metrics
        'audits:speed-index': ['warn', {maxNumericValue: 4000}],
        'audits:interactive': ['warn', {maxNumericValue: 5000}],
        'audits:first-contentful-paint': ['warn', {maxNumericValue: 2000}],
        'audits:largest-contentful-paint': ['warn', {maxNumericValue: 4000}],

        // Mobile-critical audits
        'audits:viewport': 'error',
        'audits:content-width': 'error',
        'audits:tap-targets': 'warn',
        'audits:font-size': 'warn'
      }
    },

    // Upload and storage
    upload: {
      target: 'temporary-public-storage',
      // Alternative: Configure GitHub Pages or custom storage
      // githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN
    },

    // Server configuration (if running own LHCI server)
    server: {
      // Uncomment if using dedicated LHCI server
      // baseURL: 'https://lhci.nearestniceweather.com',
      // token: process.env.LHCI_BUILD_TOKEN
    }
  }
};
