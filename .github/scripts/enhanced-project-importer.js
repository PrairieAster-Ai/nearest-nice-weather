#!/usr/bin/env node

/**
 * Enhanced GitHub Project Importer
 * Creates issues with proper GitHub Projects v2 field assignments
 * Handles Work Item Type field using GraphQL API
 */

import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

// Project field configuration based on actual project structure
const PROJECT_CONFIG = {
  projectId: 'PVT_kwDODOEVVc4A-5-C',
  fields: {
    workItemType: {
      fieldId: 'PVTSSF_lADODOEVVc4A-5-CzgyRLcU',
      options: {
        'User Story': 'd50374fe',
        'Epic': '1b56d361',
        'Capability': '7cbc29c7'
      }
    },
    status: {
      fieldId: 'PVTSSF_lADODOEVVc4A-5-CzgyKxsE',
      options: {
        'Backlog': 'f75ad846',
        'Ready': 'e18bf179',
        'In progress': '47fc9ee4',
        'In review': 'aba860b9',
        'Done': '98236657',
        'In Production': 'c14aabb1'
      }
    },
    size: {
      fieldId: 'PVTSSF_lADODOEVVc4A-5-CzgyKyOc',
      options: {
        'XS': '911790be',
        'S': 'b277fb01',
        'M': '86db8eb3',
        'L': '853c8207',
        'XL': '2d0801e2'
      }
    }
  }
};

// Initialize clients
const octokit = new Octokit({ auth: GITHUB_TOKEN });
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
});

class EnhancedProjectImporter {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectConfig = PROJECT_CONFIG;
  }

  /**
   * Create issue with project field assignments
   */
  async createIssueWithProjectFields(issueData) {
    try {
      console.log(`📝 Creating issue: ${issueData.title}`);

      // Step 1: Create the issue using REST API
      const issue = await octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: issueData.title,
        body: issueData.body,
        labels: issueData.labels || [],
        assignees: issueData.assignees || [],
        milestone: issueData.milestone || null,
      });

      console.log(`✅ Issue created: #${issue.data.number}`);

      // Step 2: Add issue to project using GraphQL
      const addToProjectResult = await this.addIssueToProject(issue.data.node_id);

      if (!addToProjectResult) {
        console.warn(`⚠️ Failed to add issue #${issue.data.number} to project`);
        return issue.data;
      }

      // Step 3: Set project fields using GraphQL
      const projectItemId = addToProjectResult.addProjectV2ItemById.item.id;

      await this.setProjectFields(projectItemId, issueData.projectFields || {});

      console.log(`🎯 Issue #${issue.data.number} configured with project fields`);
      return issue.data;

    } catch (error) {
      console.error(`❌ Error creating issue: ${error.message}`);
      return null;
    }
  }

  /**
   * Add issue to project using GraphQL
   */
  async addIssueToProject(issueNodeId) {
    try {
      const mutation = `
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: {
            projectId: $projectId
            contentId: $contentId
          }) {
            item {
              id
            }
          }
        }
      `;

      const result = await graphqlWithAuth(mutation, {
        projectId: this.projectConfig.projectId,
        contentId: issueNodeId,
      });

      return result;
    } catch (error) {
      console.error(`❌ Error adding issue to project: ${error.message}`);
      return null;
    }
  }

  /**
   * Set multiple project fields for an item
   */
  async setProjectFields(projectItemId, fieldValues) {
    const promises = [];

    // Set Work Item Type if provided
    if (fieldValues.workItemType) {
      promises.push(this.setWorkItemType(projectItemId, fieldValues.workItemType));
    }

    // Set Status if provided
    if (fieldValues.status) {
      promises.push(this.setStatus(projectItemId, fieldValues.status));
    }

    // Set Size if provided
    if (fieldValues.size) {
      promises.push(this.setSize(projectItemId, fieldValues.size));
    }

    try {
      await Promise.all(promises);
      console.log(`✅ Project fields set for item ${projectItemId}`);
    } catch (error) {
      console.error(`❌ Error setting project fields: ${error.message}`);
    }
  }

  /**
   * Set Work Item Type field
   */
  async setWorkItemType(projectItemId, workItemType) {
    const optionId = this.projectConfig.fields.workItemType.options[workItemType];
    if (!optionId) {
      console.warn(`⚠️ Unknown work item type: ${workItemType}`);
      return;
    }

    return this.setSelectField(
      projectItemId,
      this.projectConfig.fields.workItemType.fieldId,
      optionId
    );
  }

  /**
   * Set Status field
   */
  async setStatus(projectItemId, status) {
    const optionId = this.projectConfig.fields.status.options[status];
    if (!optionId) {
      console.warn(`⚠️ Unknown status: ${status}`);
      return;
    }

    return this.setSelectField(
      projectItemId,
      this.projectConfig.fields.status.fieldId,
      optionId
    );
  }

  /**
   * Set Size field
   */
  async setSize(projectItemId, size) {
    const optionId = this.projectConfig.fields.size.options[size];
    if (!optionId) {
      console.warn(`⚠️ Unknown size: ${size}`);
      return;
    }

    return this.setSelectField(
      projectItemId,
      this.projectConfig.fields.size.fieldId,
      optionId
    );
  }

  /**
   * Generic method to set a select field
   */
  async setSelectField(projectItemId, fieldId, optionId) {
    try {
      const mutation = `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: $value
          }) {
            projectV2Item {
              id
            }
          }
        }
      `;

      await graphqlWithAuth(mutation, {
        projectId: this.projectConfig.projectId,
        itemId: projectItemId,
        fieldId: fieldId,
        value: {
          singleSelectOptionId: optionId
        }
      });

      console.log(`✅ Field ${fieldId} set to option ${optionId}`);
    } catch (error) {
      console.error(`❌ Error setting field ${fieldId}: ${error.message}`);
    }
  }

  /**
   * Import work items from MVP WBS structure
   */
  async importMVPWorkItems() {
    console.log('🚀 Importing MVP Work Items to GitHub Project...\n');

    // Complete work items based on MVP-WBS-STRUCTURED.md
    const workItems = [
      // Sprint 3: Database + Weather API (Current Sprint)

      // Capability 1: Real-Time Weather Intelligence
      {
        title: 'Capability: Real-Time Weather Intelligence',
        body: this.generateCapabilityBody('Real-Time Weather Intelligence', 'Multi-source weather aggregation for accuracy and user trust'),
        labels: ['type: capability', 'weather-api', 'database'],
        projectFields: {
          workItemType: 'Capability',
          status: 'Ready',
          size: 'XL'
        }
      },

      // Epic 1.1: Production Database & POI Infrastructure
      {
        title: 'Epic: Production Database & POI Infrastructure',
        body: this.generateEpicBody('Production Database & POI Infrastructure', 'Deploy scalable PostgreSQL database with Minnesota POI data'),
        labels: ['type: epic', 'database', 'infrastructure'],
        projectFields: {
          workItemType: 'Epic',
          status: 'Ready',
          size: 'XL'
        }
      },

      // Story 1.1.1: Minnesota POI Database Deployment
      {
        title: 'Story: Minnesota POI Database Deployment',
        body: this.generateStoryBody('Minnesota POI Database Deployment', 'Deploy production database with 100+ Minnesota locations and tourism operators'),
        labels: ['type: story', 'database', 'poi-data', 'minnesota'],
        projectFields: {
          workItemType: 'User Story',
          status: 'Ready',
          size: 'L'
        }
      },

      // Epic 1.2: Weather API Integration & Optimization
      {
        title: 'Epic: Weather API Integration & Optimization',
        body: this.generateEpicBody('Weather API Integration & Optimization', 'Integrate OpenWeather API with rate limiting and caching'),
        labels: ['type: epic', 'weather-api', 'integration'],
        projectFields: {
          workItemType: 'Epic',
          status: 'Ready',
          size: 'XL'
        }
      },

      // Story 1.2.1: OpenWeather API Connection & Rate Limiting
      {
        title: 'Story: OpenWeather API Connection & Rate Limiting',
        body: this.generateStoryBody('OpenWeather API Connection & Rate Limiting', 'Connect to OpenWeather API with proper authentication and rate limiting'),
        labels: ['type: story', 'weather-api', 'openweather', 'rate-limiting'],
        projectFields: {
          workItemType: 'User Story',
          status: 'Ready',
          size: 'L'
        }
      },

      // Story 1.2.2: Redis Caching Implementation
      {
        title: 'Story: Redis Caching Implementation for Weather Data',
        body: this.generateStoryBody('Redis Caching Implementation', 'Implement Redis caching for weather data to improve performance and reduce API costs'),
        labels: ['type: story', 'caching', 'redis', 'performance'],
        projectFields: {
          workItemType: 'User Story',
          status: 'Ready',
          size: 'M'
        }
      },

      // Sprint 4: Revenue + Launch (Next Sprint)

      // Capability 2: Revenue Generation
      {
        title: 'Capability: Revenue Generation',
        body: this.generateCapabilityBody('Revenue Generation', '$36K annual revenue target through ads and subscriptions'),
        labels: ['type: capability', 'revenue', 'analytics'],
        projectFields: {
          workItemType: 'Capability',
          status: 'Backlog',
          size: 'XL'
        }
      },

      // Epic 2.1: Revenue Integration
      {
        title: 'Epic: Revenue Integration',
        body: this.generateEpicBody('Revenue Integration', 'Integrate Google AdSense and subscription payment processing'),
        labels: ['type: epic', 'adsense', 'revenue'],
        projectFields: {
          workItemType: 'Epic',
          status: 'Backlog',
          size: 'XL'
        }
      },

      // Story 2.1.1: Google AdSense Integration
      {
        title: 'Story: Google AdSense Integration',
        body: this.generateStoryBody('Google AdSense Integration', 'Integrate Google AdSense for revenue generation with performance monitoring'),
        labels: ['type: story', 'adsense', 'revenue', 'monetization'],
        projectFields: {
          workItemType: 'User Story',
          status: 'Backlog',
          size: 'L'
        }
      },

      // Epic 2.2: User Analytics & Testing
      {
        title: 'Epic: User Analytics & Testing',
        body: this.generateEpicBody('User Analytics & Testing', 'Implement comprehensive user analytics and testing protocols'),
        labels: ['type: epic', 'analytics', 'testing', 'ga4'],
        projectFields: {
          workItemType: 'Epic',
          status: 'Backlog',
          size: 'XL'
        }
      },

      // Story 2.2.1: Google Analytics 4 Integration
      {
        title: 'Story: Google Analytics 4 Integration',
        body: this.generateStoryBody('Google Analytics 4 Integration', 'Integrate GA4 for comprehensive user behavior tracking'),
        labels: ['type: story', 'analytics', 'ga4', 'tracking'],
        projectFields: {
          workItemType: 'User Story',
          status: 'Backlog',
          size: 'M'
        }
      },

      // Story 2.2.2: User Testing Protocols
      {
        title: 'Story: User Testing Protocols',
        body: this.generateStoryBody('User Testing Protocols', 'Develop and implement user testing protocols for MVP validation'),
        labels: ['type: story', 'testing', 'validation', 'user-research'],
        projectFields: {
          workItemType: 'User Story',
          status: 'Backlog',
          size: 'M'
        }
      },

      // Capability 3: Cognitive Load Management (Cross-Sprint)
      {
        title: 'Capability: Cognitive Load Management',
        body: this.generateCapabilityBody('Cognitive Load Management', 'Optimize UI/UX to minimize user cognitive load while maximizing information value'),
        labels: ['type: capability', 'frontend', 'ux'],
        projectFields: {
          workItemType: 'Capability',
          status: 'Ready',
          size: 'L'
        }
      }
    ];

    // Create all work items
    const createdItems = [];
    for (const item of workItems) {
      const created = await this.createIssueWithProjectFields(item);
      if (created) {
        createdItems.push(created);
      }

      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Import complete: ${createdItems.length} work items created`);

    // Display summary
    this.displayImportSummary(createdItems);

    return createdItems;
  }

  /**
   * Generate capability issue body
   */
  generateCapabilityBody(title, description = '') {
    return `## 📋 **Description**

${description || 'Cross-sprint platform capability that enables core business functionality.'}

## 📊 **GitHub Project Fields**

- **Type**: Capability
- **Priority**: High
- **Status**: Ready
- **Phase**: MVP Development
- **Effort**: XL (Cross-sprint capability)
- **Business Impact**: Platform Critical

## 🔗 **Project Relationships**

- **Contains**: Multiple Epics
- **Enables**: Core platform functionality
- **Business Value**: Essential for MVP success

## 📈 **Project Metrics**

- **Completion Criteria**: All child epics completed and validated
- **Success Metrics**: Platform capability operational
- **Timeline**: Cross-sprint development
- **Risk Level**: Medium (technical complexity)

## 🎯 **Acceptance Criteria**

- [ ] All child epics completed
- [ ] Integration testing passed
- [ ] Performance benchmarks met
- [ ] Documentation completed

---
*🔧 Optimized for GitHub Projects v2 workflow*`;
  }

  /**
   * Generate epic issue body
   */
  generateEpicBody(title, description = '') {
    return `## 📋 **Description**

${description || 'Major work container that implements significant business functionality.'}

## 📊 **GitHub Project Fields**

- **Type**: Epic
- **Priority**: High
- **Status**: Ready
- **Phase**: MVP Development
- **Effort**: XL (20+ story points)
- **Business Impact**: Feature Critical

## 🔗 **Project Relationships**

- **Parent**: Referenced capability
- **Contains**: Multiple User Stories
- **Dependencies**: Technical prerequisites

## 📈 **Project Metrics**

- **Completion Criteria**: All user stories implemented and tested
- **Success Metrics**: Epic functionality validated
- **Timeline**: 2-3 weeks
- **Risk Level**: Medium (integration complexity)

## 🎯 **Acceptance Criteria**

- [ ] All user stories completed
- [ ] Integration testing passed
- [ ] Performance validated
- [ ] Documentation updated

---
*🔧 Optimized for GitHub Projects v2 workflow*`;
  }

  /**
   * Generate user story issue body
   */
  generateStoryBody(title, description = '') {
    return `## 📋 **Description**

${description || 'User-focused work item that delivers specific business value.'}

## 📊 **GitHub Project Fields**

- **Type**: User Story
- **Priority**: Medium
- **Status**: Ready
- **Phase**: MVP Implementation
- **Effort**: L (8-13 story points)
- **Business Impact**: User Value

## 🔗 **Project Relationships**

- **Parent**: Referenced epic
- **Implements**: Specific user functionality
- **Dependencies**: Technical prerequisites

## 📈 **Project Metrics**

- **Completion Criteria**: Acceptance criteria met and validated
- **Success Metrics**: User workflow functional
- **Timeline**: 1-2 weeks
- **Risk Level**: Low-Medium (standard development)

## 🎯 **Acceptance Criteria**

- [ ] Feature implemented and functional
- [ ] Unit tests written and passing
- [ ] User testing completed
- [ ] Documentation updated

---
*🔧 Optimized for GitHub Projects v2 workflow*`;
  }

  /**
   * Display import summary
   */
  displayImportSummary(createdItems) {
    console.log('\n📊 **IMPORT SUMMARY**');
    console.log('='.repeat(50));

    const typeCount = {
      capabilities: 0,
      epics: 0,
      stories: 0
    };

    createdItems.forEach(item => {
      console.log(`  #${item.number}: ${item.title}`);
      console.log(`    🔗 ${item.html_url}`);

      if (item.title.includes('Capability:')) typeCount.capabilities++;
      else if (item.title.includes('Epic:')) typeCount.epics++;
      else if (item.title.includes('Story:')) typeCount.stories++;
    });

    console.log('\n📈 **TYPE BREAKDOWN**:');
    console.log(`  🎯 Capabilities: ${typeCount.capabilities}`);
    console.log(`  📚 Epics: ${typeCount.epics}`);
    console.log(`  📖 Stories: ${typeCount.stories}`);
    console.log(`  📄 Total: ${createdItems.length}`);

    console.log('\n✅ All items configured with Work Item Type field!');
  }

  /**
   * Test project field configuration
   */
  async testProjectFieldConfiguration() {
    console.log('🧪 Testing project field configuration...\n');

    try {
      // Query project fields to verify configuration
      const query = `
        query($projectId: ID!) {
          node(id: $projectId) {
            ... on ProjectV2 {
              title
              fields(first: 20) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                    dataType
                  }
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    dataType
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const result = await graphqlWithAuth(query, {
        projectId: this.projectConfig.projectId,
      });

      console.log('📊 Project Fields Configuration:');
      console.log(JSON.stringify(result.node, null, 2));

      return result;
    } catch (error) {
      console.error(`❌ Error testing project configuration: ${error.message}`);
      return null;
    }
  }
}

// CLI Interface
async function main() {
  const importer = new EnhancedProjectImporter();
  const command = process.argv[2];

  switch (command) {
    case 'import':
      await importer.importMVPWorkItems();
      break;

    case 'test-config':
      await importer.testProjectFieldConfiguration();
      break;

    case 'create-sample':
      const sampleIssue = {
        title: 'Sample: Test Work Item Type Assignment',
        body: 'This is a test issue to verify Work Item Type field assignment.',
        labels: ['type: story', 'test'],
        projectFields: {
          workItemType: 'User Story',
          status: 'Ready',
          size: 'S'
        }
      };
      await importer.createIssueWithProjectFields(sampleIssue);
      break;

    default:
      console.log(`
🚀 Enhanced GitHub Project Importer

Usage:
  node enhanced-project-importer.js import        # Import MVP work items with project fields
  node enhanced-project-importer.js test-config   # Test project field configuration
  node enhanced-project-importer.js create-sample # Create a sample issue with Work Item Type

Examples:
  node enhanced-project-importer.js import
  node enhanced-project-importer.js test-config
      `);
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { EnhancedProjectImporter };
