#!/usr/bin/env node

/**
 * GitHub Labels Organization Script
 * Creates organized, color-coded label system for NearestNiceWeather.com project
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-LabelOrganizer/1.0.0',
});

class LabelOrganizer {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
    this.existingLabels = [];
    this.labelsToCreate = [];
    this.labelsToUpdate = [];
    this.labelsToDelete = [];
  }

  // Organized label definitions with colors and descriptions
  getOrganizedLabels() {
    return {
      // TYPE LABELS (Primary Classification) - Purple Spectrum
      'type: capability': {
        color: '8B5CF6', // Purple-500
        description: '🌟 Cross-sprint platform capabilities'
      },
      'type: epic': {
        color: '9333EA', // Purple-600
        description: '📦 Major work containers (20+ story points)'
      },
      'type: story': {
        color: 'A855F7', // Purple-400
        description: '👤 User-focused work items (3-13 points)'
      },

      // TECHNICAL LABELS (Work Classification) - Blue Spectrum
      'database': {
        color: '3B82F6', // Blue-500
        description: '🗄️ Database schema, queries, migrations'
      },
      'weather-api': {
        color: '2563EB', // Blue-600
        description: '🌤️ Weather service integration'
      },
      'frontend': {
        color: '1D4ED8', // Blue-700
        description: '💻 UI/UX, React components, styling'
      },
      'backend': {
        color: '60A5FA', // Blue-400
        description: '⚙️ Server-side logic, APIs, services'
      },
      'mobile': {
        color: '93C5FD', // Blue-300
        description: '📱 Mobile optimization, responsive design'
      },
      'analytics': {
        color: '1E40AF', // Blue-800
        description: '📊 Tracking, metrics, reporting'
      },
      'revenue': {
        color: '1E3A8A', // Blue-900
        description: '💰 Monetization, ads, payments'
      },

      // WORKFLOW LABELS (Status Support) - Traffic Light Colors
      'blocked': {
        color: 'EF4444', // Red-500
        description: '🚫 Waiting on external dependency'
      },
      'urgent': {
        color: 'F97316', // Orange-500
        description: '🔥 High priority, expedite work'
      },
      'needs-review': {
        color: 'F59E0B', // Amber-500
        description: '👀 Ready for validation/testing'
      },

      // ISSUE TYPE LABELS (GitHub Standards) - Gray Spectrum
      'bug': {
        color: 'DC2626', // Red-600
        description: '🐛 Something isn\'t working'
      },
      'enhancement': {
        color: '16A34A', // Green-600
        description: '✨ New feature or request'
      },
      'documentation': {
        color: '6B7280', // Gray-500
        description: '📝 Improvements or additions to docs'
      },
      'good first issue': {
        color: '10B981', // Emerald-500
        description: '👋 Good for newcomers'
      },
      'help wanted': {
        color: '059669', // Emerald-600
        description: '🙋 Extra attention is needed'
      },

      // SIZE LABELS (Story Point Estimation) - Green Spectrum
      'size: XS': {
        color: 'BBF7D0', // Green-200
        description: '🔸 1-2 story points'
      },
      'size: S': {
        color: '86EFAC', // Green-300
        description: '🔹 3-5 story points'
      },
      'size: M': {
        color: '4ADE80', // Green-400
        description: '🔷 8-13 story points'
      },
      'size: L': {
        color: '22C55E', // Green-500
        description: '🔶 20-21 story points'
      },
      'size: XL': {
        color: '16A34A', // Green-600
        description: '🔺 34+ story points'
      },

      // PRIORITY LABELS - Red/Orange Spectrum
      'priority: critical': {
        color: '991B1B', // Red-800
        description: '🚨 Critical priority - immediate action required'
      },
      'priority: high': {
        color: 'DC2626', // Red-600
        description: '⚡ High priority - address soon'
      },
      'priority: medium': {
        color: 'F97316', // Orange-500
        description: '📋 Medium priority - normal workflow'
      },
      'priority: low': {
        color: 'F59E0B', // Amber-500
        description: '📝 Low priority - when time permits'
      }
    };
  }

  async getCurrentLabels() {
    console.log('📋 Fetching current repository labels...\n');
    
    try {
      const response = await octokit.rest.issues.listLabelsForRepo({
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
      });
      
      this.existingLabels = response.data;
      console.log(`✅ Found ${this.existingLabels.length} existing labels`);
      
      // Display current labels
      console.log('\n📊 **CURRENT LABELS**:');
      this.existingLabels.forEach(label => {
        console.log(`  🏷️  ${label.name} (#${label.color}) - ${label.description || 'No description'}`);
      });
      
    } catch (error) {
      console.error('❌ Error fetching current labels:', error.message);
    }
  }

  async planLabelChanges() {
    console.log('\n🎯 Planning label organization changes...\n');
    
    const organizedLabels = this.getOrganizedLabels();
    const existingLabelNames = this.existingLabels.map(label => label.name);
    
    // Determine what needs to be created, updated, or deleted
    Object.entries(organizedLabels).forEach(([name, config]) => {
      const existingLabel = this.existingLabels.find(label => label.name === name);
      
      if (!existingLabel) {
        // Label doesn't exist - create it
        this.labelsToCreate.push({ name, ...config });
      } else if (existingLabel.color !== config.color || existingLabel.description !== config.description) {
        // Label exists but needs updates
        this.labelsToUpdate.push({ name, ...config });
      }
    });
    
    // Check for labels that should be deleted (optional - we'll be conservative)
    const organizedLabelNames = Object.keys(organizedLabels);
    this.existingLabels.forEach(label => {
      // Only suggest deletion for labels that are clearly outdated
      if (!organizedLabelNames.includes(label.name) && this.shouldDeleteLabel(label.name)) {
        this.labelsToDelete.push(label);
      }
    });
    
    // Display plan
    console.log('📋 **LABEL ORGANIZATION PLAN**:');
    console.log(`  ✅ Labels to create: ${this.labelsToCreate.length}`);
    console.log(`  🔄 Labels to update: ${this.labelsToUpdate.length}`);
    console.log(`  🗑️  Labels to delete: ${this.labelsToDelete.length}\n`);
    
    if (this.labelsToCreate.length > 0) {
      console.log('🆕 **LABELS TO CREATE**:');
      this.labelsToCreate.forEach(label => {
        console.log(`  + ${label.name} (#${label.color}) - ${label.description}`);
      });
      console.log('');
    }
    
    if (this.labelsToUpdate.length > 0) {
      console.log('🔄 **LABELS TO UPDATE**:');
      this.labelsToUpdate.forEach(label => {
        const existing = this.existingLabels.find(l => l.name === label.name);
        console.log(`  ~ ${label.name}`);
        console.log(`    Old: #${existing.color} - ${existing.description || 'No description'}`);
        console.log(`    New: #${label.color} - ${label.description}`);
      });
      console.log('');
    }
    
    if (this.labelsToDelete.length > 0) {
      console.log('🗑️  **LABELS TO DELETE** (outdated):');
      this.labelsToDelete.forEach(label => {
        console.log(`  - ${label.name} (#${label.color}) - ${label.description || 'No description'}`);
      });
      console.log('');
    }
  }

  shouldDeleteLabel(labelName) {
    // Conservative deletion - only suggest removing labels that are clearly outdated
    const outdatedLabels = [
      'wontfix',
      'invalid',
      'duplicate',
      'question' // GitHub default labels we might not need
    ];
    
    return outdatedLabels.includes(labelName);
  }

  async executeLabelChanges() {
    console.log('🚀 Executing label organization changes...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Create new labels
    for (const label of this.labelsToCreate) {
      try {
        await octokit.rest.issues.createLabel({
          owner: this.owner,
          repo: this.repo,
          name: label.name,
          color: label.color,
          description: label.description,
        });
        console.log(`  ✅ Created: ${label.name}`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ Failed to create ${label.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Update existing labels
    for (const label of this.labelsToUpdate) {
      try {
        await octokit.rest.issues.updateLabel({
          owner: this.owner,
          repo: this.repo,
          name: label.name,
          color: label.color,
          description: label.description,
        });
        console.log(`  ✅ Updated: ${label.name}`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ Failed to update ${label.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Delete outdated labels (optional - require confirmation)
    if (this.labelsToDelete.length > 0) {
      console.log('\n⚠️  **LABEL DELETION SKIPPED** (requires manual confirmation)');
      console.log('To delete outdated labels manually, visit:');
      console.log(`https://github.com/${this.owner}/${this.repo}/labels`);
    }
    
    console.log(`\n📊 **RESULTS**: ${successCount} successful, ${errorCount} errors`);
  }

  async generateLabelSummary() {
    console.log('\n📋 **ORGANIZED LABEL SYSTEM SUMMARY**');
    console.log('===========================================\n');
    
    const organizedLabels = this.getOrganizedLabels();
    
    console.log('🎯 **LABEL CATEGORIES**:\n');
    
    // Group labels by category
    const categories = {
      'Type Labels (Primary)': ['type: capability', 'type: epic', 'type: story'],
      'Technical Labels': ['database', 'weather-api', 'frontend', 'backend', 'mobile', 'analytics', 'revenue'],
      'Workflow Labels': ['blocked', 'urgent', 'needs-review'],
      'Issue Type Labels': ['bug', 'enhancement', 'documentation', 'good first issue', 'help wanted'],
      'Size Labels': ['size: XS', 'size: S', 'size: M', 'size: L', 'size: XL'],
      'Priority Labels': ['priority: critical', 'priority: high', 'priority: medium', 'priority: low']
    };
    
    Object.entries(categories).forEach(([category, labelNames]) => {
      console.log(`**${category}:**`);
      labelNames.forEach(name => {
        if (organizedLabels[name]) {
          console.log(`  🏷️  \`${name}\` - ${organizedLabels[name].description}`);
        }
      });
      console.log('');
    });
    
    console.log('🔍 **FILTERING EXAMPLES**:');
    console.log('  - All Epics: `label:"type: epic"`');
    console.log('  - Database Stories: `label:"type: story" label:"database"`');
    console.log('  - Blocked Items: `label:"blocked"`');
    console.log('  - High Priority: `label:"priority: high"`');
    console.log('  - Large Items: `label:"size: L"`');
    
    console.log('\n✅ Label organization complete!');
  }

  async organizeLabels() {
    console.log('🏷️  GITHUB LABELS ORGANIZATION');
    console.log('===============================\n');
    console.log(`📦 Repository: ${this.owner}/${this.repo}`);
    console.log(`🔗 Labels URL: https://github.com/${this.owner}/${this.repo}/labels\n`);
    
    try {
      // Step 1: Get current labels
      await this.getCurrentLabels();
      
      // Step 2: Plan changes
      await this.planLabelChanges();
      
      // Step 3: Execute changes
      await this.executeLabelChanges();
      
      // Step 4: Generate summary
      await this.generateLabelSummary();
      
    } catch (error) {
      console.error('❌ Error organizing labels:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const organizer = new LabelOrganizer();
  await organizer.organizeLabels();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LabelOrganizer };