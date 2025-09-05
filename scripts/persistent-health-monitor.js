#!/usr/bin/env node
/**
 * Persistent Health Monitor for Nearest Nice Weather
 *
 * Runs independently of the unified startup script to provide continuous
 * monitoring and auto-healing capabilities even when main processes terminate.
 */

const http = require('http');
const { spawn } = require('child_process');

// Configuration from environment
const MONITOR_INTERVAL = parseInt(process.env.MONITOR_INTERVAL || '15000');
const API_PORT = process.env.API_PORT || '4000';
const FRONTEND_PORT = process.env.FRONTEND_PORT || '3001';
const BROWSERTOOLS_PORT = process.env.BROWSERTOOLS_PORT || '3025';

// Logging with timestamps
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}

function success(message) {
    log(`✅ ${message}`, 'SUCCESS');
}

function warning(message) {
    log(`⚠️  ${message}`, 'WARNING');
}

function error(message) {
    log(`❌ ${message}`, 'ERROR');
}

// Health check functions
async function checkService(url, serviceName) {
    return new Promise((resolve) => {
        const req = http.get(url, { timeout: 5000 }, (res) => {
            if (res.statusCode === 200) {
                resolve({ healthy: true, status: res.statusCode });
            } else {
                resolve({ healthy: false, status: res.statusCode, error: `HTTP ${res.statusCode}` });
            }
        });

        req.on('error', (err) => {
            resolve({ healthy: false, error: err.message });
        });

        req.on('timeout', () => {
            resolve({ healthy: false, error: 'Timeout' });
        });
    });
}

async function checkAPI() {
    return await checkService(`http://localhost:${API_PORT}/api/health`, 'API Server');
}

async function checkFrontend() {
    return await checkService(`http://localhost:${FRONTEND_PORT}/`, 'Frontend');
}

async function checkBrowserTools() {
    return await checkService(`http://localhost:${BROWSERTOOLS_PORT}/identity`, 'BrowserToolsMCP');
}

async function checkAPIProxy() {
    return await checkService(`http://localhost:${FRONTEND_PORT}/api/health`, 'API Proxy');
}

// Service restart functions (using PM2)
function restartService(serviceName) {
    return new Promise((resolve) => {
        log(`Attempting to restart ${serviceName} via PM2...`);

        const pm2Restart = spawn('pm2', ['restart', serviceName], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let output = '';
        pm2Restart.stdout.on('data', (data) => {
            output += data.toString();
        });

        pm2Restart.stderr.on('data', (data) => {
            output += data.toString();
        });

        pm2Restart.on('close', (code) => {
            if (code === 0) {
                success(`${serviceName} restart command completed`);
                resolve(true);
            } else {
                error(`${serviceName} restart failed: ${output}`);
                resolve(false);
            }
        });
    });
}

// Comprehensive health check
async function performHealthCheck() {
    log('🔍 Performing comprehensive health check...');

    const checks = await Promise.all([
        checkAPI(),
        checkFrontend(),
        checkBrowserTools(),
        checkAPIProxy()
    ]);

    const [apiHealth, frontendHealth, browseToolsHealth, proxyHealth] = checks;
    const services = [
        { name: 'API Server', health: apiHealth, pm2Name: 'weather-api' },
        { name: 'Frontend', health: frontendHealth, pm2Name: 'weather-frontend' },
        { name: 'BrowserToolsMCP', health: browseToolsHealth, pm2Name: 'browsertools-mcp-server' },
        { name: 'API Proxy', health: proxyHealth, pm2Name: null } // Proxy is handled by frontend
    ];

    let allHealthy = true;
    const unhealthyServices = [];

    for (const service of services) {
        if (service.health.healthy) {
            success(`${service.name}: HEALTHY`);
        } else {
            warning(`${service.name}: UNHEALTHY - ${service.health.error || service.health.status}`);
            allHealthy = false;
            if (service.pm2Name) {
                unhealthyServices.push(service);
            }
        }
    }

    // Attempt to restart unhealthy services
    for (const service of unhealthyServices) {
        warning(`Attempting to heal ${service.name}...`);
        const restarted = await restartService(service.pm2Name);

        if (restarted) {
            // Wait a bit and re-check
            await new Promise(resolve => setTimeout(resolve, 5000));

            let recheckResult;
            if (service.name === 'API Server') {
                recheckResult = await checkAPI();
            } else if (service.name === 'Frontend') {
                recheckResult = await checkFrontend();
            } else if (service.name === 'BrowserToolsMCP') {
                recheckResult = await checkBrowserTools();
            }

            if (recheckResult && recheckResult.healthy) {
                success(`${service.name} successfully healed`);
            } else {
                error(`${service.name} restart failed to restore health`);
            }
        }
    }

    return { allHealthy, unhealthyServices: unhealthyServices.length };
}

// PM2 integration check
async function checkPM2Available() {
    return new Promise((resolve) => {
        const pm2List = spawn('pm2', ['list'], { stdio: ['ignore', 'pipe', 'pipe'] });

        pm2List.on('close', (code) => {
            resolve(code === 0);
        });

        pm2List.on('error', () => {
            resolve(false);
        });
    });
}

// Main monitoring loop
async function startMonitoring() {
    log('🚀 Persistent Health Monitor starting...');
    log(`📊 Configuration:`);
    log(`   • Monitor Interval: ${MONITOR_INTERVAL}ms`);
    log(`   • API Port: ${API_PORT}`);
    log(`   • Frontend Port: ${FRONTEND_PORT}`);
    log(`   • BrowserTools Port: ${BROWSERTOOLS_PORT}`);

    // Check if PM2 is available
    const pm2Available = await checkPM2Available();
    if (!pm2Available) {
        warning('PM2 not available - auto-healing capabilities limited');
    } else {
        success('PM2 detected - full auto-healing enabled');
    }

    // Initial health check
    await performHealthCheck();

    // Start monitoring loop
    setInterval(async () => {
        try {
            const result = await performHealthCheck();
            if (result.allHealthy) {
                log('🎉 All services healthy');
            } else {
                warning(`Health check completed - ${result.unhealthyServices} services required healing`);
            }
        } catch (err) {
            error(`Health check failed: ${err.message}`);
        }
    }, MONITOR_INTERVAL);

    log('🔄 Persistent monitoring active');
}

// Graceful shutdown
process.on('SIGINT', () => {
    log('🛑 Persistent Health Monitor shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('🛑 Persistent Health Monitor terminated');
    process.exit(0);
});

// Start monitoring
startMonitoring().catch((err) => {
    error(`Monitor startup failed: ${err.message}`);
    process.exit(1);
});
