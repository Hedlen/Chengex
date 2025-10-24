#!/usr/bin/env node

/**
 * MySQL 密码更新工具
 * 用于重置 MySQL 密码后更新项目配置文件
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 询问用户输入
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// 隐藏密码输入
function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

// 读取当前 .env 文件
function readEnvFile() {
  try {
    if (!fs.existsSync(envPath)) {
      console.log(colors.yellow('⚠️  .env 文件不存在，将创建新文件'));
      return '';
    }
    return fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.error(colors.red('❌ 读取 .env 文件失败:'), error.message);
    return '';
  }
}

// 更新 .env 文件中的密码
function updateEnvPassword(envContent, newPassword) {
  const lines = envContent.split('\n');
  let passwordUpdated = false;
  
  const updatedLines = lines.map(line => {
    if (line.startsWith('DB_PASSWORD=')) {
      passwordUpdated = true;
      return `DB_PASSWORD=${newPassword}`;
    }
    return line;
  });
  
  // 如果没有找到 DB_PASSWORD 行，添加它
  if (!passwordUpdated) {
    updatedLines.push(`DB_PASSWORD=${newPassword}`);
  }
  
  return updatedLines.join('\n');
}

// 写入 .env 文件
function writeEnvFile(content) {
  try {
    fs.writeFileSync(envPath, content, 'utf8');
    console.log(colors.green('✅ .env 文件更新成功'));
    return true;
  } catch (error) {
    console.error(colors.red('❌ 写入 .env 文件失败:'), error.message);
    return false;
  }
}

// 测试数据库连接
async function testDatabaseConnection(config) {
  try {
    console.log(colors.blue('🔄 正在测试数据库连接...'));
    
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: 10000
    });
    
    await connection.ping();
    await connection.end();
    
    console.log(colors.green('✅ 数据库连接测试成功！'));
    return true;
  } catch (error) {
    console.error(colors.red('❌ 数据库连接测试失败:'), error.message);
    return false;
  }
}

// 解析当前环境变量
function parseCurrentConfig(envContent) {
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: ''
  };
  
  const lines = envContent.split('\n');
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      switch (key.trim()) {
        case 'DB_HOST':
          config.host = value.trim();
          break;
        case 'DB_PORT':
          config.port = parseInt(value.trim()) || 3306;
          break;
        case 'DB_USER':
          config.user = value.trim();
          break;
        case 'DB_PASSWORD':
          config.password = value.trim();
          break;
      }
    }
  });
  
  return config;
}

// 显示帮助信息
function showHelp() {
  console.log(colors.bold('\n📖 MySQL 密码重置指南\n'));
  
  console.log(colors.cyan('如果您忘记了 MySQL 密码，请按以下步骤操作：\n'));
  
  console.log(colors.yellow('方法一：使用 MySQL 安全模式重置'));
  console.log('1. 停止 MySQL 服务：');
  console.log('   net stop mysql');
  console.log('');
  console.log('2. 创建重置文件：');
  console.log('   echo ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'new_password\'; > reset.sql');
  console.log('');
  console.log('3. 安全模式启动：');
  console.log('   mysqld --init-file=reset.sql');
  console.log('');
  console.log('4. 重启 MySQL 服务：');
  console.log('   net start mysql');
  console.log('');
  
  console.log(colors.yellow('方法二：使用 MySQL 命令行'));
  console.log('1. 尝试无密码登录：');
  console.log('   mysql -u root');
  console.log('');
  console.log('2. 设置新密码：');
  console.log('   ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'new_password\';');
  console.log('   FLUSH PRIVILEGES;');
  console.log('');
  
  console.log(colors.green('密码重置成功后，运行此脚本更新项目配置！\n'));
}

// 主函数
async function main() {
  console.log(colors.bold(colors.blue('🔐 MySQL 密码更新工具\n')));
  
  // 检查参数
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    rl.close();
    return;
  }
  
  try {
    // 读取当前配置
    const envContent = readEnvFile();
    const currentConfig = parseCurrentConfig(envContent);
    
    console.log(colors.cyan('当前数据库配置：'));
    console.log(`  主机: ${currentConfig.host}`);
    console.log(`  端口: ${currentConfig.port}`);
    console.log(`  用户: ${currentConfig.user}`);
    console.log(`  密码: ${currentConfig.password ? '***已设置***' : '***未设置***'}\n`);
    
    // 询问是否需要查看密码重置指南
    const needHelp = await askQuestion(colors.yellow('是否需要查看密码重置指南？(y/n): '));
    if (needHelp.toLowerCase() === 'y' || needHelp.toLowerCase() === 'yes') {
      showHelp();
    }
    
    // 确认是否继续
    const proceed = await askQuestion(colors.blue('您是否已经重置了 MySQL 密码并准备更新配置？(y/n): '));
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      console.log(colors.yellow('操作已取消。请先重置 MySQL 密码后再运行此脚本。'));
      rl.close();
      return;
    }
    
    // 询问数据库配置
    const host = await askQuestion(`数据库主机 (当前: ${currentConfig.host}): `) || currentConfig.host;
    const portInput = await askQuestion(`数据库端口 (当前: ${currentConfig.port}): `);
    const port = portInput ? parseInt(portInput) : currentConfig.port;
    const user = await askQuestion(`数据库用户名 (当前: ${currentConfig.user}): `) || currentConfig.user;
    
    // 询问新密码
    const newPassword = await askPassword(colors.green('请输入新的数据库密码: '));
    
    if (!newPassword) {
      console.log(colors.red('\n❌ 密码不能为空'));
      rl.close();
      return;
    }
    
    // 确认密码
    const confirmPassword = await askPassword(colors.green('请再次输入密码确认: '));
    
    if (newPassword !== confirmPassword) {
      console.log(colors.red('\n❌ 两次输入的密码不一致'));
      rl.close();
      return;
    }
    
    console.log('');
    
    // 测试数据库连接
    const testConfig = { host, port, user, password: newPassword };
    const connectionSuccess = await testDatabaseConnection(testConfig);
    
    if (!connectionSuccess) {
      const forceUpdate = await askQuestion(colors.yellow('数据库连接失败，是否仍要更新配置文件？(y/n): '));
      if (forceUpdate.toLowerCase() !== 'y' && forceUpdate.toLowerCase() !== 'yes') {
        console.log(colors.yellow('操作已取消'));
        rl.close();
        return;
      }
    }
    
    // 更新配置文件
    let updatedContent = envContent;
    
    // 更新各个配置项
    updatedContent = updateEnvPassword(updatedContent, newPassword);
    
    // 更新其他配置项（如果有变化）
    if (host !== currentConfig.host) {
      updatedContent = updatedContent.replace(/^DB_HOST=.*/m, `DB_HOST=${host}`);
    }
    if (port !== currentConfig.port) {
      updatedContent = updatedContent.replace(/^DB_PORT=.*/m, `DB_PORT=${port}`);
    }
    if (user !== currentConfig.user) {
      updatedContent = updatedContent.replace(/^DB_USER=.*/m, `DB_USER=${user}`);
    }
    
    // 写入文件
    const writeSuccess = writeEnvFile(updatedContent);
    
    if (writeSuccess) {
      console.log(colors.green('\n🎉 密码更新完成！'));
      console.log(colors.blue('您现在可以重启应用程序以使用新的数据库配置。'));
      
      // 询问是否重启服务
      const restart = await askQuestion(colors.cyan('是否要重启开发服务器？(y/n): '));
      if (restart.toLowerCase() === 'y' || restart.toLowerCase() === 'yes') {
        console.log(colors.blue('请手动重启您的开发服务器以应用新配置。'));
      }
    }
    
  } catch (error) {
    console.error(colors.red('❌ 发生错误:'), error.message);
  } finally {
    rl.close();
  }
}

// 运行主函数
main().catch(console.error);