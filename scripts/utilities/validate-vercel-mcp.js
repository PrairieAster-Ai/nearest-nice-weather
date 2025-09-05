#!/usr/bin/env node

/**
 * ========================================================================
 * VERCEL MCP VALIDATION SCRIPT
 * ========================================================================
 *
 * @PURPOSE: Validate Vercel MCP server configuration and integration
 * @SCOPE: Deployment automation, preview environment management, monitoring
 *
 * Key Validations:
 * - MCP server configuration
 * - Vercel CLI availability
 * - Project configuration
 * - Deployment status
 * - Preview environment management
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

console.log(`${BLUE}🚀 Vercel MCP Configuration Validation${RESET}`);
console.log(`${BLUE}=====================================\n${RESET}`);

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

if (existsSync(mcpConfigPath)) {
  try {
    const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));

    validateCheck(
      'Vercel MCP server configured',
      mcpConfig.mcpServers?.vercel !== undefined,
      'Found @mistertk/vercel-mcp in configuration'
    );

    const vercelConfig = mcpConfig.mcpServers?.vercel;
    if (vercelConfig) {
      validateCheck(
        'Vercel MCP package specified',
        vercelConfig.args?.includes('@mistertk/vercel-mcp@latest'),
        '@mistertk/vercel-mcp@latest'
      );

      validateCheck(
        'Environment variables configured',
        vercelConfig.env !== undefined,
        `${Object.keys(vercelConfig.env || {}).length} env vars`
      );

      validateWarning(
        'Access token configured',
        vercelConfig.env?.VERCEL_ACCESS_TOKEN !== 'VERCEL_TOKEN_PLACEHOLDER',
        'Update VERCEL_ACCESS_TOKEN in MCP config'
      );

      validateCheck(
        'Project name configured',
        vercelConfig.env?.VERCEL_PROJECT_NAME === 'nearest-nice-weather'
      );
    }
  } catch (error) {
    validateCheck('MCP config valid JSON', false, error.message);
  }
}

// 2. Vercel CLI Validation
console.log(`\n${BLUE}🛠️  Vercel CLI Validation${RESET}`);
try {
  const vercelVersion = execSync('vercel --version 2>/dev/null || npx vercel --version', { encoding: 'utf8' }).trim();
  validateCheck(
    'Vercel CLI available',
    vercelVersion.includes('Vercel CLI'),
    vercelVersion
  );
} catch (error) {
  validateCheck('Vercel CLI installation', false, 'Install with: npm i -g vercel');
}

// 3. Project Configuration Validation
console.log(`\n${BLUE}📁 Project Configuration Validation${RESET}`);
const vercelJsonPath = resolve(PROJECT_ROOT, 'vercel.json');
validateCheck(
  'vercel.json exists',
  existsSync(vercelJsonPath),
  'Vercel deployment configuration'
);

const packageJsonPath = resolve(PROJECT_ROOT, 'package.json');
if (existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};

    validateCheck(
      'Deploy scripts configured',
      scripts['deploy:preview'] !== undefined,
      'npm run deploy:preview available'
    );

    validateCheck(
      'Validation scripts configured',
      scripts['validate:preview'] !== undefined,
      'Environment validation available'
    );
  } catch (error) {
    validateCheck('Package.json parsing', false, error.message);
  }
}

// 4. Deployment Status Check
console.log(`\n${BLUE}🌐 Deployment Status Check${RESET}`);
try {
  // Check if currently in a Vercel project
  const gitRemote = execSync('git remote get-url origin 2>/dev/null || echo "no-remote"', { encoding: 'utf8' }).trim();
  validateCheck(
    'Git remote configured',
    gitRemote !== 'no-remote' && gitRemote.includes('github.com'),
    'GitHub repository linked'
  );

  // Check if .vercel directory exists (indicates previous deployments)
  const vercelDirPath = resolve(PROJECT_ROOT, '.vercel');
  validateWarning(
    'Previous Vercel deployments',
    existsSync(vercelDirPath),
    'Run vercel --prod to initialize'
  );

} catch (error) {
  validateWarning('Deployment status check', false, error.message);
}

// 5. Environment Variables Check
console.log(`\n${BLUE}🔐 Environment Variables Check${RESET}`);
const envPath = resolve(PROJECT_ROOT, '.env');
const envExamplePath = resolve(PROJECT_ROOT, '.env.example');

validateCheck(
  '.env.example exists',
  existsSync(envExamplePath),
  'Environment template available'
);

validateCheck(
  '.env exists',
  existsSync(envPath),
  'Local environment configured'
);

// 6. Rapid Development Workflow Validation
console.log(`\n${BLUE}⚡ Rapid Development Workflow${RESET}`);
const rapidDevPath = resolve(PROJECT_ROOT, 'RAPID-DEVELOPMENT.md');
validateCheck(
  'Rapid development documentation',
  existsSync(rapidDevPath),
  'Innovation Infrastructure Advantage documented'
);

const quickExperimentPath = resolve(PROJECT_ROOT, 'scripts/quick-experiment.sh');
validateWarning(
  'Quick experiment script',
  existsSync(quickExperimentPath),
  'Create quick-experiment.sh for 2-minute deployments'
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
  console.log(`${GREEN}🎉 EXCELLENT: Vercel MCP integration is optimally configured${RESET}`);
} else if (totalScore >= 75) {
  console.log(`${YELLOW}✅ GOOD: Vercel MCP integration is well configured${RESET}`);
} else {
  console.log(`${RED}⚠️  NEEDS SETUP: Vercel MCP integration requires attention${RESET}`);
}

// Recommendations
console.log(`\n${BLUE}🚀 NEXT STEPS${RESET}`);
console.log(`${BLUE}=============${RESET}`);
console.log('• Obtain Vercel access token: https://vercel.com/account/tokens');
console.log('• Update VERCEL_ACCESS_TOKEN in .mcp/claude-desktop-config.json');
console.log('• Run "vercel login" to authenticate CLI');
console.log('• Test deployment with "npm run deploy:preview"');

// Development Velocity Benefits
console.log(`\n${BLUE}💡 DEVELOPMENT VELOCITY BENEFITS${RESET}`);
console.log(`${BLUE}==================================${RESET}`);
console.log('• Deploy experiments directly from Claude conversations');
console.log('• Manage preview environments without leaving context');
console.log('• Monitor deployment status in real-time');
console.log('• Automate preview domain aliasing (p.nearestniceweather.com)');
console.log('• 10-50x faster hypothesis validation (per Innovation Infrastructure Advantage)');

// Exit with appropriate code
process.exit(validationResults.failed > 0 ? 1 : 0);
