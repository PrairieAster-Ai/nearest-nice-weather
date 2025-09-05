#!/usr/bin/env node

/**
 * GitHub Issues & Milestones Cleanup Script
 * Deletes all existing issues and milestones to start fresh
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-Cleanup/1.0.0',
});

class GitHubCleanup {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
  }

  async deleteAllIssues() {
    console.log('🗑️ Cleaning up all GitHub issues and milestones...\n');

    try {
      // Get all open issues
      console.log('📋 Fetching all open issues...');
      const issues = await this.getAllIssues();
      console.log(`Found ${issues.length} issues to delete\n`);

      // Delete all issues
      if (issues.length > 0) {
        console.log('🗑️ Deleting issues...');
        for (const issue of issues) {
          await this.deleteIssue(issue.number);
        }
      }

      // Get all milestones
      console.log('\n📅 Fetching all milestones...');
      const milestones = await this.getAllMilestones();
      console.log(`Found ${milestones.length} milestones to delete\n`);

      // Delete all milestones
      if (milestones.length > 0) {
        console.log('🗑️ Deleting milestones...');
        for (const milestone of milestones) {
          await this.deleteMilestone(milestone.number);
        }
      }

      console.log('\n✅ GitHub cleanup complete!');
      console.log('📝 Ready to create issues based on actual MVP & WBS documentation');

    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
    }
  }

  async getAllIssues() {
    const allIssues = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'all',
        per_page: 100,
        page: page
      });

      // Filter out pull requests (GitHub API returns PRs in issues endpoint)
      const issues = response.data.filter(issue => !issue.pull_request);
      allIssues.push(...issues);

      hasMore = response.data.length === 100;
      page++;
    }

    return allIssues;
  }

  async getAllMilestones() {
    const response = await octokit.rest.issues.listMilestones({
      owner: this.owner,
      repo: this.repo,
      state: 'all',
      per_page: 100,
    });
    return response.data;
  }

  async deleteIssue(issueNumber) {
    try {
      // GitHub doesn't allow deleting issues via API, so we'll close them instead
      // and add a label to mark them as deleted
      await octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        state: 'closed',
        labels: ['deleted', 'cleanup'],
        title: `[DELETED] ${await this.getIssueTitle(issueNumber)}`
      });

      console.log(`  ✅ Closed issue #${issueNumber} (marked as deleted)`);
    } catch (error) {
      console.error(`  ❌ Failed to close issue #${issueNumber}:`, error.message);
    }
  }

  async getIssueTitle(issueNumber) {
    try {
      const response = await octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return response.data.title;
    } catch (error) {
      return 'Unknown Title';
    }
  }

  async deleteMilestone(milestoneNumber) {
    try {
      await octokit.rest.issues.deleteMilestone({
        owner: this.owner,
        repo: this.repo,
        milestone_number: milestoneNumber,
      });
      console.log(`  ✅ Deleted milestone #${milestoneNumber}`);
    } catch (error) {
      console.error(`  ❌ Failed to delete milestone #${milestoneNumber}:`, error.message);
    }
  }

  async confirmCleanup() {
    console.log('⚠️  WARNING: This will clean up ALL GitHub issues and milestones!');
    console.log('📝 Reason: Issues created did not align with actual MVP & WBS documentation');
    console.log('🎯 Goal: Start fresh with correct content from presentations\n');

    // In a script context, we'll proceed automatically
    // In interactive mode, you could add prompts here
    console.log('🚀 Proceeding with cleanup...\n');
    return true;
  }
}

// CLI Interface
async function main() {
  const cleanup = new GitHubCleanup();

  const confirmed = await cleanup.confirmCleanup();
  if (confirmed) {
    await cleanup.deleteAllIssues();
  } else {
    console.log('❌ Cleanup cancelled');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { GitHubCleanup };
