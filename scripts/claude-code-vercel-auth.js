#!/usr/bin/env node

/**
 * Claude Code Vercel Preview Authentication Helper
 * 
 * This script handles authentication with Vercel preview deployments
 * for automated testing, screenshots, and performance monitoring.
 */

const https = require('https');
const { URL } = require('url');

class ClaudeCodeVercelAuth {
  constructor() {
    this.accessToken = process.env.CLAUDE_CODE_ACCESS_TOKEN;
    this.deploymentUrl = null;
    this.authenticated = false;
  }

  /**
   * Authenticate with a Vercel preview deployment
   */
  async authenticateWithPreview(deploymentUrl) {
    if (!this.accessToken) {
      throw new Error('CLAUDE_CODE_ACCESS_TOKEN environment variable is required');
    }

    try {
      const url = new URL('/claude-code-auth', deploymentUrl);
      
      const authData = await this.makeRequest(url.toString(), {
        method: 'GET',
        headers: {
          'x-claude-code-token': this.accessToken,
          'User-Agent': 'Claude-Code-Preview-Auth/1.0',
          'Accept': 'application/json'
        }
      });

      if (authData.status === 'authenticated') {
        this.deploymentUrl = deploymentUrl;
        this.authenticated = true;
        
        console.log('✅ Claude Code authenticated with Vercel preview deployment');
        console.log(`🌐 Deployment: ${authData.deployment}`);
        console.log(`🏷️  Environment: ${authData.environment}`);
        console.log(`🔧 Available features: ${authData.features.join(', ')}`);
        
        return authData;
      } else {
        throw new Error('Authentication failed: Invalid response');
      }
      
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Take a screenshot of the authenticated preview deployment
   */
  async captureScreenshot(options = {}) {
    if (!this.authenticated) {
      throw new Error('Must authenticate first');
    }

    try {
      // Use BrowserToolsMCP to capture screenshot of the preview deployment
      const screenshotData = await this.makeRequest('http://localhost:3025/mcp/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: this.deploymentUrl,
          filename: options.filename || `preview-${Date.now()}.png`,
          ...options
        })
      });

      console.log('📸 Screenshot captured:', screenshotData.filename);
      return screenshotData;
      
    } catch (error) {
      console.error('❌ Screenshot failed:', error.message);
      throw error;
    }
  }

  /**
   * Monitor console logs from the preview deployment
   */
  async monitorConsoleLogs(duration = 30000) {
    if (!this.authenticated) {
      throw new Error('Must authenticate first');
    }

    console.log(`🔍 Monitoring console logs for ${duration/1000} seconds...`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const logs = [];
      
      const checkLogs = async () => {
        try {
          const logData = await this.makeRequest('http://localhost:3025/mcp/console-logs/all?limit=20', {
            method: 'GET'
          });
          
          if (logData.logs && logData.logs.length > 0) {
            const newLogs = logData.logs.filter(log => 
              log.timestamp > startTime && 
              log.url && log.url.includes(this.deploymentUrl)
            );
            
            newLogs.forEach(log => {
              console.log(`📋 [${log.level}] ${log.message}`);
              logs.push(log);
            });
          }
          
          if (Date.now() - startTime < duration) {
            setTimeout(checkLogs, 2000); // Check every 2 seconds
          } else {
            resolve(logs);
          }
          
        } catch (error) {
          console.error('❌ Log monitoring error:', error.message);
          resolve(logs);
        }
      };
      
      checkLogs();
    });
  }

  /**
   * Validate preview deployment health
   */
  async validateDeployment() {
    if (!this.authenticated) {
      throw new Error('Must authenticate first');
    }

    try {
      const healthUrl = new URL('/health.json', this.deploymentUrl);
      const healthData = await this.makeRequest(healthUrl.toString(), {
        method: 'GET',
        headers: {
          'x-claude-code-token': this.accessToken
        }
      });

      console.log('🏥 Deployment health check:');
      console.log(`   Status: ${healthData.status || 'unknown'}`);
      console.log(`   Version: ${healthData.version || 'unknown'}`);
      console.log(`   Timestamp: ${healthData.timestamp || 'unknown'}`);
      
      return healthData;
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Helper method to make HTTP requests
   */
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 10000
      };

      const req = (isLocalhost ? require('http') : https).request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(jsonData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${jsonData.error || data}`));
            }
          } catch (error) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const deploymentUrl = args[1];

  if (!command || !deploymentUrl) {
    console.log(`
🔐 Claude Code Vercel Preview Authentication

Usage:
  node claude-code-vercel-auth.js <command> <deployment-url>

Commands:
  auth       - Authenticate with preview deployment
  screenshot - Take screenshot of preview deployment  
  monitor    - Monitor console logs for 30 seconds
  validate   - Check deployment health
  full       - Run complete validation suite

Example:
  node claude-code-vercel-auth.js auth https://your-preview-deployment.vercel.app
  node claude-code-vercel-auth.js full https://your-preview-deployment.vercel.app

Environment Variables:
  CLAUDE_CODE_ACCESS_TOKEN - Authentication token for preview access
`);
    process.exit(1);
  }

  const auth = new ClaudeCodeVercelAuth();

  try {
    // Authenticate first
    await auth.authenticateWithPreview(deploymentUrl);

    switch (command) {
      case 'auth':
        console.log('✅ Authentication complete');
        break;
        
      case 'screenshot':
        await auth.captureScreenshot();
        break;
        
      case 'monitor':
        const logs = await auth.monitorConsoleLogs();
        console.log(`📊 Captured ${logs.length} console logs`);
        break;
        
      case 'validate':
        await auth.validateDeployment();
        break;
        
      case 'full':
        console.log('🚀 Running complete validation suite...');
        await auth.validateDeployment();
        await auth.captureScreenshot({ filename: 'full-validation.png' });
        await auth.monitorConsoleLogs(10000); // 10 seconds
        console.log('✅ Full validation complete');
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ClaudeCodeVercelAuth;