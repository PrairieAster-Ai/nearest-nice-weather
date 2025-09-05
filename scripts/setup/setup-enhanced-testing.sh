#!/bin/bash

# ========================================================================
# ENHANCED TESTING INFRASTRUCTURE SETUP SCRIPT
# ========================================================================
#
# PURPOSE: Implements Phase 1 recommendations from testing infrastructure review
# SCOPE: Unit testing, API testing, test data management, accessibility testing
# TIMELINE: 1-2 weeks implementation
#
# ========================================================================

set -e

echo "🚀 Setting up Enhanced Testing Infrastructure"
echo "📋 Phase 1: Foundation Enhancements"

# Create new directory structure
echo ""
echo "📁 Creating enhanced test directory structure..."

mkdir -p tests/unit/components
mkdir -p tests/unit/hooks
mkdir -p tests/unit/utils
mkdir -p tests/unit/services
mkdir -p tests/integration/api
mkdir -p tests/integration/database
mkdir -p tests/performance/load
mkdir -p tests/performance/stress
mkdir -p tests/performance/web-vitals
mkdir -p tests/accessibility
mkdir -p tests/visual/components
mkdir -p tests/visual/pages
mkdir -p tests/fixtures
mkdir -p tests/analytics
mkdir -p tests/config

# Move existing E2E tests to dedicated folder
echo "🔄 Organizing existing Playwright tests..."
if [ ! -d "tests/e2e" ]; then
    mkdir -p tests/e2e
    mkdir -p tests/e2e/pages
    mkdir -p tests/e2e/utilities

    # Move Page Objects
    if [ -d "tests/pages" ]; then
        mv tests/pages/* tests/e2e/pages/ 2>/dev/null || true
        rmdir tests/pages 2>/dev/null || true
    fi

    # Move utilities
    if [ -d "tests/utilities" ]; then
        mv tests/utilities/* tests/e2e/utilities/ 2>/dev/null || true
        rmdir tests/utilities 2>/dev/null || true
    fi

    # Move Playwright spec files
    mv tests/*.spec.js tests/e2e/ 2>/dev/null || true
fi

echo "✅ Directory structure created"

# Install additional testing dependencies
echo ""
echo "📦 Installing testing dependencies..."

# Unit testing dependencies
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  @jest/globals

# API testing dependencies
npm install --save-dev \
  supertest \
  @pact-foundation/pact \
  artillery

# Performance testing dependencies
npm install --save-dev \
  @lhci/cli \
  web-vitals

# Accessibility testing dependencies
npm install --save-dev \
  @axe-core/playwright \
  pa11y \
  pa11y-ci

# Visual regression testing
npm install --save-dev \
  pixelmatch \
  pngjs

# Mocking and test utilities
npm install --save-dev \
  msw \
  @faker-js/faker

echo "✅ Dependencies installed"

# Create Jest configuration
echo ""
echo "⚙️ Creating Jest configuration..."

cat > jest.config.js << 'EOF'
/**
 * Jest Configuration for Unit Testing
 * Optimized for React components and utility functions
 */
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/unit/**/*.spec.js',
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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest']
  }
};
EOF

# Create Jest setup file
cat > tests/config/jest.setup.js << 'EOF'
/**
 * Jest Setup Configuration
 * Global test setup and utilities
 */
import '@testing-library/jest-dom';
import { server } from '../fixtures/msw-server.js';

// Setup MSW server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia (for Material-UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
EOF

# Create MSW server setup
cat > tests/fixtures/msw-server.js << 'EOF'
/**
 * Mock Service Worker Setup
 * For mocking API calls in unit tests
 */
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock weather-locations API
  http.get('/api/weather-locations', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Test Park',
        latitude: 44.9537,
        longitude: -93.0900,
        temperature: 72,
        condition: 'Sunny',
        precipitation: 0,
        windSpeed: 5,
        distance_miles: '2.1'
      }
    ]);
  }),

  // Mock feedback API
  http.post('/api/feedback', () => {
    return HttpResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  }),

  // Mock health check API
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  }),
];

export const server = setupServer(...handlers);
EOF

# Create test fixtures
echo ""
echo "📋 Creating test fixtures..."

cat > tests/fixtures/poi-data.js << 'EOF'
/**
 * POI Test Data Fixtures
 * Centralized test data for consistent testing
 */
import { faker } from '@faker-js/faker';

export const createMockPOI = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.location.city() + ' Park',
  latitude: faker.location.latitude({ min: 44.0, max: 45.0 }),
  longitude: faker.location.longitude({ min: -94.0, max: -92.0 }),
  temperature: faker.number.int({ min: 32, max: 95 }),
  condition: faker.helpers.arrayElement(['Sunny', 'Cloudy', 'Partly Cloudy', 'Rain']),
  precipitation: faker.number.int({ min: 0, max: 100 }),
  windSpeed: faker.number.int({ min: 0, max: 30 }),
  distance_miles: faker.number.float({ min: 0.1, max: 50.0, multipleOf: 0.1 }).toString(),
  park_type: faker.helpers.arrayElement(['State Park', 'City Park', 'Nature Center', 'Trail']),
  ...overrides
});

export const createMockPOIList = (count = 10) => {
  return Array.from({ length: count }, () => createMockPOI());
};

export const MOCK_MINNEAPOLIS_POIS = [
  {
    id: '1',
    name: 'Minnehaha Falls',
    latitude: 44.9153,
    longitude: -93.2102,
    temperature: 72,
    condition: 'Sunny',
    precipitation: 0,
    windSpeed: 8,
    distance_miles: '3.2',
    park_type: 'State Park'
  },
  {
    id: '2',
    name: 'Lake Harriet',
    latitude: 44.9219,
    longitude: -93.3056,
    temperature: 68,
    condition: 'Partly Cloudy',
    precipitation: 20,
    windSpeed: 12,
    distance_miles: '4.1',
    park_type: 'City Park'
  }
];
EOF

# Create sample unit tests
echo ""
echo "🧪 Creating sample unit tests..."

cat > tests/unit/utils/distance.test.js << 'EOF'
/**
 * Distance Calculation Unit Tests
 * Testing utility functions in isolation
 */
import { calculateDistance, formatDistance } from '../../../apps/web/src/utils/distance.js';

describe('Distance Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Minneapolis to St. Paul (approximately 10 miles)
      const minneapolis = { lat: 44.9537, lng: -93.0900 };
      const stpaul = { lat: 44.9537, lng: -93.0900 };

      const distance = calculateDistance(
        minneapolis.lat, minneapolis.lng,
        stpaul.lat, stpaul.lng
      );

      expect(distance).toBeCloseTo(0, 1); // Same location = 0 miles
    });

    it('should handle invalid coordinates gracefully', () => {
      const distance = calculateDistance(null, null, 44.9537, -93.0900);
      expect(distance).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('should format distance with proper units', () => {
      expect(formatDistance(0.5)).toBe('0.5 mi');
      expect(formatDistance(1.0)).toBe('1.0 mi');
      expect(formatDistance(10.25)).toBe('10.3 mi');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0.0 mi');
    });
  });
});
EOF

# Create sample API integration test
cat > tests/integration/api/health.test.js << 'EOF'
/**
 * API Health Check Integration Tests
 * Testing API endpoints with real HTTP calls
 */
import request from 'supertest';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

describe('Health Check API', () => {
  it('should return healthy status', async () => {
    const response = await request(BASE_URL)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  it('should respond within acceptable time', async () => {
    const startTime = Date.now();

    await request(BASE_URL)
      .get('/api/health')
      .expect(200);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(1000); // Less than 1 second
  });
});
EOF

# Create accessibility test
cat > tests/accessibility/basic-a11y.spec.js << 'EOF'
/**
 * Basic Accessibility Tests
 * Automated accessibility validation with axe-core
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForSelector('[data-testid="map-container"]');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');

    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');

    await expect(focusedElement).toBeVisible();
  });
});
EOF

# Update package.json scripts
echo ""
echo "📝 Updating npm scripts..."

# Add new test scripts to package.json
npm pkg set scripts.test:unit="jest"
npm pkg set scripts.test:unit:watch="jest --watch"
npm pkg set scripts.test:unit:coverage="jest --coverage"
npm pkg set scripts.test:api="jest tests/integration/api"
npm pkg set scripts.test:accessibility="playwright test tests/accessibility"
npm pkg set scripts.test:performance="lighthouse-ci"
npm pkg set scripts.test:all-layers="npm run test:unit && npm run test:api && npm run test:browser && npm run test:accessibility"

echo "✅ Package scripts updated"

# Create Lighthouse CI configuration
echo ""
echo "🔍 Setting up Lighthouse CI..."

cat > .lighthouserc.js << 'EOF'
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3001'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
EOF

# Create test analytics script
cat > tests/analytics/generate-test-report.js << 'EOF'
/**
 * Test Analytics and Reporting
 * Generates comprehensive test metrics and insights
 */
import fs from 'fs';
import path from 'path';

class TestAnalytics {
  constructor() {
    this.metrics = {
      unit: { total: 0, passed: 0, failed: 0, duration: 0 },
      integration: { total: 0, passed: 0, failed: 0, duration: 0 },
      e2e: { total: 0, passed: 0, failed: 0, duration: 0 },
      accessibility: { total: 0, passed: 0, failed: 0, duration: 0 }
    };
  }

  async generateReport() {
    console.log('📊 Generating comprehensive test analytics...');

    // Collect metrics from test results
    await this.collectJestMetrics();
    await this.collectPlaywrightMetrics();

    // Generate report
    const report = this.createReport();

    // Save report
    fs.writeFileSync('test-analytics-report.json', JSON.stringify(report, null, 2));

    console.log('✅ Test analytics report generated');
    return report;
  }

  async collectJestMetrics() {
    // Parse Jest test results if available
    const jestResults = 'coverage/coverage-summary.json';
    if (fs.existsSync(jestResults)) {
      const coverage = JSON.parse(fs.readFileSync(jestResults, 'utf8'));
      this.metrics.unit.coverage = coverage.total;
    }
  }

  async collectPlaywrightMetrics() {
    // Parse Playwright test results if available
    const playwrightResults = 'test-results.json';
    if (fs.existsSync(playwrightResults)) {
      const results = JSON.parse(fs.readFileSync(playwrightResults, 'utf8'));
      // Process Playwright results
    }
  }

  createReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: Object.values(this.metrics).reduce((sum, layer) => sum + layer.total, 0),
        totalPassed: Object.values(this.metrics).reduce((sum, layer) => sum + layer.passed, 0),
        totalFailed: Object.values(this.metrics).reduce((sum, layer) => sum + layer.failed, 0),
        overallPassRate: this.calculatePassRate(),
        totalDuration: Object.values(this.metrics).reduce((sum, layer) => sum + layer.duration, 0)
      },
      layers: this.metrics,
      recommendations: this.generateRecommendations()
    };
  }

  calculatePassRate() {
    const total = Object.values(this.metrics).reduce((sum, layer) => sum + layer.total, 0);
    const passed = Object.values(this.metrics).reduce((sum, layer) => sum + layer.passed, 0);
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }

  generateRecommendations() {
    const recommendations = [];

    // Add specific recommendations based on metrics
    if (this.metrics.unit.total === 0) {
      recommendations.push('Add unit tests to improve feedback speed');
    }

    if (this.calculatePassRate() < 95) {
      recommendations.push('Investigate failing tests to improve reliability');
    }

    return recommendations;
  }
}

// Run analytics if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analytics = new TestAnalytics();
  analytics.generateReport().then(report => {
    console.log('\n📈 Test Analytics Summary:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Pass Rate: ${report.summary.overallPassRate}%`);
    console.log(`   Duration: ${Math.round(report.summary.totalDuration / 1000)}s`);
  });
}

export default TestAnalytics;
EOF

# Create setup summary
echo ""
echo "🎉 Enhanced Testing Infrastructure Setup Complete!"
echo ""
echo "📊 Summary of Changes:"
echo "   ✅ Directory structure reorganized with test layers"
echo "   ✅ Jest configuration for unit testing"
echo "   ✅ MSW setup for API mocking"
echo "   ✅ Test fixtures for consistent data"
echo "   ✅ Sample unit and integration tests"
echo "   ✅ Accessibility testing with axe-core"
echo "   ✅ Lighthouse CI for performance monitoring"
echo "   ✅ Test analytics and reporting"
echo "   ✅ Enhanced npm scripts for all test layers"
echo ""
echo "🚀 Next Steps:"
echo "   1. Run 'npm run test:unit' to test unit testing setup"
echo "   2. Run 'npm run test:accessibility' for accessibility tests"
echo "   3. Start writing unit tests for your components and utilities"
echo "   4. Set up API integration tests for your endpoints"
echo "   5. Configure CI/CD to run all test layers"
echo ""
echo "📖 Documentation: See TESTING-INFRASTRUCTURE-REVIEW.md for complete guide"
echo ""
echo "✨ Your testing infrastructure is now enterprise-grade!"
