// API服务器 - 处理所有API请求
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 动态导入数据库API
let dbApi;
(async () => {
  try {
    const module = await import('../database/api.js');
    dbApi = module;
    console.log('数据库API模块加载成功');
    
    if (dbApi.warmupCache) {
      await dbApi.warmupCache();
    }
  } catch (error) {
    console.error('加载数据库API模块失败:', error);
  }
})();

// 数据库API检查中间件
const checkDbApi = (req, res, next) => {
  if (!dbApi) {
    return res.status(500).json({ error: '数据库API未初始化' });
  }
  next();
};

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dbApi: !!dbApi
  });
});

// 博客API
app.get('/api/blogs', checkDbApi, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      language: req.query.lang
    };
    
    const blogs = await dbApi.getBlogs(filters);
    res.json(blogs);
  } catch (error) {
    console.error('获取博客列表失败:', error);
    res.status(500).json({ error: '获取博客列表失败' });
  }
});

app.get('/api/blogs/:id', checkDbApi, async (req, res) => {
  try {
    const language = req.query.lang || 'zh';
    const blog = await dbApi.getBlogById(req.params.id, language);
    if (!blog) {
      return res.status(404).json({ error: '博客不存在' });
    }
    res.json(blog);
  } catch (error) {
    console.error('获取博客详情失败:', error);
    res.status(500).json({ error: '获取博客详情失败' });
  }
});

// 分类API
app.get('/api/categories', checkDbApi, async (req, res) => {
  try {
    const language = req.query.lang || 'zh';
    const categories = await dbApi.getCategories(language);
    res.json(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 视频API
app.get('/api/videos', checkDbApi, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      language: req.query.lang
    };
    
    const videos = await dbApi.getVideos(filters);
    res.json(videos);
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({ error: '获取视频列表失败' });
  }
});

// 数据库信息API
app.get('/api/database/info', checkDbApi, async (req, res) => {
  try {
    // 获取统计数据
    const [blogStats, videoStats, pageViewStats] = await Promise.all([
      dbApi.getBlogStats().catch(() => ({ total: 0, published: 0, draft: 0 })),
      dbApi.getVideoStats().catch(() => ({ total: 0, published: 0, active: 0 })),
      dbApi.getPageViewStats().catch(() => ({ total: 0, unique: 0 }))
    ]);

    const databaseInfo = {
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || 'travelweb_db',
        user: process.env.DB_USER || 'travelweb_user'
      },
      tables: {
        blogs: {
          total: blogStats.total || 0,
          published: blogStats.published || 0,
          draft: blogStats.draft || 0
        },
        videos: {
          total: videoStats.total || 0,
          published: videoStats.published || 0,
          active: videoStats.active || 0
        },
        pageViews: {
          total: pageViewStats.total || 0,
          unique: pageViewStats.unique || 0
        },
        users: {
          total: 1,
          active: 1
        }
      }
    };

    res.json({ 
      success: true,
      data: databaseInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取数据库信息失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取数据库信息失败: ' + error.message 
    });
  }
});

// 导出Express应用
module.exports = app;