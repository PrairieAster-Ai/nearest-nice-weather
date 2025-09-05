#!/usr/bin/env node

/**
 * Import MVP Work Items to GitHub Issues
 * Creates Capabilities, Epics, and Stories from MVP-WBS-STRUCTURED.md
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-MVPImporter/1.0.0',
});

class MVPWorkItemImporter {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
    this.createdIssues = [];
    this.issueMap = new Map(); // Track relationships
    this.projectId = null; // Will be fetched
    this.projectFieldIds = {}; // Will store field IDs
  }

  // Define MVP work items structure from MVP-WBS-STRUCTURED.md
  getMVPWorkItems() {
    return {
      capabilities: [
        {
          name: 'User Feedback Intelligence',
          status: 'Done',
          sprint: 'N/A',
          size: 'L',
          priority: 'High',
          labels: ['type: capability', 'feedback', 'user-research'],
          assignees: [''],
          description: 'User feedback collection and analysis for product improvement',
          businessValue: 'User feedback collection and analysis for product improvement. Star ratings, categories, and email collection system.',
          childEpics: ['Interactive Feedback Interface', 'Feedback Data Pipeline'],
          completed: true
        },
        {
          name: 'Location-Based POI Discovery',
          status: 'Done',
          sprint: 'N/A',
          size: 'XL',
          priority: 'High',
          labels: ['type: capability', 'maps', 'location', 'poi'],
          assignees: [''],
          description: 'Interactive discovery of weather-optimal locations with Minnesota-focused outdoor recreation mapping',
          businessValue: 'Interactive discovery of weather-optimal locations. Geographic Focus: Minnesota-focused outdoor recreation mapping.',
          childEpics: ['Interactive Map Infrastructure', 'User Location & Navigation'],
          completed: true
        },
        {
          name: 'Real-Time Weather Intelligence',
          status: 'Ready',
          sprint: 'Database + Weather API',
          size: 'XL',
          priority: 'Critical',
          labels: ['type: capability', 'database', 'weather-api'],
          assignees: [''],
          description: 'Multi-source weather aggregation for accuracy and reliable weather data platform credibility',
          businessValue: 'Multi-source weather aggregation for accuracy. Reliable weather data builds platform credibility.',
          childEpics: ['Production Database & POI Infrastructure', 'Weather API Integration & Optimization'],
          completed: false
        },
        {
          name: 'Cognitive Load Management',
          status: 'Ready',
          sprint: 'Database + Weather API',
          size: 'L',
          priority: 'Medium',
          labels: ['type: capability', 'performance', 'ux'],
          assignees: [''],
          description: 'Reduce decision fatigue for weekend outdoor planning with <3 second response time',
          businessValue: '<3 second response time for weather intelligence decisions. Reduce decision fatigue for weekend outdoor planning.',
          childEpics: [],
          completed: false
        },
        {
          name: 'Revenue Generation',
          status: 'Ready',
          sprint: 'Revenue + Launch',
          size: 'XL',
          priority: 'Critical',
          labels: ['type: capability', 'revenue', 'analytics'],
          assignees: [''],
          description: '$36K annual revenue target through ads and subscriptions',
          businessValue: '$36K annual revenue target through ads and subscriptions. Google AdSense integration and user analytics.',
          childEpics: ['Revenue Integration', 'User Analytics & Testing'],
          completed: false
        }
      ],
      epics: [
        // Completed Epics (Sprint 1 & 2)
        {
          name: 'Interactive Feedback Interface',
          parentCapability: 'User Feedback Intelligence',
          status: 'Done',
          sprint: 'N/A',
          size: 'L',
          priority: 'High',
          labels: ['type: epic', 'feedback', 'frontend'],
          assignees: [''],
          storyPoints: 13,
          description: 'User-facing feedback collection interface with star ratings and category selection',
          childStories: ['Star Rating Feedback', 'Feedback Categories'],
          completed: true
        },
        {
          name: 'Feedback Data Pipeline',
          parentCapability: 'User Feedback Intelligence',
          status: 'Done',
          sprint: 'N/A',
          size: 'M',
          priority: 'High',
          labels: ['type: epic', 'feedback', 'backend', 'database'],
          assignees: [''],
          storyPoints: 8,
          description: 'Backend systems for feedback processing and storage',
          childStories: ['Feedback Submission', 'Feedback Storage'],
          completed: true
        },
        {
          name: 'Interactive Map Infrastructure',
          parentCapability: 'Location-Based POI Discovery',
          status: 'Done',
          sprint: 'N/A',
          size: 'XL',
          priority: 'High',
          labels: ['type: epic', 'maps', 'frontend', 'leaflet'],
          assignees: [''],
          storyPoints: 20,
          description: 'Leaflet-based interactive map system with custom markers and mobile optimization',
          childStories: ['Interactive Map View', 'Weather Location Markers', 'Mobile Touch Optimization'],
          completed: true
        },
        {
          name: 'User Location & Navigation',
          parentCapability: 'Location-Based POI Discovery',
          status: 'Done',
          sprint: 'N/A',
          size: 'L',
          priority: 'High',
          labels: ['type: epic', 'geolocation', 'navigation'],
          assignees: [''],
          storyPoints: 12,
          description: 'Geolocation services and user position tracking with weather information popups',
          childStories: ['Find My Location', 'Weather Information Popups'],
          completed: true
        },
        // Active Epics (Sprint 3)
        {
          name: 'Production Database & POI Infrastructure',
          parentCapability: 'Real-Time Weather Intelligence',
          status: 'Ready',
          sprint: 'Database + Weather API',
          size: 'XL',
          priority: 'Critical',
          labels: ['type: epic', 'database', 'infrastructure'],
          assignees: [''],
          storyPoints: 20,
          description: 'Production-grade database deployment with 100+ Minnesota POI locations',
          childStories: ['Minnesota POI Database Deployment'],
          completed: false
        },
        {
          name: 'Weather API Integration & Optimization',
          parentCapability: 'Real-Time Weather Intelligence',
          status: 'Ready',
          sprint: 'Database + Weather API',
          size: 'XL',
          priority: 'Critical',
          labels: ['type: epic', 'weather-api', 'integration'],
          assignees: [''],
          storyPoints: 20,
          description: 'OpenWeather API integration with rate limiting and Redis caching',
          childStories: ['OpenWeather API Connection & Rate Limiting', 'Redis Caching Implementation for Weather Data'],
          completed: false
        },
        // Future Epics (Sprint 4)
        {
          name: 'Revenue Integration',
          parentCapability: 'Revenue Generation',
          status: 'Ready',
          sprint: 'Revenue + Launch',
          size: 'XL',
          priority: 'Critical',
          labels: ['type: epic', 'adsense', 'revenue'],
          assignees: [''],
          storyPoints: 20,
          description: 'Google AdSense integration for $36K annual revenue target',
          childStories: ['Google AdSense Integration'],
          completed: false
        },
        {
          name: 'User Analytics & Testing',
          parentCapability: 'Revenue Generation',
          status: 'Ready',
          sprint: 'Revenue + Launch',
          size: 'XL',
          priority: 'High',
          labels: ['type: epic', 'analytics', 'testing', 'ga4'],
          assignees: [''],
          storyPoints: 20,
          description: 'Google Analytics 4 integration and user testing framework',
          childStories: ['Google Analytics 4 Integration', 'User Testing Protocols'],
          completed: false
        }
      ],
      stories: [
        // Sprint 1 Stories (Completed)
        {
          name: 'Star Rating Feedback',
          parentEpic: 'Interactive Feedback Interface',
          status: 'Done',
          sprint: 'N/A',
          size: 'S',
          priority: 'High',
          labels: ['type: story', 'feedback', 'ratings', 'frontend'],
          assignees: [''],
          storyPoints: 5,
          description: 'As a website visitor, I want to rate my experience with stars so that I can quickly provide feedback quality assessment',
          fileReference: 'apps/web/src/components/FeedbackFab.tsx (handleSubmit function)',
          completed: true
        },
        {
          name: 'Feedback Categories',
          parentEpic: 'Interactive Feedback Interface',
          status: 'Done',
          sprint: 'N/A',
          size: 'XS',
          priority: 'Medium',
          labels: ['type: story', 'feedback', 'categories', 'frontend'],
          assignees: [''],
          storyPoints: 3,
          description: 'As a user, I want to select feedback categories so that I can provide more specific and actionable feedback',
          fileReference: 'apps/web/src/components/FeedbackFab.tsx (dialog JSX structure)',
          completed: true
        },
        {
          name: 'Feedback Submission',
          parentEpic: 'Feedback Data Pipeline',
          status: 'Done',
          sprint: 'N/A',
          size: 'S',
          priority: 'High',
          labels: ['type: story', 'backend', 'api', 'feedback'],
          assignees: [''],
          storyPoints: 5,
          description: 'API endpoint to receive and process feedback submissions',
          fileReference: 'apps/web/api/feedback.js',
          completed: true
        },
        {
          name: 'Feedback Storage',
          parentEpic: 'Feedback Data Pipeline',
          status: 'Done',
          sprint: 'N/A',
          size: 'XS',
          priority: 'Medium',
          labels: ['type: story', 'database', 'schema', 'feedback'],
          assignees: [''],
          storyPoints: 3,
          description: 'Database schema and storage for user feedback',
          fileReference: 'apps/api/sql/init.sql (lines 3-35)',
          completed: true
        },
        // Sprint 2 Stories (Completed)
        {
          name: 'Interactive Map View',
          parentEpic: 'Interactive Map Infrastructure',
          status: 'Done',
          sprint: 'N/A',
          size: 'M',
          priority: 'High',
          labels: ['type: story', 'maps', 'leaflet', 'frontend'],
          assignees: [''],
          storyPoints: 8,
          description: 'As a user, I want to see an interactive map so that I can explore weather locations visually',
          fileReference: 'apps/web/src/App.tsx (MapComponent definition)',
          completed: true
        },
        {
          name: 'Weather Location Markers',
          parentEpic: 'Interactive Map Infrastructure',
          status: 'Done',
          sprint: 'N/A',
          size: 'S',
          priority: 'High',
          labels: ['type: story', 'maps', 'markers', 'weather'],
          assignees: [''],
          storyPoints: 5,
          description: 'As a user, I want to see weather locations as markers so that I can identify points of interest',
          fileReference: 'apps/web/src/App.tsx (map initialization logic)',
          completed: true
        },
        {
          name: 'Mobile Touch Optimization',
          parentEpic: 'Interactive Map Infrastructure',
          status: 'Done',
          sprint: 'N/A',
          size: 'M',
          priority: 'Medium',
          labels: ['type: story', 'mobile', 'touch', 'responsive'],
          assignees: [''],
          storyPoints: 7,
          description: 'As a mobile user, I want touch-optimized map interactions so that I can use the app effectively on my phone',
          fileReference: 'apps/web/src/App.tsx (mobile touch handling)',
          completed: true
        },
        {
          name: 'Find My Location',
          parentEpic: 'User Location & Navigation',
          status: 'Done',
          sprint: 'N/A',
          size: 'M',
          priority: 'High',
          labels: ['type: story', 'geolocation', 'location'],
          assignees: [''],
          storyPoints: 8,
          description: 'As a user, I want to see my current location so that I can find nearby weather information',
          fileReference: 'apps/web/src/App.tsx (initializeLocation function)',
          completed: true
        },
        {
          name: 'Weather Information Popups',
          parentEpic: 'User Location & Navigation',
          status: 'Done',
          sprint: 'N/A',
          size: 'XS',
          priority: 'Medium',
          labels: ['type: story', 'weather', 'popups', 'frontend'],
          assignees: [''],
          storyPoints: 4,
          description: 'As a user, I want to click markers to see weather details so that I can get specific location information',
          fileReference: 'apps/web/src/hooks/useWeatherLocations.ts',
          completed: true
        },
        // Sprint 3 Stories (Active)
        {
          name: 'Minnesota POI Database Deployment',
          parentEpic: 'Production Database & POI Infrastructure',
          status: 'Ready',
          sprint: 'Database + Weather API',
          size: 'L',
          priority: 'Critical',
          labels: ['type: story', 'database', 'poi-data', 'minnesota'],
          assignees: [''],
          storyPoints: 13,
          description: 'Deploy production database with 100+ Minnesota outdoor recreation locations',
          fileReference: 'To be created: database schema and migration files',
          completed: false
        },
        {
          name: 'OpenWeather API Connection & Rate Limiting',
          parentEpic: 'Weather API Integration & Optimization',
          status: 'Ready',
          sprint: 'Database + Weather API',
          size: 'L',
          priority: 'Critical',
          labels: ['type: story', 'weather-api', 'openweather', 'rate-limiting'],
          assignees: [''],
          storyPoints: 13,
          description: 'Integrate OpenWeather API with rate limiting and caching',
          fileReference: 'To be created: weather API service integration',
          completed: false
        },
        {
          name: 'Redis Caching Implementation for Weather Data',
          parentEpic: 'Weather API Integration & Optimization',
          status: 'Ready',
          sprint: 'Database + Weather API',
          size: 'M',
          priority: 'High',
          labels: ['type: story', 'caching', 'redis', 'performance'],
          assignees: [''],
          storyPoints: 8,
          description: 'Implement Redis caching for weather API responses',
          fileReference: 'To be created: apps/web/services/cacheService.ts',
          completed: false
        },
        // Sprint 4 Stories (Future)
        {
          name: 'Google AdSense Integration',
          parentEpic: 'Revenue Integration',
          status: 'Ready',
          sprint: 'Revenue + Launch',
          size: 'L',
          priority: 'Critical',
          labels: ['type: story', 'adsense', 'revenue', 'monetization'],
          assignees: [''],
          storyPoints: 13,
          description: 'Implement Google AdSense for $36K annual revenue target',
          fileReference: 'To be created: ad integration components',
          completed: false
        },
        {
          name: 'Google Analytics 4 Integration',
          parentEpic: 'User Analytics & Testing',
          status: 'Ready',
          sprint: 'Revenue + Launch',
          size: 'M',
          priority: 'High',
          labels: ['type: story', 'analytics', 'ga4', 'tracking'],
          assignees: [''],
          storyPoints: 8,
          description: 'Implement comprehensive user analytics and conversion tracking',
          fileReference: 'To be created: analytics tracking integration',
          completed: false
        },
        {
          name: 'User Testing Protocols',
          parentEpic: 'User Analytics & Testing',
          status: 'Ready',
          sprint: 'Revenue + Launch',
          size: 'M',
          priority: 'Medium',
          labels: ['type: story', 'testing', 'validation', 'user-research'],
          assignees: [''],
          storyPoints: 8,
          description: 'Implement user testing framework for launch validation',
          fileReference: 'To be created: user testing framework',
          completed: false
        }
      ]
    };
  }

  // Initialize GitHub Project v2 connection
  async initializeProject() {
    console.log('🔧 Initializing GitHub Project connection...\n');

    try {
      // Get project ID using GraphQL
      const projectQuery = `
        query($owner: String!, $number: Int!) {
          organization(login: $owner) {
            projectV2(number: $number) {
              id
              fields(first: 20) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                  }
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options {
                      id
                      name
                    }
                  }
                  ... on ProjectV2IterationField {
                    id
                    name
                    configuration {
                      iterations {
                        id
                        title
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const projectData = await octokit.graphql(projectQuery, {
        owner: this.owner,
        number: this.projectNumber
      });

      this.projectId = projectData.organization.projectV2.id;

      // Map field names to IDs
      const fields = projectData.organization.projectV2.fields.nodes;
      for (const field of fields) {
        this.projectFieldIds[field.name] = {
          id: field.id,
          options: field.options || field.configuration?.iterations || []
        };
      }

      console.log(`  ✅ Project ID: ${this.projectId}`);
      console.log(`  ✅ Found ${fields.length} project fields\n`);

    } catch (error) {
      console.error('❌ Failed to initialize project:', error.message);
      throw error;
    }
  }

  // Add issue to project and set field values
  async addIssueToProject(issue, workItem) {
    try {
      // Add issue to project
      const addMutation = `
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: {
            projectId: $projectId,
            contentId: $contentId
          }) {
            item {
              id
            }
          }
        }
      `;

      const addResult = await octokit.graphql(addMutation, {
        projectId: this.projectId,
        contentId: issue.node_id
      });

      const itemId = addResult.addProjectV2ItemById.item.id;

      // Note: Using GitHub native labels (type: story, type: epic, type: capability)
      // instead of custom "Work Item Type" field to avoid confusion

      // Set Status field
      if (this.projectFieldIds['Status']) {
        const statusOption = this.projectFieldIds['Status'].options.find(
          opt => opt.name === workItem.status
        );
        if (statusOption) {
          await this.setProjectField(itemId, 'Status', statusOption.id);
        }
      }

      // Set Size field
      if (this.projectFieldIds['Size']) {
        const sizeOption = this.projectFieldIds['Size'].options.find(
          opt => opt.name === workItem.size
        );
        if (sizeOption) {
          await this.setProjectField(itemId, 'Size', sizeOption.id);
        }
      }

      // Set Sprint field (iteration field)
      if (this.projectFieldIds['Sprint'] && workItem.sprint !== 'N/A') {
        const sprintIterations = this.projectFieldIds['Sprint'].options;
        const sprintOption = sprintIterations.find(
          iteration => iteration.title && iteration.title.includes(workItem.sprint)
        );
        if (sprintOption) {
          await this.setProjectField(itemId, 'Sprint', sprintOption.id);
        }
      }

      console.log(`    📋 Added to project with fields configured`);

    } catch (error) {
      console.log(`    ❌ Failed to add to project: ${error.message}`);
    }
  }

  // Set a specific project field value
  async setProjectField(itemId, fieldName, optionId) {
    try {
      const fieldId = this.projectFieldIds[fieldName].id;

      let updateMutation;
      let variables;

      if (fieldName === 'Sprint') {
        // Iteration field uses iterationId
        updateMutation = `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $iterationId: String) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $projectId
              itemId: $itemId
              fieldId: $fieldId
              value: { iterationId: $iterationId }
            }) {
              projectV2Item {
                id
              }
            }
          }
        `;

        variables = {
          projectId: this.projectId,
          itemId: itemId,
          fieldId: fieldId,
          iterationId: optionId
        };
      } else {
        // Single select field uses singleSelectOptionId
        updateMutation = `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $projectId
              itemId: $itemId
              fieldId: $fieldId
              value: { singleSelectOptionId: $optionId }
            }) {
              projectV2Item {
                id
              }
            }
          }
        `;

        variables = {
          projectId: this.projectId,
          itemId: itemId,
          fieldId: fieldId,
          optionId: optionId
        };
      }

      await octokit.graphql(updateMutation, variables);
      console.log(`      ✅ Set ${fieldName}`);

    } catch (error) {
      console.log(`      ⚠️  Failed to set ${fieldName}: ${error.message}`);
    }
  }

  async importWorkItems() {
    console.log('🚀 IMPORTING MVP WORK ITEMS TO GITHUB');
    console.log('===================================\n');
    console.log(`📦 Repository: ${this.owner}/${this.repo}`);
    console.log(`🎯 Project: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}\n`);

    // Initialize project connection
    await this.initializeProject();

    const workItems = this.getMVPWorkItems();

    try {
      console.log('📊 **IMPORT PLAN**:');
      console.log(`  🌟 Capabilities: ${workItems.capabilities.length}`);
      console.log(`  📦 Epics: ${workItems.epics.length}`);
      console.log(`  👤 Stories: ${workItems.stories.length}\n`);

      // Step 1: Create Capabilities
      console.log('🌟 Creating Capabilities...\n');
      for (const capability of workItems.capabilities) {
        await this.createCapability(capability);
      }

      // Step 2: Create Epics
      console.log('\n📦 Creating Epics...\n');
      for (const epic of workItems.epics) {
        await this.createEpic(epic);
      }

      // Step 3: Create Stories
      console.log('\n👤 Creating Stories...\n');
      for (const story of workItems.stories) {
        await this.createStory(story);
      }

      // Step 4: Generate summary
      await this.generateImportSummary();

    } catch (error) {
      console.error('❌ Error importing work items:', error.message);
    }
  }

  async createCapability(capability) {
    const title = `Capability: ${capability.name}`;
    const body = this.generateCapabilityBody(capability);

    try {
      const issue = await octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: title,
        body: body,
        labels: capability.labels,
        assignees: capability.assignees.filter(a => a) // Remove empty strings
      });

      console.log(`  ✅ Created: ${title} (#${issue.data.number})`);
      this.createdIssues.push(issue.data);
      this.issueMap.set(capability.name, issue.data.number);

      // Add to project with field values
      await this.addIssueToProject(issue.data, capability);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.log(`  ❌ Failed to create ${title}: ${error.message}`);
    }
  }

  async createEpic(epic) {
    const title = `Epic: ${epic.name}`;
    const body = this.generateEpicBody(epic);

    try {
      const issue = await octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: title,
        body: body,
        labels: epic.labels,
        assignees: epic.assignees.filter(a => a)
      });

      console.log(`  ✅ Created: ${title} (#${issue.data.number})`);
      this.createdIssues.push(issue.data);
      this.issueMap.set(epic.name, issue.data.number);

      // Add to project with field values
      await this.addIssueToProject(issue.data, epic);

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.log(`  ❌ Failed to create ${title}: ${error.message}`);
    }
  }

  async createStory(story) {
    const title = `Story: ${story.name}`;
    const body = this.generateStoryBody(story);

    try {
      const issue = await octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: title,
        body: body,
        labels: story.labels,
        assignees: story.assignees.filter(a => a)
      });

      console.log(`  ✅ Created: ${title} (#${issue.data.number})`);
      this.createdIssues.push(issue.data);
      this.issueMap.set(story.name, issue.data.number);

      // Add to project with field values
      await this.addIssueToProject(issue.data, story);

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.log(`  ❌ Failed to create ${title}: ${error.message}`);
    }
  }

  generateCapabilityBody(capability) {
    const parentIssueNumber = capability.parentCapability ?
      this.issueMap.get(capability.parentCapability) || 'TBD' : 'N/A (Top-level capability)';

    return `## 🌟 Capability: ${capability.name}

### Capability Information
- **Status:** ${capability.status}
- **Sprint:** ${capability.sprint}
- **Size:** ${capability.size}
- **Priority:** ${capability.priority}
- **Relationships:** ${parentIssueNumber}
- **Assignees:** ${capability.assignees.join(', ') || 'Unassigned'}

### Business Value
${capability.businessValue}

### Description
${capability.description}

### Child Epics
${capability.childEpics.map(epic => {
  const epicNumber = this.issueMap.get(epic) || 'TBD';
  return `- [ ] Epic: ${epic} (#${epicNumber})`;
}).join('\n') || 'No child epics defined'}

### Success Metrics
- [ ] All child Epics completed successfully
- [ ] Business value demonstrated and measured
- [ ] Performance requirements met
- [ ] User acceptance criteria satisfied

### Implementation Status
${capability.completed ? '✅ **COMPLETED** - This capability has been successfully delivered' : '🔄 **IN PROGRESS** - This capability is actively being developed'}

---
*Generated from MVP-WBS-STRUCTURED.md via automated import*`;
  }

  generateEpicBody(epic) {
    const parentCapabilityNumber = this.issueMap.get(epic.parentCapability) || 'TBD';

    return `## 📦 Epic: ${epic.name}

### Epic Information
- **Parent Capability:** #${parentCapabilityNumber} (${epic.parentCapability})
- **Status:** ${epic.status}
- **Sprint:** ${epic.sprint}
- **Size:** ${epic.size}
- **Priority:** ${epic.priority}
- **Story Points:** ${epic.storyPoints}
- **Assignees:** ${epic.assignees.join(', ') || 'Unassigned'}

### Epic Description
${epic.description}

### Child Stories
${epic.childStories.map(story => {
  const storyNumber = this.issueMap.get(story) || 'TBD';
  return `- [ ] Story: ${story} (#${storyNumber})`;
}).join('\n') || 'No child stories defined'}

### Success Criteria
- [ ] All child User Stories completed
- [ ] Epic functionality validated and tested
- [ ] Performance requirements met
- [ ] Code reviewed and approved
- [ ] Documentation updated

### Acceptance Criteria
- [ ] Implementation meets all story acceptance criteria
- [ ] Integration testing passed
- [ ] Epic delivers promised business value
- [ ] No critical bugs or performance issues

### Implementation Status
${epic.completed ? '✅ **COMPLETED** - This epic has been successfully delivered' : '🔄 **IN PROGRESS** - This epic is actively being developed'}

---
*Generated from MVP-WBS-STRUCTURED.md via automated import*`;
  }

  generateStoryBody(story) {
    const parentEpicNumber = this.issueMap.get(story.parentEpic) || 'TBD';

    return `## 👤 Story: ${story.name}

### Story Information
- **Parent Epic:** #${parentEpicNumber} (${story.parentEpic})
- **Status:** ${story.status}
- **Sprint:** ${story.sprint}
- **Size:** ${story.size}
- **Priority:** ${story.priority}
- **Story Points:** ${story.storyPoints}
- **Assignees:** ${story.assignees.join(', ') || 'Unassigned'}

### User Story
${story.description}

### File References
${story.fileReference || 'No file references specified'}

### Acceptance Criteria
- [ ] User story functionality implemented
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated if needed

### Definition of Done
- [ ] Implementation complete and tested
- [ ] User acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Performance requirements met
- [ ] Integration testing passed

### Implementation Status
${story.completed ? '✅ **COMPLETED** - This story has been successfully delivered' : '🔄 **READY** - This story is ready for development'}

---
*Generated from MVP-WBS-STRUCTURED.md via automated import*`;
  }

  async generateImportSummary() {
    console.log('\n📊 **IMPORT SUMMARY**');
    console.log('====================\n');

    console.log(`✅ Successfully created: ${this.createdIssues.length} issues`);

    const capabilities = this.createdIssues.filter(issue => issue.title.startsWith('Capability:'));
    const epics = this.createdIssues.filter(issue => issue.title.startsWith('Epic:'));
    const stories = this.createdIssues.filter(issue => issue.title.startsWith('Story:'));

    console.log(`  🌟 Capabilities: ${capabilities.length}`);
    console.log(`  📦 Epics: ${epics.length}`);
    console.log(`  👤 Stories: ${stories.length}`);

    console.log('\n🔗 **QUICK LINKS**:');
    console.log(`  📋 All Issues: https://github.com/${this.owner}/${this.repo}/issues`);
    console.log(`  🎯 Project Board: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}`);
    console.log(`  🏷️  Labels: https://github.com/${this.owner}/${this.repo}/labels`);

    console.log('\n🎯 **NEXT STEPS**:');
    console.log('1. Visit the Project Board to see all imported work items');
    console.log('2. Organize issues into project board columns by status');
    console.log('3. Set up project field values (Sprint, Size, Priority)');
    console.log('4. Create sub-issues for detailed implementation tasks');
    console.log('5. Begin development on Ready items in current sprint');

    console.log('\n✅ MVP Work Items Import Complete!');
  }
}

// CLI Interface
async function main() {
  const importer = new MVPWorkItemImporter();
  await importer.importWorkItems();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MVPWorkItemImporter };
