module.exports = {
  apps: [
    {
      name: 'NowPaying',
      script: './index.js',
      // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
