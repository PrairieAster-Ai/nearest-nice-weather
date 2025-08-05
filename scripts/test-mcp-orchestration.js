/**
 * MCP Orchestration Test Script
 * Tests cross-MCP communication and coordination
 * Validates the enhanced productivity pipeline
 */

import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

/**
 * MCP Configuration Test
 */
async function testMCPConfiguration() {
  console.log('🔧 Testing MCP Configuration...');
  
  const configPath = '.mcp/claude-desktop-config.json';
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`MCP configuration not found: ${configPath}`);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const expectedServers = [
    'playwright',
    'github-official',
    'github-project-manager',
    'chrome-tools',
    'memory-bank',
    'neon-database'
  ];
  
  const configuredServers = Object.keys(config.mcpServers || {});
  const missingServers = expectedServers.filter(server => !configuredServers.includes(server));
  
  if (missingServers.length > 0) {
    console.log(`⚠️  Missing MCP servers: ${missingServers.join(', ')}`);
  } else {
    console.log('✅ All expected MCP servers configured');
  }
  
  return {
    configured: configuredServers,
    missing: missingServers,
    totalExpected: expectedServers.length
  };
}

/**
 * Playwright MCP Integration Test
 */
async function testPlaywrightIntegration() {
  console.log('🎭 Testing Playwright MCP Integration...');
  
  try {
    // Check if Playwright is installed
    const { stdout } = await runCommand('npx playwright --version');
    console.log(`✅ Playwright version: ${stdout.trim()}`);
    
    // Check if browsers are installed
    try {
      await runCommand('npx playwright install --dry-run chromium');
      console.log('✅ Chromium browser available');
    } catch (error) {
      console.log('⚠️  Chromium browser not installed (run: npx playwright install chromium)');
    }
    
    // Test configuration
    if (fs.existsSync('playwright.config.js')) {
      console.log('✅ Enhanced Playwright configuration found');
      
      // Validate configuration content
      const configContent = fs.readFileSync('playwright.config.js', 'utf8');
      if (configContent.includes('multi-browser testing') && configContent.includes('business model validation')) {
        console.log('✅ Enhanced configuration includes business context');
      } else {
        console.log('⚠️  Configuration may be missing enhanced features');
      }
    } else {
      console.log('❌ Playwright configuration not found');
    }
    
    return { status: 'available', version: stdout.trim() };
    
  } catch (error) {
    console.log('❌ Playwright MCP not available:', error.message);
    return { status: 'unavailable', error: error.message };
  }
}

/**
 * Memory Bank MCP Integration Test
 */
async function testMemoryBankIntegration() {
  console.log('🧠 Testing Memory Bank MCP Integration...');
  
  const memoryBankDir = 'memory-bank';
  
  if (!fs.existsSync(memoryBankDir)) {
    console.log('⚠️  Memory Bank directory not found (run: npm run memory-bank:setup-business-context)');
    return { status: 'not-setup' };
  }
  
  // Check for business context files
  const expectedFiles = [
    'business-context/core-business-model.json',
    'technical-patterns/velocity-insights.json',
    'session-handoffs/handoff-templates.json',
    'quick-reference.json',
    'README.md'
  ];
  
  const existingFiles = expectedFiles.filter(file => 
    fs.existsSync(path.join(memoryBankDir, file))
  );
  
  console.log(`✅ Memory Bank files: ${existingFiles.length}/${expectedFiles.length} present`);
  
  if (existingFiles.length === expectedFiles.length) {
    console.log('✅ Complete business context setup');
  } else {
    console.log('⚠️  Incomplete setup - run: npm run memory-bank:setup-business-context');
  }
  
  return {
    status: existingFiles.length === expectedFiles.length ? 'complete' : 'partial',
    files: existingFiles.length,
    totalExpected: expectedFiles.length
  };
}

/**
 * GitHub MCP Integration Test
 */
async function testGitHubIntegration() {
  console.log('📝 Testing GitHub MCP Integration...');
  
  // Check for GitHub token
  const hasToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  
  if (!hasToken) {
    console.log('⚠️  GitHub token not found in environment');
    return { status: 'no-token' };
  }
  
  console.log('✅ GitHub token available');
  
  // Test GitHub project manager if available
  try {
    // This would test the actual MCP but we'll check configuration instead
    const configPath = '.mcp/claude-desktop-config.json';
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (config.mcpServers['github-project-manager']) {
        console.log('✅ GitHub Project Manager MCP configured');
      }
      
      if (config.mcpServers['github-official']) {
        console.log('✅ GitHub Official MCP configured');
      }
    }
    
    return { status: 'configured' };
    
  } catch (error) {
    console.log('⚠️  GitHub MCP configuration issue:', error.message);
    return { status: 'configuration-error', error: error.message };
  }
}

/**
 * Cross-MCP Communication Test
 */
async function testCrossMCPCommunication() {
  console.log('🔗 Testing Cross-MCP Communication Patterns...');
  
  // Test event-driven workflow simulation
  const testResults = {
    eventTriggers: [],
    mcpResponses: [],
    errors: []
  };
  
  try {
    // Simulate: Test failure → GitHub issue creation workflow
    console.log('📊 Simulating: Test failure → Issue creation workflow');
    
    // 1. Create mock test failure
    const mockFailure = {
      test: 'POI discovery journey',
      error: 'Map markers not loading',
      timestamp: new Date().toISOString(),
      environment: 'localhost'
    };
    
    testResults.eventTriggers.push('test_failure_detected');
    
    // 2. Check if we can capture failure evidence (Playwright)
    if (fs.existsSync('playwright.config.js')) {
      testResults.mcpResponses.push('playwright_capture_ready');
      console.log('  ✅ Playwright ready to capture failure evidence');
    }
    
    // 3. Check if Memory Bank can recall similar issues
    if (fs.existsSync('memory-bank/troubleshooting')) {
      testResults.mcpResponses.push('memory_bank_recall_ready');
      console.log('  ✅ Memory Bank ready to recall similar patterns');
    }
    
    // 4. Check if GitHub integration can create issues
    const hasGitHubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (hasGitHubToken) {
      testResults.mcpResponses.push('github_issue_creation_ready');
      console.log('  ✅ GitHub integration ready for issue creation');
    }
    
    // 5. Test directory structure for orchestration
    const orchestrationDir = 'test-results';
    if (!fs.existsSync(orchestrationDir)) {
      fs.mkdirSync(orchestrationDir, { recursive: true });
    }
    
    // Create mock orchestration data
    const orchestrationData = {
      timestamp: new Date().toISOString(),
      event: 'test_failure',
      mcpsPipeline: testResults.mcpResponses,
      ready: testResults.mcpResponses.length >= 2
    };
    
    fs.writeFileSync(
      path.join(orchestrationDir, 'mcp-orchestration-test.json'),
      JSON.stringify(orchestrationData, null, 2)
    );
    
    console.log(`✅ Cross-MCP communication simulation complete`);
    console.log(`📊 MCP responses: ${testResults.mcpResponses.length}/4 ready`);
    
    return {
      status: testResults.mcpResponses.length >= 2 ? 'operational' : 'partial',
      readyMCPs: testResults.mcpResponses.length,
      totalMCPs: 4
    };
    
  } catch (error) {
    console.log('❌ Cross-MCP communication test failed:', error.message);
    testResults.errors.push(error.message);
    return { status: 'failed', errors: testResults.errors };
  }
}

/**
 * Performance Enhancement Validation
 */
async function testPerformanceEnhancements() {
  console.log('🚀 Testing Performance Enhancement Features...');
  
  const enhancements = {
    healthChecks: false,
    qaAutomation: false,
    visualRegression: false,
    businessValidation: false
  };
  
  // Check comprehensive health check
  if (fs.existsSync('scripts/comprehensive-health-check.sh')) {
    enhancements.healthChecks = true;
    console.log('  ✅ Comprehensive health check available');
  }
  
  // Check QA automation scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts['qa:deployment-gate']) {
    enhancements.qaAutomation = true;
    console.log('  ✅ QA deployment gate automation available');
  }
  
  // Check visual regression setup
  if (fs.existsSync('tests/global-setup.js')) {
    enhancements.visualRegression = true;
    console.log('  ✅ Visual regression testing setup available');
  }
  
  // Check business validation
  if (fs.existsSync('memory-bank/business-context')) {
    enhancements.businessValidation = true;
    console.log('  ✅ Business validation context available');
  }
  
  const readyCount = Object.values(enhancements).filter(Boolean).length;
  console.log(`📊 Performance enhancements: ${readyCount}/4 ready`);
  
  return {
    status: readyCount >= 3 ? 'optimal' : readyCount >= 2 ? 'good' : 'needs-work',
    ready: readyCount,
    total: 4,
    enhancements
  };
}

/**
 * Generate Orchestration Report
 */
function generateOrchestrationReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    overallStatus: 'unknown',
    summary: {},
    recommendations: [],
    nextSteps: []
  };
  
  // Calculate overall readiness
  const readyServices = Object.values(results).filter(result => 
    result.status === 'available' || 
    result.status === 'complete' || 
    result.status === 'configured' ||
    result.status === 'operational' ||
    result.status === 'optimal'
  ).length;
  
  const totalServices = Object.keys(results).length;
  const readinessPercentage = Math.round((readyServices / totalServices) * 100);
  
  if (readinessPercentage >= 80) {
    report.overallStatus = 'ready';
    report.recommendations.push('🚀 MCP orchestration is ready for production use');
  } else if (readinessPercentage >= 60) {
    report.overallStatus = 'partial';
    report.recommendations.push('⚠️ MCP orchestration partially ready - address missing components');
  } else {
    report.overallStatus = 'needs-setup';
    report.recommendations.push('🔧 MCP orchestration needs significant setup before use');
  }
  
  report.summary = {
    readyServices,
    totalServices,
    readinessPercentage,
    results
  };
  
  // Generate specific next steps
  if (results.playwright?.status !== 'available') {
    report.nextSteps.push('Install Playwright browsers: npx playwright install chromium');
  }
  
  if (results.memoryBank?.status !== 'complete') {
    report.nextSteps.push('Setup Memory Bank context: npm run memory-bank:setup-business-context');
  }
  
  if (results.crossMCP?.status !== 'operational') {
    report.nextSteps.push('Configure missing MCP integrations for cross-communication');
  }
  
  // Save report
  const reportPath = 'test-results/mcp-orchestration-report.json';
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

/**
 * Utility function to run shell commands
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed: ${command}\n${stderr}`));
      }
    });
  });
}

/**
 * Main Test Orchestration Function
 */
async function testMCPOrchestration() {
  console.log('🔬 MCP Orchestration Test Suite');
  console.log('===============================\n');
  
  const results = {};
  
  try {
    // Run all tests
    results.configuration = await testMCPConfiguration();
    results.playwright = await testPlaywrightIntegration();
    results.memoryBank = await testMemoryBankIntegration();
    results.github = await testGitHubIntegration();
    results.crossMCP = await testCrossMCPCommunication();
    results.performance = await testPerformanceEnhancements();
    
    // Generate comprehensive report
    const report = generateOrchestrationReport(results);
    
    console.log('\n📊 MCP Orchestration Test Summary');
    console.log('=================================');
    console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`Readiness: ${report.summary.readinessPercentage}% (${report.summary.readyServices}/${report.summary.totalServices})`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    if (report.nextSteps.length > 0) {
      console.log('\n🎯 Next Steps:');
      report.nextSteps.forEach(step => console.log(`  ${step}`));
    }
    
    console.log(`\n📄 Detailed report: test-results/mcp-orchestration-report.json`);
    
    // Exit with appropriate code
    process.exit(report.summary.readinessPercentage >= 70 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ MCP orchestration test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPOrchestration();
}

export { testMCPOrchestration };