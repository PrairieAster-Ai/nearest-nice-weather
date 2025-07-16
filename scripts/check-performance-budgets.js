#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Performance Budget Checker for Nearest Nice Weather
 * 
 * Analyzes build output and enforces performance budgets
 * Generates reports for CI/CD pipeline integration
 */

// Performance budgets configuration
const PERFORMANCE_BUDGETS = {
  // Bundle size limits (bytes) - Realistic for React + Material-UI + Leaflet stack
  maxTotalSize: 1500000,      // 1.5MB total
  maxJSBundle: 850000,        // 850KB for JS (adjusted for our current stack)
  maxCSSBundle: 200000,       // 200KB for CSS
  maxAssetSize: 500000,       // 500KB for individual assets
  maxChunks: 15,              // Maximum number of chunks
  
  // Core Web Vitals targets
  maxLCP: 2500,               // Largest Contentful Paint (ms)
  maxFID: 100,                // First Input Delay (ms)
  maxCLS: 0.1,                // Cumulative Layout Shift
  
  // Performance score targets
  minPerformanceScore: 85,    // Lighthouse performance score
  minAccessibilityScore: 90,  // Accessibility score
  minSEOScore: 80,           // SEO score
};

// File paths
const DIST_PATH = path.join(__dirname, '../apps/web/dist');
const STATS_PATH = path.join(DIST_PATH, 'stats.html');
const REPORT_PATH = path.join(__dirname, '../performance-report.json');

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get gzipped size of a file
 */
function getGzippedSize(filePath) {
  try {
    const gzipped = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' });
    return parseInt(gzipped.trim());
  } catch (error) {
    return 0;
  }
}

/**
 * Analyze bundle sizes and structure
 */
function analyzeBundleSize() {
  console.log('📊 Analyzing bundle sizes...');
  
  if (!fs.existsSync(DIST_PATH)) {
    throw new Error(`Build directory not found: ${DIST_PATH}`);
  }
  
  const files = fs.readdirSync(DIST_PATH, { recursive: true })
    .filter(file => typeof file === 'string')
    .map(file => path.join(DIST_PATH, file))
    .filter(file => fs.statSync(file).isFile());
  
  const analysis = {
    totalSize: 0,
    totalGzippedSize: 0,
    jsSize: 0,
    cssSize: 0,
    assetSize: 0,
    chunkCount: 0,
    files: []
  };
  
  files.forEach(file => {
    const ext = path.extname(file);
    const size = getFileSize(file);
    const gzippedSize = getGzippedSize(file);
    const relativePath = path.relative(DIST_PATH, file);
    
    analysis.totalSize += size;
    analysis.totalGzippedSize += gzippedSize;
    
    if (ext === '.js') {
      analysis.jsSize += size;
      if (relativePath.includes('chunk') || relativePath.includes('assets')) {
        analysis.chunkCount++;
      }
    } else if (ext === '.css') {
      analysis.cssSize += size;
    } else if (['.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'].includes(ext)) {
      analysis.assetSize += size;
    }
    
    analysis.files.push({
      path: relativePath,
      size,
      gzippedSize,
      type: ext.slice(1) || 'other'
    });
  });
  
  return analysis;
}

/**
 * Check performance budgets against analysis
 */
function checkBudgets(analysis) {
  console.log('🎯 Checking performance budgets...');
  
  const results = [];
  
  // Total size budget
  results.push({
    name: 'Total Bundle Size',
    actual: `${(analysis.totalSize / 1024).toFixed(1)}KB`,
    limit: `${(PERFORMANCE_BUDGETS.maxTotalSize / 1024).toFixed(1)}KB`,
    status: analysis.totalSize <= PERFORMANCE_BUDGETS.maxTotalSize ? 'pass' : 'fail',
    impact: analysis.totalSize > PERFORMANCE_BUDGETS.maxTotalSize ? 'high' : 'none'
  });
  
  // JavaScript size budget
  results.push({
    name: 'JavaScript Bundle Size',
    actual: `${(analysis.jsSize / 1024).toFixed(1)}KB`,
    limit: `${(PERFORMANCE_BUDGETS.maxJSBundle / 1024).toFixed(1)}KB`,
    status: analysis.jsSize <= PERFORMANCE_BUDGETS.maxJSBundle ? 'pass' : 'fail',
    impact: analysis.jsSize > PERFORMANCE_BUDGETS.maxJSBundle ? 'medium' : 'none'
  });
  
  // CSS size budget
  results.push({
    name: 'CSS Bundle Size', 
    actual: `${(analysis.cssSize / 1024).toFixed(1)}KB`,
    limit: `${(PERFORMANCE_BUDGETS.maxCSSBundle / 1024).toFixed(1)}KB`,
    status: analysis.cssSize <= PERFORMANCE_BUDGETS.maxCSSBundle ? 'pass' : 'fail',
    impact: analysis.cssSize > PERFORMANCE_BUDGETS.maxCSSBundle ? 'low' : 'none'
  });
  
  // Chunk count budget
  results.push({
    name: 'Chunk Count',
    actual: analysis.chunkCount.toString(),
    limit: PERFORMANCE_BUDGETS.maxChunks.toString(),
    status: analysis.chunkCount <= PERFORMANCE_BUDGETS.maxChunks ? 'pass' : 'warn',
    impact: analysis.chunkCount > PERFORMANCE_BUDGETS.maxChunks ? 'low' : 'none'
  });
  
  // Check individual large files
  const largeFiles = analysis.files.filter(file => file.size > PERFORMANCE_BUDGETS.maxAssetSize);
  if (largeFiles.length > 0) {
    results.push({
      name: 'Large Assets',
      actual: `${largeFiles.length} files`,
      limit: '0 files',
      status: 'warn',
      impact: 'medium',
      details: largeFiles.map(f => `${f.path} (${(f.size / 1024).toFixed(1)}KB)`)
    });
  }
  
  return results;
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(analysis, budgetResults) {
  const recommendations = [];
  
  // Bundle size recommendations
  if (analysis.totalSize > PERFORMANCE_BUDGETS.maxTotalSize) {
    recommendations.push('Consider code splitting and lazy loading for non-critical features');
    recommendations.push('Analyze bundle with `npm run build:analyze` to identify large dependencies');
  }
  
  if (analysis.jsSize > PERFORMANCE_BUDGETS.maxJSBundle) {
    recommendations.push('Review and remove unused JavaScript dependencies');
    recommendations.push('Implement dynamic imports for route-based code splitting');
  }
  
  if (analysis.chunkCount > PERFORMANCE_BUDGETS.maxChunks) {
    recommendations.push('Optimize chunk splitting strategy to reduce HTTP requests');
  }
  
  // Specific weather app recommendations
  if (analysis.assetSize > 100000) { // 100KB
    recommendations.push('Optimize weather icons and map assets (consider WebP format)');
  }
  
  const largeFiles = analysis.files.filter(f => f.size > 100000);
  if (largeFiles.length > 0) {
    recommendations.push('Consider compressing or optimizing large assets');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Bundle size is within acceptable limits 🎉');
    recommendations.push('Consider implementing progressive loading for enhanced performance');
  }
  
  return recommendations;
}

/**
 * Generate performance report
 */
function generateReport(analysis, budgetResults, recommendations) {
  const report = {
    timestamp: new Date().toISOString(),
    totalSize: `${(analysis.totalSize / 1024).toFixed(1)}KB`,
    gzippedSize: `${(analysis.totalGzippedSize / 1024).toFixed(1)}KB`,
    compressionRatio: `${((1 - analysis.totalGzippedSize / analysis.totalSize) * 100).toFixed(1)}%`,
    sizeChange: 0, // This would be calculated from previous builds
    budgets: budgetResults,
    recommendations,
    breakdown: {
      javascript: `${(analysis.jsSize / 1024).toFixed(1)}KB`,
      css: `${(analysis.cssSize / 1024).toFixed(1)}KB`,
      assets: `${(analysis.assetSize / 1024).toFixed(1)}KB`,
      chunks: analysis.chunkCount
    },
    files: analysis.files.sort((a, b) => b.size - a.size).slice(0, 10) // Top 10 largest files
  };
  
  return report;
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🚀 Starting performance budget analysis...\n');
    
    // Analyze bundle
    const analysis = analyzeBundleSize();
    console.log(`📦 Total bundle size: ${(analysis.totalSize / 1024).toFixed(1)}KB`);
    console.log(`🗜️  Gzipped size: ${(analysis.totalGzippedSize / 1024).toFixed(1)}KB`);
    console.log(`📄 JavaScript: ${(analysis.jsSize / 1024).toFixed(1)}KB`);
    console.log(`🎨 CSS: ${(analysis.cssSize / 1024).toFixed(1)}KB`);
    console.log(`🖼️  Assets: ${(analysis.assetSize / 1024).toFixed(1)}KB`);
    console.log(`📊 Chunks: ${analysis.chunkCount}\n`);
    
    // Check budgets
    const budgetResults = checkBudgets(analysis);
    const failedBudgets = budgetResults.filter(r => r.status === 'fail');
    const warnings = budgetResults.filter(r => r.status === 'warn');
    
    // Generate recommendations
    const recommendations = generateRecommendations(analysis, budgetResults);
    
    // Generate report
    const report = generateReport(analysis, budgetResults, recommendations);
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    
    // Display results
    console.log('📋 Performance Budget Results:');
    budgetResults.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
      console.log(`${icon} ${result.name}: ${result.actual} (limit: ${result.limit})`);
    });
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`• ${rec}`));
    }
    
    // Exit with appropriate code
    if (failedBudgets.length > 0) {
      console.log(`\n❌ ${failedBudgets.length} budget(s) exceeded!`);
      process.exit(1);
    } else if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} warning(s) found`);
      process.exit(0);
    } else {
      console.log('\n✅ All performance budgets passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Performance budget check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSize,
  checkBudgets,
  generateRecommendations,
  PERFORMANCE_BUDGETS
};