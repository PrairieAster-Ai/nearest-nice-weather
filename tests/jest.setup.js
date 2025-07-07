/**
 * Jest Setup for Nearest Nice Weather Tests
 * 
 * Global test configuration and utilities
 */

// Load environment variables from .env file
require('dotenv').config({ path: '../.env' });

// Set test timeout for database operations
jest.setTimeout(30000);

// Global test environment setup
beforeAll(() => {
  // Ensure we're in test mode
  process.env.NODE_ENV = 'test';
  
  // Log test environment info
  console.debug('🧪 Test Environment Setup');
  console.debug(`Database URL configured: ${!!process.env.DATABASE_URL}`);
  console.debug(`API Base URL: ${process.env.API_BASE_URL || 'https://www.nearestniceweather.com'}`);
});

// Global cleanup
afterAll(() => {
  // Any global cleanup needed
});

// Custom matchers for common validations
expect.extend({
  toBeValidPostgreSQLUrl(received) {
    const pass = /^postgresql:\/\/[^:]+:[^@]+@[^\/]+\/\w+/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid PostgreSQL URL`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid PostgreSQL URL`,
        pass: false,
      };
    }
  },

  toBeValidJSON(received) {
    try {
      JSON.parse(received);
      return {
        message: () => `expected ${received} not to be valid JSON`,
        pass: true,
      };
    } catch (e) {
      return {
        message: () => `expected ${received} to be valid JSON but got error: ${e.message}`,
        pass: false,
      };
    }
  }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.debug('Unhandled Rejection at:', promise, 'reason:', reason);
});