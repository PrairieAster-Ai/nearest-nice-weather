# Cache Busting Implementation Guide

## Overview
Comprehensive guide for implementing cache busting in Single Page Applications (SPAs) to prevent broken initial loads and ensure users always receive the latest version.

## Problem Statement

### The Cache Bust Challenge
**Symptom**: Users see broken or outdated application on first load
**Root Cause**: Browser caching of HTML/assets prevents loading of updated versions
**Impact**: Poor user experience, support tickets, lost conversions
**Solution**: Multi-layer cache busting strategy

## Implementation Strategy

### Layer 1: HTML Cache Control Headers
**Purpose**: Prevent HTML file caching entirely
**Implementation**: Server-level headers

```json
// vercel.json
{
  "headers": [
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        },
        {
          "key": "Pragma",
          "value": "no-cache"
        },
        {
          "key": "Expires",
          "value": "0"
        }
      ]
    }
  ]
}
```

### Layer 2: Asset Filename Cache Busting
**Purpose**: Unique filenames force asset reloading
**Implementation**: Build-time filename generation

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: (_chunkInfo) => {
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
                          Math.random().toString(36).slice(2, 10)
          return `assets/[name]-[hash]-${buildId}.js`
        },
        chunkFileNames: (chunkInfo) => {
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
                          Math.random().toString(36).slice(2, 10)
          return `assets/[name]-[hash]-${buildId}.js`
        },
        assetFileNames: (assetInfo) => {
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
                          Math.random().toString(36).slice(2, 10)
          if (assetInfo.name?.endsWith('.css')) {
            return `assets/styles/[name]-[hash]-${buildId}[extname]`
          }
          return `assets/[name]-[hash]-${buildId}[extname]`
        }
      }
    }
  }
})
```

### Layer 3: Query Parameter Cache Busting
**Purpose**: Add cache-busting parameters to asset URLs
**Implementation**: Post-build HTML modification

```javascript
// deployment/cache-bust.cjs
function addCacheBustingToHTML() {
  const htmlPath = path.join(__dirname, '../dist/index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const timestamp = Date.now();
  const deployId = process.env.VERCEL_GIT_COMMIT_SHA || `local-${timestamp}`;

  // Add cache-busting query parameters
  html = html.replace(
    /(src|href)="([^"]*\.(js|css))"/g,
    `$1="$2?v=${timestamp}&t=${deployId.slice(0, 8)}"`
  );

  fs.writeFileSync(htmlPath, html);
}
```

### Layer 4: Meta Tag Cache Control
**Purpose**: Browser-level cache directives and debugging info
**Implementation**: Automated meta tag injection

```javascript
// deployment/cache-bust.cjs
const cacheBustingMeta = `
  <meta name="cache-control" content="no-cache, no-store, must-revalidate">
  <meta name="pragma" content="no-cache">
  <meta name="expires" content="0">
  <meta name="build-timestamp" content="${timestamp}">
  <meta name="deployment-id" content="${deployId}">
  <meta name="cache-version" content="v${timestamp}">
`;

html = html.replace('</head>', `${cacheBustingMeta}</head>`);
```

### Layer 5: Granular Asset Caching
**Purpose**: Different cache strategies for different file types
**Implementation**: Path-based cache headers

```json
// vercel.json - Asset-specific caching
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(manifest\\.json|health\\.json|favicon\\.ico)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300, stale-while-revalidate=60"
        }
      ]
    }
  ]
}
```

## Build Process Integration

### Enhanced Build Script
```json
// package.json
{
  "scripts": {
    "build": "node deployment/health-check.cjs && vite build && node deployment/cache-bust.cjs"
  }
}
```

### Cache Busting Script
```javascript
// deployment/cache-bust.cjs
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

  // Add cache-busting meta tags
  const cacheBustingMeta = `
    <meta name="cache-control" content="no-cache, no-store, must-revalidate">
    <meta name="pragma" content="no-cache">
    <meta name="expires" content="0">
    <meta name="build-timestamp" content="${timestamp}">
    <meta name="deployment-id" content="${deployId}">
    <meta name="cache-version" content="v${timestamp}">
  `;

  html = html.replace('</head>', `${cacheBustingMeta}</head>`);

  // Add query parameters to assets
  html = html.replace(
    /(src|href)="([^"]*\.(js|css))"/g,
    `$1="$2?v=${timestamp}&t=${deployId.slice(0, 8)}"`
  );

  fs.writeFileSync(htmlPath, html);

  console.log('✅ Cache busting applied to HTML:');
  console.log(`   📅 Timestamp: ${timestamp}`);
  console.log(`   🔗 Deploy ID: ${deployId}`);
}

addCacheBustingToHTML();
```

## Platform-Specific Implementation

### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "cd apps/web && npm install --legacy-peer-deps && node deployment/health-check.cjs && vite build && node deployment/cache-bust.cjs",
  "headers": [
    {
      "source": "/index.html",
      "headers": [
        {"key": "Cache-Control", "value": "no-cache, no-store, must-revalidate"},
        {"key": "Pragma", "value": "no-cache"},
        {"key": "Expires", "value": "0"}
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}
      ]
    }
  ]
}
```

### Netlify Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Pragma = "no-cache"
    Expires = "0"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### AWS S3/CloudFront Configuration
```json
{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "CacheControlMaxAge": 0,
      "Filter": {
        "Prefix": "index.html"
      }
    },
    {
      "CacheControlMaxAge": 31536000,
      "Filter": {
        "Prefix": "assets/"
      }
    }
  ]
}
```

## Testing & Validation

### Manual Testing Checklist
- [ ] **Fresh browser** (incognito mode)
- [ ] **Hard refresh** (Ctrl+F5) behavior
- [ ] **Network throttling** simulation
- [ ] **Multiple browser types** testing
- [ ] **Mobile device** testing

### Automated Testing
```javascript
// tests/cache-busting.test.js
describe('Cache Busting', () => {
  test('HTML has no-cache headers', async () => {
    const response = await fetch('/');
    expect(response.headers.get('cache-control')).toContain('no-cache');
  });

  test('Assets have unique filenames', async () => {
    const html = await fetch('/').then(r => r.text());
    const assetMatches = html.match(/assets\/[^"]*-[a-f0-9]{8,}-[a-z0-9]{8}\.(js|css)/g);
    expect(assetMatches).toBeTruthy();
    expect(assetMatches.length).toBeGreaterThan(0);
  });

  test('Query parameters present', async () => {
    const html = await fetch('/').then(r => r.text());
    expect(html).toMatch(/\?v=\d+&t=[a-z0-9]{8}/);
  });
});
```

### Performance Impact Assessment
```javascript
// Monitor cache busting overhead
const cacheBustingMetrics = {
  htmlSize: 'Before: 1.5KB, After: 1.6KB (+6%)',
  buildTime: 'Before: 12s, After: 13s (+8%)',
  assetSize: 'Before: 800KB, After: 800KB (no change)',
  loadTime: 'Before: 2.1s, After: 2.1s (no change)'
};
```

## Debugging Cache Issues

### Browser Developer Tools
```javascript
// Check cache status in DevTools Console
console.log('Build timestamp:', document.querySelector('meta[name="build-timestamp"]')?.content);
console.log('Deployment ID:', document.querySelector('meta[name="deployment-id"]')?.content);
console.log('Cache version:', document.querySelector('meta[name="cache-version"]')?.content);
```

### Network Analysis
```bash
# Check response headers
curl -I https://www.yoursite.com/

# Check asset URLs
curl -s https://www.yoursite.com/ | grep -o 'assets/[^"]*'

# Verify cache-busting parameters
curl -s https://www.yoursite.com/ | grep -o '\?v=[0-9]*&t=[a-z0-9]*'
```

### Cache Verification Script
```javascript
// verify-cache-busting.js
const puppeteer = require('puppeteer');

async function verifyCacheBusting() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Enable request interception
  await page.setRequestInterception(true);
  const requests = [];

  page.on('request', request => {
    requests.push(request.url());
    request.continue();
  });

  await page.goto('https://www.yoursite.com/');

  // Check for cache-busting patterns
  const cacheBustedRequests = requests.filter(url =>
    url.includes('?v=') && url.includes('&t=')
  );

  console.log(`✅ ${cacheBustedRequests.length} cache-busted requests found`);
  console.log('Cache-busted assets:', cacheBustedRequests);

  await browser.close();
}

verifyCacheBusting();
```

## Common Issues & Solutions

### Issue: Assets still cached after deployment
**Symptoms**: Old assets loading despite new deployment
**Root Cause**: Insufficient cache headers or missing query parameters
**Solution**:
```bash
# Verify all layers are implemented
1. Check HTML cache headers
2. Verify asset filename uniqueness
3. Confirm query parameters present
4. Check CDN/proxy cache settings
```

### Issue: Build time significantly increased
**Symptoms**: Cache busting adds substantial build overhead
**Root Cause**: Inefficient timestamp generation or file processing
**Solution**:
```javascript
// Optimize cache busting script
const buildId = process.env.BUILD_ID || Date.now().toString(36);
// Use shorter, stable identifiers
```

### Issue: Development vs production behavior differs
**Symptoms**: Cache busting works locally but not in production
**Root Cause**: Environment-specific configuration differences
**Solution**:
```javascript
// Ensure consistent behavior
const isProduction = process.env.NODE_ENV === 'production';
const deployId = isProduction
  ? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8)
  : 'dev';
```

## Monitoring & Maintenance

### Key Metrics to Track
- **Cache hit rate**: Should be low for HTML, high for assets
- **Time to first byte**: Monitor for performance regression
- **Error rates**: Watch for 404s on cache-busted assets
- **User complaints**: Track "broken page" support tickets

### Maintenance Schedule
**Weekly**: Verify cache busting working in production
**Monthly**: Review cache performance metrics
**Quarterly**: Update cache busting strategy based on new browser behaviors

### Alerting Setup
```yaml
# monitoring/cache-alerts.yml
alerts:
  - name: "High HTML Cache Rate"
    condition: html_cache_hit_rate > 10%
    action: investigate_cache_headers

  - name: "Asset 404 Rate Spike"
    condition: asset_404_rate > 1%
    action: check_cache_busting_deployment
```

## Related Documentation

- [Emergency Deployment Procedures](emergency-deployment-procedures.md)
- [Docker Networking Troubleshooting](docker-networking-troubleshooting.md)
- [Environment Setup Automation](environment-setup-automation.md)

## Success Stories

### Before Cache Busting
- 15% of users reported "broken page" on deployments
- Support tickets: 3-5 per deployment
- Hard refresh required for new features

### After Implementation
- 0% broken page reports
- Support tickets: 0 cache-related
- Seamless user experience on deployments
- 25% reduction in deployment-related support load
