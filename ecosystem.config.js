// PM2生产环境配置文件
module.exports = {
  apps: [
    {
      // 主应用配置
      name: 'travelweb-main',
      script: 'server.cjs',
      cwd: '/var/www/travelweb/current',
      instances: 'max', // 使用所有CPU核心
      exec_mode: 'cluster',
      
      // 环境配置
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      
      // 日志配置
      log_file: '/var/www/travelweb/logs/combined.log',
      out_file: '/var/www/travelweb/logs/out.log',
      error_file: '/var/www/travelweb/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 进程管理
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 性能优化
      node_args: '--max-old-space-size=2048',
      
      // 健康检查
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // 进程间通信
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // 环境变量文件
      env_file: '/var/www/travelweb/current/.env.tencent'
    },
    
    {
      // 管理面板配置（如果需要独立运行）
      name: 'travelweb-admin',
      script: 'admin-panel/server.js',
      cwd: '/var/www/travelweb/current',
      instances: 1,
      exec_mode: 'fork',
      
      // 环境配置
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOST: '0.0.0.0'
      },
      
      // 日志配置
      log_file: '/var/www/travelweb/logs/admin-combined.log',
      out_file: '/var/www/travelweb/logs/admin-out.log',
      error_file: '/var/www/travelweb/logs/admin-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 进程管理
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 5,
      min_uptime: '10s',
      
      // 健康检查
      health_check_grace_period: 3000,
      
      // 环境变量文件
      env_file: '/var/www/travelweb/current/.env.tencent'
    }
  ],
  
  // 部署配置
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['www.wisdomier.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/travelweb.git',
      path: '/var/www/travelweb',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};