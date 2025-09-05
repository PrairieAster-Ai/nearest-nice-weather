// ========================================================================
// KEY PERFORMANCE TESTS - Nearest Nice Weather
// ========================================================================
// Measures critical performance metrics for Minnesota tourism use cases
// Tests both local development and production environments

const https = require('https');
const http = require('http');
const assert = require('assert');

class KeyPerformanceTests {
  constructor() {
    this.environments = {
      local: 'http://localhost:3002',
      production: 'https://nearestniceweather.com'
    };
    this.results = {};
    this.thresholds = {
      // Performance targets for rural Minnesota network conditions
      siteLoad: 5000,        // 5 seconds max (rural networks)
      apiResponse: 3000,     // 3 seconds max (serverless cold start)
      weatherQuery: 2000,    // 2 seconds max (core user workflow)
      bundleSize: 1000000,   // 1MB max (mobile data considerations)
      mapInteraction: 500,   // 500ms max (user experience)

      // Scalability targets
      concurrentUsers: 50,   // Minimum concurrent capacity
      dataAccuracy: 0.95,    // 95% data integrity
      uptime: 0.99          // 99% availability target
    };
  }

  async measureRequest(url, name, options = {}) {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const start = process.hrtime.bigint();

      const req = client.get(url, options, (res) => {
        let data = '';
        let firstByteTime = null;

        res.on('data', chunk => {
          if (!firstByteTime) {
            firstByteTime = process.hrtime.bigint();
          }
          data += chunk;
        });

        res.on('end', () => {
          const end = process.hrtime.bigint();
          const totalTime = Number(end - start) / 1000000; // Convert to milliseconds
          const ttfb = firstByteTime ? Number(firstByteTime - start) / 1000000 : totalTime;

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            metrics: {
              totalTime,
              ttfb,
              contentLength: data.length,
              name
            }
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error(`${name} timeout after 15 seconds`));
      });
    });
  }

  async runPerformanceTest(name, testFn, threshold, unit = 'ms') {
    console.log(`⚡ Performance Test: ${name}`);

    try {
      const result = await testFn();
      const passed = result.value <= threshold;
      const status = passed ? '✅ PASS' : '❌ FAIL';

      this.results[name] = {
        value: result.value,
        threshold,
        passed,
        unit,
        details: result.details || {}
      };

      console.log(`   ${status}: ${result.value}${unit} (threshold: ${threshold}${unit})`);
      if (result.details.breakdown) {
        result.details.breakdown.forEach(item => {
          console.log(`     ${item}`);
        });
      }

      return result;
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      this.results[name] = {
        value: -1,
        threshold,
        passed: false,
        unit,
        error: error.message
      };
      throw error;
    }
  }

  // ====================================================================
  // CORE PERFORMANCE TESTS
  // ====================================================================

  async testSiteLoadPerformance() {
    return this.runPerformanceTest(
      'Site Load Time',
      async () => {
        const response = await this.measureRequest(this.environments.production, 'Site Load');
        return {
          value: Math.round(response.metrics.totalTime),
          details: {
            ttfb: Math.round(response.metrics.ttfb),
            contentLength: response.metrics.contentLength,
            breakdown: [
              `TTFB: ${Math.round(response.metrics.ttfb)}ms`,
              `Content: ${Math.round(response.metrics.contentLength / 1024)}KB`,
              `Status: ${response.statusCode}`
            ]
          }
        };
      },
      this.thresholds.siteLoad
    );
  }

  async testAPIResponsePerformance() {
    return this.runPerformanceTest(
      'API Response Time',
      async () => {
        const url = `${this.environments.production}/api/weather-locations?limit=10`;
        const response = await this.measureRequest(url, 'API Response');

        let dataPoints = 0;
        try {
          const data = JSON.parse(response.body);
          dataPoints = data.data ? data.data.length : 0;
        } catch (e) {
          // API might be broken, but we still measure response time
        }

        return {
          value: Math.round(response.metrics.totalTime),
          details: {
            dataPoints,
            breakdown: [
              `TTFB: ${Math.round(response.metrics.ttfb)}ms`,
              `Data points: ${dataPoints}`,
              `Payload: ${Math.round(response.metrics.contentLength / 1024)}KB`
            ]
          }
        };
      },
      this.thresholds.apiResponse
    );
  }

  async testWeatherQueryPerformance() {
    return this.runPerformanceTest(
      'Weather Query Time',
      async () => {
        // Test proximity query (core user workflow)
        const url = `${this.environments.production}/api/weather-locations?lat=44.9778&lng=-93.2650&limit=20`;
        const response = await this.measureRequest(url, 'Weather Query');

        return {
          value: Math.round(response.metrics.totalTime),
          details: {
            breakdown: [
              `Geographic query response: ${Math.round(response.metrics.totalTime)}ms`,
              `Status: ${response.statusCode}`
            ]
          }
        };
      },
      this.thresholds.weatherQuery
    );
  }

  async testBundleSizePerformance() {
    return this.runPerformanceTest(
      'Bundle Size',
      async () => {
        const response = await this.measureRequest(this.environments.production, 'Bundle Size');

        // Extract JS bundle size from HTML
        const jsMatches = response.body.match(/src="([^"]*\.js[^"]*)"/g) || [];
        let totalJSSize = 0;

        for (const match of jsMatches.slice(0, 3)) { // Check main bundles only
          const jsPath = match.match(/src="([^"]*)"/)[1];
          const jsUrl = jsPath.startsWith('http') ? jsPath : `${this.environments.production}${jsPath}`;

          try {
            const jsResponse = await this.measureRequest(jsUrl, 'JS Bundle');
            totalJSSize += jsResponse.metrics.contentLength;
          } catch (e) {
            // Bundle might not be accessible, skip
          }
        }

        return {
          value: totalJSSize,
          details: {
            breakdown: [
              `Total JS bundle: ${Math.round(totalJSSize / 1024)}KB`,
              `HTML size: ${Math.round(response.metrics.contentLength / 1024)}KB`,
              `Bundles checked: ${jsMatches.length}`
            ]
          }
        };
      },
      this.thresholds.bundleSize,
      'bytes'
    );
  }

  // ====================================================================
  // DATABASE PERFORMANCE TESTS
  // ====================================================================

  async testDatabaseConnectionPerformance() {
    return this.runPerformanceTest(
      'Database Connection Time',
      async () => {
        const url = `${this.environments.production}/api/test-db`;
        const response = await this.measureRequest(url, 'DB Connection');

        return {
          value: Math.round(response.metrics.totalTime),
          details: {
            breakdown: [
              `Connection test: ${Math.round(response.metrics.totalTime)}ms`,
              `Status: ${response.statusCode}`
            ]
          }
        };
      },
      2000 // 2 second threshold for DB connection
    );
  }

  // ====================================================================
  // CONCURRENT LOAD TESTS
  // ====================================================================

  async testConcurrentUserCapacity() {
    return this.runPerformanceTest(
      'Concurrent User Capacity',
      async () => {
        const concurrentRequests = 10; // Scaled down for testing
        const url = `${this.environments.production}/api/weather-locations?limit=5`;

        const promises = Array(concurrentRequests).fill(null).map((_, i) =>
          this.measureRequest(url, `Concurrent-${i}`)
        );

        const start = Date.now();
        const responses = await Promise.allSettled(promises);
        const duration = Date.now() - start;

        const successful = responses.filter(r => r.status === 'fulfilled').length;
        const failed = responses.filter(r => r.status === 'rejected').length;

        const successRate = successful / concurrentRequests;

        return {
          value: Math.round(duration),
          details: {
            successRate,
            breakdown: [
              `Concurrent requests: ${concurrentRequests}`,
              `Successful: ${successful}`,
              `Failed: ${failed}`,
              `Success rate: ${Math.round(successRate * 100)}%`,
              `Total duration: ${duration}ms`
            ]
          }
        };
      },
      5000 // 5 seconds for 10 concurrent requests
    );
  }

  // ====================================================================
  // LOCAL VS PRODUCTION COMPARISON
  // ====================================================================

  async compareEnvironments() {
    console.log('');
    console.log('🔄 ENVIRONMENT COMPARISON');
    console.log('══════════════════════════════════════════════════════');

    const tests = [
      {
        name: 'API Response',
        local: `${this.environments.local}/api/weather-locations?limit=5`,
        production: `${this.environments.production}/api/weather-locations?limit=5`
      }
    ];

    for (const test of tests) {
      try {
        console.log(`📊 Comparing: ${test.name}`);

        // Test local environment
        let localResult = null;
        try {
          const localResponse = await this.measureRequest(test.local, 'Local');
          localResult = Math.round(localResponse.metrics.totalTime);
          console.log(`   🏠 Local: ${localResult}ms`);
        } catch (e) {
          console.log(`   🏠 Local: ❌ ${e.message}`);
        }

        // Test production environment
        let prodResult = null;
        try {
          const prodResponse = await this.measureRequest(test.production, 'Production');
          prodResult = Math.round(prodResponse.metrics.totalTime);
          console.log(`   🌐 Production: ${prodResult}ms`);
        } catch (e) {
          console.log(`   🌐 Production: ❌ ${e.message}`);
        }

        // Compare if both successful
        if (localResult && prodResult) {
          const difference = prodResult - localResult;
          const percentage = Math.round((difference / localResult) * 100);
          console.log(`   📈 Difference: +${difference}ms (${percentage > 0 ? '+' : ''}${percentage}%)`);
        }

      } catch (error) {
        console.log(`   ❌ Comparison failed: ${error.message}`);
      }
    }
  }

  // ====================================================================
  // TEST RUNNER
  // ====================================================================

  async runAllTests() {
    console.log('⚡ KEY PERFORMANCE TESTS - Nearest Nice Weather');
    console.log('══════════════════════════════════════════════════════');
    console.log(`🎯 Performance Thresholds:`);
    console.log(`   Site Load: ${this.thresholds.siteLoad}ms`);
    console.log(`   API Response: ${this.thresholds.apiResponse}ms`);
    console.log(`   Weather Query: ${this.thresholds.weatherQuery}ms`);
    console.log(`   Bundle Size: ${Math.round(this.thresholds.bundleSize/1024)}KB`);
    console.log('');

    // Core Performance Tests
    try { await this.testSiteLoadPerformance(); } catch (e) {}
    try { await this.testAPIResponsePerformance(); } catch (e) {}
    try { await this.testWeatherQueryPerformance(); } catch (e) {}
    try { await this.testBundleSizePerformance(); } catch (e) {}
    try { await this.testDatabaseConnectionPerformance(); } catch (e) {}
    try { await this.testConcurrentUserCapacity(); } catch (e) {}

    // Environment Comparison
    await this.compareEnvironments();

    // Generate Performance Report
    this.generatePerformanceReport();
  }

  generatePerformanceReport() {
    console.log('');
    console.log('📊 PERFORMANCE SUMMARY');
    console.log('══════════════════════════════════════════════════════');

    const tests = Object.keys(this.results);
    const passed = tests.filter(test => this.results[test].passed).length;
    const failed = tests.filter(test => !this.results[test].passed).length;

    console.log(`✅ Passed: ${passed}/${tests.length}`);
    console.log(`❌ Failed: ${failed}/${tests.length}`);

    // Performance Grade
    const passRate = passed / tests.length;
    let grade = 'F';
    if (passRate >= 0.95) grade = 'A';
    else if (passRate >= 0.85) grade = 'B';
    else if (passRate >= 0.70) grade = 'C';
    else if (passRate >= 0.50) grade = 'D';

    console.log(`📈 Performance Grade: ${grade} (${Math.round(passRate * 100)}%)`);

    // Critical Performance Issues
    const criticalTests = ['Site Load Time', 'API Response Time', 'Weather Query Time'];
    const criticalFailed = criticalTests.filter(test =>
      this.results[test] && !this.results[test].passed
    );

    if (criticalFailed.length > 0) {
      console.log('');
      console.log('🚨 CRITICAL PERFORMANCE ISSUES:');
      criticalFailed.forEach(test => {
        const result = this.results[test];
        console.log(`   ❌ ${test}: ${result.value}${result.unit} (threshold: ${result.threshold}${result.unit})`);
      });
    }

    // Performance Recommendations
    console.log('');
    console.log('💡 PERFORMANCE RECOMMENDATIONS:');

    if (this.results['Bundle Size'] && !this.results['Bundle Size'].passed) {
      console.log('   • Optimize bundle size with code splitting and tree shaking');
    }

    if (this.results['API Response Time'] && !this.results['API Response Time'].passed) {
      console.log('   • Implement API response caching for weather data');
      console.log('   • Optimize database queries with indexes');
    }

    if (this.results['Site Load Time'] && !this.results['Site Load Time'].passed) {
      console.log('   • Enable CDN for static assets');
      console.log('   • Optimize images and fonts');
    }

    console.log('   • Consider implementing service worker for offline capability');
    console.log('   • Add performance monitoring for continuous optimization');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tests = new KeyPerformanceTests();
  tests.runAllTests().catch(console.error);
}

module.exports = KeyPerformanceTests;
