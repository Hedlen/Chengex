#!/usr/bin/env node

/**
 * SQLite数据库初始化脚本
 * 用于在部署时创建和初始化SQLite数据库
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

// 数据库文件路径
const DB_FILE_PATH = path.join(__dirname, 'travelweb.db');

/**
 * 初始化数据库表结构和数据
 */
async function initializeDatabase() {
  console.log('🗄️ 初始化SQLite数据库...');
  console.log('📍 当前工作目录:', process.cwd());
  console.log('📍 数据库文件路径:', DB_FILE_PATH);
  
  try {
    // 获取数据库服务实例
    const db = getDatabaseService();
    
    console.log('📁 创建数据库目录...');
    const dbDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 连接到SQLite数据库
    const config = {
      type: 'file',
      filePath: DB_FILE_PATH
    };
    await db.connect(config);
    console.log('✅ 数据库连接成功');

    // 检查是否已有数据
    try {
      const existingBlogs = await db.query('SELECT * FROM blogs LIMIT 1');
      if (existingBlogs && existingBlogs.length > 0) {
        console.log('ℹ️ 数据库已包含数据，跳过数据初始化');
        await db.close();
        return;
      }
    } catch (error) {
      console.log('ℹ️ 数据库表不存在，将创建新数据');
    }

    console.log('📊 初始化示例数据...');

    // 初始化博客数据
    const sampleBlogs = [
      {
        id: 1,
        title: '探索神秘的马尔代夫',
        content: '马尔代夫是一个由1192个珊瑚岛组成的岛国，以其清澈的海水、白色的沙滩和豪华的度假村而闻名。这里是蜜月旅行和潜水爱好者的天堂。',
        excerpt: '发现马尔代夫的美丽海岛和水上活动',
        author_id: 1,
        category_id: 1,
        status: 'published',
        featured_image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20maldives%20beach%20resort%20crystal%20clear%20water%20overwater%20bungalows&image_size=landscape_16_9',
        views: 1250,
        likes: 89,
        created_at: new Date('2024-01-15').toISOString(),
        updated_at: new Date('2024-01-15').toISOString()
      },
      {
        id: 2,
        title: '日本樱花季旅行指南',
        content: '每年春天，日本都会被粉色的樱花覆盖。从东京的上野公园到京都的哲学之道，樱花季是体验日本文化和自然美景的最佳时机。',
        excerpt: '春天赏樱的最佳地点和时间',
        author_id: 1,
        category_id: 2,
        status: 'published',
        featured_image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20cherry%20blossoms%20sakura%20season%20kyoto%20temple%20pink%20flowers&image_size=landscape_16_9',
        views: 2100,
        likes: 156,
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date('2024-02-01').toISOString()
      },
      {
        id: 3,
        title: '欧洲背包旅行攻略',
        content: '欧洲背包旅行是年轻人探索世界的经典方式。从巴黎的浪漫到罗马的历史，从阿姆斯特丹的自由到巴塞罗那的艺术，每个城市都有独特的魅力。',
        excerpt: '预算有限的欧洲多国游指南',
        author_id: 1,
        category_id: 3,
        status: 'published',
        featured_image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=european%20backpacking%20travel%20historic%20cities%20young%20travelers%20adventure&image_size=landscape_16_9',
        views: 1800,
        likes: 134,
        created_at: new Date('2024-02-15').toISOString(),
        updated_at: new Date('2024-02-15').toISOString()
      }
    ];

    // 插入博客数据
    for (const blog of sampleBlogs) {
      const columns = Object.keys(blog);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(blog);
      const insertSQL = `INSERT INTO blogs (${columns.join(', ')}) VALUES (${placeholders})`;
      await db.execute(insertSQL, values);
    }
    console.log(`✅ 已插入 ${sampleBlogs.length} 条博客数据`);

    // 初始化视频数据
    const sampleVideos = [
      {
        id: 1,
        title: '马尔代夫水下世界探索',
        description: '跟随我们的镜头，探索马尔代夫令人惊叹的水下世界，观赏五彩斑斓的珊瑚礁和热带鱼类。',
        video_url: 'https://example.com/videos/maldives-underwater.mp4',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=underwater%20coral%20reef%20tropical%20fish%20maldives%20diving&image_size=landscape_16_9',
        duration: 480,
        category_id: 1,
        status: 'published',
        author_id: 1,
        views: 5200,
        likes: 312,
        created_at: new Date('2024-01-20').toISOString(),
        updated_at: new Date('2024-01-20').toISOString()
      },
      {
        id: 2,
        title: '京都樱花盛开时光',
        description: '记录京都樱花季的美丽瞬间，从清水寺到金阁寺，感受日本传统文化与自然的完美融合。',
        video_url: 'https://example.com/videos/kyoto-sakura.mp4',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=kyoto%20cherry%20blossoms%20traditional%20temple%20spring%20japan&image_size=landscape_16_9',
        duration: 360,
        category_id: 2,
        status: 'published',
        author_id: 1,
        views: 3800,
        likes: 245,
        created_at: new Date('2024-02-05').toISOString(),
        updated_at: new Date('2024-02-05').toISOString()
      }
    ];

    // 插入视频数据
    for (const video of sampleVideos) {
      const columns = Object.keys(video);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(video);
      const insertSQL = `INSERT INTO videos (${columns.join(', ')}) VALUES (${placeholders})`;
      await db.execute(insertSQL, values);
    }
    console.log(`✅ 已插入 ${sampleVideos.length} 条视频数据`);

    // 初始化活动日志
    const sampleLogs = [
      {
        id: 1,
        action: 'blog_created',
        description: '创建了新博客: 探索神秘的马尔代夫',
        user_id: 1,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date('2024-01-15').toISOString()
      },
      {
        id: 2,
        action: 'video_uploaded',
        description: '上传了新视频: 马尔代夫水下世界探索',
        user_id: 1,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date('2024-01-20').toISOString()
      }
    ];

    // 插入活动日志
    for (const log of sampleLogs) {
      const columns = Object.keys(log);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(log);
      const insertSQL = `INSERT INTO activity_logs (${columns.join(', ')}) VALUES (${placeholders})`;
      await db.execute(insertSQL, values);
    }
    console.log(`✅ 已插入 ${sampleLogs.length} 条活动日志`);

    // 关闭数据库连接
    await db.close();

    console.log('🎉 SQLite数据库初始化完成！');
    console.log(`📁 数据库文件位置: ${DB_FILE_PATH}`);

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 直接运行初始化函数
initializeDatabase().catch(console.error);

export { initializeDatabase };