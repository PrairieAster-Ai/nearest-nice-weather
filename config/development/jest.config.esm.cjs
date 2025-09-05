/**
 * Enhanced Jest Configuration for ES Module Support
 * Handles import.meta, TypeScript, and React components
 */
module.exports = {
  testEnvironment: 'jsdom',
  
  // Use custom transforms in specific order
  transform: {
    // First apply import.meta transform
    '^.+\\.(ts|tsx|js|jsx)$': [
      '<rootDir>/tests/config/importMetaTransform.js'
    ],
  },
  
  // Then use babel-jest for final transpilation
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  setupFilesAfterEnv: [
    '<rootDir>/tests/config/jest.setup.js',
    '<rootDir>/tests/config/jest.env.js'
  ],
  
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.[jt]s?(x)',
    '<rootDir>/tests/integration/**/*.test.[jt]s?(x)',
  ],
  
  moduleNameMapper: {
    // Handle path aliases
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    // Mock CSS imports
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js',
    // Mock static assets
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/mocks/fileMock.js',
  },
  
  collectCoverageFrom: [
    'apps/web/src/**/*.{js,jsx,ts,tsx}',
    '!apps/web/src/**/*.d.ts',
    '!apps/web/src/**/*.stories.{js,jsx,ts,tsx}',
    '!apps/web/src/main.tsx',
    '!apps/web/src/vite-env.d.ts',
    '!apps/web/src/test/**/*',
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  },
  
  globals: {
    'ts-jest': {
      useESM: true,
    }
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Collect coverage even if tests fail
  collectCoverage: false,
  
  // Verbose output for better debugging
  verbose: true,
};