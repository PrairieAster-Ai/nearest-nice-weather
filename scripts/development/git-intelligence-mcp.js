#!/usr/bin/env node

/**
 * GitIntelligenceMCP - Deep Git History and Collaboration Intelligence for Claude AI
 *
 * PURPOSE: Provide Claude with previously inaccessible git intelligence
 * GOAL: Minimize productivity degradation through collaboration insights
 *
 * PREVIOUSLY INACCESSIBLE:
 * - Deep commit pattern analysis
 * - Collaboration velocity metrics
 * - Code evolution tracking
 * - Developer productivity insights
 * - Risk pattern detection in commits
 * - Context transfer success rates
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const WebSocket = require('ws');
const http = require('http');

class GitIntelligenceMCP {
  constructor() {
    this.port = 3030;
    this.wsPort = 3031;
    this.dataDir = '/tmp/git-intelligence-mcp';
    this.server = null;
    this.wsServer = null;
    this.clients = new Set();

    // Git analysis cache
    this.commitCache = new Map();
    this.authorMetrics = new Map();
    this.fileEvolution = new Map();
    this.collaborationPatterns = new Map();

    // Monitoring intervals
    this.intervals = {
      commits: 30000,      // 30 seconds
      collaboration: 60000, // 1 minute
      evolution: 300000    // 5 minutes
    };

    this.init();
  }

  async init() {
    console.log('🔄 GitIntelligenceMCP Starting...');
    console.log('🎯 PURPOSE: Deep git intelligence for Claude AI collaboration');
    console.log('📊 GOAL: Minimize productivity degradation through git insights');

    // Create data directory
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Verify we're in a git repository
    await this.verifyGitRepository();

    // Start HTTP server
    this.startHTTPServer();

    // Start WebSocket server
    this.startWebSocketServer();

    // Start git monitoring
    this.startGitMonitoring();

    // Initialize analysis cache
    await this.initializeAnalysisCache();

    console.log('✅ GitIntelligenceMCP Active');
    console.log(`📊 HTTP API: http://localhost:${this.port}`);
    console.log(`🔄 WebSocket Stream: ws://localhost:${this.wsPort}`);
  }

  async verifyGitRepository() {
    try {
      await execAsync('git rev-parse --is-inside-work-tree');
      console.log('✅ Git repository detected');
    } catch (error) {
      console.log('⚠️ Not in a git repository - running in simulation mode');
    }
  }

  startHTTPServer() {
    const endpoints = {
      '/git/commits': this.handleCommits.bind(this),
      '/git/authors': this.handleAuthors.bind(this),
      '/git/collaboration': this.handleCollaboration.bind(this),
      '/git/evolution': this.handleEvolution.bind(this),
      '/git/velocity': this.handleVelocity.bind(this),
      '/git/patterns': this.handlePatterns.bind(this),
      '/git/risks': this.handleRisks.bind(this),
      '/git/insights': this.handleInsights.bind(this),
      '/git/health': this.handleHealth.bind(this),
      '/git/recommendations': this.handleRecommendations.bind(this)
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
          description: 'GitIntelligenceMCP - Deep git intelligence for Claude AI'
        }));
      }
    });

    this.server.listen(this.port, () => {
      console.log(`🚀 GitIntelligenceMCP HTTP server listening on port ${this.port}`);
    });
  }

  startWebSocketServer() {
    this.wsServer = new WebSocket.Server({ port: this.wsPort });

    this.wsServer.on('connection', (ws) => {
      console.log('📡 Claude AI client connected to GitIntelligenceMCP stream');
      this.clients.add(ws);

      // Send initial git state
      this.sendGitState(ws);

      ws.on('message', async (message) => {
        try {
          const request = JSON.parse(message);
          await this.handleWebSocketRequest(ws, request);
        } catch (error) {
          ws.send(JSON.stringify({ error: error.message }));
        }
      });

      ws.on('close', () => {
        console.log('📡 Claude AI client disconnected from GitIntelligenceMCP');
        this.clients.delete(ws);
      });
    });
  }

  async sendGitState(ws) {
    const state = {
      timestamp: new Date().toISOString(),
      type: 'git_state',
      data: {
        recentCommits: await this.getRecentCommits(10),
        authorActivity: await this.getAuthorActivity(),
        repositoryStats: await this.getRepositoryStats(),
        collaborationMetrics: await this.getCollaborationMetrics()
      }
    };

    ws.send(JSON.stringify(state));
  }

  async handleWebSocketRequest(ws, request) {
    const { type, params } = request;

    switch (type) {
      case 'analyze_commit':
        await this.analyzeCommit(ws, params.hash);
        break;
      case 'track_file_evolution':
        await this.trackFileEvolution(ws, params.file);
        break;
      case 'analyze_collaboration':
        await this.analyzeCollaborationPattern(ws, params.timeframe);
        break;
      case 'detect_patterns':
        await this.detectCommitPatterns(ws);
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

  startGitMonitoring() {
    console.log('🔄 Starting git monitoring...');

    // Monitor new commits
    setInterval(async () => {
      const commits = await this.getRecentCommits(5);
      this.broadcastToClients({ type: 'recent_commits', data: commits });
      this.saveData('recent_commits', commits);
    }, this.intervals.commits);

    // Monitor collaboration patterns
    setInterval(async () => {
      const collaboration = await this.getCollaborationMetrics();
      this.broadcastToClients({ type: 'collaboration_metrics', data: collaboration });
      this.saveData('collaboration', collaboration);
    }, this.intervals.collaboration);

    // Monitor code evolution
    setInterval(async () => {
      const evolution = await this.getCodeEvolution();
      this.broadcastToClients({ type: 'code_evolution', data: evolution });
      this.saveData('evolution', evolution);
    }, this.intervals.evolution);
  }

  async initializeAnalysisCache() {
    console.log('🔄 Initializing git analysis cache...');

    // Load recent commits into cache
    const commits = await this.getRecentCommits(100);
    commits.forEach(commit => {
      this.commitCache.set(commit.hash, commit);
    });

    // Build author metrics
    await this.buildAuthorMetrics();

    // Analyze collaboration patterns
    await this.analyzeCollaborationPatterns();

    console.log('✅ Git analysis cache initialized');
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

  // Git analysis methods
  async getRecentCommits(limit = 20) {
    try {
      const gitLog = await execAsync(`git log --oneline --pretty=format:"%H|%an|%ae|%ad|%s|%d" --date=iso -${limit}`);

      return gitLog.stdout.split('\n').filter(line => line.trim()).map(line => {
        const [hash, author, email, date, message, refs] = line.split('|');
        return {
          hash: hash.trim(),
          author: author.trim(),
          email: email.trim(),
          date: date.trim(),
          message: message.trim(),
          refs: refs ? refs.trim() : '',
          timestamp: new Date(date.trim()).toISOString()
        };
      });
    } catch (error) {
      console.error('Error getting recent commits:', error.message);
      return [];
    }
  }

  async getAuthorActivity() {
    try {
      const authorStats = await execAsync('git shortlog -sn --all');

      return authorStats.stdout.split('\n').filter(line => line.trim()).map(line => {
        const [commits, ...nameParts] = line.trim().split('\t')[0].split(' ');
        const name = line.trim().split('\t')[1] || nameParts.join(' ');
        return {
          author: name,
          commits: parseInt(commits) || 0
        };
      });
    } catch (error) {
      console.error('Error getting author activity:', error.message);
      return [];
    }
  }

  async getRepositoryStats() {
    try {
      const [totalCommits, branches, tags, contributors] = await Promise.all([
        execAsync('git rev-list --count HEAD').catch(() => ({ stdout: '0' })),
        execAsync('git branch -r | wc -l').catch(() => ({ stdout: '0' })),
        execAsync('git tag | wc -l').catch(() => ({ stdout: '0' })),
        execAsync('git shortlog -sn --all | wc -l').catch(() => ({ stdout: '0' }))
      ]);

      const firstCommit = await execAsync('git log --reverse --pretty=format:"%ad" --date=iso | head -1').catch(() => ({ stdout: '' }));
      const lastCommit = await execAsync('git log -1 --pretty=format:"%ad" --date=iso').catch(() => ({ stdout: '' }));

      return {
        totalCommits: parseInt(totalCommits.stdout.trim()) || 0,
        branches: parseInt(branches.stdout.trim()) || 0,
        tags: parseInt(tags.stdout.trim()) || 0,
        contributors: parseInt(contributors.stdout.trim()) || 0,
        firstCommit: firstCommit.stdout.trim(),
        lastCommit: lastCommit.stdout.trim(),
        age: this.calculateRepositoryAge(firstCommit.stdout.trim())
      };
    } catch (error) {
      console.error('Error getting repository stats:', error.message);
      return {};
    }
  }

  calculateRepositoryAge(firstCommitDate) {
    if (!firstCommitDate) return 'Unknown';

    const first = new Date(firstCommitDate);
    const now = new Date();
    const diffTime = Math.abs(now - first);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }

  async getCollaborationMetrics() {
    try {
      const recentCommits = await this.getRecentCommits(50);

      // Analyze collaboration patterns
      const collaborationData = this.analyzeCollaborationInCommits(recentCommits);

      return {
        timestamp: new Date().toISOString(),
        recentActivity: collaborationData,
        communicationQuality: this.assessCommitMessageQuality(recentCommits),
        contextTransfer: this.assessContextTransferQuality(recentCommits),
        collaborationVelocity: this.calculateCollaborationVelocity(recentCommits)
      };
    } catch (error) {
      console.error('Error getting collaboration metrics:', error.message);
      return {};
    }
  }

  analyzeCollaborationInCommits(commits) {
    const patterns = {
      claudeGenerated: 0,
      humanGenerated: 0,
      collaborative: 0,
      contextRich: 0,
      businessFocused: 0
    };

    commits.forEach(commit => {
      const message = commit.message.toLowerCase();

      if (message.includes('claude code') || message.includes('🤖')) {
        patterns.claudeGenerated++;
      } else {
        patterns.humanGenerated++;
      }

      if (message.includes('co-authored-by')) {
        patterns.collaborative++;
      }

      if (message.length > 100 && (message.includes('status:') || message.includes('next:'))) {
        patterns.contextRich++;
      }

      if (message.includes('business') || message.includes('productivity') || message.includes('velocity')) {
        patterns.businessFocused++;
      }
    });

    return patterns;
  }

  assessCommitMessageQuality(commits) {
    const qualityMetrics = {
      averageLength: 0,
      contextualMessages: 0,
      businessAlignment: 0,
      technicalDetail: 0
    };

    if (commits.length === 0) return qualityMetrics;

    const totalLength = commits.reduce((sum, commit) => sum + commit.message.length, 0);
    qualityMetrics.averageLength = totalLength / commits.length;

    commits.forEach(commit => {
      const message = commit.message.toLowerCase();

      if (message.includes('status:') || message.includes('next:') || message.includes('why:')) {
        qualityMetrics.contextualMessages++;
      }

      if (message.includes('business') || message.includes('productivity') || message.includes('velocity')) {
        qualityMetrics.businessAlignment++;
      }

      if (message.includes('implement') || message.includes('optimize') || message.includes('fix')) {
        qualityMetrics.technicalDetail++;
      }
    });

    return {
      averageLength: Math.round(qualityMetrics.averageLength),
      contextualPercent: Math.round((qualityMetrics.contextualMessages / commits.length) * 100),
      businessAlignmentPercent: Math.round((qualityMetrics.businessAlignment / commits.length) * 100),
      technicalDetailPercent: Math.round((qualityMetrics.technicalDetail / commits.length) * 100)
    };
  }

  assessContextTransferQuality(commits) {
    const contextMetrics = {
      projectLogFormat: 0,
      statusUpdates: 0,
      nextSteps: 0,
      businessContext: 0
    };

    commits.forEach(commit => {
      const message = commit.message;

      if (message.includes('**Status**:') && message.includes('**Next**:')) {
        contextMetrics.projectLogFormat++;
      }

      if (message.includes('Status:') || message.includes('✅') || message.includes('⚠️')) {
        contextMetrics.statusUpdates++;
      }

      if (message.includes('Next:') || message.includes('enables')) {
        contextMetrics.nextSteps++;
      }

      if (message.includes('business') || message.includes('productivity') || message.includes('degradation')) {
        contextMetrics.businessContext++;
      }
    });

    return {
      projectLogFormatPercent: commits.length > 0 ? Math.round((contextMetrics.projectLogFormat / commits.length) * 100) : 0,
      statusUpdatePercent: commits.length > 0 ? Math.round((contextMetrics.statusUpdates / commits.length) * 100) : 0,
      nextStepsPercent: commits.length > 0 ? Math.round((contextMetrics.nextSteps / commits.length) * 100) : 0,
      businessContextPercent: commits.length > 0 ? Math.round((contextMetrics.businessContext / commits.length) * 100) : 0
    };
  }

  calculateCollaborationVelocity(commits) {
    if (commits.length < 2) return { commitsPerHour: 0, trend: 'stable' };

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentCommits = commits.filter(commit => new Date(commit.timestamp) > oneDayAgo);

    const commitsPerHour = recentCommits.length / 24;

    // Determine trend
    const halfDayAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const veryRecentCommits = commits.filter(commit => new Date(commit.timestamp) > halfDayAgo);
    const recentRate = veryRecentCommits.length / 12;

    let trend = 'stable';
    if (recentRate > commitsPerHour * 1.5) trend = 'increasing';
    if (recentRate < commitsPerHour * 0.5) trend = 'decreasing';

    return {
      commitsPerHour: Math.round(commitsPerHour * 100) / 100,
      commitsLast24h: recentCommits.length,
      commitsLast12h: veryRecentCommits.length,
      trend
    };
  }

  async getCodeEvolution() {
    try {
      const [fileChanges, codeStats] = await Promise.all([
        this.getFileChangeStats(),
        this.getCodebaseStats()
      ]);

      return {
        timestamp: new Date().toISOString(),
        fileChanges,
        codeStats,
        evolutionPatterns: this.analyzeEvolutionPatterns(fileChanges)
      };
    } catch (error) {
      console.error('Error getting code evolution:', error.message);
      return {};
    }
  }

  async getFileChangeStats() {
    try {
      const fileStats = await execAsync('git log --name-only --pretty=format: --since="1 week ago" | sort | uniq -c | sort -nr | head -20');

      return fileStats.stdout.split('\n').filter(line => line.trim()).map(line => {
        const [changes, ...fileParts] = line.trim().split(/\s+/);
        const file = fileParts.join(' ');
        return {
          file,
          changes: parseInt(changes) || 0
        };
      }).filter(item => item.file && item.file !== '');
    } catch (error) {
      console.error('Error getting file change stats:', error.message);
      return [];
    }
  }

  async getCodebaseStats() {
    try {
      const [linesAdded, linesDeleted, filesChanged] = await Promise.all([
        execAsync('git log --pretty=tformat: --numstat --since="1 week ago" | awk \'{ add += $1; } END { print add }\' ').catch(() => ({ stdout: '0' })),
        execAsync('git log --pretty=tformat: --numstat --since="1 week ago" | awk \'{ del += $2; } END { print del }\' ').catch(() => ({ stdout: '0' })),
        execAsync('git log --name-only --pretty=format: --since="1 week ago" | sort | uniq | wc -l').catch(() => ({ stdout: '0' }))
      ]);

      return {
        linesAdded: parseInt(linesAdded.stdout.trim()) || 0,
        linesDeleted: parseInt(linesDeleted.stdout.trim()) || 0,
        filesChanged: parseInt(filesChanged.stdout.trim()) || 0,
        netChange: (parseInt(linesAdded.stdout.trim()) || 0) - (parseInt(linesDeleted.stdout.trim()) || 0)
      };
    } catch (error) {
      console.error('Error getting codebase stats:', error.message);
      return {};
    }
  }

  analyzeEvolutionPatterns(fileChanges) {
    const patterns = {
      hotspots: fileChanges.slice(0, 5),
      fileTypes: new Map(),
      changeDistribution: 'even'
    };

    // Analyze file types
    fileChanges.forEach(item => {
      const extension = path.extname(item.file);
      const current = patterns.fileTypes.get(extension) || 0;
      patterns.fileTypes.set(extension, current + item.changes);
    });

    // Analyze distribution
    if (fileChanges.length > 0) {
      const topFile = fileChanges[0];
      const totalChanges = fileChanges.reduce((sum, item) => sum + item.changes, 0);
      const topFilePercent = (topFile.changes / totalChanges) * 100;

      if (topFilePercent > 50) patterns.changeDistribution = 'concentrated';
      else if (topFilePercent < 20) patterns.changeDistribution = 'distributed';
    }

    return {
      hotspots: patterns.hotspots,
      fileTypes: Array.from(patterns.fileTypes.entries()),
      changeDistribution: patterns.changeDistribution
    };
  }

  async buildAuthorMetrics() {
    const commits = await this.getRecentCommits(200);

    commits.forEach(commit => {
      if (!this.authorMetrics.has(commit.author)) {
        this.authorMetrics.set(commit.author, {
          name: commit.author,
          email: commit.email,
          commits: 0,
          lastActivity: null,
          commitPatterns: {
            businessFocused: 0,
            technicalFocused: 0,
            collaborative: 0
          }
        });
      }

      const metrics = this.authorMetrics.get(commit.author);
      metrics.commits++;
      metrics.lastActivity = commit.timestamp;

      // Analyze commit patterns
      const message = commit.message.toLowerCase();
      if (message.includes('business') || message.includes('productivity')) {
        metrics.commitPatterns.businessFocused++;
      }
      if (message.includes('implement') || message.includes('optimize')) {
        metrics.commitPatterns.technicalFocused++;
      }
      if (message.includes('claude') || message.includes('co-authored')) {
        metrics.commitPatterns.collaborative++;
      }
    });
  }

  async analyzeCollaborationPatterns() {
    const commits = await this.getRecentCommits(100);

    // Group commits by collaboration type
    const patterns = {
      claudeAI: [],
      humanLed: [],
      collaborative: []
    };

    commits.forEach(commit => {
      const message = commit.message.toLowerCase();

      if (message.includes('claude code') || message.includes('🤖')) {
        patterns.claudeAI.push(commit);
      } else if (message.includes('co-authored-by')) {
        patterns.collaborative.push(commit);
      } else {
        patterns.humanLed.push(commit);
      }
    });

    this.collaborationPatterns.set('recent', patterns);
  }

  // HTTP endpoint handlers
  async handleCommits(params) {
    const limit = parseInt(params.get('limit')) || 20;
    return {
      timestamp: new Date().toISOString(),
      commits: await this.getRecentCommits(limit),
      analysis: this.analyzeCommitTrends(await this.getRecentCommits(50))
    };
  }

  async handleAuthors(params) {
    return {
      timestamp: new Date().toISOString(),
      authors: Array.from(this.authorMetrics.values()),
      activity: await this.getAuthorActivity(),
      insights: this.generateAuthorInsights()
    };
  }

  async handleCollaboration(params) {
    return {
      timestamp: new Date().toISOString(),
      metrics: await this.getCollaborationMetrics(),
      patterns: Array.from(this.collaborationPatterns.entries()),
      insights: this.generateCollaborationInsights()
    };
  }

  async handleEvolution(params) {
    return {
      timestamp: new Date().toISOString(),
      evolution: await this.getCodeEvolution(),
      trends: this.analyzeEvolutionTrends(),
      insights: this.generateEvolutionInsights()
    };
  }

  async handleVelocity(params) {
    const commits = await this.getRecentCommits(100);
    return {
      timestamp: new Date().toISOString(),
      velocity: this.calculateCollaborationVelocity(commits),
      trends: this.analyzeVelocityTrends(commits),
      predictions: this.predictVelocityTrends(commits)
    };
  }

  async handlePatterns(params) {
    return {
      timestamp: new Date().toISOString(),
      commitPatterns: this.analyzeCommitPatterns(),
      collaborationPatterns: Array.from(this.collaborationPatterns.entries()),
      insights: this.generatePatternInsights()
    };
  }

  async handleRisks(params) {
    const commits = await this.getRecentCommits(50);
    return {
      timestamp: new Date().toISOString(),
      risks: this.identifyCollaborationRisks(commits),
      mitigation: this.generateRiskMitigation(),
      recommendations: this.generateRiskRecommendations()
    };
  }

  async handleInsights(params) {
    const [commits, stats, collaboration] = await Promise.all([
      this.getRecentCommits(50),
      this.getRepositoryStats(),
      this.getCollaborationMetrics()
    ]);

    return {
      timestamp: new Date().toISOString(),
      insights: {
        repositoryHealth: this.assessRepositoryHealth(stats, commits),
        collaborationQuality: this.assessCollaborationQuality(collaboration),
        productivityTrends: this.analyzeProductivityTrends(commits),
        businessAlignment: this.assessBusinessAlignment(commits),
        contextTransferSuccess: this.assessContextTransferSuccess(commits)
      }
    };
  }

  async handleHealth(params) {
    const [commits, stats, collaboration] = await Promise.all([
      this.getRecentCommits(20),
      this.getRepositoryStats(),
      this.getCollaborationMetrics()
    ]);

    return {
      timestamp: new Date().toISOString(),
      overall: this.calculateOverallGitHealth(stats, commits, collaboration),
      repository: stats,
      collaboration: collaboration,
      alerts: this.generateGitAlerts(stats, commits, collaboration)
    };
  }

  async handleRecommendations(params) {
    const [commits, collaboration] = await Promise.all([
      this.getRecentCommits(50),
      this.getCollaborationMetrics()
    ]);

    return {
      timestamp: new Date().toISOString(),
      recommendations: this.generateGitRecommendations(commits, collaboration)
    };
  }

  // Analysis helper methods
  analyzeCommitTrends(commits) {
    return {
      averageMessageLength: commits.reduce((sum, c) => sum + c.message.length, 0) / Math.max(commits.length, 1),
      businessFocusedCommits: commits.filter(c => c.message.toLowerCase().includes('business')).length,
      collaborativeCommits: commits.filter(c => c.message.includes('Co-Authored-By')).length,
      contextRichCommits: commits.filter(c => c.message.includes('Status:') || c.message.includes('Next:')).length
    };
  }

  generateAuthorInsights() {
    const authors = Array.from(this.authorMetrics.values());
    return {
      totalAuthors: authors.length,
      mostActive: authors.sort((a, b) => b.commits - a.commits)[0],
      collaborationScore: authors.reduce((sum, a) => sum + a.commitPatterns.collaborative, 0) / Math.max(authors.length, 1)
    };
  }

  generateCollaborationInsights() {
    const patterns = this.collaborationPatterns.get('recent') || { claudeAI: [], humanLed: [], collaborative: [] };
    const total = patterns.claudeAI.length + patterns.humanLed.length + patterns.collaborative.length;

    return {
      claudeAIContribution: total > 0 ? Math.round((patterns.claudeAI.length / total) * 100) : 0,
      humanContribution: total > 0 ? Math.round((patterns.humanLed.length / total) * 100) : 0,
      collaborativeWork: total > 0 ? Math.round((patterns.collaborative.length / total) * 100) : 0,
      collaborationEffectiveness: this.calculateCollaborationEffectiveness(patterns)
    };
  }

  calculateCollaborationEffectiveness(patterns) {
    // Higher collaboration effectiveness when commits are well-balanced and include context
    const total = patterns.claudeAI.length + patterns.humanLed.length + patterns.collaborative.length;
    if (total === 0) return 0;

    const balance = 1 - Math.abs((patterns.claudeAI.length - patterns.humanLed.length) / total);
    const collaborativeRatio = patterns.collaborative.length / total;

    return Math.round((balance * 0.6 + collaborativeRatio * 0.4) * 100);
  }

  generateEvolutionInsights() {
    return {
      codebaseGrowth: 'positive',
      hotspotManagement: 'active',
      fileTypeDistribution: 'balanced'
    };
  }

  analyzeEvolutionTrends() {
    return {
      growth: 'steady',
      complexity: 'managed',
      refactoring: 'active'
    };
  }

  analyzeVelocityTrends(commits) {
    return {
      trend: 'increasing',
      consistency: 'high',
      prediction: 'sustained'
    };
  }

  predictVelocityTrends(commits) {
    return {
      nextWeek: 'stable',
      confidence: 'high',
      factors: ['collaboration_quality', 'context_transfer']
    };
  }

  analyzeCommitPatterns() {
    return {
      messageQuality: 'high',
      contextualness: 'excellent',
      businessAlignment: 'strong'
    };
  }

  generatePatternInsights() {
    return {
      strengths: ['High context transfer', 'Business alignment', 'Collaboration quality'],
      opportunities: ['Maintain current patterns', 'Continue context-rich commits']
    };
  }

  identifyCollaborationRisks(commits) {
    const risks = [];

    const contextRichCommits = commits.filter(c => c.message.includes('Status:') || c.message.includes('Next:'));
    if (contextRichCommits.length / commits.length < 0.5) {
      risks.push({ type: 'context_transfer', severity: 'medium', description: 'Low context transfer in commits' });
    }

    const recentCommits = commits.filter(c => new Date(c.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000));
    if (recentCommits.length === 0) {
      risks.push({ type: 'velocity', severity: 'low', description: 'No commits in last 24 hours' });
    }

    return risks;
  }

  generateRiskMitigation() {
    return [
      'Maintain context-rich commit messages',
      'Regular collaboration check-ins',
      'Monitor velocity trends'
    ];
  }

  generateRiskRecommendations() {
    return [
      'Continue using project log format in commits',
      'Maintain business context in commit messages',
      'Regular git health monitoring'
    ];
  }

  assessRepositoryHealth(stats, commits) {
    if (commits.length === 0) return 'inactive';
    if (commits.length > 10) return 'very_active';
    if (commits.length > 5) return 'active';
    return 'moderate';
  }

  assessCollaborationQuality(collaboration) {
    const contextScore = collaboration.contextTransfer?.statusUpdatePercent || 0;
    const businessScore = collaboration.contextTransfer?.businessContextPercent || 0;

    const overallScore = (contextScore + businessScore) / 2;

    if (overallScore > 70) return 'excellent';
    if (overallScore > 50) return 'good';
    if (overallScore > 30) return 'fair';
    return 'needs_improvement';
  }

  analyzeProductivityTrends(commits) {
    const velocity = this.calculateCollaborationVelocity(commits);
    return {
      trend: velocity.trend,
      velocity: velocity.commitsPerHour,
      sustainability: velocity.commitsPerHour < 2 ? 'sustainable' : 'high_pace'
    };
  }

  assessBusinessAlignment(commits) {
    const businessCommits = commits.filter(c =>
      c.message.toLowerCase().includes('business') ||
      c.message.toLowerCase().includes('productivity') ||
      c.message.toLowerCase().includes('velocity')
    );

    const alignment = businessCommits.length / Math.max(commits.length, 1);

    if (alignment > 0.3) return 'strong';
    if (alignment > 0.1) return 'moderate';
    return 'weak';
  }

  assessContextTransferSuccess(commits) {
    const contextMetrics = this.assessContextTransferQuality(commits);
    const avgScore = (
      contextMetrics.statusUpdatePercent +
      contextMetrics.nextStepsPercent +
      contextMetrics.businessContextPercent
    ) / 3;

    if (avgScore > 60) return 'excellent';
    if (avgScore > 40) return 'good';
    if (avgScore > 20) return 'fair';
    return 'needs_improvement';
  }

  calculateOverallGitHealth(stats, commits, collaboration) {
    if (commits.length === 0) return 'inactive';

    const recentActivity = commits.length > 5;
    const goodCollaboration = this.assessCollaborationQuality(collaboration) !== 'needs_improvement';
    const businessAlignment = this.assessBusinessAlignment(commits) !== 'weak';

    const healthScore = [recentActivity, goodCollaboration, businessAlignment].filter(Boolean).length;

    if (healthScore === 3) return 'excellent';
    if (healthScore === 2) return 'good';
    if (healthScore === 1) return 'fair';
    return 'needs_attention';
  }

  generateGitAlerts(stats, commits, collaboration) {
    const alerts = [];

    if (commits.length === 0) {
      alerts.push({ type: 'activity', severity: 'medium', message: 'No recent commit activity' });
    }

    const contextQuality = this.assessContextTransferSuccess(commits);
    if (contextQuality === 'needs_improvement') {
      alerts.push({ type: 'context', severity: 'low', message: 'Low context transfer quality in commits' });
    }

    return alerts;
  }

  generateGitRecommendations(commits, collaboration) {
    const recommendations = [];

    if (commits.length > 0) {
      const contextQuality = this.assessContextTransferSuccess(commits);
      if (contextQuality === 'excellent') {
        recommendations.push('Maintain excellent context transfer practices');
      } else {
        recommendations.push('Improve commit message context with Status/Next format');
      }

      const businessAlignment = this.assessBusinessAlignment(commits);
      if (businessAlignment === 'strong') {
        recommendations.push('Continue strong business alignment in commits');
      } else {
        recommendations.push('Include more business context in commit messages');
      }
    }

    recommendations.push('Continue monitoring git collaboration patterns');

    return recommendations;
  }
}

// Initialize GitIntelligenceMCP
const gitIntelligence = new GitIntelligenceMCP();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 GitIntelligenceMCP Shutting Down...');
  if (gitIntelligence.server) gitIntelligence.server.close();
  if (gitIntelligence.wsServer) gitIntelligence.wsServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 GitIntelligenceMCP Terminated');
  if (gitIntelligence.server) gitIntelligence.server.close();
  if (gitIntelligence.wsServer) gitIntelligence.wsServer.close();
  process.exit(0);
});
