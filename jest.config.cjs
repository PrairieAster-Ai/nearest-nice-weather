/**
 * Jest Configuration for Unit Testing
 * Enhanced setup with import.meta support
 */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/tests/config/combinedTransform.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.[jt]s?(x)',
    '<rootDir>/tests/unit/**/*.spec.[jt]s?(x)',
    '<rootDir>/tests/integration/**/*.test.[jt]s?(x)',
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
    '^@mui/material$': '<rootDir>/apps/web/node_modules/@mui/material',
    '^@mui/material/(.*)$': '<rootDir>/apps/web/node_modules/@mui/material/$1',
  },
  moduleDirectories: ['node_modules', 'apps/web/node_modules'],
};