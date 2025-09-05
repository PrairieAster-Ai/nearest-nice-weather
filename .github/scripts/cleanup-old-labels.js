#!/usr/bin/env node

/**
 * GitHub Labels Cleanup Script
 * Removes old, duplicate, and unused labels after reorganization
 */

import { Octokit } from '@octokit/rest';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '${GITHUB_TOKEN}';
const REPO_OWNER = 'PrairieAster-Ai';
const REPO_NAME = 'nearest-nice-weather';

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'NearestNiceWeather-LabelCleanup/1.0.0',
});

class LabelCleanup {
  constructor() {
    this.owner = REPO_OWNER;
    this.repo = REPO_NAME;
  }

  // Labels that should be removed (old/duplicate/unused)
  getLabelsToCleanup() {
    return [
      // Old type labels (replaced with new ones)
      'type:capability',
      'type:epic', 
      'type:story',
      'type:task',
      'type:future',
      'type:sprint',
      
      // Old status labels (replaced with organized ones)
      'status:blocked',
      
      // Old priority labels (replaced with consistent naming)
      'priority:high',
      'priority:medium', 
      'priority:low',
      
      // Sprint-specific labels (better managed through project fields)
      'sprint-1',
      'sprint-2', 
      'sprint-3',
      'sprint-4',
      'sprint',
      
      // GitHub default labels we don't need
      'duplicate',
      'invalid',
      'question',
      'wontfix',
      
      // Overly specific labels (can be handled with combinations)
      'epic-parent',
      'has-children',
      'permanently-deleted',
      'deleted',
      'high-priority',
      'revenue-critical',
      'phase:post-mvp',
      'post-mvp',
      
      // Too granular technical labels (use main categories)
      'leaflet',
      'openweather',
      'redis',
      'rate-limiting',
      'pwa',
      'real-time',
      'caching',
      'optimization',
      'multi-region',
      'direct-api',
      'machine-learning',
      'cognitive-load',
      'weather-intelligence',
      
      // Status labels that duplicate project field functionality
      'completed',
      'in-progress',
      'planned',
      'future',
      
      // Business model labels (too specific)
      'b2b',
      'b2c',
      'consumer',
      'enterprise',
      'subscription',
      'tourism-operators',
      
      // Development phase labels (managed elsewhere)
      'foundation',
      'implementation',
      'launch',
      'expansion',
      'advanced-features',
      
      // Overly specific feature labels
      'user-registration',
      'user-generated-content',
      'location-management',
      'business-intelligence',
      'social',
      'community',
      'onboarding',
      'discovery',
      'interface',
      'dashboard',
      'mapping',
      'minnesota',
      
      // Generic labels that don't add value
      'cleanup',
      'planning',
      'test',
      'intelligence',
      'deployment',
      'production',
      'security',
      'performance',
      'ux',
      'infrastructure',
      'ai'
    ];
  }

  async cleanupLabels() {
    console.log('🧹 GITHUB LABELS CLEANUP');
    console.log('========================\n');
    console.log(`📦 Repository: ${this.owner}/${this.repo}\n`);
    
    const labelsToRemove = this.getLabelsToCleanup();
    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    
    console.log(`🎯 Attempting to remove ${labelsToRemove.length} old/duplicate labels...\n`);
    
    for (const labelName of labelsToRemove) {
      try {
        await octokit.rest.issues.deleteLabel({
          owner: this.owner,
          repo: this.repo,
          name: labelName,
        });
        console.log(`  ✅ Removed: ${labelName}`);
        successCount++;
      } catch (error) {
        if (error.status === 404) {
          console.log(`  ℹ️  Not found: ${labelName} (already removed)`);
          notFoundCount++;
        } else {
          console.log(`  ❌ Failed to remove ${labelName}: ${error.message}`);
          errorCount++;
        }
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 **CLEANUP RESULTS**:`);
    console.log(`  ✅ Successfully removed: ${successCount}`);
    console.log(`  ℹ️  Already removed: ${notFoundCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    console.log(`\n🎉 **LABEL CLEANUP COMPLETE!**`);
    console.log(`Visit https://github.com/${this.owner}/${this.repo}/labels to see the clean, organized labels.`);
  }
}

// CLI Interface
async function main() {
  const cleanup = new LabelCleanup();
  await cleanup.cleanupLabels();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LabelCleanup };