#!/usr/bin/env node

/**
 * Inspect GitHub Project Setup - Verify Configuration
 * Compare actual project setup with GITHUB-PROJECT-REFERENCE.md documentation
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
  userAgent: 'NearestNiceWeather-ProjectInspection/1.0.0',
});

class ProjectInspector {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
    this.projectData = {};
    this.issues = [];
    this.discrepancies = [];
  }

  async inspectProject() {
    console.log('🔍 Inspecting GitHub Project Configuration...\n');
    console.log(`📊 Project: ${this.owner}/${this.repo} - Project #${this.projectNumber}`);
    console.log(`🔗 URL: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}\n`);
    
    try {
      // Step 1: Get project structure and fields
      await this.getProjectStructure();
      
      // Step 2: Get current issues and items
      await this.getCurrentIssues();
      
      // Step 3: Verify field configuration
      await this.verifyFieldConfiguration();
      
      // Step 4: Verify iteration setup
      await this.verifyIterationSetup();
      
      // Step 5: Check views and columns
      await this.verifyViewConfiguration();
      
      // Step 6: Generate compliance report
      await this.generateComplianceReport();
      
    } catch (error) {
      console.error('❌ Error inspecting project:', error.message);
    }
  }

  async getProjectStructure() {
    console.log('📋 Getting project structure...');
    
    const query = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            title
            shortDescription
            public
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
                      duration
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
            views(first: 10) {
              nodes {
                id
                name
                layout
              }
            }
            items(first: 50) {
              nodes {
                id
                content {
                  ... on Issue {
                    number
                    title
                    state
                    labels(first: 10) {
                      nodes {
                        name
                      }
                    }
                  }
                }
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      text
                      field {
                        ... on ProjectV2Field {
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldIterationValue {
                      title
                      field {
                        ... on ProjectV2IterationField {
                          name
                        }
                      }
                    }
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
    
    this.projectData = response.organization.projectV2;
    console.log(`✅ Project: "${this.projectData.title}"`);
    console.log(`📊 Fields: ${this.projectData.fields.nodes.length} configured`);
    console.log(`👁️  Views: ${this.projectData.views.nodes.length} configured`);
    console.log(`📋 Items: ${this.projectData.items.nodes.length} items found\n`);
  }

  async getCurrentIssues() {
    console.log('📝 Getting current repository issues...');
    
    const response = await octokit.rest.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: 'all',
      per_page: 100,
    });
    
    this.issues = response.data.filter(issue => !issue.pull_request);
    console.log(`📋 Repository Issues: ${this.issues.length} total issues found\n`);
  }

  async verifyFieldConfiguration() {
    console.log('⚙️  Verifying field configuration...');
    
    const expectedFields = {
      'Status': { type: 'SINGLE_SELECT', options: ['Ready', 'In Progress', 'Review', 'Done'] },
      'Priority': { type: 'SINGLE_SELECT', options: ['High', 'Medium', 'Low'] },
      'Size': { type: 'SINGLE_SELECT', options: ['XS (1)', 'S (2-3)', 'M (5-8)', 'L (13-20)', 'XL (20+)'] },
      'Sprint': { type: 'ITERATION', iterations: ['Sprint 3: Database + Weather API', 'Sprint 4: Revenue + Launch'] },
      'Parent Issue': { type: 'ISSUE', purpose: 'Hierarchy relationships' }
    };
    
    const actualFields = {};
    this.projectData.fields.nodes.forEach(field => {
      actualFields[field.name] = {
        type: field.dataType,
        id: field.id
      };
      
      if (field.options) {
        actualFields[field.name].options = field.options.map(opt => opt.name);
      }
      
      if (field.configuration?.iterations) {
        actualFields[field.name].iterations = field.configuration.iterations.map(iter => iter.title);
      }
    });
    
    console.log('📊 **FIELD VERIFICATION**:');
    
    Object.entries(expectedFields).forEach(([fieldName, expected]) => {
      const actual = actualFields[fieldName];
      
      if (!actual) {
        console.log(`  ❌ MISSING: Field "${fieldName}" not found`);
        this.discrepancies.push(`Missing field: ${fieldName}`);
      } else if (actual.type !== expected.type) {
        console.log(`  ⚠️  TYPE MISMATCH: Field "${fieldName}" is ${actual.type}, expected ${expected.type}`);
        this.discrepancies.push(`Field type mismatch: ${fieldName}`);
      } else {
        console.log(`  ✅ FOUND: Field "${fieldName}" (${actual.type})`);
        
        // Check options for single select fields
        if (expected.options && actual.options) {
          const missingOptions = expected.options.filter(opt => !actual.options.includes(opt));
          const extraOptions = actual.options.filter(opt => !expected.options.includes(opt));
          
          if (missingOptions.length > 0) {
            console.log(`    ⚠️  Missing options: ${missingOptions.join(', ')}`);
            this.discrepancies.push(`Missing options in ${fieldName}: ${missingOptions.join(', ')}`);
          }
          
          if (extraOptions.length > 0) {
            console.log(`    ℹ️  Extra options: ${extraOptions.join(', ')}`);
          }
        }
        
        // Check iterations
        if (expected.iterations && actual.iterations) {
          const missingIterations = expected.iterations.filter(iter => !actual.iterations.includes(iter));
          
          if (missingIterations.length > 0) {
            console.log(`    ⚠️  Missing iterations: ${missingIterations.join(', ')}`);
            this.discrepancies.push(`Missing iterations: ${missingIterations.join(', ')}`);
          } else {
            console.log(`    ✅ Iterations configured: ${actual.iterations.join(', ')}`);
          }
        }
      }
    });
    
    console.log('');
  }

  async verifyIterationSetup() {
    console.log('📅 Verifying iteration (sprint) setup...');
    
    const sprintField = this.projectData.fields.nodes.find(field => 
      field.name === 'Sprint' && field.dataType === 'ITERATION'
    );
    
    if (!sprintField) {
      console.log('❌ No Sprint/Iteration field found');
      this.discrepancies.push('Missing Sprint iteration field');
      return;
    }
    
    const iterations = sprintField.configuration?.iterations || [];
    console.log(`📊 Configured Iterations: ${iterations.length}`);
    
    iterations.forEach(iteration => {
      console.log(`  📅 ${iteration.title}`);
      console.log(`    Start: ${iteration.startDate || 'Not set'}`);
      console.log(`    Duration: ${iteration.duration || 'Not set'} weeks`);
    });
    
    // Check for expected sprints
    const expectedSprints = ['Sprint 3: Database + Weather API', 'Sprint 4: Revenue + Launch'];
    const actualSprints = iterations.map(iter => iter.title);
    
    expectedSprints.forEach(expectedSprint => {
      if (!actualSprints.includes(expectedSprint)) {
        console.log(`  ⚠️  Missing expected sprint: ${expectedSprint}`);
        this.discrepancies.push(`Missing sprint: ${expectedSprint}`);
      } else {
        console.log(`  ✅ Found expected sprint: ${expectedSprint}`);
      }
    });
    
    console.log('');
  }

  async verifyViewConfiguration() {
    console.log('👁️  Verifying view configuration...');
    
    const expectedViews = [
      { name: 'Board', layout: 'BOARD_LAYOUT' },
      { name: 'Table', layout: 'TABLE_LAYOUT' },
    ];
    
    const actualViews = this.projectData.views.nodes;
    
    console.log('📊 **VIEW VERIFICATION**:');
    actualViews.forEach(view => {
      console.log(`  📋 View: "${view.name}" (${view.layout})`);
    });
    
    // Check if we have a board view (main requirement)
    const hasBoardView = actualViews.some(view => view.layout === 'BOARD_LAYOUT');
    if (hasBoardView) {
      console.log('  ✅ Board layout view found');
    } else {
      console.log('  ⚠️  No board layout view found');
      this.discrepancies.push('Missing board layout view');
    }
    
    console.log('');
  }

  async generateComplianceReport() {
    console.log('📊 PROJECT COMPLIANCE REPORT');
    console.log('============================\n');
    
    console.log('🎯 **PROJECT OVERVIEW**');
    console.log(`Project: ${this.projectData.title}`);
    console.log(`URL: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}`);
    console.log(`Public: ${this.projectData.public ? 'Yes' : 'No'}`);
    console.log(`Description: ${this.projectData.shortDescription || 'Not set'}\n`);
    
    console.log('📋 **CONFIGURATION STATUS**');
    console.log(`Fields Configured: ${this.projectData.fields.nodes.length}`);
    console.log(`Views Available: ${this.projectData.views.nodes.length}`);
    console.log(`Project Items: ${this.projectData.items.nodes.length}`);
    console.log(`Repository Issues: ${this.issues.length}\n`);
    
    console.log('⚙️  **FIELD DETAILS**');
    this.projectData.fields.nodes.forEach(field => {
      console.log(`  📊 ${field.name} (${field.dataType})`);
      if (field.options) {
        console.log(`    Options: ${field.options.map(opt => opt.name).join(', ')}`);
      }
      if (field.configuration?.iterations) {
        console.log(`    Iterations: ${field.configuration.iterations.map(iter => iter.title).join(', ')}`);
      }
    });
    
    console.log('\n👁️  **VIEW DETAILS**');
    this.projectData.views.nodes.forEach(view => {
      console.log(`  📋 ${view.name} (${view.layout})`);
    });
    
    if (this.discrepancies.length > 0) {
      console.log('\n⚠️  **DISCREPANCIES FOUND**');
      this.discrepancies.forEach(discrepancy => {
        console.log(`  ❌ ${discrepancy}`);
      });
      
      console.log('\n📝 **RECOMMENDED ACTIONS**');
      this.discrepancies.forEach(discrepancy => {
        if (discrepancy.includes('Missing field')) {
          console.log(`  🔧 Add missing field in project settings`);
        } else if (discrepancy.includes('Missing options')) {
          console.log(`  🔧 Update field options in project settings`);
        } else if (discrepancy.includes('Missing sprint')) {
          console.log(`  🔧 Configure sprint iterations in project settings`);
        } else if (discrepancy.includes('Missing board')) {
          console.log(`  🔧 Create board layout view in project settings`);
        }
      });
    } else {
      console.log('\n✅ **PROJECT FULLY COMPLIANT**');
      console.log('All expected fields, options, and configurations are properly set up!');
    }
    
    console.log('\n🔗 **QUICK LINKS**');
    console.log(`Main Board: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}/views/1`);
    console.log(`Project Settings: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}/settings`);
    console.log(`Field Settings: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}/settings/fields`);
    
    console.log('\n📋 **COMPLIANCE SCORE**');
    const totalChecks = 8; // Number of things we're checking
    const passedChecks = totalChecks - this.discrepancies.length;
    const complianceScore = Math.round((passedChecks / totalChecks) * 100);
    
    console.log(`Score: ${complianceScore}% (${passedChecks}/${totalChecks} checks passed)`);
    
    if (complianceScore === 100) {
      console.log('🎉 Perfect compliance! Project matches documentation exactly.');
    } else if (complianceScore >= 80) {
      console.log('✅ Good compliance! Minor adjustments needed.');
    } else if (complianceScore >= 60) {
      console.log('⚠️  Moderate compliance. Several adjustments needed.');
    } else {
      console.log('❌ Low compliance. Significant setup required.');
    }
  }
}

// CLI Interface
async function main() {
  const inspector = new ProjectInspector();
  await inspector.inspectProject();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProjectInspector };