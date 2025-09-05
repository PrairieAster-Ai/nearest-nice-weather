#!/usr/bin/env node

/**
 * Check GitHub Issue Templates Status
 * Verifies that issue templates are active on GitHub
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-TemplateChecker/1.0.0',
});

async function checkTemplates() {
  console.log('🔍 CHECKING GITHUB ISSUE TEMPLATES STATUS');
  console.log('=========================================\n');

  try {
    // Check if .github/ISSUE_TEMPLATE directory exists on GitHub
    const templateDir = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: '.github/ISSUE_TEMPLATE'
    });

    console.log('📁 Template directory found on GitHub!\n');
    console.log('📋 Templates available:');

    if (Array.isArray(templateDir.data)) {
      templateDir.data.forEach(file => {
        console.log(`  ✅ ${file.name}`);
      });
    }

    console.log('\n🎯 **NEXT STEPS TO TEST:**');
    console.log('1. Visit: https://github.com/PrairieAster-Ai/nearest-nice-weather/issues/new/choose');
    console.log('2. You should see "Story", "Epic", "Capability" options');
    console.log('3. Instead of "Bug", "Feature", "Task"');

    console.log('\n✅ Issue templates are now live on GitHub!');

  } catch (error) {
    if (error.status === 404) {
      console.log('❌ Template directory not found on GitHub');
      console.log('   The templates may not have been pushed yet.');
    } else {
      console.log('❌ Error checking templates:', error.message);
    }
  }
}

checkTemplates().catch(console.error);
