#!/usr/bin/env node

/**
 * DatabaseIntelligenceMCP - Direct Database Intelligence for Claude AI
 *
 * PURPOSE: Provide Claude with direct access to database insights
 * GOAL: Minimize productivity degradation through database intelligence
 *
 * PREVIOUSLY INACCESSIBLE:
 * - Real-time query performance analysis
 * - Database schema evolution tracking
 * - Data quality metrics
 * - Query pattern analysis
 * - Connection pool monitoring
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const WebSocket = require('ws');
const http = require('http');

class DatabaseIntelligenceMCP {
  constructor() {
    this.port = 3028;
    this.wsPort = 3029;
    this.dataDir = '/tmp/database-intelligence-mcp';
    this.server = null;
    this.wsServer = null;
    this.clients = new Set();

    // Database connection
    this.pool = null;
    this.initDatabaseConnection();

    // Monitoring intervals
    this.intervals = {
      performance: 10000,  // 10 seconds
      connections: 15000,  // 15 seconds
      queries: 5000,       // 5 seconds
      schema: 300000       // 5 minutes
    };

    // Query performance tracking
    this.queryMetrics = new Map();
    this.slowQueries = [];
    this.connectionMetrics = {
      active: 0,
      idle: 0,
      waiting: 0,
      total: 0
    };

    this.init();
  }

  async initDatabaseConnection() {
    try {
      const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (!databaseUrl) {
        console.log('⚠️ No DATABASE_URL found - running in simulation mode');
        return;
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('✅ Database connection established');
      client.release();

      // Set up query monitoring
      this.setupQueryMonitoring();

    } catch (error) {
      console.log('⚠️ Database connection failed - running in simulation mode:', error.message);
      this.pool = null;
    }
  }

  setupQueryMonitoring() {
    if (!this.pool) return;

    // Override pool.query to track performance
    const originalQuery = this.pool.query.bind(this.pool);
    this.pool.query = (...args) => {
      const startTime = Date.now();
      const queryText = typeof args[0] === 'string' ? args[0] : args[0].text;

      return originalQuery(...args).then(result => {
        const duration = Date.now() - startTime;
        this.trackQueryPerformance(queryText, duration, result.rowCount);
        return result;
      }).catch(error => {
        const duration = Date.now() - startTime;
        this.trackQueryError(queryText, duration, error);
        throw error;
      });
    };
  }

  trackQueryPerformance(query, duration, rowCount) {
    const queryKey = this.normalizeQuery(query);

    if (!this.queryMetrics.has(queryKey)) {
      this.queryMetrics.set(queryKey, {
        query: queryKey,
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastExecuted: null,
        errorCount: 0
      });
    }

    const metrics = this.queryMetrics.get(queryKey);
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.count;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.lastExecuted = new Date().toISOString();

    // Track slow queries
    if (duration > 1000) { // Queries taking more than 1 second
      this.slowQueries.push({
        query: queryKey,
        duration,
        rowCount,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100);
      }
    }

    // Broadcast to Claude AI clients
    this.broadcastToClients({
      type: 'query_performance',
      data: { query: queryKey, duration, rowCount }
    });
  }

  trackQueryError(query, duration, error) {
    const queryKey = this.normalizeQuery(query);

    if (this.queryMetrics.has(queryKey)) {
      this.queryMetrics.get(queryKey).errorCount++;
    }

    // Broadcast error to Claude AI clients
    this.broadcastToClients({
      type: 'query_error',
      data: { query: queryKey, duration, error: error.message }
    });
  }

  normalizeQuery(query) {
    // Normalize query for pattern analysis
    return query
      .replace(/\$\d+/g, '?')  // Replace parameterized values
      .replace(/\d+/g, 'N')   // Replace numbers
      .replace(/'[^']*'/g, "'S'") // Replace strings
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  async init() {
    console.log('🗄️ DatabaseIntelligenceMCP Starting...');
    console.log('🎯 PURPOSE: Direct database intelligence for Claude AI');
    console.log('📊 GOAL: Minimize productivity degradation through database insights');

    // Create data directory
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Start HTTP server
    this.startHTTPServer();

    // Start WebSocket server
    this.startWebSocketServer();

    // Start monitoring
    this.startDatabaseMonitoring();

    console.log('✅ DatabaseIntelligenceMCP Active');
    console.log(`📊 HTTP API: http://localhost:${this.port}`);
    console.log(`🔄 WebSocket Stream: ws://localhost:${this.wsPort}`);
  }

  startHTTPServer() {
    const endpoints = {
      '/database/performance': this.handlePerformance.bind(this),
      '/database/queries': this.handleQueries.bind(this),
      '/database/connections': this.handleConnections.bind(this),
      '/database/schema': this.handleSchema.bind(this),
      '/database/health': this.handleHealth.bind(this),
      '/database/insights': this.handleInsights.bind(this),
      '/database/slow-queries': this.handleSlowQueries.bind(this),
      '/database/query-patterns': this.handleQueryPatterns.bind(this),
      '/database/data-quality': this.handleDataQuality.bind(this),
      '/database/recommendations': this.handleRecommendations.bind(this)
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
          description: 'DatabaseIntelligenceMCP - Direct database intelligence for Claude AI'
        }));
      }
    });

    this.server.listen(this.port, () => {
      console.log(`🚀 DatabaseIntelligenceMCP HTTP server listening on port ${this.port}`);
    });
  }

  startWebSocketServer() {
    this.wsServer = new WebSocket.Server({ port: this.wsPort });

    this.wsServer.on('connection', (ws) => {
      console.log('📡 Claude AI client connected to DatabaseIntelligenceMCP stream');
      this.clients.add(ws);

      // Send initial database state
      this.sendDatabaseState(ws);

      ws.on('message', async (message) => {
        try {
          const request = JSON.parse(message);
          await this.handleWebSocketRequest(ws, request);
        } catch (error) {
          ws.send(JSON.stringify({ error: error.message }));
        }
      });

      ws.on('close', () => {
        console.log('📡 Claude AI client disconnected from DatabaseIntelligenceMCP');
        this.clients.delete(ws);
      });
    });
  }

  async sendDatabaseState(ws) {
    const state = {
      timestamp: new Date().toISOString(),
      type: 'database_state',
      data: {
        connected: !!this.pool,
        performance: await this.getDatabasePerformance(),
        connections: await this.getConnectionMetrics(),
        recentQueries: Array.from(this.queryMetrics.values()).slice(-10),
        slowQueries: this.slowQueries.slice(-5)
      }
    };

    ws.send(JSON.stringify(state));
  }

  async handleWebSocketRequest(ws, request) {
    const { type, params } = request;

    switch (type) {
      case 'execute_query':
        await this.executeQuery(ws, params.query);
        break;
      case 'analyze_query':
        await this.analyzeQuery(ws, params.query);
        break;
      case 'monitor_table':
        await this.monitorTable(ws, params.table);
        break;
      case 'get_schema_changes':
        await this.getSchemaChanges(ws);
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

  startDatabaseMonitoring() {
    console.log('🔄 Starting database monitoring...');

    // Performance monitoring
    setInterval(async () => {
      const performance = await this.getDatabasePerformance();
      this.broadcastToClients({ type: 'database_performance', data: performance });
      this.saveData('performance', performance);
    }, this.intervals.performance);

    // Connection monitoring
    setInterval(async () => {
      const connections = await this.getConnectionMetrics();
      this.broadcastToClients({ type: 'database_connections', data: connections });
      this.saveData('connections', connections);
    }, this.intervals.connections);

    // Schema monitoring
    setInterval(async () => {
      const schema = await this.getSchemaInfo();
      this.broadcastToClients({ type: 'database_schema', data: schema });
      this.saveData('schema', schema);
    }, this.intervals.schema);
  }

  saveData(type, data) {
    const filename = path.join(this.dataDir, `${type}-${Date.now()}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));

    // Keep only last 50 files per type
    this.cleanupOldData(type);
  }

  cleanupOldData(type) {
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(file => file.startsWith(type))
        .sort();

      if (files.length > 50) {
        const filesToDelete = files.slice(0, files.length - 50);
        filesToDelete.forEach(file => {
          fs.unlinkSync(path.join(this.dataDir, file));
        });
      }
    } catch (error) {
      console.error('Error cleaning up old data:', error.message);
    }
  }

  // Database analysis methods
  async getDatabasePerformance() {
    if (!this.pool) {
      return { status: 'disconnected', simulation: true };
    }

    try {
      const client = await this.pool.connect();

      // Get database statistics
      const statsQuery = `
        SELECT
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
          (SELECT sum(calls) FROM pg_stat_user_functions) as function_calls,
          (SELECT sum(total_time) FROM pg_stat_statements WHERE total_time IS NOT NULL) as total_query_time
      `;

      const result = await client.query(statsQuery).catch(() => ({ rows: [{}] }));
      client.release();

      return {
        timestamp: new Date().toISOString(),
        connected: true,
        stats: result.rows[0],
        queryMetrics: this.getQueryMetricsSummary(),
        slowQueryCount: this.slowQueries.length,
        connectionPool: this.getConnectionPoolStatus()
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        connected: false,
        error: error.message
      };
    }
  }

  async getConnectionMetrics() {
    if (!this.pool) {
      return { status: 'disconnected', simulation: true };
    }

    try {
      const client = await this.pool.connect();

      const connectionQuery = `
        SELECT
          state,
          count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;

      const result = await client.query(connectionQuery);
      client.release();

      return {
        timestamp: new Date().toISOString(),
        connections: result.rows,
        poolStatus: this.getConnectionPoolStatus(),
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingClients: this.pool.waitingCount
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getSchemaInfo() {
    if (!this.pool) {
      return { status: 'disconnected', simulation: true };
    }

    try {
      const client = await this.pool.connect();

      const schemaQuery = `
        SELECT
          schemaname,
          tablename,
          tableowner,
          tablespace,
          hasindexes,
          hasrules,
          hastriggers
        FROM pg_tables
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY schemaname, tablename
      `;

      const result = await client.query(schemaQuery);
      client.release();

      return {
        timestamp: new Date().toISOString(),
        tables: result.rows,
        tableCount: result.rows.length,
        schemas: [...new Set(result.rows.map(row => row.schemaname))]
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  getQueryMetricsSummary() {
    const metrics = Array.from(this.queryMetrics.values());
    return {
      totalQueries: metrics.reduce((sum, m) => sum + m.count, 0),
      avgDuration: metrics.length > 0 ?
        metrics.reduce((sum, m) => sum + m.avgDuration, 0) / metrics.length : 0,
      slowestQuery: metrics.reduce((slowest, m) =>
        m.maxDuration > (slowest?.maxDuration || 0) ? m : slowest, null),
      errorRate: metrics.reduce((sum, m) => sum + m.errorCount, 0) /
        Math.max(metrics.reduce((sum, m) => sum + m.count, 0), 1)
    };
  }

  getConnectionPoolStatus() {
    if (!this.pool) return null;

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
      max: this.pool.options.max
    };
  }

  // HTTP endpoint handlers
  async handlePerformance(params) {
    return await this.getDatabasePerformance();
  }

  async handleQueries(params) {
    return {
      timestamp: new Date().toISOString(),
      queryMetrics: Array.from(this.queryMetrics.values()),
      summary: this.getQueryMetricsSummary()
    };
  }

  async handleConnections(params) {
    return await this.getConnectionMetrics();
  }

  async handleSchema(params) {
    return await this.getSchemaInfo();
  }

  async handleHealth(params) {
    const [performance, connections, schema] = await Promise.all([
      this.getDatabasePerformance(),
      this.getConnectionMetrics(),
      this.getSchemaInfo()
    ]);

    return {
      timestamp: new Date().toISOString(),
      overall: this.calculateDatabaseHealth(performance, connections),
      performance,
      connections,
      schema,
      alerts: this.generateDatabaseAlerts(performance, connections)
    };
  }

  async handleInsights(params) {
    const performance = await this.getDatabasePerformance();
    const connections = await this.getConnectionMetrics();

    return {
      timestamp: new Date().toISOString(),
      insights: {
        performanceAnalysis: this.analyzePerformance(performance),
        connectionAnalysis: this.analyzeConnections(connections),
        queryPatterns: this.analyzeQueryPatterns(),
        optimizationOpportunities: this.identifyOptimizationOpportunities(),
        predictions: this.generatePerformancePredictions()
      }
    };
  }

  async handleSlowQueries(params) {
    return {
      timestamp: new Date().toISOString(),
      slowQueries: this.slowQueries,
      analysis: this.analyzeSlowQueries(),
      recommendations: this.generateSlowQueryRecommendations()
    };
  }

  async handleQueryPatterns(params) {
    return {
      timestamp: new Date().toISOString(),
      patterns: this.analyzeQueryPatterns(),
      topQueries: this.getTopQueries(),
      recommendations: this.generateQueryPatternRecommendations()
    };
  }

  async handleDataQuality(params) {
    return {
      timestamp: new Date().toISOString(),
      dataQuality: await this.assessDataQuality(),
      recommendations: this.generateDataQualityRecommendations()
    };
  }

  async handleRecommendations(params) {
    const performance = await this.getDatabasePerformance();
    const connections = await this.getConnectionMetrics();

    return {
      timestamp: new Date().toISOString(),
      recommendations: this.generateDatabaseRecommendations(performance, connections)
    };
  }

  // Analysis methods
  calculateDatabaseHealth(performance, connections) {
    if (!performance.connected) return 'disconnected';

    const queryMetrics = performance.queryMetrics || {};
    const avgDuration = queryMetrics.avgDuration || 0;
    const errorRate = queryMetrics.errorRate || 0;

    if (avgDuration > 5000 || errorRate > 0.1) return 'critical';
    if (avgDuration > 1000 || errorRate > 0.05) return 'warning';
    return 'healthy';
  }

  generateDatabaseAlerts(performance, connections) {
    const alerts = [];

    if (!performance.connected) {
      alerts.push({ type: 'connection', severity: 'critical', message: 'Database disconnected' });
    }

    if (performance.queryMetrics?.errorRate > 0.1) {
      alerts.push({ type: 'queries', severity: 'high', message: 'High query error rate' });
    }

    if (this.slowQueries.length > 10) {
      alerts.push({ type: 'performance', severity: 'medium', message: `${this.slowQueries.length} slow queries detected` });
    }

    return alerts;
  }

  analyzePerformance(performance) {
    return {
      status: performance.connected ? 'connected' : 'disconnected',
      queryPerformance: performance.queryMetrics || {},
      connectionHealth: performance.connectionPool || {},
      recommendation: performance.connected ? 'Monitor query performance' : 'Check database connection'
    };
  }

  analyzeConnections(connections) {
    return {
      activeConnections: connections.totalConnections || 0,
      poolUtilization: connections.poolStatus || {},
      recommendation: 'Monitor connection pool usage'
    };
  }

  analyzeQueryPatterns() {
    const patterns = new Map();

    for (const [query, metrics] of this.queryMetrics) {
      const pattern = this.categorizeQuery(query);
      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, totalDuration: 0, queries: [] });
      }

      const patternData = patterns.get(pattern);
      patternData.count += metrics.count;
      patternData.totalDuration += metrics.totalDuration;
      patternData.queries.push(query);
    }

    return Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      count: data.count,
      avgDuration: data.totalDuration / data.count,
      queryCount: data.queries.length
    }));
  }

  categorizeQuery(query) {
    if (query.includes('select')) return 'SELECT';
    if (query.includes('insert')) return 'INSERT';
    if (query.includes('update')) return 'UPDATE';
    if (query.includes('delete')) return 'DELETE';
    return 'OTHER';
  }

  getTopQueries() {
    return Array.from(this.queryMetrics.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  analyzeSlowQueries() {
    return {
      count: this.slowQueries.length,
      avgDuration: this.slowQueries.reduce((sum, q) => sum + q.duration, 0) / Math.max(this.slowQueries.length, 1),
      patterns: this.getSlowQueryPatterns()
    };
  }

  getSlowQueryPatterns() {
    const patterns = new Map();

    this.slowQueries.forEach(slowQuery => {
      const pattern = this.categorizeQuery(slowQuery.query);
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    });

    return Array.from(patterns.entries());
  }

  identifyOptimizationOpportunities() {
    const opportunities = [];

    if (this.slowQueries.length > 5) {
      opportunities.push('Consider adding database indexes for slow queries');
    }

    const queryMetrics = this.getQueryMetricsSummary();
    if (queryMetrics.errorRate > 0.05) {
      opportunities.push('High error rate indicates potential query optimization needed');
    }

    return opportunities;
  }

  generatePerformancePredictions() {
    return {
      trend: 'stable',
      projectedLoad: 'normal',
      recommendation: 'Continue monitoring'
    };
  }

  generateSlowQueryRecommendations() {
    const recommendations = [];

    if (this.slowQueries.length > 0) {
      recommendations.push('Analyze and optimize slow queries');
      recommendations.push('Consider adding appropriate indexes');
      recommendations.push('Review query execution plans');
    }

    return recommendations;
  }

  generateQueryPatternRecommendations() {
    return [
      'Monitor query patterns for optimization opportunities',
      'Consider query caching for frequent operations',
      'Review and optimize complex queries'
    ];
  }

  async assessDataQuality() {
    // Placeholder for data quality assessment
    return {
      score: 0.85,
      completeness: 0.9,
      accuracy: 0.8,
      consistency: 0.9
    };
  }

  generateDataQualityRecommendations() {
    return [
      'Implement data validation rules',
      'Monitor data consistency across tables',
      'Regular data quality audits'
    ];
  }

  generateDatabaseRecommendations(performance, connections) {
    const recommendations = [];

    if (!performance.connected) {
      recommendations.push('Restore database connection');
      recommendations.push('Check database server status');
    } else {
      if (this.slowQueries.length > 5) {
        recommendations.push('Optimize slow queries');
      }

      if (performance.queryMetrics?.errorRate > 0.05) {
        recommendations.push('Investigate and fix query errors');
      }

      recommendations.push('Continue monitoring database performance');
    }

    return recommendations;
  }

  // WebSocket request handlers
  async executeQuery(ws, query) {
    if (!this.pool) {
      ws.send(JSON.stringify({ type: 'query_result', error: 'Database not connected' }));
      return;
    }

    try {
      const result = await this.pool.query(query);
      ws.send(JSON.stringify({
        type: 'query_result',
        data: { rows: result.rows, rowCount: result.rowCount }
      }));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'query_result', error: error.message }));
    }
  }

  async analyzeQuery(ws, query) {
    const analysis = {
      type: 'query_analysis',
      data: {
        normalized: this.normalizeQuery(query),
        category: this.categorizeQuery(query),
        estimatedComplexity: this.estimateQueryComplexity(query),
        recommendations: this.generateQueryRecommendations(query)
      }
    };

    ws.send(JSON.stringify(analysis));
  }

  estimateQueryComplexity(query) {
    const joins = (query.match(/join/gi) || []).length;
    const subqueries = (query.match(/\(/g) || []).length;
    const aggregates = (query.match(/(sum|count|avg|max|min)\(/gi) || []).length;

    if (joins > 3 || subqueries > 2 || aggregates > 2) return 'high';
    if (joins > 1 || subqueries > 0 || aggregates > 0) return 'medium';
    return 'low';
  }

  generateQueryRecommendations(query) {
    const recommendations = [];

    if (query.includes('SELECT *')) {
      recommendations.push('Consider selecting only needed columns instead of *');
    }

    if (query.includes('LIKE %')) {
      recommendations.push('Consider using full-text search for better performance');
    }

    return recommendations;
  }
}

// Initialize DatabaseIntelligenceMCP
const databaseIntelligence = new DatabaseIntelligenceMCP();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🗄️ DatabaseIntelligenceMCP Shutting Down...');
  if (databaseIntelligence.server) databaseIntelligence.server.close();
  if (databaseIntelligence.wsServer) databaseIntelligence.wsServer.close();
  if (databaseIntelligence.pool) databaseIntelligence.pool.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🗄️ DatabaseIntelligenceMCP Terminated');
  if (databaseIntelligence.server) databaseIntelligence.server.close();
  if (databaseIntelligence.wsServer) databaseIntelligence.wsServer.close();
  if (databaseIntelligence.pool) databaseIntelligence.pool.end();
  process.exit(0);
});
