// 数据库连接工厂
// 根据配置创建相应的数据库适配器实例

import SQLiteAdapter from './adapters/SQLiteAdapter.js';
import MySQLAdapter from './adapters/MySQLAdapter.js';
import MemoryAdapter from './adapters/MemoryAdapter.js';

/**
 * 数据库工厂类
 * 负责根据配置创建相应的数据库适配器
 */
export class DatabaseFactory {
  /**
   * 创建数据库适配器
   * @param {Object} config - 数据库配置
   * @param {string} config.type - 数据库类型 ('sqlite' | 'mysql')
   * @returns {Promise<DatabaseAdapter>} 数据库适配器实例
   */
  static async createAdapter(config) {
    if (!config || !config.type) {
      throw new Error('数据库配置无效：缺少type字段');
    }

    switch (config.type.toLowerCase()) {
      case 'sqlite':
        // 如果指定了path，动态导入文件SQLite，否则使用内存SQLite
        if (config.path) {
          // 动态导入以避免在不需要时加载better-sqlite3
          const { SQLiteFileAdapter } = await import('./adapters/SQLiteFileAdapter.js');
          return new SQLiteFileAdapter(config);
        } else {
          return new SQLiteAdapter(config);
        }
      
      case 'mysql':
        return new MySQLAdapter(config);
      
      case 'memory':
        return new MemoryAdapter(config);
      
      default:
        throw new Error(`不支持的数据库类型: ${config.type}`);
    }
  }

  /**
   * 从环境变量创建数据库适配器
   * @returns {Promise<DatabaseAdapter>} 数据库适配器实例
   */
  static async createFromEnv() {
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    let config = {
      type: dbType
    };

    if (dbType === 'sqlite') {
      if (process.env.SQLITE_DB_PATH) {
        // 设置了SQLITE_DB_PATH则使用文件模式
        config.path = process.env.SQLITE_DB_PATH;
      }
      // 否则使用内存模式（不设置path）
    } else if (dbType === 'mysql') {
      // 支持DATABASE_URL格式
      if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        config = {
          type: 'mysql',
          host: url.hostname,
          port: parseInt(url.port) || 3306,
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1), // 移除开头的 '/'
          connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
        };
      } else {
        // 使用分离的环境变量
        config = {
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 3306,
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME,
          connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
        };
      }
    }

    return await DatabaseFactory.createAdapter(config);
  }

  /**
   * 验证数据库配置
   * @param {Object} config - 数据库配置
   * @returns {boolean} 配置是否有效
   */
  static validateConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    if (!config.type) {
      return false;
    }

    switch (config.type.toLowerCase()) {
      case 'sqlite':
        return true; // SQLite只需要type，path是可选的
      
      case 'mysql':
        // MySQL需要基本的连接信息
        return !!(config.host && config.user && config.database);
      
      default:
        return false;
    }
  }

  /**
   * 获取支持的数据库类型列表
   * @returns {Array<string>} 支持的数据库类型
   */
  static getSupportedTypes() {
    return ['sqlite', 'mysql'];
  }

  /**
   * 获取默认配置
   * @param {string} type - 数据库类型
   * @returns {Object} 默认配置
   */
  static getDefaultConfig(type) {
    switch (type.toLowerCase()) {
      case 'sqlite':
        return {
          type: 'sqlite',
          path: './data/database.db'
        };
      
      case 'mysql':
        return {
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          user: 'root',
          password: '',
          database: 'travelweb',
          connectionLimit: 10
        };
      
      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }
}

/**
 * 数据库管理器
 * 管理数据库连接的生命周期
 */
export class DatabaseManager {
  constructor() {
    this.adapter = null;
    this.config = null;
  }

  /**
   * 初始化数据库连接
   * @param {Object} config - 数据库配置
   */
  async initialize(config = null) {
    try {
      // 如果没有提供配置，从环境变量创建
      if (!config) {
        this.adapter = await DatabaseFactory.createFromEnv();
      } else {
        this.adapter = await DatabaseFactory.createAdapter(config);
      }

      this.config = config;
      
      // 连接数据库
      await this.adapter.connect();
      
      console.log(`✅ 数据库管理器初始化成功 (${this.adapter.getType()})`);
    } catch (error) {
      console.error('❌ 数据库管理器初始化失败:', error.message);
      throw error;
    }
  }



  /**
   * 创建数据库表结构
   */
  async createTables() {
    const adapter = this.adapter;
    
    // 创建分类表
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_zh TEXT NOT NULL,
        name_en TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建博客表
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        title_en TEXT,
        content TEXT NOT NULL,
        content_en TEXT,
        summary TEXT,
        summary_en TEXT,
        category TEXT,
        tags TEXT DEFAULT '[]',
        tags_en TEXT DEFAULT '[]',
        status TEXT DEFAULT 'published',
        featured_image TEXT,
        cover_image TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_at DATETIME
      )
    `);
    
    // 创建视频表
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        title_en TEXT,
        description TEXT,
        description_en TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration INTEGER DEFAULT 0,
        category TEXT,
        tags TEXT DEFAULT '[]',
        tags_en TEXT DEFAULT '[]',
        status TEXT DEFAULT 'published',
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建用户表
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);
    
    // 创建评论表
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blog_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blog_id) REFERENCES blogs(id)
      )
    `);
    
    // 创建活动日志表
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        description TEXT,
        user_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建页面浏览统计表
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_url TEXT NOT NULL,
        page_title TEXT,
        session_id TEXT,
        user_agent TEXT,
        referrer TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建系统配置表
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_key TEXT UNIQUE NOT NULL,
        config_value TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * 插入示例数据
   */
  async insertSampleData() {
    const adapter = this.adapter;
    
    // 检查是否已有数据
    try {
      const existingBlogs = await adapter.query('SELECT COUNT(*) as count FROM blogs');
      if (existingBlogs[0]?.count > 0) {
        console.log('ℹ️ 数据库已包含数据，跳过数据初始化');
        return;
      }
    } catch (error) {
      // 表可能不存在，继续初始化
    }
    
    // 插入分类数据
    const categories = [
      { name_zh: '旅游攻略', name_en: 'Travel Guide', description: '详细的旅游攻略和建议' },
      { name_zh: '美食探索', name_en: 'Food Discovery', description: '当地美食推荐和体验' },
      { name_zh: '文化体验', name_en: 'Cultural Experience', description: '深度文化体验和交流' },
      { name_zh: '自然风光', name_en: 'Natural Scenery', description: '自然景观和户外活动' },
      { name_zh: '城市漫步', name_en: 'City Walk', description: '城市探索和街头文化' },
      { name_zh: '历史古迹', name_en: 'Historical Sites', description: '历史遗迹和古建筑' },
      { name_zh: '摄影分享', name_en: 'Photography', description: '旅行摄影技巧和作品分享' }
    ];
    
    for (const category of categories) {
      await adapter.execute(
        'INSERT INTO categories (name_zh, name_en, description) VALUES (?, ?, ?)',
        [category.name_zh, category.name_en, category.description]
      );
    }
    
    // 插入博客数据
    const blogs = [
      {
        title: '探索神秘的马尔代夫',
        title_en: 'Exploring the Mysterious Maldives',
        content: '马尔代夫是一个由1192个珊瑚岛组成的岛国，以其清澈的海水、白色的沙滩和豪华的度假村而闻名。这里是蜜月旅行和潜水爱好者的天堂。',
        content_en: 'The Maldives is an island nation consisting of 1,192 coral islands, famous for its crystal-clear waters, white sandy beaches, and luxury resorts. It is a paradise for honeymooners and diving enthusiasts.',
        summary: '马尔代夫旅游完整攻略，包括最佳旅行时间、住宿推荐、水上活动等。',
        summary_en: 'Complete Maldives travel guide including best travel times, accommodation recommendations, and water activities.',
        category: '旅游攻略',
        tags: JSON.stringify(['马尔代夫', '海岛', '度假', '潜水']),
        tags_en: JSON.stringify(['Maldives', 'Island', 'Resort', 'Diving']),
        status: 'published',
        cover_image: '/images/maldives-cover.jpg',
        views: 1250,
        likes: 89,
        published_at: new Date('2024-01-15').toISOString()
      },
      {
        title: '京都古寺巡礼',
        title_en: 'Kyoto Ancient Temple Pilgrimage',
        content: '京都拥有超过2000座寺庙和神社，每一座都承载着深厚的历史文化。从清水寺到金阁寺，从伏见稻荷到银阁寺，让我们一起探索这些古老建筑的魅力。',
        content_en: 'Kyoto has over 2,000 temples and shrines, each carrying deep historical culture. From Kiyomizu-dera to Kinkaku-ji, from Fushimi Inari to Ginkaku-ji, let us explore the charm of these ancient buildings together.',
        summary: '京都主要寺庙参观指南，包括交通路线、参观时间、文化背景介绍。',
        summary_en: 'Guide to major temples in Kyoto including transportation routes, visiting hours, and cultural background.',
        category: '文化体验',
        tags: JSON.stringify(['京都', '寺庙', '文化', '历史']),
        tags_en: JSON.stringify(['Kyoto', 'Temple', 'Culture', 'History']),
        status: 'published',
        cover_image: '/images/kyoto-temple.jpg',
        views: 980,
        likes: 67,
        published_at: new Date('2024-01-20').toISOString()
      },
      {
        title: '巴黎街头美食指南',
        title_en: 'Paris Street Food Guide',
        content: '巴黎不仅有米其林餐厅，街头美食同样精彩。从传统的可丽饼到现代的美食卡车，巴黎的街头美食文化丰富多彩，值得深度探索。',
        content_en: 'Paris not only has Michelin restaurants, but street food is equally exciting. From traditional crepes to modern food trucks, Paris street food culture is rich and colorful, worth exploring in depth.',
        summary: '巴黎街头美食完整指南，推荐最佳美食地点和必尝小吃。',
        summary_en: 'Complete guide to Paris street food, recommending the best food locations and must-try snacks.',
        category: '美食探索',
        tags: JSON.stringify(['巴黎', '美食', '街头小吃', '法国']),
        tags_en: JSON.stringify(['Paris', 'Food', 'Street Food', 'France']),
        status: 'published',
        cover_image: '/images/paris-food.jpg',
        views: 756,
        likes: 45,
        published_at: new Date('2024-01-25').toISOString()
      },
      {
        title: '冰岛极光追寻之旅',
        title_en: 'Iceland Northern Lights Hunting Journey',
        content: '冰岛是观赏北极光的最佳地点之一。从雷克雅未克到瓦特纳冰川，从黑沙滩到蓝湖温泉，冰岛的自然奇观让人叹为观止。',
        content_en: 'Iceland is one of the best places to see the Northern Lights. From Reykjavik to Vatnajökull Glacier, from black sand beaches to Blue Lagoon hot springs, Iceland natural wonders are breathtaking.',
        summary: '冰岛极光观赏攻略，包括最佳观赏时间、地点推荐、拍摄技巧。',
        summary_en: 'Iceland Northern Lights viewing guide including best viewing times, location recommendations, and photography tips.',
        category: '自然风光',
        tags: JSON.stringify(['冰岛', '极光', '自然', '摄影']),
        tags_en: JSON.stringify(['Iceland', 'Northern Lights', 'Nature', 'Photography']),
        status: 'published',
        cover_image: '/images/iceland-aurora.jpg',
        views: 1420,
        likes: 112,
        published_at: new Date('2024-02-01').toISOString()
      },
      {
        title: '纽约艺术博物馆之旅',
        title_en: 'New York Art Museum Tour',
        content: '纽约拥有世界级的艺术博物馆，从大都会艺术博物馆到现代艺术博物馆，从古根海姆到惠特尼，每一座博物馆都是艺术的殿堂。',
        content_en: 'New York has world-class art museums, from the Metropolitan Museum of Art to the Museum of Modern Art, from Guggenheim to Whitney, each museum is a temple of art.',
        summary: '纽约主要艺术博物馆参观指南，包括展览亮点、参观路线、门票信息。',
        summary_en: 'Guide to major art museums in New York including exhibition highlights, visiting routes, and ticket information.',
        category: '文化体验',
        tags: JSON.stringify(['纽约', '博物馆', '艺术', '文化']),
        tags_en: JSON.stringify(['New York', 'Museum', 'Art', 'Culture']),
        status: 'published',
        cover_image: '/images/nyc-museum.jpg',
        views: 634,
        likes: 38,
        published_at: new Date('2024-02-05').toISOString()
      },
      {
        title: '泰国清迈慢生活体验',
        title_en: 'Chiang Mai Slow Life Experience',
        content: '清迈是泰国北部的文化古城，这里有古老的寺庙、传统的手工艺、美味的街头小吃，还有悠闲的生活节奏，是体验慢生活的理想之地。',
        content_en: 'Chiang Mai is a cultural ancient city in northern Thailand, with ancient temples, traditional handicrafts, delicious street food, and a leisurely pace of life, making it an ideal place to experience slow living.',
        summary: '清迈慢生活体验指南，包括文化景点、手工艺体验、美食推荐。',
        summary_en: 'Chiang Mai slow life experience guide including cultural attractions, handicraft experiences, and food recommendations.',
        category: '文化体验',
        tags: JSON.stringify(['清迈', '泰国', '慢生活', '文化']),
        tags_en: JSON.stringify(['Chiang Mai', 'Thailand', 'Slow Life', 'Culture']),
        status: 'published',
        cover_image: '/images/chiang-mai.jpg',
        views: 892,
        likes: 56,
        published_at: new Date('2024-02-10').toISOString()
      },
      {
        title: '瑞士阿尔卑斯山徒步指南',
        title_en: 'Swiss Alps Hiking Guide',
        content: '瑞士阿尔卑斯山提供了世界上最美的徒步路线。从马特洪峰到少女峰，从因特拉肯到采尔马特，每一条路线都能让你领略到阿尔卑斯山的壮美。',
        content_en: 'The Swiss Alps offer some of the most beautiful hiking routes in the world. From Matterhorn to Jungfraujoch, from Interlaken to Zermatt, each route allows you to appreciate the magnificence of the Alps.',
        summary: '瑞士阿尔卑斯山徒步完整指南，包括路线推荐、装备清单、安全提示。',
        summary_en: 'Complete Swiss Alps hiking guide including route recommendations, equipment lists, and safety tips.',
        category: '自然风光',
        tags: JSON.stringify(['瑞士', '阿尔卑斯山', '徒步', '自然']),
        tags_en: JSON.stringify(['Switzerland', 'Alps', 'Hiking', 'Nature']),
        status: 'published',
        cover_image: '/images/swiss-alps.jpg',
        views: 1156,
        likes: 78,
        published_at: new Date('2024-02-15').toISOString()
      },
      {
        title: '摩洛哥撒哈拉沙漠探险',
        title_en: 'Morocco Sahara Desert Adventure',
        content: '撒哈拉沙漠是世界上最大的热带沙漠，在摩洛哥的梅尔祖卡，你可以体验骆驼徒步、沙漠露营、观赏日出日落，感受沙漠的神秘魅力。',
        content_en: 'The Sahara Desert is the largest tropical desert in the world. In Merzouga, Morocco, you can experience camel trekking, desert camping, watching sunrise and sunset, and feel the mysterious charm of the desert.',
        summary: '摩洛哥撒哈拉沙漠探险指南，包括行程安排、装备准备、注意事项。',
        summary_en: 'Morocco Sahara Desert adventure guide including itinerary planning, equipment preparation, and precautions.',
        category: '自然风光',
        tags: JSON.stringify(['摩洛哥', '撒哈拉', '沙漠', '探险']),
        tags_en: JSON.stringify(['Morocco', 'Sahara', 'Desert', 'Adventure']),
        status: 'published',
        cover_image: '/images/sahara-desert.jpg',
        views: 1034,
        likes: 69,
        published_at: new Date('2024-02-20').toISOString()
      },
      {
        title: '希腊圣托里尼岛浪漫之旅',
        title_en: 'Romantic Journey to Santorini, Greece',
        content: '圣托里尼岛以其独特的蓝白建筑、壮观的日落和浪漫的氛围而闻名。从伊亚小镇到费拉镇，从红海滩到黑海滩，这里是蜜月旅行的完美选择。',
        content_en: 'Santorini is famous for its unique blue and white architecture, spectacular sunsets, and romantic atmosphere. From Oia to Fira, from Red Beach to Black Beach, this is the perfect choice for a honeymoon trip.',
        summary: '圣托里尼岛浪漫旅行指南，包括最佳观景点、住宿推荐、美食体验。',
        summary_en: 'Romantic travel guide to Santorini including best viewpoints, accommodation recommendations, and culinary experiences.',
        category: '旅游攻略',
        tags: JSON.stringify(['希腊', '圣托里尼', '浪漫', '蜜月']),
        tags_en: JSON.stringify(['Greece', 'Santorini', 'Romantic', 'Honeymoon']),
        status: 'published',
        cover_image: '/images/santorini.jpg',
        views: 1387,
        likes: 95,
        published_at: new Date('2024-02-25').toISOString()
      }
    ];
    
    for (const blog of blogs) {
      await adapter.execute(`
        INSERT INTO blogs (
          title, title_en, content, content_en, summary, summary_en,
          category, tags, tags_en, status, cover_image, views, likes, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        blog.title, blog.title_en, blog.content, blog.content_en,
        blog.summary, blog.summary_en, blog.category, blog.tags, blog.tags_en,
        blog.status, blog.cover_image, blog.views, blog.likes, blog.published_at
      ]);
    }
    
    // 插入管理员用户
    await adapter.execute(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, ['admin', 'admin@travelweb.com', '$2b$10$dummy.hash.for.demo', 'admin']);
    
    // 插入系统配置
    const configs = [
      { key: 'site_title', value: '探索成都 - Explore Chengdu', description: '网站标题' },
      { key: 'site_description', value: '发现成都的美食、文化和旅游景点', description: '网站描述' },
      { key: 'contact_email', value: 'contact@explorechengdu.com', description: '联系邮箱' },
      { key: 'social_wechat', value: 'explorechengdu', description: '微信号' },
      { key: 'social_weibo', value: '@探索成都', description: '微博账号' }
    ];
    
    for (const config of configs) {
      await adapter.execute(
        'INSERT INTO system_config (config_key, config_value, description) VALUES (?, ?, ?)',
        [config.key, config.value, config.description]
      );
    }
  }

  /**
   * 获取数据库适配器
   * @returns {DatabaseAdapter} 数据库适配器
   */
  getAdapter() {
    if (!this.adapter) {
      throw new Error('数据库管理器未初始化');
    }
    return this.adapter;
  }

  /**
   * 切换数据库
   * @param {Object} newConfig - 新的数据库配置
   */
  async switchDatabase(newConfig) {
    try {
      // 关闭当前连接
      if (this.adapter) {
        await this.adapter.disconnect();
      }

      // 创建新的适配器
      this.adapter = await DatabaseFactory.createAdapter(newConfig);
      this.config = newConfig;
      
      // 连接新数据库
      await this.adapter.connect();
      
      console.log(`✅ 数据库切换成功 (${this.adapter.getType()})`);
    } catch (error) {
      console.error('❌ 数据库切换失败:', error.message);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    if (this.adapter) {
      await this.adapter.disconnect();
      this.adapter = null;
      this.config = null;
      console.log('✅ 数据库连接已关闭');
    }
  }

  /**
   * 获取数据库状态
   * @returns {Object} 数据库状态信息
   */
  getStatus() {
    return {
      connected: this.adapter ? this.adapter.isConnected() : false,
      type: this.adapter ? this.adapter.getType() : null,
      config: this.config
    };
  }
}

// 创建全局数据库管理器实例
export const dbManager = new DatabaseManager();

export default DatabaseFactory;