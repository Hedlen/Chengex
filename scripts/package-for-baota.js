#!/usr/bin/env node

/**
 * 宝塔部署打包脚本
 * 自动打包项目文件，准备上传到宝塔面板
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 开始打包项目用于宝塔部署...\n');

// 检查必要的构建文件
function checkBuildFiles() {
  console.log('📋 检查构建文件...');
  
  const frontendDist = path.join(projectRoot, 'dist');
  const adminDist = path.join(projectRoot, 'admin-panel', 'dist');
  
  if (!fs.existsSync(frontendDist)) {
    console.log('❌ 前端构建文件不存在，正在构建...');
    execSync('npm run build:frontend', { cwd: projectRoot, stdio: 'inherit' });
  }
  
  if (!fs.existsSync(adminDist)) {
    console.log('❌ 后台管理系统构建文件不存在，正在构建...');
    execSync('npm run build:admin', { cwd: projectRoot, stdio: 'inherit' });
  }
  
  console.log('✅ 构建文件检查完成\n');
}

// 创建部署包
function createDeploymentPackage() {
  console.log('📦 创建部署包...');
  
  const deployDir = path.join(projectRoot, 'deploy-package');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const packageName = `travelweb-baota-${timestamp}`;
  const packageDir = path.join(deployDir, packageName);
  
  // 清理并创建部署目录
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(packageDir, { recursive: true });
  
  // 需要包含的文件和目录
  const includeItems = [
    'dist',                    // 前端构建文件
    'admin-panel/dist',        // 后台管理系统构建文件
    'admin-panel/.env.example', // 后台管理系统环境变量示例
    'admin-panel/package.json', // 后台管理系统依赖配置
    'admin-panel/README.md',   // 后台管理系统说明文档
    'src',                     // 后端源码
    'api',                     // API 路由
    'database',                // 数据库相关
    'shared',                  // 共享代码
    'public',                  // 静态资源
    'server.cjs',              // 服务器入口文件
    'package.json',            // 依赖配置
    'package-lock.json',       // 锁定版本
    '.env.example',            // 环境变量示例
    'README.md',               // 说明文档
    'nginx'                    // Nginx 配置
  ];
  
  // 复制文件
  console.log('📁 复制项目文件...');
  includeItems.forEach(item => {
    const srcPath = path.join(projectRoot, item);
    const destPath = path.join(packageDir, item);
    
    if (fs.existsSync(srcPath)) {
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDirectory(srcPath, destPath);
        console.log(`  ✅ ${item}/`);
      } else {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✅ ${item}`);
      }
    } else {
      console.log(`  ⚠️  ${item} 不存在，跳过`);
    }
  });
  
  // 创建部署说明文件
  createDeploymentInstructions(packageDir);
  
  // 创建压缩包
  console.log('\n🗜️  创建压缩包...');
  const zipFile = `${packageDir}.zip`;
  
  try {
    // 使用 PowerShell 创建压缩包（Windows）
    execSync(`powershell Compress-Archive -Path "${packageDir}\\*" -DestinationPath "${zipFile}" -Force`, {
      cwd: deployDir,
      stdio: 'inherit'
    });
    console.log(`✅ 压缩包创建成功: ${zipFile}`);
  } catch (error) {
    console.log('⚠️  PowerShell 压缩失败，尝试使用 7zip...');
    try {
      execSync(`7z a "${zipFile}" "${packageDir}\\*"`, { cwd: deployDir, stdio: 'inherit' });
      console.log(`✅ 压缩包创建成功: ${zipFile}`);
    } catch (error2) {
      console.log('❌ 压缩失败，请手动压缩 deploy-package 目录');
    }
  }
  
  console.log(`\n🎉 打包完成！`);
  console.log(`📦 部署包位置: ${packageDir}`);
  console.log(`🗜️  压缩包位置: ${zipFile}`);
  console.log(`\n📋 下一步操作:`);
  console.log(`1. 上传 ${path.basename(zipFile)} 到宝塔面板`);
  console.log(`2. 在宝塔面板中解压到网站根目录`);
  console.log(`3. 按照 DEPLOYMENT.md 说明进行配置`);
}

// 复制目录
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// 创建部署说明文件
function createDeploymentInstructions(packageDir) {
  const instructions = `# TravelWeb 宝塔部署说明

## 📋 部署步骤

### 1. 环境准备
- Node.js 18.x LTS
- MySQL 5.7+ 或 8.0+
- Nginx 1.20+
- PM2 进程管理器

### 2. 文件上传
1. 将此压缩包上传到宝塔面板
2. 解压到网站根目录: /www/wwwroot/你的域名/

### 3. 安装依赖
\`\`\`bash
cd /www/wwwroot/你的域名/
npm install --production
\`\`\`

### 4. 环境配置
1. 复制环境变量文件:
\`\`\`bash
cp .env.example .env
\`\`\`

2. 编辑 .env 文件，配置数据库和其他参数

### 5. 数据库初始化
\`\`\`bash
npm run init:mysql
\`\`\`

### 6. 启动服务
\`\`\`bash
pm2 start server.cjs --name "travelweb"
pm2 startup
pm2 save
\`\`\`

### 7. Nginx 配置
参考 nginx/ 目录下的配置文件

## 🔧 故障排除
- 检查 Node.js 版本: node --version
- 检查 PM2 状态: pm2 status
- 查看日志: pm2 logs travelweb
- 重启服务: pm2 restart travelweb

## 📞 技术支持
如遇问题，请查看主项目的 README.md 文件或联系技术支持。
`;

  fs.writeFileSync(path.join(packageDir, 'DEPLOYMENT.md'), instructions);
  console.log('  ✅ DEPLOYMENT.md');
}

// 主函数
function main() {
  try {
    checkBuildFiles();
    createDeploymentPackage();
  } catch (error) {
    console.error('❌ 打包失败:', error.message);
    process.exit(1);
  }
}

main();