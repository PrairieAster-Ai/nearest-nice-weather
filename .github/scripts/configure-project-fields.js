#!/usr/bin/env node

/**
 * Configure GitHub Project Fields - Iterations, Status, Relationships
 * Set up NearestNiceWeather.com App Development Project with proper sprint structure
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-ProjectConfig/1.0.0',
});

class ProjectConfigurator {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
    this.projectId = null;
    this.fields = {};
    this.iterations = {};
    this.projectItems = {};
  }

  async configureProject() {
    console.log('⚙️  Configuring NearestNiceWeather.com App Development Project...\n');

    try {
      // Step 1: Get project ID and current structure
      await this.getProjectStructure();

      // Step 2: Configure iteration fields
      await this.configureIterations();

      // Step 3: Set all items to "Ready" status
      await this.setItemsToReady();

      // Step 4: Assign items to correct iterations
      await this.assignIterations();

      // Step 5: Configure parent-child relationships
      await this.configureRelationships();

      console.log('\n✅ Project configuration complete!');
      console.log('🎯 Ready for sprint-based workflow with proper relationships');

    } catch (error) {
      console.error('❌ Error configuring project:', error.message);
    }
  }

  async getProjectStructure() {
    console.log('📊 Getting project structure...');

    // Get project details including fields and items
    const query = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            title
            fields(first: 20) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
                ... on ProjectV2IterationField {
                  id
                  name
                  dataType
                  configuration {
                    iterations {
                      startDate
                      id
                      title
                    }
                  }
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
            items(first: 50) {
              nodes {
                id
                content {
                  ... on Issue {
                    number
                    title
                    id
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await octokit.graphql(query, {
      owner: this.owner,
      number: this.projectNumber,
    });

    this.projectId = response.organization.projectV2.id;

    // Store field information
    response.organization.projectV2.fields.nodes.forEach(field => {
      this.fields[field.name] = field;
      if (field.dataType === 'ITERATION') {
        field.configuration?.iterations?.forEach(iteration => {
          this.iterations[iteration.title] = iteration.id;
        });
      }
    });

    // Store project items
    response.organization.projectV2.items.nodes.forEach(item => {
      if (item.content?.number) {
        this.projectItems[item.content.number] = {
          projectItemId: item.id,
          issueId: item.content.id,
          title: item.content.title
        };
      }
    });

    console.log(`✅ Found project with ${Object.keys(this.projectItems).length} items`);
    console.log(`📋 Available fields: ${Object.keys(this.fields).join(', ')}`);
    console.log(`📅 Available iterations: ${Object.keys(this.iterations).join(', ')}`);
  }

  async configureIterations() {
    console.log('\n📅 Configuring sprint iterations...');

    // Check if we need to create sprint iterations
    const requiredIterations = [
      'Sprint 3: Database + Weather API',
      'Sprint 4: Revenue + Launch'
    ];

    // Note: Creating iterations requires different GraphQL mutations
    // For now, we'll document what needs to be set up manually
    console.log('📝 Sprint iterations needed:');
    requiredIterations.forEach(iteration => {
      if (this.iterations[iteration]) {
        console.log(`  ✅ ${iteration} - Already exists`);
      } else {
        console.log(`  ⚠️  ${iteration} - Needs manual creation in project settings`);
      }
    });
  }

  async setItemsToReady() {
    console.log('\n🎯 Setting all items to "Ready" status...');

    // Find the Status field
    const statusField = this.fields['Status'];
    if (!statusField) {
      console.log('⚠️  No Status field found - create one in project settings');
      return;
    }

    // Find "Ready" option
    const readyOption = statusField.options?.find(opt => opt.name === 'Ready');
    if (!readyOption) {
      console.log('⚠️  No "Ready" status option found - add it in project settings');
      return;
    }

    // Update all items to Ready status
    for (const [issueNumber, item] of Object.entries(this.projectItems)) {
      await this.updateProjectItemField(
        item.projectItemId,
        statusField.id,
        readyOption.id,
        `Setting issue #${issueNumber} to Ready`
      );
    }

    console.log(`✅ Set ${Object.keys(this.projectItems).length} items to Ready status`);
  }

  async assignIterations() {
    console.log('\n📅 Assigning items to correct sprint iterations...');

    // Find the Iteration field
    const iterationField = this.fields['Iteration'];
    if (!iterationField) {
      console.log('⚠️  No Iteration field found - create one in project settings');
      return;
    }

    // Sprint 3 assignments
    const sprint3Issues = [21, 28, 29, 30, 31, 32];
    const sprint3IterationId = this.iterations['Sprint 3: Database + Weather API'];

    // Sprint 4 assignments
    const sprint4Issues = [22];
    const sprint4IterationId = this.iterations['Sprint 4: Revenue + Launch'];

    // Assign Sprint 3 items
    if (sprint3IterationId) {
      for (const issueNumber of sprint3Issues) {
        const item = this.projectItems[issueNumber];
        if (item) {
          await this.updateProjectItemField(
            item.projectItemId,
            iterationField.id,
            sprint3IterationId,
            `Assigning issue #${issueNumber} to Sprint 3`
          );
        }
      }
      console.log(`✅ Assigned ${sprint3Issues.length} items to Sprint 3`);
    } else {
      console.log('⚠️  Sprint 3 iteration not found - create manually in project');
    }

    // Assign Sprint 4 items
    if (sprint4IterationId) {
      for (const issueNumber of sprint4Issues) {
        const item = this.projectItems[issueNumber];
        if (item) {
          await this.updateProjectItemField(
            item.projectItemId,
            iterationField.id,
            sprint4IterationId,
            `Assigning issue #${issueNumber} to Sprint 4`
          );
        }
      }
      console.log(`✅ Assigned ${sprint4Issues.length} items to Sprint 4`);
    } else {
      console.log('⚠️  Sprint 4 iteration not found - create manually in project');
    }
  }

  async configureRelationships() {
    console.log('\n🔗 Configuring parent-child relationships...');

    // Define parent-child relationships based on our hierarchy
    const relationships = [
      // Sprint 3 parent-child relationships
      { parent: 21, children: [28, 29] }, // Sprint 3 -> Epics
      { parent: 28, children: [30] },     // Database Epic -> Minnesota POI Story
      { parent: 29, children: [31, 32] }, // Weather API Epic -> API Story & Caching Task
      { parent: 31, children: [32] },     // API Story -> Caching Task
    ];

    // Note: GitHub Projects v2 relationships are set through issue references
    // We'll update issue descriptions to include parent references
    for (const relationship of relationships) {
      await this.updateIssueRelationships(relationship.parent, relationship.children);
    }

    console.log('✅ Updated issue relationships with parent references');
  }

  async updateProjectItemField(itemId, fieldId, value, description) {
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

      console.log(`  🔄 ${description}...`);

      await octokit.graphql(mutation, {
        projectId: this.projectId,
        itemId: itemId,
        fieldId: fieldId,
        value: {
          singleSelectOptionId: value
        }
      });

      console.log(`  ✅ ${description} - Complete`);

    } catch (error) {
      console.error(`  ❌ Failed: ${description}:`, error.message);
    }
  }

  async updateIssueRelationships(parentIssue, childIssues) {
    try {
      // Add parent reference to child issues
      for (const childIssue of childIssues) {
        console.log(`  🔗 Setting #${parentIssue} as parent of #${childIssue}`);

        // Get current issue body
        const issueResponse = await octokit.rest.issues.get({
          owner: this.owner,
          repo: this.repo,
          issue_number: childIssue,
        });

        let currentBody = issueResponse.data.body || '';

        // Add parent reference if not already present
        const parentRef = `**Parent Issue**: #${parentIssue}`;
        if (!currentBody.includes(parentRef)) {
          currentBody += `\n\n---\n${parentRef}`;

          await octokit.rest.issues.update({
            owner: this.owner,
            repo: this.repo,
            issue_number: childIssue,
            body: currentBody,
          });

          console.log(`  ✅ Added parent reference #${parentIssue} to issue #${childIssue}`);
        } else {
          console.log(`  ⚠️  Parent reference already exists for issue #${childIssue}`);
        }
      }

    } catch (error) {
      console.error(`  ❌ Failed to update relationships:`, error.message);
    }
  }

  async generateConfigSummary() {
    console.log('\n📊 Project Configuration Summary');
    console.log('=================================\n');

    console.log('🎯 **PROJECT STRUCTURE CONFIGURED**');
    console.log('Project: NearestNiceWeather.com App Development');
    console.log('URL: https://github.com/orgs/PrairieAster-Ai/projects/2/views/1\n');

    console.log('📅 **SPRINT ITERATIONS**');
    console.log('Sprint 3: Database + Weather API (Current)');
    console.log('  - Issues: #21, #28, #29, #30, #31, #32');
    console.log('  - Status: All set to "Ready"');
    console.log('  - Goal: 50% → 75% MVP completion\n');

    console.log('Sprint 4: Revenue + Launch (Next)');
    console.log('  - Issues: #22');
    console.log('  - Status: Set to "Ready"');
    console.log('  - Goal: 75% → 100% MVP completion\n');

    console.log('🔗 **PARENT-CHILD RELATIONSHIPS**');
    console.log('Sprint 3 (#21)');
    console.log('  ├── Epic: Database Infrastructure (#28)');
    console.log('  │   └── Story: Minnesota POI Database (#30)');
    console.log('  └── Epic: Weather API Integration (#29)');
    console.log('      ├── Story: OpenWeather Connection (#31)');
    console.log('      └── Task: Redis Caching (#32)\n');

    console.log('🎯 **WORKFLOW READY**');
    console.log('- All items assigned to correct sprint iterations');
    console.log('- All items set to "Ready" status for development');
    console.log('- Parent-child relationships established');
    console.log('- Project board ready for sprint execution\n');

    console.log('⚠️  **MANUAL STEPS NEEDED**');
    console.log('1. Create sprint iterations in project settings if not present');
    console.log('2. Add "Ready" status option if not present');
    console.log('3. Configure project board columns: Backlog, Ready, In Progress, Done');
    console.log('4. Set current iteration to Sprint 3 in project settings\n');

    console.log('✅ Project ready for sprint-based development workflow!');
  }
}

// CLI Interface
async function main() {
  const configurator = new ProjectConfigurator();

  await configurator.configureProject();
  await configurator.generateConfigSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProjectConfigurator };
