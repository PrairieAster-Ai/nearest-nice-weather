#!/usr/bin/env node
/**
 * Visual Health Check for Localhost Environment
 * 
 * Captures screenshots and analyzes console logs to detect UX issues
 * that traditional health checks might miss.
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BROWSERTOOLS_BASE = 'http://localhost:3025';
const LOCALHOST_URL = process.env.TEST_URL || 'http://localhost:3001';
const SCREENSHOT_DIR = '/home/robertspeer/Projects/screenshots';

// Logging
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}

function success(message) { log(`✅ ${message}`, 'SUCCESS'); }
function warning(message) { log(`⚠️  ${message}`, 'WARNING'); }
function error(message) { log(`❌ ${message}`, 'ERROR'); }

// HTTP helper
async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : null;
        
        const reqOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: 10000
        };

        const req = http.request(url, reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ success: true, data: parsed, status: res.statusCode });
                } catch {
                    resolve({ success: false, data, status: res.statusCode });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });

        req.on('timeout', () => {
            resolve({ success: false, error: 'Request timeout' });
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

// Check if BrowserToolsMCP is available
async function checkBrowserToolsAvailable() {
    const result = await makeRequest(`${BROWSERTOOLS_BASE}/identity`);
    if (!result.success || !result.data) {
        return false;
    }
    
    // Handle both string and object responses
    const dataString = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
    return dataString.includes('mcp-browser-connector');
}

// Get available browser tabs
async function getBrowserState() {
    const result = await makeRequest(`${BROWSERTOOLS_BASE}/state`);
    if (!result.success) {
        return null;
    }
    return result.data;
}

// Find or create a tab for localhost
async function getLocalhostTab(state) {
    // Look for existing localhost tab
    for (const [tabId, info] of Object.entries(state.urls || {})) {
        if (info.url && info.url.includes('localhost:3001')) {
            return tabId;
        }
    }
    
    // Use any available tab
    const availableTabs = Object.keys(state.urls || {});
    if (availableTabs.length > 0) {
        return availableTabs[0];
    }
    
    return null;
}

// Capture screenshot of localhost
async function captureScreenshot(tabId) {
    const filename = `visual-health-${Date.now()}.png`;
    const result = await makeRequest(`${BROWSERTOOLS_BASE}/mcp/screenshot`, {
        method: 'POST',
        body: {
            tabId: tabId,
            filename: filename,
            navigate: LOCALHOST_URL
        }
    });
    
    if (result.success) {
        // Wait for screenshot to be saved
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const screenshotPath = path.join(SCREENSHOT_DIR, filename);
        try {
            await fs.access(screenshotPath);
            return { success: true, path: screenshotPath, filename };
        } catch {
            return { success: false, error: 'Screenshot file not found' };
        }
    }
    
    return { success: false, error: 'Screenshot request failed' };
}

// Get console logs for UX analysis
async function getConsoleLogs(tabId) {
    const result = await makeRequest(`${BROWSERTOOLS_BASE}/mcp/console-logs/${tabId}?limit=20`);
    
    if (result.success && result.data && result.data.logs) {
        return result.data.logs;
    }
    
    return [];
}

// Analyze console logs for common issues
function analyzeConsoleLogs(logs) {
    const issues = [];
    const warnings = [];
    const errors = [];
    
    for (const log of logs) {
        const message = log.message || '';
        const level = log.level || '';
        
        // Check for common React/Vite issues
        if (message.includes('Warning') || level === 'warning') {
            warnings.push(message);
        }
        
        if (message.includes('Error') || level === 'error') {
            errors.push(message);
        }
        
        // Specific UX issues
        if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
            issues.push('Network connectivity issues detected');
        }
        
        if (message.includes('404') || message.includes('not found')) {
            issues.push('Missing resources (404 errors)');
        }
        
        if (message.includes('CORS') || message.includes('cross-origin')) {
            issues.push('CORS policy issues');
        }
        
        if (message.includes('chunk') && message.includes('failed')) {
            issues.push('JavaScript chunk loading failures');
        }
        
        if (message.includes('geolocation') && message.includes('gesture')) {
            issues.push('Geolocation privacy violation - requesting location without user gesture');
        }
        
        if (message.includes('Violation') && message.includes('geolocation')) {
            issues.push('Browser policy violation: Geolocation requested without user interaction');
        }
    }
    
    return { issues, warnings, errors };
}

// Check API connectivity from frontend perspective
async function checkAPIFromFrontend() {
    const endpoints = [
        '/api/health',
        '/api/weather-locations?limit=1'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        const url = `${LOCALHOST_URL}${endpoint}`;
        const result = await makeRequest(url);
        
        results.push({
            endpoint,
            healthy: result.success && result.status === 200,
            status: result.status,
            error: result.error
        });
    }
    
    return results;
}

// Main visual health check
async function performVisualHealthCheck() {
    log('🎯 Starting Visual Health Check...');
    
    // Check if BrowserToolsMCP is available
    const browserToolsAvailable = await checkBrowserToolsAvailable();
    if (!browserToolsAvailable) {
        error('BrowserToolsMCP not available - visual checks limited');
        return { success: false, error: 'BrowserToolsMCP unavailable' };
    }
    
    success('BrowserToolsMCP connected');
    
    // Get browser state
    const browserState = await getBrowserState();
    if (!browserState) {
        error('Could not get browser state');
        return { success: false, error: 'Browser state unavailable' };
    }
    
    // Find suitable tab
    const tabId = await getLocalhostTab(browserState);
    if (!tabId) {
        error('No suitable browser tab found');
        return { success: false, error: 'No browser tab available' };
    }
    
    log(`Using browser tab: ${tabId}`);
    
    // Test API connectivity from frontend
    log('Testing API connectivity from frontend...');
    const apiResults = await checkAPIFromFrontend();
    
    let apiHealthy = true;
    for (const result of apiResults) {
        if (result.healthy) {
            success(`${result.endpoint}: HEALTHY`);
        } else {
            warning(`${result.endpoint}: UNHEALTHY - ${result.error || result.status}`);
            apiHealthy = false;
        }
    }
    
    // Capture screenshot
    log('Capturing screenshot of localhost...');
    const screenshot = await captureScreenshot(tabId);
    
    if (screenshot.success) {
        success(`Screenshot saved: ${screenshot.filename}`);
    } else {
        warning(`Screenshot failed: ${screenshot.error}`);
    }
    
    // Get and analyze console logs
    log('Analyzing console logs...');
    const consoleLogs = await getConsoleLogs(tabId);
    const logAnalysis = analyzeConsoleLogs(consoleLogs);
    
    // Report findings
    log('\n🔍 Visual Health Check Results:');
    log('=====================================');
    
    if (apiHealthy) {
        success('API Connectivity: HEALTHY');
    } else {
        error('API Connectivity: ISSUES DETECTED');
    }
    
    if (screenshot.success) {
        success(`Visual Capture: SUCCESS (${screenshot.filename})`);
    } else {
        warning('Visual Capture: FAILED');
    }
    
    if (logAnalysis.errors.length === 0) {
        success('Console Errors: NONE');
    } else {
        error(`Console Errors: ${logAnalysis.errors.length} found`);
        logAnalysis.errors.forEach(err => log(`  • ${err}`));
    }
    
    if (logAnalysis.warnings.length === 0) {
        success('Console Warnings: NONE');
    } else {
        warning(`Console Warnings: ${logAnalysis.warnings.length} found`);
        logAnalysis.warnings.slice(0, 3).forEach(warn => log(`  • ${warn}`));
    }
    
    if (logAnalysis.issues.length === 0) {
        success('UX Issues: NONE DETECTED');
    } else {
        error(`UX Issues: ${logAnalysis.issues.length} detected`);
        logAnalysis.issues.forEach(issue => log(`  • ${issue}`));
    }
    
    const overallHealthy = apiHealthy && 
                          logAnalysis.errors.length === 0 && 
                          logAnalysis.issues.length === 0;
    
    if (overallHealthy) {
        success('🎉 Overall Visual Health: EXCELLENT');
    } else {
        warning('⚠️  Overall Visual Health: ISSUES DETECTED');
    }
    
    return {
        success: true,
        results: {
            apiHealthy,
            screenshot: screenshot.success,
            screenshotPath: screenshot.path,
            consoleLogs: consoleLogs.length,
            errors: logAnalysis.errors.length,
            warnings: logAnalysis.warnings.length,
            uxIssues: logAnalysis.issues.length,
            overallHealthy
        }
    };
}

// CLI execution
if (require.main === module) {
    performVisualHealthCheck()
        .then(result => {
            if (result.success && result.results.overallHealthy) {
                process.exit(0);
            } else {
                process.exit(1);
            }
        })
        .catch(err => {
            error(`Visual health check failed: ${err.message}`);
            process.exit(1);
        });
}

module.exports = { performVisualHealthCheck };