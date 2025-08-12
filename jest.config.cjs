/**
 * Jest Configuration for Unit Testing
 * Simplified setup for current dependencies
 */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/unit/**/*.spec.js',
    '<rootDir>/tests/integration/**/*.test.js',
  ],
  collectCoverageFrom: [
    'apps/web/src/**/*.{js,jsx,ts,tsx}',
    '!apps/web/src/**/*.d.ts',
    '!apps/web/src/main.tsx',
    '!apps/web/src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50, // Lower thresholds for initial testing
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
  },
};