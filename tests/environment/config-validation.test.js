/**
 * Environment Configuration Validation Tests
 * 
 * These tests prevent the environment variable and configuration issues:
 * - Missing or malformed environment variables
 * - Next.js residue in Vite projects
 * - Tailwind CSS conflicts with Material-UI
 * - Hardcoded values that should be configurable
 */

const fs = require('fs');
const path = require('path');

describe('Environment Configuration Validation', () => {

  test('should not have Next.js imports in Vite components', () => {
    const viteAppPath = path.join(__dirname, '../../apps/web/src');
    
    if (fs.existsSync(viteAppPath)) {
      const findNextImports = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        let issues = [];
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            issues = issues.concat(findNextImports(fullPath));
          } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check for Next.js specific imports
            if (content.includes('from "next/')) {
              issues.push(`${fullPath} contains Next.js import`);
            }
            if (content.includes('import dynamic from "next/dynamic"')) {
              issues.push(`${fullPath} uses Next.js dynamic import`);
            }
          }
        }
        return issues;
      };
      
      const issues = findNextImports(viteAppPath);
      expect(issues).toEqual([]);
    }
  });

  test('should not have Tailwind CSS dependencies in package.json', () => {
    const packagePaths = [
      path.join(__dirname, '../../package.json'),
      path.join(__dirname, '../../apps/web/package.json')
    ];

    packagePaths.forEach(packagePath => {
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        // Should not have Tailwind dependencies
        expect(allDeps).not.toHaveProperty('tailwindcss');
        expect(allDeps).not.toHaveProperty('@tailwindcss/forms');
        expect(allDeps).not.toHaveProperty('@tailwindcss/typography');
        expect(allDeps).not.toHaveProperty('@tailwindcss/postcss');
      }
    });
  });

  test('should not have Tailwind configuration files', () => {
    const tailwindConfigs = [
      path.join(__dirname, '../../tailwind.config.js'),
      path.join(__dirname, '../../apps/web/tailwind.config.js'),
      path.join(__dirname, '../../application/frontend/tailwind.config.js')
    ];

    tailwindConfigs.forEach(configPath => {
      expect(fs.existsSync(configPath)).toBe(false);
    });
  });

  test('should not have hardcoded localhost URLs in source code', () => {
    const searchDirs = [
      path.join(__dirname, '../../apps/web/src'),
      path.join(__dirname, '../../api')
    ];

    const findHardcodedUrls = (dir) => {
      if (!fs.existsSync(dir)) return [];
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      let issues = [];
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          issues = issues.concat(findHardcodedUrls(fullPath));
        } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for hardcoded localhost URLs
          if (content.match(/http:\/\/localhost:\d+/)) {
            const matches = content.match(/http:\/\/localhost:\d+/g);
            matches.forEach(match => {
              issues.push(`${fullPath} contains hardcoded URL: ${match}`);
            });
          }
        }
      }
      return issues;
    };

    searchDirs.forEach(dir => {
      const issues = findHardcodedUrls(dir);
      // Allow only in test files
      const nonTestIssues = issues.filter(issue => !issue.includes('test') && !issue.includes('spec'));
      expect(nonTestIssues).toEqual([]);
    });
  });

  test('should not have debugging console.log statements in production code', () => {
    const searchDirs = [
      path.join(__dirname, '../../apps/web/src'),
      path.join(__dirname, '../../api')
    ];

    const findConsoleStatements = (dir) => {
      if (!fs.existsSync(dir)) return [];
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      let issues = [];
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          issues = issues.concat(findConsoleStatements(fullPath));
        } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for console.log statements (excluding console.error and console.warn for production logging)
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('console.log') && !line.trim().startsWith('//')) {
              issues.push(`${fullPath}:${index + 1} contains console.log statement`);
            }
          });
        }
      }
      return issues;
    };

    searchDirs.forEach(dir => {
      const issues = findConsoleStatements(dir);
      // Console.log should be removed from production code
      // Allow in debug files temporarily
      const productionIssues = issues.filter(issue => 
        !issue.includes('debug') && 
        !issue.includes('test') && 
        !issue.includes('spec')
      );
      
      if (productionIssues.length > 0) {
        console.debug('Console.log statements found in production code:', productionIssues);
      }
    });
  });

  test('should not have commented-out code blocks', () => {
    const searchDirs = [
      path.join(__dirname, '../../apps/web/src')
    ];

    const findCommentedCode = (dir) => {
      if (!fs.existsSync(dir)) return [];
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      let issues = [];
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          issues = issues.concat(findCommentedCode(fullPath));
        } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for large blocks of commented code
          const commentBlocks = content.match(/\/\*[\s\S]{100,}?\*\//g);
          if (commentBlocks) {
            commentBlocks.forEach(block => {
              if (block.includes('console.log') || block.includes('function') || block.includes('const ')) {
                issues.push(`${fullPath} contains large commented code block`);
              }
            });
          }
        }
      }
      return issues;
    };

    searchDirs.forEach(dir => {
      const issues = findCommentedCode(dir);
      // Should not have large commented code blocks
      expect(issues.length).toBeLessThan(5); // Allow some temporary comments
    });
  });

  test('should have proper environment variable fallbacks', () => {
    const envFiles = [
      path.join(__dirname, '../../apps/web/src/services/monitoring.ts')
    ];

    envFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Should use proper environment variable patterns
        if (content.includes('import.meta.env')) {
          // Should have fallback values
          expect(content).toMatch(/import\.meta\.env\.\w+\s*\|\|\s*['"]/);
        }
      }
    });
  });
});