#!/usr/bin/env node

/**
 * Claude Intelligence Suite - Unified MCP Management System
 *
 * PURPOSE: Deploy and manage all Claude AI intelligence tools
 * GOAL: Maximum contextual data access to minimize productivity degradation
 *
 * INTELLIGENCE TOOLS INTEGRATED:
 * - SystemMonitorMCP (ports 3026-3027)
 * - DatabaseIntelligenceMCP (ports 3028-3029)
 * - GitIntelligenceMCP (ports 3030-3031)
 * - BrowserToolsMCP (port 3025)
 * - Claude Context API (port 3025)
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

class ClaudeIntelligenceSuite {
  constructor() {
    this.port = 3032; // Master control port
    this.wsPort = 3033; // Master WebSocket port
    this.server = null;
    this.wsServer = null;
    this.clients = new Set();

    // Intelligence tools registry
    this.intelligenceTools = new Map([
      ['system-monitor', {
        name: 'SystemMonitorMCP',
        script: './system-monitor-mcp.js',
        httpPort: 3026,
        wsPort: 3027,
        process: null,
        status: 'stopped',
        description: 'Real-time system resource and process monitoring',
        dataTypes: ['cpu', 'memory', 'disk', 'network', 'processes']
      }],
      ['database-intelligence', {
        name: 'DatabaseIntelligenceMCP',
        script: './database-intelligence-mcp.js',
        httpPort: 3028,
        wsPort: 3029,
        process: null,
        status: 'stopped',
        description: 'Direct database query performance and analysis',
        dataTypes: ['queries', 'performance', 'connections', 'schema']
      }],
      ['git-intelligence', {
        name: 'GitIntelligenceMCP',
        script: './git-intelligence-mcp.js',
        httpPort: 3030,
        wsPort: 3031,
        process: null,
        status: 'stopped',
        description: 'Deep git history and collaboration analysis',
        dataTypes: ['commits', 'collaboration', 'velocity', 'patterns']
      }],
      ['context-api', {
        name: 'Claude Context API',
        script: './claude-context-api.js',
        httpPort: 3025,
        wsPort: null,
        process: null,
        status: 'stopped',
        description: 'Unified context access for Claude AI',
        dataTypes: ['context', 'business', 'technical', 'recommendations']
      }],
      ['data-intelligence', {
        name: 'Claude Data Intelligence',
        script: './claude-data-intelligence.js',
        httpPort: null,
        wsPort: null,
        process: null,
        status: 'stopped',
        description: 'Master data collection and analysis',
        dataTypes: ['intelligence', 'metrics', 'patterns', 'predictions']
      }]
    ]);

    // Monitoring intervals
    this.healthCheckInterval = 10000; // 10 seconds
    this.aggregationInterval = 30000; // 30 seconds

    this.init();
  }

  async init() {
    console.log('🧠 Claude Intelligence Suite Initializing...');
    console.log('🎯 PURPOSE: Unified Claude AI intelligence system');
    console.log('📊 GOAL: Maximum contextual data access');
    console.log('');

    // Start master control server
    this.startMasterServer();

    // Start master WebSocket server
    this.startMasterWebSocket();

    // Start all intelligence tools
    await this.startAllIntelligenceTools();

    // Start health monitoring
    this.startHealthMonitoring();

    // Start data aggregation
    this.startDataAggregation();

    console.log('✅ Claude Intelligence Suite Active');
    console.log(`🎛️ Master Control: http://localhost:${this.port}`);
    console.log(`📡 Master Stream: ws://localhost:${this.wsPort}`);
    console.log('');
    this.displayIntelligenceStatus();
  }

  startMasterServer() {
    const endpoints = {
      '/': this.handleDashboard.bind(this),
      '/status': this.handleStatus.bind(this),
      '/tools': this.handleTools.bind(this),
      '/health': this.handleHealth.bind(this),
      '/start': this.handleStart.bind(this),
      '/stop': this.handleStop.bind(this),
      '/restart': this.handleRestart.bind(this),
      '/intelligence': this.handleIntelligence.bind(this),
      '/aggregated-data': this.handleAggregatedData.bind(this),
      '/recommendations': this.handleRecommendations.bind(this)
    };

    this.server = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://localhost:${this.port}`);
      const endpoint = url.pathname;

      if (endpoints[endpoint]) {
        try {
          const data = await endpoints[endpoint](url.searchParams);

          if (endpoint === '/') {
            // Serve HTML dashboard
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data, null, 2));
          }
        } catch (error) {
          console.error(`Error in ${endpoint}:`, error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Endpoint not found',
          availableEndpoints: Object.keys(endpoints),
          description: 'Claude Intelligence Suite - Master control system'
        }));
      }
    });

    this.server.listen(this.port, () => {
      console.log(`🚀 Master control server listening on port ${this.port}`);
    });
  }

  startMasterWebSocket() {
    this.wsServer = new WebSocket.Server({ port: this.wsPort });

    this.wsServer.on('connection', (ws) => {
      console.log('📡 Claude AI client connected to Intelligence Suite');
      this.clients.add(ws);

      // Send initial intelligence state
      this.sendIntelligenceState(ws);

      ws.on('message', async (message) => {
        try {
          const request = JSON.parse(message);
          await this.handleWebSocketRequest(ws, request);
        } catch (error) {
          ws.send(JSON.stringify({ error: error.message }));
        }
      });

      ws.on('close', () => {
        console.log('📡 Claude AI client disconnected from Intelligence Suite');
        this.clients.delete(ws);
      });
    });
  }

  async sendIntelligenceState(ws) {
    const state = {
      timestamp: new Date().toISOString(),
      type: 'intelligence_state',
      data: {
        tools: Array.from(this.intelligenceTools.entries()).map(([key, tool]) => ({
          key,
          ...tool,
          process: undefined // Don't send process object
        })),
        overallHealth: this.calculateOverallHealth(),
        activeConnections: this.clients.size,
        dataFlowStatus: await this.getDataFlowStatus()
      }
    };

    ws.send(JSON.stringify(state));
  }

  async handleWebSocketRequest(ws, request) {
    const { type, params } = request;

    switch (type) {
      case 'start_tool':
        await this.startTool(params.tool);
        break;
      case 'stop_tool':
        await this.stopTool(params.tool);
        break;
      case 'get_aggregated_data':
        await this.sendAggregatedData(ws);
        break;
      case 'execute_intelligence_query':
        await this.executeIntelligenceQuery(ws, params.query);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown request type' }));
    }
  }

  broadcastToClients(message) {
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...message
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  async startAllIntelligenceTools() {
    console.log('🚀 Starting all intelligence tools...');

    for (const [key, tool] of this.intelligenceTools) {
      await this.startTool(key);
      // Wait a bit between starts to avoid port conflicts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async startTool(toolKey) {
    const tool = this.intelligenceTools.get(toolKey);
    if (!tool) {
      console.error(`❌ Tool not found: ${toolKey}`);
      return false;
    }

    if (tool.status === 'running') {
      console.log(`✅ ${tool.name} already running`);
      return true;
    }

    try {
      console.log(`🚀 Starting ${tool.name}...`);

      // Check if script exists
      if (!fs.existsSync(tool.script)) {
        console.error(`❌ Script not found: ${tool.script}`);
        tool.status = 'error';
        return false;
      }

      // Start the process
      tool.process = spawn('node', [tool.script], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Handle process events
      tool.process.on('error', (error) => {
        console.error(`❌ ${tool.name} error:`, error.message);
        tool.status = 'error';
        this.broadcastToClients({ type: 'tool_status', tool: toolKey, status: 'error' });
      });

      tool.process.on('exit', (code) => {
        console.log(`📄 ${tool.name} exited with code ${code}`);
        tool.status = 'stopped';
        tool.process = null;
        this.broadcastToClients({ type: 'tool_status', tool: toolKey, status: 'stopped' });
      });

      // Capture output for monitoring
      tool.process.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Active') || output.includes('listening')) {
          tool.status = 'running';
          console.log(`✅ ${tool.name} started successfully`);
          this.broadcastToClients({ type: 'tool_status', tool: toolKey, status: 'running' });
        }
      });

      tool.process.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning')) {
          console.error(`❌ ${tool.name} stderr:`, error);
        }
      });

      // Set initial status
      tool.status = 'starting';

      // Wait for startup
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify the tool is responding
      if (tool.httpPort) {
        const isResponding = await this.checkToolHealth(tool);
        if (isResponding) {
          tool.status = 'running';
          console.log(`✅ ${tool.name} health check passed`);
        } else {
          console.log(`⚠️ ${tool.name} started but not responding to health checks`);
        }
      }

      return true;

    } catch (error) {
      console.error(`❌ Failed to start ${tool.name}:`, error.message);
      tool.status = 'error';
      return false;
    }
  }

  async stopTool(toolKey) {
    const tool = this.intelligenceTools.get(toolKey);
    if (!tool || !tool.process) {
      return true;
    }

    console.log(`🛑 Stopping ${tool.name}...`);

    try {
      tool.process.kill('SIGTERM');
      tool.status = 'stopping';

      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Force kill if still running
      if (tool.process && !tool.process.killed) {
        tool.process.kill('SIGKILL');
      }

      tool.process = null;
      tool.status = 'stopped';
      console.log(`✅ ${tool.name} stopped`);

      this.broadcastToClients({ type: 'tool_status', tool: toolKey, status: 'stopped' });
      return true;

    } catch (error) {
      console.error(`❌ Error stopping ${tool.name}:`, error.message);
      return false;
    }
  }

  async restartTool(toolKey) {
    await this.stopTool(toolKey);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await this.startTool(toolKey);
  }

  async checkToolHealth(tool) {
    if (!tool.httpPort) return true;

    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec(`curl -s -o /dev/null -w "%{http_code}" "http://localhost:${tool.httpPort}/health"`, (error, stdout) => {
        const httpCode = parseInt(stdout) || 0;
        resolve(httpCode === 200);
      });
    });
  }

  startHealthMonitoring() {
    console.log('🔍 Starting health monitoring...');

    setInterval(async () => {
      for (const [key, tool] of this.intelligenceTools) {
        if (tool.status === 'running' && tool.process) {
          const isHealthy = await this.checkToolHealth(tool);
          if (!isHealthy && tool.status === 'running') {
            console.log(`⚠️ Health check failed for ${tool.name}`);
            tool.status = 'unhealthy';
            this.broadcastToClients({ type: 'tool_status', tool: key, status: 'unhealthy' });
          }
        }
      }
    }, this.healthCheckInterval);
  }

  startDataAggregation() {
    console.log('📊 Starting data aggregation...');

    setInterval(async () => {
      const aggregatedData = await this.collectAggregatedData();
      this.broadcastToClients({ type: 'aggregated_data', data: aggregatedData });
    }, this.aggregationInterval);
  }

  async collectAggregatedData() {
    const data = {
      timestamp: new Date().toISOString(),
      sources: {}
    };

    for (const [key, tool] of this.intelligenceTools) {
      if (tool.status === 'running' && tool.httpPort) {
        try {
          // Try to fetch health/status data from each tool
          const response = await this.fetchToolData(tool, '/health');
          data.sources[key] = response;
        } catch (error) {
          data.sources[key] = { error: error.message };
        }
      }
    }

    return data;
  }

  async fetchToolData(tool, endpoint) {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec(`curl -s "http://localhost:${tool.httpPort}${endpoint}"`, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch (parseError) {
            resolve({ data: stdout });
          }
        }
      });
    });
  }

  calculateOverallHealth() {
    const tools = Array.from(this.intelligenceTools.values());
    const runningTools = tools.filter(tool => tool.status === 'running').length;
    const totalTools = tools.length;

    if (runningTools === totalTools) return 'excellent';
    if (runningTools >= totalTools * 0.8) return 'good';
    if (runningTools >= totalTools * 0.5) return 'fair';
    return 'poor';
  }

  async getDataFlowStatus() {
    const flowStatus = {
      systemMonitor: false,
      databaseIntelligence: false,
      gitIntelligence: false,
      contextAPI: false,
      dataIntelligence: false
    };

    for (const [key, tool] of this.intelligenceTools) {
      flowStatus[key.replace('-', '')] = tool.status === 'running';
    }

    return flowStatus;
  }

  displayIntelligenceStatus() {
    console.log('📊 Intelligence Tools Status:');
    for (const [key, tool] of this.intelligenceTools) {
      const statusIcon = tool.status === 'running' ? '✅' :
                        tool.status === 'starting' ? '🔄' :
                        tool.status === 'error' ? '❌' : '⭕';
      const ports = tool.httpPort ? ` (HTTP:${tool.httpPort}${tool.wsPort ? `, WS:${tool.wsPort}` : ''})` : '';
      console.log(`   ${statusIcon} ${tool.name}${ports} - ${tool.status}`);
    }
    console.log('');
  }

  // HTTP endpoint handlers
  async handleDashboard(params) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Claude Intelligence Suite</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #7563A8; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .tools-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .tool-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-running { color: #28a745; }
        .status-stopped { color: #dc3545; }
        .status-starting { color: #ffc107; }
        .endpoints { font-size: 12px; color: #666; margin-top: 10px; }
        .refresh { position: fixed; top: 20px; right: 20px; }
    </style>
    <script>
        function refreshStatus() {
            fetch('/status').then(r => r.json()).then(data => {
                console.log('Status updated:', data);
                setTimeout(() => window.location.reload(), 100);
            });
        }
        setInterval(refreshStatus, 30000); // Auto-refresh every 30 seconds
    </script>
</head>
<body>
    <div class="header">
        <h1>🧠 Claude Intelligence Suite</h1>
        <p>Unified contextual data system for Claude AI collaboration</p>
        <p><strong>Goal:</strong> Minimize productivity degradation through maximum context access</p>
    </div>

    <button class="refresh" onclick="refreshStatus()">🔄 Refresh Status</button>

    <div class="tools-grid">
        ${Array.from(this.intelligenceTools.entries()).map(([key, tool]) => `
            <div class="tool-card">
                <h3>${tool.name}</h3>
                <p><span class="status-${tool.status}">${tool.status.toUpperCase()}</span></p>
                <p>${tool.description}</p>
                <p><strong>Data Types:</strong> ${tool.dataTypes.join(', ')}</p>
                ${tool.httpPort ? `
                    <div class="endpoints">
                        <strong>Endpoints:</strong><br>
                        HTTP: <a href="http://localhost:${tool.httpPort}" target="_blank">localhost:${tool.httpPort}</a><br>
                        ${tool.wsPort ? `WebSocket: ws://localhost:${tool.wsPort}<br>` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div style="margin-top: 40px; padding: 20px; background: white; border-radius: 8px;">
        <h3>🔗 Quick Access</h3>
        <ul>
            <li><a href="/status">System Status JSON</a></li>
            <li><a href="/intelligence">Intelligence Overview</a></li>
            <li><a href="/aggregated-data">Aggregated Data</a></li>
            <li><a href="/recommendations">Recommendations</a></li>
        </ul>
    </div>
</body>
</html>`;
  }

  async handleStatus(params) {
    return {
      timestamp: new Date().toISOString(),
      suite: 'Claude Intelligence Suite',
      overallHealth: this.calculateOverallHealth(),
      tools: Array.from(this.intelligenceTools.entries()).map(([key, tool]) => ({
        key,
        name: tool.name,
        status: tool.status,
        httpPort: tool.httpPort,
        wsPort: tool.wsPort,
        description: tool.description,
        dataTypes: tool.dataTypes
      })),
      activeConnections: this.clients.size,
      dataFlowStatus: await this.getDataFlowStatus()
    };
  }

  async handleTools(params) {
    return {
      timestamp: new Date().toISOString(),
      tools: Array.from(this.intelligenceTools.entries()).map(([key, tool]) => ({
        key,
        ...tool,
        process: undefined
      }))
    };
  }

  async handleHealth(params) {
    const healthData = {
      timestamp: new Date().toISOString(),
      overall: this.calculateOverallHealth(),
      details: {}
    };

    for (const [key, tool] of this.intelligenceTools) {
      healthData.details[key] = {
        status: tool.status,
        healthy: tool.status === 'running' ? await this.checkToolHealth(tool) : false
      };
    }

    return healthData;
  }

  async handleStart(params) {
    const tool = params.get('tool');
    if (!tool) {
      return { error: 'Tool parameter required' };
    }

    const success = await this.startTool(tool);
    return {
      action: 'start',
      tool,
      success,
      status: this.intelligenceTools.get(tool)?.status || 'unknown'
    };
  }

  async handleStop(params) {
    const tool = params.get('tool');
    if (!tool) {
      return { error: 'Tool parameter required' };
    }

    const success = await this.stopTool(tool);
    return {
      action: 'stop',
      tool,
      success,
      status: this.intelligenceTools.get(tool)?.status || 'unknown'
    };
  }

  async handleRestart(params) {
    const tool = params.get('tool');
    if (!tool) {
      return { error: 'Tool parameter required' };
    }

    const success = await this.restartTool(tool);
    return {
      action: 'restart',
      tool,
      success,
      status: this.intelligenceTools.get(tool)?.status || 'unknown'
    };
  }

  async handleIntelligence(params) {
    return {
      timestamp: new Date().toISOString(),
      intelligence: {
        suite: 'Claude Intelligence Suite',
        purpose: 'Maximum contextual data access for Claude AI',
        goal: 'Minimize productivity degradation',
        capabilities: [
          'Real-time system monitoring',
          'Database performance analysis',
          'Git collaboration intelligence',
          'Context aggregation and analysis',
          'Business intelligence and recommendations'
        ],
        dataFlow: await this.getDataFlowStatus(),
        overallHealth: this.calculateOverallHealth(),
        recommendations: this.generateSuiteRecommendations()
      }
    };
  }

  async handleAggregatedData(params) {
    return await this.collectAggregatedData();
  }

  async handleRecommendations(params) {
    return {
      timestamp: new Date().toISOString(),
      recommendations: this.generateSuiteRecommendations(),
      actions: this.generateActionableRecommendations(),
      priorities: this.generatePriorityRecommendations()
    };
  }

  generateSuiteRecommendations() {
    const recommendations = [];
    const overallHealth = this.calculateOverallHealth();

    if (overallHealth === 'excellent') {
      recommendations.push('All intelligence tools operational - maximum context available');
    } else if (overallHealth === 'good') {
      recommendations.push('Most tools operational - monitor any stopped services');
    } else {
      recommendations.push('Multiple tools offline - restart suite for full intelligence');
    }

    const stoppedTools = Array.from(this.intelligenceTools.values())
      .filter(tool => tool.status !== 'running');

    if (stoppedTools.length > 0) {
      recommendations.push(`Restart stopped tools: ${stoppedTools.map(t => t.name).join(', ')}`);
    }

    return recommendations;
  }

  generateActionableRecommendations() {
    return [
      'Monitor all intelligence tools for continuous operation',
      'Use aggregated data for comprehensive context',
      'Leverage real-time monitoring for proactive issue detection',
      'Maintain git collaboration patterns for optimal intelligence'
    ];
  }

  generatePriorityRecommendations() {
    return {
      high: ['Keep all intelligence tools running', 'Monitor system health'],
      medium: ['Regular data aggregation checks', 'Performance optimization'],
      low: ['Documentation updates', 'Feature enhancements']
    };
  }
}

// Initialize Claude Intelligence Suite
const intelligenceSuite = new ClaudeIntelligenceSuite();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🧠 Claude Intelligence Suite Shutting Down...');

  // Stop all intelligence tools
  for (const [key, tool] of intelligenceSuite.intelligenceTools) {
    if (tool.process) {
      await intelligenceSuite.stopTool(key);
    }
  }

  if (intelligenceSuite.server) intelligenceSuite.server.close();
  if (intelligenceSuite.wsServer) intelligenceSuite.wsServer.close();

  console.log('✅ Claude Intelligence Suite Shutdown Complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🧠 Claude Intelligence Suite Terminated');

  // Stop all intelligence tools
  for (const [key, tool] of intelligenceSuite.intelligenceTools) {
    if (tool.process) {
      await intelligenceSuite.stopTool(key);
    }
  }

  if (intelligenceSuite.server) intelligenceSuite.server.close();
  if (intelligenceSuite.wsServer) intelligenceSuite.wsServer.close();

  process.exit(0);
});
