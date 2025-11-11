#!/usr/bin/env node

/**
 * Verify Claude Code Configuration
 * Validates SessionStart hook setup for Nearest Nice Weather
 */

import { readFileSync, existsSync, accessSync, constants } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const NC = '\x1b[0m'; // No Color

let totalScore = 0;
let maxScore = 100;
let errors = [];
let warnings = [];

console.log(`${BLUE}🔍 Claude Code Configuration Verification${NC}`);
console.log(`${BLUE}===========================================${NC}\n`);

// Test 1: Check .claude/settings.json exists
console.log(`${BLUE}1. Checking .claude/settings.json...${NC}`);
const settingsPath = join(PROJECT_ROOT, '.claude/settings.json');
if (existsSync(settingsPath)) {
    try {
        const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

        if (settings.hooks && settings.hooks.SessionStart) {
            console.log(`${GREEN}✓ settings.json exists with SessionStart hook${NC}`);
            totalScore += 20;

            // Check hook configuration
            const sessionStartHooks = settings.hooks.SessionStart;
            if (Array.isArray(sessionStartHooks) && sessionStartHooks.length > 0) {
                const firstHook = sessionStartHooks[0];
                if (firstHook.hooks && firstHook.hooks[0] && firstHook.hooks[0].command) {
                    console.log(`${GREEN}  Hook command: ${firstHook.hooks[0].command}${NC}`);
                    totalScore += 10;
                } else {
                    warnings.push('SessionStart hook missing command configuration');
                    console.log(`${YELLOW}⚠ Hook configuration incomplete${NC}`);
                }
            }
        } else {
            errors.push('settings.json missing SessionStart hook configuration');
            console.log(`${RED}✗ SessionStart hook not configured${NC}`);
        }
    } catch (err) {
        errors.push(`settings.json parse error: ${err.message}`);
        console.log(`${RED}✗ Invalid JSON: ${err.message}${NC}`);
    }
} else {
    errors.push('.claude/settings.json does not exist');
    console.log(`${RED}✗ settings.json not found${NC}`);
}

// Test 2: Check session-start.sh exists and is executable
console.log(`\n${BLUE}2. Checking .claude/hooks/session-start.sh...${NC}`);
const hookPath = join(PROJECT_ROOT, '.claude/hooks/session-start.sh');
if (existsSync(hookPath)) {
    console.log(`${GREEN}✓ session-start.sh exists${NC}`);
    totalScore += 15;

    try {
        accessSync(hookPath, constants.X_OK);
        console.log(`${GREEN}✓ session-start.sh is executable${NC}`);
        totalScore += 10;
    } catch (err) {
        warnings.push('session-start.sh is not executable - run: chmod +x .claude/hooks/session-start.sh');
        console.log(`${YELLOW}⚠ Not executable - run: chmod +x .claude/hooks/session-start.sh${NC}`);
    }
} else {
    errors.push('.claude/hooks/session-start.sh does not exist');
    console.log(`${RED}✗ session-start.sh not found${NC}`);
}

// Test 3: Check Memory Bank files
console.log(`\n${BLUE}3. Checking Memory Bank context files...${NC}`);
const memoryBankFiles = [
    'memory-bank/quick-reference.json',
    'memory-bank/latest-health-check.json',
    'memory-bank/business-context/core-business-model.json'
];

let memoryBankScore = 0;
for (const file of memoryBankFiles) {
    const filePath = join(PROJECT_ROOT, file);
    if (existsSync(filePath)) {
        console.log(`${GREEN}✓ ${file}${NC}`);
        memoryBankScore += 5;
    } else {
        warnings.push(`Missing ${file}`);
        console.log(`${YELLOW}⚠ ${file} not found${NC}`);
    }
}
totalScore += memoryBankScore;

// Test 4: Check critical development scripts
console.log(`\n${BLUE}4. Checking development scripts...${NC}`);
const criticalScripts = [
    'scripts/comprehensive-health-check.sh',
    'dev-startup-optimized.sh',
    'scripts/environment-validation.sh'
];

let scriptsScore = 0;
for (const script of criticalScripts) {
    const scriptPath = join(PROJECT_ROOT, script);
    if (existsSync(scriptPath)) {
        console.log(`${GREEN}✓ ${script}${NC}`);
        scriptsScore += 5;
    } else {
        warnings.push(`Missing ${script}`);
        console.log(`${YELLOW}⚠ ${script} not found${NC}`);
    }
}
totalScore += scriptsScore;

// Test 5: Test hook execution
console.log(`\n${BLUE}5. Testing hook execution...${NC}`);
try {
    const output = execSync('./.claude/hooks/session-start.sh', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        timeout: 10000
    });

    // Check for JSON output
    if (output.includes('hookSpecificOutput')) {
        console.log(`${GREEN}✓ Hook executes successfully${NC}`);
        totalScore += 15;

        // Check for required context fields
        if (output.includes('Business Model') && output.includes('Environment Health')) {
            console.log(`${GREEN}✓ Hook provides required context${NC}`);
            totalScore += 10;
        } else {
            warnings.push('Hook output missing some context sections');
            console.log(`${YELLOW}⚠ Hook output incomplete${NC}`);
        }
    } else {
        warnings.push('Hook output missing JSON structure');
        console.log(`${YELLOW}⚠ Hook output format unexpected${NC}`);
        totalScore += 5;
    }
} catch (err) {
    errors.push(`Hook execution failed: ${err.message}`);
    console.log(`${RED}✗ Hook execution failed: ${err.message}${NC}`);
}

// Test 6: Check latest health status
console.log(`\n${BLUE}6. Checking environment health status...${NC}`);
const healthCheckPath = join(PROJECT_ROOT, 'memory-bank/latest-health-check.json');
if (existsSync(healthCheckPath)) {
    try {
        const healthCheck = JSON.parse(readFileSync(healthCheckPath, 'utf-8'));
        const score = healthCheck.healthScore || healthCheck.finalScore || 0;
        const timestamp = healthCheck.timestamp || 'unknown';

        console.log(`${GREEN}✓ Health check available (score: ${score}/100)${NC}`);
        console.log(`  Last checked: ${timestamp}`);
        totalScore += 10;

        if (score >= 90) {
            console.log(`${GREEN}  Status: EXCELLENT - Full development capability${NC}`);
        } else if (score >= 70) {
            console.log(`${YELLOW}  Status: DEGRADED - Incremental changes recommended${NC}`);
            warnings.push(`Health score degraded: ${score}/100 - run: ./scripts/comprehensive-health-check.sh localhost`);
        } else {
            console.log(`${RED}  Status: CRITICAL - Environment fixes required${NC}`);
            errors.push(`Health score critical: ${score}/100 - fix environment issues before development`);
        }
    } catch (err) {
        warnings.push(`Health check file parse error: ${err.message}`);
        console.log(`${YELLOW}⚠ Invalid health check data${NC}`);
    }
} else {
    warnings.push('No recent health check - run: ./scripts/comprehensive-health-check.sh localhost');
    console.log(`${YELLOW}⚠ No health check data available${NC}`);
}

// Summary
console.log(`\n${BLUE}===========================================${NC}`);
console.log(`${BLUE}Verification Score: ${totalScore}/${maxScore}${NC}\n`);

if (totalScore >= 90) {
    console.log(`${GREEN}✅ EXCELLENT - Claude Code configuration fully operational${NC}`);
} else if (totalScore >= 70) {
    console.log(`${YELLOW}⚠️ GOOD - Configuration working but has minor issues${NC}`);
} else if (totalScore >= 50) {
    console.log(`${YELLOW}⚠️ DEGRADED - Configuration needs attention${NC}`);
} else {
    console.log(`${RED}❌ CRITICAL - Configuration requires fixes${NC}`);
}

if (warnings.length > 0) {
    console.log(`\n${YELLOW}Warnings (${warnings.length}):${NC}`);
    warnings.forEach(w => console.log(`${YELLOW}  ⚠ ${w}${NC}`));
}

if (errors.length > 0) {
    console.log(`\n${RED}Errors (${errors.length}):${NC}`);
    errors.forEach(e => console.log(`${RED}  ✗ ${e}${NC}`));
}

console.log(`\n${BLUE}Next Steps:${NC}`);
if (totalScore < 90) {
    console.log(`  1. Fix errors and warnings listed above`);
    console.log(`  2. Run this script again to verify`);
    console.log(`  3. Test SessionStart hook: ./.claude/hooks/session-start.sh`);
} else {
    console.log(`  ${GREEN}✓ Configuration ready for Claude Code on the web!${NC}`);
    console.log(`  ${GREEN}✓ SessionStart hook will run automatically on new sessions${NC}`);
}

console.log(`\n${BLUE}Documentation:${NC}`);
console.log(`  - Configuration: .claude/README.md`);
console.log(`  - Project docs: CLAUDE.md`);
console.log(`  - GitHub Wiki: https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki`);

process.exit(errors.length > 0 ? 1 : 0);
