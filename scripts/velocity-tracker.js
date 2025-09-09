#!/usr/bin/env node

/**
 * Sprint Velocity Tracker
 * Calculates team velocity, cycle time, and sprint metrics
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-VelocityTracker/1.0.0',
});

class VelocityTracker {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
  }

  async calculateSprintVelocity(sprintName = 'Revenue + Launch') {
    console.log(`📊 Calculating velocity for sprint: ${sprintName}\n`);

    try {
      // Get all issues for the sprint
      const issues = await this.getSprintIssues(sprintName);
      console.log(`Found ${issues.length} issues in sprint`);

      // Calculate metrics
      const metrics = this.analyzeSprintMetrics(issues);

      // Generate report
      await this.generateVelocityReport(sprintName, metrics);

      return metrics;

    } catch (error) {
      console.error('❌ Error calculating velocity:', error.message);
    }
  }

  async getSprintIssues(sprintName) {
    const allIssues = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'all',
        per_page: 100,
        page: page,
      });

      const sprintIssues = response.data.filter(issue =>
        issue.body && issue.body.includes(sprintName)
      );

      allIssues.push(...sprintIssues);
      hasMore = response.data.length === 100;
      page++;
    }

    return allIssues;
  }

  analyzeSprintMetrics(issues) {
    const metrics = {
      totalIssues: issues.length,
      completedIssues: 0,
      plannedPoints: 0,
      completedPoints: 0,
      inProgressIssues: 0,
      blockedIssues: 0,
      averageCycleTime: 0,
      velocityPercent: 0,
      issueBreakdown: {
        stories: 0,
        epics: 0,
        tasks: 0,
        bugs: 0
      },
      cycleTimes: []
    };

    issues.forEach(issue => {
      const labels = issue.labels.map(label => label.name);
      const storyPoints = this.extractStoryPoints(issue, labels);

      // Count by type
      if (labels.includes('type:story')) metrics.issueBreakdown.stories++;
      else if (labels.includes('type:epic')) metrics.issueBreakdown.epics++;
      else if (labels.includes('type:task')) metrics.issueBreakdown.tasks++;
      else if (labels.includes('bug')) metrics.issueBreakdown.bugs++;

      // Count by status
      if (issue.state === 'closed' || labels.includes('status:done')) {
        metrics.completedIssues++;
        metrics.completedPoints += storyPoints;

        // Calculate cycle time
        const cycleTime = this.calculateCycleTime(issue);
        if (cycleTime > 0) {
          metrics.cycleTimes.push(cycleTime);
        }
      } else {
        if (labels.includes('status:in-progress')) metrics.inProgressIssues++;
        if (labels.includes('blocked')) metrics.blockedIssues++;
      }

      metrics.plannedPoints += storyPoints;
    });

    // Calculate derived metrics
    metrics.velocityPercent = metrics.plannedPoints > 0
      ? Math.round((metrics.completedPoints / metrics.plannedPoints) * 100)
      : 0;

    metrics.averageCycleTime = metrics.cycleTimes.length > 0
      ? Math.round(metrics.cycleTimes.reduce((a, b) => a + b, 0) / metrics.cycleTimes.length)
      : 0;

    return metrics;
  }

  extractStoryPoints(issue, labels) {
    // Check for size labels
    const sizeLabels = labels.filter(label => label.startsWith('size:'));
    if (sizeLabels.length > 0) {
      const sizeMap = { 'XS': 1, 'S': 2, 'M': 3, 'L': 5, 'XL': 8, 'XXL': 13 };
      return sizeMap[sizeLabels[0].replace('size:', '')] || 3;
    }

    // Check issue body for story points
    if (issue.body) {
      const pointsMatch = issue.body.match(/story\s+points?:\s*(\d+)/i);
      if (pointsMatch) {
        return parseInt(pointsMatch[1]);
      }
    }

    // Default based on type
    const labels_str = labels.join(',');
    if (labels_str.includes('type:epic')) return 8;
    if (labels_str.includes('type:story')) return 3;
    if (labels_str.includes('type:task')) return 1;

    return 2; // Default small
  }

  calculateCycleTime(issue) {
    const createdDate = new Date(issue.created_at);
    const closedDate = issue.closed_at ? new Date(issue.closed_at) : new Date();

    return Math.round((closedDate - createdDate) / (1000 * 60 * 60 * 24));
  }

  async generateVelocityReport(sprintName, metrics) {
    const report = `# Sprint Velocity Report
**Sprint**: ${sprintName}
**Generated**: ${new Date().toISOString()}

## 📊 Sprint Overview

| Metric | Value |
|--------|-------|
| **Total Issues** | ${metrics.totalIssues} |
| **Completed Issues** | ${metrics.completedIssues} |
| **Planned Story Points** | ${metrics.plannedPoints} |
| **Completed Story Points** | ${metrics.completedPoints} |
| **Velocity %** | ${metrics.velocityPercent}% |
| **Average Cycle Time** | ${metrics.averageCycleTime} days |

## 🎯 Progress Breakdown

| Status | Count |
|--------|-------|
| ✅ **Completed** | ${metrics.completedIssues} |
| 🔄 **In Progress** | ${metrics.inProgressIssues} |
| 🚫 **Blocked** | ${metrics.blockedIssues} |
| 📋 **Remaining** | ${metrics.totalIssues - metrics.completedIssues - metrics.inProgressIssues - metrics.blockedIssues} |

## 📈 Issue Type Distribution

| Type | Count |
|------|-------|
| 📖 **Stories** | ${metrics.issueBreakdown.stories} |
| 📚 **Epics** | ${metrics.issueBreakdown.epics} |
| ✅ **Tasks** | ${metrics.issueBreakdown.tasks} |
| 🐛 **Bugs** | ${metrics.issueBreakdown.bugs} |

## ⏱️ Cycle Time Analysis

- **Average Cycle Time**: ${metrics.averageCycleTime} days
- **Cycle Time Range**: ${Math.min(...metrics.cycleTimes) || 0} - ${Math.max(...metrics.cycleTimes) || 0} days
- **Samples**: ${metrics.cycleTimes.length} completed issues

## 🎯 Sprint Health Indicators

${metrics.velocityPercent >= 80 ? '✅' : metrics.velocityPercent >= 60 ? '⚠️' : '❌'} **Velocity**: ${metrics.velocityPercent}% ${this.getVelocityHealth(metrics.velocityPercent)}

${metrics.averageCycleTime <= 3 ? '✅' : metrics.averageCycleTime <= 7 ? '⚠️' : '❌'} **Cycle Time**: ${metrics.averageCycleTime} days ${this.getCycleTimeHealth(metrics.averageCycleTime)}

${metrics.blockedIssues === 0 ? '✅' : metrics.blockedIssues <= 2 ? '⚠️' : '❌'} **Blocked Issues**: ${metrics.blockedIssues} ${this.getBlockedHealth(metrics.blockedIssues)}

## 📝 Recommendations

${this.generateRecommendations(metrics)}

---
*Generated by VelocityTracker v1.0.0*
`;

    // Save report
    const filename = `velocity-report-${sprintName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.md`;
    await fs.writeFile(`documentation/reports/${filename}`, report);

    console.log(`\n📊 Velocity report saved to: documentation/reports/${filename}`);
    console.log('\n' + report);
  }

  getVelocityHealth(velocity) {
    if (velocity >= 80) return '(Excellent - Sprint on track)';
    if (velocity >= 60) return '(Good - Minor adjustments needed)';
    return '(Needs Attention - Review sprint scope)';
  }

  getCycleTimeHealth(cycleTime) {
    if (cycleTime <= 3) return '(Excellent - Fast delivery)';
    if (cycleTime <= 7) return '(Good - Within target range)';
    return '(Needs Attention - Review bottlenecks)';
  }

  getBlockedHealth(blocked) {
    if (blocked === 0) return '(Excellent - No impediments)';
    if (blocked <= 2) return '(Good - Minor blockers)';
    return '(Needs Attention - Resolve impediments)';
  }

  generateRecommendations(metrics) {
    const recommendations = [];

    if (metrics.velocityPercent < 60) {
      recommendations.push('• **Reduce Sprint Scope**: Consider moving non-critical items to next sprint');
      recommendations.push('• **Identify Bottlenecks**: Review what\'s preventing story completion');
    }

    if (metrics.averageCycleTime > 7) {
      recommendations.push('• **Improve Flow**: Break down large stories into smaller, manageable tasks');
      recommendations.push('• **Review WIP Limits**: Ensure team is focusing on fewer concurrent items');
    }

    if (metrics.blockedIssues > 2) {
      recommendations.push('• **Daily Blocker Review**: Implement daily resolution of impediments');
      recommendations.push('• **Dependency Management**: Better planning of external dependencies');
    }

    if (metrics.inProgressIssues > 3) {
      recommendations.push('• **Focus on Completion**: Limit work in progress to improve flow');
    }

    if (recommendations.length === 0) {
      recommendations.push('• **Maintain Momentum**: Sprint is healthy, continue current practices');
      recommendations.push('• **Plan Next Sprint**: Use current velocity for next sprint planning');
    }

    return recommendations.join('\n');
  }

  async compareSprintVelocity() {
    console.log('📈 Comparing sprint velocity across time...\n');

    // This would compare multiple sprints
    // Implementation would fetch historical sprint data
    console.log('Historical velocity comparison not yet implemented');
    console.log('Future feature: Track velocity trends across multiple sprints');
  }
}

// CLI Interface
async function main() {
  const tracker = new VelocityTracker();
  const command = process.argv[2];
  const sprintName = process.argv[3] || 'Revenue + Launch';

  switch (command) {
    case 'calculate':
      await tracker.calculateSprintVelocity(sprintName);
      break;

    case 'compare':
      await tracker.compareSprintVelocity();
      break;

    default:
      console.log(`
📊 Sprint Velocity Tracker

Usage:
  node velocity-tracker.js calculate [sprint-name]    # Calculate current sprint velocity
  node velocity-tracker.js compare                    # Compare across sprints

Examples:
  node velocity-tracker.js calculate "Revenue + Launch"
  node velocity-tracker.js calculate "Database + Weather API"
  node velocity-tracker.js compare

Environment:
  GITHUB_TOKEN=your-token    # Required for GitHub API access
      `);
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { VelocityTracker };
