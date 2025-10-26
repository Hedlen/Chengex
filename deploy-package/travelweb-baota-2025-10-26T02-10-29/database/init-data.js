/**
 * 初始化数据库数据
 * 创建基础的用户、分类和示例内容
 */

import db from './DatabaseService.js';
import { join } from 'path';

const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@travelweb.com',
    password_hash: '$2b$10$rQZ9QmjytWzQgwjvHUVKVOaP8h9aAGmhkqjLd5h5h5h5h5h5h5h5h',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const defaultCategories = [
  {
    id: 1,
    name: '旅行攻略',
    slug: 'travel-guide',
    description: '详细的旅行攻略和经验分享',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: '美食探索',
    slug: 'food-exploration',
    description: '各地美食推荐和体验',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: '风景摄影',
    slug: 'landscape-photography',
    description: '美丽风景和摄影技巧',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const defaultBlogs = [
  {
    id: 1,
    title: '探索巴黎的浪漫之旅',
    slug: 'romantic-paris-journey',
    content: '巴黎，这座充满浪漫气息的城市，每年吸引着数百万游客前来探索。从埃菲尔铁塔到卢浮宫，从塞纳河畔到香榭丽舍大街，每一个角落都散发着独特的魅力...',
    excerpt: '探索巴黎最浪漫的景点和体验，感受法式浪漫的独特魅力。',
    author_id: 1,
    category_id: 1,
    status: 'published',
    featured_image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20paris%20eiffel%20tower%20sunset%20beautiful%20cityscape&image_size=landscape_16_9',
    views: 1250,
    likes: 89,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: '东京美食指南：从街头小吃到米其林餐厅',
    slug: 'tokyo-food-guide',
    content: '东京作为世界美食之都，拥有最多的米其林星级餐厅。但除了高端餐厅，东京的街头美食同样令人惊艳。从筑地市场的新鲜寿司到涩谷的拉面店...',
    excerpt: '深度探索东京的美食文化，从街头小吃到顶级餐厅的完整指南。',
    author_id: 1,
    category_id: 2,
    status: 'published',
    featured_image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=tokyo%20street%20food%20sushi%20ramen%20japanese%20cuisine&image_size=landscape_16_9',
    views: 2100,
    likes: 156,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    title: '新西兰南岛摄影之旅',
    slug: 'new-zealand-photography',
    content: '新西兰南岛被誉为摄影师的天堂，这里有壮丽的雪山、清澈的湖泊、广阔的草原和神秘的峡湾。每一处风景都是大自然的杰作...',
    excerpt: '跟随镜头探索新西兰南岛的绝美风光，分享摄影技巧和最佳拍摄地点。',
    author_id: 1,
    category_id: 3,
    status: 'published',
    featured_image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=new%20zealand%20landscape%20mountains%20lake%20photography%20scenic&image_size=landscape_16_9',
    views: 890,
    likes: 67,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const defaultVideos = [
  {
    id: 1,
    title: '巴黎一日游完整攻略',
    slug: 'paris-one-day-tour',
    description: '跟随我们的镜头，用一天时间游览巴黎最经典的景点，体验法式浪漫。',
    video_url: 'https://example.com/videos/paris-tour.mp4',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=paris%20tour%20video%20thumbnail%20eiffel%20tower&image_size=landscape_16_9',
    duration: 1200,
    author_id: 1,
    category_id: 1,
    status: 'published',
    views: 5600,
    likes: 234,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: '东京拉面店探访',
    slug: 'tokyo-ramen-exploration',
    description: '探访东京最受欢迎的拉面店，品尝不同风味的正宗日式拉面。',
    video_url: 'https://example.com/videos/tokyo-ramen.mp4',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=tokyo%20ramen%20shop%20japanese%20food%20video&image_size=landscape_16_9',
    duration: 900,
    author_id: 1,
    category_id: 2,
    status: 'published',
    views: 3200,
    likes: 189,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

async function initializeData() {
  try {
    console.log('🚀 开始初始化数据库数据...');
    
    // 连接数据库
    await db.connect({
      type: 'file',
      filePath: join(process.cwd(), 'data', 'travelweb.json')
    });
    
    console.log('✅ 数据库连接成功');
    
    // 初始化用户数据
    console.log('👤 初始化用户数据...');
    for (const user of defaultUsers) {
      try {
        await db.query(
          'INSERT INTO users (id, username, email, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [user.id, user.username, user.email, user.password_hash, user.role, user.status, user.created_at, user.updated_at]
        );
        console.log(`   ✅ 创建用户: ${user.username}`);
      } catch (error) {
        console.log(`   ⚠️ 用户已存在: ${user.username}`);
      }
    }
    
    // 初始化分类数据
    console.log('📂 初始化分类数据...');
    for (const category of defaultCategories) {
      try {
        await db.query(
          'INSERT INTO categories (id, name, slug, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [category.id, category.name, category.slug, category.description, category.status, category.created_at, category.updated_at]
        );
        console.log(`   ✅ 创建分类: ${category.name}`);
      } catch (error) {
        console.log(`   ⚠️ 分类已存在: ${category.name}`);
      }
    }
    
    // 初始化博客数据
    console.log('📝 初始化博客数据...');
    for (const blog of defaultBlogs) {
      try {
        await db.query(
          'INSERT INTO blogs (id, title, slug, content, excerpt, author_id, category_id, status, featured_image, views, likes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [blog.id, blog.title, blog.slug, blog.content, blog.excerpt, blog.author_id, blog.category_id, blog.status, blog.featured_image, blog.views, blog.likes, blog.created_at, blog.updated_at]
        );
        console.log(`   ✅ 创建博客: ${blog.title}`);
      } catch (error) {
        console.log(`   ⚠️ 博客已存在: ${blog.title}`);
      }
    }
    
    // 初始化视频数据
    console.log('🎥 初始化视频数据...');
    for (const video of defaultVideos) {
      try {
        await db.query(
          'INSERT INTO videos (id, title, slug, description, video_url, thumbnail, duration, author_id, category_id, status, views, likes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [video.id, video.title, video.slug, video.description, video.video_url, video.thumbnail, video.duration, video.author_id, video.category_id, video.status, video.views, video.likes, video.created_at, video.updated_at]
        );
        console.log(`   ✅ 创建视频: ${video.title}`);
      } catch (error) {
        console.log(`   ⚠️ 视频已存在: ${video.title}`);
      }
    }
    
    // 验证数据
    console.log('📊 验证数据...');
    const userCount = (await db.query('SELECT * FROM users')).length;
    const categoryCount = (await db.query('SELECT * FROM categories')).length;
    const blogCount = (await db.query('SELECT * FROM blogs')).length;
    const videoCount = (await db.query('SELECT * FROM videos')).length;
    
    console.log(`   👤 用户数量: ${userCount}`);
    console.log(`   📂 分类数量: ${categoryCount}`);
    console.log(`   📝 博客数量: ${blogCount}`);
    console.log(`   🎥 视频数量: ${videoCount}`);
    
    await db.close();
    console.log('🎉 数据初始化完成!');
    
  } catch (error) {
    console.error('❌ 数据初始化失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 直接执行初始化
initializeData();

export default initializeData;