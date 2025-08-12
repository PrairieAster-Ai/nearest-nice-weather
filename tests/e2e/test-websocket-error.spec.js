import { test, expect } from '@playwright/test';

test.describe('WebSocket Connection Investigation', () => {
  test('should investigate WebSocket connection errors', async ({ page }) => {
    // Capture all console errors and logs
    const consoleLogs = [];
    const consoleErrors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('❌ ERROR:', text);
      } else {
        consoleLogs.push(text);
        if (text.includes('vite') || text.includes('WebSocket') || text.includes('ws://')) {
          console.log('🔍 VITE:', text);
        }
      }
    });

    // Monitor network requests
    const webSocketRequests = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('ws://') || url.includes('wss://')) {
        webSocketRequests.push({
          url,
          method: request.method(),
          headers: request.headers()
        });
        console.log('🌐 WebSocket Request:', url);
      }
    });

    // Test port 3003
    console.log('\n=== TESTING PORT 3003 ===');
    await page.goto('http://localhost:3003/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Check what's in the HTML for Vite configuration
    const viteConfig = await page.evaluate(() => {
      // Look for any script tags that might contain Vite config
      const scripts = Array.from(document.querySelectorAll('script'));
      const viteScripts = scripts
        .map(s => s.innerHTML || s.src)
        .filter(content => content.includes('vite') || content.includes('ws://'));
      
      // Check for any hardcoded ports in the page
      const pageContent = document.documentElement.innerHTML;
      const portMatches = pageContent.match(/localhost:(\d{4})/g) || [];
      
      return {
        viteScripts: viteScripts.slice(0, 3), // First 3 matches
        portMatches: [...new Set(portMatches)], // Unique port references
        baseURI: document.baseURI,
        currentPort: window.location.port
      };
    });
    
    console.log('\nVite Configuration found:');
    console.log('Current port:', viteConfig.currentPort);
    console.log('Base URI:', viteConfig.baseURI);
    console.log('Port references in HTML:', viteConfig.portMatches);
    console.log('Vite scripts:', viteConfig.viteScripts.length, 'found');

    // Check environment variables
    const envCheck = await page.evaluate(() => {
      return {
        nodeEnv: 'N/A', // Skip process check
        viteMode: 'N/A', // Skip import.meta check
        viteDev: 'N/A',
        viteBase: 'N/A'
      };
    });
    
    console.log('\nEnvironment check:', envCheck);

    // Try port 3002
    console.log('\n=== TESTING PORT 3002 ===');
    const errors3002 = [];
    page.removeAllListeners('console');
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('WebSocket')) {
        errors3002.push(msg.text());
        console.log('❌ Port 3002 ERROR:', msg.text());
      }
    });
    
    await page.goto('http://localhost:3002/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Check Vite client script
    const viteClientInfo = await page.evaluate(() => {
      const viteClientScript = document.querySelector('script[type="module"][src*="@vite/client"]');
      return {
        exists: !!viteClientScript,
        src: viteClientScript?.src,
        attributes: viteClientScript ? Object.fromEntries([...viteClientScript.attributes].map(a => [a.name, a.value])) : null
      };
    });
    
    console.log('\nVite Client Script:', viteClientInfo);

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log('WebSocket errors on port 3003:', consoleErrors.filter(e => e.includes('WebSocket')).length);
    console.log('WebSocket errors on port 3002:', errors3002.length);
    console.log('WebSocket requests captured:', webSocketRequests.length);
    
    if (webSocketRequests.length > 0) {
      console.log('\nWebSocket URLs attempted:');
      webSocketRequests.forEach(req => console.log(' -', req.url));
    }

    // Take screenshots
    await page.screenshot({ path: 'websocket-error-page.png', fullPage: true });
  });
});