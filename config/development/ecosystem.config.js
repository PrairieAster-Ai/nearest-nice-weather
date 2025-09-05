module.exports = {
  apps: [{
    name: 'browsertools-mcp-server',
    script: 'browsertools-mcp-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    min_uptime: '10s',
    max_restarts: 15,
    restart_delay: 2000,
    error_file: './logs/browsertools-error.log',
    out_file: './logs/browsertools-out.log',
    log_file: './logs/browsertools-combined.log',
    time: true,
    env: {
      NODE_ENV: 'development',
      PORT: '3025'
    }
  }, {
    name: 'weather-api',
    script: 'dev-api-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 1000,
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_file: './logs/api-combined.log',
    time: true,
    env: {
      NODE_ENV: 'development',
      PORT: '4000'
    }
  }, {
    name: 'weather-frontend',
    script: 'npm',
    args: 'run dev',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '15s',
    max_restarts: 8,
    restart_delay: 3000,
    error_file: './logs/frontend-error.log',
    out_file: './logs/frontend-out.log',
    log_file: './logs/frontend-combined.log',
    time: true,
    env: {
      NODE_ENV: 'development',
      VITE_DEV_PORT: '3001',
      VITE_API_PROXY_URL: 'http://localhost:4000'
    }
  }, {
    name: 'health-monitor',
    script: 'scripts/persistent-health-monitor.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    min_uptime: '30s',
    max_restarts: 5,
    restart_delay: 5000,
    error_file: './logs/health-monitor-error.log',
    out_file: './logs/health-monitor-out.log',
    log_file: './logs/health-monitor-combined.log',
    time: true,
    env: {
      NODE_ENV: 'development',
      MONITOR_INTERVAL: '15000',
      API_PORT: '4000',
      FRONTEND_PORT: '3001',
      BROWSERTOOLS_PORT: '3025'
    }
  }]
};
