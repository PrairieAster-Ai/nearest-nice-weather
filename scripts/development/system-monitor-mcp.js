#!/usr/bin/env node

/**
 * SystemMonitorMCP - Real-time System Intelligence for Claude AI
 * 
 * PURPOSE: Provide Claude with previously inaccessible system data
 * GOAL: Minimize productivity degradation through proactive system monitoring
 * 
 * INSPIRED BY: BrowserToolsMCP's approach to exposing browser data
 * EXTENDS: PM2's process monitoring to full system intelligence
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const WebSocket = require('ws');
const http = require('http');

class SystemMonitorMCP {
  constructor() {
    this.port = 3026;
    this.wsPort = 3027;
    this.dataDir = '/tmp/system-monitor-mcp';
    this.server = null;
    this.wsServer = null;
    this.clients = new Set();
    
    // Data collection intervals
    this.intervals = {
      system: 5000,    // 5 seconds
      processes: 10000, // 10 seconds
      network: 15000,  // 15 seconds
      disk: 30000,     // 30 seconds
      performance: 2000 // 2 seconds
    };
    
    // Previously inaccessible data sources
    this.dataSources = {
      systemResources: this.getSystemResources.bind(this),
      processTree: this.getProcessTree.bind(this),
      networkConnections: this.getNetworkConnections.bind(this),
      diskUsage: this.getDiskUsage.bind(this),
      memoryMap: this.getMemoryMap.bind(this),
      openFiles: this.getOpenFiles.bind(this),
      systemCalls: this.getSystemCalls.bind(this),
      performanceCounters: this.getPerformanceCounters.bind(this),
      kernelMessages: this.getKernelMessages.bind(this),
      systemEvents: this.getSystemEvents.bind(this)
    };
    
    this.init();
  }

  async init() {
    console.log('🖥️ SystemMonitorMCP Starting...');
    console.log('🎯 PURPOSE: Expose previously inaccessible system data to Claude AI');
    console.log('📊 GOAL: Minimize productivity degradation through system intelligence');
    
    // Create data directory
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Start HTTP server for data access
    this.startHTTPServer();
    
    // Start WebSocket server for real-time streaming
    this.startWebSocketServer();
    
    // Start data collection
    this.startDataCollection();
    
    console.log('✅ SystemMonitorMCP Active');
    console.log(`📊 HTTP API: http://localhost:${this.port}`);
    console.log(`🔄 WebSocket Stream: ws://localhost:${this.wsPort}`);
  }

  startHTTPServer() {
    const endpoints = {
      '/system/resources': this.handleSystemResources.bind(this),
      '/system/processes': this.handleProcesses.bind(this),
      '/system/network': this.handleNetwork.bind(this),
      '/system/disk': this.handleDisk.bind(this),
      '/system/memory': this.handleMemory.bind(this),
      '/system/performance': this.handlePerformance.bind(this),
      '/system/health': this.handleHealth.bind(this),
      '/system/alerts': this.handleAlerts.bind(this),
      '/system/intelligence': this.handleIntelligence.bind(this),
      '/system/recommendations': this.handleRecommendations.bind(this)
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
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data, null, 2));
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
          description: 'SystemMonitorMCP - Real-time system intelligence for Claude AI'
        }));
      }
    });
    
    this.server.listen(this.port, () => {
      console.log(`🚀 SystemMonitorMCP HTTP server listening on port ${this.port}`);
    });
  }

  startWebSocketServer() {
    this.wsServer = new WebSocket.Server({ port: this.wsPort });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📡 Claude AI client connected to SystemMonitorMCP stream');
      this.clients.add(ws);
      
      // Send initial system state
      this.sendSystemState(ws);
      
      ws.on('message', async (message) => {
        try {
          const request = JSON.parse(message);
          await this.handleWebSocketRequest(ws, request);
        } catch (error) {
          ws.send(JSON.stringify({ error: error.message }));
        }
      });
      
      ws.on('close', () => {
        console.log('📡 Claude AI client disconnected from SystemMonitorMCP');
        this.clients.delete(ws);
      });
    });
  }

  async sendSystemState(ws) {
    const systemState = {
      timestamp: new Date().toISOString(),
      type: 'system_state',
      data: {
        resources: await this.getSystemResources(),
        processes: await this.getProcessTree(),
        network: await this.getNetworkConnections(),
        performance: await this.getPerformanceCounters(),
        health: await this.getSystemHealth()
      }
    };
    
    ws.send(JSON.stringify(systemState));
  }

  async handleWebSocketRequest(ws, request) {
    const { type, params } = request;
    
    switch (type) {
      case 'monitor_process':
        await this.monitorSpecificProcess(ws, params.pid);
        break;
      case 'monitor_resource':
        await this.monitorSpecificResource(ws, params.resource);
        break;
      case 'get_system_events':
        await this.streamSystemEvents(ws);
        break;
      case 'analyze_performance':
        await this.analyzePerformanceIssues(ws);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown request type' }));
    }
  }

  startDataCollection() {
    console.log('🔄 Starting continuous data collection...');
    
    // System resources monitoring
    setInterval(async () => {
      const resources = await this.getSystemResources();
      this.broadcastToClients({ type: 'system_resources', data: resources });
      this.saveData('system_resources', resources);
    }, this.intervals.system);
    
    // Process monitoring
    setInterval(async () => {
      const processes = await this.getProcessTree();
      this.broadcastToClients({ type: 'process_tree', data: processes });
      this.saveData('process_tree', processes);
    }, this.intervals.processes);
    
    // Network monitoring
    setInterval(async () => {
      const network = await this.getNetworkConnections();
      this.broadcastToClients({ type: 'network_connections', data: network });
      this.saveData('network_connections', network);
    }, this.intervals.network);
    
    // Performance monitoring
    setInterval(async () => {
      const performance = await this.getPerformanceCounters();
      this.broadcastToClients({ type: 'performance_counters', data: performance });
      this.saveData('performance_counters', performance);
    }, this.intervals.performance);
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

  saveData(type, data) {
    const filename = path.join(this.dataDir, `${type}-${Date.now()}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    
    // Keep only last 100 files per type
    this.cleanupOldData(type);
  }

  cleanupOldData(type) {
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(file => file.startsWith(type))
        .sort();
      
      if (files.length > 100) {
        const filesToDelete = files.slice(0, files.length - 100);
        filesToDelete.forEach(file => {
          fs.unlinkSync(path.join(this.dataDir, file));
        });
      }
    } catch (error) {
      console.error('Error cleaning up old data:', error.message);
    }
  }

  // Previously inaccessible data sources
  async getSystemResources() {
    try {
      const [cpuInfo, memInfo, loadAvg] = await Promise.all([
        execAsync('cat /proc/cpuinfo | grep "model name" | head -1'),
        execAsync('cat /proc/meminfo'),
        execAsync('cat /proc/loadavg')
      ]);
      
      const memLines = memInfo.stdout.split('\n');
      const memTotal = parseInt(memLines.find(line => line.startsWith('MemTotal')).split(/\s+/)[1]);
      const memFree = parseInt(memLines.find(line => line.startsWith('MemFree')).split(/\s+/)[1]);
      const memAvailable = parseInt(memLines.find(line => line.startsWith('MemAvailable')).split(/\s+/)[1]);
      
      const [load1, load5, load15] = loadAvg.stdout.trim().split(' ').map(parseFloat);
      
      return {
        timestamp: new Date().toISOString(),
        cpu: {
          model: cpuInfo.stdout.trim().split(':')[1].trim(),
          cores: await this.getCPUCores(),
          usage: await this.getCPUUsage(),
          load: { '1min': load1, '5min': load5, '15min': load15 }
        },
        memory: {
          total: memTotal,
          free: memFree,
          available: memAvailable,
          used: memTotal - memFree,
          usagePercent: ((memTotal - memAvailable) / memTotal * 100).toFixed(2)
        },
        disk: await this.getDiskUsage(),
        network: await this.getNetworkStats(),
        uptime: await this.getUptime()
      };
    } catch (error) {
      console.error('Error getting system resources:', error.message);
      return { error: error.message };
    }
  }

  async getProcessTree() {
    try {
      const psOutput = await execAsync('ps auxww --sort=-%cpu | head -20');
      const processes = psOutput.stdout.split('\n').slice(1).filter(line => line.trim()).map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          user: parts[0],
          pid: parseInt(parts[1]),
          cpu: parseFloat(parts[2]),
          memory: parseFloat(parts[3]),
          vsz: parseInt(parts[4]),
          rss: parseInt(parts[5]),
          tty: parts[6],
          stat: parts[7],
          start: parts[8],
          time: parts[9],
          command: parts.slice(10).join(' ')
        };
      });
      
      return {
        timestamp: new Date().toISOString(),
        topProcesses: processes,
        totalProcesses: await this.getTotalProcesses(),
        zombieProcesses: await this.getZombieProcesses()
      };
    } catch (error) {
      console.error('Error getting process tree:', error.message);
      return { error: error.message };
    }
  }

  async getNetworkConnections() {
    try {
      const [netstat, ss] = await Promise.all([
        execAsync('netstat -tuln').catch(() => ({ stdout: '' })),
        execAsync('ss -tuln').catch(() => ({ stdout: '' }))
      ]);
      
      const connections = (netstat.stdout || ss.stdout).split('\n')
        .filter(line => line.includes(':'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            protocol: parts[0],
            localAddress: parts[3] || parts[4],
            state: parts[5] || parts[1]
          };
        });
      
      return {
        timestamp: new Date().toISOString(),
        connections: connections,
        activeConnections: connections.filter(c => c.state === 'ESTABLISHED').length,
        listeningPorts: connections.filter(c => c.state === 'LISTEN').length
      };
    } catch (error) {
      console.error('Error getting network connections:', error.message);
      return { error: error.message };
    }
  }

  async getDiskUsage() {
    try {
      const dfOutput = await execAsync('df -h /');
      const lines = dfOutput.stdout.split('\n');
      const rootLine = lines.find(line => line.includes('/'));
      const parts = rootLine.trim().split(/\s+/);
      
      return {
        filesystem: parts[0],
        size: parts[1],
        used: parts[2],
        available: parts[3],
        usePercent: parts[4],
        mountPoint: parts[5]
      };
    } catch (error) {
      console.error('Error getting disk usage:', error.message);
      return { error: error.message };
    }
  }

  async getMemoryMap() {
    try {
      const processes = await execAsync('ps aux --sort=-%mem | head -10');
      return {
        timestamp: new Date().toISOString(),
        topMemoryProcesses: processes.stdout.split('\n').slice(1).filter(line => line.trim())
      };
    } catch (error) {
      console.error('Error getting memory map:', error.message);
      return { error: error.message };
    }
  }

  async getOpenFiles() {
    try {
      const lsofOutput = await execAsync('lsof | wc -l').catch(() => ({ stdout: '0' }));
      return {
        timestamp: new Date().toISOString(),
        totalOpenFiles: parseInt(lsofOutput.stdout.trim()),
        limit: await this.getFileLimit()
      };
    } catch (error) {
      console.error('Error getting open files:', error.message);
      return { error: error.message };
    }
  }

  async getSystemCalls() {
    // This would require strace or similar - placeholder for now
    return {
      timestamp: new Date().toISOString(),
      note: 'System call monitoring requires additional privileges'
    };
  }

  async getPerformanceCounters() {
    try {
      const [vmstat, iostat] = await Promise.all([
        execAsync('vmstat 1 2 | tail -1').catch(() => ({ stdout: '' })),
        execAsync('iostat -x 1 2 | tail -10').catch(() => ({ stdout: '' }))
      ]);
      
      return {
        timestamp: new Date().toISOString(),
        vmstat: vmstat.stdout.trim(),
        iostat: iostat.stdout.trim(),
        cpuUsage: await this.getCPUUsage()
      };
    } catch (error) {
      console.error('Error getting performance counters:', error.message);
      return { error: error.message };
    }
  }

  async getKernelMessages() {
    try {
      const dmesg = await execAsync('dmesg | tail -20').catch(() => ({ stdout: '' }));
      return {
        timestamp: new Date().toISOString(),
        recentMessages: dmesg.stdout.split('\n').filter(line => line.trim())
      };
    } catch (error) {
      console.error('Error getting kernel messages:', error.message);
      return { error: error.message };
    }
  }

  async getSystemEvents() {
    try {
      const journalctl = await execAsync('journalctl --since "1 hour ago" --no-pager | tail -50').catch(() => ({ stdout: '' }));
      return {
        timestamp: new Date().toISOString(),
        recentEvents: journalctl.stdout.split('\n').filter(line => line.trim())
      };
    } catch (error) {
      console.error('Error getting system events:', error.message);
      return { error: error.message };
    }
  }

  // HTTP endpoint handlers
  async handleSystemResources(params) {
    return await this.getSystemResources();
  }

  async handleProcesses(params) {
    return await this.getProcessTree();
  }

  async handleNetwork(params) {
    return await this.getNetworkConnections();
  }

  async handleDisk(params) {
    return await this.getDiskUsage();
  }

  async handleMemory(params) {
    return await this.getMemoryMap();
  }

  async handlePerformance(params) {
    return await this.getPerformanceCounters();
  }

  async handleHealth(params) {
    const [resources, processes, network] = await Promise.all([
      this.getSystemResources(),
      this.getProcessTree(),
      this.getNetworkConnections()
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      overall: this.calculateOverallHealth(resources, processes, network),
      resources: resources,
      processes: processes,
      network: network,
      alerts: this.generateSystemAlerts(resources, processes, network)
    };
  }

  async handleAlerts(params) {
    const resources = await this.getSystemResources();
    return {
      timestamp: new Date().toISOString(),
      alerts: this.generateSystemAlerts(resources)
    };
  }

  async handleIntelligence(params) {
    const [resources, processes, network, performance] = await Promise.all([
      this.getSystemResources(),
      this.getProcessTree(),
      this.getNetworkConnections(),
      this.getPerformanceCounters()
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      intelligence: {
        systemHealth: this.calculateOverallHealth(resources, processes, network),
        performanceAnalysis: this.analyzePerformance(performance),
        resourceUtilization: this.analyzeResourceUtilization(resources),
        processAnalysis: this.analyzeProcesses(processes),
        networkAnalysis: this.analyzeNetwork(network),
        predictions: this.generatePredictions(resources, processes, network),
        recommendations: this.generateSystemRecommendations(resources, processes, network)
      }
    };
  }

  async handleRecommendations(params) {
    const resources = await this.getSystemResources();
    const processes = await this.getProcessTree();
    
    return {
      timestamp: new Date().toISOString(),
      recommendations: this.generateSystemRecommendations(resources, processes)
    };
  }

  // Helper methods
  async getCPUCores() {
    try {
      const nproc = await execAsync('nproc');
      return parseInt(nproc.stdout.trim());
    } catch (error) {
      return 1;
    }
  }

  async getCPUUsage() {
    try {
      const mpstat = await execAsync('mpstat 1 1 | tail -1').catch(() => ({ stdout: '' }));
      if (mpstat.stdout) {
        const parts = mpstat.stdout.trim().split(/\s+/);
        const idle = parseFloat(parts[parts.length - 1]);
        return (100 - idle).toFixed(2);
      }
      return '0.00';
    } catch (error) {
      return '0.00';
    }
  }

  async getNetworkStats() {
    try {
      const netdev = await execAsync('cat /proc/net/dev');
      const interfaces = netdev.stdout.split('\n').slice(2).filter(line => line.trim());
      return interfaces.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          interface: parts[0].replace(':', ''),
          rxBytes: parseInt(parts[1]),
          txBytes: parseInt(parts[9])
        };
      });
    } catch (error) {
      return [];
    }
  }

  async getUptime() {
    try {
      const uptime = await execAsync('cat /proc/uptime');
      const seconds = parseFloat(uptime.stdout.split(' ')[0]);
      return {
        seconds: seconds,
        formatted: this.formatUptime(seconds)
      };
    } catch (error) {
      return { seconds: 0, formatted: 'Unknown' };
    }
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  async getTotalProcesses() {
    try {
      const ps = await execAsync('ps aux | wc -l');
      return parseInt(ps.stdout.trim()) - 1; // Subtract header line
    } catch (error) {
      return 0;
    }
  }

  async getZombieProcesses() {
    try {
      const zombies = await execAsync('ps aux | grep -c " Z "').catch(() => ({ stdout: '0' }));
      return parseInt(zombies.stdout.trim());
    } catch (error) {
      return 0;
    }
  }

  async getFileLimit() {
    try {
      const ulimit = await execAsync('ulimit -n');
      return parseInt(ulimit.stdout.trim());
    } catch (error) {
      return 1024;
    }
  }

  calculateOverallHealth(resources, processes, network) {
    // Simple health calculation - can be made more sophisticated
    const cpuUsage = parseFloat(resources.cpu?.usage || 0);
    const memUsage = parseFloat(resources.memory?.usagePercent || 0);
    const diskUsage = parseFloat(resources.disk?.usePercent?.replace('%', '') || 0);
    
    if (cpuUsage > 90 || memUsage > 90 || diskUsage > 90) return 'critical';
    if (cpuUsage > 70 || memUsage > 70 || diskUsage > 70) return 'warning';
    return 'healthy';
  }

  generateSystemAlerts(resources, processes, network) {
    const alerts = [];
    
    if (resources.cpu?.usage > 80) {
      alerts.push({ type: 'cpu', severity: 'high', message: `CPU usage at ${resources.cpu.usage}%` });
    }
    
    if (resources.memory?.usagePercent > 80) {
      alerts.push({ type: 'memory', severity: 'high', message: `Memory usage at ${resources.memory.usagePercent}%` });
    }
    
    if (resources.disk?.usePercent) {
      const diskUsage = parseFloat(resources.disk.usePercent.replace('%', ''));
      if (diskUsage > 80) {
        alerts.push({ type: 'disk', severity: 'high', message: `Disk usage at ${diskUsage}%` });
      }
    }
    
    return alerts;
  }

  analyzePerformance(performance) {
    return {
      status: 'analyzing',
      note: 'Performance analysis implementation in progress'
    };
  }

  analyzeResourceUtilization(resources) {
    return {
      cpu: resources.cpu?.usage || 0,
      memory: resources.memory?.usagePercent || 0,
      disk: resources.disk?.usePercent || '0%',
      recommendation: 'Monitor resource usage trends'
    };
  }

  analyzeProcesses(processes) {
    return {
      total: processes.totalProcesses || 0,
      top5: processes.topProcesses?.slice(0, 5) || [],
      recommendation: 'Monitor high CPU/memory processes'
    };
  }

  analyzeNetwork(network) {
    return {
      activeConnections: network.activeConnections || 0,
      listeningPorts: network.listeningPorts || 0,
      recommendation: 'Monitor network connection patterns'
    };
  }

  generatePredictions(resources, processes, network) {
    return {
      resourceTrends: 'Stable',
      potentialIssues: 'None detected',
      recommendation: 'Continue monitoring'
    };
  }

  generateSystemRecommendations(resources, processes, network) {
    const recommendations = [];
    
    if (resources.cpu?.usage > 70) {
      recommendations.push('Consider optimizing CPU-intensive processes');
    }
    
    if (resources.memory?.usagePercent > 70) {
      recommendations.push('Monitor memory usage and consider cleanup');
    }
    
    if (processes.zombieProcesses > 0) {
      recommendations.push(`Clean up ${processes.zombieProcesses} zombie processes`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System operating within normal parameters');
    }
    
    return recommendations;
  }
}

// Initialize SystemMonitorMCP
const systemMonitor = new SystemMonitorMCP();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🖥️ SystemMonitorMCP Shutting Down...');
  if (systemMonitor.server) systemMonitor.server.close();
  if (systemMonitor.wsServer) systemMonitor.wsServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🖥️ SystemMonitorMCP Terminated');
  if (systemMonitor.server) systemMonitor.server.close();
  if (systemMonitor.wsServer) systemMonitor.wsServer.close();
  process.exit(0);
});