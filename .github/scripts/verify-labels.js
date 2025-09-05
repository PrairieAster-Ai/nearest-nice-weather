#!/usr/bin/env node

/**
 * GitHub Labels Verification Script
 * Verifies the organized label system is correctly implemented
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-LabelVerification/1.0.0',
});

class LabelVerification {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
  }

  async verifyLabels() {
    console.log('✅ GITHUB LABELS VERIFICATION');
    console.log('=============================\n');
    console.log(`📦 Repository: ${this.owner}/${this.repo}\n`);

    try {
      const response = await octokit.rest.issues.listLabelsForRepo({
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
      });

      const currentLabels = response.data;
      console.log(`📊 Total labels found: ${currentLabels.length}\n`);

      // Group labels by category
      const labelCategories = {
        'Type Labels': [],
        'Technical Labels': [],
        'Workflow Labels': [],
        'Issue Type Labels': [],
        'Size Labels': [],
        'Priority Labels': [],
        'Other Labels': []
      };

      currentLabels.forEach(label => {
        if (label.name.startsWith('type: ')) {
          labelCategories['Type Labels'].push(label);
        } else if (['database', 'weather-api', 'frontend', 'backend', 'mobile', 'analytics', 'revenue'].includes(label.name)) {
          labelCategories['Technical Labels'].push(label);
        } else if (['blocked', 'urgent', 'needs-review'].includes(label.name)) {
          labelCategories['Workflow Labels'].push(label);
        } else if (['bug', 'enhancement', 'documentation', 'good first issue', 'help wanted'].includes(label.name)) {
          labelCategories['Issue Type Labels'].push(label);
        } else if (label.name.startsWith('size: ')) {
          labelCategories['Size Labels'].push(label);
        } else if (label.name.startsWith('priority: ')) {
          labelCategories['Priority Labels'].push(label);
        } else {
          labelCategories['Other Labels'].push(label);
        }
      });

      // Display organized labels
      Object.entries(labelCategories).forEach(([category, labels]) => {
        if (labels.length > 0) {
          console.log(`**${category}** (${labels.length}):`);
          labels.forEach(label => {
            console.log(`  🏷️  \`${label.name}\` (#${label.color}) - ${label.description || 'No description'}`);
          });
          console.log('');
        }
      });

      // Verification summary
      const expectedCounts = {
        'Type Labels': 3,
        'Technical Labels': 7,
        'Workflow Labels': 3,
        'Issue Type Labels': 5,
        'Size Labels': 5,
        'Priority Labels': 4
      };

      console.log('🎯 **VERIFICATION SUMMARY**:');
      let allGood = true;

      Object.entries(expectedCounts).forEach(([category, expected]) => {
        const actual = labelCategories[category].length;
        const status = actual === expected ? '✅' : '❌';
        if (actual !== expected) allGood = false;
        console.log(`  ${status} ${category}: ${actual}/${expected}`);
      });

      if (allGood) {
        console.log('\n🎉 **ALL LABEL CATEGORIES VERIFIED!**');
        console.log('The organized label system is correctly implemented.');
      } else {
        console.log('\n⚠️  **SOME LABELS MISSING OR EXTRA**');
        console.log('Review the counts above and check the label configuration.');
      }

      console.log(`\n🔗 **View Labels**: https://github.com/${this.owner}/${this.repo}/labels`);

    } catch (error) {
      console.error('❌ Error verifying labels:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const verification = new LabelVerification();
  await verification.verifyLabels();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LabelVerification };
