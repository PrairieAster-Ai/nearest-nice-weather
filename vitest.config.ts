import { defineConfig } from 'vitest/config'

/**
 * Vitest Configuration for Nearest Nice Weather
 *
 * Supports ES6 modules and comprehensive testing for:
 * - Shared modules (weather filters, logging)
 * - Vercel serverless functions (when testable)
 * - Utility functions
 *
 * Part of Phase 0: Code Quality Prerequisites (CQ-1, CQ-2)
 */
export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Test file patterns
    include: [
      'shared/**/__tests__/**/*.test.js',
      'shared/**/*.test.js',
      'apps/web/api/**/__tests__/**/*.test.js',
      'tests/acceptance/**/*.test.js'
    ],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.vercel/**',
      '**/tests/performance/**',
      '**/tests/unit/utils/source-coverage.test.js'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'shared/**/*.js',
        'apps/web/api/**/*.js'
      ],
      exclude: [
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/.vercel/**'
      ],
      // Coverage thresholds (Phase 0 targets)
      thresholds: {
        'shared/weather/filters.js': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        }
      }
    },

    // Globals (enables describe, it, expect without imports)
    globals: true,

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,

    // Verbose output
    reporters: ['verbose']
  }
})
