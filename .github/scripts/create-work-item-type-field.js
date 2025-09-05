#!/usr/bin/env node

/**
 * Create "Work Item Type" Field in GitHub Project
 * Creates custom field with Story/Bug/Epic/Capability options
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-FieldCreator/1.0.0',
});

async function createWorkItemTypeField() {
  console.log('🔧 Creating "Work Item Type" Field in GitHub Project...\n');

  try {
    // First, get the project ID
    const projectQuery = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            title
          }
        }
      }
    `;

    const projectData = await octokit.graphql(projectQuery, {
      owner: REPO_OWNER,
      number: PROJECT_NUMBER
    });

    const projectId = projectData.organization.projectV2.id;
    console.log(`✅ Found project: ${projectData.organization.projectV2.title}`);
    console.log(`✅ Project ID: ${projectId}\n`);

    // Create the "Work Item Type" field with options
    console.log('🎯 Creating "Work Item Type" field with options...');

    const optionData = [
      { name: 'Story', description: 'User-focused work item (3-13 story points)', color: 'BLUE' },
      { name: 'Bug', description: 'Defects and issues to fix', color: 'RED' },
      { name: 'Epic', description: 'Major work container (20+ story points)', color: 'PURPLE' },
      { name: 'Capability', description: 'Cross-sprint platform capability', color: 'GREEN' }
    ];

    const createFieldMutation = `
      mutation($projectId: ID!, $name: String!, $dataType: ProjectV2CustomFieldType!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
        createProjectV2Field(input: {
          projectId: $projectId
          name: $name
          dataType: $dataType
          singleSelectOptions: $options
        }) {
          projectV2Field {
            ... on ProjectV2SingleSelectField {
              id
              name
              dataType
              options {
                id
                name
                color
                description
              }
            }
          }
        }
      }
    `;

    const options = optionData;

    const fieldResult = await octokit.graphql(createFieldMutation, {
      projectId: projectId,
      name: 'Work Item Type',
      dataType: 'SINGLE_SELECT',
      options: options
    });

    const field = fieldResult.createProjectV2Field.projectV2Field;
    const fieldId = field.id;
    const createdOptions = field.options;

    console.log(`✅ Created field: Work Item Type (${fieldId})`);
    createdOptions.forEach(option => {
      console.log(`  ✅ Added option: ${option.name} (${option.id})`);
    });

    console.log('\n🎉 Successfully created "Work Item Type" field!');
    console.log('\n📊 **FIELD SUMMARY**:');
    console.log(`  📝 Field Name: Work Item Type`);
    console.log(`  🆔 Field ID: ${fieldId}`);
    console.log(`  🎯 Options Created: ${createdOptions.length}`);

    createdOptions.forEach(option => {
      console.log(`    - ${option.name} (${option.id})`);
    });

    console.log('\n🔗 **PROJECT LINKS**:');
    console.log(`  📋 Project Board: https://github.com/orgs/${REPO_OWNER}/projects/${PROJECT_NUMBER}`);
    console.log(`  ⚙️  Project Settings: https://github.com/orgs/${REPO_OWNER}/projects/${PROJECT_NUMBER}/settings`);

    console.log('\n✅ Ready for next step: Setting issue relationships');

    return {
      fieldId,
      options: createdOptions,
      projectId
    };

  } catch (error) {
    console.error('❌ Failed to create field:', error.message);
    if (error.errors) {
      error.errors.forEach(err => console.error('  -', err.message));
    }
    throw error;
  }
}

// Run the field creation
createWorkItemTypeField().catch(console.error);
