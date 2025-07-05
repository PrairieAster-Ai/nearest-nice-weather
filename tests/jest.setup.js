/**
 * Jest Setup for Nearest Nice Weather Tests
 * 
 * Global test configuration and utilities
 */

// Set test timeout for database operations
jest.setTimeout(30000);

// Global test environment setup
beforeAll(() => {
  // Ensure we're in test mode
  process.env.NODE_ENV = 'test';
  
  // Log test environment info
  console.log('🧪 Test Environment Setup');
  console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
  console.log(`API Base URL: ${process.env.API_BASE_URL || 'https://www.nearestniceweather.com'}`);
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
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});