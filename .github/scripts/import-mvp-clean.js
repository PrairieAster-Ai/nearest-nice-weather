#!/usr/bin/env node

/**
 * Clean MVP Work Items Import to GitHub Issues with Project Integration
 * This script properly adds issues to GitHub Projects v2 with field configuration
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-MVPImporter/2.0.0',
});

class MVPWorkItemImporter {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
    this.projectId = null;
    this.projectFieldIds = {};
    this.createdIssues = [];
    this.issueMap = new Map();
  }

  async initializeProject() {
    console.log('🔧 Initializing GitHub Project connection...\n');
    
    try {
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
      
      // Map field names to IDs and options
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

      // Set Status field
      if (this.projectFieldIds['Status'] && workItem.status) {
        const statusOption = this.projectFieldIds['Status'].options.find(
          opt => opt.name === workItem.status
        );
        if (statusOption) {
          await this.setProjectField(itemId, 'Status', statusOption.id);
        }
      }

      // Set Size field  
      if (this.projectFieldIds['Size'] && workItem.size) {
        const sizeOption = this.projectFieldIds['Size'].options.find(
          opt => opt.name === workItem.size
        );
        if (sizeOption) {
          await this.setProjectField(itemId, 'Size', sizeOption.id);
        }
      }

      // Set Sprint field (iteration field)
      if (this.projectFieldIds['Sprint'] && workItem.sprint && workItem.sprint !== 'N/A') {
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

  async setProjectField(itemId, fieldName, optionId) {
    try {
      const fieldId = this.projectFieldIds[fieldName].id;
      
      let updateMutation;
      let variables;
      
      if (fieldName === 'Sprint') {
        // Iteration field
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
        // Single select field
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

  // Test with just one capability first
  async testSingleCapability() {
    console.log('🧪 TESTING SINGLE CAPABILITY IMPORT\n');
    
    await this.initializeProject();
    
    const testCapability = {
      name: 'Real-Time Weather Intelligence',
      status: 'Ready',
      sprint: 'Database + Weather API',
      size: 'XL',
      labels: ['type: capability', 'database', 'weather-api'],
      assignees: [],
      description: 'Multi-source weather aggregation for accuracy and reliable weather data platform credibility',
      businessValue: 'Multi-source weather aggregation for accuracy. Reliable weather data builds platform credibility.',
    };

    try {
      const title = `Capability: ${testCapability.name}`;
      const body = `## 🌟 Capability: ${testCapability.name}

### Business Value
${testCapability.businessValue}

### Description  
${testCapability.description}

### Configuration
- **Status:** ${testCapability.status}
- **Sprint:** ${testCapability.sprint}
- **Size:** ${testCapability.size}

---
*Generated from MVP import test*`;

      const issue = await octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: title,
        body: body,
        labels: testCapability.labels
      });
      
      console.log(`✅ Created: ${title} (#${issue.data.number})`);
      
      // Add to project with field values
      await this.addIssueToProject(issue.data, testCapability);
      
      console.log('\n🎉 Test successful!');
      console.log(`🔗 View in project: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}`);
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Run test
async function main() {
  const importer = new MVPWorkItemImporter();
  await importer.testSingleCapability();
}

main().catch(console.error);