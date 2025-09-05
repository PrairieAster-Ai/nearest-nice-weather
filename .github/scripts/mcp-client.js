#!/usr/bin/env node

/**
 * MCP Client for GitHub Servers
 * Direct connection to MCP servers via stdio
 */

import { spawn } from 'child_process';
import { JSONRPCClient } from 'json-rpc-2.0';

class MCPClient {
  constructor() {
    this.requestId = 0;
  }

  async connectToGitHubOfficial() {
    console.log('🔌 Connecting to GitHub Official MCP Server...');
    
    const serverProcess = spawn('docker', [
      'run', '-i', '--rm',
      '-e', 'GITHUB_PERSONAL_ACCESS_TOKEN=${GITHUB_TOKEN}',
      '-e', 'GITHUB_TOOLSETS=repos,issues,pull_requests',
      'ghcr.io/github/github-mcp-server',
      'stdio'
    ]);

    return this.setupConnection(serverProcess, 'GitHub Official');
  }

  async connectToProjectManager() {
    console.log('🔌 Connecting to Project Manager MCP Server...');
    
    const serverProcess = spawn('mcp-github-project-manager', [
      '--token', '${GITHUB_TOKEN}',
      '--owner', 'PrairieAster-Ai',
      '--repo', 'nearest-nice-weather',
      '--verbose'
    ]);

    return this.setupConnection(serverProcess, 'Project Manager');
  }

  setupConnection(serverProcess, serverName) {
    return new Promise((resolve, reject) => {
      let isConnected = false;

      serverProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`📨 [${serverName}] ${message.trim()}`);
        
        if (!isConnected && (message.includes('running on stdio') || message.includes('GitHub MCP Server running') || message.includes('server running'))) {
          isConnected = true;
          console.log(`✅ Connected to ${serverName} MCP Server`);
          resolve(serverProcess);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`⚠️ [${serverName}] ${data.toString().trim()}`);
      });

      serverProcess.on('close', (code) => {
        console.log(`🔚 [${serverName}] Server closed with code ${code}`);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!isConnected) {
          reject(new Error(`Failed to connect to ${serverName} within 10 seconds`));
        }
      }, 10000);
    });
  }

  async sendMCPRequest(serverProcess, method, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: method,
        params: params
      };

      console.log(`📤 Sending MCP request: ${method}`);
      
      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      const responseHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === request.id) {
            clearTimeout(timeout);
            serverProcess.stdout.removeListener('data', responseHandler);
            
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        } catch (e) {
          // Ignore non-JSON responses
        }
      };

      serverProcess.stdout.on('data', responseHandler);
    });
  }

  async testGitHubConnection() {
    try {
      console.log('🧪 Testing GitHub MCP Server connections...\n');
      
      // Test GitHub Official
      try {
        const githubProcess = await this.connectToGitHubOfficial();
        
        // Send initialization request
        const initResult = await this.sendMCPRequest(githubProcess, 'initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'NearestNiceWeather-CLI',
            version: '1.0.0'
          }
        });
        
        console.log('✅ GitHub Official MCP initialized:', initResult);
        
        githubProcess.kill();
      } catch (error) {
        console.error('❌ GitHub Official MCP failed:', error.message);
      }

      // Test Project Manager
      try {
        const pmProcess = await this.connectToProjectManager();
        
        // Send initialization request
        const initResult = await this.sendMCPRequest(pmProcess, 'initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'NearestNiceWeather-CLI',
            version: '1.0.0'
          }
        });
        
        console.log('✅ Project Manager MCP initialized:', initResult);
        
        pmProcess.kill();
      } catch (error) {
        console.error('❌ Project Manager MCP failed:', error.message);
      }

    } catch (error) {
      console.error('❌ MCP connection test failed:', error);
    }
  }
}

// CLI Interface
async function main() {
  const client = new MCPClient();
  const command = process.argv[2];

  switch (command) {
    case 'test':
      await client.testGitHubConnection();
      break;
      
    case 'github':
      const githubProcess = await client.connectToGitHubOfficial();
      console.log('GitHub MCP server running. Press Ctrl+C to exit.');
      break;
      
    case 'pm':
      const pmProcess = await client.connectToProjectManager();
      console.log('Project Manager MCP server running. Press Ctrl+C to exit.');
      break;
      
    default:
      console.log(`
🔌 MCP Client for GitHub Servers

Usage:
  node mcp-client.js test      # Test both MCP server connections
  node mcp-client.js github    # Connect to GitHub Official MCP
  node mcp-client.js pm        # Connect to Project Manager MCP

Examples:
  node mcp-client.js test
      `);
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPClient };