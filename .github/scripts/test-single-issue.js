#!/usr/bin/env node

/**
 * Test adding a single issue to GitHub Project v2
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-SingleTest/1.0.0',
});

async function testSingleIssueAddition() {
  console.log('🧪 Testing Single Issue Addition to Project...\n');

  try {
    // Create a test issue first
    const testIssue = await octokit.rest.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: 'TEST: Project Integration Test',
      body: 'This is a test issue to verify project integration works properly.',
      labels: ['type: story', 'testing']
    });

    console.log(`✅ Created test issue: #${testIssue.data.number}`);

    // Get project data
    const projectQuery = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            fields(first: 20) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                }
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

    // Map field IDs
    const fieldIds = {};
    for (const field of project.fields.nodes) {
      fieldIds[field.name] = {
        id: field.id,
        options: field.options || []
      };
    }

    console.log(`✅ Project ID: ${projectId}`);

    // Add issue to project
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

    // Set Status to "Ready"
    const statusField = fieldIds['Status'];
    const readyOption = statusField.options.find(opt => opt.name === 'Ready');

    if (readyOption) {
      const statusMutation = `
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

      await octokit.graphql(statusMutation, {
        projectId: projectId,
        itemId: itemId,
        fieldId: statusField.id,
        optionId: readyOption.id
      });

      console.log(`✅ Set status to: Ready`);
    }

    console.log('\n🎉 Test successful! Issue added to project with status set.');
    console.log(`🔗 View in project: https://github.com/orgs/${REPO_OWNER}/projects/${PROJECT_NUMBER}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.errors) {
      error.errors.forEach(err => console.error('  -', err.message));
    }
  }
}

testSingleIssueAddition().catch(console.error);
