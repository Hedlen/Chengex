#!/usr/bin/env node

/**
 * MySQL数据库初始化脚本
 * 用于在部署时创建和初始化MySQL数据库
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDatabaseService } from './connection.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 初始化数据库表结构和数据
 */
async function initializeDatabase() {
  console.log('🗄️ 初始化MySQL数据库...');
  console.log('📍 当前工作目录:', process.cwd());
  
  try {
    // 获取数据库服务实例
    const db = getDatabaseService();
    
    // 从环境变量获取MySQL配置
    const config = {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'travelweb_user',
      password: process.env.DB_PASSWORD || '7481196mysql',
      database: process.env.DB_NAME || 'travelweb_db'
    };

    console.log('🔗 连接MySQL数据库...');
    console.log(`📍 主机: ${config.host}:${config.port}`);
    console.log(`📍 数据库: ${config.database}`);
    console.log(`📍 用户: ${config.user}`);
    
    await db.connect(config);
    console.log('✅ 数据库连接成功');

    // 检查是否已有数据
    try {
      const existingData = await db.query('SELECT COUNT(*) as count FROM destinations LIMIT 1');
      if (existingData && existingData[0] && existingData[0].count > 0) {
        console.log('ℹ️ 数据库已包含数据，跳过初始化');
        return;
      }
    } catch (error) {
      // 表不存在，继续初始化
      console.log('📋 数据库表不存在，开始创建...');
    }

    // 读取并执行SQL初始化脚本
    console.log('📋 创建数据库表结构...');
    const sqlFilePath = path.join(__dirname, 'init-tables.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL文件不存在: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 分割SQL语句并执行
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
        } catch (error) {
          console.warn(`⚠️ SQL语句执行警告: ${error.message}`);
          console.warn(`语句: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('✅ 数据库表结构创建完成');

    // 初始化基础数据
    console.log('📊 初始化基础数据...');
    const initDataPath = path.join(__dirname, 'init-data.js');
    
    if (fs.existsSync(initDataPath)) {
      const { initializeData } = await import('./init-data.js');
      await initializeData(db);
      console.log('✅ 基础数据初始化完成');
    } else {
      console.log('ℹ️ 未找到初始化数据文件，跳过数据初始化');
    }

    console.log('🎉 MySQL数据库初始化完成！');
    console.log('');
    console.log('📋 数据库信息:');
    console.log(`   主机: ${config.host}:${config.port}`);
    console.log(`   数据库: ${config.database}`);
    console.log(`   用户: ${config.user}`);
    console.log('');
    console.log('🚀 现在可以启动应用程序了:');
    console.log('   npm start');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('');
    console.error('🔧 请检查以下配置:');
    console.error('   1. MySQL服务是否正在运行');
    console.error('   2. 数据库连接信息是否正确');
    console.error('   3. 用户是否有足够的权限');
    console.error('   4. .env文件是否配置正确');
    console.error('');
    console.error('📋 当前配置:');
    console.error(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`   DB_PORT: ${process.env.DB_PORT || '3306'}`);
    console.error(`   DB_NAME: ${process.env.DB_NAME || 'travelweb_db'}`);
    console.error(`   DB_USER: ${process.env.DB_USER || 'travelweb_user'}`);
    console.error(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[已设置]' : '[未设置]'}`);
    
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('✅ 初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 初始化失败:', error);
      process.exit(1);
    });
}

export { initializeDatabase };