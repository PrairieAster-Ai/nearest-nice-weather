#!/usr/bin/env node

/**
 * Test Work Item Type field assignment
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-TypeTest/1.0.0',
});

async function testWorkItemType() {
  console.log('🧪 Testing Work Item Type Field Assignment...\n');
  
  try {
    // Get project field configuration
    const projectQuery = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
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
      owner: REPO_OWNER,
      number: PROJECT_NUMBER
    });

    const project = projectData.organization.projectV2;
    const projectId = project.id;
    
    // Find the Work Item Type field
    const workItemTypeField = project.fields.nodes.find(
      field => field.name === 'Work Item Type'
    );
    
    if (!workItemTypeField) {
      console.error('❌ Work Item Type field not found');
      return;
    }
    
    console.log('✅ Found Work Item Type field:');
    console.log(`  Field ID: ${workItemTypeField.id}`);
    console.log('  Options:');
    workItemTypeField.options.forEach(option => {
      console.log(`    - ${option.name} (${option.id})`);
    });
    
    // Create test Epic
    const testIssue = await octokit.rest.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: 'Epic: Test Work Item Type Assignment',
      body: 'This is a test epic to verify Work Item Type field assignment.',
      labels: ['type: epic', 'testing']
    });
    
    console.log(`\n✅ Created test issue: #${testIssue.data.number}`);
    
    // Add to project
    const addMutation = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {
          projectId: $projectId,
          contentId: $contentId
        }) {
          item {
            id
          }
        }
      }
    `;

    const addResult = await octokit.graphql(addMutation, {
      projectId: projectId,
      contentId: testIssue.data.node_id
    });

    const itemId = addResult.addProjectV2ItemById.item.id;
    console.log(`✅ Added to project with item ID: ${itemId}`);
    
    // Set Work Item Type to "Epic"
    const epicOption = workItemTypeField.options.find(opt => opt.name === 'Epic');
    
    if (epicOption) {
      const typeMutation = `
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
      
      await octokit.graphql(typeMutation, {
        projectId: projectId,
        itemId: itemId,
        fieldId: workItemTypeField.id,
        optionId: epicOption.id
      });
      
      console.log(`✅ Set Work Item Type to: Epic`);
    }
    
    console.log('\n🎉 Test successful! Work Item Type field assignment works.');
    console.log(`🔗 View in project: https://github.com/orgs/${REPO_OWNER}/projects/${PROJECT_NUMBER}`);
    console.log('   ⚠️  Check that the issue shows as "Epic" type, not "Feature"');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.errors) {
      error.errors.forEach(err => console.error('  -', err.message));
    }
  }
}

testWorkItemType().catch(console.error);