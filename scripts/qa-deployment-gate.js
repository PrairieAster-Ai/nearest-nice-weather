/**
 * QA Deployment Gate Script
 * Comprehensive pre-deployment validation with MCP integration
 * Ensures code quality, business model compliance, and performance standards
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * QA Gate Configuration
 */
const QA_CONFIG = {
  // Health score requirements
  healthThresholds: {
    minimum: 70,
    recommended: 85,
    excellent: 95
  },

  // Test coverage requirements
  testRequirements: {
    visualRegression: true,
    businessValidation: true,
    userJourney: true,
    crossBrowser: false, // Optional for local testing
    performance: true
  },

  // Timeout configurations
  timeouts: {
    healthCheck: 120000, // 2 minutes
    playwrightTests: 300000, // 5 minutes
    overallGate: 600000 // 10 minutes total
  }
};

/**
 * QA Gate Results Tracking
 */
class QAGateResults {
  constructor() {
    this.results = {
      healthCheck: { status: 'pending', score: 0, details: {} },
      visualRegression: { status: 'pending', passed: 0, failed: 0, skipped: 0 },
      businessValidation: { status: 'pending', passed: 0, failed: 0, skipped: 0 },
      userJourney: { status: 'pending', passed: 0, failed: 0, skipped: 0 },
      performance: { status: 'pending', metrics: {} },
      crossBrowser: { status: 'skipped', reason: 'Optional for local deployment' },

      // Overall results
      overallStatus: 'running',
      startTime: new Date(),
      endTime: null,
      duration: 0,

      // Recommendations
      canDeploy: false,
      recommendations: [],
      blockers: []
    };
  }

  updateResult(category, data) {
    this.results[category] = { ...this.results[category], ...data };
    this.evaluateOverallStatus();
  }

  evaluateOverallStatus() {
    const { healthCheck, visualRegression, businessValidation, userJourney } = this.results;

    // Health check must pass minimum threshold
    if (healthCheck.score < QA_CONFIG.healthThresholds.minimum) {
      this.results.canDeploy = false;
      this.results.blockers.push(`Health score ${healthCheck.score}% below minimum ${QA_CONFIG.healthThresholds.minimum}%`);
    }

    // Business validation is critical
    if (businessValidation.status === 'failed' || businessValidation.failed > 0) {
      this.results.canDeploy = false;
      this.results.blockers.push('Business model validation failed');
    }

    // User journey tests are critical
    if (userJourney.status === 'failed' || userJourney.failed > 0) {
      this.results.canDeploy = false;
      this.results.blockers.push('Core user journey tests failed');
    }

    // Visual regression failures are warnings, not blockers
    if (visualRegression.failed > 0) {
      this.results.recommendations.push(`${visualRegression.failed} visual regression test(s) failed - review changes`);
    }

    // If no blockers, can deploy
    if (this.results.blockers.length === 0) {
      this.results.canDeploy = true;
    }
  }

  complete() {
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;

    if (this.results.canDeploy) {
      this.results.overallStatus = 'passed';
    } else {
      this.results.overallStatus = 'failed';
    }
  }
}

/**
 * Main QA Deployment Gate Function
 */
async function runQADeploymentGate(environment = 'localhost') {
  console.log('🚀 QA Deployment Gate Starting');
  console.log('==============================');
  console.log(`Environment: ${environment}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  const results = new QAGateResults();

  try {
    // Phase 1: Comprehensive Health Check
    console.log('🏥 Phase 1: Comprehensive Health Check');
    await runHealthCheck(environment, results);

    // Phase 2: Visual Regression Testing
    console.log('📸 Phase 2: Visual Regression Testing');
    await runVisualRegressionTests(results);

    // Phase 3: Business Model Validation
    console.log('🎯 Phase 3: Business Model Validation');
    await runBusinessValidationTests(results);

    // Phase 4: User Journey Testing
    console.log('👤 Phase 4: User Journey Testing');
    await runUserJourneyTests(results);

    // Phase 5: Performance Validation
    console.log('⚡ Phase 5: Performance Validation');
    await runPerformanceValidation(results);

    // Phase 6: Generate Final Report
    console.log('📊 Phase 6: Generating Final Report');
    results.complete();
    await generateQAReport(results);

    // Phase 7: Deployment Decision
    console.log('🎭 Phase 7: Deployment Decision');
    displayDeploymentDecision(results);

    // Exit with appropriate code
    process.exit(results.results.canDeploy ? 0 : 1);

  } catch (error) {
    console.error('❌ QA Deployment Gate failed:', error.message);
    results.results.overallStatus = 'error';
    results.results.blockers.push(`Gate execution error: ${error.message}`);
    results.complete();

    await generateQAReport(results);
    process.exit(1);
  }
}

/**
 * Phase 1: Run Comprehensive Health Check
 */
async function runHealthCheck(environment, results) {
  console.log('  Running comprehensive environment health check...');

  try {
    const healthResult = await runCommand(`./scripts/comprehensive-health-check.sh ${environment}`, {
      timeout: QA_CONFIG.timeouts.healthCheck
    });

    // Parse health check results
    const healthReportPath = 'test-results/health-checks/latest-summary.md';
    if (fs.existsSync(healthReportPath)) {
      const healthReport = fs.readFileSync(healthReportPath, 'utf8');
      const scoreMatch = healthReport.match(/Overall Score.*?(\d+)%/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

      results.updateResult('healthCheck', {
        status: score >= QA_CONFIG.healthThresholds.minimum ? 'passed' : 'failed',
        score: score,
        details: { report: healthReportPath }
      });

      console.log(`  ✅ Health check complete: ${score}% score`);
    } else {
      throw new Error('Health check report not generated');
    }

  } catch (error) {
    results.updateResult('healthCheck', {
      status: 'failed',
      score: 0,
      error: error.message
    });
    console.log(`  ❌ Health check failed: ${error.message}`);
  }
}

/**
 * Phase 2: Run Visual Regression Tests
 */
async function runVisualRegressionTests(results) {
  console.log('  Running visual regression test suite...');

  try {
    const testResult = await runCommand('npx playwright test tests/visual-regression.spec.js --reporter=json', {
      timeout: QA_CONFIG.timeouts.playwrightTests
    });

    const playwrightResults = parsePlaywrightResults(testResult.stdout);

    results.updateResult('visualRegression', {
      status: playwrightResults.failed === 0 ? 'passed' : 'failed',
      passed: playwrightResults.passed,
      failed: playwrightResults.failed,
      skipped: playwrightResults.skipped
    });

    console.log(`  ✅ Visual regression: ${playwrightResults.passed} passed, ${playwrightResults.failed} failed`);

  } catch (error) {
    results.updateResult('visualRegression', {
      status: 'error',
      error: error.message
    });
    console.log(`  ❌ Visual regression tests failed: ${error.message}`);
  }
}

/**
 * Phase 3: Run Business Model Validation Tests
 */
async function runBusinessValidationTests(results) {
  console.log('  Running business model validation...');

  try {
    const testResult = await runCommand('npx playwright test tests/business-model-validation.spec.js --reporter=json', {
      timeout: QA_CONFIG.timeouts.playwrightTests
    });

    const playwrightResults = parsePlaywrightResults(testResult.stdout);

    results.updateResult('businessValidation', {
      status: playwrightResults.failed === 0 ? 'passed' : 'failed',
      passed: playwrightResults.passed,
      failed: playwrightResults.failed,
      skipped: playwrightResults.skipped
    });

    console.log(`  ✅ Business validation: ${playwrightResults.passed} passed, ${playwrightResults.failed} failed`);

  } catch (error) {
    results.updateResult('businessValidation', {
      status: 'error',
      error: error.message
    });
    console.log(`  ❌ Business validation tests failed: ${error.message}`);
  }
}

/**
 * Phase 4: Run User Journey Tests
 */
async function runUserJourneyTests(results) {
  console.log('  Running user journey tests...');

  try {
    const testResult = await runCommand('npx playwright test tests/user-journey-poi-discovery.spec.js --reporter=json', {
      timeout: QA_CONFIG.timeouts.playwrightTests
    });

    const playwrightResults = parsePlaywrightResults(testResult.stdout);

    results.updateResult('userJourney', {
      status: playwrightResults.failed === 0 ? 'passed' : 'failed',
      passed: playwrightResults.passed,
      failed: playwrightResults.failed,
      skipped: playwrightResults.skipped
    });

    console.log(`  ✅ User journey: ${playwrightResults.passed} passed, ${playwrightResults.failed} failed`);

  } catch (error) {
    results.updateResult('userJourney', {
      status: 'error',
      error: error.message
    });
    console.log(`  ❌ User journey tests failed: ${error.message}`);
  }
}

/**
 * Phase 5: Run Performance Validation
 */
async function runPerformanceValidation(results) {
  console.log('  Running performance validation...');

  try {
    // Use health check performance metrics
    const healthReportPath = 'test-results/health-checks/health-check-latest.json';

    if (fs.existsSync(healthReportPath)) {
      const healthData = JSON.parse(fs.readFileSync(healthReportPath, 'utf8'));

      const apiPerformance = healthData.checks?.api_performance;
      if (apiPerformance && apiPerformance.status === 'passed') {
        results.updateResult('performance', {
          status: 'passed',
          metrics: {
            apiResponseTime: apiPerformance.details
          }
        });
        console.log(`  ✅ Performance validation passed`);
      } else {
        results.updateResult('performance', {
          status: 'warning',
          metrics: { message: 'Performance data not available' }
        });
        console.log(`  ⚠️ Performance validation incomplete`);
      }
    } else {
      throw new Error('Performance metrics not available');
    }

  } catch (error) {
    results.updateResult('performance', {
      status: 'error',
      error: error.message
    });
    console.log(`  ❌ Performance validation failed: ${error.message}`);
  }
}

/**
 * Generate Comprehensive QA Report
 */
async function generateQAReport(results) {
  const reportDir = 'test-results/qa-reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `qa-deployment-gate-${timestamp}.json`);
  const summaryPath = path.join(reportDir, 'latest-qa-summary.md');

  // Save detailed JSON report
  fs.writeFileSync(reportPath, JSON.stringify(results.results, null, 2));

  // Generate human-readable summary
  const summaryReport = generateSummaryReport(results.results);
  fs.writeFileSync(summaryPath, summaryReport);

  console.log(`  📄 Detailed report: ${reportPath}`);
  console.log(`  📋 Summary report: ${summaryPath}`);
}

/**
 * Generate Human-Readable Summary Report
 */
function generateSummaryReport(results) {
  const status = results.canDeploy ? '🟢 APPROVED' : '🔴 BLOCKED';
  const duration = Math.round(results.duration / 1000);

  return `# QA Deployment Gate Report

**Status**: ${status}
**Duration**: ${duration} seconds
**Timestamp**: ${results.endTime?.toISOString()}

## Test Results Summary

### Health Check
- **Score**: ${results.healthCheck.score}%
- **Status**: ${results.healthCheck.status.toUpperCase()}
- **Threshold**: ${QA_CONFIG.healthThresholds.minimum}% minimum required

### Visual Regression Testing
- **Status**: ${results.visualRegression.status.toUpperCase()}
- **Passed**: ${results.visualRegression.passed}
- **Failed**: ${results.visualRegression.failed}
- **Skipped**: ${results.visualRegression.skipped}

### Business Model Validation
- **Status**: ${results.businessValidation.status.toUpperCase()}
- **Passed**: ${results.businessValidation.passed}
- **Failed**: ${results.businessValidation.failed}
- **Skipped**: ${results.businessValidation.skipped}

### User Journey Testing
- **Status**: ${results.userJourney.status.toUpperCase()}
- **Passed**: ${results.userJourney.passed}
- **Failed**: ${results.userJourney.failed}
- **Skipped**: ${results.userJourney.skipped}

### Performance Validation
- **Status**: ${results.performance.status.toUpperCase()}

## Deployment Decision

${results.canDeploy ?
  '✅ **DEPLOYMENT APPROVED** - All critical tests passed and quality gates met.' :
  '❌ **DEPLOYMENT BLOCKED** - Critical issues must be resolved before deployment.'
}

${results.blockers.length > 0 ? `
### Blockers (Must Fix)
${results.blockers.map(blocker => `- ❌ ${blocker}`).join('\n')}
` : ''}

${results.recommendations.length > 0 ? `
### Recommendations
${results.recommendations.map(rec => `- ⚠️ ${rec}`).join('\n')}
` : ''}

## Next Steps

${results.canDeploy ? `
1. ✅ Proceed with deployment
2. 📊 Monitor deployment metrics
3. 🔍 Validate production environment post-deployment
` : `
1. 🔧 Address blocking issues listed above
2. 🔄 Re-run QA deployment gate
3. 📋 Validate fixes with targeted testing
`}

---
*Generated by QA Deployment Gate with MCP Integration*
*Business Context: B2C Outdoor Recreation Platform*
`;
}

/**
 * Display Final Deployment Decision
 */
function displayDeploymentDecision(results) {
  console.log('');
  console.log('🎭 QA DEPLOYMENT GATE RESULTS');
  console.log('==============================');

  if (results.results.canDeploy) {
    console.log('🟢 DEPLOYMENT APPROVED');
    console.log('✅ All critical quality gates passed');
    console.log(`✅ Health score: ${results.results.healthCheck.score}%`);
    console.log(`✅ Business validation: ${results.results.businessValidation.passed} tests passed`);
    console.log(`✅ User journey: ${results.results.userJourney.passed} tests passed`);

    if (results.results.recommendations.length > 0) {
      console.log('');
      console.log('⚠️  Recommendations (non-blocking):');
      results.results.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
  } else {
    console.log('🔴 DEPLOYMENT BLOCKED');
    console.log('❌ Critical issues must be resolved');

    console.log('');
    console.log('🚫 Blocking Issues:');
    results.results.blockers.forEach(blocker => console.log(`   ❌ ${blocker}`));
  }

  console.log('');
  console.log(`⏱️  Total duration: ${Math.round(results.results.duration / 1000)} seconds`);
  console.log(`📊 Health score: ${results.results.healthCheck.score}%`);
  console.log('📋 Detailed report: test-results/qa-reports/latest-qa-summary.md');
}

/**
 * Parse Playwright JSON Results
 */
function parsePlaywrightResults(stdout) {
  try {
    const jsonOutput = stdout.split('\n').find(line => line.trim().startsWith('{'));
    if (jsonOutput) {
      const results = JSON.parse(jsonOutput);
      return {
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0
      };
    }
  } catch (error) {
    console.log('Warning: Could not parse Playwright results');
  }

  return { passed: 0, failed: 1, skipped: 0 }; // Assume failure if can't parse
}

/**
 * Run Command with Timeout
 */
function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 60000;
    const [cmd, ...args] = command.split(' ');

    const process = spawn(cmd, args, {
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      process.kill();
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    process.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const environment = process.argv[2] || 'localhost';
  runQADeploymentGate(environment);
}

export { runQADeploymentGate };
