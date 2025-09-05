#!/usr/bin/env node

/**
 * Test GitHub Projects v2 API Integration
 * Simple test to verify project connection and field mapping
 */

import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const PROJECT_NUMBER = 2;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-ProjectTest/1.0.0',
});

async function testProjectConnection() {
  console.log('🔧 Testing GitHub Project v2 Connection...\n');
  
  try {
    // Get project ID and fields
    const projectQuery = `
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            title
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
                ... on ProjectV2IterationField {
                  id
                  name
                  configuration {
                    iterations {
                      id
                      title
                    }
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
    console.log(`✅ Project Found: ${project.title}`);
    console.log(`✅ Project ID: ${project.id}\n`);
    
    console.log('📋 **PROJECT FIELDS**:');
    const fields = project.fields.nodes;
    for (const field of fields) {
      console.log(`  • ${field.name} (${field.id})`);
      if (field.options) {
        field.options.forEach(option => {
          console.log(`    - ${option.name} (${option.id})`);
        });
      }
      if (field.configuration?.iterations) {
        field.configuration.iterations.forEach(iteration => {
          console.log(`    - ${iteration.title} (${iteration.id})`);
        });
      }
    }
    
    console.log('\n✅ Project connection test successful!');
    
  } catch (error) {
    console.error('❌ Project connection failed:', error.message);
  }
}

testProjectConnection().catch(console.error);