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
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
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