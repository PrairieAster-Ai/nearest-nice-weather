#!/usr/bin/env node

/**
 * BrowserToolsMCP Server - Multi-environment browser debugging for Claude Code
 * 
 * PURPOSE: Restore server-side functionality for BrowserToolsMCP Chrome extension
 * ENVIRONMENTS: localhost, p.nearestniceweather.com, nearestniceweather.com
 * SCREENSHOT_PATH: /home/robertspeer/Projects/screenshots
 * 
 * FEATURES:
 * - Console log capture from all environments
 * - Screenshot capture and storage
 * - Real-time browser activity monitoring
 * - MCP protocol integration for Claude Code
 */

import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

class BrowserToolsMCPServer {
  constructor() {
    this.app = express();
    this.port = 3025;
    this.wsPort = 3026;
    
    // Screenshot configuration
    this.screenshotPath = '/home/robertspeer/Projects/screenshots';
    this.ensureScreenshotDirectory();
    
    // Browser activity storage
    this.consoleLogs = new Map(); // tabId -> logs array
    this.currentUrls = new Map(); // tabId -> current URL
    this.browserSessions = new Map(); // sessionId -> session data
    
    // WebSocket for real-time updates
    this.wss = null;
    this.clients = new Set();
    
    // MCP integration
    this.mcpEnabled = true;
    
    this.setupExpress();
    this.setupWebSocket();
    this.setupRoutes();
  }
  
  ensureScreenshotDirectory() {
    if (!fs.existsSync(this.screenshotPath)) {
      fs.mkdirSync(this.screenshotPath, { recursive: true });
      console.log(`Created screenshot directory: ${this.screenshotPath}`);
    }
  }
  
  setupExpress() {
    this.app.use(cors({
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200
    }));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.url}`);
      next();
    });
    
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });
  }
  
  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: this.wsPort });
    
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);
      
      // Send current state to new client
      this.sendCurrentState(ws);
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
    
    console.log(`WebSocket server running on port ${this.wsPort}`);
  }
  
  setupRoutes() {
    // Server identity endpoint (required by Chrome extension)
    this.app.get('/identity', (req, res) => {
      res.json({
        signature: 'mcp-browser-connector-24x7',
        name: 'BrowserToolsMCP Server',
        version: '1.0.0',
        port: this.port,
        environments: ['localhost', 'p.nearestniceweather.com', 'nearestniceweather.com'],
        screenshotPath: this.screenshotPath,
        features: ['console-logs', 'screenshots', 'url-tracking', 'mcp-integration']
      });
    });
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'BrowserToolsMCP',
        version: '1.0.0',
        sessions: this.browserSessions.size,
        screenshots: this.screenshotPath,
        websockets: this.clients.size
      });
    });
    
    // Current URL tracking endpoint
    this.app.post('/current-url', (req, res) => {
      const { url, tabId, timestamp, source } = req.body;
      
      if (!url || !tabId) {
        return res.status(400).json({ error: 'Missing url or tabId' });
      }
      
      // Store URL for this tab
      this.currentUrls.set(tabId, {
        url,
        timestamp: timestamp || Date.now(),
        source: source || 'unknown'
      });
      
      // Broadcast to WebSocket clients
      this.broadcastToClients({
        type: 'url-update',
        tabId,
        url,
        timestamp: timestamp || Date.now(),
        source
      });
      
      console.log(`URL updated for tab ${tabId}: ${url} (source: ${source})`);
      
      res.json({
        success: true,
        message: 'URL updated',
        tabId,
        url,
        timestamp: timestamp || Date.now()
      });
    });
    
    // Screenshot capture endpoint
    this.app.post('/screenshot', (req, res) => {
      const { data, path: customPath } = req.body;
      
      if (!data) {
        return res.status(400).json({ error: 'No screenshot data provided' });
      }
      
      try {
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = customPath || `screenshot-${timestamp}.png`;
        const fullPath = path.join(this.screenshotPath, filename);
        
        // Remove data URL prefix if present
        const base64Data = data.replace(/^data:image\/png;base64,/, '');
        
        // Save screenshot
        fs.writeFileSync(fullPath, base64Data, 'base64');
        
        console.log(`Screenshot saved: ${fullPath}`);
        
        // Broadcast to WebSocket clients
        this.broadcastToClients({
          type: 'screenshot-captured',
          path: fullPath,
          filename,
          timestamp: Date.now()
        });
        
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
    
    // Console logs endpoint
    this.app.post('/console-logs', (req, res) => {
      const { tabId, logs, url } = req.body;
      
      if (!tabId || !logs) {
        return res.status(400).json({ error: 'Missing tabId or logs' });
      }
      
      // Store console logs for this tab
      if (!this.consoleLogs.has(tabId)) {
        this.consoleLogs.set(tabId, []);
      }
      
      const tabLogs = this.consoleLogs.get(tabId);
      
      // Add new logs with timestamp
      const timestampedLogs = logs.map(log => ({
        ...log,
        timestamp: Date.now(),
        url: url || this.currentUrls.get(tabId)?.url || 'unknown'
      }));
      
      tabLogs.push(...timestampedLogs);
      
      // Keep only last 100 logs per tab
      if (tabLogs.length > 100) {
        tabLogs.splice(0, tabLogs.length - 100);
      }
      
      // Broadcast to WebSocket clients
      this.broadcastToClients({
        type: 'console-logs',
        tabId,
        logs: timestampedLogs,
        url: url || this.currentUrls.get(tabId)?.url || 'unknown'
      });
      
      console.log(`Received ${logs.length} console logs for tab ${tabId}`);
      
      res.json({
        success: true,
        message: 'Console logs stored',
        tabId,
        logsCount: logs.length,
        totalLogs: tabLogs.length
      });
    });
    
    // MCP integration endpoints
    this.app.get('/mcp/sessions', (req, res) => {
      const sessions = Array.from(this.browserSessions.entries()).map(([id, session]) => ({
        sessionId: id,
        ...session
      }));
      
      res.json({
        success: true,
        sessions,
        count: sessions.length
      });
    });
    
    this.app.get('/mcp/console-logs/all', (req, res) => {
      const { limit = 50 } = req.query;
      
      // Return logs from all tabs
      const allLogs = [];
      this.consoleLogs.forEach((logs, tabId) => {
        logs.forEach(log => {
          allLogs.push({ ...log, tabId });
        });
      });
      
      // Sort by timestamp and limit
      allLogs.sort((a, b) => b.timestamp - a.timestamp);
      const limitedLogs = allLogs.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        logs: limitedLogs,
        count: limitedLogs.length,
        total: allLogs.length
      });
    });
    
    this.app.get('/mcp/console-logs/:tabId', (req, res) => {
      const { tabId } = req.params;
      const { limit = 50 } = req.query;
      
      const logs = this.consoleLogs.get(tabId) || [];
      const limitedLogs = logs.slice(-parseInt(limit));
      
      res.json({
        success: true,
        tabId,
        logs: limitedLogs,
        count: limitedLogs.length,
        total: logs.length
      });
    });
    
    this.app.post('/mcp/screenshot', (req, res) => {
      const { tabId, filename } = req.body;
      
      if (!tabId) {
        return res.status(400).json({ error: 'Missing tabId' });
      }
      
      // Request screenshot from Chrome extension via background script
      // This will be implemented as a WebSocket message to the extension
      this.broadcastToClients({
        type: 'screenshot-request',
        tabId,
        filename: filename || `mcp-screenshot-${Date.now()}.png`
      });
      
      res.json({
        success: true,
        message: 'Screenshot request sent',
        tabId,
        filename
      });
    });
    
    // Get current state endpoint
    this.app.get('/state', (req, res) => {
      res.json({
        success: true,
        timestamp: Date.now(),
        urls: Object.fromEntries(this.currentUrls),
        consoleLogs: Object.fromEntries(
          Array.from(this.consoleLogs.entries()).map(([tabId, logs]) => [
            tabId,
            logs.slice(-10) // Last 10 logs per tab
          ])
        ),
        sessions: this.browserSessions.size,
        clients: this.clients.size
      });
    });
  }
  
  sendCurrentState(ws) {
    const state = {
      type: 'current-state',
      timestamp: Date.now(),
      urls: Object.fromEntries(this.currentUrls),
      sessions: this.browserSessions.size,
      clients: this.clients.size
    };
    
    ws.send(JSON.stringify(state));
  }
  
  broadcastToClients(message) {
    const data = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log(`\\n🔧 BrowserToolsMCP Server Started`);
      console.log(`📡 HTTP Server: http://localhost:${this.port}`);
      console.log(`🌐 WebSocket Server: ws://localhost:${this.wsPort}`);
      console.log(`📸 Screenshots: ${this.screenshotPath}`);
      console.log(`🎯 Target Environments:`);
      console.log(`   • localhost (development)`);
      console.log(`   • p.nearestniceweather.com (preview)`);
      console.log(`   • nearestniceweather.com (production)`);
      console.log(`\\n✅ Ready for Chrome extension connection...`);
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new BrowserToolsMCPServer();
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down BrowserToolsMCP Server...');
    process.exit(0);
  });
}

module.exports = BrowserToolsMCPServer;