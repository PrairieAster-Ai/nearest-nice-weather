// Claude Intelligence Suite Configuration for Nearest Nice Weather
// Project-specific settings optimized for weather platform development

module.exports = {
  // Project identification
  projectName: 'nearest-nice-weather',
  description: 'B2C weather intelligence platform for Minnesota outdoor recreation consumers',
  
  // Network configuration - avoid conflicts with existing services
  basePort: 3050,  // Uses ports 3050-3059
  
  // Enabled intelligence tools
  enabledTools: [
    'system',    // System resource monitoring (essential for development)
    'git',       // Git collaboration analysis (high-value for Claude AI context)
    'database',  // Database performance monitoring (Neon PostgreSQL)
    'context'    // Unified context API (maximum Claude AI intelligence)
  ],
  
  // Project-specific configuration
  environment: {
    projectType: 'React + Vite PWA',
    backend: 'Vercel Edge Functions',
    database: 'Neon PostgreSQL',
    deployment: 'Vercel',
    collaboration: 'Claude AI + Human'
  },
  
  // Data and logging
  dataDir: '/tmp/claude-intelligence/nearest-nice-weather',
  logLevel: 'info',  // Detailed logging for development
  autoDetectServices: true,
  
  // System monitoring configuration
  systemConfig: {
    monitorInterval: 10000,  // 10 seconds
    alertThresholds: {
      cpu: 85,      // Alert if CPU > 85%
      memory: 80,   // Alert if memory > 80%
      disk: 90      // Alert if disk > 90%
    },
    processMonitoring: {
      trackVite: true,        // Monitor Vite dev server
      trackNode: true,        // Monitor Node.js processes
      trackBrowser: true      // Monitor browser processes
    }
  },
  
  // Git intelligence configuration
  gitConfig: {
    mainBranch: 'main',
    analyzeDepth: 100,       // Analyze last 100 commits
    trackCollaboration: true, // Track Claude AI collaboration patterns
    businessAlignment: true,  // Track business goal alignment
    contextTransfer: true,    // Analyze context transfer quality
    commitPatterns: {
      trackProjectLog: true,  // Track project log format usage
      trackBusinessContext: true, // Track business context inclusion
      trackClaudeGenerated: true  // Track Claude-generated commits
    }
  },
  
  // Database intelligence configuration
  databaseConfig: {
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/weather_intelligence",
    maxConnections: 20,
    monitorQueries: true,
    trackPerformance: true,
    slowQueryThreshold: 1000, // 1 second
    trackSchema: true,
    weatherDataAnalysis: {
      trackLocationQueries: true,  // Monitor weather location queries
      trackApiCalls: true,         // Monitor API endpoint usage
      trackUserQueries: true       // Monitor user location queries
    }
  },
  
  // Context API configuration
  contextConfig: {
    businessGoals: {
      primary: 'minimize_productivity_degradation',
      secondary: 'maximize_development_velocity', 
      tertiary: 'optimize_weather_platform_features'
    },
    
    projectPriorities: [
      'weather_data_accuracy',
      'user_experience_optimization',
      'api_performance',
      'collaboration_efficiency',
      'deployment_reliability'
    ],
    
    keyMetrics: [
      'development_velocity',
      'commit_quality',
      'context_transfer_success',
      'system_performance',
      'api_response_times'
    ],
    
    intelligenceFeatures: {
      businessAlignment: true,     // Track business goal alignment
      riskDetection: true,         // Detect productivity risks
      performancePrediction: true, // Predict performance issues
      collaborationOptimization: true // Optimize collaboration patterns
    }
  },
  
  // Nearest Nice Weather specific monitoring
  weatherPlatformConfig: {
    apiEndpoints: [
      '/api/weather-locations',
      '/api/feedback',
      '/api/health'
    ],
    
    performanceTargets: {
      apiResponseTime: 500,    // Target: < 500ms
      pageLoadTime: 2000,     // Target: < 2s
      databaseQueryTime: 100   // Target: < 100ms
    },
    
    businessMetrics: {
      trackUserEngagement: true,
      trackWeatherAccuracy: true,
      trackConsumerValue: true,
      trackCollaborationSuccess: true
    },
    
    developmentWorkflow: {
      trackFeatureVelocity: true,
      trackBugResolution: true,
      trackDeploymentSuccess: true,
      trackContextPreservation: true
    }
  },
  
  // Claude AI collaboration optimization
  claudeOptimization: {
    contextPreservation: {
      trackSessionHistory: true,
      preserveDecisionHistory: true,
      maintainBusinessContext: true,
      trackLearningPatterns: true
    },
    
    productivityMetrics: {
      trackDecisionSpeed: true,
      trackContextTransferTime: true,
      trackProblemResolutionTime: true,
      trackCollaborationEfficiency: true
    },
    
    intelligenceEnhancement: {
      aggregateMultiSourceData: true,
      providePredictiveInsights: true,
      enableProactiveAlerts: true,
      optimizeWorkflowPatterns: true
    }
  },
  
  // Integration with existing services
  serviceIntegration: {
    // Vite development server (port 3001)
    viteServer: {
      port: 3001,
      monitor: true,
      healthCheck: 'http://localhost:3001/'
    },
    
    // API server (port 4000)
    apiServer: {
      port: 4000,
      monitor: true,
      healthCheck: 'http://localhost:4000/api/health'
    },
    
    // Browser Tools MCP (port 3025)
    browserTools: {
      port: 3025,
      monitor: true,
      integrate: true
    },
    
    // Simple server (port 3008)
    simpleServer: {
      port: 3008,
      monitor: true,
      healthCheck: 'http://localhost:3008/'
    }
  },
  
  // Alerts and notifications
  alerting: {
    enableSlackNotifications: false, // Disable for now
    enableEmailNotifications: false, // Disable for now
    
    criticalAlerts: [
      'system_resource_critical',
      'database_connection_lost',
      'api_endpoint_down',
      'deployment_failure'
    ],
    
    warningAlerts: [
      'high_resource_usage',
      'slow_database_queries',
      'collaboration_pattern_degradation',
      'context_transfer_issues'
    ]
  },
  
  // Deployment and environment specific settings
  deployment: {
    environment: process.env.NODE_ENV || 'development',
    
    development: {
      enableAllTools: true,
      verboseLogging: true,
      realTimeMonitoring: true,
      performanceOptimization: false
    },
    
    production: {
      enableAllTools: false,
      verboseLogging: false,
      realTimeMonitoring: true,
      performanceOptimization: true,
      enabledTools: ['system', 'context'] // Minimal set for production
    }
  },
  
  // Data retention and cleanup
  dataManagement: {
    retentionDays: 30,        // Keep 30 days of intelligence data
    cleanupInterval: 86400000, // Clean up daily (24 hours in ms)
    archiveImportantData: true,
    preserveBusinessMetrics: true
  }
};