# Testing Infrastructure

This directory contains the enhanced testing architecture for the Nearest Nice Weather application. The testing suite is organized into multiple layers to ensure comprehensive coverage and reliable automated testing.

## Directory Structure

```
tests/
├── e2e/                    # End-to-end Playwright tests (moved from root)
├── unit/                   # Unit tests with Jest
│   └── utils/              # Testing utility functions
├── integration/            # Integration tests
│   └── api/                # API endpoint testing
├── performance/            # Performance and Core Web Vitals tests
├── accessibility/          # WCAG compliance and a11y testing
├── visual/                 # Visual regression testing
├── fixtures/               # Test data and mock objects
├── analytics/              # Test metrics and reporting
└── config/                 # Test configuration files
```

## Test Commands

### Unit Testing
```bash
npm run test:unit              # Run all unit tests
npm run test:unit:watch        # Run in watch mode
npm run test:unit:coverage     # Generate coverage report
```

### Integration Testing
```bash
npm run test:integration       # Run integration tests
npm run test:api              # Run API-specific tests
```

### End-to-End Testing
```bash
npm run test:browser          # Run all E2E tests
npm run test:smoke            # Run critical smoke tests
npm run test:critical         # Run business-critical tests
```

### Performance Testing
```bash
npm run test:performance      # Run Core Web Vitals tests
npm run test:lighthouse       # Run Lighthouse CI
```

### Accessibility Testing
```bash
npm run test:accessibility    # Run WCAG compliance tests
```

### Visual Regression Testing
```bash
npm run test:visual           # Run visual regression tests
```

### Test Analytics
```bash
npm run test:analytics        # Start test analytics dashboard
npm run test:dashboard        # Alternative command for dashboard
```

## Test Analytics Dashboard

Access the real-time test analytics dashboard at `http://localhost:3060` after running:

```bash
npm run test:dashboard
```

The dashboard provides:
- Real-time test metrics and pass rates
- Performance trending
- Failure analysis
- Test history and coverage reports

## Coverage Requirements

- **Unit Tests**: 70% minimum coverage
- **API Integration**: All endpoints tested
- **E2E Critical Paths**: 100% coverage of user journeys
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals within "Good" thresholds

## Best Practices

### Test Organization
- Follow the Page Object Model for E2E tests
- Use semantic locators (data-testid, ARIA roles)
- Implement proper test isolation and cleanup
- Centralize test data in fixtures

### Performance Standards
- LCP (Largest Contentful Paint): < 2.5s (Good), < 4s (Acceptable)
- FID (First Input Delay): < 100ms (Good), < 300ms (Acceptable)
- CLS (Cumulative Layout Shift): < 0.1 (Good), < 0.25 (Acceptable)

### Accessibility Standards
- WCAG 2.1 AA compliance required
- Color contrast ratios must meet standards
- Keyboard navigation fully functional
- Screen reader compatibility verified

## CI/CD Integration

Tests are integrated with the deployment pipeline:

1. **Pre-commit**: Unit tests and linting
2. **PR Validation**: Full test suite execution
3. **Pre-deployment**: Performance and accessibility validation
4. **Post-deployment**: Smoke tests and monitoring

## Troubleshooting

### Common Issues

**Jest Tests Not Running**
```bash
npm install jest @jest/globals --save-dev
```

**Playwright Tests Failing**
```bash
npx playwright install
npm run test:browser:headed  # Debug with browser visible
```

**Performance Tests Timing Out**
```bash
# Ensure development server is running
npm start
# Then run performance tests
npm run test:performance
```

**Visual Regression Differences**
```bash
# Update baseline screenshots
npx playwright test --update-snapshots
```

## Contributing

When adding new tests:

1. Place unit tests in `tests/unit/`
2. Add API tests to `tests/integration/api/`
3. Use Page Object Model for new E2E features
4. Include accessibility tests for new UI components
5. Update test analytics for custom metrics

## Monitoring

Test metrics are automatically collected and can be viewed:

- **Real-time**: Test analytics dashboard
- **Historical**: `test-results/` directory
- **CI Reports**: GitHub Actions artifacts
- **Performance**: Lighthouse CI reports

---

For more details on specific testing categories, refer to the documentation in each subdirectory.
