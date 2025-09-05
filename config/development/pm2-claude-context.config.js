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
      PORT: '4000',
      DATABASE_URL: process.env.DATABASE_URL
    },
    // Enhanced logging for Claude AI context
    log_file: '/tmp/weather-api.log',
    error_file: '/tmp/weather-api-error.log',
    out_file: '/tmp/weather-api-out.log',
    // Business context metadata
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Performance monitoring for Claude AI insights
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
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
    },
    // Enhanced logging for Claude AI context
    log_file: '/tmp/weather-frontend.log',
    error_file: '/tmp/weather-frontend-error.log',
    out_file: '/tmp/weather-frontend-out.log',
    // Business context metadata
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Performance monitoring for Claude AI insights
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }],

  // PM2 deployment configuration for Claude AI context
  deploy: {
    development: {
      user: 'roberts',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:robertspeer/nearest-nice-weather.git',
      path: '/home/robertspeer/Projects/GitRepo/nearest-nice-weather',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development',
      env: {
        NODE_ENV: 'development'
      }
    }
  }
};
