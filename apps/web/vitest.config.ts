import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // React 18 LTS with classic JSX runtime for testing stability
      jsxRuntime: 'automatic'
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Exclude Playwright E2E tests from Vitest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.js',  // Playwright E2E tests
      '**/*.spec.ts',  // Playwright E2E tests
      '**/tests/e2e/**',
      '**/tests/**/*.spec.{js,ts}',  // Any spec files in tests directory
    ],
    // Disable parallel execution for hook tests to prevent environment conflicts
    threads: false,
    pool: 'forks',
    // Enhanced test isolation
    isolate: true,
    // Test timeout
    testTimeout: 15000,
    // Additional jsdom options
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        pretendToBeVisual: true
      }
    },
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Measure the WHOLE source tree, not just files imported by tests, so the
      // reported number reflects true codebase coverage. Untested files count
      // as 0% rather than being silently omitted.
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        'src/App.simple.tsx', // throwaway scaffold, not shipped
        'dist/',
      ],
      // Thresholds are a ratchet set just under current whole-codebase coverage
      // so they prevent regression without spuriously failing. Raise them as
      // tests are added (do not lower). NB: vitest 4 dropped the `global` nesting
      // — thresholds live directly under `thresholds`.
      thresholds: {
        branches: 37,
        functions: 42,
        lines: 36,
        statements: 36
      }
    },
    // Watch mode configuration
    watch: false,
  },
  resolve: {
    alias: {
      '@': '/src',
      'react': 'react',
      'react-dom': 'react-dom'
    },
    dedupe: ['react', 'react-dom']
  }
})
