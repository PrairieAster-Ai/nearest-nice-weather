#!/usr/bin/env node

/**
 * Claude Context API
 * Provides immediate access to high-value contextualizing data
 * 
 * PURPOSE: Enable Claude AI to make informed decisions instantly
 * PRIORITY: Maximum data accessibility for collaboration success
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ClaudeContextAPI {
  constructor() {
    this.port = 3025;
    this.dataDir = '/tmp/claude-intelligence';
    this.contextFile = path.join(this.dataDir, 'master-context.json');
    this.server = null;
    
    this.endpoints = {
      '/context/full': this.getFullContext.bind(this),
      '/context/business': this.getBusinessContext.bind(this),
      '/context/technical': this.getTechnicalContext.bind(this),
      '/context/project': this.getProjectContext.bind(this),
      '/context/risks': this.getRiskContext.bind(this),
      '/context/decisions': this.getDecisionContext.bind(this),
      '/context/performance': this.getPerformanceContext.bind(this),
      '/context/collaboration': this.getCollaborationContext.bind(this),
      '/context/realtime': this.getRealtimeContext.bind(this),
      '/context/summary': this.getContextSummary.bind(this),
      '/health': this.getHealthStatus.bind(this),
      '/metrics/business': this.getBusinessMetrics.bind(this),
      '/metrics/development': this.getDevelopmentMetrics.bind(this),
      '/recommendations': this.getRecommendations.bind(this),
      '/alerts': this.getAlerts.bind(this)
    };
    
    this.init();
  }

  async init() {
    console.log('🌐 Claude Context API Starting...');
    console.log('🎯 PURPOSE: Maximum data accessibility for collaboration success');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Start HTTP server
    this.startServer();
    
    console.log(`✅ Claude Context API Active on http://localhost:${this.port}`);
    console.log('📊 Available endpoints:');
    Object.keys(this.endpoints).forEach(endpoint => {
      console.log(`   http://localhost:${this.port}${endpoint}`);
    });
  }

  startServer() {
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
      
      if (this.endpoints[endpoint]) {
        try {
          const data = await this.endpoints[endpoint](url.searchParams);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data, null, 2));
        } catch (error) {
          console.error(`Error in ${endpoint}:`, error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found', availableEndpoints: Object.keys(this.endpoints) }));
      }
    });
    
    this.server.listen(this.port, () => {
      console.log(`🚀 Claude Context API listening on port ${this.port}`);
    });
  }

  async getFullContext(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      purpose: 'Complete contextual data for Claude AI decision making',
      businessGoal: 'minimize_productivity_degradation',
      context: context,
      dataQuality: this.assessDataQuality(context),
      insights: this.generateInsights(context),
      recommendations: this.generateRecommendations(context)
    };
  }

  async getBusinessContext(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      businessGoals: context.businessGoals || {},
      businessMetrics: context.businessMetrics || {},
      businessValue: context.projectState?.businessValue || {},
      riskFactors: context.riskFactors?.filter(r => r.type === 'business') || [],
      successFactors: context.successFactors?.filter(s => s.type === 'business') || [],
      businessImpact: this.calculateBusinessImpact(context),
      recommendations: this.generateBusinessRecommendations(context)
    };
  }

  async getTechnicalContext(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      technicalEnvironment: context.technicalEnvironment || {},
      projectState: context.projectState || {},
      technicalRisks: context.riskFactors?.filter(r => r.type === 'technical') || [],
      technicalPatterns: context.knowledgeBase?.technicalPatterns || {},
      serviceHealth: await this.getServiceHealth(),
      recommendations: this.generateTechnicalRecommendations(context)
    };
  }

  async getProjectContext(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      projectState: context.projectState || {},
      featureProgress: context.projectState?.featureProgress || {},
      codebaseMetrics: context.projectState?.codebaseMetrics || {},
      gitStatus: context.projectState?.gitStatus || {},
      developmentVelocity: context.businessMetrics?.developmentVelocity || {},
      qualityMetrics: context.businessMetrics?.qualityMetrics || {},
      recommendations: this.generateProjectRecommendations(context)
    };
  }

  async getRiskContext(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      riskFactors: context.riskFactors || [],
      riskLevel: this.calculateRiskLevel(context),
      criticalRisks: context.riskFactors?.filter(r => r.severity === 'high') || [],
      mitigationStrategies: this.generateMitigationStrategies(context),
      riskTrends: this.analyzeRiskTrends(context),
      recommendations: this.generateRiskRecommendations(context)
    };
  }

  async getDecisionContext(params) {
    const decisionDataFile = path.join(this.dataDir, 'decision-data.json');
    let decisionData = {};
    
    if (fs.existsSync(decisionDataFile)) {
      decisionData = JSON.parse(fs.readFileSync(decisionDataFile, 'utf8'));
    }
    
    const context = await this.loadContext();
    
    return {
      timestamp: new Date().toISOString(),
      decisionHistory: context.decisionHistory || [],
      currentDecisionData: decisionData,
      decisionFrameworks: context.knowledgeBase?.decisionFrameworks || {},
      collaborationPatterns: context.collaborationPatterns || {},
      decisionQuality: this.assessDecisionQuality(context),
      recommendations: this.generateDecisionRecommendations(context)
    };
  }

  async getPerformanceContext(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      performanceMetrics: context.technicalEnvironment?.performance || {},
      businessMetrics: context.businessMetrics || {},
      developmentVelocity: context.businessMetrics?.developmentVelocity || {},
      collaborationEfficiency: context.businessMetrics?.collaborationEfficiency || {},
      performanceTrends: this.analyzePerformanceTrends(context),
      recommendations: this.generatePerformanceRecommendations(context)
    };
  }

  async getCollaborationContext(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      collaborationPatterns: context.collaborationPatterns || {},
      collaborationEfficiency: context.businessMetrics?.collaborationEfficiency || {},
      communicationQuality: this.assessCommunicationQuality(context),
      contextTransferSuccess: this.assessContextTransferSuccess(context),
      successFactors: context.successFactors?.filter(s => s.type === 'collaboration') || [],
      recommendations: this.generateCollaborationRecommendations(context)
    };
  }

  async getRealtimeContext(params) {
    const realtimeData = {
      timestamp: new Date().toISOString(),
      services: await this.getServiceHealth(),
      performance: await this.getCurrentPerformance(),
      environment: await this.getEnvironmentStatus(),
      processes: await this.getProcessStatus(),
      resources: await this.getResourceStatus(),
      alerts: await this.getCurrentAlerts()
    };
    
    return {
      ...realtimeData,
      businessImpact: this.calculateRealtimeBusinessImpact(realtimeData),
      recommendations: this.generateRealtimeRecommendations(realtimeData)
    };
  }

  async getContextSummary(params) {
    const context = await this.loadContext();
    const summary = {
      timestamp: new Date().toISOString(),
      overallHealth: this.calculateOverallHealth(context),
      businessImpact: this.calculateBusinessImpact(context),
      riskLevel: this.calculateRiskLevel(context),
      successProbability: this.calculateSuccessProbability(context),
      keyInsights: this.generateKeyInsights(context),
      criticalActions: this.generateCriticalActions(context),
      nextSteps: this.generateNextSteps(context)
    };
    
    return summary;
  }

  async getHealthStatus(params) {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: await this.getServiceHealth(),
      api: { status: 'active', port: this.port },
      dataQuality: await this.assessDataQuality(),
      recommendations: []
    };
    
    // Assess overall health
    const serviceStatuses = Object.values(health.services);
    const unhealthyServices = serviceStatuses.filter(s => s.status !== 'healthy').length;
    
    if (unhealthyServices > 0) {
      health.status = unhealthyServices > 2 ? 'unhealthy' : 'degraded';
      health.recommendations.push('Check service status and restart if needed');
    }
    
    return health;
  }

  async getBusinessMetrics(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      businessMetrics: context.businessMetrics || {},
      businessValue: context.projectState?.businessValue || {},
      riskAdjustedValue: this.calculateRiskAdjustedValue(context),
      trendsAnalysis: this.analyzeBusinessTrends(context),
      recommendations: this.generateBusinessMetricsRecommendations(context)
    };
  }

  async getDevelopmentMetrics(params) {
    const context = await this.loadContext();
    return {
      timestamp: new Date().toISOString(),
      developmentVelocity: context.businessMetrics?.developmentVelocity || {},
      qualityMetrics: context.businessMetrics?.qualityMetrics || {},
      codebaseMetrics: context.projectState?.codebaseMetrics || {},
      gitMetrics: context.projectState?.gitStatus || {},
      productivity: this.calculateProductivity(context),
      recommendations: this.generateDevelopmentRecommendations(context)
    };
  }

  async getRecommendations(params) {
    const context = await this.loadContext();
    const recommendations = {
      timestamp: new Date().toISOString(),
      immediate: this.generateImmediateRecommendations(context),
      shortTerm: this.generateShortTermRecommendations(context),
      longTerm: this.generateLongTermRecommendations(context),
      businessCritical: this.generateBusinessCriticalRecommendations(context),
      technicalCritical: this.generateTechnicalCriticalRecommendations(context),
      priorityMatrix: this.generatePriorityMatrix(context)
    };
    
    return recommendations;
  }

  async getAlerts(params) {
    const context = await this.loadContext();
    const alerts = {
      timestamp: new Date().toISOString(),
      critical: this.generateCriticalAlerts(context),
      warning: this.generateWarningAlerts(context),
      info: this.generateInfoAlerts(context),
      businessImpact: this.assessAlertBusinessImpact(context),
      recommendations: this.generateAlertRecommendations(context)
    };
    
    return alerts;
  }

  // Helper methods for data processing
  async loadContext() {
    try {
      if (fs.existsSync(this.contextFile)) {
        return JSON.parse(fs.readFileSync(this.contextFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading context:', error.message);
    }
    
    return {
      timestamp: new Date().toISOString(),
      businessGoals: { primary: "minimize_productivity_degradation" },
      projectState: {},
      technicalEnvironment: {},
      businessMetrics: {},
      riskFactors: [],
      successFactors: [],
      knowledgeBase: {},
      collaborationPatterns: {}
    };
  }

  async getServiceHealth() {
    const services = {};
    
    try {
      // Check API server
      const apiResponse = await this.checkService('http://localhost:4000/api/health');
      services.api = apiResponse;
      
      // Check frontend
      const frontendResponse = await this.checkService('http://localhost:3001/');
      services.frontend = frontendResponse;
      
      // Check PM2 processes
      const pm2Status = await this.checkPM2Status();
      services.pm2 = pm2Status;
      
    } catch (error) {
      console.error('Error checking service health:', error.message);
    }
    
    return services;
  }

  async checkService(url) {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
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
      const { exec } = require('child_process');
      exec('pm2 jlist', (error, stdout) => {
        if (error) {
          resolve({ status: 'not_running', processes: [] });
          return;
        }
        
        try {
          const processes = JSON.parse(stdout);
          resolve({
            status: 'running',
            processes: processes.length,
            healthy: processes.filter(p => p.pm2_env.status === 'online').length
          });
        } catch (parseError) {
          resolve({ status: 'error', error: parseError.message });
        }
      });
    });
  }

  // Placeholder methods for comprehensive data analysis
  assessDataQuality(context) {
    return { score: 0.85, completeness: 0.9, accuracy: 0.8, timeliness: 0.9 };
  }

  generateInsights(context) {
    return ["High-quality contextual data available", "System operating within normal parameters"];
  }

  generateRecommendations(context) {
    return ["Continue monitoring system health", "Maintain current development velocity"];
  }

  calculateBusinessImpact(context) {
    return "low";
  }

  generateBusinessRecommendations(context) {
    return ["Focus on high-value features", "Minimize technical debt"];
  }

  generateTechnicalRecommendations(context) {
    return ["Maintain system health", "Monitor performance metrics"];
  }

  generateProjectRecommendations(context) {
    return ["Continue current development approach", "Regular code quality checks"];
  }

  calculateRiskLevel(context) {
    const riskCount = context.riskFactors?.length || 0;
    if (riskCount === 0) return 'low';
    if (riskCount <= 3) return 'medium';
    return 'high';
  }

  generateMitigationStrategies(context) {
    return ["Regular backups", "Monitoring alerts", "Performance optimization"];
  }

  analyzeRiskTrends(context) {
    return { trend: "stable", direction: "neutral" };
  }

  generateRiskRecommendations(context) {
    return ["Monitor risk factors", "Implement mitigation strategies"];
  }

  assessDecisionQuality(context) {
    return { score: 0.8, speed: 0.7, accuracy: 0.85 };
  }

  generateDecisionRecommendations(context) {
    return ["Use data-driven decision making", "Document decision rationale"];
  }

  analyzePerformanceTrends(context) {
    return { trend: "improving", velocity: "increasing" };
  }

  generatePerformanceRecommendations(context) {
    return ["Maintain current performance", "Monitor key metrics"];
  }

  assessCommunicationQuality(context) {
    return { score: 0.9, clarity: 0.85, completeness: 0.95 };
  }

  assessContextTransferSuccess(context) {
    return { score: 0.8, efficiency: 0.75, accuracy: 0.85 };
  }

  generateCollaborationRecommendations(context) {
    return ["Maintain clear communication", "Regular context updates"];
  }

  async getCurrentPerformance() {
    return { cpu: 25, memory: 40, disk: 15, network: 10 };
  }

  async getEnvironmentStatus() {
    return { status: "stable", services: 3, alerts: 0 };
  }

  async getProcessStatus() {
    return { total: 5, running: 5, failed: 0 };
  }

  async getResourceStatus() {
    return { cpu: "normal", memory: "normal", disk: "normal" };
  }

  async getCurrentAlerts() {
    return [];
  }

  calculateRealtimeBusinessImpact(data) {
    return data.alerts.length === 0 ? "none" : "low";
  }

  generateRealtimeRecommendations(data) {
    return ["System operating normally"];
  }

  calculateOverallHealth(context) {
    return "healthy";
  }

  calculateSuccessProbability(context) {
    return "high";
  }

  generateKeyInsights(context) {
    return ["System stable", "Development velocity maintained"];
  }

  generateCriticalActions(context) {
    return ["Continue current approach"];
  }

  generateNextSteps(context) {
    return ["Monitor system health", "Maintain development velocity"];
  }

  calculateRiskAdjustedValue(context) {
    return 0.85;
  }

  analyzeBusinessTrends(context) {
    return { trend: "positive", confidence: 0.8 };
  }

  generateBusinessMetricsRecommendations(context) {
    return ["Track key business metrics", "Focus on value delivery"];
  }

  calculateProductivity(context) {
    return { score: 0.8, trend: "stable" };
  }

  generateDevelopmentRecommendations(context) {
    return ["Maintain code quality", "Regular testing"];
  }

  generateImmediateRecommendations(context) {
    return ["Continue current work"];
  }

  generateShortTermRecommendations(context) {
    return ["Plan next sprint"];
  }

  generateLongTermRecommendations(context) {
    return ["Strategic planning"];
  }

  generateBusinessCriticalRecommendations(context) {
    return ["Focus on business value"];
  }

  generateTechnicalCriticalRecommendations(context) {
    return ["Maintain system health"];
  }

  generatePriorityMatrix(context) {
    return { high: [], medium: [], low: [] };
  }

  generateCriticalAlerts(context) {
    return [];
  }

  generateWarningAlerts(context) {
    return [];
  }

  generateInfoAlerts(context) {
    return [];
  }

  assessAlertBusinessImpact(context) {
    return "none";
  }

  generateAlertRecommendations(context) {
    return ["No alerts at this time"];
  }
}

// Initialize the Claude Context API
const contextAPI = new ClaudeContextAPI();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🌐 Claude Context API Shutting Down...');
  if (contextAPI.server) {
    contextAPI.server.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🌐 Claude Context API Terminated');
  if (contextAPI.server) {
    contextAPI.server.close();
  }
  process.exit(0);
});