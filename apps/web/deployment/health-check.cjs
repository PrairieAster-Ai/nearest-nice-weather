// deployment/health-check.js
// Deployment infrastructure - separate from UI code
// This file should NEVER affect the user interface

const fs = require('fs');
const path = require('path');

function updateHealthCheck() {
  const healthData = {
    timestamp: new Date().toISOString(),
    status: "healthy", 
    version: process.env.VERCEL_GIT_COMMIT_SHA || "local",
    buildInfo: {
      buildTarget: "esnext", // Will be updated by deployment pipeline
      reactVersion: "18.3.1",
      viteVersion: "6.0.0",
      deploymentId: process.env.VERCEL_URL || "localhost"
    },
    checks: {
      frontend: {
        status: "ok",
        message: "Application running"
      },
      api: {
        status: "ok", 
        message: "Dev API server available"
      }
    }
  };

  // Write to public directory for static serving
  const publicDir = path.join(__dirname, '..', 'public');
  const healthPath = path.join(publicDir, 'health.json');
  
  fs.writeFileSync(healthPath, JSON.stringify(healthData, null, 2));
  console.log('Health check updated:', healthPath);
}

if (require.main === module) {
  updateHealthCheck();
}

module.exports = { updateHealthCheck };