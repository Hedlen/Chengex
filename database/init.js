// 数据库初始化脚本
import { query, testConnection } from './connection.js';

// 创建数据库表结构
const createTables = async () => {
  try {
    console.log('开始创建数据库表结构...');

    // 创建博客表
    await query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        excerpt TEXT,
        featured_image VARCHAR(500),
        category VARCHAR(100),
        tags JSON,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        views_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_category (category),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 博客表创建成功');

    // 创建视频表
    await query(`
      CREATE TABLE IF NOT EXISTS videos (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        platform ENUM('youtube', 'tiktok', 'bilibili', 'local') DEFAULT 'local',
        platform_id VARCHAR(100),
        category VARCHAR(100),
        tags JSON,
        status ENUM('draft', 'published', 'active', 'archived') DEFAULT 'draft',
        views_count INT DEFAULT 0,
        duration INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_platform (platform),
        INDEX idx_category (category),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 视频表创建成功');

    // 创建页面浏览记录表
    await query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_url VARCHAR(500) NOT NULL,
        page_title VARCHAR(255),
        session_id VARCHAR(100),
        user_agent TEXT,
        referrer VARCHAR(500),
        view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_page_url (page_url),
        INDEX idx_session_id (session_id),
        INDEX idx_view_time (view_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 页面浏览表创建成功');

    // 创建博客浏览记录表
    await query(`
      CREATE TABLE IF NOT EXISTS blog_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        blog_id VARCHAR(36) NOT NULL,
        session_id VARCHAR(100),
        user_agent TEXT,
        referrer VARCHAR(500),
        view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
        INDEX idx_blog_id (blog_id),
        INDEX idx_session_id (session_id),
        INDEX idx_view_time (view_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 博客浏览记录表创建成功');

    // 创建视频播放记录表
    await query(`
      CREATE TABLE IF NOT EXISTS video_plays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        video_id VARCHAR(36) NOT NULL,
        session_id VARCHAR(100),
        user_agent TEXT,
        referrer VARCHAR(500),
        play_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
        INDEX idx_video_id (video_id),
        INDEX idx_session_id (session_id),
        INDEX idx_play_time (play_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 视频播放记录表创建成功');

    console.log('🎉 所有数据库表创建完成！');
  } catch (error) {
    console.error('❌ 创建数据库表失败:', error);
    throw error;
  }
};

// 插入示例数据
const insertSampleData = async () => {
  try {
    console.log('开始插入示例数据...');

    // 检查是否已有数据
    const blogCountResult = await query('SELECT COUNT(*) as count FROM blogs');
    const videoCountResult = await query('SELECT COUNT(*) as count FROM videos');

    if (blogCountResult[0].count === 0) {
      // 插入示例博客
      await query(`
        INSERT INTO blogs (id, title, content, excerpt, featured_image, category, tags, status, views_count) VALUES
        ('blog-1', '成都美食探索指南', '# 成都美食探索指南\n\n成都，这座被誉为"天府之国"的城市，不仅有着悠久的历史文化，更是中国著名的美食之都。从街头小吃到高档餐厅，从传统川菜到创新融合菜，成都的美食文化丰富多彩，令人流连忘返。\n\n## 必尝美食\n\n### 火锅\n成都火锅以其麻辣鲜香而闻名全国。推荐几家老字号火锅店：\n- 皇城老妈\n- 大龙燚\n- 小龙坎\n\n### 串串香\n串串香是成都人的最爱，几乎每个街角都能找到。\n\n### 担担面\n正宗的担担面应该是干拌的，麻辣鲜香。', '探索成都美食文化，从火锅到小吃，带你品味天府之国的美味。', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', '美食', '["美食", "成都", "火锅", "川菜"]', 'published', 156),
        ('blog-2', '成都周边古镇游', '# 成都周边古镇游\n\n成都周边有许多保存完好的古镇，每一个都有着独特的历史文化和建筑风格。这些古镇不仅是历史的见证，也是现代人寻找宁静和体验传统文化的好去处。\n\n## 推荐古镇\n\n### 黄龙溪古镇\n黄龙溪古镇位于成都市双流区，距离成都市区约40公里。这里有着1700多年的历史，是四川省历史文化名镇。\n\n### 洛带古镇\n洛带古镇被誉为"中国西部客家第一镇"，这里保存着完整的客家文化。\n\n### 平乐古镇\n平乐古镇有着"一平二固三夹关"的美誉，是茶马古道的重要驿站。', '探访成都周边的历史古镇，感受传统文化的魅力。', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', '旅游', '["旅游", "古镇", "历史", "文化"]', 'published', 89)
      `);
      console.log('✅ 示例博客数据插入成功');
    }

    if (videoCountResult[0].count === 0) {
      // 插入示例视频
      await query(`
        INSERT INTO videos (id, title, description, video_url, thumbnail_url, platform, category, tags, status, views_count, duration) VALUES
        ('video-1', '成都宽窄巷子漫步', '带你走进成都最具代表性的历史文化街区——宽窄巷子，感受老成都的慢生活。', 'https://www.youtube.com/watch?v=example1', 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800', 'youtube', '旅游', '["成都", "宽窄巷子", "历史", "文化"]', 'published', 234, 480),
        ('video-2', '成都火锅制作教程', '学习如何制作正宗的成都火锅底料，在家也能享受地道的成都味道。', 'https://www.youtube.com/watch?v=example2', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800', 'youtube', '美食', '["美食", "火锅", "教程", "川菜"]', 'published', 567, 720)
      `);
      console.log('✅ 示例视频数据插入成功');
    }

    // 插入一些页面浏览记录
    const sessionId = 'session-' + Date.now();
    await query(`
      INSERT INTO page_views (page_url, page_title, session_id, user_agent) VALUES
      ('/', '首页', ?, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
      ('/blogs', '博客列表', ?, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
      ('/videos', '视频列表', ?, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
      ('/blogs/blog-1', '成都美食探索指南', ?, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
      ('/videos/video-1', '成都宽窄巷子漫步', ?, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    `, [sessionId, sessionId, sessionId, sessionId, sessionId]);
    console.log('✅ 示例页面浏览数据插入成功');

    console.log('🎉 示例数据插入完成！');
  } catch (error) {
    console.error('❌ 插入示例数据失败:', error);
    throw error;
  }
};

// 主初始化函数
const initDatabase = async () => {
  try {
    console.log('🚀 开始初始化数据库...');
    
    // 测试连接
    const connected = await testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }

    // 创建表结构
    await createTables();

    // 插入示例数据
    await insertSampleData();

    console.log('✅ 数据库初始化完成！');
    console.log('\n数据库信息:');
    console.log('- 主机: localhost');
    console.log('- 端口: 3306');
    console.log('- 数据库: travelweb_db');
    console.log('- 用户: travelweb_user');
    console.log('- 密码: travelweb_password123');
    console.log('\n可以使用以下工具连接数据库:');
    console.log('- MySQL Workbench');
    console.log('- phpMyAdmin');
    console.log('- 命令行: mysql -h localhost -P 3306 -u travelweb_user -p travelweb_db');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
};

// 如果直接运行此脚本，则执行初始化
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  initDatabase();
}

export { initDatabase, createTables, insertSampleData };