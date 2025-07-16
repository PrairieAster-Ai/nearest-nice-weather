module.exports = {
  apps: [{
    name: 'browsertools-mcp-server',
    script: 'browsertools-mcp-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 2000,
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
    env: {
      NODE_ENV: 'development',
      VITE_DEV_PORT: '3001',
      VITE_API_PROXY_URL: 'http://localhost:4000'
    }
  }]
};