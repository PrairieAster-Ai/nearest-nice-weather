/**
 * Memory Bank Business Context Setup
 * Initializes Memory Bank MCP with comprehensive business context
 * for intelligent Claude Code pair programming
 */

import fs from 'fs';
import path from 'path';

const MEMORY_BANK_DIR = 'memory-bank';

/**
 * Business Context Data Structure
 * Core information that Claude needs for consistent development
 */
const businessContext = {
  // Core Business Model
  businessModel: {
    type: 'B2C outdoor recreation platform',
    target: 'Casual mass market consumers in Minneapolis metro area',
    focus: 'Constraint-based weather optimization for free/frugal local activities',
    revenueModel: 'Ad revenue platform targeting 10,000+ active users',
    
    // Anti-patterns (what NOT to build)
    antiPatterns: [
      'B2B tourism operator features',
      'Weather stations or meteorological data as primary focus',
      'Cities instead of parks/trails',
      'National expansion beyond Minnesota',
      'Premium subscription features'
    ]
  },
  
  // Technical Architecture
  technicalStack: {
    backend: 'Vercel Edge Functions (Node.js serverless)',
    database: 'Neon PostgreSQL (serverless, geo-enabled)',
    frontend: 'Vite + React Progressive Web App with Material-UI',
    deployment: 'Vercel (frontend + serverless functions)',
    primaryTable: 'poi_locations',
    legacyTables: ['locations (deprecated)', 'weather_conditions (supplementary)'],
    
    // Critical architectural knowledge
    dualApiPattern: {
      development: 'Express.js server (dev-api-server.js)',
      production: 'Vercel Serverless Functions (apps/web/api/*.js)',
      challenge: 'Must maintain consistency between both implementations',
      maintenanceTime: '2-4 hours/week for synchronization'
    }
  },
  
  // Data Schema Knowledge
  dataModel: {
    primaryEntity: 'Point of Interest (POI)',
    primaryTable: 'poi_locations',
    requiredFields: ['name', 'latitude', 'longitude', 'park_type'],
    geographicBounds: {
      minnesota: {
        latitude: { min: 43.0, max: 49.5 },
        longitude: { min: -97.5, max: -89.0 }
      }
    },
    
    // Common data issues
    commonProblems: [
      'Queries using legacy "locations" table instead of "poi_locations"',
      'Cities appearing instead of parks/trails',
      'POIs outside Minnesota geographic bounds',
      'Missing park_type classification'
    ]
  },
  
  // User Experience Patterns
  userJourney: {
    primary: 'POI discovery with auto-expanding search radius',
    steps: [
      'User opens app at current/selected location',
      'Map loads with nearby parks/trails within 30-mile radius',
      'If no results found, automatically expand radius by 30-mile increments',
      'Weather data enhances decision-making (secondary)',
      'Mobile-optimized experience across all interactions'
    ],
    
    // Critical UX requirements
    requirements: [
      'Auto-expand search must work for remote users',
      'Map markers must be clickable and show POI details',
      'Footer must be visible (z-index: 1004, above map)',
      'No blank screens on any environment',
      'Responsive design for mobile/desktop/tablet'
    ]
  },
  
  // Development Patterns
  developmentPatterns: {
    // Successful patterns to repeat
    successPatterns: [
      {
        pattern: 'POI API endpoint structure',
        example: 'Query poi_locations with latitude/longitude bounds',
        usage: 'Use this pattern for all location-based queries'
      },
      {
        pattern: 'Auto-expand search radius',
        example: 'While visiblePOIs.length === 0 && currentRadius < 300',
        usage: 'Progressive expansion for remote users'
      },
      {
        pattern: 'Business context validation',
        example: 'Check that results contain parks/trails, not cities',
        usage: 'Validate all API responses match business model'
      }
    ],
    
    // Anti-patterns to avoid
    antiPatterns: [
      {
        pattern: 'Legacy locations table queries',
        problem: 'Returns weather stations/cities instead of POIs',
        solution: 'Always use poi_locations table'
      },
      {
        pattern: 'Manual screenshot sharing',
        problem: 'Inefficient and breaks workflow',
        solution: 'Use Playwright MCP for automated screenshots'
      },
      {
        pattern: 'Environment-specific fixes',
        problem: 'Creates inconsistency between localhost/preview/production',
        solution: 'Use unified environment validation scripts'
      }
    ]
  },
  
  // Common Issues and Solutions
  troubleshooting: {
    blankScreen: {
      rootCauses: [
        'Vercel preview alias pointing to wrong deployment',
        'JavaScript bundle compatibility issues',
        'React hydration failures'
      ],
      diagnosticScript: './scripts/comprehensive-health-check.sh',
      solution: 'Follow blank-screen-troubleshooting.md runbook'
    },
    
    missingPOIs: {
      rootCauses: [
        'API querying wrong table (locations vs poi_locations)',
        'User location outside Minnesota bounds',
        'Auto-expand radius not triggering'
      ],
      diagnosticCommands: [
        'curl localhost:4000/api/poi-locations?limit=5',
        'Check console for auto-expand messages',
        'Verify usePOINavigation.ts logic'
      ]
    },
    
    footerNotVisible: {
      rootCause: 'Z-index conflict with map container',
      solution: 'Set footer zIndex to 1004 (above map container 1003)',
      file: 'apps/web/src/components/UnifiedStickyFooter.tsx'
    }
  },
  
  // Quality Assurance Patterns
  qaPatterns: {
    // Must-test scenarios
    criticalTests: [
      'POI discovery journey from remote location',
      'Auto-expand radius functionality',
      'Map marker interactions and popups',
      'Footer visibility across all screen sizes',
      'API response times < 1 second'
    ],
    
    // Business model validation
    businessValidation: [
      'Results show parks/trails, never cities',
      'All POIs within Minnesota geographic bounds',
      'No B2B features accidentally exposed',
      'Weather data enhances, doesn\'t dominate experience'
    ],
    
    // Performance benchmarks
    performanceTargets: {
      mapLoadTime: '< 3 seconds',
      poiApiResponse: '< 500ms',
      autoExpandDelay: '< 1 second',
      firstContentfulPaint: '< 2 seconds'
    }
  }
};

/**
 * Development Velocity Insights
 * Patterns that accelerate or decelerate development
 */
const velocityInsights = {
  // High-velocity approaches
  accelerators: [
    {
      technique: 'Comprehensive health checks before coding',
      benefit: 'Prevents 2-4 hours of environment troubleshooting',
      script: './scripts/comprehensive-health-check.sh'
    },
    {
      technique: 'Playwright MCP for automated QA',
      benefit: 'Reduces manual testing time by 85%',
      usage: 'Use for all UI changes and deployments'
    },
    {
      technique: 'Business context validation',
      benefit: 'Prevents building wrong features',
      pattern: 'Always validate POI-centric results'
    },
    {
      technique: 'Unified development startup',
      benefit: 'Consistent environment in 30 seconds',
      command: 'npm start'
    }
  ],
  
  // Velocity killers to avoid
  decelerators: [
    {
      problem: 'Manual screenshot sharing workflow',
      cost: '15-30 minutes per debug session',
      solution: 'Use Playwright MCP automated screenshots'
    },
    {
      problem: 'Environment state inconsistency',
      cost: '14-19 hours/week historical loss',
      solution: 'Use comprehensive health check automation'
    },
    {
      problem: 'Breaking working features during changes',
      cost: '6-8 hours debugging + rollback time',
      solution: 'Use deployment gate QA automation'
    },
    {
      problem: 'Business model misalignment',
      cost: 'Days of wrong-direction development',
      solution: 'Automated business validation in all tests'
    }
  ]
};

/**
 * Session Handoff Templates
 * Structured information for Claude session continuity
 */
const sessionTemplates = {
  standardHandoff: {
    currentStatus: 'What features are working and tested',
    activeWork: 'Specific task being implemented',
    nextSteps: 'Planned implementation steps',
    blockers: 'Issues preventing progress',
    businessContext: 'B2C outdoor recreation, POI-focused',
    techStack: 'Vercel + Neon + React, dual API architecture',
    lastValidation: 'When environment was last health-checked'
  },
  
  issueHandoff: {
    problemDescription: 'Clear description of issue',
    reproductionSteps: 'How to reproduce the problem',
    expectedBehavior: 'What should happen instead',
    diagnosticResults: 'Output from health checks or error logs',
    attemptedSolutions: 'What has been tried already',
    businessImpact: 'How this affects POI discovery or user experience'
  }
};

/**
 * Setup Memory Bank Directory Structure
 */
function setupMemoryBankStructure() {
  // Create main directory
  if (!fs.existsSync(MEMORY_BANK_DIR)) {
    fs.mkdirSync(MEMORY_BANK_DIR, { recursive: true });
  }
  
  // Create subdirectories
  const subdirs = [
    'business-context',
    'technical-patterns',
    'troubleshooting',
    'session-handoffs',
    'qa-automation',
    'performance-data'
  ];
  
  subdirs.forEach(dir => {
    const fullPath = path.join(MEMORY_BANK_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
}

/**
 * Write Business Context Files
 */
function writeBusinessContext() {
  // Core business context
  fs.writeFileSync(
    path.join(MEMORY_BANK_DIR, 'business-context', 'core-business-model.json'),
    JSON.stringify(businessContext, null, 2)
  );
  
  // Velocity insights
  fs.writeFileSync(
    path.join(MEMORY_BANK_DIR, 'technical-patterns', 'velocity-insights.json'),
    JSON.stringify(velocityInsights, null, 2)
  );
  
  // Session templates
  fs.writeFileSync(
    path.join(MEMORY_BANK_DIR, 'session-handoffs', 'handoff-templates.json'),
    JSON.stringify(sessionTemplates, null, 2)
  );
  
  // Quick reference guide
  const quickReference = {
    primaryTable: 'poi_locations',
    businessFocus: 'B2C outdoor recreation (NOT B2B tourism)',
    geographicScope: 'Minnesota only',
    userJourney: 'POI discovery with auto-expand',
    techStack: 'Vercel + Neon + React',
    
    // Critical commands
    healthCheck: './scripts/comprehensive-health-check.sh localhost',
    qaAutomation: 'npm run qa:deployment-gate',
    environmentStart: 'npm start',
    
    // Red flags
    redFlags: [
      'Cities appearing instead of parks',
      'Blank screen on any environment',
      'API querying locations table',
      'Manual screenshot workflow',
      'B2B features being developed'
    ]
  };
  
  fs.writeFileSync(
    path.join(MEMORY_BANK_DIR, 'quick-reference.json'),
    JSON.stringify(quickReference, null, 2)
  );
}

/**
 * Create Human-Readable Documentation
 */
function createDocumentation() {
  const docContent = `# Memory Bank Business Context

This directory contains structured business context for Claude Code pair programming sessions.

## Directory Structure

- **business-context/**: Core business model and requirements
- **technical-patterns/**: Successful patterns and anti-patterns  
- **troubleshooting/**: Common issues and proven solutions
- **session-handoffs/**: Templates for session continuity
- **qa-automation/**: QA patterns and test requirements
- **performance-data/**: Performance baselines and trends

## Quick Reference

**Business Model**: B2C outdoor recreation platform for Minnesota
**Primary Data**: poi_locations table (parks, trails, outdoor destinations)
**Tech Stack**: Vercel + Neon PostgreSQL + React PWA
**User Journey**: POI discovery with auto-expanding search radius

## Critical Commands

\`\`\`bash
# Environment health check
./scripts/comprehensive-health-check.sh localhost

# QA automation before deployment
npm run qa:deployment-gate

# Start unified development environment
npm start
\`\`\`

## Red Flags (Stop and Fix Immediately)

- ❌ Cities showing instead of parks/trails
- ❌ Blank screen on any environment  
- ❌ API queries using legacy "locations" table
- ❌ Manual screenshot sharing workflow
- ❌ B2B tourism features being developed

## Success Patterns

- ✅ All results from poi_locations table
- ✅ Auto-expand working for remote users
- ✅ Playwright MCP for automated testing
- ✅ Comprehensive health checks before coding
- ✅ Business model validation in all tests

---
*Generated by Memory Bank Business Context Setup*
*Last updated: ${new Date().toISOString()}*
`;
  
  fs.writeFileSync(path.join(MEMORY_BANK_DIR, 'README.md'), docContent);
}

/**
 * Main Setup Function
 */
function setupMemoryBankContext() {
  console.log('🧠 Setting up Memory Bank Business Context...');
  
  try {
    setupMemoryBankStructure();
    writeBusinessContext();
    createDocumentation();
    
    console.log('✅ Memory Bank context setup complete!');
    console.log('📁 Context files created in:', MEMORY_BANK_DIR);
    console.log('📋 Quick reference available at:', path.join(MEMORY_BANK_DIR, 'README.md'));
    
    // Summary of what was created
    console.log('\n📊 Context Data Summary:');
    console.log('   - Business model and anti-patterns');
    console.log('   - Technical architecture and dual API pattern');
    console.log('   - POI data schema and geographic bounds');
    console.log('   - User journey and UX requirements');
    console.log('   - Development velocity insights');
    console.log('   - Troubleshooting patterns and solutions');
    console.log('   - QA automation requirements');
    console.log('   - Session handoff templates');
    
  } catch (error) {
    console.error('❌ Memory Bank setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMemoryBankContext();
}

export { setupMemoryBankContext, businessContext, velocityInsights };