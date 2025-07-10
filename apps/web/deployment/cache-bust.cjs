/**
 * Cache Busting Enhancement Script
 * Adds timestamp and cache-busting meta tags to HTML after build
 */

const fs = require('fs');
const path = require('path');

function addCacheBustingToHTML() {
  const htmlPath = path.join(__dirname, '../dist/index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ index.html not found at:', htmlPath);
    process.exit(1);
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  const timestamp = Date.now();
  const deployId = process.env.VERCEL_GIT_COMMIT_SHA || `local-${timestamp}`;
  
  // Add cache-busting meta tags to head
  const cacheBustingMeta = `
    <meta name="cache-control" content="no-cache, no-store, must-revalidate">
    <meta name="pragma" content="no-cache">
    <meta name="expires" content="0">
    <meta name="build-timestamp" content="${timestamp}">
    <meta name="deployment-id" content="${deployId}">
    <meta name="cache-version" content="v${timestamp}">
  `;
  
  // Insert before closing head tag
  html = html.replace('</head>', `${cacheBustingMeta}</head>`);
  
  // Add cache-busting query parameters to script and CSS imports
  html = html.replace(
    /(src|href)="([^"]*\.(js|css))"/g,
    `$1="$2?v=${timestamp}&t=${deployId.slice(0, 8)}"`
  );
  
  // Write the enhanced HTML
  fs.writeFileSync(htmlPath, html);
  
  console.log('✅ Cache busting applied to HTML:');
  console.log(`   📅 Timestamp: ${timestamp}`);
  console.log(`   🔗 Deploy ID: ${deployId}`);
  console.log(`   📄 File: ${htmlPath}`);
}

// Run the cache busting
addCacheBustingToHTML();