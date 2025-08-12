/**
 * Jest Environment Setup
 * Sets up environment variables for Vite compatibility
 */

// Set up Vite environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.VITE_API_BASE_URL = process.env.VITE_API_BASE_URL || '/api';
process.env.VITE_APP_TITLE = 'Nearest Nice Weather - Test';

// Mock import.meta globally for tests that still use it
global.importMeta = {
  env: {
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
    VITE_API_BASE_URL: '/api',
    NODE_ENV: 'test',
  }
};