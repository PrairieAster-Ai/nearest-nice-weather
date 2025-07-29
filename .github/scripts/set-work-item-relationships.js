#!/usr/bin/env node

/**
 * Set Work Item Type Relationships for All Issues
 * Updates all existing issues with proper Work Item Type field values
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-RelationshipSetter/1.0.0',
});

class WorkItemRelationshipSetter {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
    this.projectId = null;
    this.workItemTypeField = null;
    this.processedIssues = [];
  }

  async initialize() {
    console.log('🔧 Initializing project and field configuration...\n');
    
    try {
      // Get project and field information
      const projectQuery = `
        query($owner: String!, $number: Int!) {
          organization(login: $owner) {
            projectV2(number: $number) {
              id
              title
              fields(first: 20) {
                nodes {
                  ... on ProjectV2SingleSelectField {
                    id
                    name
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

      const projectData = await octokit.graphql(projectQuery, {
        owner: this.owner,
        number: this.projectNumber
      });

      this.projectId = projectData.organization.projectV2.id;
      console.log(`✅ Found project: ${projectData.organization.projectV2.title}`);
      console.log(`✅ Project ID: ${this.projectId}`);

      // Find the Work Item Type field
      this.workItemTypeField = projectData.organization.projectV2.fields.nodes.find(
        field => field.name === 'Work Item Type'
      );

      if (!this.workItemTypeField) {
        throw new Error('Work Item Type field not found. Please run create-work-item-type-field.js first.');
      }

      console.log(`✅ Found Work Item Type field: ${this.workItemTypeField.id}`);
      console.log('✅ Available options:');
      this.workItemTypeField.options.forEach(option => {
        console.log(`    - ${option.name} (${option.id})`);
      });
      console.log();

    } catch (error) {
      console.error('❌ Failed to initialize:', error.message);
      throw error;
    }
  }

  async getAllIssues() {
    console.log('📋 Fetching all repository issues...');
    
    try {
      const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
        owner: this.owner,
        repo: this.repo,
        state: 'all',
        per_page: 100
      });

      console.log(`✅ Found ${issues.length} total issues\n`);
      return issues;

    } catch (error) {
      console.error('❌ Failed to fetch issues:', error.message);
      throw error;
    }
  }

  determineWorkItemType(issue) {
    // Determine type based on title prefix (most reliable)
    if (issue.title.startsWith('Capability:')) return 'Capability';
    if (issue.title.startsWith('Epic:')) return 'Epic';
    if (issue.title.startsWith('Story:')) return 'Story';
    
    // Fallback to labels
    const labels = issue.labels.map(label => label.name);
    if (labels.includes('type: capability')) return 'Capability';
    if (labels.includes('type: epic')) return 'Epic';
    if (labels.includes('type: story')) return 'Story';
    if (labels.includes('bug')) return 'Bug';
    
    // Test issues or general issues default to Story
    if (issue.title.includes('TEST:') || issue.title.includes('Test')) return 'Story';
    
    // Default fallback
    return 'Story';
  }

  isNearestNiceWeatherIssue(issue) {
    const title = issue.title.toLowerCase();
    const body = (issue.body || '').toLowerCase();
    
    // MVP-related keywords
    const mvpKeywords = [
      'capability:', 'epic:', 'story:',
      'weather', 'poi', 'minnesota', 'feedback', 'database',
      'openweather', 'redis', 'adsense', 'analytics',
      'nearest nice weather', 'mvp', 'production database'
    ];
    
    // Test issues that should be kept (for now)
    if (title.includes('test') && (
      title.includes('project integration') ||
      title.includes('work item type') ||
      title.includes('epic')
    )) {
      return true;
    }
    
    // Check if title or body contains MVP keywords
    return mvpKeywords.some(keyword => 
      title.includes(keyword) || body.includes(keyword)
    );
  }

  async getProjectItems() {
    console.log('🔍 Fetching project items...');
    
    try {
      const projectItemsQuery = `
        query($projectId: ID!) {
          node(id: $projectId) {
            ... on ProjectV2 {
              items(first: 100) {
                nodes {
                  id
                  content {
                    ... on Issue {
                      id
                      number
                      title
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const projectData = await octokit.graphql(projectItemsQuery, {
        projectId: this.projectId
      });

      const items = projectData.node.items.nodes;
      console.log(`✅ Found ${items.length} items in project\n`);
      
      return items;

    } catch (error) {
      console.error('❌ Failed to fetch project items:', error.message);
      throw error;
    }
  }

  async setWorkItemType(projectItemId, workItemType) {
    try {
      const option = this.workItemTypeField.options.find(opt => opt.name === workItemType);
      if (!option) {
        console.log(`    ⚠️  Option "${workItemType}" not found`);
        return false;
      }

      const updateMutation = `
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

      await octokit.graphql(updateMutation, {
        projectId: this.projectId,
        itemId: projectItemId,
        fieldId: this.workItemTypeField.id,
        optionId: option.id
      });

      return true;

    } catch (error) {
      console.log(`    ❌ Failed to set work item type: ${error.message}`);
      return false;
    }
  }

  async processAllIssues() {
    console.log('🚀 PROCESSING ALL ISSUES FOR WORK ITEM TYPE ASSIGNMENT');
    console.log('=====================================================\n');
    
    await this.initialize();
    
    const allIssues = await this.getAllIssues();
    const projectItems = await this.getProjectItems();
    
    // Create a map of issue numbers to project item IDs
    const issueToProjectItemMap = new Map();
    projectItems.forEach(item => {
      if (item.content && item.content.number) {
        issueToProjectItemMap.set(item.content.number, item.id);
      }
    });

    console.log('📊 **PROCESSING PLAN**:');
    console.log(`  📋 Total Issues: ${allIssues.length}`);
    console.log(`  🎯 Project Items: ${projectItems.length}`);
    console.log(`  🔗 Mapped Issues: ${issueToProjectItemMap.size}\n`);

    let processedCount = 0;
    let skippedCount = 0;
    let nonProjectCount = 0;

    for (const issue of allIssues) {
      const isProjectIssue = this.isNearestNiceWeatherIssue(issue);
      const projectItemId = issueToProjectItemMap.get(issue.number);
      
      if (!isProjectIssue) {
        console.log(`⏭️  #${issue.number}: "${issue.title}" - Non-project issue`);
        nonProjectCount++;
        continue;
      }

      if (!projectItemId) {
        console.log(`⏭️  #${issue.number}: "${issue.title}" - Not in project`);
        skippedCount++;
        continue;
      }

      const workItemType = this.determineWorkItemType(issue);
      console.log(`🔄 #${issue.number}: "${issue.title}"`);
      console.log(`    📝 Type: ${workItemType}`);

      const success = await this.setWorkItemType(projectItemId, workItemType);
      if (success) {
        console.log(`    ✅ Set Work Item Type: ${workItemType}`);
        processedCount++;
      }

      this.processedIssues.push({
        number: issue.number,
        title: issue.title,
        workItemType,
        success,
        isProjectIssue
      });

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n📊 **PROCESSING SUMMARY**');
    console.log('=========================');
    console.log(`✅ Successfully processed: ${processedCount} issues`);
    console.log(`⏭️  Skipped (not in project): ${skippedCount} issues`);
    console.log(`📋 Non-project issues found: ${nonProjectCount} issues`);
    console.log(`📋 Total issues analyzed: ${allIssues.length} issues`);

    console.log('\n🔗 **VERIFICATION**:');
    console.log(`📋 Project Board: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}`);
    console.log('👀 Check that issues now show correct Work Item Type in project columns');

    console.log('\n📋 **NON-PROJECT ISSUES TO CONSIDER FOR CLEANUP**:');
    const nonProjectIssues = this.processedIssues.filter(item => !item.isProjectIssue);
    if (nonProjectIssues.length > 0) {
      nonProjectIssues.forEach(item => {
        console.log(`  - #${item.number}: ${item.title}`);
      });
      console.log(`\n💡 Run cleanup script to remove these issues if desired`);
    } else {
      console.log('  ✅ All issues are project-related');
    }

    console.log('\n✅ Work Item Type relationship setting complete!');
    
    return {
      processed: processedCount,
      skipped: skippedCount,
      nonProject: nonProjectCount,
      total: allIssues.length
    };
  }
}

// Run the relationship setter
async function main() {
  const setter = new WorkItemRelationshipSetter();
  await setter.processAllIssues();
}

main().catch(console.error);