// PM2配置文件 - 支持多环境
const path = require('path');

// 基础配置
const baseConfig = {
  // 日志配置
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  
  // 进程管理
  autorestart: true,
  watch: false,
  restart_delay: 4000,
  max_restarts: 10,
  min_uptime: '10s',
  
  // 健康检查
  health_check_grace_period: 3000,
  health_check_fatal_exceptions: true,
  
  // 进程间通信
  kill_timeout: 5000,
  listen_timeout: 3000
};

// 开发环境配置
const developmentConfig = {
  apps: [
    {
      ...baseConfig,
      name: 'travelweb-dev',
      script: 'server.cjs',
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        HOST: 'localhost'
      },
      
      // 开发环境日志
      log_file: './logs/dev-combined.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log',
      
      // 开发环境监听文件变化
      watch: ['server.cjs', 'api/**/*.js'],
      ignore_watch: ['node_modules', 'logs', 'uploads', 'dist'],
      watch_options: {
        followSymlinks: false
      },
      
      max_memory_restart: '500M',
      env_file: '.env'
    }
  ]
};

// 生产环境配置
const productionConfig = {
  apps: [
    {
      ...baseConfig,
      name: 'travelweb-main',
      script: 'server.cjs',
      cwd: '/var/www/travelweb/current',
      instances: 'max', // 使用所有CPU核心
      exec_mode: 'cluster',
      
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      
      // 生产环境日志
      log_file: '/var/www/travelweb/logs/combined.log',
      out_file: '/var/www/travelweb/logs/out.log',
      error_file: '/var/www/travelweb/logs/error.log',
      
      // 性能优化
      node_args: '--max-old-space-size=2048 --optimize-for-size',
      max_memory_restart: '1G',
      
      // 环境变量文件
      env_file: '/var/www/travelweb/current/.env.tencent',
      
      // 集群配置
      instance_var: 'INSTANCE_ID',
      
      // 优雅关闭
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    
    {
      ...baseConfig,
      name: 'travelweb-worker',
      script: 'worker.js',
      cwd: '/var/www/travelweb/current',
      instances: 2,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'background'
      },
      
      // 后台任务日志
      log_file: '/var/www/travelweb/logs/worker-combined.log',
      out_file: '/var/www/travelweb/logs/worker-out.log',
      error_file: '/var/www/travelweb/logs/worker-error.log',
      
      max_memory_restart: '512M',
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
      'post-deploy': 'npm install --production && npm run build && pm2 reload pm2.config.js --env production && pm2 save',
      'pre-setup': 'mkdir -p /var/www/travelweb/logs',
      'ssh_options': 'StrictHostKeyChecking=no',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'ubuntu',
      host: ['staging.wisdomier.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/travelweb.git',
      path: '/var/www/travelweb-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload pm2.config.js --env staging && pm2 save',
      'pre-setup': 'mkdir -p /var/www/travelweb-staging/logs',
      'ssh_options': 'StrictHostKeyChecking=no',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};

// 测试环境配置
const testConfig = {
  apps: [
    {
      ...baseConfig,
      name: 'travelweb-test',
      script: 'server.cjs',
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'test',
        PORT: 3003,
        HOST: 'localhost'
      },
      
      log_file: './logs/test-combined.log',
      out_file: './logs/test-out.log',
      error_file: './logs/test-error.log',
      
      max_memory_restart: '256M',
      env_file: '.env.test'
    }
  ]
};

// 根据环境变量选择配置
const env = process.env.NODE_ENV || 'development';

let config;
switch (env) {
  case 'production':
    config = productionConfig;
    break;
  case 'test':
    config = testConfig;
    break;
  default:
    config = developmentConfig;
}

module.exports = config;