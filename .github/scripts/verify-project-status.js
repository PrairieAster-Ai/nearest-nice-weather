#!/usr/bin/env node

/**
 * Verify Project Status
 * Quick check of current project state after WBS issue addition
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-StatusCheck/1.0.0',
});

async function verifyProjectStatus() {
  console.log('🔍 VERIFYING PROJECT STATUS AFTER WBS ADDITION');
  console.log('===============================================\n');

  try {
    // Get current project items
    const projectQuery = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            title
            items(first: 100) {
              totalCount
              nodes {
                content {
                  ... on Issue {
                    number
                    title
                    state
                  }
                }
              }
            }
          }
        }
      }
    `;

    const projectData = await octokit.graphql(projectQuery, {
      owner: REPO_OWNER,
      number: PROJECT_NUMBER
    });

    const project = projectData.organization.projectV2;
    const items = project.items.nodes;

    console.log(`✅ Project: ${project.title}`);
    console.log(`📊 Total Items in Project: ${project.items.totalCount}\n`);

    // Categorize by work item type
    const capabilities = [];
    const epics = [];
    const stories = [];
    const other = [];

    items.forEach(item => {
      if (item.content && item.content.title) {
        const title = item.content.title;
        const number = item.content.number;
        const state = item.content.state;

        if (title.startsWith('Capability:')) {
          capabilities.push({ number, title, state });
        } else if (title.startsWith('Epic:')) {
          epics.push({ number, title, state });
        } else if (title.startsWith('Story:')) {
          stories.push({ number, title, state });
        } else {
          other.push({ number, title, state });
        }
      }
    });

    console.log('📋 **PROJECT BREAKDOWN**:');
    console.log(`  🌟 Capabilities: ${capabilities.length}`);
    console.log(`  📦 Epics: ${epics.length}`);
    console.log(`  👤 Stories: ${stories.length}`);
    console.log(`  🔧 Other: ${other.length}\n`);

    // Show recent additions (likely the WBS issues)
    const sortedItems = items
      .filter(item => item.content && item.content.number)
      .map(item => ({
        number: item.content.number,
        title: item.content.title,
        state: item.content.state
      }))
      .sort((a, b) => a.number - b.number);

    console.log('📈 **RECENT ADDITIONS** (by issue number):');
    const recentItems = sortedItems.filter(item => item.number >= 37 && item.number <= 107);

    if (recentItems.length > 0) {
      console.log(`✅ Found ${recentItems.length} items from WBS range (#37-#107):`);
      recentItems.slice(0, 10).forEach(item => {
        const stateIcon = item.state === 'open' ? '🔓' : '🔒';
        console.log(`  ${stateIcon} #${item.number}: ${item.title}`);
      });

      if (recentItems.length > 10) {
        console.log(`  ... and ${recentItems.length - 10} more`);
      }
    } else {
      console.log('❌ No WBS items found in project (addition may have failed)');
    }

    console.log('\n🔗 **VERIFICATION LINKS**:');
    console.log(`📋 Project Board: https://github.com/orgs/${REPO_OWNER}/projects/${PROJECT_NUMBER}`);
    console.log(`📋 Repository Issues: https://github.com/${REPO_OWNER}/nearest-nice-weather/issues`);

    console.log('\n📊 **SUMMARY**:');
    console.log(`📋 Total Project Items: ${project.items.totalCount}`);
    console.log(`🎯 WBS Items Added: ${recentItems.length}`);
    console.log(`✅ Project Integration: ${recentItems.length > 0 ? 'SUCCESS' : 'NEEDS ATTENTION'}`);

  } catch (error) {
    console.error('❌ Failed to verify project status:', error.message);
  }
}

verifyProjectStatus().catch(console.error);
