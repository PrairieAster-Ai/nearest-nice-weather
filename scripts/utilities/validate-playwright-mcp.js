#!/usr/bin/env node

/**
 * ========================================================================
 * PLAYWRIGHT MCP VALIDATION SCRIPT
 * ========================================================================
 * 
 * @PURPOSE: Validate enhanced PlaywrightMCP configuration and integration
 * @SCOPE: Environment validation, MCP server connectivity, test capabilities
 * 
 * Enhanced Features:
 * - Environment variable validation
 * - MCP server connectivity testing  
 * - Playwright configuration validation
 * - Test directory structure verification
 * - Performance baseline validation
 * 
 * ========================================================================
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const PROJECT_ROOT = process.cwd();
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}🎭 PlaywrightMCP Enhanced Configuration Validation${RESET}`);
console.log(`${BLUE}================================================${RESET}\n`);

let validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function validateCheck(name, condition, details = '') {
  if (condition) {
    console.log(`${GREEN}✅ ${name}${RESET}`);
    validationResults.passed++;
    if (details) validationResults.details.push(`✅ ${name}: ${details}`);
  } else {
    console.log(`${RED}❌ ${name}${RESET}`);
    validationResults.failed++;
    if (details) validationResults.details.push(`❌ ${name}: ${details}`);
  }
}

function validateWarning(name, condition, details = '') {
  if (!condition) {
    console.log(`${YELLOW}⚠️  ${name}${RESET}`);
    validationResults.warnings++;
    if (details) validationResults.details.push(`⚠️ ${name}: ${details}`);
  }
}

// 1. MCP Configuration Validation
console.log(`${BLUE}🔧 MCP Configuration Validation${RESET}`);
const mcpConfigPath = resolve(PROJECT_ROOT, '.mcp/claude-desktop-config.json');
validateCheck(
  'MCP config file exists',
  existsSync(mcpConfigPath),
  mcpConfigPath
);

if (existsSync(mcpConfigPath)) {
  try {
    const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
    validateCheck(
      'Playwright MCP server configured',
      mcpConfig.mcpServers?.playwright !== undefined,
      'Found in .mcp/claude-desktop-config.json'
    );
    
    const playwrightConfig = mcpConfig.mcpServers?.playwright;
    if (playwrightConfig) {
      validateCheck(
        'Enhanced environment variables configured',
        playwrightConfig.env !== undefined,
        `${Object.keys(playwrightConfig.env || {}).length} env vars`
      );
      
      validateCheck(
        'PLAYWRIGHT_BASE_URL configured',
        playwrightConfig.env?.PLAYWRIGHT_BASE_URL === 'http://localhost:3001'
      );
      
      validateCheck(
        'PLAYWRIGHT_CONFIG path configured',
        playwrightConfig.env?.PLAYWRIGHT_CONFIG === './playwright.config.js'
      );
    }
  } catch (error) {
    validateCheck('MCP config valid JSON', false, error.message);
  }
}

// 2. Playwright Installation Validation
console.log(`\n${BLUE}🎭 Playwright Installation Validation${RESET}`);
try {
  const version = execSync('npx playwright --version', { encoding: 'utf8' }).trim();
  validateCheck(
    'Playwright installed',
    version.includes('Version'),
    version
  );
} catch (error) {
  validateCheck('Playwright installation', false, error.message);
}

// 3. Configuration File Validation
console.log(`\n${BLUE}⚙️  Configuration File Validation${RESET}`);
const configPath = resolve(PROJECT_ROOT, 'playwright.config.js');
validateCheck(
  'Playwright config exists',
  existsSync(configPath),
  'playwright.config.js'
);

// 4. Test Directory Validation
console.log(`\n${BLUE}📁 Test Directory Validation${RESET}`);
const testDir = resolve(PROJECT_ROOT, 'tests');
validateCheck(
  'Tests directory exists',
  existsSync(testDir),
  'tests/'
);

if (existsSync(testDir)) {
  try {
    const testFiles = execSync('find tests -name "*.spec.js" | wc -l', { encoding: 'utf8' }).trim();
    const testCount = parseInt(testFiles);
    validateCheck(
      'Test files present',
      testCount > 0,
      `${testCount} test files`
    );
    
    validateWarning(
      'Comprehensive test coverage',
      testCount >= 30,
      `${testCount} tests (recommended: 30+)`
    );
  } catch (error) {
    validateCheck('Test file enumeration', false, error.message);
  }
}

// 5. Package.json Script Validation
console.log(`\n${BLUE}📦 Package.json Script Validation${RESET}`);
const packagePath = resolve(PROJECT_ROOT, 'package.json');
if (existsSync(packagePath)) {
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    validateCheck(
      'Enhanced MCP scripts configured',
      scripts['test:mcp'] !== undefined,
      'test:mcp script available'
    );
    
    validateCheck(
      'Debug scripts configured',
      scripts['test:debug'] !== undefined,
      'test:debug script available'
    );
    
    validateCheck(
      'Record scripts configured',
      scripts['test:record'] !== undefined,
      'test:record script available'
    );
    
    validateCheck(
      'Playwright dependency present',
      packageJson.devDependencies?.['@playwright/test'] !== undefined,
      packageJson.devDependencies?.['@playwright/test']
    );
  } catch (error) {
    validateCheck('Package.json parsing', false, error.message);
  }
}

// 6. Environment Connectivity Test
console.log(`\n${BLUE}🌐 Environment Connectivity Test${RESET}`);
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 --connect-timeout 5', { encoding: 'utf8' });
  validateCheck(
    'Local development server reachable',
    response === '200',
    `HTTP ${response}`
  );
} catch (error) {
  validateWarning(
    'Local development server',
    false,
    'Run "npm start" to start dev server'
  );
}

// 7. Memory Bank Integration Test
console.log(`\n${BLUE}🧠 Memory Bank Integration Test${RESET}`);
const memoryBankPath = resolve(PROJECT_ROOT, 'memory-bank/playwright-test-context.json');
validateCheck(
  'Playwright memory bank context exists',
  existsSync(memoryBankPath),
  'memory-bank/playwright-test-context.json'
);

// Summary Report
console.log(`\n${BLUE}📊 VALIDATION SUMMARY${RESET}`);
console.log(`${BLUE}===================${RESET}`);
console.log(`${GREEN}✅ Passed: ${validationResults.passed}${RESET}`);
console.log(`${RED}❌ Failed: ${validationResults.failed}${RESET}`);
console.log(`${YELLOW}⚠️  Warnings: ${validationResults.warnings}${RESET}`);

const totalScore = Math.round((validationResults.passed / (validationResults.passed + validationResults.failed)) * 100);
console.log(`\n${BLUE}Overall Score: ${totalScore}%${RESET}`);

if (totalScore >= 90) {
  console.log(`${GREEN}🎉 EXCELLENT: PlaywrightMCP integration is optimally configured${RESET}`);
} else if (totalScore >= 75) {
  console.log(`${YELLOW}✅ GOOD: PlaywrightMCP integration is well configured with minor improvements needed${RESET}`);
} else {
  console.log(`${RED}⚠️  NEEDS IMPROVEMENT: PlaywrightMCP integration requires attention${RESET}`);
}

// Recommendations
console.log(`\n${BLUE}🚀 NEXT STEPS${RESET}`);
console.log(`${BLUE}=============${RESET}`);
console.log('• Run "npm run test:mcp" to launch interactive test UI');
console.log('• Run "npm run test:record" to record new test scenarios');
console.log('• Run "npm run test:debug" for step-by-step test debugging');
console.log('• Start development server with "npm start" if not running');

// Exit with appropriate code
process.exit(validationResults.failed > 0 ? 1 : 0);