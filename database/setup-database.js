#!/usr/bin/env node

/**
 * 数据库设置和初始化工具
 * 用于测试数据库连接、创建表结构和填充默认数据
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'travelweb_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'travelweb_db',
  charset: 'utf8mb4'
};

/**
 * 测试数据库连接
 */
async function testConnection() {
  console.log('🔍 测试数据库连接...');
  console.log(`📍 主机: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`📍 数据库: ${dbConfig.database}`);
  console.log(`📍 用户: ${dbConfig.user}`);
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    await connection.end();
    console.log('✅ 数据库连接成功！');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    // 提供详细的错误分析
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔧 解决方案:');
      console.log('1. 检查用户名和密码是否正确');
      console.log('2. 确保数据库用户有访问权限');
      console.log('3. 在宝塔面板中执行以下SQL命令:');
      console.log(`   CREATE USER IF NOT EXISTS '${dbConfig.user}'@'localhost' IDENTIFIED BY 'your_password';`);
      console.log(`   GRANT ALL PRIVILEGES ON ${dbConfig.database}.* TO '${dbConfig.user}'@'localhost';`);
      console.log('   FLUSH PRIVILEGES;');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 解决方案:');
      console.log('1. 检查MySQL服务是否启动');
      console.log('2. 检查端口号是否正确');
      console.log('3. 检查防火墙设置');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n🔧 解决方案:');
      console.log(`1. 数据库 '${dbConfig.database}' 不存在`);
      console.log('2. 请在宝塔面板中创建数据库');
    }
    
    return false;
  }
}

/**
 * 检查表是否存在
 */
async function checkTableExists(connection, tableName) {
  try {
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [dbConfig.database, tableName]
    );
    return rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 检查表是否有数据
 */
async function checkTableHasData(connection, tableName) {
  try {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`);
    return rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 创建表结构
 */
async function createTables(connection) {
  console.log('📋 创建数据库表结构...');
  
  const tables = {
    categories: `
      CREATE TABLE IF NOT EXISTS categories (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    
    blogs: `
      CREATE TABLE IF NOT EXISTS blogs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content LONGTEXT NOT NULL,
        excerpt TEXT,
        featured_image VARCHAR(500),
        category_id BIGINT,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        view_count BIGINT DEFAULT 0,
        like_count BIGINT DEFAULT 0,
        comment_count BIGINT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_status (status),
        INDEX idx_category (category_id),
        INDEX idx_featured (is_featured),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    
    videos: `
      CREATE TABLE IF NOT EXISTS videos (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        platform ENUM('youtube', 'tiktok', 'bilibili', 'local') DEFAULT 'local',
        platform_id VARCHAR(100),
        category_id BIGINT,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        view_count BIGINT DEFAULT 0,
        like_count BIGINT DEFAULT 0,
        duration INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_status (status),
        INDEX idx_platform (platform),
        INDEX idx_category (category_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  };
  
  for (const [tableName, sql] of Object.entries(tables)) {
    try {
      await connection.execute(sql);
      console.log(`✅ 表 ${tableName} 创建成功`);
    } catch (error) {
      console.error(`❌ 表 ${tableName} 创建失败:`, error.message);
      throw error;
    }
  }
}

/**
 * 插入默认数据
 */
async function insertDefaultData(connection) {
  console.log('📊 插入默认数据...');
  
  // 检查是否已有数据
  const hasCategories = await checkTableHasData(connection, 'categories');
  const hasBlogs = await checkTableHasData(connection, 'blogs');
  
  if (hasCategories && hasBlogs) {
    console.log('ℹ️ 数据库已包含数据，跳过数据初始化');
    return;
  }
  
  // 插入默认分类
  if (!hasCategories) {
    console.log('📂 插入默认分类...');
    const categories = [
      ['旅游攻略', 'travel-guide', '旅游攻略和经验分享', 1],
      ['美食推荐', 'food-recommendation', '各地美食推荐', 2],
      ['住宿体验', 'accommodation', '酒店和民宿体验分享', 3],
      ['交通指南', 'transportation', '交通方式和路线指南', 4],
      ['文化体验', 'culture', '当地文化和风俗体验', 5]
    ];
    
    for (const category of categories) {
      try {
        await connection.execute(
          'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)',
          category
        );
        console.log(`✅ 分类 "${category[0]}" 插入成功`);
      } catch (error) {
        console.log(`⚠️ 分类 "${category[0]}" 已存在，跳过`);
      }
    }
  }
  
  // 插入示例博客
  if (!hasBlogs) {
    console.log('📝 插入示例博客...');
    const blogs = [
      [
        '探索巴黎的浪漫之旅',
        'romantic-paris-journey',
        '巴黎，这座被誉为"光之城"的浪漫都市，每年吸引着数百万游客前来探索...',
        '巴黎是世界上最浪漫的城市之一，拥有埃菲尔铁塔、卢浮宫等著名景点。',
        '/images/paris.jpg',
        1,
        'published',
        1
      ],
      [
        '日本京都古寺巡礼',
        'kyoto-temple-tour',
        '京都作为日本的古都，保存着众多珍贵的寺庙和传统建筑...',
        '探索京都的古寺，感受日本传统文化的魅力。',
        '/images/kyoto.jpg',
        1,
        'published',
        1
      ],
      [
        '泰国街头美食指南',
        'thailand-street-food-guide',
        '泰国的街头美食文化丰富多彩，从酸辣的冬阴功汤到香甜的芒果糯米饭...',
        '品尝泰国地道的街头美食，体验当地的饮食文化。',
        '/images/thai-food.jpg',
        2,
        'published',
        1
      ]
    ];
    
    for (const blog of blogs) {
      try {
        await connection.execute(
          'INSERT INTO blogs (title, slug, content, excerpt, featured_image, category_id, status, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          blog
        );
        console.log(`✅ 博客 "${blog[0]}" 插入成功`);
      } catch (error) {
        console.log(`⚠️ 博客 "${blog[0]}" 已存在，跳过`);
      }
    }
  }
}

/**
 * 显示数据库统计信息
 */
async function showDatabaseStats(connection) {
  console.log('\n📊 数据库统计信息:');
  
  const tables = ['categories', 'blogs', 'videos'];
  
  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`📋 ${table}: ${rows[0].count} 条记录`);
    } catch (error) {
      console.log(`📋 ${table}: 表不存在`);
    }
  }
}

/**
 * 主函数
 */
async function setupDatabase() {
  console.log('🚀 开始数据库设置和初始化...\n');
  
  try {
    // 1. 测试数据库连接
    const connected = await testConnection();
    if (!connected) {
      console.log('\n❌ 数据库连接失败，请先解决连接问题');
      process.exit(1);
    }
    
    // 2. 连接数据库
    console.log('\n🔗 连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    
    // 3. 创建表结构
    console.log('\n📋 检查和创建表结构...');
    await createTables(connection);
    
    // 4. 插入默认数据
    console.log('\n📊 检查和插入默认数据...');
    await insertDefaultData(connection);
    
    // 5. 显示统计信息
    await showDatabaseStats(connection);
    
    // 6. 关闭连接
    await connection.end();
    
    console.log('\n🎉 数据库设置完成！');
    console.log('\n📝 接下来的步骤:');
    console.log('1. 重启网站服务: npm start');
    console.log('2. 访问网站: http://localhost:3002');
    console.log('3. 访问管理后台: http://localhost:3002/admin');
    console.log('4. 检查API健康状态: http://localhost:3002/api/health/database');
    
  } catch (error) {
    console.error('\n❌ 数据库设置失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  setupDatabase();
}

export { setupDatabase, testConnection };