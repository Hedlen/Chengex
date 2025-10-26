#!/usr/bin/env node

/**
 * 宝塔部署上传脚本
 * 自动上传构建好的项目到宝塔服务器
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 配置信息（请根据实际情况修改）
const CONFIG = {
  server: {
    host: '101.42.21.165',
    user: 'ubuntu',
    port: 22,
    remotePath: '/www/wwwroot/chengex.wisdomier.com/'
  },
  exclude: [
    'node_modules',
    '.git',
    '.env',
    'deploy-package',
    '*.log',
    'tmp',
    'temp'
  ]
};

console.log('🚀 开始上传项目到宝塔服务器...\n');

// 检查构建文件
function checkBuildFiles() {
  console.log('📋 检查构建文件...');
  
  const frontendDist = path.join(projectRoot, 'dist');
  const adminDist = path.join(projectRoot, 'admin-panel', 'dist');
  
  if (!fs.existsSync(frontendDist)) {
    console.log('❌ 前端构建文件不存在，请先运行: npm run build:frontend');
    process.exit(1);
  }
  
  if (!fs.existsSync(adminDist)) {
    console.log('❌ 后台管理系统构建文件不存在，请先运行: npm run build:admin');
    process.exit(1);
  }
  
  console.log('✅ 构建文件检查完成\n');
}

// 创建 rsync 排除文件
function createExcludeFile() {
  const excludeFile = path.join(projectRoot, '.rsync-exclude');
  const excludeContent = CONFIG.exclude.join('\n') + '\n';
  fs.writeFileSync(excludeFile, excludeContent);
  return excludeFile;
}

// 上传文件到服务器
function uploadToServer() {
  console.log('📤 上传文件到服务器...');
  
  const { host, user, port, remotePath } = CONFIG.server;
  const excludeFile = createExcludeFile();
  
  try {
    // 使用 rsync 同步文件（如果可用）
    console.log('尝试使用 rsync 同步文件...');
    const rsyncCmd = `rsync -avz --progress --delete --exclude-from="${excludeFile}" -e "ssh -p ${port}" ./ ${user}@${host}:${remotePath}`;
    execSync(rsyncCmd, { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ rsync 同步完成');
  } catch (error) {
    console.log('⚠️  rsync 不可用，使用 scp 上传...');
    
    // 使用 scp 上传关键文件
    const uploadItems = [
      'dist',
      'admin-panel/dist',
      'src',
      'api',
      'database',
      'shared',
      'public',
      'server.cjs',
      'package.json',
      'package-lock.json',
      '.env.example',
      'nginx'
    ];
    
    uploadItems.forEach(item => {
      const itemPath = path.join(projectRoot, item);
      if (fs.existsSync(itemPath)) {
        try {
          const scpCmd = `scp -P ${port} -r "${item}" ${user}@${host}:${remotePath}`;
          console.log(`上传 ${item}...`);
          execSync(scpCmd, { cwd: projectRoot, stdio: 'inherit' });
          console.log(`✅ ${item} 上传完成`);
        } catch (scpError) {
          console.log(`❌ ${item} 上传失败:`, scpError.message);
        }
      }
    });
  }
  
  // 清理临时文件
  if (fs.existsSync(excludeFile)) {
    fs.unlinkSync(excludeFile);
  }
}

// 远程安装依赖和重启服务
function remoteSetup() {
  console.log('\n🔧 远程配置服务器...');
  
  const { host, user, port, remotePath } = CONFIG.server;
  
  const commands = [
    `cd ${remotePath}`,
    'npm install --production',
    'pm2 restart travelweb || pm2 start server.cjs --name "travelweb"',
    'pm2 save'
  ];
  
  const remoteCmd = commands.join(' && ');
  const sshCmd = `ssh -p ${port} ${user}@${host} "${remoteCmd}"`;
  
  try {
    console.log('执行远程命令...');
    execSync(sshCmd, { stdio: 'inherit' });
    console.log('✅ 远程配置完成');
  } catch (error) {
    console.log('⚠️  远程配置失败，请手动执行以下命令:');
    console.log(`ssh -p ${port} ${user}@${host}`);
    commands.forEach(cmd => console.log(`  ${cmd}`));
  }
}

// 显示部署后的访问信息
function showDeploymentInfo() {
  console.log('\n🎉 部署完成！');
  console.log('\n📋 访问信息:');
  console.log('🌐 前端网站: https://chengex.wisdomier.com');
  console.log('🔧 后台管理: https://chengex.admin.wisdomier.com');
  console.log('🔍 API 接口: https://chengex.wisdomier.com/api');
  
  console.log('\n🔧 常用命令:');
  console.log('查看服务状态: pm2 status');
  console.log('查看日志: pm2 logs travelweb');
  console.log('重启服务: pm2 restart travelweb');
  console.log('停止服务: pm2 stop travelweb');
}

// 主函数
function main() {
  try {
    checkBuildFiles();
    uploadToServer();
    remoteSetup();
    showDeploymentInfo();
  } catch (error) {
    console.error('❌ 上传失败:', error.message);
    console.log('\n💡 建议:');
    console.log('1. 检查 SSH 连接是否正常');
    console.log('2. 确认服务器地址和端口正确');
    console.log('3. 验证 SSH 密钥或密码认证');
    console.log('4. 检查服务器磁盘空间是否充足');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as uploadToBaota };