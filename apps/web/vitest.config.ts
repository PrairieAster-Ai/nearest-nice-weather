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
    // Parallel test execution
    threads: true,
    maxThreads: 4,
    minThreads: 2,
    // Enhanced test isolation
    isolate: true,
    // Test timeout
    testTimeout: 10000,
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