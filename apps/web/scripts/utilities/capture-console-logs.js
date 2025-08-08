#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function captureConsoleLogs() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', (msg) => {
        consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
    });
    
    // Capture network errors
    const networkErrors = [];
    page.on('response', (response) => {
        if (!response.ok()) {
            networkErrors.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Capture JavaScript errors
    const jsErrors = [];
    page.on('pageerror', (error) => {
        jsErrors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    });
    
    try {
        console.log('🌐 Navigating to localhost:3008...');
        await page.goto('http://localhost:3008/console-test.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('⏳ Waiting for tests to complete...');
        await page.waitForTimeout(15000); // Wait 15 seconds for tests to run
        
        console.log('\n📊 CONSOLE LOGS:');
        console.log('================');
        consoleLogs.forEach(log => {
            console.log(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.text}`);
        });
        
        console.log('\n🌐 NETWORK ERRORS:');
        console.log('==================');
        if (networkErrors.length === 0) {
            console.log('No network errors detected');
        } else {
            networkErrors.forEach(error => {
                console.log(`[${error.timestamp}] ${error.status} ${error.statusText}: ${error.url}`);
            });
        }
        
        console.log('\n❌ JAVASCRIPT ERRORS:');
        console.log('=====================');
        if (jsErrors.length === 0) {
            console.log('No JavaScript errors detected');
        } else {
            jsErrors.forEach(error => {
                console.log(`[${error.timestamp}] ${error.message}`);
                if (error.stack) {
                    console.log(`Stack: ${error.stack}`);
                }
            });
        }
        
        // Get the current page content to see test results
        console.log('\n📋 TEST RESULTS FROM PAGE:');
        console.log('==========================');
        const results = await page.evaluate(() => {
            const output = document.getElementById('output');
            const status = document.getElementById('status');
            return {
                output: output ? output.textContent : 'No output element found',
                status: status ? status.textContent : 'No status element found',
                statusClass: status ? status.className : 'No status class found'
            };
        });
        
        console.log(`Status: ${results.status} (${results.statusClass})`);
        console.log(`Output:\n${results.output}`);
        
    } catch (error) {
        console.error('❌ Error during page capture:', error.message);
    }
    
    await browser.close();
}

// Check if puppeteer is available
try {
    captureConsoleLogs();
} catch (error) {
    console.error('❌ Puppeteer not available. Install with: npm install puppeteer');
    console.error('Error:', error.message);
}