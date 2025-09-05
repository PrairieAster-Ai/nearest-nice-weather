#!/usr/bin/env node

/**
 * Environment Security Validator
 * Validates environment files for exposed credentials and sensitive information
 * Used by pre-commit hooks to prevent credential exposure
 */

const fs = require('fs');
const path = require('path');

// Dangerous patterns that should never appear in files
const DANGEROUS_PATTERNS = [
  {
    name: 'GitHub Personal Access Token',
    pattern: /github_pat_[a-zA-Z0-9_]{36,}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Neon API Key',
    pattern: /ssk_[a-zA-Z0-9]+/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Database URL with real credentials',
    pattern: /postgresql:\/\/(?!username:password@|neondb_owner:your_password@)[^@\s]+:[^@\s]+@[^\/\s]+/g,
    severity: 'HIGH'
  },
  {
    name: 'MongoDB URL with credentials',
    pattern: /mongodb:\/\/(?!username:password@)[^@\s]+:[^@\s]+@[^\/\s]+/g,
    severity: 'HIGH'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Private Key Headers',
    pattern: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Hardcoded API Keys',
    pattern: /(?:api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*["'](?!\$\{|your-|example-|test-)[a-zA-Z0-9]{20,}["']/gi,
    severity: 'HIGH'
  }
];

// Files to check for credentials
const FILES_TO_CHECK = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  'config/environments/.env.backup',
  'config/environments/.env.vercel',
  'config/environments/.env.development',
  'config/environments/.env.production'
];

// Directories to scan recursively
const DIRS_TO_SCAN = [
  '.mcp',
  'config',
  'scripts'
];

// Patterns for files that should be excluded
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /\.lock$/,
  /\.min\.js$/,
  /package-lock\.json$/,
  /\.log$/,
  /validate-env\.(js|cjs)$/, // Don't scan ourselves
  /\.secrets\.baseline$/,
  /README\.md$/,
  /.*\.test\.(js|ts|jsx|tsx)$/,
  /.*\.spec\.(js|ts|jsx|tsx)$/,
  /tests\/.*$/,
  /playwright\.config\.(js|ts)$/,
  /documentation\/.*$/
];

// Template/placeholder patterns to ignore
const TEMPLATE_PATTERNS = [
  /your-.*-key/,
  /your-.*-token/,
  /your-.*-secret/,
  /example-.*-key/,
  /username:password@/,
  /neondb_owner:your_password@/,
  /your_password@/,
  /ep-development-xxxxx/,
  /ep-production-xxxxx/,
  /postgres:postgres@localhost:5432/
];

class SecurityValidator {
  constructor() {
    this.issues = [];
    this.scannedFiles = 0;
  }

  log(level, message) {
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      SUCCESS: '\x1b[32m', // Green
      RESET: '\x1b[0m'     // Reset
    };

    console.log(`${colors[level] || ''}${message}${colors.RESET}`);
  }

  shouldExcludeFile(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
  }

  scanFile(filePath) {
    if (!fs.existsSync(filePath) || this.shouldExcludeFile(filePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.scannedFiles++;

      DANGEROUS_PATTERNS.forEach(({ name, pattern, severity }) => {
        const matches = Array.from(content.matchAll(pattern));

        matches.forEach(match => {
          // Skip if this matches a template pattern
          const isTemplate = TEMPLATE_PATTERNS.some(templatePattern =>
            templatePattern.test(match[0])
          );

          if (!isTemplate) {
            this.issues.push({
              file: filePath,
              type: name,
              severity,
              line: this.findLineNumber(content, match.index),
              preview: this.getContextPreview(content, match.index, match[0])
            });
          }
        });
      });
    } catch (error) {
      this.log('WARN', `Could not scan ${filePath}: ${error.message}`);
    }
  }

  findLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getContextPreview(content, index, match) {
    const start = Math.max(0, index - 20);
    const end = Math.min(content.length, index + match.length + 20);
    const preview = content.substring(start, end);

    // Mask the actual credential but show context
    return preview.replace(match, '[REDACTED]');
  }

  scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !this.shouldExcludeFile(fullPath)) {
          this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          this.scanFile(fullPath);
        }
      });
    } catch (error) {
      this.log('WARN', `Could not scan directory ${dirPath}: ${error.message}`);
    }
  }

  validateEnvironment() {
    this.log('INFO', '🔍 Starting security validation...');

    // Check specific environment files
    FILES_TO_CHECK.forEach(file => this.scanFile(file));

    // Scan security-sensitive directories
    DIRS_TO_SCAN.forEach(dir => this.scanDirectory(dir));

    this.log('INFO', `📋 Scanned ${this.scannedFiles} files`);

    return this.reportResults();
  }

  reportResults() {
    if (this.issues.length === 0) {
      this.log('SUCCESS', '✅ Security validation passed - no credentials found');
      return true;
    }

    this.log('ERROR', `🚨 SECURITY VIOLATION: Found ${this.issues.length} potential credential(s):`);
    console.log('');

    // Group by severity
    const bySeverity = this.issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});

    ['CRITICAL', 'HIGH', 'MEDIUM'].forEach(severity => {
      const issues = bySeverity[severity] || [];
      if (issues.length === 0) return;

      this.log('ERROR', `${severity} (${issues.length}):`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.type}`);
        console.log(`     File: ${issue.file}:${issue.line}`);
        console.log(`     Context: ${issue.preview}`);
        console.log('');
      });
    });

    this.log('ERROR', '');
    this.log('ERROR', '🛡️  REMEDIATION REQUIRED:');
    this.log('ERROR', '   1. Remove exposed credentials from files');
    this.log('ERROR', '   2. Use environment variables: ${VARIABLE_NAME}');
    this.log('ERROR', '   3. Add sensitive files to .gitignore');
    this.log('ERROR', '   4. Rotate any exposed credentials');
    this.log('ERROR', '');

    return false;
  }
}

// CLI execution
if (require.main === module) {
  const validator = new SecurityValidator();
  const passed = validator.validateEnvironment();

  process.exit(passed ? 0 : 1);
}

module.exports = { SecurityValidator };
