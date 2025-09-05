#!/usr/bin/env node

/**
 * Cleanup Non-Project Issues
 * Removes duplicate, test, and non-MVP related issues from repository
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-Cleanup/1.0.0',
});

class IssueCleanup {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.toDelete = [];
    this.toKeep = [];
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

  isKeeperIssue(issue) {
    const title = issue.title.toLowerCase();
    const body = (issue.body || '').toLowerCase();
    
    // Always keep MVP work items (latest versions)
    if (issue.number >= 156) { // Latest full import batch
      return {
        keep: true,
        reason: 'Latest MVP work items (current batch)'
      };
    }

    // Keep the clean test issues that demonstrate functionality
    if (issue.number >= 152 && issue.number <= 155) {
      return {
        keep: true,
        reason: 'Clean test demonstrations'
      };
    }

    // Keep final test issues that show project integration
    if (issue.number === 121 || issue.number === 122) {
      return {
        keep: true,
        reason: 'Key integration tests'
      };
    }

    // Delete all other issues - they're duplicates, outdated, or deleted
    return {
      keep: false,
      reason: 'Duplicate/outdated/deleted issue'
    };
  }

  async analyzeAllIssues() {
    console.log('🔍 ANALYZING ALL ISSUES FOR CLEANUP');
    console.log('===================================\n');
    
    const allIssues = await this.getAllIssues();
    
    console.log('📊 **ANALYSIS RESULTS**:\n');

    for (const issue of allIssues) {
      const analysis = this.isKeeperIssue(issue);
      
      if (analysis.keep) {
        console.log(`✅ KEEP #${issue.number}: "${issue.title}"`);
        console.log(`    📝 Reason: ${analysis.reason}`);
        this.toKeep.push({
          number: issue.number,
          title: issue.title,
          reason: analysis.reason
        });
      } else {
        console.log(`🗑️  DELETE #${issue.number}: "${issue.title}"`);
        console.log(`    📝 Reason: ${analysis.reason}`);
        this.toDelete.push({
          number: issue.number,
          title: issue.title,
          reason: analysis.reason,
          issue: issue
        });
      }
    }

    console.log('\n📊 **CLEANUP SUMMARY**');
    console.log('======================');
    console.log(`✅ Issues to keep: ${this.toKeep.length}`);
    console.log(`🗑️  Issues to delete: ${this.toDelete.length}`);
    console.log(`📋 Total analyzed: ${allIssues.length}`);

    return {
      toKeep: this.toKeep.length,
      toDelete: this.toDelete.length,
      total: allIssues.length
    };
  }

  async deleteIssues(dryRun = true) {
    if (this.toDelete.length === 0) {
      console.log('\n✅ No issues to delete');
      return 0;
    }

    console.log(`\n🗑️  ${dryRun ? 'DRY RUN: Would delete' : 'DELETING'} ${this.toDelete.length} issues:`);
    
    let deletedCount = 0;

    for (const item of this.toDelete) {
      console.log(`${dryRun ? '🔍' : '🗑️'} #${item.number}: "${item.title}"`);
      console.log(`    📝 Reason: ${item.reason}`);

      if (!dryRun) {
        try {
          // Note: GitHub doesn't allow permanent deletion of issues via API
          // The best we can do is close them and add a label
          await octokit.rest.issues.update({
            owner: this.owner,
            repo: this.repo,
            issue_number: item.number,
            state: 'closed',
            labels: ['cleanup', 'archived']
          });

          // Add a comment explaining the closure
          await octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: item.number,
            body: `🗑️ **Issue archived during project cleanup**\n\n**Reason**: ${item.reason}\n\nThis issue has been closed and archived as part of project cleanup to maintain focus on current MVP work items.\n\n*Automated cleanup by GitHub tooling*`
          });

          deletedCount++;
          console.log(`    ✅ Closed and archived`);

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.log(`    ❌ Failed to close: ${error.message}`);
        }
      }
    }

    return deletedCount;
  }

  async performCleanup(dryRun = true) {
    console.log(`🧹 ${dryRun ? 'DRY RUN - ' : ''}REPOSITORY CLEANUP`);
    console.log('='.repeat(dryRun ? 35 : 20) + '\n');
    
    const analysis = await this.analyzeAllIssues();
    const deletedCount = await this.deleteIssues(dryRun);

    console.log('\n🎯 **FINAL RESULT**');
    console.log('==================');
    
    if (dryRun) {
      console.log('📋 This was a DRY RUN - no changes made');
      console.log(`🔍 Analysis complete: ${analysis.toDelete} issues would be cleaned up`);
      console.log('\n💡 To perform actual cleanup, run with: --force');
    } else {
      console.log(`✅ Successfully processed: ${deletedCount} issues`);
      console.log(`✅ Issues remaining: ${analysis.toKeep} active project issues`);
      console.log(`🧹 Repository cleaned and focused on MVP work`);
    }

    console.log('\n🔗 **VERIFICATION**:');
    console.log(`📋 Repository Issues: https://github.com/${this.owner}/${this.repo}/issues`);
    console.log(`🎯 Project Board: https://github.com/orgs/${this.owner}/projects/2`);

    console.log('\n✅ Cleanup analysis complete!');
    
    return {
      analyzed: analysis.total,
      kept: analysis.toKeep,
      deleted: deletedCount,
      dryRun: dryRun
    };
  }
}

// CLI Interface
async function main() {
  const cleanup = new IssueCleanup();
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  
  if (force) {
    console.log('⚠️  FORCE MODE: Will actually delete issues\n');
  } else {
    console.log('🔍 DRY RUN MODE: Will analyze but not delete\n');
  }

  await cleanup.performCleanup(!force);
}

main().catch(console.error);