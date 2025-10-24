#!/usr/bin/env node

/**
 * 部署脚本 - 支持SQLite数据库的自动化部署
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检测包管理器
function getPackageManager() {
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    return 'npm';
  }
}

const packageManager = getPackageManager();

// 部署配置
const DEPLOY_CONFIG = {
  sqlite: {
    envFile: '.env.sqlite',
    buildCommand: `${packageManager} run build`,
    deployCommand: 'echo "SQLite部署配置完成"'
  },
  local: {
    envFile: '.env',
    buildCommand: `${packageManager} run build`,
    startCommand: `${packageManager} start`
  }
};

/**
 * 执行命令并输出结果
 */
function executeCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log(`✅ ${description} 完成`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    process.exit(1);
  }
}

/**
 * 复制环境配置文件
 */
function setupEnvironment(deployType) {
  const config = DEPLOY_CONFIG[deployType];
  if (!config) {
    console.error(`❌ 不支持的部署类型: ${deployType}`);
    process.exit(1);
  }

  const sourceEnv = path.join(__dirname, config.envFile);
  const targetEnv = path.join(__dirname, '.env');

  if (fs.existsSync(sourceEnv)) {
    console.log(`\n📋 复制环境配置: ${config.envFile} -> .env`);
    fs.copyFileSync(sourceEnv, targetEnv);
    console.log('✅ 环境配置已更新');
  } else {
    console.warn(`⚠️ 环境配置文件不存在: ${config.envFile}`);
  }
}

/**
 * 构建项目
 */
function buildProject(deployType) {
  const config = DEPLOY_CONFIG[deployType];
  
  // 构建前端
  executeCommand(config.buildCommand, '构建前端项目');
  
  // 构建管理后台
  executeCommand(`cd admin-panel && ${packageManager} run build`, '构建管理后台');
}

/**
 * 初始化SQLite数据库
 */
function initializeSQLiteDatabase() {
  console.log('\n🗄️ 初始化SQLite数据库...');
  
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 运行数据库初始化脚本
  try {
    executeCommand('node database/init-sqlite.js', '初始化SQLite数据库');
  } catch (error) {
    console.log('ℹ️ 数据库初始化脚本不存在，跳过初始化');
  }
}

/**
 * 验证部署环境
 */
function validateDeployment() {
  console.log('\n🔍 验证部署环境...');
  
  // 检查必要文件
  const requiredFiles = [
    'package.json',
    'server.cjs',
    'dist/index.html',
    'admin-panel/dist/index.html'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 缺少必要文件: ${file}`);
      process.exit(1);
    }
  }

  console.log('✅ 部署环境验证通过');
}

/**
 * 主部署函数
 */
function deploy() {
  const deployType = process.argv[2] || 'sqlite';
  
  console.log(`🚀 开始部署 (${deployType} 模式)...`);
  console.log('=' .repeat(50));

  try {
    // 1. 设置环境配置
    setupEnvironment(deployType);

    // 2. 安装依赖
    executeCommand(`${packageManager} install`, '安装项目依赖');
    executeCommand(`cd admin-panel && ${packageManager} install`, '安装管理后台依赖');

    // 3. 构建项目
    buildProject(deployType);

    // 4. 初始化数据库 (仅SQLite模式)
    if (deployType === 'sqlite') {
      initializeSQLiteDatabase();
    }

    // 5. 验证部署环境
    validateDeployment();

    // 6. 执行部署
    if (deployType === 'sqlite') {
      console.log('\n🌐 SQLite部署配置完成');
      console.log('项目已准备就绪，可以部署到任何支持Node.js的平台');
    } else if (deployType === 'local') {
      executeCommand('node server.cjs', '启动本地服务器');
    }

    console.log('\n🎉 部署准备完成！');
    
  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 显示帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📖 部署脚本使用说明

用法:
  node deploy.js [部署类型]

部署类型:
  sqlite  - SQLite数据库部署 (默认，适用于无服务器平台)
  local   - 本地部署 (使用当前环境配置)

示例:
  node deploy.js sqlite   # SQLite部署
  node deploy.js local    # 本地部署
  node deploy.js --help   # 显示帮助

环境配置文件:
  .env.sqlite - SQLite部署配置
  .env        - 默认环境配置
`);
  process.exit(0);
}

// 执行部署
deploy();