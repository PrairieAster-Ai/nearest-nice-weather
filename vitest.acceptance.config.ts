import { defineConfig } from 'vitest/config'

/**
 * Acceptance / smoke test config for Nearest Nice Weather.
 *
 * These tests hit a RUNNING API (localhost:4000, preview, or production) chosen
 * via TEST_ENV — they require a live server and are NOT part of `test:unit`.
 *
 * Run with:
 *   npm run test:acceptance              # defaults to TEST_ENV=localhost
 *   npm run test:acceptance:preview
 *   npm run test:acceptance:production
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/acceptance/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.vercel/**'],
    globals: true,
    // Network round-trips need more headroom than unit tests
    testTimeout: 30000,
    reporters: ['verbose']
  }
})
