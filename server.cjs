const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ quiet: true });

const app = express();

// 动态导入数据库API
let dbApi;
(async () => {
  try {
    const module = await import('./database/api.js');
    dbApi = module;
    console.log('数据库API模块加载成功');
    
    // 预热缓存
    if (dbApi.warmupCache) {
      await dbApi.warmupCache();
    }
  } catch (error) {
    console.error('加载数据库API模块失败:', error);
  }
})();

// 动态导入 AnalyticsDataManager
let AnalyticsDataManager;
let analyticsManager;
(async () => {
  try {
    const module = await import('./shared/api/analyticsDataManager.js');
    AnalyticsDataManager = module.AnalyticsDataManager;
    
    // 初始化统计数据管理器
    analyticsManager = new AnalyticsDataManager();
    console.log('统计数据管理器已初始化');
  } catch (error) {
    console.error('加载统计数据管理器失败:', error);
  }
})();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb', charset: 'utf-8' })); // 增加请求体大小限制以支持图片上传，设置UTF-8编码
app.use(express.urlencoded({ limit: '10mb', extended: true, charset: 'utf-8' })); // 支持URL编码的请求体，设置UTF-8编码

// 静态文件服务
app.use(express.static('dist'));
app.use('/shared', express.static('shared'));
app.use('/admin', express.static('admin-panel/dist'));

// 数据库API检查中间件
const checkDbApi = (req, res, next) => {
  if (!dbApi) {
    return res.status(500).json({ error: '数据库API未初始化' });
  }
  next();
};

// ==================== 博客API ====================

// 获取博客列表
app.get('/api/blogs', checkDbApi, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      language: req.query.lang // 添加语言参数
    };
    
    const blogs = await dbApi.getBlogs(filters);
    res.json(blogs);
  } catch (error) {
    console.error('获取博客列表失败:', error);
    res.status(500).json({ error: '获取博客列表失败' });
  }
});

// 获取博客统计
app.get('/api/blogs/stats', checkDbApi, async (req, res) => {
  try {
    const stats = await dbApi.getBlogStats();
    res.json(stats);
  } catch (error) {
    console.error('获取博客统计失败:', error);
    res.status(500).json({ error: '获取博客统计失败' });
  }
});

// 获取博客详情
app.get('/api/blogs/:id', checkDbApi, async (req, res) => {
  try {
    const language = req.query.lang || 'zh'; // 添加语言参数
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

// 创建博客
app.post('/api/blogs', checkDbApi, async (req, res) => {
  try {
    const blog = await dbApi.createBlog(req.body);
    res.status(201).json({
      success: true,
      data: blog,
      message: '博客创建成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('创建博客失败:', error);
    res.status(500).json({ 
      success: false,
      error: '创建博客失败: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 更新博客
app.put('/api/blogs/:id', checkDbApi, async (req, res) => {
  try {
    const blog = await dbApi.updateBlog(req.params.id, req.body);
    if (!blog) {
      return res.status(404).json({ 
        success: false,
        error: '博客不存在',
        timestamp: new Date().toISOString()
      });
    }
    res.json({
      success: true,
      data: blog,
      message: '博客更新成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('更新博客失败:', error);
    res.status(500).json({ 
      success: false,
      error: '更新博客失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除博客
app.delete('/api/blogs/:id', checkDbApi, async (req, res) => {
  try {
    const result = await dbApi.deleteBlog(req.params.id);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: result.message,
        affectedRows: result.affectedRows,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: result.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ [DELETE /api/blogs/:id] 删除博客失败:', error);
    res.status(500).json({ 
      success: false,
      error: '删除博客失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 增加博客浏览量
app.post('/api/blogs/:id/views', checkDbApi, async (req, res) => {
  try {
    await dbApi.incrementBlogViews(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('增加博客浏览量失败:', error);
    res.status(500).json({ error: '增加博客浏览量失败' });
  }
});

// 记录博客阅读时间
app.post('/api/blogs/:id/reading-time', checkDbApi, async (req, res) => {
  try {
    const blogId = req.params.id;
    const readingData = {
      ...req.body,
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress || '',
      referrer: req.get('Referer') || ''
    };
    
    await dbApi.recordBlogReadingTime(blogId, readingData);
    res.json({ success: true });
  } catch (error) {
    console.error('记录博客阅读时间失败:', error);
    res.status(500).json({ error: '记录博客阅读时间失败' });
  }
});

// 获取博客阅读统计
app.get('/api/blogs/:id/reading-stats', checkDbApi, async (req, res) => {
  try {
    const blogId = req.params.id;
    const timeRange = req.query.timeRange || '7d';
    
    const stats = await dbApi.getBlogReadingStats(blogId, timeRange);
    res.json(stats);
  } catch (error) {
    console.error('获取博客阅读统计失败:', error);
    res.status(500).json({ error: '获取博客阅读统计失败' });
  }
});

// ==================== 视频API ====================

// 获取视频列表
app.get('/api/videos', checkDbApi, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      platform: req.query.platform,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      language: req.query.lang // 添加语言参数
    };
    
    const videos = await dbApi.getVideos(filters);
    res.json(videos);
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({ error: '获取视频列表失败' });
  }
});

// 获取视频统计
app.get('/api/videos/stats', checkDbApi, async (req, res) => {
  try {
    const stats = await dbApi.getVideoStats();
    res.json(stats);
  } catch (error) {
    console.error('获取视频统计失败:', error);
    res.status(500).json({ error: '获取视频统计失败' });
  }
});

// 获取视频详情
app.get('/api/videos/:id', checkDbApi, async (req, res) => {
  try {
    const language = req.query.lang || 'zh'; // 添加语言参数
    const video = await dbApi.getVideoById(req.params.id, language);
    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }
    res.json(video);
  } catch (error) {
    console.error('获取视频详情失败:', error);
    res.status(500).json({ error: '获取视频详情失败' });
  }
});

// 创建视频
app.post('/api/videos', checkDbApi, async (req, res) => {
  try {
    const video = await dbApi.createVideo(req.body);
    res.status(201).json(video);
  } catch (error) {
    console.error('创建视频失败:', error);
    res.status(500).json({ error: '创建视频失败' });
  }
});

// 更新视频
app.put('/api/videos/:id', checkDbApi, async (req, res) => {
  try {
    const video = await dbApi.updateVideo(req.params.id, req.body);
    if (!video) {
      return res.status(404).json({ 
        success: false,
        error: '视频不存在',
        timestamp: new Date().toISOString()
      });
    }
    res.json({
      success: true,
      data: video,
      message: '视频更新成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('更新视频失败:', error);
    res.status(500).json({ 
      success: false,
      error: '更新视频失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除视频
app.delete('/api/videos/:id', checkDbApi, async (req, res) => {
  try {
    await dbApi.deleteVideo(req.params.id);
    res.json({ 
      success: true, 
      message: '视频删除成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('删除视频失败:', error);
    res.status(500).json({ 
      success: false,
      error: '删除视频失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 增加视频播放量
app.post('/api/videos/:id/views', checkDbApi, async (req, res) => {
  try {
    await dbApi.incrementVideoViews(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('增加视频播放量失败:', error);
    res.status(500).json({ error: '增加视频播放量失败' });
  }
});

// ==================== 分类API ====================

// 获取分类列表
app.get('/api/categories', checkDbApi, async (req, res) => {
  try {
    const language = req.query.lang; // 添加语言参数
    const categories = await dbApi.getCategories(language);
    res.json({ 
      success: true, 
      data: categories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取分类列表失败: ' + error.message 
    });
  }
});

// 获取分类详情
app.get('/api/categories/:id', checkDbApi, async (req, res) => {
  try {
    const category = await dbApi.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: '分类不存在' 
      });
    }
    res.json({ 
      success: true, 
      data: category,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取分类详情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取分类详情失败: ' + error.message 
    });
  }
});

// 创建分类
app.post('/api/categories', checkDbApi, async (req, res) => {
  try {
    const category = await dbApi.createCategory(req.body);
    res.status(201).json({ 
      success: true, 
      data: category,
      message: '分类创建成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '创建分类失败: ' + error.message 
    });
  }
});

// 更新分类
app.put('/api/categories/:id', checkDbApi, async (req, res) => {
  try {
    const category = await dbApi.updateCategory(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: '分类不存在' 
      });
    }
    res.json({ 
      success: true, 
      data: category,
      message: '分类更新成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新分类失败: ' + error.message 
    });
  }
});

// 删除分类
app.delete('/api/categories/:id', checkDbApi, async (req, res) => {
  try {
    await dbApi.deleteCategory(req.params.id);
    res.json({ 
      success: true,
      message: '分类删除成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '删除分类失败: ' + error.message 
    });
  }
});

// ==================== 系统配置API ====================

// 获取系统配置
app.get('/api/system-config', checkDbApi, async (req, res) => {
  try {
    const config = await dbApi.getSystemConfig();
    res.json({ 
      success: true, 
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取系统配置失败: ' + error.message 
    });
  }
});

// 保存系统配置
app.post('/api/system-config', checkDbApi, async (req, res) => {
  try {
    await dbApi.saveSystemConfig(req.body);
    res.json({ 
      success: true,
      message: '系统配置保存成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('保存系统配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '保存系统配置失败: ' + error.message 
    });
  }
});

// 更新单个系统配置项
app.put('/api/system-config/:key', checkDbApi, async (req, res) => {
  try {
    await dbApi.updateSystemConfigItem(req.params.key, req.body.value);
    res.json({ 
      success: true,
      message: '系统配置项更新成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('更新系统配置项失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新系统配置项失败: ' + error.message 
    });
  }
});

// 获取系统配置 (别名路由)
app.get('/api/config', checkDbApi, async (req, res) => {
  try {
    const config = await dbApi.getSystemConfig();
    res.json({ 
      success: true, 
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取系统配置失败: ' + error.message 
    });
  }
});

// ==================== 统计API ====================

// 获取仪表板统计数据
app.get('/api/analytics/dashboard', checkDbApi, async (req, res) => {
  try {
    // 使用统一的 getDashboardStats 函数
    const dashboardStats = await dbApi.getDashboardStats();
    
    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('获取仪表板统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取仪表板统计失败: ' + error.message 
    });
  }
});

// 获取页面浏览统计
app.get('/api/analytics/page-views', checkDbApi, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const stats = await dbApi.getPageViewStats(timeRange);
    res.json(stats);
  } catch (error) {
    console.error('获取页面浏览统计失败:', error);
    res.status(500).json({ error: '获取页面浏览统计失败' });
  }
});

// 记录页面浏览
app.post('/api/analytics/page-view', checkDbApi, async (req, res) => {
  try {
    const { pageUrl, pageTitle, sessionId, userAgent, referrer } = req.body;
    await dbApi.recordPageView(pageUrl, pageTitle, sessionId, userAgent, referrer);
    res.json({ success: true });
  } catch (error) {
    console.error('记录页面浏览失败:', error);
    res.status(500).json({ error: '记录页面浏览失败' });
  }
});

// 记录视频播放
app.post('/api/analytics/video-play', checkDbApi, async (req, res) => {
  try {
    const { videoId, sessionId, userAgent } = req.body;
    await dbApi.recordVideoPlay(videoId, sessionId, userAgent);
    res.json({ success: true });
  } catch (error) {
    console.error('记录视频播放失败:', error);
    res.status(500).json({ error: '记录视频播放失败' });
  }
});

// 获取博客统计
app.get('/api/analytics/blogs', checkDbApi, async (req, res) => {
  try {
    const stats = await dbApi.getBlogStats();
    res.json(stats);
  } catch (error) {
    console.error('获取博客统计失败:', error);
    res.status(500).json({ error: '获取博客统计失败' });
  }
});

// 获取视频统计
app.get('/api/analytics/videos', checkDbApi, async (req, res) => {
  try {
    const stats = await dbApi.getVideoStats();
    res.json(stats);
  } catch (error) {
    console.error('获取视频统计失败:', error);
    res.status(500).json({ error: '获取视频统计失败' });
  }
});

// 批量记录统计事件
app.post('/api/analytics/batch', async (req, res) => {
  try {

    
    if (!analyticsManager) {
      return res.status(503).json({ 
        success: false, 
        error: '统计服务尚未初始化' 
      });
    }

    if (!req.body || !req.body.events) {
      return res.status(400).json({ 
        success: false, 
        error: '请求体缺少events字段' 
      });
    }

    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的事件数据格式' 
      });
    }

    const results = await analyticsManager.recordBatch(events);
    
    res.json({ 
      success: true, 
      message: `成功处理 ${events.length} 个统计事件`,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error recording analytics batch:', error);
    res.status(500).json({ 
      success: false, 
      error: '记录统计数据失败: ' + error.message 
    });
  }
});

// ==================== 评论API ====================

// 获取指定博客的评论
app.get('/api/comments/:blogId', checkDbApi, async (req, res) => {
  try {
    const comments = await dbApi.getComments(req.params.blogId);
    res.json(comments);
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
});

// 创建新评论
app.post('/api/comments', checkDbApi, async (req, res) => {
  try {
    const { blogId, author, email, content, parentId } = req.body;
    
    // 获取客户端IP和User-Agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const commentData = {
      blogId,
      author,
      email,
      content,
      parentId,
      ipAddress,
      userAgent
    };
    
    const comment = await dbApi.createComment(commentData);
    res.status(201).json(comment);
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({ error: '创建评论失败' });
  }
});

// 获取评论数量
app.get('/api/comments/:blogId/count', checkDbApi, async (req, res) => {
  try {
    const count = await dbApi.getCommentCount(req.params.blogId);
    res.json({ count });
  } catch (error) {
    console.error('获取评论数量失败:', error);
    res.status(500).json({ error: '获取评论数量失败' });
  }
});

// 删除评论
app.delete('/api/comments/:id', checkDbApi, async (req, res) => {
  try {
    await dbApi.deleteComment(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ error: '删除评论失败' });
  }
});

// 更新评论状态
app.put('/api/comments/:id/status', checkDbApi, async (req, res) => {
  try {
    const { status } = req.body;
    await dbApi.updateCommentStatus(req.params.id, status);
    res.json({ success: true });
  } catch (error) {
    console.error('更新评论状态失败:', error);
    res.status(500).json({ error: '更新评论状态失败' });
  }
});

// ==================== 用户API ====================

// 获取用户列表
app.get('/api/users', checkDbApi, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      role: req.query.role,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search
    };
    
    const users = await dbApi.getUsers(filters);
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 创建用户
app.post('/api/users', checkDbApi, async (req, res) => {
  try {
    const user = await dbApi.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ error: '创建用户失败' });
  }
});

// 获取用户详情
app.get('/api/users/:id', checkDbApi, async (req, res) => {
  try {
    const user = await dbApi.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

// 更新用户
app.put('/api/users/:id', checkDbApi, async (req, res) => {
  try {
    const user = await dbApi.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ error: '更新用户失败' });
  }
});

// 删除用户
app.delete('/api/users/:id', checkDbApi, async (req, res) => {
  try {
    await dbApi.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// ==================== 活动日志API ====================

// 添加活动日志
app.post('/api/activity-logs', checkDbApi, async (req, res) => {
  try {
    await dbApi.addActivityLog(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('添加活动日志失败:', error);
    res.status(500).json({ error: '添加活动日志失败' });
  }
});

// ==================== 仪表板API ====================

// 获取仪表板统计
app.get('/api/dashboard/stats', checkDbApi, async (req, res) => {
  try {
    const stats = await dbApi.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('获取仪表板统计失败:', error);
    res.status(500).json({ error: '获取仪表板统计失败' });
  }
});

// ==================== 缓存管理API ====================

// 获取缓存统计
app.get('/api/cache/stats', checkDbApi, async (req, res) => {
  try {
    const stats = await dbApi.getCacheStats();
    res.json(stats || { connected: false, message: 'Redis未连接' });
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    res.status(500).json({ error: '获取缓存统计失败' });
  }
});

// 清空所有缓存
app.delete('/api/cache/clear', checkDbApi, async (req, res) => {
  try {
    const result = await dbApi.clearAllCache();
    res.json({ success: result, message: result ? '缓存清空成功' : '缓存清空失败' });
  } catch (error) {
    console.error('清空缓存失败:', error);
    res.status(500).json({ error: '清空缓存失败' });
  }
});

// 预热缓存
app.post('/api/cache/warmup', checkDbApi, async (req, res) => {
  try {
    await dbApi.warmupCache();
    res.json({ success: true, message: '缓存预热成功' });
  } catch (error) {
    console.error('缓存预热失败:', error);
    res.status(500).json({ error: '缓存预热失败' });
  }
});

// ==================== 活动日志API ====================

// 获取活动日志
app.get('/api/activity-logs', checkDbApi, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      userId: req.query.userId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };
    
    // 从数据库获取真实数据
    const logs = await dbApi.getActivityLogs(filters);
    const total = logs.length;
    const totalPages = Math.ceil(total / filters.limit);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: total,
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error('获取活动日志失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取活动日志失败: ' + error.message 
    });
  }
});

// 创建活动日志
app.post('/api/activity-logs', checkDbApi, async (req, res) => {
  try {
    const { type, userId, action, details, ipAddress, userAgent } = req.body;
    
    // 准备日志数据
    const logData = {
      type: type || 'info',
      description: action || 'Unknown action',
      userId: userId || null,
      details: details || null
    };
    
    // 保存到数据库
    await dbApi.addActivityLog(logData);
    
    res.status(201).json({
      success: true,
      message: '活动日志创建成功'
    });
  } catch (error) {
    console.error('创建活动日志失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '创建活动日志失败: ' + error.message 
    });
  }
});

// ==================== 外部视频分析API ====================

// 记录外部视频点击事件
app.post('/api/analytics/external-video-click', async (req, res) => {
  try {
    if (!analyticsManager) {
      return res.status(503).json({ 
        success: false, 
        error: '统计服务尚未初始化' 
      });
    }

    await analyticsManager.recordExternalVideoClick(req.body);
    
    res.json({ 
      success: true, 
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error recording external video click:', error);
    res.status(500).json({ 
      success: false, 
      error: '记录外部视频点击失败: ' + error.message 
    });
  }
});

// 记录外部视频返回事件
app.post('/api/analytics/external-video-return', async (req, res) => {
  try {
    if (!analyticsManager) {
      return res.status(503).json({ 
        success: false, 
        error: '统计服务尚未初始化' 
      });
    }

    await analyticsManager.recordExternalVideoReturn(req.body);
    
    res.json({ 
      success: true, 
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error recording external video return:', error);
    res.status(500).json({ 
      success: false, 
      error: '记录外部视频返回失败: ' + error.message 
    });
  }
});

// 获取外部视频统计
app.get('/api/analytics/external-videos', async (req, res) => {
  try {
    if (!analyticsManager) {
      return res.status(503).json({ 
        success: false, 
        error: '统计服务尚未初始化' 
      });
    }

    const { timeRange = '7d' } = req.query;
    const data = await analyticsManager.getExternalVideoStats(timeRange);
    
    res.json(data);
    
  } catch (error) {
    console.error('Error getting external video stats:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取外部视频统计失败: ' + error.message 
    });
  }
});

// 获取外部视频完播率预估
app.get('/api/analytics/external-videos/completion-estimates', async (req, res) => {
  try {
    if (!analyticsManager) {
      return res.status(503).json({ 
        success: false, 
        error: '统计服务尚未初始化' 
      });
    }

    const { timeRange = '7d', videoId, platform } = req.query;
    const data = await analyticsManager.getExternalVideoCompletionEstimates(timeRange, { videoId, platform });
    
    res.json(data);
    
  } catch (error) {
    console.error('Error getting external video completion estimates:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取外部视频完播率预估失败: ' + error.message 
    });
  }
});

// ==================== 认证API ====================

// 管理员登录
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    // 硬编码的管理员凭据（在实际应用中应该从数据库验证）
    const ADMIN_CREDENTIALS = {
      username: 'admin',
      password: 'admin123'
    };

    // 验证凭据
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // 生成简单的会话token（在实际应用中应该使用JWT）
      const token = 'admin-session-token-' + Date.now();
      
      const userData = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['*'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: {
          token,
          user: userData
        },
        message: '登录成功'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
  } catch (error) {
    console.error('登录失败:', error);
    return res.status(500).json({
      success: false,
      error: '登录过程中发生错误'
    });
  }
});

// 管理员登出
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

// ==================== 健康检查API ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 数据库连接测试
app.get('/api/health/database', async (req, res) => {
  try {
    // 动态导入数据库管理器
    const { dbManager } = await import('./database/DatabaseFactory.js');
    
    // 检查数据库管理器状态
    const status = dbManager.getStatus();
    
    if (!status.connected) {
      // 尝试初始化数据库连接
      try {
        await dbManager.initialize();
        const newStatus = dbManager.getStatus();
        
        res.json({
          status: 'ok',
          database: {
            connected: newStatus.connected,
            type: newStatus.type,
            config: {
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT) || 3306,
              database: process.env.DB_NAME || 'travelweb_db',
              user: process.env.DB_USER || 'travelweb_user'
            }
          },
          message: '数据库连接成功',
          timestamp: new Date().toISOString()
        });
      } catch (initError) {
        res.status(500).json({
          status: 'error',
          database: {
            connected: false,
            type: null,
            config: {
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT) || 3306,
              database: process.env.DB_NAME || 'travelweb_db',
              user: process.env.DB_USER || 'travelweb_user'
            }
          },
          error: initError.message,
          message: '数据库连接失败',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.json({
        status: 'ok',
        database: {
          connected: status.connected,
          type: status.type,
          config: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            database: process.env.DB_NAME || 'travelweb_db',
            user: process.env.DB_USER || 'travelweb_user'
          }
        },
        message: '数据库已连接',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: {
        connected: false,
        type: null,
        config: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 3306,
          database: process.env.DB_NAME || 'travelweb_db',
          user: process.env.DB_USER || 'travelweb_user'
        }
      },
      error: error.message,
      message: '数据库连接检查失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 数据库信息
app.get('/api/database/info', checkDbApi, async (req, res) => {
  try {
    // 获取数据库连接信息和统计数据
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

// ==================== 错误处理 ====================

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'API端点不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ==================== 服务器启动 ====================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`API文档: http://localhost:${PORT}/api`);
});

module.exports = app;