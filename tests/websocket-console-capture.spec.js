import { test, expect } from '@playwright/test';

test.describe('WebSocket Console Log Capture', () => {
  test('should capture WebSocket errors and Vite configuration', async ({ page }) => {
    // Capture ALL console messages
    const allLogs = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      allLogs.push({ type, text });
      
      // Log important messages
      if (text.includes('vite') || text.includes('WebSocket') || text.includes('ws://') || text.includes('3001') || text.includes('3003')) {
        console.log(`[${type.toUpperCase()}]`, text);
      }
    });

    // Also capture network failures
    page.on('requestfailed', request => {
      console.log('❌ REQUEST FAILED:', request.url());
    });

    console.log('\n=== NAVIGATING TO PORT 3003 ===');
    await page.goto('http://localhost:3003/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for the app to load and try to connect WebSocket
    await page.waitForTimeout(5000);

    // Examine the Vite client script in detail
    const viteClientDetails = await page.evaluate(() => {
      // Find the Vite client script
      const viteScript = document.querySelector('script[src*="@vite/client"]');
      
      // Check all script tags for any port references
      const allScripts = Array.from(document.querySelectorAll('script'));
      const scriptInfo = allScripts.map(script => ({
        src: script.src,
        hasContent: !!script.innerHTML,
        contentSnippet: script.innerHTML ? script.innerHTML.substring(0, 200) : null,
        containsPort: script.innerHTML ? /localhost:\d{4}/.test(script.innerHTML) : false
      }));

      // Look for any hardcoded port references in the entire DOM
      const htmlContent = document.documentElement.outerHTML;
      const portMatches = htmlContent.match(/localhost:\d{4}/g) || [];
      const wsMatches = htmlContent.match(/ws:\/\/[^'">\s]+/g) || [];

      return {
        viteScriptSrc: viteScript?.src || 'Not found',
        allScriptCount: allScripts.length,
        scriptsWithContent: scriptInfo.filter(s => s.hasContent).length,
        portReferencesInDOM: [...new Set(portMatches)],
        wsReferencesInDOM: [...new Set(wsMatches)],
        currentURL: window.location.href,
        currentPort: window.location.port
      };
    });

    console.log('\n=== VITE CLIENT ANALYSIS ===');
    console.log('Current URL:', viteClientDetails.currentURL);
    console.log('Current Port:', viteClientDetails.currentPort);
    console.log('Vite Client Script:', viteClientDetails.viteScriptSrc);
    console.log('Port references in DOM:', viteClientDetails.portReferencesInDOM);
    console.log('WebSocket references in DOM:', viteClientDetails.wsReferencesInDOM);

    // Check if there are any WebSocket connection attempts in the logs
    const webSocketLogs = allLogs.filter(log => 
      log.text.includes('WebSocket') || 
      log.text.includes('ws://') ||
      log.text.includes('3001')
    );

    console.log('\n=== WEBSOCKET RELATED LOGS ===');
    webSocketLogs.forEach(log => {
      console.log(`[${log.type.toUpperCase()}] ${log.text}`);
    });

    // Check for auto-expand logs
    const autoExpandLogs = allLogs.filter(log => 
      log.text.includes('Auto-expanding') || 
      log.text.includes('Auto-expanded')
    );

    console.log('\n=== AUTO-EXPAND LOGS ===');
    autoExpandLogs.forEach(log => {
      console.log(`[${log.type.toUpperCase()}] ${log.text}`);
    });

    // Take a screenshot
    await page.screenshot({ path: 'websocket-investigation.png', fullPage: true });

    // Check if the Vite dev server is actually running on 3003
    const serverCheck = await page.evaluate(async () => {
      try {
        // Try to fetch from both ports to see which responds
        const port3001Check = fetch('http://localhost:3001/').then(r => r.ok).catch(() => false);
        const port3003Check = fetch('http://localhost:3003/').then(r => r.ok).catch(() => false);
        
        const [port3001OK, port3003OK] = await Promise.all([port3001Check, port3003Check]);
        
        return {
          port3001Responsive: port3001OK,
          port3003Responsive: port3003OK
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('\n=== SERVER PORT CHECK ===');
    console.log('Port 3001 responsive:', serverCheck.port3001Responsive);
    console.log('Port 3003 responsive:', serverCheck.port3003Responsive);

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log('Total console messages:', allLogs.length);
    console.log('WebSocket related messages:', webSocketLogs.length);
    console.log('Auto-expand working:', autoExpandLogs.length > 0);
    console.log('Still connecting to 3001:', webSocketLogs.some(log => log.text.includes('3001')));
  });
});