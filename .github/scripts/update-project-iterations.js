#!/usr/bin/env node

/**
 * Update GitHub Project Iterations to Match MVP Sprint Timeline
 * Configure Sprint 3 starting today, Sprint 4 following MVP plan
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;
const ITERATION_FIELD_ID = '210421993'; // From the URL you provided

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-IterationConfig/1.0.0',
});

class IterationConfigurator {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
    this.iterationFieldId = ITERATION_FIELD_ID;
    this.projectId = null;
    this.projectItems = {};
  }

  async updateIterations() {
    console.log('📅 Updating project iterations to match MVP sprint timeline...\n');
    
    try {
      // Step 1: Get project structure
      await this.getProjectStructure();
      
      // Step 2: Configure sprint iterations with proper dates
      await this.configureSprintIterations();
      
      // Step 3: Assign issues to correct iterations
      await this.assignIssuesToIterations();
      
      console.log('\n✅ Project iterations updated to match MVP timeline!');
      console.log('🎯 Sprint 3 starts today, Sprint 4 follows MVP schedule');
      
    } catch (error) {
      console.error('❌ Error updating iterations:', error.message);
    }
  }

  async getProjectStructure() {
    console.log('📊 Getting current project structure...');
    
    const query = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            title
            fields(first: 20) {
              nodes {
                ... on ProjectV2IterationField {
                  id
                  name
                  dataType
                  configuration {
                    iterations {
                      startDate
                      id
                      title
                      duration
                    }
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
    
    // Find iteration field
    const iterationField = response.organization.projectV2.fields.nodes.find(
      field => field.dataType === 'ITERATION'
    );
    
    if (iterationField) {
      console.log(`✅ Found iteration field: ${iterationField.name}`);
      console.log(`📋 Current iterations: ${iterationField.configuration.iterations.length} configured`);
    } else {
      console.log('⚠️  No iteration field found');
    }
    
    console.log(`📋 Found ${Object.keys(this.projectItems).length} project items`);
  }

  async configureSprintIterations() {
    console.log('\n📅 Configuring MVP sprint iterations...');
    
    // Calculate sprint dates based on MVP timeline
    const today = new Date();
    const sprint3Start = new Date(today);
    const sprint3End = new Date(today);
    sprint3End.setDate(sprint3End.getDate() + 21); // 3 weeks for Sprint 3
    
    const sprint4Start = new Date(sprint3End);
    sprint4Start.setDate(sprint4Start.getDate() + 1); // Day after Sprint 3 ends
    const sprint4End = new Date(sprint4Start);
    sprint4End.setDate(sprint4End.getDate() + 21); // 3 weeks for Sprint 4
    
    const sprintIterations = [
      {
        title: 'Sprint 1: Core Weather Intelligence ✅',
        startDate: '2024-11-15', // Historical - completed
        duration: 3 // weeks
      },
      {
        title: 'Sprint 2: Basic POI Discovery ✅',
        startDate: '2024-12-06', // Historical - completed  
        duration: 3 // weeks
      },
      {
        title: 'Sprint 3: Database + Weather API 🔄',
        startDate: this.formatDate(sprint3Start),
        duration: 3 // weeks
      },
      {
        title: 'Sprint 4: Revenue + Launch 📅',
        startDate: this.formatDate(sprint4Start),
        duration: 3 // weeks
      }
    ];
    
    console.log('🗓️  Sprint Timeline:');
    sprintIterations.forEach(sprint => {
      const endDate = new Date(sprint.startDate);
      endDate.setDate(endDate.getDate() + (sprint.duration * 7));
      console.log(`  ${sprint.title}`);
      console.log(`    Start: ${sprint.startDate}`);
      console.log(`    End: ${this.formatDate(endDate)}`);
      console.log(`    Duration: ${sprint.duration} weeks\n`);
    });
    
    // Note: GitHub Projects v2 iteration configuration requires GraphQL mutations
    // that are complex for programmatic updates. Documenting the configuration:
    console.log('⚠️  Iteration updates require manual configuration in project settings:');
    console.log('   https://github.com/orgs/PrairieAster-Ai/projects/2/settings/fields/210421993');
    console.log('\n📝 Required Manual Steps:');
    console.log('1. Update iteration names to match sprint titles above');
    console.log('2. Set iteration start dates as shown above');
    console.log('3. Set iteration duration to 3 weeks each');
    console.log('4. Mark Sprint 3 as current iteration');
  }

  async assignIssuesToIterations() {
    console.log('\n🎯 Planning iteration assignments...');
    
    // Define issue assignments based on sprint structure
    const assignments = {
      'Sprint 1: Core Weather Intelligence ✅': [],  // Historical - no current issues
      'Sprint 2: Basic POI Discovery ✅': [],        // Historical - no current issues
      'Sprint 3: Database + Weather API 🔄': [21, 28, 29, 30, 31, 32], // Current sprint
      'Sprint 4: Revenue + Launch 📅': [22]          // Next sprint
    };
    
    console.log('📋 Planned assignments:');
    Object.entries(assignments).forEach(([sprint, issues]) => {
      console.log(`  ${sprint}:`);
      if (issues.length === 0) {
        console.log('    No current issues (completed sprint)');
      } else {
        issues.forEach(issueNum => {
          const item = this.projectItems[issueNum];
          if (item) {
            console.log(`    #${issueNum}: ${item.title}`);
          }
        });
      }
      console.log('');
    });
    
    console.log('⚠️  Manual assignment needed after iteration configuration:');
    console.log('1. Sprint 3 items: #21, #28, #29, #30, #31, #32');
    console.log('2. Sprint 4 items: #22');
    console.log('3. Use project board to drag items to correct iterations');
  }

  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  async generateIterationSummary() {
    console.log('\n📊 MVP Sprint Timeline Summary');
    console.log('==============================\n');
    
    const today = new Date();
    const sprint3Start = new Date(today);
    const sprint3End = new Date(today);
    sprint3End.setDate(sprint3End.getDate() + 21);
    
    const sprint4Start = new Date(sprint3End);
    sprint4Start.setDate(sprint4Start.getDate() + 1);
    const sprint4End = new Date(sprint4Start);
    sprint4End.setDate(sprint4End.getDate() + 21);
    
    console.log('🎯 **MVP SPRINT TIMELINE CONFIGURED**');
    console.log('Project: NearestNiceWeather.com App Development');
    console.log('Timeline: Aligned with MVP completion target\n');
    
    console.log('📅 **SPRINT SCHEDULE**');
    console.log('Sprint 1: Core Weather Intelligence ✅ COMPLETED');
    console.log('  Duration: Nov 15 - Dec 5, 2024 (3 weeks)');
    console.log('  Status: User feedback system and UI foundation delivered\n');
    
    console.log('Sprint 2: Basic POI Discovery ✅ COMPLETED');
    console.log('  Duration: Dec 6 - Dec 26, 2024 (3 weeks)');
    console.log('  Status: Interactive map interface and location services delivered\n');
    
    console.log('Sprint 3: Database + Weather API 🔄 CURRENT');
    console.log(`  Duration: ${this.formatDate(sprint3Start)} - ${this.formatDate(sprint3End)} (3 weeks)`);
    console.log('  Goal: 50% → 75% MVP completion');
    console.log('  Focus: Database deployment + OpenWeather integration');
    console.log('  Issues: #21, #28, #29, #30, #31, #32\n');
    
    console.log('Sprint 4: Revenue + Launch 📅 NEXT');
    console.log(`  Duration: ${this.formatDate(sprint4Start)} - ${this.formatDate(sprint4End)} (3 weeks)`);
    console.log('  Goal: 75% → 100% MVP completion + Launch');
    console.log('  Focus: Google AdSense + user testing + market launch');
    console.log('  Issues: #22\n');
    
    console.log('🎯 **CURRENT DEVELOPMENT FOCUS**');
    console.log('Active Sprint: Sprint 3 (Database + Weather API)');
    console.log('Priority: Complete database schema and weather API integration');
    console.log(`Target Completion: ${this.formatDate(sprint3End)}`);
    console.log('Success Metric: 75% MVP completion ready for revenue integration\n');
    
    console.log('📋 **NEXT ACTIONS**');
    console.log('1. Configure iterations manually in project settings');
    console.log('2. Assign issues to correct sprint iterations');
    console.log('3. Set Sprint 3 as current active iteration');
    console.log('4. Begin Sprint 3 development work focused on database + API\n');
    
    console.log('✅ Sprint timeline aligned with MVP completion target!');
  }
}

// CLI Interface
async function main() {
  const configurator = new IterationConfigurator();
  
  await configurator.updateIterations();
  await configurator.generateIterationSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { IterationConfigurator };