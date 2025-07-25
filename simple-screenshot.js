#!/usr/bin/env node

// Simple screenshot using system Chromium via child process
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function takeSimpleScreenshot() {
  console.log('📸 Taking screenshot with system Chromium...');
  
  const screenshotPath = path.join(__dirname, 'chromium-screenshot.png');
  const url = 'http://localhost:3001/presentation/index-reveal.html';
  
  // Use flatpak chromium to take screenshot
  const command = `flatpak run org.chromium.Chromium --headless --disable-gpu --no-sandbox --window-size=375,812 --screenshot="${screenshotPath}" "${url}"`;
  
  return new Promise((resolve, reject) => {
    console.log('🌐 Loading presentation...');
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Screenshot failed:', error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.log('⚠️ Chromium output:', stderr);
      }
      
      // Check if screenshot was created
      if (fs.existsSync(screenshotPath)) {
        const stats = fs.statSync(screenshotPath);
        console.log(`✅ Screenshot saved: ${screenshotPath} (${Math.round(stats.size/1024)}KB)`);
        resolve(screenshotPath);
      } else {
        reject(new Error('Screenshot file not created'));
      }
    });
  });
}

// Also try using our existing BrowserToolsMCP for comparison
async function tryBrowserToolsScreenshot() {
  console.log('\n📸 Trying BrowserToolsMCP screenshot...');
  
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    const command = `curl -X POST http://localhost:3025/mcp/screenshot -H "Content-Type: application/json" -d '{"filename": "browsertools-comparison.png"}' 2>/dev/null`;
    
    exec(command, (error, stdout) => {
      if (error) {
        console.log('❌ BrowserToolsMCP failed:', error.message);
        resolve(null);
        return;
      }
      
      try {
        const response = JSON.parse(stdout);
        if (response.success) {
          console.log('✅ BrowserToolsMCP screenshot requested');
          resolve(response);
        } else {
          console.log('❌ BrowserToolsMCP unsuccessful');
          resolve(null);
        }
      } catch (e) {
        console.log('❌ BrowserToolsMCP parse error');
        resolve(null);
      }
    });
  });
}

async function main() {
  console.log('🎯 Visual Testing - Multiple Methods');
  console.log('=' . repeat(50));
  
  try {
    // Method 1: System Chromium
    const chromiumResult = await takeSimpleScreenshot();
    
    // Method 2: BrowserToolsMCP
    const browserToolsResult = await tryBrowserToolsScreenshot();
    
    console.log('\n📊 Results:');
    console.log(`System Chromium: ${chromiumResult ? '✅' : '❌'}`);
    console.log(`BrowserToolsMCP: ${browserToolsResult ? '✅' : '❌'}`);
    
    if (chromiumResult) {
      console.log(`\n🔍 To analyze screenshot: open ${chromiumResult}`);
      console.log('🎯 Look for whitespace between header and "30-Second Elevator Pitch"');
    }
    
  } catch (error) {
    console.error('❌ Visual testing failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { takeSimpleScreenshot, tryBrowserToolsScreenshot };