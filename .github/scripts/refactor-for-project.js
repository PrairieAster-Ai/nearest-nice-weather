#!/usr/bin/env node

/**
 * Refactor Issues for GitHub Project Integration
 * Configure for NearestNiceWeather.com App Development project
 * Set Sprint 3 as Current Iteration, Sprint 4 as Next Iteration
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-ProjectRefactor/1.0.0',
});

class ProjectRefactor {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
  }

  async refactorForProject() {
    console.log('🔄 Refactoring issues for GitHub Project integration...\n');
    console.log('🎯 Target: NearestNiceWeather.com App Development Project');
    console.log('📅 Current Iteration: Sprint 3');
    console.log('📅 Next Iteration: Sprint 4\n');
    
    try {
      // Step 1: Update all issues with project-specific fields
      await this.updateIssuesForProject();
      
      // Step 2: Configure iteration structure
      await this.configureIterations();
      
      // Step 3: Set up project board columns
      await this.configureProjectColumns();
      
      // Step 4: Update milestones for project integration
      await this.updateMilestonesForProject();
      
      console.log('\n✅ Issues refactored for GitHub Project integration!');
      console.log('📊 Ready for NearestNiceWeather.com App Development project workflow');
      
    } catch (error) {
      console.error('❌ Error during refactoring:', error.message);
    }
  }

  async updateIssuesForProject() {
    console.log('🔧 Updating issues with project-specific metadata...');
    
    // Get all current issues
    const issues = await this.getAllIssues();
    
    const projectUpdates = [
      // Sprint 3 - Current Iteration Issues
      {
        number: 21,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(21), {
            iteration: 'Current (Sprint 3)',
            status: 'In Progress',
            priority: 'High',
            effort: 'Large (20+ story points)',
            projectColumn: 'In Progress',
            businessValue: 'Critical - Core MVP completion'
          })
        }
      },
      {
        number: 28,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(28), {
            iteration: 'Current (Sprint 3)',
            status: 'In Progress',
            priority: 'High',
            effort: 'Medium (8-15 story points)',
            projectColumn: 'In Progress',
            businessValue: 'High - Database foundation'
          })
        }
      },
      {
        number: 29,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(29), {
            iteration: 'Current (Sprint 3)',
            status: 'In Progress',
            priority: 'High',
            effort: 'Medium (8-15 story points)',
            projectColumn: 'In Progress',
            businessValue: 'High - Weather data core feature'
          })
        }
      },
      {
        number: 30,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(30), {
            iteration: 'Current (Sprint 3)',
            status: 'Ready for Development',
            priority: 'High',
            effort: 'Small (3-8 story points)',
            projectColumn: 'Ready',
            businessValue: 'High - Minnesota market focus'
          })
        }
      },
      {
        number: 31,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(31), {
            iteration: 'Current (Sprint 3)',
            status: 'Ready for Development',
            priority: 'High',
            effort: 'Small (3-8 story points)',
            projectColumn: 'Ready',
            businessValue: 'Critical - Core weather feature'
          })
        }
      },
      {
        number: 32,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(32), {
            iteration: 'Current (Sprint 3)',
            status: 'Ready for Development',
            priority: 'Medium',
            effort: 'Small (1-3 story points)',
            projectColumn: 'Ready',
            businessValue: 'Medium - Performance optimization'
          })
        }
      },
      
      // Sprint 4 - Next Iteration Issues
      {
        number: 22,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(22), {
            iteration: 'Next (Sprint 4)',
            status: 'Planned',
            priority: 'High',
            effort: 'Large (20+ story points)',
            projectColumn: 'Backlog',
            businessValue: 'Critical - Revenue and launch'
          })
        }
      },
      
      // Completed Sprints - Archive Status
      {
        number: 19,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(19), {
            iteration: 'Completed (Sprint 1)',
            status: 'Done',
            priority: 'High',
            effort: 'Large (20+ story points)',
            projectColumn: 'Done',
            businessValue: 'Foundation - User feedback system'
          })
        }
      },
      {
        number: 20,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(20), {
            iteration: 'Completed (Sprint 2)',
            status: 'Done',
            priority: 'High',
            effort: 'Large (20+ story points)',
            projectColumn: 'Done',
            businessValue: 'Foundation - Interactive mapping'
          })
        }
      },
      
      // Capabilities - Ongoing across iterations
      {
        number: 23,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(23), {
            iteration: 'Current (Sprint 3)',
            status: 'In Progress',
            priority: 'High',
            effort: 'Ongoing capability',
            projectColumn: 'In Progress',
            businessValue: 'Core - User experience principle'
          })
        }
      },
      {
        number: 24,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(24), {
            iteration: 'Current (Sprint 3)',
            status: 'In Progress',
            priority: 'High',
            effort: 'Ongoing capability',
            projectColumn: 'In Progress',
            businessValue: 'Core - Weather intelligence'
          })
        }
      },
      {
        number: 25,
        updates: {
          body: this.addProjectFields(await this.getIssueBody(25), {
            iteration: 'Completed (Sprint 2)',
            status: 'Done',
            priority: 'High',
            effort: 'Ongoing capability',
            projectColumn: 'Done',
            businessValue: 'Core - Location discovery'
          })
        }
      }
    ];

    for (const update of projectUpdates) {
      await this.updateIssue(update.number, update.updates);
    }
  }

  async configureIterations() {
    console.log('\n📅 Configuring iteration structure...');
    
    // Update milestone descriptions to include iteration info
    const milestoneUpdates = [
      {
        number: 5, // Sprint 1
        updates: {
          description: 'COMPLETED ✅ - Sprint 1 delivered user feedback system and UI foundation. All deliverables successful. Status: DONE'
        }
      },
      {
        number: 6, // Sprint 2  
        updates: {
          description: 'COMPLETED ✅ - Sprint 2 delivered interactive map interface with Leaflet.js and mobile optimization. Status: DONE'
        }
      },
      {
        number: 7, // Sprint 3
        updates: {
          title: 'Sprint 3: Current Iteration 🔄',
          description: 'CURRENT ITERATION 🔄 - Database schema production deployment, weather API integration, Minnesota POI data, and performance optimization. Target: MVP 75% completion'
        }
      },
      {
        number: 8, // Sprint 4
        updates: {
          title: 'Sprint 4: Next Iteration 📅',
          description: 'NEXT ITERATION 📅 - Revenue integration with Google AdSense, user analytics, user testing protocols, and launch validation. Target: MVP 100% completion and launch'
        }
      }
    ];

    for (const update of milestoneUpdates) {
      await this.updateMilestone(update.number, update.updates);
    }
  }

  async configureProjectColumns() {
    console.log('\n📋 Configuring project board structure...');
    
    // Note: This would typically require GraphQL API for Projects v2
    // For now, we'll document the recommended structure
    console.log('📊 Recommended GitHub Project columns:');
    console.log('  1. 📥 Backlog (Next Iteration items)');
    console.log('  2. 🎯 Ready (Current Iteration, ready to start)');
    console.log('  3. 🔄 In Progress (Current Iteration, active work)');
    console.log('  4. 👀 Review (Current Iteration, in review)');
    console.log('  5. ✅ Done (Completed items, any iteration)');
    
    console.log('\n🎯 Current Iteration (Sprint 3) Issues:');
    console.log('  - #21: Sprint 3 (In Progress)');
    console.log('  - #28, #29: Epics (In Progress)');
    console.log('  - #30, #31, #32: Stories/Tasks (Ready)');
    
    console.log('\n📅 Next Iteration (Sprint 4) Issues:');
    console.log('  - #22: Sprint 4 (Backlog)');
  }

  async updateMilestonesForProject() {
    console.log('\n🎯 Updating milestones for project integration...');
    
    // Close completed milestones
    await this.updateMilestone(5, { state: 'closed' }); // Sprint 1
    await this.updateMilestone(6, { state: 'closed' }); // Sprint 2
    
    // Keep current and next open
    console.log('  ✅ Sprint 1 & 2 milestones set to closed (completed)');
    console.log('  🔄 Sprint 3 milestone remains open (current iteration)');
    console.log('  📅 Sprint 4 milestone remains open (next iteration)');
  }

  addProjectFields(originalBody, projectData) {
    return `${originalBody}

## 📊 **GitHub Project Integration**

### **Project Fields**
- **Project**: NearestNiceWeather.com App Development
- **Iteration**: ${projectData.iteration}
- **Status**: ${projectData.status}
- **Priority**: ${projectData.priority}
- **Effort**: ${projectData.effort}
- **Business Value**: ${projectData.businessValue}

### **Project Board**
- **Current Column**: ${projectData.projectColumn}
- **Workflow Stage**: ${this.getWorkflowStage(projectData.status)}
- **Iteration Planning**: ${this.getIterationPlanning(projectData.iteration)}

### **Sprint Context**
- **Current Sprint**: Sprint 3 (Database + Weather API)
- **Next Sprint**: Sprint 4 (Revenue + Launch)
- **MVP Progress**: ${this.getMVPProgress(projectData.iteration)}

---
*🔧 Configured for NearestNiceWeather.com App Development Project*`;
  }

  getWorkflowStage(status) {
    const stages = {
      'Planned': 'Planning & Design',
      'Ready for Development': 'Ready to Start',
      'In Progress': 'Active Development',
      'Review': 'Code Review & Testing',
      'Done': 'Completed & Deployed'
    };
    return stages[status] || 'Unknown';
  }

  getIterationPlanning(iteration) {
    const planning = {
      'Current (Sprint 3)': 'Focus on completion by milestone deadline',
      'Next (Sprint 4)': 'Planned for next iteration cycle',
      'Completed (Sprint 1)': 'Successfully delivered in past iteration',
      'Completed (Sprint 2)': 'Successfully delivered in past iteration'
    };
    return planning[iteration] || 'TBD';
  }

  getMVPProgress(iteration) {
    const progress = {
      'Current (Sprint 3)': '50% → 75% (Target)',
      'Next (Sprint 4)': '75% → 100% (Launch Ready)',
      'Completed (Sprint 1)': '0% → 25% (Completed)',
      'Completed (Sprint 2)': '25% → 50% (Completed)'
    };
    return progress[iteration] || 'TBD';
  }

  async getAllIssues() {
    const response = await octokit.rest.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: 'open',
      per_page: 100,
    });
    return response.data;
  }

  async getIssueBody(issueNumber) {
    try {
      const response = await octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return response.data.body || '';
    } catch (error) {
      console.error(`Failed to get body for issue #${issueNumber}:`, error.message);
      return '';
    }
  }

  async updateIssue(issueNumber, updates) {
    try {
      console.log(`  🔄 Updating issue #${issueNumber} for project integration...`);
      await octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...updates,
      });
      console.log(`  ✅ Issue #${issueNumber} updated`);
    } catch (error) {
      console.error(`  ❌ Failed to update issue #${issueNumber}:`, error.message);
    }
  }

  async updateMilestone(milestoneNumber, updates) {
    try {
      console.log(`  🔄 Updating milestone #${milestoneNumber}...`);
      await octokit.rest.issues.updateMilestone({
        owner: this.owner,
        repo: this.repo,
        milestone_number: milestoneNumber,
        ...updates,
      });
      console.log(`  ✅ Milestone #${milestoneNumber} updated`);
    } catch (error) {
      console.error(`  ❌ Failed to update milestone #${milestoneNumber}:`, error.message);
    }
  }

  async generateProjectSummary() {
    console.log('\n📊 GitHub Project Integration Summary');
    console.log('====================================\n');
    
    console.log('🎯 **PROJECT SETUP**');
    console.log('Project: NearestNiceWeather.com App Development');
    console.log('Structure: Iteration-based workflow with sprint milestones\n');
    
    console.log('📅 **ITERATION STRUCTURE**');
    console.log('Current Iteration: Sprint 3 (Database + Weather API)');
    console.log('  - Issues: #21, #28, #29, #30, #31, #32');
    console.log('  - Status: In Progress (50% MVP → 75% MVP)');
    console.log('  - Focus: Database deployment + OpenWeather integration\n');
    
    console.log('Next Iteration: Sprint 4 (Revenue + Launch)');
    console.log('  - Issues: #22');
    console.log('  - Status: Planned (75% MVP → 100% MVP)');
    console.log('  - Focus: Google AdSense + user testing + launch\n');
    
    console.log('📋 **PROJECT BOARD COLUMNS**');
    console.log('1. Backlog: Sprint 4 items waiting for current sprint completion');
    console.log('2. Ready: Sprint 3 items ready to start development');
    console.log('3. In Progress: Sprint 3 items currently being worked on');
    console.log('4. Review: Items completed and in review/testing');
    console.log('5. Done: Completed items from any iteration\n');
    
    console.log('🎯 **CURRENT FOCUS**');
    console.log('Priority: Complete Sprint 3 (Current Iteration)');
    console.log('Key Deliverables:');
    console.log('  - Minnesota POI database deployment');
    console.log('  - OpenWeather API integration with caching');
    console.log('  - Performance optimization');
    console.log('Target: 75% MVP completion for Sprint 4 readiness\n');
    
    console.log('✅ Ready for GitHub Project workflow management!');
  }
}

// CLI Interface
async function main() {
  const refactor = new ProjectRefactor();
  
  await refactor.refactorForProject();
  await refactor.generateProjectSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProjectRefactor };