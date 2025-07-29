#!/usr/bin/env node

/**
 * Review Unassigned Issues
 * Analyzes issues not assigned to the project and recommends actions
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-UnassignedReviewer/1.0.0',
});

class UnassignedIssueReviewer {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.projectNumber = PROJECT_NUMBER;
    this.projectId = null;
    this.projectIssues = new Set();
    this.recommendations = {
      addToProject: [],
      removeFromRepo: [],
      needsReview: []
    };
  }

  async initialize() {
    console.log('🔧 Initializing project analysis...\n');
    
    try {
      // Get project ID and current issues
      const projectQuery = `
        query($owner: String!, $number: Int!) {
          organization(login: $owner) {
            projectV2(number: $number) {
              id
              title
              items(first: 100) {
                nodes {
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

      const projectData = await octokit.graphql(projectQuery, {
        owner: this.owner,
        number: this.projectNumber
      });

      this.projectId = projectData.organization.projectV2.id;
      
      // Track which issues are already in the project
      projectData.organization.projectV2.items.nodes.forEach(item => {
        if (item.content && item.content.number) {
          this.projectIssues.add(item.content.number);
        }
      });

      console.log(`✅ Project: ${projectData.organization.projectV2.title}`);
      console.log(`✅ Project has ${this.projectIssues.size} assigned issues\n`);

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

  analyzeIssue(issue) {
    const title = issue.title.toLowerCase();
    const body = (issue.body || '').toLowerCase();
    const labels = issue.labels.map(label => label.name.toLowerCase());
    
    // Check if already in project
    if (this.projectIssues.has(issue.number)) {
      return {
        recommendation: 'already_in_project',
        reason: 'Already assigned to project',
        confidence: 'high'
      };
    }

    // Check if archived/closed by cleanup
    if (labels.includes('cleanup') || labels.includes('archived')) {
      return {
        recommendation: 'remove',
        reason: 'Already archived during cleanup process',
        confidence: 'high'
      };
    }

    // MVP work item patterns
    const mvpPatterns = [
      'capability:', 'epic:', 'story:',
      'weather', 'poi', 'minnesota', 'feedback', 'database',
      'openweather', 'redis', 'adsense', 'analytics',
      'nearest nice weather', 'mvp'
    ];

    const hasMvpContent = mvpPatterns.some(pattern => 
      title.includes(pattern) || body.includes(pattern)
    );

    // Test/demo issues that might be useful
    const isTestIssue = title.includes('test') || title.includes('integration');
    
    // Deleted/placeholder issues
    const isDeleted = title.includes('[permanently deleted]') || 
                     title.includes('deleted') ||
                     issue.title === '' ||
                     body.includes('permanently deleted');

    // Analysis logic
    if (isDeleted) {
      return {
        recommendation: 'remove',
        reason: 'Deleted/placeholder issue with no content',
        confidence: 'high'
      };
    }

    if (hasMvpContent && !isTestIssue) {
      return {
        recommendation: 'add_to_project',
        reason: 'Contains MVP-related content and should be tracked',
        confidence: 'high'
      };
    }

    if (isTestIssue && hasMvpContent) {
      return {
        recommendation: 'review',
        reason: 'Test issue with MVP content - manual review needed',
        confidence: 'medium'
      };
    }

    if (title.includes('duplicate') || title.includes('outdated')) {
      return {
        recommendation: 'remove',
        reason: 'Identified as duplicate or outdated',
        confidence: 'high'
      };
    }

    // Default for unclear issues
    return {
      recommendation: 'review',
      reason: 'Unclear classification - manual review recommended',
      confidence: 'low'
    };
  }

  async reviewAllUnassignedIssues() {
    console.log('🔍 REVIEWING UNASSIGNED ISSUES');
    console.log('===============================\n');
    
    await this.initialize();
    const allIssues = await this.getAllIssues();
    
    const unassignedIssues = allIssues.filter(issue => !this.projectIssues.has(issue.number));
    
    console.log(`📊 **ANALYSIS SCOPE**:`);
    console.log(`  📋 Total Issues: ${allIssues.length}`);
    console.log(`  🎯 Already in Project: ${this.projectIssues.size}`);
    console.log(`  ❓ Unassigned Issues: ${unassignedIssues.length}\n`);

    if (unassignedIssues.length === 0) {
      console.log('✅ All issues are already assigned to the project!');
      return;
    }

    console.log('📋 **DETAILED ANALYSIS**:\n');

    for (const issue of unassignedIssues) {
      const analysis = this.analyzeIssue(issue);
      const statusIcon = issue.state === 'closed' ? '🔒' : '🔓';
      const confidenceIcon = analysis.confidence === 'high' ? '🎯' : 
                           analysis.confidence === 'medium' ? '⚠️' : '❓';

      console.log(`${statusIcon} #${issue.number}: "${issue.title}"`);
      console.log(`    📝 State: ${issue.state}`);
      console.log(`    ${confidenceIcon} Recommendation: ${analysis.recommendation.toUpperCase()}`);
      console.log(`    💭 Reason: ${analysis.reason}`);

      // Categorize for summary
      switch (analysis.recommendation) {
        case 'add_to_project':
          this.recommendations.addToProject.push({
            issue,
            analysis
          });
          break;
        case 'remove':
          this.recommendations.removeFromRepo.push({
            issue,
            analysis
          });
          break;
        case 'review':
          this.recommendations.needsReview.push({
            issue,
            analysis
          });
          break;
      }

      console.log(); // Empty line for readability
    }

    this.generateSummary();
  }

  generateSummary() {
    console.log('📊 **REVIEW SUMMARY**');
    console.log('=====================\n');

    console.log(`🎯 **ADD TO PROJECT** (${this.recommendations.addToProject.length} issues):`);
    if (this.recommendations.addToProject.length > 0) {
      this.recommendations.addToProject.forEach(({ issue, analysis }) => {
        console.log(`  ✅ #${issue.number}: ${issue.title}`);
        console.log(`      💭 ${analysis.reason}`);
      });
    } else {
      console.log('  ✅ No issues need to be added to project');
    }

    console.log(`\n🗑️  **REMOVE FROM REPOSITORY** (${this.recommendations.removeFromRepo.length} issues):`);
    if (this.recommendations.removeFromRepo.length > 0) {
      this.recommendations.removeFromRepo.forEach(({ issue, analysis }) => {
        console.log(`  🗑️  #${issue.number}: ${issue.title}`);
        console.log(`      💭 ${analysis.reason}`);
      });
    } else {
      console.log('  ✅ No issues need to be removed');
    }

    console.log(`\n❓ **NEEDS MANUAL REVIEW** (${this.recommendations.needsReview.length} issues):`);
    if (this.recommendations.needsReview.length > 0) {
      this.recommendations.needsReview.forEach(({ issue, analysis }) => {
        console.log(`  ❓ #${issue.number}: ${issue.title}`);
        console.log(`      💭 ${analysis.reason}`);
      });
    } else {
      console.log('  ✅ No issues need manual review');
    }

    console.log('\n🔗 **VERIFICATION LINKS**:');
    console.log(`📋 Repository Issues: https://github.com/${this.owner}/${this.repo}/issues`);
    console.log(`🎯 Project Board: https://github.com/orgs/${this.owner}/projects/${this.projectNumber}`);

    console.log('\n🎯 **NEXT STEPS**:');
    if (this.recommendations.addToProject.length > 0) {
      console.log(`1. Add ${this.recommendations.addToProject.length} issues to project`);
    }
    if (this.recommendations.removeFromRepo.length > 0) {
      console.log(`2. Remove ${this.recommendations.removeFromRepo.length} issues from repository`);
    }
    if (this.recommendations.needsReview.length > 0) {
      console.log(`3. Manually review ${this.recommendations.needsReview.length} unclear issues`);
    }

    console.log('\n✅ Unassigned issue review complete!');
  }
}

// Run the review
async function main() {
  const reviewer = new UnassignedIssueReviewer();
  await reviewer.reviewAllUnassignedIssues();
}

main().catch(console.error);