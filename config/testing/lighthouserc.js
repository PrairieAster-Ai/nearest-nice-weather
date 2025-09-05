module.exports = {
  ci: {
    collect: {
      // Test against local build for consistent results
      startServerCommand: 'npm run preview --workspace=@nearest-nice-weather/web',
      url: ['http://localhost:4173'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        // Focus on performance metrics that matter for our weather app
        onlyCategories: ['performance', 'best-practices', 'seo'],
        skipAudits: [
          'canonical', // We handle this differently in our SPA
          'crawlable-anchors', // React Router handles navigation
        ],
      },
    },
    assert: {
      // Performance budgets aligned with weather app requirements
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // Core Web Vitals thresholds
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],

        // Resource loading budgets
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],

        // Bundle size constraints
        'total-byte-weight': ['warn', { maxNumericValue: 1500000 }], // 1.5MB
        'unused-javascript': ['warn', { maxNumericValue: 200000 }],  // 200KB
        'render-blocking-resources': ['warn', { maxNumericValue: 100 }],

        // Weather app specific performance
        'network-requests': ['warn', { maxNumericValue: 20 }],
        'dom-size': ['warn', { maxNumericValue: 1000 }],
        'bootup-time': ['warn', { maxNumericValue: 4000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
      // Optional: Configure permanent storage
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
    },
    server: {
      // Lighthouse CI server configuration (if using permanent storage)
      // port: 9001,
      // storage: {
      //   storageMethod: 'sql',
      //   sqlDialect: 'sqlite',
      //   sqlDatabasePath: './lhci.db',
      // },
    },
  },
};
