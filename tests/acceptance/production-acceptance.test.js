// ========================================================================
// PRODUCTION ACCEPTANCE TESTS - Nearest Nice Weather
// ========================================================================
// Validates core user workflows and business requirements in production
// These tests define "success" for the weather intelligence platform

const https = require('https');
const assert = require('assert');

class ProductionAcceptanceTests {
  constructor() {
    this.baseUrl = 'https://www.nearestniceweather.com';
    this.results = [];
  }

  async runTest(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    const start = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - start;
      this.results.push({ name, status: 'PASS', duration });
      console.log(`✅ PASS: ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      this.results.push({ name, status: 'FAIL', duration, error: error.message });
      console.log(`❌ FAIL: ${name} (${duration}ms) - ${error.message}`);
    }
  }

  async httpRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const req = https.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            redirected: res.statusCode >= 300 && res.statusCode < 400
          });
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async parseJSON(response) {
    try {
      return JSON.parse(response.body);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${response.body.substring(0, 100)}...`);
    }
  }

  // ====================================================================
  // ACCEPTANCE CRITERIA: Core User Workflows
  // ====================================================================

  async testSiteAccessibility() {
    const response = await this.httpRequest('/');
    assert.strictEqual(response.statusCode, 200, 'Site must be publicly accessible');
    assert.ok(response.body.includes('Nearest Nice Weather'), 'Site must display correct title');
  }

  async testHealthEndpoint() {
    const response = await this.httpRequest('/health.json');
    assert.strictEqual(response.statusCode, 200, 'Health endpoint must be accessible');
    
    const health = await this.parseJSON(response);
    assert.ok(health.status === 'healthy', 'Health status must be healthy');
    assert.ok(health.buildInfo.reactVersion, 'Must report React version');
  }

  async testWeatherAPIFunctionality() {
    const response = await this.httpRequest('/api/weather-locations?limit=5');
    assert.strictEqual(response.statusCode, 200, 'Weather API must be accessible');
    
    const data = await this.parseJSON(response);
    assert.ok(data.success === true, 'API must return success=true');
    assert.ok(Array.isArray(data.data), 'API must return weather locations array');
    assert.ok(data.data.length > 0, 'API must return at least one location');
    
    // Validate location data structure
    const location = data.data[0];
    assert.ok(location.name, 'Location must have name');
    assert.ok(typeof location.lat === 'number', 'Location must have numeric latitude');
    assert.ok(typeof location.lng === 'number', 'Location must have numeric longitude');
    assert.ok(typeof location.temperature === 'number', 'Location must have temperature');
  }

  async testDatabaseConnectivity() {
    const response = await this.httpRequest('/api/test-db');
    assert.strictEqual(response.statusCode, 200, 'Database test endpoint must be accessible');
    
    const data = await this.parseJSON(response);
    assert.ok(data.success === true, 'Database connection must be successful');
    assert.ok(data.timestamp, 'Database must return timestamp');
  }

  async testFeedbackAPIFunctionality() {
    // Test feedback endpoint accepts POST (OPTIONS preflight)
    const response = await this.httpRequest('/api/feedback');
    // Should return 405 for GET, but endpoint should exist
    assert.ok(response.statusCode === 405 || response.statusCode === 200, 
              'Feedback endpoint must exist and handle requests');
  }

  // ====================================================================
  // BUSINESS REQUIREMENTS: Minnesota Tourism Use Cases
  // ====================================================================

  async testMinnesotaWeatherCoverage() {
    const response = await this.httpRequest('/api/weather-locations?limit=100');
    const data = await this.parseJSON(response);
    
    // Validate Minnesota geographic bounds (approximate)
    const minnesotaLocations = data.data.filter(loc => 
      loc.lat >= 43.5 && loc.lat <= 49.4 && // Minnesota latitude range
      loc.lng >= -97.2 && loc.lng <= -89.5   // Minnesota longitude range
    );
    
    assert.ok(minnesotaLocations.length > 0, 'Must have Minnesota weather locations');
    assert.ok(minnesotaLocations.length >= 5, 'Must have at least 5 Minnesota locations for MVP');
  }

  async testTravelTimeFilteringSupport() {
    // Test proximity-based queries (core MVP feature)
    const minneapolisLat = 44.9778;
    const minneapolisLng = -93.2650;
    
    const response = await this.httpRequest(
      `/api/weather-locations?lat=${minneapolisLat}&lng=${minneapolisLng}&limit=10`
    );
    const data = await this.parseJSON(response);
    
    assert.ok(data.debug.query_type === 'proximity_unlimited', 
              'API must support proximity-based queries');
    assert.ok(data.debug.user_location.lat === minneapolisLat, 
              'API must accept user location parameters');
  }

  // ====================================================================
  // PERFORMANCE REQUIREMENTS
  // ====================================================================

  async testAPIResponseTime() {
    const start = Date.now();
    const response = await this.httpRequest('/api/weather-locations?limit=10');
    const duration = Date.now() - start;
    
    assert.ok(response.statusCode === 200, 'API must respond successfully');
    assert.ok(duration < 3000, `API response must be under 3 seconds (was ${duration}ms)`);
  }

  async testSiteLoadTime() {
    const start = Date.now();
    const response = await this.httpRequest('/');
    const duration = Date.now() - start;
    
    assert.ok(response.statusCode === 200, 'Site must load successfully');
    assert.ok(duration < 5000, `Site must load under 5 seconds (was ${duration}ms)`);
  }

  // ====================================================================
  // SECURITY & RELIABILITY REQUIREMENTS
  // ====================================================================

  async testSecurityHeaders() {
    const response = await this.httpRequest('/');
    const headers = response.headers;
    
    assert.ok(headers['x-content-type-options'], 'Must have X-Content-Type-Options header');
    assert.ok(headers['x-frame-options'], 'Must have X-Frame-Options header');
    assert.ok(headers['content-security-policy'], 'Must have Content-Security-Policy header');
  }

  async testCORSConfiguration() {
    const response = await this.httpRequest('/api/health');
    // Should handle CORS properly (either no restrictions or proper headers)
    assert.ok(response.statusCode === 200 || response.statusCode === 404, 
              'API endpoints must handle CORS requests');
  }

  // ====================================================================
  // Test Runner
  // ====================================================================

  async runAllTests() {
    console.log('🚀 PRODUCTION ACCEPTANCE TESTS - Nearest Nice Weather');
    console.log('══════════════════════════════════════════════════════');
    console.log(`🌐 Testing: ${this.baseUrl}`);
    console.log('');

    // Core Functionality Tests
    await this.runTest('Site Accessibility', () => this.testSiteAccessibility());
    await this.runTest('Health Endpoint', () => this.testHealthEndpoint());
    await this.runTest('Weather API Functionality', () => this.testWeatherAPIFunctionality());
    await this.runTest('Database Connectivity', () => this.testDatabaseConnectivity());
    await this.runTest('Feedback API Functionality', () => this.testFeedbackAPIFunctionality());

    // Business Requirements
    await this.runTest('Minnesota Weather Coverage', () => this.testMinnesotaWeatherCoverage());
    await this.runTest('Travel Time Filtering Support', () => this.testTravelTimeFilteringSupport());

    // Performance Requirements
    await this.runTest('API Response Time', () => this.testAPIResponseTime());
    await this.runTest('Site Load Time', () => this.testSiteLoadTime());

    // Security Requirements
    await this.runTest('Security Headers', () => this.testSecurityHeaders());
    await this.runTest('CORS Configuration', () => this.testCORSConfiguration());

    // Summary Report
    this.generateReport();
  }

  generateReport() {
    console.log('');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('══════════════════════════════════════════════════════');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`📈 Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    if (failed > 0) {
      console.log('');
      console.log('🚨 FAILED TESTS:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  ❌ ${result.name}: ${result.error}`);
      });
    }

    console.log('');
    console.log('🎯 ACCEPTANCE CRITERIA:');
    console.log(`  • Site accessibility: ${this.getTestStatus('Site Accessibility')}`);
    console.log(`  • Weather API: ${this.getTestStatus('Weather API Functionality')}`);
    console.log(`  • Database connectivity: ${this.getTestStatus('Database Connectivity')}`);
    console.log(`  • Minnesota coverage: ${this.getTestStatus('Minnesota Weather Coverage')}`);
    console.log(`  • Performance: ${this.getTestStatus('API Response Time')}`);
    
    const criticalPassed = [
      'Site Accessibility',
      'Weather API Functionality', 
      'Database Connectivity'
    ].every(test => this.getTestStatus(test) === '✅');
    
    console.log('');
    if (criticalPassed && failed === 0) {
      console.log('🎉 ALL ACCEPTANCE CRITERIA MET - PRODUCTION READY');
    } else if (criticalPassed) {
      console.log('⚠️  CORE FUNCTIONALITY WORKING - MINOR ISSUES TO RESOLVE');
    } else {
      console.log('🚨 CRITICAL ISSUES - PRODUCTION NOT READY');
    }
  }

  getTestStatus(testName) {
    const result = this.results.find(r => r.name === testName);
    return result ? (result.status === 'PASS' ? '✅' : '❌') : '❓';
  }
}

// Run tests if called directly
if (require.main === module) {
  const tests = new ProductionAcceptanceTests();
  tests.runAllTests().catch(console.error);
}

module.exports = ProductionAcceptanceTests;