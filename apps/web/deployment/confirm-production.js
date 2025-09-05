#!/usr/bin/env node
/**
 * Production Deployment Confirmation Script
 *
 * This script prevents accidental production deployments by requiring
 * explicit confirmation and providing deployment context.
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const message = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();

    return { branch, hash, message, status };
  } catch (error) {
    return { branch: 'unknown', hash: 'unknown', message: 'unknown', status: '' };
  }
}

function getPackageInfo() {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description
    };
  } catch (error) {
    return { name: 'unknown', version: 'unknown', description: 'unknown' };
  }
}

function showDeploymentInfo() {
  const git = getGitInfo();
  const pkg = getPackageInfo();

  console.log(`\n${colorize('🚀 PRODUCTION DEPLOYMENT CONFIRMATION', 'bold')}`);
  console.log(`${colorize('═══════════════════════════════════════', 'cyan')}\n`);

  console.log(`${colorize('📦 Project:', 'blue')} ${pkg.name}`);
  console.log(`${colorize('📝 Description:', 'blue')} ${pkg.description}`);
  console.log(`${colorize('🏷️  Version:', 'blue')} ${pkg.version}\n`);

  console.log(`${colorize('🌿 Branch:', 'green')} ${git.branch}`);
  console.log(`${colorize('🔗 Commit:', 'green')} ${git.hash}`);
  console.log(`${colorize('💬 Message:', 'green')} ${git.message}\n`);

  if (git.status) {
    console.log(`${colorize('⚠️  WARNING: Uncommitted changes detected!', 'yellow')}`);
    console.log(`${colorize(git.status, 'yellow')}\n`);
  }

  console.log(`${colorize('🎯 Target:', 'magenta')} Production (www.nearestniceweather.com)`);
  console.log(`${colorize('🌐 Environment:', 'magenta')} Live production environment\n`);

  // Show recent deployments
  try {
    console.log(`${colorize('📋 Recent deployments:', 'cyan')}`);
    const deployments = execSync('vercel ls --scope=roberts-projects-3488152a | head -5', { encoding: 'utf8' });
    console.log(deployments);
  } catch (error) {
    console.log(`${colorize('Unable to fetch recent deployments', 'yellow')}\n`);
  }
}

function confirmDeployment() {
  console.log(`${colorize('❓ Deploy to production?', 'bold')}`);
  console.log(`${colorize('   Type "DEPLOY" to confirm production deployment:', 'white')}`);
  console.log(`${colorize('   Type anything else to cancel:', 'white')}\n`);

  // For Claude Code interface, we'll use a different approach
  console.log(`${colorize('🤖 Claude Code Interface:', 'cyan')}`);
  console.log(`${colorize('   This script requires manual confirmation.', 'white')}`);
  console.log(`${colorize('   Run with --confirm flag to proceed:', 'white')}`);
  console.log(`${colorize('   npm run deploy:prod -- --confirm', 'green')}\n`);

  return false; // Always return false for manual confirmation
}

function main() {
  const args = process.argv.slice(2);
  const isConfirmed = args.includes('--confirm');

  showDeploymentInfo();

  if (!isConfirmed) {
    const shouldDeploy = confirmDeployment();
    if (!shouldDeploy) {
      console.log(`${colorize('🛑 Production deployment cancelled', 'red')}\n`);
      process.exit(1);
    }
  } else {
    console.log(`${colorize('✅ Deployment confirmed with --confirm flag', 'green')}\n`);
  }

  // Pre-deployment checks
  console.log(`${colorize('🔍 Running pre-deployment checks...', 'cyan')}`);

  try {
    console.log(`${colorize('   ✓ Linting...', 'green')}`);
    execSync('npm run lint', { stdio: 'inherit' });

    console.log(`${colorize('   ✓ Type checking...', 'green')}`);
    execSync('npm run type-check', { stdio: 'inherit' });

    console.log(`${colorize('   ✓ Building...', 'green')}`);
    execSync('npm run build', { stdio: 'inherit' });

    console.log(`\n${colorize('🚀 Deploying to production...', 'green')}`);
    execSync('vercel --prod', { stdio: 'inherit' });

    console.log(`\n${colorize('🎉 Production deployment completed!', 'green')}`);

  } catch (error) {
    console.log(`\n${colorize('❌ Deployment failed:', 'red')}`);
    console.log(`${colorize(error.message, 'red')}\n`);
    process.exit(1);
  }
}

main();
