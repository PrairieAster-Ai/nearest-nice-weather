/**
 * Vercel Configuration Validation Tests
 *
 * These tests prevent the deployment configuration issues we encountered:
 * - JSON syntax errors in vercel.json
 * - Function runtime configuration problems
 * - Missing or conflicting environment variables
 */

const fs = require('fs');
const path = require('path');

describe('Vercel Configuration Validation', () => {
  const vercelConfigPath = path.join(__dirname, '../../vercel.json');

  test('vercel.json should exist and be valid JSON', () => {
    expect(fs.existsSync(vercelConfigPath)).toBe(true);

    const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
    expect(() => JSON.parse(configContent)).not.toThrow();
  });

  test('vercel.json should not contain function runtime errors', () => {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    // Should not have problematic function configurations
    if (config.functions) {
      Object.values(config.functions).forEach(funcConfig => {
        if (funcConfig.runtime) {
          // Should not use the problematic @vercel/node format
          expect(funcConfig.runtime).not.toBe('@vercel/node');
          // Should use proper Node.js runtime versions
          expect(funcConfig.runtime).toMatch(/^nodejs\d+\.x$/);
        }
      });
    }
  });

  test('vercel.json should have proper build configuration', () => {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    expect(config.buildCommand).toBeDefined();
    expect(config.outputDirectory).toBeDefined();
    expect(config.installCommand).toBeDefined();

    // Should point to correct output directory
    expect(config.outputDirectory).toBe('apps/web/dist');
  });

  test('vercel.json should not have trailing commas', () => {
    const configContent = fs.readFileSync(vercelConfigPath, 'utf8');

    // Check for common trailing comma patterns that break JSON
    expect(configContent).not.toMatch(/,\s*\]/); // Array trailing comma
    expect(configContent).not.toMatch(/,\s*\}/); // Object trailing comma
  });

  test('vercel.json should have proper API rewrites', () => {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    expect(config.rewrites).toBeDefined();
    expect(Array.isArray(config.rewrites)).toBe(true);

    // Should have frontend rewrite rule that excludes API routes
    const frontendRewrite = config.rewrites.find(rule => rule.source === '/((?!api).*)');
    expect(frontendRewrite).toBeDefined();
    expect(frontendRewrite.destination).toBe('/index.html');

    // API routes are handled automatically by Vercel serverless functions
    // No explicit API rewrite needed when using /api/ directory structure
  });

  test('should not have duplicate vercel.json files', () => {
    const duplicateLocations = [
      path.join(__dirname, '../../apps/web/vercel.json'),
      path.join(__dirname, '../../apps/api/vercel.json'),
      path.join(__dirname, '../../application/frontend/vercel.json')
    ];

    duplicateLocations.forEach(location => {
      expect(fs.existsSync(location)).toBe(false);
    });
  });
});
