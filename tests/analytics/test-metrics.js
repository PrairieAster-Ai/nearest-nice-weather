/**
 * Test Analytics and Metrics Collection
 * Gathering test performance and coverage data
 */

import fs from 'fs';
import path from 'path';

export class TestMetrics {
  constructor() {
    this.metrics = {
      testRuns: [],
      coverage: {},
      performance: {},
      failures: [],
      environment: process.env.NODE_ENV || 'test'
    };
    this.startTime = Date.now();
  }

  recordTestStart(testName, suite) {
    const testRun = {
      id: `${suite}-${testName}-${Date.now()}`,
      name: testName,
      suite,
      startTime: Date.now(),
      status: 'running'
    };
    
    this.metrics.testRuns.push(testRun);
    return testRun.id;
  }

  recordTestEnd(testId, status, duration, error = null) {
    const testRun = this.metrics.testRuns.find(run => run.id === testId);
    if (testRun) {
      testRun.status = status;
      testRun.duration = duration;
      testRun.endTime = Date.now();
      
      if (error) {
        testRun.error = {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        };
        this.metrics.failures.push(testRun);
      }
    }
  }

  recordPerformanceMetric(metric, value, context = {}) {
    if (!this.metrics.performance[metric]) {
      this.metrics.performance[metric] = [];
    }
    
    this.metrics.performance[metric].push({
      value,
      timestamp: Date.now(),
      context
    });
  }

  recordCoverageData(coverageData) {
    this.metrics.coverage = {
      ...this.metrics.coverage,
      ...coverageData,
      timestamp: Date.now()
    };
  }

  generateSummary() {
    const totalTests = this.metrics.testRuns.length;
    const passedTests = this.metrics.testRuns.filter(run => run.status === 'passed').length;
    const failedTests = this.metrics.testRuns.filter(run => run.status === 'failed').length;
    const skippedTests = this.metrics.testRuns.filter(run => run.status === 'skipped').length;
    
    const avgDuration = this.metrics.testRuns
      .filter(run => run.duration)
      .reduce((acc, run, _, arr) => acc + run.duration / arr.length, 0);
    
    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        passRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0,
        avgDuration: Math.round(avgDuration),
        totalDuration: Date.now() - this.startTime
      },
      performance: this.metrics.performance,
      coverage: this.metrics.coverage,
      failures: this.metrics.failures.map(failure => ({
        name: failure.name,
        suite: failure.suite,
        error: failure.error?.message,
        duration: failure.duration
      })),
      environment: this.metrics.environment,
      timestamp: new Date().toISOString()
    };
  }

  saveMetrics(outputPath = 'test-results') {
    const summary = this.generateSummary();
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    const filename = `test-metrics-${Date.now()}.json`;
    const filepath = path.join(outputPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
    
    // Also create a latest.json file
    const latestPath = path.join(outputPath, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(summary, null, 2));
    
    return filepath;
  }

  generateHTMLReport() {
    const summary = this.generateSummary();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Analytics Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        .failure-item { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
        .failure-name { font-weight: bold; color: #dc2626; }
        .failure-error { color: #6b7280; margin-top: 5px; font-family: monospace; font-size: 0.9em; }
        .performance-chart { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .pass { color: #059669; }
        .fail { color: #dc2626; }
        .timestamp { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Analytics Report</h1>
            <p class="timestamp">Generated: ${summary.timestamp}</p>
            <p class="timestamp">Environment: ${summary.environment}</p>
        </div>
        
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${summary.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value pass">${summary.summary.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value fail">${summary.summary.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.summary.passRate}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.summary.avgDuration}ms</div>
                <div class="metric-label">Avg Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(summary.summary.totalDuration / 1000)}s</div>
                <div class="metric-label">Total Time</div>
            </div>
        </div>
        
        ${summary.failures.length > 0 ? `
        <div class="section">
            <h2>Failed Tests</h2>
            ${summary.failures.map(failure => `
                <div class="failure-item">
                    <div class="failure-name">${failure.suite} › ${failure.name}</div>
                    <div class="failure-error">${failure.error || 'No error message'}</div>
                    <div class="timestamp">Duration: ${failure.duration || 'N/A'}ms</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="section">
            <h2>Performance Metrics</h2>
            <div class="performance-chart">
                ${Object.entries(summary.performance).map(([metric, values]) => `
                    <div style="margin-bottom: 15px;">
                        <strong>${metric}:</strong>
                        ${values.length} measurements, 
                        avg: ${(values.reduce((acc, v) => acc + v.value, 0) / values.length).toFixed(2)},
                        min: ${Math.min(...values.map(v => v.value))},
                        max: ${Math.max(...values.map(v => v.value))}
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${summary.coverage && Object.keys(summary.coverage).length > 0 ? `
        <div class="section">
            <h2>Coverage</h2>
            <div class="performance-chart">
                <pre>${JSON.stringify(summary.coverage, null, 2)}</pre>
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;
    
    const outputPath = 'test-results';
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    const htmlPath = path.join(outputPath, 'test-report.html');
    fs.writeFileSync(htmlPath, html);
    
    return htmlPath;
  }
}

// Global metrics instance for use across tests
export const testMetrics = new TestMetrics();

// Jest reporter integration
export class CustomJestReporter {
  onRunStart() {
    console.log('Starting test analytics collection...');
  }
  
  onTestStart(test) {
    const testId = testMetrics.recordTestStart(test.path, test.context?.describe?.name || 'unknown');
    test._analyticsId = testId;
  }
  
  onTestResult(test, testResult) {
    if (test._analyticsId) {
      const status = testResult.numFailingTests > 0 ? 'failed' : 'passed';
      const duration = testResult.perfStats.end - testResult.perfStats.start;
      const error = testResult.testResults.find(r => r.status === 'failed')?.failureMessages?.[0];
      
      testMetrics.recordTestEnd(test._analyticsId, status, duration, error ? new Error(error) : null);
    }
  }
  
  onRunComplete() {
    const reportPath = testMetrics.generateHTMLReport();
    console.log(`Test analytics report generated: ${reportPath}`);
  }
}

export default testMetrics;