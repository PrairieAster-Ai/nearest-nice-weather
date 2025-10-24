# Playwright Testing Best Practices Guide

## 🎯 Executive Summary

This guide documents proven Playwright testing patterns for the Nearest Nice Weather project, focusing on performance monitoring, business model validation, and production deployment verification.

## 📋 Testing Architecture Overview

### Core Configuration
- **Main Config**: `playwright.config.ts` - MCP-optimized with environment variables
- **Workers**: 4 parallel workers (configurable via `PLAYWRIGHT_WORKERS`)
- **Base URL**: Configurable via `PLAYWRIGHT_BASE_URL`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

### Test Categories
1. **Performance Testing** - Load times, API response monitoring
2. **Business Model Validation** - B2C outdoor recreation focus
3. **Visual Regression** - UI consistency across deployments
4. **Functional Testing** - Core user workflows
5. **Security Testing** - API endpoint validation

## 🚀 Best Practices by Use Case

### 1. Performance Monitoring Tests

**Pattern**: Real-time performance measurement with thresholds

```typescript
test('Performance monitoring with thresholds', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  await page.waitForSelector('[data-testid="main-content"]');

  const loadTime = Date.now() - startTime;

  // 10s warning, 20s blocker thresholds
  if (loadTime > 10000) {
    console.warn('⚠️ PERFORMANCE WARNING: Load time exceeding 10 seconds');
  }
  if (loadTime > 20000) {
    throw new Error('🚫 CRITICAL BLOCKER: Load time exceeding 20 seconds');
  }

  expect(loadTime).toBeLessThan(10000);
});
```

**Key Features**:
- Console monitoring for errors/warnings
- Network request monitoring
- Performance API integration
- Threshold-based validation

### 2. Production Deployment Validation

**Pattern**: Comprehensive production health checks

```typescript
test.describe('Production Validation', () => {
  const BASE_URL = 'https://portfolio-factory.vercel.app';

  test('End-to-end workflow validation', async ({ page }) => {
    await page.goto(BASE_URL);

    // Test critical user path
    await page.fill('[data-testid="job-description"]', 'Full Stack Developer');
    await page.click('[data-testid="generate-assessment"]');

    // Monitor assessment generation
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="assessment-results"]', { timeout: 30000 });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // Target performance
  });
});
```

### 3. Business Model Validation

**Pattern**: B2C outdoor recreation focus validation

```typescript
test('Business model alignment validation', async ({ page }) => {
  await page.goto('/');

  // Verify B2C outdoor recreation content
  await expect(page.getByText(/outdoor|recreation|parks|trails/i)).toBeVisible();

  // Ensure no B2B tourism content
  await expect(page.getByText(/tourism operator|business dashboard/i)).not.toBeVisible();

  // Validate POI data source
  const response = await page.request.get('/api/poi-locations-with-weather?limit=5');
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.count).toBeGreaterThan(0);
});
```

### 4. Page Object Model Pattern

**Pattern**: Maintainable test organization

```typescript
// pages/MapPage.js
export class MapPage {
  constructor(page) {
    this.page = page;
    this.mapContainer = page.locator('[data-testid="map-container"]');
    this.poiMarkers = page.locator('.poi-marker');
  }

  async expectMapVisible() {
    await expect(this.mapContainer).toBeVisible();
  }

  async expectPOIMarkersVisible() {
    await this.poiMarkers.first().waitFor();
    return await this.poiMarkers.count();
  }
}
```

### 5. Test Isolation and Setup

**Pattern**: Complete test independence

```typescript
test.beforeEach(async ({ page, context }) => {
  // Clear all state
  await context.clearCookies();
  await context.clearPermissions();

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Set consistent geolocation
  await context.setGeolocation({ latitude: 44.9537, longitude: -93.0900 });
  await context.grantPermissions(['geolocation']);

  await page.goto('/');
});
```

### 6. Error Monitoring and Debugging

**Pattern**: Comprehensive error capture

```typescript
test.beforeEach(async ({ page }) => {
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Console Error: ${msg.text()}`);
    }
  });

  // Monitor network failures
  page.on('response', response => {
    if (response.status() >= 400) {
      console.error(`Network Error: ${response.url()} - ${response.status()}`);
    }
  });

  // Monitor JavaScript exceptions
  page.on('pageerror', error => {
    console.error(`Page Error: ${error.message}`);
  });
});
```

## 📊 Memory Bank Integration

### Test Context Storage

```json
{
  "timestamp": "2025-09-19",
  "context": "playwright-test-run",
  "businessModel": "B2C outdoor recreation",
  "performanceBenchmarks": {
    "assessmentGeneration": "< 5 seconds",
    "pageLoad": "< 3 seconds",
    "apiResponse": "< 500ms"
  },
  "knownIssues": [
    {
      "issue": "Assessment generation timeout",
      "solution": "Check O(n²) algorithm optimization",
      "frequency": "resolved"
    }
  ]
}
```

## 🔧 Common Commands and Scripts

```bash
# Standard test execution
npm run test:smoke              # Quick smoke tests
npm run test:critical           # Critical path tests
npm run test:performance        # Performance validation

# MCP-enhanced testing
npm run test:mcp                # Interactive UI testing
npm run test:debug              # Step-by-step debugging
npm run test:record             # Generate new tests

# Production validation
PLAYWRIGHT_BASE_URL=https://portfolio-factory.vercel.app npm run test:production
```

## 🎯 Test Tags and Organization

### Tag System
- `@smoke` - Quick validation tests (< 30 seconds)
- `@critical` - Essential functionality tests
- `@performance` - Performance monitoring tests
- `@visual` - Visual regression tests
- `@security` - Security validation tests

### File Organization
```
tests/
├── e2e/                    # End-to-end user workflows
├── api/                    # API endpoint testing
├── performance/            # Performance monitoring
├── visual/                 # Visual regression
├── pages/                  # Page Object Models
└── utils/                  # Test utilities
```

## 📈 Performance Thresholds

| Metric | Warning | Blocker | Target |
|--------|---------|---------|---------|
| Page Load | 10s | 20s | < 3s |
| Assessment Generation | 10s | 20s | < 5s |
| API Response | 1s | 5s | < 500ms |
| Time to Interactive | 5s | 10s | < 2s |

## 🔍 Debugging and Troubleshooting

### Common Issues and Solutions

1. **Test Timeouts**
   - Increase timeout for slow operations
   - Check network connectivity
   - Verify element selectors

2. **Flaky Tests**
   - Add proper wait conditions
   - Ensure test isolation
   - Use stable locators

3. **Performance Issues**
   - Monitor background processes
   - Check memory usage
   - Validate caching behavior

### Debug Mode Commands

```bash
# Run with debug output
npm run test:debug -- --headed --debug

# Generate trace files
npm run test -- --trace on

# Record test interactions
npm run test:record
```

## 🚀 Deployment Integration

### CI/CD Pipeline Integration

```yaml
# GitHub Actions example
- name: Run Playwright Tests
  run: |
    npm ci
    npx playwright install
    npm run test:production
  env:
    PLAYWRIGHT_BASE_URL: https://portfolio-factory.vercel.app
```

### Pre-deployment Validation

```bash
# Validate before deployment
npm run test:smoke
npm run test:critical
npm run test:performance

# Post-deployment validation
PLAYWRIGHT_BASE_URL=https://portfolio-factory.vercel.app npm run test:production
```

## 📝 Documentation Maintenance

This guide should be updated when:
- New test patterns are established
- Performance thresholds change
- Business requirements evolve
- New deployment environments are added

---

**Last Updated**: 2025-09-19
**Version**: 1.0
**Maintainer**: Claude Code AI Assistant
