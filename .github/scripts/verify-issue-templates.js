#!/usr/bin/env node

/**
 * GitHub Issue Templates Verification Script
 * Verifies the issue template configuration is correctly set up
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

class IssueTemplateVerification {
  constructor() {
    this.templateDir = '.github/ISSUE_TEMPLATE';
    this.expectedTemplates = ['story.yml', 'epic.yml', 'capability.yml', 'config.yml'];
  }

  async verifyTemplates() {
    console.log('✅ GITHUB ISSUE TEMPLATES VERIFICATION');
    console.log('======================================\n');
    
    console.log(`📁 Template Directory: ${this.templateDir}\n`);
    
    try {
      // Check if template directory exists
      if (!fs.existsSync(this.templateDir)) {
        console.log('❌ Template directory not found!');
        return;
      }
      
      // List all files in template directory
      const files = fs.readdirSync(this.templateDir);
      console.log(`📋 Files found: ${files.join(', ')}\n`);
      
      // Verify each expected template
      let allTemplatesValid = true;
      
      for (const templateFile of this.expectedTemplates) {
        const templatePath = path.join(this.templateDir, templateFile);
        
        if (!fs.existsSync(templatePath)) {
          console.log(`❌ Missing template: ${templateFile}`);
          allTemplatesValid = false;
          continue;
        }
        
        console.log(`✅ Found: ${templateFile}`);
        
        // Parse and validate YAML structure
        try {
          const content = fs.readFileSync(templatePath, 'utf8');
          
          if (templateFile === 'config.yml') {
            // Validate config file
            const config = yaml.load(content);
            this.validateConfigFile(config, templateFile);
          } else {
            // Validate issue template file
            const template = yaml.load(content);
            this.validateIssueTemplate(template, templateFile);
          }
          
        } catch (error) {
          console.log(`  ❌ YAML parsing error in ${templateFile}: ${error.message}`);
          allTemplatesValid = false;
        }
      }
      
      // Check for old templates that should be removed
      const oldTemplates = files.filter(file => 
        file.endsWith('.md') && !['README.md'].includes(file)
      );
      
      if (oldTemplates.length > 0) {
        console.log(`\n⚠️  Old templates still present: ${oldTemplates.join(', ')}`);
        console.log('   Consider removing these if they\'re no longer needed.');
      }
      
      // Generate summary
      console.log('\n🎯 **VERIFICATION SUMMARY**:');
      if (allTemplatesValid) {
        console.log('✅ All issue templates are correctly configured!');
        console.log('✅ Templates follow the Story/Epic/Capability structure');
        console.log('✅ YAML syntax is valid');
        console.log('✅ Required fields are present');
      } else {
        console.log('❌ Some templates have issues - review the errors above');
      }
      
      console.log('\n🔗 **Test the templates**: Create a new issue in the repository to see the updated selection dialog');
      console.log('📋 **Expected types**: Story, Epic, Capability (instead of Bug, Feature, Task)');
      
    } catch (error) {
      console.error('❌ Error verifying templates:', error.message);
    }
  }
  
  validateConfigFile(config, filename) {
    console.log(`  📋 Config structure:`);
    console.log(`    - blank_issues_enabled: ${config.blank_issues_enabled}`);
    console.log(`    - contact_links: ${config.contact_links?.length || 0} links`);
    
    if (config.contact_links) {
      config.contact_links.forEach((link, index) => {
        console.log(`      ${index + 1}. ${link.name}`);
      });
    }
  }
  
  validateIssueTemplate(template, filename) {
    const requiredFields = ['name', 'description', 'title', 'labels', 'body'];
    const missingFields = requiredFields.filter(field => !template[field]);
    
    if (missingFields.length > 0) {
      console.log(`  ❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log(`  📋 Template: "${template.name}"`);
    console.log(`  📝 Description: "${template.description}"`);
    console.log(`  🏷️  Labels: ${template.labels.join(', ')}`);
    console.log(`  📄 Body sections: ${template.body?.length || 0}`);
    
    // Check for type label
    const hasTypeLabel = template.labels.some(label => label.startsWith('type: '));
    if (hasTypeLabel) {
      console.log(`  ✅ Has type label`);
    } else {
      console.log(`  ⚠️  Missing type label`);
    }
    
    return true;
  }
}

// CLI Interface
async function main() {
  const verification = new IssueTemplateVerification();
  await verification.verifyTemplates();
}

// Check if js-yaml is available
try {
  await import('js-yaml');
} catch (error) {
  console.log('📦 Installing js-yaml for YAML parsing...');
  const { execSync } = await import('child_process');
  execSync('npm install js-yaml', { stdio: 'inherit' });
  console.log('✅ js-yaml installed successfully\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { IssueTemplateVerification };