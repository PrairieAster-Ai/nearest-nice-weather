/**
 * QA Report Generator
 * Consolidates test results and generates comprehensive reports
 */

import fs from 'fs';
import path from 'path';

function generateQAReport() {
  console.log('📊 Generating QA Report Summary...');
  
  const reportDir = 'test-results';
  const reports = {
    timestamp: new Date().toISOString(),
    playwrightResults: null,
    healthCheck: null,
    mcpOrchestration: null
  };
  
  // Read Playwright results if available
  const playwrightReportPath = path.join(reportDir, 'results.json');
  if (fs.existsSync(playwrightReportPath)) {
    reports.playwrightResults = JSON.parse(fs.readFileSync(playwrightReportPath, 'utf8'));
  }
  
  // Read health check results
  const healthCheckPath = 'test-results/health-checks/latest-summary.md';
  if (fs.existsSync(healthCheckPath)) {
    reports.healthCheck = fs.readFileSync(healthCheckPath, 'utf8');
  }
  
  // Read MCP orchestration results
  const mcpReportPath = 'test-results/mcp-orchestration-report.json';
  if (fs.existsSync(mcpReportPath)) {
    reports.mcpOrchestration = JSON.parse(fs.readFileSync(mcpReportPath, 'utf8'));
  }
  
  // Save consolidated report
  const consolidatedReportPath = path.join(reportDir, 'consolidated-qa-report.json');
  fs.writeFileSync(consolidatedReportPath, JSON.stringify(reports, null, 2));
  
  console.log(`✅ QA Report generated: ${consolidatedReportPath}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateQAReport();
}

export { generateQAReport };