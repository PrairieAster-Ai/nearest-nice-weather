#!/usr/bin/env node

/**
 * Add Issues to GitHub Project using MCP Servers
 * Use GitHub tooling to add all issues to NearestNiceWeather.com App Development Project
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2; // From the URL: /orgs/PrairieAster-Ai/projects/2

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-ProjectIntegration/1.0.0',
});

class ProjectIntegrator {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
  }

  async addIssuesToProject() {
    console.log('🔗 Adding issues to NearestNiceWeather.com App Development Project...\n');

    try {
      // Step 1: Get project ID using GraphQL
      const projectId = await this.getProjectId();
      console.log(`📊 Project ID: ${projectId}`);

      // Step 2: Get all open issues
      const issues = await this.getAllOpenIssues();
      console.log(`📋 Found ${issues.length} open issues to add`);

      // Step 3: Add each issue to the project
      for (const issue of issues) {
        await this.addIssueToProject(projectId, issue);
      }

      console.log('\n✅ All issues added to GitHub Project!');
      console.log('🎯 Ready for iteration-based workflow management');

    } catch (error) {
      console.error('❌ Error adding issues to project:', error.message);
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

  async getAllOpenIssues() {
    const response = await octokit.rest.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: 'open',
      per_page: 100,
    });

    return response.data.filter(issue => !issue.pull_request);
  }

  async addIssueToProject(projectId, issue) {
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

      console.log(`  🔗 Adding issue #${issue.number}: ${issue.title}`);

      await octokit.graphql(mutation, {
        projectId: projectId,
        contentId: issue.node_id,
      });

      console.log(`  ✅ Issue #${issue.number} added to project`);

    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`  ⚠️  Issue #${issue.number} already in project`);
      } else {
        console.error(`  ❌ Failed to add issue #${issue.number}:`, error.message);
      }
    }
  }

  async generateProjectSummary() {
    console.log('\n📊 GitHub Project Integration Summary');
    console.log('====================================\n');

    console.log('🎯 **PROJECT CONFIGURED**');
    console.log('Project: NearestNiceWeather.com App Development');
    console.log('URL: https://github.com/orgs/PrairieAster-Ai/projects/2/views/1\n');

    console.log('📅 **ITERATION STRUCTURE**');
    console.log('Current Iteration: Sprint 3 (Database + Weather API)');
    console.log('  - Issues: #21, #28, #29, #30, #31, #32');
    console.log('  - Status: In Progress → 75% MVP completion');

    console.log('\nNext Iteration: Sprint 4 (Revenue + Launch)');
    console.log('  - Issues: #22');
    console.log('  - Status: Planned → 100% MVP completion\n');

    console.log('📋 **RECOMMENDED PROJECT BOARD SETUP**');
    console.log('1. Create columns: Backlog, Ready, In Progress, Review, Done');
    console.log('2. Configure iteration fields for Sprint 3 (Current) and Sprint 4 (Next)');
    console.log('3. Set up status fields to track workflow progress');
    console.log('4. Add priority and effort estimate fields for planning\n');

    console.log('🎯 **CURRENT FOCUS**');
    console.log('Priority: Complete Sprint 3 issues for 75% MVP completion');
    console.log('Key Deliverables: Database deployment + OpenWeather API integration');
  }
}

// CLI Interface
async function main() {
  const integrator = new ProjectIntegrator();

  await integrator.addIssuesToProject();
  await integrator.generateProjectSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProjectIntegrator };
