#!/usr/bin/env node

/**
 * Reset GitHub Project - Remove All Issues, Then Add Only Sprint 3 & 4
 * Clean slate approach for NearestNiceWeather.com App Development Project
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2; // From the URL: /orgs/PrairieAster-Ai/projects/2

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-ProjectReset/1.0.0',
});

class ProjectResetter {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
  }

  async resetProject() {
    console.log('🗑️  Resetting NearestNiceWeather.com App Development Project...\n');
    
    try {
      // Step 1: Get project ID
      const projectId = await this.getProjectId();
      console.log(`📊 Project ID: ${projectId}`);
      
      // Step 2: Remove all current items from project
      await this.removeAllProjectItems(projectId);
      
      // Step 3: Add only Sprint 3 & 4 issues
      await this.addSprintIssues(projectId);
      
      console.log('\n✅ Project reset complete!');
      console.log('🎯 Ready for Sprint 3 & 4 focused workflow');
      
    } catch (error) {
      console.error('❌ Error resetting project:', error.message);
    }
  }

  async getProjectId() {
    const query = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            title
          }
        }
      }
    `;
    
    const response = await octokit.graphql(query, {
      owner: this.owner,
      number: this.projectNumber,
    });
    
    return response.organization.projectV2.id;
  }

  async removeAllProjectItems(projectId) {
    console.log('🗑️  Removing all current items from project...');
    
    // Get all current project items
    const query = `
      query($projectId: ID!, $first: Int!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: $first) {
              nodes {
                id
                content {
                  ... on Issue {
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
    
    const response = await octokit.graphql(query, {
      projectId: projectId,
      first: 100,
    });
    
    const items = response.node.items.nodes;
    console.log(`📋 Found ${items.length} items to remove`);
    
    // Remove each item
    for (const item of items) {
      await this.removeProjectItem(item);
    }
    
    console.log(`✅ Removed ${items.length} items from project`);
  }

  async removeProjectItem(item) {
    try {
      const mutation = `
        mutation($projectId: ID!, $itemId: ID!) {
          deleteProjectV2Item(input: {
            projectId: $projectId
            itemId: $itemId
          }) {
            deletedItemId
          }
        }
      `;
      
      const issueInfo = item.content ? `#${item.content.number}: ${item.content.title}` : 'Unknown item';
      console.log(`  🗑️  Removing: ${issueInfo}`);
      
      // Note: We need the project ID, but the mutation expects projectId
      // We'll need to get it from the context
      const projectId = await this.getProjectId();
      
      await octokit.graphql(mutation, {
        projectId: projectId,
        itemId: item.id,
      });
      
      console.log(`  ✅ Removed: ${issueInfo}`);
      
    } catch (error) {
      console.error(`  ❌ Failed to remove item:`, error.message);
    }
  }

  async addSprintIssues(projectId) {
    console.log('\n🔄 Adding Sprint 3 & 4 issues to project...');
    
    // Sprint 3 & 4 issue numbers based on our created issues
    const sprintIssues = [
      // Sprint 3 - Current Iteration
      21, // Sprint 3: Map Interface Foundation 🔄 IN PROGRESS
      28, // Epic: Production Database & POI Infrastructure 🔄
      29, // Epic: Weather API Integration & Optimization 🔄
      30, // Story: Minnesota POI Database Deployment
      31, // Story: OpenWeather API Connection & Rate Limiting
      32, // Task: Redis Caching Implementation for Weather Data
      
      // Sprint 4 - Next Iteration  
      22, // Sprint 4: MVP Polish and User Testing 📅 PLANNED
    ];
    
    // Get issue details and add to project
    for (const issueNumber of sprintIssues) {
      await this.addIssueToProject(projectId, issueNumber);
    }
    
    console.log(`✅ Added ${sprintIssues.length} Sprint 3 & 4 issues to project`);
  }

  async addIssueToProject(projectId, issueNumber) {
    try {
      // First get the issue to get its node_id
      const issueResponse = await octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      
      const issue = issueResponse.data;
      
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
      
      console.log(`  🔗 Adding issue #${issueNumber}: ${issue.title}`);
      
      await octokit.graphql(mutation, {
        projectId: projectId,
        contentId: issue.node_id,
      });
      
      console.log(`  ✅ Issue #${issueNumber} added to project`);
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`  ⚠️  Issue #${issueNumber} already in project`);
      } else {
        console.error(`  ❌ Failed to add issue #${issueNumber}:`, error.message);
      }
    }
  }

  async generateResetSummary() {
    console.log('\n📊 Project Reset Summary');
    console.log('========================\n');
    
    console.log('🎯 **PROJECT CLEANED & FOCUSED**');
    console.log('Project: NearestNiceWeather.com App Development');
    console.log('URL: https://github.com/orgs/PrairieAster-Ai/projects/2/views/1\n');
    
    console.log('📅 **SPRINT FOCUS ONLY**');
    console.log('Current Iteration: Sprint 3 (Database + Weather API)');
    console.log('  - Issues: #21, #28, #29, #30, #31, #32');
    console.log('  - Goal: 50% → 75% MVP completion');
    console.log('  - Key Work: Database deployment + OpenWeather integration\n');
    
    console.log('Next Iteration: Sprint 4 (Revenue + Launch)');
    console.log('  - Issues: #22');
    console.log('  - Goal: 75% → 100% MVP completion');
    console.log('  - Key Work: Google AdSense + user testing + launch\n');
    
    console.log('🧹 **CLEANED UP**');
    console.log('- Removed all historical issues (Sprint 1 & 2 completed work)');
    console.log('- Removed capability and epic issues not in current sprints');
    console.log('- Project now shows only active and next sprint work');
    console.log('- Focused view for current development priorities\n');
    
    console.log('🎯 **CURRENT DEVELOPMENT FOCUS**');
    console.log('Priority: Complete Sprint 3 for 75% MVP milestone');
    console.log('Active Work: Database schema + weather API + caching');
    console.log('Blocked: Sprint 4 until Sprint 3 completion\n');
    
    console.log('✅ Project ready for sprint-focused development workflow!');
  }
}

// CLI Interface
async function main() {
  const resetter = new ProjectResetter();
  
  await resetter.resetProject();
  await resetter.generateResetSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProjectResetter };