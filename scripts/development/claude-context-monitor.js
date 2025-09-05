#!/usr/bin/env node

/**
 * Claude AI Context Monitor
 * Provides real-time development environment insights to minimize productivity degradation
 * Business Goal: Accelerate development velocity through proactive issue detection
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class ClaudeContextMonitor {
  constructor() {
    this.logFile = '/tmp/claude-context.log';
    this.statusFile = '/tmp/claude-dev-status.json';
    this.businessMetrics = {
      deploymentVelocity: 0,
      errorRate: 0,
      uptime: 0,
      lastHealthCheck: null,
      criticalIssues: []
    };
  }

  async init() {
    console.log('🤖 Claude AI Context Monitor Starting...');
    console.log('📊 Business Goal: Minimize productivity degradation');
    console.log('🎯 Focus: Development velocity optimization');

    // Initial health check
    await this.performHealthCheck();

    // Start monitoring loops
    this.startProcessMonitoring();
    this.startBusinessMetricsTracking();
    this.startLogAggregation();

    console.log('✅ Claude Context Monitor Active');
  }

  async performHealthCheck() {
    const status = {
      timestamp: new Date().toISOString(),
      services: {},
      businessImpact: 'none',
      recommendations: []
    };

    try {
      // Check API server
      const apiCheck = await this.checkService('http://localhost:4000/api/health');
      status.services.api = apiCheck;

      // Check frontend
      const frontendCheck = await this.checkService('http://localhost:3001/');
      status.services.frontend = frontendCheck;

      // Check PM2 processes
      const pm2Status = await this.checkPM2Status();
      status.services.pm2 = pm2Status;

      // Assess business impact
      status.businessImpact = this.assessBusinessImpact(status.services);
      status.recommendations = this.generateRecommendations(status.services);

      // Update metrics
      this.businessMetrics.lastHealthCheck = status.timestamp;
      this.businessMetrics.uptime = this.calculateUptime(status.services);

      // Save status for Claude AI access
      fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));

      this.logWithContext('HEALTH_CHECK', status);

    } catch (error) {
      this.logWithContext('HEALTH_CHECK_ERROR', { error: error.message });
      status.businessImpact = 'high';
      status.recommendations.push('Immediate attention required - health check failed');
    }

    return status;
  }

  async checkService(url) {
    return new Promise((resolve) => {
      exec(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, (error, stdout) => {
        const httpCode = parseInt(stdout) || 0;
        resolve({
          url,
          status: httpCode === 200 ? 'healthy' : 'unhealthy',
          httpCode,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async checkPM2Status() {
    return new Promise((resolve) => {
      exec('pm2 jlist', (error, stdout) => {
        if (error) {
          resolve({ status: 'not_running', processes: [] });
          return;
        }

        try {
          const processes = JSON.parse(stdout);
          const processStatus = processes.map(p => ({
            name: p.name,
            status: p.pm2_env.status,
            uptime: p.pm2_env.pm_uptime,
            restarts: p.pm2_env.restart_time,
            memory: p.monit.memory,
            cpu: p.monit.cpu
          }));

          resolve({
            status: 'running',
            processes: processStatus,
            totalProcesses: processes.length,
            healthyProcesses: processes.filter(p => p.pm2_env.status === 'online').length
          });
        } catch (parseError) {
          resolve({ status: 'error', error: parseError.message });
        }
      });
    });
  }

  assessBusinessImpact(services) {
    const issues = [];

    if (services.api?.status !== 'healthy') {
      issues.push('API service down - blocking development');
    }

    if (services.frontend?.status !== 'healthy') {
      issues.push('Frontend service down - blocking UI development');
    }

    if (services.pm2?.status !== 'running') {
      issues.push('Process manager not running - stability risk');
    }

    if (issues.length === 0) return 'none';
    if (issues.length === 1) return 'low';
    if (issues.length === 2) return 'medium';
    return 'high';
  }

  generateRecommendations(services) {
    const recommendations = [];

    if (services.api?.status !== 'healthy') {
      recommendations.push('Run: pm2 restart weather-api');
      recommendations.push('Check: /tmp/weather-api-error.log');
    }

    if (services.frontend?.status !== 'healthy') {
      recommendations.push('Run: pm2 restart weather-frontend');
      recommendations.push('Check: /tmp/weather-frontend-error.log');
    }

    if (services.pm2?.status !== 'running') {
      recommendations.push('Run: pm2 start pm2-claude-context.config.js');
      recommendations.push('Check: pm2 logs');
    }

    if (recommendations.length === 0) {
      recommendations.push('All services healthy - optimal development environment');
    }

    return recommendations;
  }

  calculateUptime(services) {
    const healthyServices = Object.values(services).filter(s => s.status === 'healthy' || s.status === 'running').length;
    const totalServices = Object.keys(services).length;
    return Math.round((healthyServices / totalServices) * 100);
  }

  startProcessMonitoring() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  startBusinessMetricsTracking() {
    setInterval(() => {
      this.updateBusinessMetrics();
    }, 60000); // Every minute
  }

  startLogAggregation() {
    // Aggregate logs from all services for Claude AI context
    setInterval(() => {
      this.aggregateLogsForClaude();
    }, 10000); // Every 10 seconds
  }

  updateBusinessMetrics() {
    // Calculate deployment velocity (commits per hour)
    exec('git log --oneline --since="1 hour ago" | wc -l', (error, stdout) => {
      this.businessMetrics.deploymentVelocity = parseInt(stdout) || 0;
    });

    // Calculate error rate from logs
    exec('grep -i "error" /tmp/weather-*.log | wc -l', (error, stdout) => {
      this.businessMetrics.errorRate = parseInt(stdout) || 0;
    });

    this.logWithContext('BUSINESS_METRICS', this.businessMetrics);
  }

  aggregateLogsForClaude() {
    const logSources = [
      '/tmp/weather-api.log',
      '/tmp/weather-frontend.log',
      '/tmp/vite.log',
      '/tmp/browser-tools.log'
    ];

    const aggregatedLogs = [];

    logSources.forEach(logFile => {
      if (fs.existsSync(logFile)) {
        try {
          const content = fs.readFileSync(logFile, 'utf8');
          const recentLines = content.split('\n').slice(-5); // Last 5 lines
          aggregatedLogs.push({
            source: path.basename(logFile),
            lines: recentLines.filter(line => line.trim())
          });
        } catch (error) {
          // Log file not accessible
        }
      }
    });

    // Save aggregated logs for Claude AI
    fs.writeFileSync('/tmp/claude-aggregated-logs.json', JSON.stringify(aggregatedLogs, null, 2));
  }

  logWithContext(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      businessContext: {
        goal: 'minimize_productivity_degradation',
        focus: 'development_velocity',
        project: 'nearest_nice_weather'
      }
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFile, logLine);

    // Also log to console for immediate visibility
    console.log(`[${event}] ${JSON.stringify(data)}`);
  }
}

// Start the monitor
const monitor = new ClaudeContextMonitor();
monitor.init().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🤖 Claude Context Monitor Stopping...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🤖 Claude Context Monitor Terminated');
  process.exit(0);
});
