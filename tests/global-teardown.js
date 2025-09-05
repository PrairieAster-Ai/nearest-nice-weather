/**
 * Global Test Teardown for Nearest Nice Weather
 * Cleanup, Reporting, and MCP Integration
 */

export default async function globalTeardown(config) {
  console.log('🏁 Starting Global Test Teardown...');

  // 1. Generate Test Report Summary
  console.log('📊 Generating Test Report Summary...');
  await generateTestSummary();

  // 2. Archive Performance Metrics
  console.log('📈 Archiving Performance Metrics...');
  await archivePerformanceData();

  // 3. Clean up Test Artifacts
  console.log('🧹 Cleaning up Test Artifacts...');
  await cleanupTestArtifacts();

  // 4. MCP Integration - Update Memory Bank
  console.log('🧠 Updating Memory Bank with Test Results...');
  await updateMemoryBank();

  // 5. Generate GitHub Integration Data
  console.log('📝 Preparing GitHub Integration Data...');
  await generateGitHubIntegrationData();

  console.log('✅ Global Teardown Complete!');
}

/**
 * Generate Test Summary Report
 * Creates comprehensive summary of test run results
 */
async function generateTestSummary() {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read test results
    let testResults = {};
    if (fs.existsSync('test-results/results.json')) {
      testResults = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'));
    }

    // Create summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.stats?.total || 0,
      passed: testResults.stats?.passed || 0,
      failed: testResults.stats?.failed || 0,
      skipped: testResults.stats?.skipped || 0,
      duration: testResults.stats?.duration || 0,

      // Business context validation
      businessModel: 'B2C outdoor recreation platform',
      primaryTable: 'poi_locations',

      // Environment information
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        baseURL: 'http://localhost:3001'
      },

      // Test categories
      categories: {
        visualRegression: 0,
        functionalTesting: 0,
        performanceTesting: 0,
        accessibilityTesting: 0,
        businessValidation: 0
      }
    };

    // Count test categories (basic heuristic)
    if (testResults.suites) {
      testResults.suites.forEach(suite => {
        const suiteName = suite.title.toLowerCase();
        if (suiteName.includes('visual')) summary.categories.visualRegression++;
        if (suiteName.includes('poi') || suiteName.includes('functional')) summary.categories.functionalTesting++;
        if (suiteName.includes('performance')) summary.categories.performanceTesting++;
        if (suiteName.includes('accessibility') || suiteName.includes('a11y')) summary.categories.accessibilityTesting++;
        if (suiteName.includes('business') || suiteName.includes('model')) summary.categories.businessValidation++;
      });
    }

    // Save summary
    fs.writeFileSync('test-results/test-summary.json', JSON.stringify(summary, null, 2));

    // Generate human-readable report
    const reportText = generateHumanReadableReport(summary);
    fs.writeFileSync('test-results/test-summary.md', reportText);

  } catch (error) {
    console.error(`❌ Test summary generation failed: ${error.message}`);
  }
}

/**
 * Archive Performance Metrics
 * Stores performance data for trend analysis
 */
async function archivePerformanceData() {
  try {
    const fs = await import('fs');

    // Create performance archive directory
    const archiveDir = 'test-results/performance-archive';
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Archive current performance data with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (fs.existsSync('test-results/performance-baseline.json')) {
      fs.copyFileSync(
        'test-results/performance-baseline.json',
        `${archiveDir}/performance-${timestamp}.json`
      );
    }

    // Generate performance trend data
    const archiveFiles = fs.readdirSync(archiveDir)
      .filter(file => file.startsWith('performance-'))
      .sort();

    if (archiveFiles.length > 1) {
      const trend = {
        timestamp: new Date().toISOString(),
        dataPoints: archiveFiles.length,
        latestRun: timestamp,
        trend: 'stable' // Could be enhanced with actual trend analysis
      };

      fs.writeFileSync('test-results/performance-trend.json', JSON.stringify(trend, null, 2));
    }

  } catch (error) {
    console.error(`❌ Performance archiving failed: ${error.message}`);
  }
}

/**
 * Clean up Test Artifacts
 * Removes temporary files and optimizes storage
 */
async function cleanupTestArtifacts() {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Clean old screenshots (keep last 10 runs)
    if (fs.existsSync('screenshots')) {
      const screenshots = fs.readdirSync('screenshots')
        .map(file => ({
          name: file,
          path: path.join('screenshots', file),
          stats: fs.statSync(path.join('screenshots', file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      // Keep only the 20 most recent screenshots
      if (screenshots.length > 20) {
        screenshots.slice(20).forEach(file => {
          fs.unlinkSync(file.path);
        });
        console.log(`🗑️ Cleaned up ${screenshots.length - 20} old screenshots`);
      }
    }

    // Clean old video recordings (keep last 5 runs)
    if (fs.existsSync('test-results')) {
      const videos = fs.readdirSync('test-results')
        .filter(file => file.endsWith('.webm'))
        .map(file => ({
          name: file,
          path: path.join('test-results', file),
          stats: fs.statSync(path.join('test-results', file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      if (videos.length > 5) {
        videos.slice(5).forEach(file => {
          fs.unlinkSync(file.path);
        });
        console.log(`🗑️ Cleaned up ${videos.length - 5} old video recordings`);
      }
    }

  } catch (error) {
    console.error(`❌ Artifact cleanup failed: ${error.message}`);
  }
}

/**
 * Update Memory Bank with Test Results
 * Integrates test outcomes with MCP Memory Bank
 */
async function updateMemoryBank() {
  try {
    const fs = await import('fs');

    // Prepare memory bank update data
    const memoryUpdate = {
      timestamp: new Date().toISOString(),
      context: 'playwright-test-run',
      businessModel: 'B2C outdoor recreation',

      // Test outcomes
      testResults: fs.existsSync('test-results/test-summary.json')
        ? JSON.parse(fs.readFileSync('test-results/test-summary.json', 'utf8'))
        : null,

      // Common issues and solutions
      knownIssues: [
        {
          issue: 'Map markers not loading',
          solution: 'Check POI API endpoint and poi_locations table',
          frequency: 'common'
        },
        {
          issue: 'Auto-expand not working',
          solution: 'Verify user location and distance calculation',
          frequency: 'occasional'
        }
      ],

      // Performance benchmarks
      performanceBenchmarks: {
        mapLoadTime: '< 3 seconds',
        poiApiResponse: '< 500ms',
        autoExpandDelay: '< 1 second'
      }
    };

    // Save memory bank update
    const memoryDir = 'memory-bank';
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    fs.writeFileSync(
      `${memoryDir}/playwright-test-context.json`,
      JSON.stringify(memoryUpdate, null, 2)
    );

  } catch (error) {
    console.error(`❌ Memory Bank update failed: ${error.message}`);
  }
}

/**
 * Generate GitHub Integration Data
 * Prepares data for potential GitHub issue creation
 */
async function generateGitHubIntegrationData() {
  try {
    const fs = await import('fs');

    let testResults = {};
    if (fs.existsSync('test-results/test-summary.json')) {
      testResults = JSON.parse(fs.readFileSync('test-results/test-summary.json', 'utf8'));
    }

    // Generate GitHub integration data
    const githubData = {
      timestamp: new Date().toISOString(),
      shouldCreateIssue: testResults.failed > 0,

      issueTemplate: {
        title: `🧪 Playwright Test Failures - ${testResults.failed} failed tests`,
        labels: ['testing', 'playwright', 'bug'],
        priority: testResults.failed > 5 ? 'high' : 'medium',

        body: `## Test Run Summary
- **Total Tests**: ${testResults.totalTests}
- **Failed**: ${testResults.failed}
- **Passed**: ${testResults.passed}
- **Duration**: ${Math.round(testResults.duration / 1000)}s

## Business Context
- **Platform**: B2C outdoor recreation
- **Primary Data**: poi_locations table
- **Geographic Focus**: Minnesota

## Next Steps
1. Review test results in \`test-results/\` directory
2. Check screenshots for visual regressions
3. Validate POI data integrity
4. Run individual tests with \`npm run test:browser:ui\`

**Automated by Playwright MCP Integration**`
      }
    };

    fs.writeFileSync('test-results/github-integration.json', JSON.stringify(githubData, null, 2));

  } catch (error) {
    console.error(`❌ GitHub integration data generation failed: ${error.message}`);
  }
}

/**
 * Generate Human-Readable Test Report
 */
function generateHumanReadableReport(summary) {
  const passRate = summary.totalTests > 0
    ? Math.round((summary.passed / summary.totalTests) * 100)
    : 0;

  return `# Playwright Test Summary Report

## Overview
- **Timestamp**: ${summary.timestamp}
- **Total Tests**: ${summary.totalTests}
- **Pass Rate**: ${passRate}%
- **Duration**: ${Math.round(summary.duration / 1000)} seconds

## Results Breakdown
- ✅ **Passed**: ${summary.passed}
- ❌ **Failed**: ${summary.failed}
- ⏭️ **Skipped**: ${summary.skipped}

## Test Categories
- **Visual Regression**: ${summary.categories.visualRegression} tests
- **Functional Testing**: ${summary.categories.functionalTesting} tests
- **Performance Testing**: ${summary.categories.performanceTesting} tests
- **Accessibility Testing**: ${summary.categories.accessibilityTesting} tests
- **Business Validation**: ${summary.categories.businessValidation} tests

## Business Context Validation
- **Business Model**: ${summary.businessModel}
- **Primary Table**: ${summary.primaryTable}
- **Environment**: ${summary.environment.baseURL}

## Recommendations
${summary.failed > 0
  ? `⚠️ **Action Required**: ${summary.failed} test(s) failed. Review test-results/ directory for details.`
  : '🎉 **All Tests Passed**: No immediate action required.'
}

---
*Generated by Enhanced Playwright MCP Integration*
`;
}
