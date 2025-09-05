#!/usr/bin/env node

/**
 * GitHub Project Configurator
 * Optimizes all issues for GitHub Projects v2 workflow
 * Adds custom fields, relationships, and project-specific metadata
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-ProjectConfigurator/1.0.0',
});

class ProjectConfigurator {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
  }

  async configureAllIssues() {
    console.log('🔧 Configuring all issues for GitHub Project optimization...\n');
    
    try {
      // Get all issues
      const issues = await this.getAllIssues();
      console.log(`📋 Found ${issues.length} issues to configure\n`);

      // Configure each issue type
      await this.configureSprints(issues);
      await this.configureCapabilities(issues);
      await this.configureEpics(issues);
      await this.configureStories(issues);
      await this.configureTasks(issues);
      await this.configurePostMVP(issues);

      console.log('\n✅ All issues configured for GitHub Project workflow!');
      
    } catch (error) {
      console.error('❌ Error configuring issues:', error.message);
    }
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

  async updateIssue(issueNumber, updates) {
    try {
      console.log(`🔄 Updating issue #${issueNumber}...`);
      await octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...updates,
      });
      console.log(`✅ Issue #${issueNumber} updated`);
    } catch (error) {
      console.error(`❌ Failed to update issue #${issueNumber}:`, error.message);
    }
  }

  async configureSprints(issues) {
    console.log('🏃 Configuring Sprint issues...');
    
    const sprints = issues.filter(issue => 
      issue.labels.some(label => label.name === 'sprint')
    );

    for (const sprint of sprints) {
      const updates = {
        body: this.enhanceSprintBody(sprint),
        labels: [...new Set([
          ...sprint.labels.map(l => l.name),
          'type:sprint',
          'priority:high',
          'epic-parent'
        ])]
      };
      
      await this.updateIssue(sprint.number, updates);
    }
  }

  async configureCapabilities(issues) {
    console.log('🎯 Configuring Capability issues...');
    
    const capabilities = issues.filter(issue => 
      issue.labels.some(label => label.name === 'capability')
    );

    for (const capability of capabilities) {
      const updates = {
        body: this.enhanceCapabilityBody(capability),
        labels: [...new Set([
          ...capability.labels.map(l => l.name),
          'type:capability',
          'priority:high',
          'has-children'
        ])]
      };
      
      await this.updateIssue(capability.number, updates);
    }
  }

  async configureEpics(issues) {
    console.log('📚 Configuring Epic issues...');
    
    const epics = issues.filter(issue => 
      issue.labels.some(label => label.name === 'epic')
    );

    for (const epic of epics) {
      const updates = {
        body: this.enhanceEpicBody(epic),
        labels: [...new Set([
          ...epic.labels.map(l => l.name),
          'type:epic',
          'priority:high',
          'has-children'
        ])]
      };
      
      await this.updateIssue(epic.number, updates);
    }
  }

  async configureStories(issues) {
    console.log('📖 Configuring Story issues...');
    
    const stories = issues.filter(issue => 
      issue.labels.some(label => label.name === 'story')
    );

    for (const story of stories) {
      const updates = {
        body: this.enhanceStoryBody(story),
        labels: [...new Set([
          ...story.labels.map(l => l.name),
          'type:story',
          'priority:medium',
          'has-children'
        ])]
      };
      
      await this.updateIssue(story.number, updates);
    }
  }

  async configureTasks(issues) {
    console.log('✅ Configuring Task issues...');
    
    const tasks = issues.filter(issue => 
      issue.labels.some(label => label.name === 'task')
    );

    for (const task of tasks) {
      const updates = {
        body: this.enhanceTaskBody(task),
        labels: [...new Set([
          ...task.labels.map(l => l.name),
          'type:task',
          'priority:medium',
          'implementation'
        ])]
      };
      
      await this.updateIssue(task.number, updates);
    }
  }

  async configurePostMVP(issues) {
    console.log('🚫 Configuring Post-MVP issues...');
    
    const postMvp = issues.filter(issue => 
      issue.labels.some(label => label.name === 'post-mvp')
    );

    for (const issue of postMvp) {
      const updates = {
        body: this.enhancePostMVPBody(issue),
        labels: [...new Set([
          ...issue.labels.map(l => l.name),
          'type:future',
          'priority:low',
          'status:blocked',
          'phase:post-mvp'
        ])]
      };
      
      await this.updateIssue(issue.number, updates);
    }
  }

  enhanceSprintBody(sprint) {
    const originalBody = sprint.body || '';
    
    return `${originalBody}

## 📊 **GitHub Project Fields**

- **Type**: Sprint
- **Priority**: High
- **Status**: In Progress
- **Phase**: MVP Development
- **Effort**: Epic (40+ story points)
- **Business Impact**: Revenue Critical

## 🔗 **Project Relationships**

- **Contains**: Multiple Capabilities and Epics
- **Depends On**: Previous sprint completion
- **Blocks**: Future sprint planning
- **Milestone**: ${sprint.milestone ? sprint.milestone.title : 'Assigned to sprint milestone'}

## 📈 **Project Metrics**

- **Completion Criteria**: All child issues resolved
- **Success Metrics**: Demo-ready features
- **Timeline**: Sprint duration (2-3 weeks)
- **Risk Level**: Medium (managed dependencies)

---
*🔧 Optimized for GitHub Projects v2 workflow*`;
  }

  enhanceCapabilityBody(capability) {
    const originalBody = capability.body || '';
    
    return `${originalBody}

## 📊 **GitHub Project Fields**

- **Type**: Capability
- **Priority**: High
- **Status**: Planning
- **Phase**: MVP Development
- **Effort**: Large (20+ story points)
- **Business Impact**: Feature Critical

## 🔗 **Project Relationships**

- **Parent Sprint**: Referenced in sprint issue
- **Contains**: Multiple Epics
- **Enables**: Business value delivery
- **Dependencies**: Authentication, Infrastructure

## 📈 **Project Metrics**

- **Completion Criteria**: All epics completed and demo-ready
- **Success Metrics**: User acceptance and business KPIs met
- **Timeline**: Sprint duration
- **Risk Level**: Medium (feature complexity)

---
*🔧 Optimized for GitHub Projects v2 workflow*`;
  }

  enhanceEpicBody(epic) {
    const originalBody = epic.body || '';
    
    return `${originalBody}

## 📊 **GitHub Project Fields**

- **Type**: Epic
- **Priority**: High
- **Status**: Ready for Development
- **Phase**: MVP Implementation
- **Effort**: Medium (8-15 story points)
- **Business Impact**: Feature Component

## 🔗 **Project Relationships**

- **Parent Capability**: Referenced capability issue
- **Contains**: Multiple User Stories
- **Implements**: Specific business functionality
- **Dependencies**: Technical prerequisites

## 📈 **Project Metrics**

- **Completion Criteria**: All user stories implemented and tested
- **Success Metrics**: Technical acceptance criteria met
- **Timeline**: 1-2 weeks
- **Risk Level**: Low-Medium (standard development)

---
*🔧 Optimized for GitHub Projects v2 workflow*`;
  }

  enhanceStoryBody(story) {
    const originalBody = story.body || '';
    
    return `${originalBody}

## 📊 **GitHub Project Fields**

- **Type**: User Story
- **Priority**: Medium
- **Status**: Ready for Development
- **Phase**: MVP Implementation
- **Effort**: Small (3-8 story points)
- **Business Impact**: User Value

## 🔗 **Project Relationships**

- **Parent Epic**: Referenced epic issue
- **Contains**: Multiple Tasks
- **Delivers**: User-facing functionality
- **Dependencies**: Technical tasks

## 📈 **Project Metrics**

- **Completion Criteria**: Acceptance criteria met and user tested
- **Success Metrics**: User can complete intended workflow
- **Timeline**: 3-5 days
- **Risk Level**: Low (well-defined scope)

---
*🔧 Optimized for GitHub Projects v2 workflow*`;
  }

  enhanceTaskBody(task) {
    const originalBody = task.body || '';
    
    return `${originalBody}

## 📊 **GitHub Project Fields**

- **Type**: Task
- **Priority**: Medium
- **Status**: Ready for Development
- **Phase**: MVP Implementation
- **Effort**: Small (1-3 story points)
- **Business Impact**: Technical Implementation

## 🔗 **Project Relationships**

- **Parent Story**: Referenced story issue
- **Implements**: Specific technical requirement
- **Deliverable**: Code, tests, documentation
- **Dependencies**: Technical prerequisites

## 📈 **Project Metrics**

- **Completion Criteria**: Code implemented, tested, and merged
- **Success Metrics**: Technical functionality working
- **Timeline**: 1-2 days
- **Risk Level**: Low (specific implementation)

## ✅ **Implementation Checklist**

- [ ] Technical implementation completed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Merged to main branch

---
*🔧 Optimized for GitHub Projects v2 workflow*`;
  }

  enhancePostMVPBody(issue) {
    const originalBody = issue.body || '';
    
    return `${originalBody}

## 📊 **GitHub Project Fields**

- **Type**: Future Feature
- **Priority**: Low
- **Status**: Blocked (Post-MVP)
- **Phase**: Future Development
- **Effort**: TBD (requires analysis)
- **Business Impact**: Growth/Scale

## 🔗 **Project Relationships**

- **Blocked By**: MVP completion
- **Future Phase**: Post-MVP roadmap
- **Strategic Value**: Long-term growth
- **Dependencies**: MVP success metrics

## 📈 **Project Metrics**

- **Earliest Start**: After MVP launch + validation
- **Prerequisites**: Customer feedback, market validation
- **Timeline**: TBD (6+ months post-MVP)
- **Risk Level**: High (unvalidated assumptions)

## 🚫 **Current Restrictions**

- **DO NOT START**: Until MVP is complete and successful
- **NO RESOURCES**: Allocated to MVP work only
- **VALIDATION REQUIRED**: Customer demand before development
- **MARKET TIMING**: Dependent on MVP market success

---
*🔧 Configured for GitHub Projects v2 - POST-MVP PHASE*`;
  }

  async generateProjectReport() {
    console.log('\n📊 Generating GitHub Project Configuration Report...\n');
    
    const issues = await this.getAllIssues();
    const milestones = await this.getMilestones();
    
    console.log('🎯 **PROJECT CONFIGURATION SUMMARY**');
    console.log('=====================================\n');
    
    // Group by type
    const byType = this.groupIssuesByType(issues);
    
    Object.entries(byType).forEach(([type, typeIssues]) => {
      console.log(`${this.getTypeEmoji(type)} **${type.toUpperCase()}** (${typeIssues.length} issues):`);
      typeIssues.forEach(issue => {
        const milestone = issue.milestone ? `[M${issue.milestone.number}]` : '[No Milestone]';
        console.log(`  #${issue.number}: ${issue.title} ${milestone}`);
      });
      console.log('');
    });
    
    console.log('📈 **MILESTONES:**');
    milestones.forEach(milestone => {
      console.log(`  ${milestone.number}: ${milestone.title} (${milestone.open_issues}/${milestone.open_issues + milestone.closed_issues} open)`);
    });
    
    console.log('\n✅ Project configured for optimal GitHub Projects v2 workflow!');
  }

  async getMilestones() {
    const response = await octokit.rest.issues.listMilestones({
      owner: this.owner,
      repo: this.repo,
      state: 'all',
    });
    return response.data;
  }

  groupIssuesByType(issues) {
    const groups = {};
    
    issues.forEach(issue => {
      let type = 'other';
      
      if (issue.labels.some(l => l.name === 'sprint')) type = 'sprints';
      else if (issue.labels.some(l => l.name === 'capability')) type = 'capabilities';
      else if (issue.labels.some(l => l.name === 'epic')) type = 'epics';
      else if (issue.labels.some(l => l.name === 'story')) type = 'stories';
      else if (issue.labels.some(l => l.name === 'task')) type = 'tasks';
      else if (issue.labels.some(l => l.name === 'post-mvp')) type = 'post-mvp';
      
      if (!groups[type]) groups[type] = [];
      groups[type].push(issue);
    });
    
    return groups;
  }

  getTypeEmoji(type) {
    const emojis = {
      sprints: '🏃',
      capabilities: '🎯', 
      epics: '📚',
      stories: '📖',
      tasks: '✅',
      'post-mvp': '🚫',
      other: '📄'
    };
    return emojis[type] || '📄';
  }
}

// CLI Interface
async function main() {
  const configurator = new ProjectConfigurator();
  const command = process.argv[2];

  switch (command) {
    case 'configure':
      await configurator.configureAllIssues();
      break;
      
    case 'report':
      await configurator.generateProjectReport();
      break;
      
    default:
      console.log(`
🔧 GitHub Project Configurator

Usage:
  node project-configurator.js configure    # Configure all issues for GitHub Project
  node project-configurator.js report       # Generate project configuration report

Examples:
  node project-configurator.js configure
  node project-configurator.js report
      `);
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProjectConfigurator };