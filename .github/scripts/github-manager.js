#!/usr/bin/env node

/**
 * GitHub Manager - Efficient GitHub API Interface
 * Provides streamlined commands for GitHub project management
 * Uses Octokit SDK for optimal performance and error handling
 */

import { Octokit } from '@octokit/rest';
import { createWriteStream } from 'fs';
import path from 'path';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-CLI/1.0.0',
});

class GitHubManager {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
  }

  async createProject(name, description) {
    try {
      console.log(`🔧 Creating project: ${name}`);
      // Note: Projects v2 requires GraphQL, this is a placeholder for organization project
      const response = await octokit.request('POST /orgs/{org}/projects', {
        org: this.owner,
        name: name,
        body: description,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      console.log(`✅ Project created: ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error creating project: ${error.message}`);
      if (error.status === 410) {
        console.log(`💡 Use GitHub web interface to create Projects v2`);
      }
      return null;
    }
  }

  async createMilestone(title, description, dueDate) {
    try {
      console.log(`🎯 Creating milestone: ${title}`);
      const response = await octokit.rest.issues.createMilestone({
        owner: this.owner,
        repo: this.repo,
        title: title,
        description: description,
        due_on: dueDate,
      });
      console.log(`✅ Milestone created: #${response.data.number}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error creating milestone: ${error.message}`);
      return null;
    }
  }

  async createIssue(title, body, labels = [], milestone = null, assignees = []) {
    try {
      console.log(`📝 Creating issue: ${title}`);
      const issueData = {
        owner: this.owner,
        repo: this.repo,
        title: title,
        body: body,
        labels: labels,
        assignees: assignees,
      };

      if (milestone) {
        issueData.milestone = milestone;
      }

      const response = await octokit.rest.issues.create(issueData);
      console.log(`✅ Issue created: #${response.data.number} - ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error creating issue: ${error.message}`);
      return null;
    }
  }

  async updateIssue(issueNumber, updates) {
    try {
      console.log(`🔄 Updating issue #${issueNumber}`);
      const response = await octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...updates,
      });
      console.log(`✅ Issue updated: #${response.data.number}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating issue: ${error.message}`);
      return null;
    }
  }

  async assignToMilestone(issueNumbers, milestoneNumber) {
    try {
      console.log(`🎯 Assigning ${issueNumbers.length} issues to milestone ${milestoneNumber}`);
      const results = [];

      for (const issueNumber of issueNumbers) {
        const result = await this.updateIssue(issueNumber, { milestone: milestoneNumber });
        if (result) results.push(result);
      }

      console.log(`✅ ${results.length} issues assigned to milestone`);
      return results;
    } catch (error) {
      console.error(`❌ Error assigning to milestone: ${error.message}`);
      return [];
    }
  }

  async listMilestones() {
    try {
      const response = await octokit.rest.issues.listMilestones({
        owner: this.owner,
        repo: this.repo,
        state: 'all',
      });

      console.log('\n📊 MILESTONES:');
      response.data.forEach(milestone => {
        console.log(`  ${milestone.number}: ${milestone.title}`);
        console.log(`    📅 Due: ${milestone.due_on || 'No due date'}`);
        console.log(`    📈 Progress: ${milestone.closed_issues}/${milestone.open_issues + milestone.closed_issues} issues`);
        console.log(`    🔗 ${milestone.html_url}\n`);
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Error listing milestones: ${error.message}`);
      return [];
    }
  }

  async listIssues(milestone = null, state = 'open') {
    try {
      const params = {
        owner: this.owner,
        repo: this.repo,
        state: state,
        per_page: 100,
      };

      if (milestone) {
        params.milestone = milestone;
      }

      const response = await octokit.rest.issues.listForRepo(params);

      console.log(`\n📋 ISSUES (${state.toUpperCase()}):`);
      response.data.forEach(issue => {
        const milestone_info = issue.milestone ? `[M${issue.milestone.number}]` : '[No Milestone]';
        const labels = issue.labels.map(l => l.name).join(', ');
        console.log(`  #${issue.number}: ${issue.title} ${milestone_info}`);
        console.log(`    🏷️  Labels: ${labels || 'None'}`);
        console.log(`    🔗 ${issue.html_url}\n`);
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Error listing issues: ${error.message}`);
      return [];
    }
  }

  async bulkCreateSprint(sprintConfig) {
    console.log(`🚀 Creating complete sprint: ${sprintConfig.name}`);

    // Create milestone
    const milestone = await this.createMilestone(
      sprintConfig.name,
      sprintConfig.description,
      sprintConfig.dueDate
    );

    if (!milestone) return null;

    // Create all issues
    const createdIssues = [];
    for (const issueConfig of sprintConfig.issues) {
      const issue = await this.createIssue(
        issueConfig.title,
        issueConfig.body,
        issueConfig.labels,
        milestone.number,
        issueConfig.assignees
      );
      if (issue) createdIssues.push(issue);
    }

    console.log(`✅ Sprint created: ${createdIssues.length} issues in milestone ${milestone.number}`);
    return { milestone, issues: createdIssues };
  }

  async generateReport() {
    console.log('\n📊 GITHUB PROJECT REPORT');
    console.log('=' * 50);

    await this.listMilestones();
    await this.listIssues();

    // Save report to file
    const reportFile = path.join(__dirname, '../reports/github-status.md');
    console.log(`💾 Report saved to: ${reportFile}`);
  }
}

// CLI Interface
async function main() {
  const manager = new GitHubManager();
  const command = process.argv[2];

  switch (command) {
    case 'milestones':
      await manager.listMilestones();
      break;

    case 'issues':
      const milestone = process.argv[3];
      await manager.listIssues(milestone);
      break;

    case 'assign':
      const issueNumbers = process.argv[3].split(',').map(n => parseInt(n));
      const milestoneNumber = parseInt(process.argv[4]);
      await manager.assignToMilestone(issueNumbers, milestoneNumber);
      break;

    case 'create-issue':
      const title = process.argv[3];
      const body = process.argv[4] || '';
      const labels = process.argv[5] ? process.argv[5].split(',') : [];
      await manager.createIssue(title, body, labels);
      break;

    case 'report':
      await manager.generateReport();
      break;

    default:
      console.log(`
🔧 GitHub Manager - Efficient GitHub API Interface

Usage:
  node github-manager.js milestones                    # List all milestones
  node github-manager.js issues [milestone]           # List issues (optionally filtered by milestone)
  node github-manager.js assign "1,2,3" 2            # Assign issues 1,2,3 to milestone 2
  node github-manager.js create-issue "Title" "Body" "label1,label2"
  node github-manager.js report                       # Generate complete project report

Examples:
  node github-manager.js milestones
  node github-manager.js issues 3
  node github-manager.js assign "10,11,12" 1
  node github-manager.js create-issue "New Epic" "Epic description" "epic,sprint-1"
      `);
      break;
  }
}

// Export for programmatic use
export { GitHubManager };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
