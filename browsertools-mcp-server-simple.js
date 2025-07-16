#!/usr/bin/env node

/**
 * Simple BrowserToolsMCP Server for debugging
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3025;

// Screenshot path
const screenshotPath = '/home/robertspeer/Projects/screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotPath)) {
  fs.mkdirSync(screenshotPath, { recursive: true });
  console.log(`Created screenshot directory: ${screenshotPath}`);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/identity', (req, res) => {
  res.json({
    signature: 'mcp-browser-connector-24x7',
    name: 'BrowserToolsMCP Server',
    version: '1.0.0-simple',
    environments: ['localhost', 'p.nearestniceweather.com', 'nearestniceweather.com'],
    screenshotPath: screenshotPath
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'BrowserToolsMCP-Simple',
    screenshotPath: screenshotPath
  });
});

app.post('/current-url', (req, res) => {
  const { url, tabId, timestamp, source } = req.body;
  console.log(`URL update: Tab ${tabId} -> ${url} (${source})`);
  
  res.json({
    success: true,
    message: 'URL updated',
    tabId,
    url,
    timestamp: timestamp || Date.now()
  });
});

app.post('/screenshot', (req, res) => {
  const { data, path: customPath } = req.body;
  
  if (!data) {
    return res.status(400).json({ error: 'No screenshot data provided' });
  }
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = customPath || `screenshot-${timestamp}.png`;
    const fullPath = path.join(screenshotPath, filename);
    
    // Remove data URL prefix if present
    const base64Data = data.replace(/^data:image\/png;base64,/, '');
    
    // Save screenshot
    fs.writeFileSync(fullPath, base64Data, 'base64');
    
    console.log(`Screenshot saved: ${fullPath}`);
    
    res.json({
      success: true,
      path: fullPath,
      filename,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error saving screenshot:', error);
    res.status(500).json({ error: 'Failed to save screenshot' });
  }
});

app.listen(port, () => {
  console.log(`\\n🔧 BrowserToolsMCP Simple Server Started`);
  console.log(`📡 HTTP Server: http://localhost:${port}`);
  console.log(`📸 Screenshots: ${screenshotPath}`);
  console.log(`\\n✅ Ready for Chrome extension connection...`);
});