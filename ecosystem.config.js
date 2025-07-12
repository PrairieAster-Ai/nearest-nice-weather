module.exports = {
  apps: [{
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