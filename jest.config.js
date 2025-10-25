/**
 * Jest Configuration for Nearest Nice Weather
 *
 * Supports ES6 modules and comprehensive testing for:
 * - Shared modules (weather filters, logging)
 * - Vercel serverless functions
 * - Utility functions
 *
 * Part of Phase 0: Code Quality Prerequisites (CQ-1, CQ-2)
 */

export default {
  // Use ES6 modules
  testEnvironment: 'node',
  transform: {},

  // Test file patterns - exclude performance tests
  testMatch: [
    '**/shared/**/__tests__/**/*.test.js',
    '**/apps/web/api/**/__tests__/**/*.test.js'
  ],

  // Exclude problematic test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.vercel/',
    'tests/performance/',
    'tests/unit/utils/source-coverage.test.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'shared/**/*.js',
    'apps/web/api/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.vercel/**'
  ],

  // Coverage thresholds (Phase 0 targets)
  coverageThreshold: {
    'shared/weather/filters.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },

  // Module resolution
  moduleFileExtensions: ['js', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  // Verbose output for better debugging
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true
}
