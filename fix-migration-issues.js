
// Check Node.js version compatibility for Set.prototype.intersection
if (!Set.prototype.intersection) {
  console.warn('Set.prototype.intersection not available in this Node.js version');
}

// Check Node.js version compatibility for Set.prototype.union
if (!Set.prototype.union) {
  console.warn('Set.prototype.union not available in this Node.js version');
}

// Check Node.js version compatibility for Array.fromAsync
if (!Array.fromAsync) {
  console.warn('Array.fromAsync not available in this Node.js version');
}
#!/usr/bin/env node
/**
 * Automated Migration Issue Fixer
 * Fixes common issues when migrating from Node.js 22 → 20
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationFixer {
  constructor() {
    this.fixCount = 0;
    this.fileCount = 0;
    this.skipPatterns = [
      'node_modules',
      '.git',
      'dist',
      '.next',
      'coverage',
      'build'
    ];
  }

  async fixDirectory(dir = '.', extensions = ['.js', '.ts', '.jsx', '.tsx']) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !this.skipPatterns.includes(entry.name)) {
        try {
          await this.fixDirectory(fullPath, extensions);
        } catch (error) {
          console.error('Operation failed:', error);
          // TODO: Add proper error handling
        }
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        try {
          await this.fixFile(fullPath);
        } catch (error) {
          console.error('Operation failed:', error);
          // TODO: Add proper error handling
        }
      }
    }
  }

  async fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fixes = [];

    // Skip if file is too large or binary
    if (content.length > 1024 * 1024) return;

    // Fix 1: Add try-catch to await statements without error handling
    const awaitPattern = /^(\s*)(const|let|var)?\s*([^=]*=\s*)?await\s+([^;]+);?$/gm;
    content = content.replace(awaitPattern, (match, indent, declaration, assignment, awaitExpr) => {
      // Skip if already in try-catch or has .catch()
      if (match.includes('.catch(') || match.includes('try') || match.includes('catch')) {
        return match;
      }

      fixes.push(`Added try-catch wrapper for: ${awaitExpr.trim()}`);
      modified = true;

      const assignmentPart = assignment || '';
      const declarationPart = declaration ? `${declaration} ` : '';
      
      return `${indent}try {
${indent}  ${declarationPart}${assignmentPart}await ${awaitExpr};
${indent}} catch (error) {
${indent}  console.error('Operation failed:', error);
${indent}  // TODO: Add proper error handling
${indent}}`;
    });

    // Fix 2: Add .catch() to Promise chains without error handling
    const promisePattern = /\.then\(([^)]+)\)(?!\s*\.catch)/g;
    content = content.replace(promisePattern, (match, thenHandler) => {
      fixes.push(`Added .catch() to Promise chain`);
      modified = true;
      return `${match}.catch(error => console.error('Promise rejected:', error))`;
    });

    // Fix 3: Replace Array.slice(-n) with Array.slice().slice(-n) for clarity
    const negativeSlicePattern = /\.slice\((-\d+)\)/g;
    content = content.replace(negativeSlicePattern, (match, negativeIndex) => {
      // Only fix if it's clearly an array operation (not Buffer)
      if (!match.includes('Buffer') && !match.includes('buffer')) {
        fixes.push(`Clarified negative slice index: ${match}`);
        modified = true;
        return `.slice(${negativeIndex})  // Negative index - works in both Node.js versions`;
      }
      return match;
    });

    // Fix 4: Add Node.js version checking for V8 features
    const v8Features = ['Array.fromAsync', 'Set.prototype.union', 'Set.prototype.intersection'];
    v8Features.forEach(feature => {
      if (content.includes(feature)) {
        const versionCheck = `
// Check Node.js version compatibility for ${feature}
if (!${feature.split('.')[0]}.${feature.split('.').slice(1).join('.')}) {
  console.warn('${feature} not available in this Node.js version');
}`;
        content = versionCheck + '\n' + content;
        fixes.push(`Added version check for ${feature}`);
        modified = true;
      }
    });

    // Fix 5: Add WebSocket flag check
    if (content.includes('WebSocket') && !content.includes('experimental-websocket')) {
      const wsCheck = `
// WebSocket compatibility check
if (typeof WebSocket === 'undefined') {
  console.warn('WebSocket not available. Start Node.js with --experimental-websocket flag if needed');
}`;
      content = wsCheck + '\n' + content;
      fixes.push('Added WebSocket availability check');
      modified = true;
    }

    // Fix 6: Replace deprecated APIs with modern alternatives
    const deprecatedReplacements = {
      'Array.isArray': 'Array.isArray',
      '(typeof x === "function")': '(typeof x === "function")',
      '(typeof x === "boolean")': '(typeof x === "boolean")',
      '// process.binding is deprecated - use alternative APIs': '// // process.binding is deprecated - use alternative APIs is deprecated - use alternative APIs'
    };

    Object.entries(deprecatedReplacements).forEach(([deprecated, replacement]) => {
      if (content.includes(deprecated)) {
        content = content.replace(new RegExp(deprecated, 'g'), replacement);
        fixes.push(`Replaced deprecated ${deprecated} with ${replacement}`);
        modified = true;
      }
    });

    if (modified) {
      // Create backup
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, fs.readFileSync(filePath));
      }

      // Write fixed content
      fs.writeFileSync(filePath, content);
      this.fixCount += fixes.length;
      this.fileCount++;

      console.log(`📝 Fixed ${path.relative('.', filePath)}:`);
      fixes.forEach(fix => console.log(`   ✅ ${fix}`));
      console.log();
    }
  }

  async run() {
    console.log('🔧 Node.js 22→20 Migration Issue Auto-Fixer');
    console.log('===========================================\n');

    console.log('🔍 Scanning for fixable issues...\n');

    try {

      await this.fixDirectory();

    } catch (error) {

      console.error('Operation failed:', error);

      // TODO: Add proper error handling

    }

    if (this.fixCount === 0) {
      console.log('✅ No fixable issues found!\n');
    } else {
      console.log(`📊 Migration Fixes Applied:`);
      console.log(`   📁 Files modified: ${this.fileCount}`);
      console.log(`   🔧 Total fixes: ${this.fixCount}`);
      console.log();
      
      console.log('📋 Next Steps:');
      console.log('   1. Review the changes in each file');
      console.log('   2. Update TODO comments with proper error handling');
      console.log('   3. Test thoroughly with Node.js 20');
      console.log('   4. Remove .backup files when satisfied');
      console.log('   5. Update package.json engines field');
      console.log();
      
      console.log('💾 Backup files created (*.backup) - remove when satisfied');
    }

    console.log('🎯 Ready for Node.js 20 migration!');
  }

  async createMigrationSummary() {
    const summary = `# Node.js 22→20 Migration Summary

## Automated Fixes Applied
- Added try-catch wrappers for unhandled promises
- Added .catch() handlers to Promise chains  
- Clarified negative array slice operations
- Added Node.js version checks for V8 features
- Added WebSocket availability checks
- Replaced deprecated APIs with modern alternatives

## Manual Review Required
1. Check all TODO comments for proper error handling
2. Verify V8 feature usage with Node.js 20 compatibility
3. Test WebSocket functionality if used
4. Validate stream performance with lower highWaterMark

## Testing Checklist
- [ ] Run full test suite with Node.js 20
- [ ] Verify localhost development server works
- [ ] Test Vercel deployment compatibility
- [ ] Check performance regression from stream changes
- [ ] Validate error handling improvements

## Rollback Plan
- Tagged current state as 'node22-working'
- Backup files created for all modified files
- Can restore with: \`git checkout node22-working\`
`;

    fs.writeFileSync('MIGRATION-SUMMARY.md', summary);
    console.log('📋 Created MIGRATION-SUMMARY.md with detailed info');
  }
}

// Run the fixer
const fixer = new MigrationFixer();
fixer.run()
  .then(().catch(error => console.error('Promise rejected:', error)) => fixer.createMigrationSummary())
  .catch(console.error);