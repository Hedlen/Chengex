#!/usr/bin/env node

/**
 * MySQL数据库安全初始化脚本
 * 专为保护现有数据设计 - 绝不删除现有的博客和视频数据
 * 
 * 功能特性：
 * - 只创建缺失的表，不删除现有表
 * - 保护所有现有数据（博客、视频、用户等）
 * - 智能检测表结构和数据状态
 * - 详细的操作日志和安全提示
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from './DatabaseService.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库表定义（安全版本 - 使用 CREATE TABLE IF NOT EXISTS）
const SAFE_TABLE_DEFINITIONS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'editor', 'user') DEFAULT 'user',
      status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      parent_id INT NULL,
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_parent (parent_id),
      INDEX idx_active (is_active),
      INDEX idx_sort (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  blogs: `
    CREATE TABLE IF NOT EXISTS blogs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      content LONGTEXT NOT NULL,
      excerpt TEXT,
      cover_image VARCHAR(500),
      category_id INT,
      author_id BIGINT,
      status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
      tags JSON,
      reading_time INT DEFAULT 0,
      view_count INT DEFAULT 0,
      like_count INT DEFAULT 0,
      comment_count INT DEFAULT 0,
      published_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_status (status),
      INDEX idx_category (category_id),
      INDEX idx_author (author_id),
      INDEX idx_published_at (published_at),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  videos: `
    CREATE TABLE IF NOT EXISTS videos (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      thumbnail VARCHAR(500),
      video_url VARCHAR(500) NOT NULL,
      platform ENUM('youtube', 'tiktok', 'bilibili', 'local') NOT NULL,
      platform_id VARCHAR(100),
      category_id INT,
      duration INT DEFAULT 0,
      view_count INT DEFAULT 0,
      like_count INT DEFAULT 0,
      comment_count INT DEFAULT 0,
      status ENUM('active', 'inactive', 'processing') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_platform (platform),
      INDEX idx_category (category_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  comments: `
    CREATE TABLE IF NOT EXISTS comments (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      content TEXT NOT NULL,
      author_name VARCHAR(100) NOT NULL,
      author_email VARCHAR(255),
      author_ip VARCHAR(45),
      content_type ENUM('blog', 'video') NOT NULL,
      content_id BIGINT NOT NULL,
      parent_id BIGINT NULL,
      status ENUM('pending', 'approved', 'rejected', 'spam') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_content (content_type, content_id),
      INDEX idx_parent (parent_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  user_interactions: `
    CREATE TABLE IF NOT EXISTS user_interactions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NULL,
      session_id VARCHAR(100),
      interaction_type ENUM('view', 'like', 'share', 'comment', 'download') NOT NULL,
      content_type ENUM('blog', 'video', 'page') NOT NULL,
      content_id BIGINT,
      metadata JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_user (user_id),
      INDEX idx_session (session_id),
      INDEX idx_content (content_type, content_id),
      INDEX idx_type (interaction_type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  page_views: `
    CREATE TABLE IF NOT EXISTS page_views (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      page_url VARCHAR(500) NOT NULL,
      page_title VARCHAR(255),
      user_id BIGINT NULL,
      session_id VARCHAR(100),
      ip_address VARCHAR(45),
      user_agent TEXT,
      referrer VARCHAR(500),
      device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
      browser VARCHAR(100),
      os VARCHAR(100),
      country VARCHAR(100),
      city VARCHAR(100),
      view_duration INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_url (page_url),
      INDEX idx_user (user_id),
      INDEX idx_session (session_id),
      INDEX idx_created_at (created_at),
      INDEX idx_device (device_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  blog_views: `
    CREATE TABLE IF NOT EXISTS blog_views (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      blog_id BIGINT NOT NULL,
      user_id BIGINT NULL,
      session_id VARCHAR(100),
      ip_address VARCHAR(45),
      reading_progress DECIMAL(5,2) DEFAULT 0.00,
      reading_time INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_blog (blog_id),
      INDEX idx_user (user_id),
      INDEX idx_session (session_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  video_plays: `
    CREATE TABLE IF NOT EXISTS video_plays (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      video_id BIGINT NOT NULL,
      user_id BIGINT NULL,
      session_id VARCHAR(100),
      ip_address VARCHAR(45),
      play_duration INT DEFAULT 0,
      completion_rate DECIMAL(5,2) DEFAULT 0.00,
      quality VARCHAR(20) DEFAULT 'auto',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_video (video_id),
      INDEX idx_user (user_id),
      INDEX idx_session (session_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  external_video_clicks: `
    CREATE TABLE IF NOT EXISTS external_video_clicks (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      video_url VARCHAR(500) NOT NULL,
      video_title VARCHAR(255),
      platform VARCHAR(50),
      user_id BIGINT NULL,
      session_id VARCHAR(100),
      ip_address VARCHAR(45),
      referrer VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_url (video_url),
      INDEX idx_platform (platform),
      INDEX idx_user (user_id),
      INDEX idx_session (session_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  external_video_returns: `
    CREATE TABLE IF NOT EXISTS external_video_returns (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      click_id BIGINT NOT NULL,
      return_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      time_spent INT DEFAULT 0,
      completion_estimated DECIMAL(5,2) DEFAULT 0.00,
      
      INDEX idx_click (click_id),
      INDEX idx_return_time (return_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  activity_logs: `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id BIGINT NULL,
      details JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_user (user_id),
      INDEX idx_action (action),
      INDEX idx_resource (resource_type, resource_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  cache_management: `
    CREATE TABLE IF NOT EXISTS cache_management (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      cache_key VARCHAR(255) UNIQUE NOT NULL,
      cache_value LONGTEXT,
      cache_type ENUM('page', 'api', 'query', 'session') DEFAULT 'page',
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_key (cache_key),
      INDEX idx_type (cache_type),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  system_config: `
    CREATE TABLE IF NOT EXISTS system_config (
      id INT PRIMARY KEY AUTO_INCREMENT,
      config_key VARCHAR(100) UNIQUE NOT NULL,
      config_value JSON NOT NULL,
      description TEXT,
      is_public BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_key (config_key),
      INDEX idx_public (is_public)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  user_preferences: `
    CREATE TABLE IF NOT EXISTS user_preferences (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NULL,
      session_id VARCHAR(100),
      preference_key VARCHAR(100) NOT NULL,
      preference_value JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_user (user_id),
      INDEX idx_session (session_id),
      INDEX idx_key (preference_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};

// 默认数据（只在表为空时插入）
const DEFAULT_DATA = {
  categories: [
    { name: '旅游攻略', slug: 'travel-guide', description: '旅游攻略和经验分享', sort_order: 1 },
    { name: '美食推荐', slug: 'food-recommendation', description: '各地美食推荐', sort_order: 2 },
    { name: '住宿体验', slug: 'accommodation', description: '酒店和民宿体验分享', sort_order: 3 },
    { name: '交通出行', slug: 'transportation', description: '交通工具和出行方式', sort_order: 4 },
    { name: '摄影分享', slug: 'photography', description: '旅行摄影作品和技巧', sort_order: 5 },
    { name: '文化体验', slug: 'culture', description: '当地文化和风俗体验', sort_order: 6 }
  ],
  
  system_config: [
    { config_key: 'site_title', config_value: '"旅行博客系统"', description: '网站标题' },
    { config_key: 'site_description', config_value: '"分享旅行经历，记录美好时光"', description: '网站描述' },
    { config_key: 'posts_per_page', config_value: '10', description: '每页显示文章数量' },
    { config_key: 'enable_comments', config_value: 'true', description: '是否启用评论功能' },
    { config_key: 'cache_duration', config_value: '3600', description: '缓存持续时间（秒）' },
    { config_key: 'max_upload_size', config_value: '10485760', description: '最大上传文件大小（字节）' }
  ]
};

/**
 * 检查表是否存在
 */
async function checkTableExists(db, tableName) {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = ?
    `, [tableName]);
    
    return result[0].count > 0;
  } catch (error) {
    console.warn(`⚠️ 检查表 ${tableName} 时出错:`, error.message);
    return false;
  }
}

/**
 * 检查表是否有数据
 */
async function checkTableHasData(db, tableName) {
  try {
    const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`);
    return result[0].count > 0;
  } catch (error) {
    console.warn(`⚠️ 检查表 ${tableName} 数据时出错:`, error.message);
    return false;
  }
}

/**
 * 安全地创建表
 */
async function createTableSafely(db, tableName, definition) {
  try {
    await db.query(definition);
    console.log(`  ✅ 表 ${tableName} 创建成功`);
    return true;
  } catch (error) {
    console.error(`  ❌ 创建表 ${tableName} 失败:`, error.message);
    return false;
  }
}

/**
 * 安全地插入默认数据
 */
async function insertDefaultDataSafely(db, tableName, data) {
  try {
    if (!data || data.length === 0) {
      return true;
    }

    const hasData = await checkTableHasData(db, tableName);
    if (hasData) {
      console.log(`  ℹ️ 表 ${tableName} 已有数据，跳过默认数据插入`);
      return true;
    }

    // 构建插入语句
    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    for (const row of data) {
      const values = columns.map(col => row[col]);
      await db.query(sql, values);
    }

    console.log(`  ✅ 表 ${tableName} 默认数据插入成功 (${data.length} 条记录)`);
    return true;
  } catch (error) {
    console.error(`  ❌ 插入默认数据到 ${tableName} 失败:`, error.message);
    return false;
  }
}

/**
 * 添加外键约束（在所有表创建完成后）
 */
async function addForeignKeyConstraints(db) {
  const constraints = [
    {
      table: 'categories',
      sql: 'ALTER TABLE categories ADD CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL'
    },
    {
      table: 'blogs',
      sql: 'ALTER TABLE blogs ADD CONSTRAINT fk_blogs_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL'
    },
    {
      table: 'blogs',
      sql: 'ALTER TABLE blogs ADD CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL'
    },
    {
      table: 'videos',
      sql: 'ALTER TABLE videos ADD CONSTRAINT fk_videos_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL'
    },
    {
      table: 'comments',
      sql: 'ALTER TABLE comments ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE'
    },
    {
      table: 'user_interactions',
      sql: 'ALTER TABLE user_interactions ADD CONSTRAINT fk_interactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
    },
    {
      table: 'page_views',
      sql: 'ALTER TABLE page_views ADD CONSTRAINT fk_page_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
    },
    {
      table: 'blog_views',
      sql: 'ALTER TABLE blog_views ADD CONSTRAINT fk_blog_views_blog FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE'
    },
    {
      table: 'blog_views',
      sql: 'ALTER TABLE blog_views ADD CONSTRAINT fk_blog_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
    },
    {
      table: 'video_plays',
      sql: 'ALTER TABLE video_plays ADD CONSTRAINT fk_video_plays_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE'
    },
    {
      table: 'video_plays',
      sql: 'ALTER TABLE video_plays ADD CONSTRAINT fk_video_plays_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
    },
    {
      table: 'external_video_returns',
      sql: 'ALTER TABLE external_video_returns ADD CONSTRAINT fk_returns_click FOREIGN KEY (click_id) REFERENCES external_video_clicks(id) ON DELETE CASCADE'
    },
    {
      table: 'activity_logs',
      sql: 'ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
    },
    {
      table: 'user_preferences',
      sql: 'ALTER TABLE user_preferences ADD CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    }
  ];

  console.log('\n🔗 添加外键约束...');
  
  for (const constraint of constraints) {
    try {
      // 检查约束是否已存在
      const constraintName = constraint.sql.match(/CONSTRAINT (\w+)/)?.[1];
      if (constraintName) {
        const exists = await db.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.table_constraints 
          WHERE constraint_schema = DATABASE() 
          AND table_name = ? 
          AND constraint_name = ?
        `, [constraint.table, constraintName]);
        
        if (exists[0].count > 0) {
          console.log(`  ℹ️ 约束 ${constraintName} 已存在，跳过`);
          continue;
        }
      }
      
      await db.query(constraint.sql);
      console.log(`  ✅ 外键约束添加成功: ${constraint.table}`);
    } catch (error) {
      // 外键约束失败不是致命错误，可能是因为约束已存在
      console.warn(`  ⚠️ 添加外键约束失败 (${constraint.table}):`, error.message);
    }
  }
}

/**
 * 主初始化函数
 */
async function initializeDatabaseSafely() {
  console.log('🛡️ 开始安全初始化MySQL数据库...');
  console.log('📍 当前工作目录:', process.cwd());
  console.log('🔒 数据保护模式：绝不删除现有数据\n');
  
  try {
    // 使用数据库服务实例
    
    // 从环境变量获取MySQL配置
    const config = {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'travelweb_user',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'travelweb_db'
    };

    console.log('🔗 连接MySQL数据库...');
    console.log(`📍 主机: ${config.host}:${config.port}`);
    console.log(`📍 数据库: ${config.database}`);
    console.log(`📍 用户: ${config.user}\n`);
    
    await db.connect(config);
    console.log('✅ 数据库连接成功\n');

    // 检查现有表状态
    console.log('🔍 检查现有表状态...');
    const tableStatus = {};
    const dataStatus = {};
    
    for (const tableName of Object.keys(SAFE_TABLE_DEFINITIONS)) {
      const exists = await checkTableExists(db, tableName);
      tableStatus[tableName] = exists;
      
      if (exists) {
        const hasData = await checkTableHasData(db, tableName);
        dataStatus[tableName] = hasData;
        
        if (hasData) {
          console.log(`  🔒 表 ${tableName}: 存在且有数据 (受保护)`);
        } else {
          console.log(`  📋 表 ${tableName}: 存在但无数据`);
        }
      } else {
        console.log(`  ❌ 表 ${tableName}: 不存在`);
      }
    }

    // 统计现有数据
    const existingTables = Object.values(tableStatus).filter(Boolean).length;
    const tablesWithData = Object.values(dataStatus).filter(Boolean).length;
    
    console.log(`\n📊 数据库状态统计:`);
    console.log(`   现有表数量: ${existingTables}/${Object.keys(SAFE_TABLE_DEFINITIONS).length}`);
    console.log(`   有数据的表: ${tablesWithData}`);
    
    if (tablesWithData > 0) {
      console.log(`\n🛡️ 数据保护提醒:`);
      console.log(`   检测到 ${tablesWithData} 个表包含数据`);
      console.log(`   这些数据将被完全保护，不会被修改或删除`);
    }

    // 创建缺失的表
    console.log(`\n📋 创建缺失的表...`);
    let createdCount = 0;
    
    for (const [tableName, definition] of Object.entries(SAFE_TABLE_DEFINITIONS)) {
      if (!tableStatus[tableName]) {
        const success = await createTableSafely(db, tableName, definition);
        if (success) {
          createdCount++;
        }
      } else {
        console.log(`  ℹ️ 表 ${tableName} 已存在，跳过创建`);
      }
    }

    // 添加外键约束
    await addForeignKeyConstraints(db);

    // 插入默认数据（只在表为空时）
    console.log(`\n📊 插入默认数据...`);
    let dataInsertCount = 0;
    
    for (const [tableName, data] of Object.entries(DEFAULT_DATA)) {
      if (tableStatus[tableName] && dataStatus[tableName]) {
        console.log(`  🔒 表 ${tableName} 已有数据，跳过默认数据插入（数据保护）`);
      } else {
        const success = await insertDefaultDataSafely(db, tableName, data);
        if (success) {
          dataInsertCount++;
        }
      }
    }

    // 最终报告
    console.log(`\n🎉 数据库安全初始化完成！\n`);
    
    console.log(`📋 操作摘要:`);
    console.log(`   创建新表: ${createdCount} 个`);
    console.log(`   插入默认数据: ${dataInsertCount} 个表`);
    console.log(`   保护现有数据: ${tablesWithData} 个表`);
    
    console.log(`\n🔒 数据保护状态:`);
    if (tablesWithData > 0) {
      console.log(`   ✅ 您的博客和视频数据已完全保护`);
      console.log(`   ✅ 没有任何现有数据被删除或修改`);
      console.log(`   ✅ 所有现有内容保持原样`);
    } else {
      console.log(`   ℹ️ 未检测到现有数据，已插入默认配置`);
    }
    
    console.log(`\n📋 数据库信息:`);
    console.log(`   主机: ${config.host}:${config.port}`);
    console.log(`   数据库: ${config.database}`);
    console.log(`   用户: ${config.user}`);
    
    console.log(`\n🚀 现在可以启动应用程序了:`);
    console.log(`   npm start`);

  } catch (error) {
    console.error('\n❌ 数据库安全初始化失败:', error.message);
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
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  initializeDatabaseSafely()
    .then(() => {
      console.log('\n✅ 安全初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 安全初始化失败:', error);
      process.exit(1);
    });
}

export { initializeDatabaseSafely };