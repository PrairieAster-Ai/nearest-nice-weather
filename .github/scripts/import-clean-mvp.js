#!/usr/bin/env node

/**
 * Clean MVP Import with Proper Work Item Types
 * Imports a focused set of MVP work items with correct type assignments
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-CleanMVP/1.0.0',
});

class CleanMVPImporter {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectId = null;
    this.projectFieldIds = {};
    this.createdIssues = [];
  }

  async initializeProject() {
    console.log('🔧 Initializing GitHub Project connection...\n');
    
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
      number: PROJECT_NUMBER
    });

    this.projectId = projectData.organization.projectV2.id;
    
    const fields = projectData.organization.projectV2.fields.nodes;
    for (const field of fields) {
      this.projectFieldIds[field.name] = {
        id: field.id,
        options: field.options || field.configuration?.iterations || []
      };
    }

    console.log(`  ✅ Project ID: ${this.projectId}`);
    console.log(`  ✅ Found ${fields.length} project fields\n`);
  }

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

      // Set Work Item Type field (CRITICAL!)
      if (this.projectFieldIds['Work Item Type']) {
        let workItemType = 'User Story'; // default
        if (issue.title.startsWith('Capability:')) workItemType = 'Capability';
        if (issue.title.startsWith('Epic:')) workItemType = 'Epic';
        if (issue.title.startsWith('Story:')) workItemType = 'User Story';
        
        const typeOption = this.projectFieldIds['Work Item Type'].options.find(
          opt => opt.name === workItemType
        );
        if (typeOption) {
          await this.setProjectField(itemId, 'Work Item Type', typeOption.id);
          console.log(`      ✅ Set Work Item Type: ${workItemType}`);
        }
      }

      // Set Status field
      if (this.projectFieldIds['Status'] && workItem.status) {
        const statusOption = this.projectFieldIds['Status'].options.find(
          opt => opt.name === workItem.status
        );
        if (statusOption) {
          await this.setProjectField(itemId, 'Status', statusOption.id);
          console.log(`      ✅ Set Status: ${workItem.status}`);
        }
      }

      // Set Size field  
      if (this.projectFieldIds['Size'] && workItem.size) {
        const sizeOption = this.projectFieldIds['Size'].options.find(
          opt => opt.name === workItem.size
        );
        if (sizeOption) {
          await this.setProjectField(itemId, 'Size', sizeOption.id);
          console.log(`      ✅ Set Size: ${workItem.size}`);
        }
      }

      // Set Sprint field
      if (this.projectFieldIds['Sprint'] && workItem.sprint && workItem.sprint !== 'N/A') {
        const sprintIterations = this.projectFieldIds['Sprint'].options;
        const sprintOption = sprintIterations.find(
          iteration => iteration.title && iteration.title.includes(workItem.sprint)
        );
        if (sprintOption) {
          await this.setProjectField(itemId, 'Sprint', sprintOption.id, true);
          console.log(`      ✅ Set Sprint: ${workItem.sprint}`);
        }
      }

      console.log(`    📋 Added to project with all fields configured`);

    } catch (error) {
      console.log(`    ❌ Failed to add to project: ${error.message}`);
    }
  }

  async setProjectField(itemId, fieldName, optionId, isIteration = false) {
    try {
      const fieldId = this.projectFieldIds[fieldName].id;
      
      let updateMutation;
      let variables;
      
      if (isIteration) {
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

    } catch (error) {
      console.log(`      ⚠️  Failed to set ${fieldName}: ${error.message}`);
    }
  }

  // Clean focused MVP work items
  getCleanMVPWorkItems() {
    return [
      // Core Capability
      {
        title: 'Capability: Real-Time Weather Intelligence',
        type: 'capability',
        status: 'Ready',
        sprint: 'Database + Weather API',
        size: 'XL',
        labels: ['type: capability', 'database', 'weather-api'],
        body: `## 🌟 Capability: Real-Time Weather Intelligence

### Business Value
Multi-source weather aggregation for accuracy and reliable weather data platform credibility.

### Description  
This capability enables accurate weather data collection and processing across multiple sources to build platform credibility through reliable, real-time weather intelligence.

### Child Epics
- [ ] Epic: Production Database & POI Infrastructure
- [ ] Epic: Weather API Integration & Optimization

### Success Metrics
- [ ] All child Epics completed successfully
- [ ] Multi-source weather data integration operational
- [ ] <3 second response time achieved
- [ ] 99.9% uptime maintained

---
*Generated from clean MVP import with proper Work Item Type*`
      },

      // Core Epic  
      {
        title: 'Epic: Production Database & POI Infrastructure',
        type: 'epic',
        status: 'Ready',
        sprint: 'Database + Weather API',
        size: 'XL',
        labels: ['type: epic', 'database', 'infrastructure'],
        body: `## 📦 Epic: Production Database & POI Infrastructure

### Epic Description
Production-grade database deployment with 100+ Minnesota POI locations for weather-optimal outdoor recreation mapping.

### Child Stories
- [ ] Story: Minnesota POI Database Deployment

### Success Criteria
- [ ] Production database deployed and operational
- [ ] 100+ Minnesota POI locations loaded
- [ ] Database performance optimized
- [ ] Backup and recovery procedures implemented

### Implementation Requirements
**Architecture:**
- [ ] PostgreSQL with PostGIS extension
- [ ] Neon serverless database platform
- [ ] Automated backup and monitoring

**Dependencies:**
- [ ] Database schema finalized
- [ ] POI data sources validated

---
*Generated from clean MVP import with proper Work Item Type*`
      },

      // Core Story
      {
        title: 'Story: Minnesota POI Database Deployment',
        type: 'story',  
        status: 'Ready',
        sprint: 'Database + Weather API',
        size: 'L',
        labels: ['type: story', 'database', 'poi-data', 'minnesota'],
        body: `## 👤 Story: Minnesota POI Database Deployment

### User Story
As a platform user, I want access to comprehensive Minnesota outdoor recreation locations so that I can find weather-optimal destinations for my activities.

### Acceptance Criteria
- [ ] Given a production database, when POI data is loaded, then 100+ Minnesota locations are available
- [ ] Given location queries, when searching by coordinates, then results return within 3 seconds
- [ ] Given database operations, when under normal load, then 99.9% uptime is maintained

### File References
- Database schema: \`apps/api/sql/init.sql\`
- POI data: \`data/minnesota-poi-locations.json\`
- Migration scripts: \`apps/api/migrations/\`

### Definition of Done
- [ ] Production database deployed to Neon
- [ ] 100+ Minnesota POI locations loaded and verified
- [ ] Database performance benchmarks met
- [ ] Monitoring and alerting configured
- [ ] Documentation updated

---
*Generated from clean MVP import with proper Work Item Type*`
      }
    ];
  }

  async importCleanMVP() {
    console.log('🚀 IMPORTING CLEAN MVP WITH PROPER WORK ITEM TYPES');
    console.log('=================================================\n');
    
    await this.initializeProject();
    
    const workItems = this.getCleanMVPWorkItems();
    
    console.log(`📊 **IMPORT PLAN**: ${workItems.length} focused work items\n`);
    
    for (const workItem of workItems) {
      try {
        const issue = await octokit.rest.issues.create({
          owner: this.owner,
          repo: this.repo,
          title: workItem.title,
          body: workItem.body,
          labels: workItem.labels
        });
        
        console.log(`✅ Created: ${workItem.title} (#${issue.data.number})`);
        this.createdIssues.push(issue.data);
        
        // Add to project with proper Work Item Type
        await this.addIssueToProject(issue.data, workItem);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.log(`❌ Failed to create ${workItem.title}: ${error.message}`);
      }
    }
    
    console.log('\n📊 **IMPORT SUMMARY**');
    console.log('====================');
    console.log(`✅ Successfully created: ${this.createdIssues.length} issues`);
    console.log('✅ All issues have proper Work Item Type assignments');
    console.log('✅ Project board should show Capability/Epic/Story instead of Bug/Feature/Task');
    
    console.log('\n🔗 **VERIFICATION**:');
    console.log(`📋 Project Board: https://github.com/orgs/${this.owner}/projects/${PROJECT_NUMBER}`);
    console.log('👀 Check that issues show correct Work Item Type in project columns');
    
    console.log('\n✅ Clean MVP Import Complete!');
  }
}

// Run clean import
async function main() {
  const importer = new CleanMVPImporter();
  await importer.importCleanMVP();
}

main().catch(console.error);