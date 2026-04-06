module.exports = {
  apps: [
    {
      name: 'trulearnix-api',
      script: './apps/api/dist/index.js',
      env: { NODE_ENV: 'production', PORT: 5000 },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
    },
    {
      name: 'trulearnix-web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: './apps/web',
      env: { NODE_ENV: 'production' },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
    },
    {
      name: 'trulearnix-admin',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: './apps/admin',
      env: { NODE_ENV: 'production' },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
    }
  ]
}
