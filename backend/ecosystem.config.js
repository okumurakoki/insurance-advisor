module.exports = {
  apps: [{
    name: 'insurance-advisor-api',
    script: './src/app.js',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      watch: true,
      ignore_watch: ['node_modules', 'logs', 'uploads']
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    merge_logs: true
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourname/insurance-advisor.git',
      path: '/home/ubuntu/insurance-advisor',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'ubuntu',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:yourname/insurance-advisor.git',
      path: '/home/ubuntu/insurance-advisor-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
};