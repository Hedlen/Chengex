// 数据库API端点 - 使用数据库抽象层
import dotenv from 'dotenv';
import { dbManager } from './DatabaseFactory.js';

// 加载环境变量
dotenv.config();

// 确保数据库管理器已初始化
let dbInitialized = false;

/**
 * 将JavaScript Date对象或ISO字符串转换为MySQL兼容的DATETIME格式
 * @param {Date|string} date - 日期对象或ISO字符串
 * @returns {string} MySQL DATETIME格式字符串 (YYYY-MM-DD HH:MM:SS)
 */
function formatDateForMySQL(date) {
  if (!date) return null;
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return null;
  }
  
  // 检查日期是否有效
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  // 转换为MySQL DATETIME格式 (YYYY-MM-DD HH:MM:SS)
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await dbManager.initialize();
    dbInitialized = true;
  }
}

// 获取数据库适配器
async function getDb() {
  await ensureDbInitialized();
  return dbManager.getAdapter();
}

// 兼容性查询函数 - 为了保持与旧代码的兼容性
async function query(sql, params = []) {
  const db = await getDb();
  return await db.query(sql, params);
}

// ==================== 博客API ====================

/**
 * 获取所有博客
 */
export async function getBlogs(filters = {}) {
  try {
    const { category, status, page = 1, limit = 20, search, language } = filters;
    
    let sql = 'SELECT * FROM blogs WHERE 1=1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (status) {
      // 直接使用传入的状态，不进行映射
      console.log(`查询状态: ${status}`);
      
      sql += ' AND status = ?';
      params.push(status);
    }
    
    if (search) {
      if (language === 'en') {
        sql += ' AND (title_en LIKE ? OR content_en LIKE ? OR title LIKE ? OR content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      } else {
        sql += ' AND (title LIKE ? OR content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (limit && limit > 0) {
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    }
    
    console.log('执行SQL查询:', sql);
    console.log('查询参数:', params);
    
    const db = await getDb();
    const result = await db.query(sql, params);
    
    console.log(`查询结果: 找到 ${result.length} 条博客记录`);
    
    // 处理结果，确保数据格式正确
    const blogs = result.map(blog => {
      return {
        ...blog,
        // 确保数字类型字段正确
        id: parseInt(blog.id),
        views: parseInt(blog.views) || 0,
        likes: parseInt(blog.likes) || 0,
        // 确保日期格式正确
        created_at: blog.created_at ? new Date(blog.created_at).toISOString() : null,
        updated_at: blog.updated_at ? new Date(blog.updated_at).toISOString() : null,
        // 处理JSON字段
        tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags || '[]') : (blog.tags || []),
        tags_en: typeof blog.tags_en === 'string' ? JSON.parse(blog.tags_en || '[]') : (blog.tags_en || []),
        // 映射图片字段，优先使用cover_image，然后是featured_image
        featuredImage: blog.cover_image || blog.featured_image || ''
      };
    });
    
    return blogs;
  } catch (error) {
    console.error('获取博客列表失败:', error);
    throw error;
  }
}

/**
 * 根据ID获取博客详情
 */
export async function getBlogById(id, language = 'zh') {
  try {
    const db = await getDb();
    console.log(`🔍 [getBlogById] 查询博客ID: ${id}, 语言: ${language}`);
    
    const result = await db.query('SELECT * FROM blogs WHERE id = ?', [id]);
    
    if (!result || result.length === 0) {
      console.log(`🔍 [getBlogById] 未找到博客ID: ${id}`);
      return null;
    }
    
    const blog = result[0];
    console.log(`🔍 [getBlogById] 找到博客: ${blog.title}`);
    
    // 处理数据格式
    const processedBlog = {
      ...blog,
      id: parseInt(blog.id),
      views: parseInt(blog.view_count) || 0,
      likes: parseInt(blog.like_count) || 0,
      created_at: blog.created_at ? new Date(blog.created_at).toISOString() : null,
      updated_at: blog.updated_at ? new Date(blog.updated_at).toISOString() : null,
      tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags || '[]') : (blog.tags || []),
      tags_en: typeof blog.tags_en === 'string' ? JSON.parse(blog.tags_en || '[]') : (blog.tags_en || []),
      // 映射图片字段，优先使用cover_image，然后是featured_image
      featuredImage: blog.cover_image || blog.featured_image || ''
    };
    
    return processedBlog;
  } catch (error) {
    console.error('获取博客详情失败:', error);
    throw error;
  }
}

/**
 * 创建新博客
 */
export async function createBlog(blogData) {
  try {
    const db = await getDb();
    console.log('🔍 [createBlog] 收到的数据:', JSON.stringify(blogData, null, 2));
    
    // 获取分类ID
    const categoryId = await getCategoryIdByName(blogData.category);
    
    // 处理发布时间
    const status = blogData.status || 'published';
    const publishedAt = status === 'published' ? formatDateForMySQL(new Date()) : null;
    
    const insertSQL = `
      INSERT INTO blogs (
        title, content, excerpt, title_en, content_en, excerpt_en, 
        category_id, author_id, status, cover_image, tags, tags_en,
        published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const values = [
      blogData.title || '',
      blogData.content || '',
      blogData.excerpt || '',
      blogData.title_en || '',
      blogData.content_en || '',
      blogData.excerpt_en || '',
      categoryId,
      blogData.author_id || 1,
      status,
      blogData.cover_image || blogData.featuredImage || blogData.featured_image || '',
      JSON.stringify(blogData.tags || []),
      JSON.stringify(blogData.tags_en || []),
      publishedAt
    ];
    
    console.log('🔍 [createBlog] 执行SQL:', insertSQL);
    console.log('🔍 [createBlog] 参数:', values);
    
    const result = await db.execute(insertSQL, values);
    
    console.log('🔍 [createBlog] 数据库返回结果:', result);
    
    // 获取新创建的博客
    const newBlog = await getBlogById(result.lastInsertRowid || result.insertId);
    
    return newBlog;
  } catch (error) {
    console.error('创建博客失败:', error);
    throw error;
  }
}

/**
 * 根据分类名称获取分类ID
 */
async function getCategoryIdByName(categoryName) {
  if (!categoryName) return null;
  
  try {
    const result = await query('SELECT id FROM categories WHERE name = ?', [categoryName]);
    return result.length > 0 ? result[0].id : null;
  } catch (error) {
    console.error('查找分类ID失败:', error);
    return null;
  }
}

/**
 * 更新博客
 */
export async function updateBlog(id, blogData) {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      title_en,
      content_en,
      excerpt_en,
      status, 
      tags, 
      tags_en,
      category, 
      author, 
      readTime,
      featuredImage
    } = blogData;
    
    const tagsJson = tags ? JSON.stringify(tags) : undefined;
    const tagsEnJson = tags_en ? JSON.stringify(tags_en) : undefined;
    const publishedAt = status === 'published' ? formatDateForMySQL(new Date()) : null;
    
    // 如果有category，需要将category名称转换为category_id
    let categoryId = null;
    if (category !== undefined) {
      categoryId = await getCategoryIdByName(category);
    }
    
    // 构建动态更新SQL
    const updates = [];
    const params = [];
    
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (excerpt !== undefined) { updates.push('excerpt = ?'); params.push(excerpt); }
    if (title_en !== undefined) { updates.push('title_en = ?'); params.push(title_en); }
    if (content_en !== undefined) { updates.push('content_en = ?'); params.push(content_en); }
    if (excerpt_en !== undefined) { updates.push('excerpt_en = ?'); params.push(excerpt_en); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (tagsJson !== undefined) { updates.push('tags = ?'); params.push(tagsJson); }
    if (tagsEnJson !== undefined) { updates.push('tags_en = ?'); params.push(tagsEnJson); }
    if (category !== undefined) { updates.push('category_id = ?'); params.push(categoryId); }
    // 注意：author字段暂时跳过，因为数据库使用author_id（bigint），而前端传递author（string）
    if (readTime !== undefined) { updates.push('reading_time = ?'); params.push(readTime); }
    if (featuredImage !== undefined) { updates.push('cover_image = ?'); params.push(featuredImage); }
    if (publishedAt !== null) { updates.push('published_at = ?'); params.push(publishedAt); }
    
    updates.push("updated_at = NOW()");
    params.push(id);
    
    await query(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`, params);
    
    return await getBlogById(id);
  } catch (error) {
    console.error('更新博客失败:', error);
    throw error;
  }
}

/**
 * 删除博客
 */
export async function deleteBlog(id) {
  try {
    console.log('🗑️ [deleteBlog] 开始删除博客，ID:', id);
    console.log('🗑️ [deleteBlog] ID类型:', typeof id);
    console.log('🗑️ [deleteBlog] ID值:', JSON.stringify(id));
    
    // 确保ID是数字类型，因为数据库中的ID是number类型
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      console.error('❌ [deleteBlog] 无效的ID格式:', id);
      return { success: false, message: '无效的博客ID格式' };
    }
    
    console.log('🔄 [deleteBlog] 转换后的数字ID:', numericId);
    
    // 先查询博客是否存在
    console.log('🔍 [deleteBlog] 先查询博客是否存在...');
    const existingBlogs = await query('SELECT id FROM blogs WHERE id = ?', [numericId]);
    console.log('🔍 [deleteBlog] 查询结果:', existingBlogs);
    console.log('🔍 [deleteBlog] 找到的博客数量:', existingBlogs.length);
    
    if (existingBlogs.length === 0) {
      console.warn('⚠️ [deleteBlog] 博客不存在，ID:', numericId);
      return { success: false, message: '博客不存在或已被删除' };
    }
    
    console.log('🗑️ [deleteBlog] 执行SQL: DELETE FROM blogs WHERE id = ?');
    const result = await query('DELETE FROM blogs WHERE id = ?', [numericId]);
    
    console.log('🗑️ [deleteBlog] 数据库查询结果:', result);
    console.log('🗑️ [deleteBlog] 受影响的行数:', result.affectedRows);
    console.log('🗑️ [deleteBlog] 查询信息:', result.info);
    
    if (result.affectedRows === 0) {
      console.warn('⚠️ [deleteBlog] 警告：没有找到要删除的博客，ID:', numericId);
      return { success: false, message: '博客不存在或已被删除' };
    }
    
    console.log('✅ [deleteBlog] 博客删除成功，ID:', numericId);
    return { success: true, message: '博客删除成功', affectedRows: result.affectedRows };
  } catch (error) {
    console.error('❌ [deleteBlog] 删除博客失败:', error);
    console.error('❌ [deleteBlog] 错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
}

/**
 * 增加博客浏览量
 */
export async function incrementBlogViews(id) {
  try {
    await query('UPDATE blogs SET view_count = view_count + 1 WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('增加博客浏览量失败:', error);
    throw error;
  }
}

/**
 * 记录博客阅读时间和详细数据
 */
export async function recordBlogReadingTime(blogId, readingData) {
  try {
    const {
      readingTime,
      scrollDepth,
      readingProgress,
      contentLength,
      sessionId,
      timestamp
    } = readingData;

    // 插入阅读记录
    await query(`
      INSERT INTO blog_views (
        blog_id, session_id, reading_time, scroll_depth, 
        view_time, user_agent, ip_address, referrer
      ) VALUES (?, ?, ?, ?, FROM_UNIXTIME(?), ?, ?, ?)
    `, [
      blogId,
      sessionId || 'anonymous',
      readingTime,
      scrollDepth,
      Math.floor(timestamp / 1000),
      '', // user_agent - 可以从请求头获取
      '', // ip_address - 可以从请求获取
      ''  // referrer - 可以从请求头获取
    ]);

    // 更新博客的总浏览量（如果是有效阅读）
    if (readingTime >= 15 && scrollDepth > 20) {
      await query('UPDATE blogs SET view_count = view_count + 1 WHERE id = ?', [blogId]);
    }

    return true;
  } catch (error) {
    console.error('记录博客阅读时间失败:', error);
    throw error;
  }
}

/**
 * 获取博客的详细阅读统计
 */
export async function getBlogReadingStats(blogId, timeRange = '7d') {
  try {
    const db = await getDb();
    
    // 检查数据库适配器类型，如果是SQLiteAdapter，直接调用其方法
    if (db.getBlogReadingStats && typeof db.getBlogReadingStats === 'function') {
      return await db.getBlogReadingStats(blogId, timeRange);
    }
    
    // 否则使用传统的SQL查询方式
    let timeCondition = '';
    const params = [blogId];

    switch (timeRange) {
      case '1d':
        timeCondition = "AND view_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
        break;
      case '7d':
        timeCondition = "AND view_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
      case '30d':
        timeCondition = "AND view_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
      default:
        timeCondition = "AND view_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }

    const [totalViews, avgReadingTime, avgScrollDepth, uniqueReaders] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM blog_views WHERE blog_id = ? ${timeCondition}`, params),
      query(`SELECT AVG(reading_time) as avg_time FROM blog_views WHERE blog_id = ? AND reading_time > 0 ${timeCondition}`, params),
      query(`SELECT AVG(scroll_depth) as avg_depth FROM blog_views WHERE blog_id = ? AND scroll_depth > 0 ${timeCondition}`, params),
      query(`SELECT COUNT(DISTINCT session_id) as count FROM blog_views WHERE blog_id = ? ${timeCondition}`, params)
    ]);

    return {
      totalViews: totalViews[0]?.count || 0,
      averageReadingTime: Math.round(avgReadingTime[0]?.avg_time || 0),
      averageScrollDepth: Math.round(avgScrollDepth[0]?.avg_depth || 0),
      uniqueReaders: uniqueReaders[0]?.count || 0
    };
  } catch (error) {
    console.error('获取博客阅读统计失败:', error);
    throw error;
  }
}

/**
 * 获取博客统计信息
 */
export async function getBlogStats() {
  try {
    const db = await getDb();
    
    // 检查数据库适配器类型，如果是SQLiteAdapter，直接调用其方法
    if (db.getBlogStats && typeof db.getBlogStats === 'function') {
      return await db.getBlogStats();
    }
    
    // 否则使用传统的SQL查询方式
    const [totalResult, publishedResult, draftResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM blogs'),
      query('SELECT COUNT(*) as count FROM blogs WHERE status = \'published\''),
      query('SELECT COUNT(*) as count FROM blogs WHERE status = \'draft\'')
    ]);
    
    return {
      total: totalResult[0]?.count || 0,
      published: publishedResult[0]?.count || 0,
      draft: draftResult[0]?.count || 0
    };
  } catch (error) {
    console.error('获取博客统计失败:', error);
    throw error;
  }
}

// ==================== 视频API ====================

/**
 * 获取所有视频
 */
export async function getVideos(filters = {}) {
  try {
    const { category, platform, status, page = 1, limit = 20, search, language } = filters;
    
    let sql = 'SELECT * FROM videos WHERE 1=1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (platform) {
      sql += ' AND platform = ?';
      params.push(platform);
    }
    
    if (status) {
      // 状态映射：前端状态 -> 数据库状态
      const statusMapping = {
        'published': 'active',
        'draft': 'inactive', 
        'archived': 'deleted'
      };
      
      const dbStatus = statusMapping[status] || status;
      
      sql += ' AND status = ?';
      params.push(dbStatus);
    }
    
    if (search) {
      if (language === 'en') {
        sql += ' AND (title_en LIKE ? OR description_en LIKE ? OR title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      } else {
        sql += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (limit && limit > 0) {
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    }
    
    const videos = await query(sql, params);
    
    // 解析JSON字段
    return videos.map(video => {
      let tags = [];
      let tagsEn = [];
      
      try {
        // 解析中文标签
        if (Array.isArray(video.tags)) {
          tags = video.tags;
        } else if (typeof video.tags === 'string') {
          tags = JSON.parse(video.tags);
        } else {
          tags = video.tags || [];
        }
        
        // 解析英文标签
        if (Array.isArray(video.tags_en)) {
          tagsEn = video.tags_en;
        } else if (typeof video.tags_en === 'string') {
          tagsEn = JSON.parse(video.tags_en);
        } else {
          tagsEn = video.tags_en || [];
        }
      } catch (error) {
        console.error('解析tags JSON失败:', error, 'tags值:', video.tags, 'tags_en值:', video.tags_en);
        tags = [];
        tagsEn = [];
      }
      
      // 根据语言选择显示的标签
      let displayTags = tags;
      if (language === 'en' && tagsEn.length > 0) {
        displayTags = tagsEn;
      }
      
      // 状态映射：数据库状态 -> 前端状态
      let frontendStatus = video.status;
      if (video.status === 'active') frontendStatus = 'published';
      else if (video.status === 'inactive') frontendStatus = 'draft';
      else if (video.status === 'deleted') frontendStatus = 'archived';
      
      // 根据语言选择显示的内容
      let displayTitle = video.title;
      let displayDescription = video.description;
      
      if (language === 'en') {
        displayTitle = video.title_en || video.title;
        displayDescription = video.description_en || video.description;
      }
      
      // 转换字段名从下划线格式到驼峰格式
      const { 
        created_at, updated_at, view_count, like_count, 
        video_url, platform_id, title_en, description_en, tags_en, ...restVideo 
      } = video;
      
      return {
        ...restVideo,
        title: displayTitle,
        description: displayDescription,
        status: frontendStatus,
        tags: displayTags,
        createdAt: created_at,
        updatedAt: updated_at,
        viewsCount: view_count,
        likesCount: like_count,
        videoUrl: video_url,
        url: video_url, // 前端期望的字段名
        platformId: platform_id
      };
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    throw error;
  }
}

/**
 * 根据ID获取视频详情
 */
export async function getVideoById(id, language = 'zh') {
  try {
    const videos = await query('SELECT * FROM videos WHERE id = ?', [id]);
    
    if (videos.length === 0) {
      return null;
    }
    
    const video = videos[0];
    let tags = [];
    let tagsEn = [];
    
    try {
      // 解析中文标签
      if (Array.isArray(video.tags)) {
        tags = video.tags;
      } else if (typeof video.tags === 'string') {
        tags = JSON.parse(video.tags);
      } else {
        tags = video.tags || [];
      }
      
      // 解析英文标签
      if (Array.isArray(video.tags_en)) {
        tagsEn = video.tags_en;
      } else if (typeof video.tags_en === 'string') {
        tagsEn = JSON.parse(video.tags_en);
      } else {
        tagsEn = video.tags_en || [];
      }
    } catch (error) {
      console.error('解析tags JSON失败:', error, 'tags值:', video.tags, 'tags_en值:', video.tags_en);
      tags = [];
      tagsEn = [];
    }
    
    // 根据语言选择显示的标签
    let displayTags = tags;
    if (language === 'en' && tagsEn.length > 0) {
      displayTags = tagsEn;
    }
    
    // 根据语言选择显示的内容
    let displayTitle = video.title;
    let displayDescription = video.description;
    
    if (language === 'en') {
      displayTitle = video.title_en || video.title;
      displayDescription = video.description_en || video.description;
    }
    
    // 转换字段名从下划线格式到驼峰格式
    return {
      ...video,
      title: displayTitle,
      description: displayDescription,
      status: frontendStatus,
      tags: displayTags,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
      viewsCount: video.views_count,
      likesCount: video.likes_count,
      thumbnailUrl: video.thumbnail_url,
      videoUrl: video.video_url,
      platformId: video.platform_id
    };
  } catch (error) {
    console.error('获取视频详情失败:', error);
    throw error;
  }
}

/**
 * 创建新视频
 */
export async function createVideo(videoData) {
  try {
    const { 
      title, 
      description, 
      videoUrl, 
      platform = 'youtube', 
      status = 'active', 
      thumbnail = null, 
      platformId = null,
      categoryId = null,
      duration = null,
      tags = []
    } = videoData;
    
    const tagsJson = JSON.stringify(tags);
    
    // 状态映射：前端状态 -> 数据库状态
    let dbStatus = status;
    if (status === 'published') dbStatus = 'active';
    else if (status === 'draft') dbStatus = 'inactive';
    else if (status === 'archived') dbStatus = 'deleted';
    
    const result = await query(`
      INSERT INTO videos (
        title, description, video_url, platform, status, thumbnail, 
        platform_id, category_id, duration, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, description, videoUrl, platform, dbStatus, thumbnail || null, platformId || null, categoryId || null, duration || null, tagsJson]);
    
    return await getVideoById(result.insertId);
  } catch (error) {
    console.error('创建视频失败:', error);
    throw error;
  }
}

/**
 * 更新视频
 */
export async function updateVideo(id, videoData) {
  try {
    const { 
      title, 
      description, 
      videoUrl, 
      platform, 
      status, 
      thumbnail, 
      platformId,
      categoryId,
      duration,
      tags
    } = videoData;
    
    const tagsJson = tags ? JSON.stringify(tags) : undefined;
    
    // 状态映射：前端状态 -> 数据库状态
    let dbStatus = status;
    if (status !== undefined) {
      if (status === 'published') dbStatus = 'active';
      else if (status === 'draft') dbStatus = 'inactive';
      else if (status === 'archived') dbStatus = 'deleted';
    }
    
    // 构建动态更新SQL
    const updates = [];
    const params = [];
    
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (videoUrl !== undefined) { updates.push('video_url = ?'); params.push(videoUrl); }
    if (platform !== undefined) { updates.push('platform = ?'); params.push(platform); }
    if (status !== undefined) { updates.push('status = ?'); params.push(dbStatus); }
    if (thumbnail !== undefined) { updates.push('thumbnail = ?'); params.push(thumbnail); }
    if (platformId !== undefined) { updates.push('platform_id = ?'); params.push(platformId); }
    if (categoryId !== undefined) { updates.push('category_id = ?'); params.push(categoryId); }
    if (duration !== undefined) { updates.push('duration = ?'); params.push(duration); }
    if (tagsJson !== undefined) { updates.push('tags = ?'); params.push(tagsJson); }
    
    updates.push("updated_at = NOW()");
    params.push(id);
    
    await query(`UPDATE videos SET ${updates.join(', ')} WHERE id = ?`, params);
    
    return await getVideoById(id);
  } catch (error) {
    console.error('更新视频失败:', error);
    throw error;
  }
}

/**
 * 删除视频
 */
export async function deleteVideo(id) {
  try {
    await query('DELETE FROM videos WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('删除视频失败:', error);
    throw error;
  }
}

/**
 * 增加视频播放量
 */
export async function incrementVideoViews(id) {
  try {
    await query('UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('增加视频播放量失败:', error);
    throw error;
  }
}

/**
 * 获取视频统计信息
 */
export async function getVideoStats() {
  try {
    const db = await getDb();
    
    // 检查数据库适配器类型，如果是SQLiteAdapter，直接调用其方法
    if (db.getVideoStats && typeof db.getVideoStats === 'function') {
      return await db.getVideoStats();
    }
    
    // 否则使用传统的SQL查询方式
    const [totalResult, publishedResult, activeResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM videos'),
      query('SELECT COUNT(*) as count FROM videos WHERE status = \'published\''),
      query('SELECT COUNT(*) as count FROM videos WHERE status = \'active\'')
    ]);
    
    return {
      total: totalResult[0]?.count || 0,
      published: publishedResult[0]?.count || 0,
      active: activeResult[0]?.count || 0
    };
  } catch (error) {
    console.error('获取视频统计失败:', error);
    throw error;
  }
}

// ==================== 分类API ====================

/**
 * 获取所有分类
 */
export async function getCategories(language = 'zh') {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY created_at ASC');
    
    return categories.map(category => {
      // 根据语言选择显示的内容
      let displayName = category.name;
      let displayDescription = category.description;
      
      if (language === 'en') {
        displayName = category.name_en || category.name;
        displayDescription = category.description_en || category.description;
      }
      
      return {
        ...category,
        name: displayName,
        description: displayDescription,
        isActive: Boolean(category.is_active),
        createdAt: category.created_at,
        updatedAt: category.updated_at
      };
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    throw error;
  }
}

/**
 * 根据ID获取分类详情
 */
export async function getCategoryById(id) {
  try {
    const categories = await query('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (categories.length === 0) {
      return null;
    }
    
    const category = categories[0];
    return {
      ...category,
      createdAt: category.created_at,
      updatedAt: category.updated_at
    };
  } catch (error) {
    console.error('获取分类详情失败:', error);
    throw error;
  }
}

/**
 * 创建新分类
 */
export async function createCategory(categoryData) {
  try {
    const { 
      name, 
      description = '', 
      color = '#3B82F6', 
      icon = 'folder'
    } = categoryData;
    
    const result = await query(`
      INSERT INTO categories (name, description, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [name, description, color, icon]);
    
    return await getCategoryById(result.insertId);
  } catch (error) {
    console.error('创建分类失败:', error);
    throw error;
  }
}

/**
 * 更新分类
 */
export async function updateCategory(id, categoryData) {
  try {
    const { name, description, color, icon } = categoryData;
    
    // 构建动态更新SQL
    const updates = [];
    const params = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (color !== undefined) { updates.push('color = ?'); params.push(color); }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
    
    updates.push("updated_at = NOW()");
    params.push(id);
    
    await query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);
    
    return await getCategoryById(id);
  } catch (error) {
    console.error('更新分类失败:', error);
    throw error;
  }
}

/**
 * 删除分类
 */
export async function deleteCategory(id) {
  try {
    await query('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('删除分类失败:', error);
    throw error;
  }
}

// ==================== 系统配置API ====================

/**
 * 获取系统配置
 */
export async function getSystemConfig() {
  try {
    const configs = await query('SELECT * FROM system_config');
    
    // 将配置转换为键值对对象
    const configObj = {};
    configs.forEach(config => {
      try {
        // 尝试解析JSON值
        configObj[config.config_key] = JSON.parse(config.config_value);
      } catch {
        // 如果不是JSON，直接使用字符串值
        configObj[config.config_key] = config.config_value;
      }
    });
    
    return configObj;
  } catch (error) {
    console.error('获取系统配置失败:', error);
    throw error;
  }
}

/**
 * 保存系统配置
 */
export async function saveSystemConfig(configData) {
  try {
    // 删除所有现有配置
    await query('DELETE FROM system_config');
    
    // 插入新配置
    const insertPromises = Object.entries(configData).map(([key, value]) => {
      const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return query(
        "INSERT INTO system_config (config_key, config_value, updated_at) VALUES (?, ?, NOW())",
        [key, configValue]
      );
    });
    
    await Promise.all(insertPromises);
    
    return true;
  } catch (error) {
    console.error('保存系统配置失败:', error);
    throw error;
  }
}

/**
 * 更新单个系统配置项
 */
export async function updateSystemConfigItem(key, value) {
  try {
    const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const result = await query(
      "UPDATE system_config SET config_value = ?, updated_at = NOW() WHERE config_key = ?",
      [configValue, key]
    );
    
    // 如果没有更新任何行，则插入新记录
    if (result.affectedRows === 0) {
      await query(
        "INSERT INTO system_config (config_key, config_value, updated_at) VALUES (?, ?, NOW())",
        [key, configValue]
      );
    }
    
    return true;
  } catch (error) {
    console.error('更新系统配置项失败:', error);
    throw error;
  }
}

// ==================== 统计API ====================

/**
 * 获取页面浏览统计
 */
export async function getPageViewStats(timeRange = '7d') {
  try {
    const db = await getDb();
    
    // 检查数据库适配器类型，只有SQLiteAdapter且不是MySQL时才调用其方法
    if (db.getType() === 'sqlite' && db.getPageViewStats && typeof db.getPageViewStats === 'function') {
      return await db.getPageViewStats(timeRange);
    }
    
    // 对于MySQL或其他数据库，使用SQL查询方式
    let dateCondition = '';
    const params = [];
    
    if (timeRange === '1d' || timeRange === '24h') {
      dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
    } else if (timeRange === '7d') {
      dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (timeRange === '30d') {
      dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }
    
    console.log(`🔍 获取页面浏览统计 - 时间范围: ${timeRange}, 数据库类型: ${db.getType()}`);
    
    const [totalResult, uniqueResult, topPagesResult] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM page_views ${dateCondition}`, params),
      query(`SELECT COUNT(DISTINCT session_id) as count FROM page_views ${dateCondition}`, params),
      query(`
        SELECT page_url, page_title, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_visitors
        FROM page_views ${dateCondition}
        GROUP BY page_url, page_title
        ORDER BY views DESC
        LIMIT 10
      `, params)
    ]);
    
    const result = {
      totalViews: totalResult[0]?.count || 0,
      uniqueVisitors: uniqueResult[0]?.count || 0,
      topPages: (topPagesResult || []).map(page => ({
        url: page.page_url,
        title: page.page_title,
        views: page.views,
        uniqueVisitors: page.unique_visitors
      }))
    };
    
    console.log(`📊 页面浏览统计结果: 总浏览量=${result.totalViews}, 独立访客=${result.uniqueVisitors}, 热门页面数=${result.topPages.length}`);
    
    return result;
  } catch (error) {
    console.error('获取页面浏览统计失败:', error);
    throw error;
  }
}

/**
 * 记录页面浏览
 */
export async function recordPageView(pageUrl, pageTitle, sessionId, userAgent = '', referrer = '') {
  try {
    await query(`
      INSERT INTO page_views (page_url, page_title, session_id, user_agent, referrer, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [pageUrl, pageTitle, sessionId, userAgent, referrer]);
    
    return true;
  } catch (error) {
    console.error('记录页面浏览失败:', error);
    throw error;
  }
}

/**
 * 记录视频播放
 */
export async function recordVideoPlay(videoId, sessionId, userAgent = '', watchDuration = 0, completionRate = 0, platform = 'web', ipAddress = '') {
  try {
    await query(`
      INSERT INTO video_plays (video_id, session_id, watch_duration, completion_rate, platform, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [parseInt(videoId), sessionId, watchDuration, completionRate, platform, ipAddress, userAgent]);
    
    return true;
  } catch (error) {
    console.error('记录视频播放失败:', error);
    throw error;
  }
}

// ==================== 用户API ====================

/**
 * 获取所有用户
 */
export async function getUsers(filters = {}) {
  try {
    const { status, role, page = 1, limit = 20, search } = filters;
    
    let sql = 'SELECT id, username, email, role, status, created_at, last_login_at as last_login FROM users WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    
    if (search) {
      sql += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (limit && limit > 0) {
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    }
    
    const users = await query(sql, params);
    return users;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
}

/**
 * 根据ID获取用户详情
 */
export async function getUserById(id) {
  try {
    const users = await query('SELECT id, username, email, role, status, created_at, last_login_at as last_login FROM users WHERE id = ?', [id]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('获取用户详情失败:', error);
    throw error;
  }
}

/**
 * 创建新用户
 */
export async function createUser(userData) {
  try {
    const { username, email, password, role = 'user', status = 'active' } = userData;
    
    const result = await query(
      "INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [username, email, password, role, status]
    );
    
    return { id: result.insertId, username, email, role, status };
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(id, userData) {
  try {
    const { username, email, role, status } = userData;
    
    await query(
      'UPDATE users SET username = ?, email = ?, role = ?, status = ? WHERE id = ?',
      [username, email, role, status, id]
    );
    
    return await getUserById(id);
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
}

/**
 * 删除用户
 */
export async function deleteUser(id) {
  try {
    await query('DELETE FROM users WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('删除用户失败:', error);
    throw error;
  }
}

/**
 * 获取用户统计
 */
export async function getUserStats() {
  try {
    const db = await getDb();
    
    // 检查数据库适配器类型，如果是SQLiteAdapter，直接调用其方法
    if (db.getUserStats && typeof db.getUserStats === 'function') {
      return await db.getUserStats();
    }
    
    // 否则使用传统的SQL查询方式
    const [totalResult, activeResult, recentResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query("SELECT COUNT(*) as count FROM users WHERE status = 'active'"),
      query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5')
    ]);
    
    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      recent: recentResult || []
    };
  } catch (error) {
    console.error('获取用户统计失败:', error);
    throw error;
  }
}

// ==================== 活动日志API ====================

/**
 * 获取活动日志
 */
export async function getActivityLogs(filters = {}) {
  try {
    const { type, userId, page = 1, limit = 50 } = filters;
    
    let sql = `SELECT 
      id,
      action,
      resource_type,
      resource_id,
      user_id,
      ip_address,
      user_agent,
      details,
      created_at
    FROM activity_logs WHERE 1=1`;
    const params = [];
    
    if (type) {
      sql += ' AND action = ?';
      params.push(type);
    }
    
    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (limit && limit > 0) {
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    }
    
    const logs = await query(sql, params);
    
    // 映射数据库字段到前端期望的格式
    const mappedLogs = logs.map(log => {
      // 处理details字段 - 如果是JSON对象，转换为字符串
      let details = '无详细信息';
      if (log.details) {
        try {
          if (typeof log.details === 'string') {
            // 检查是否包含无效字符
            if (log.details.includes('?')) {
              details = '数据包含无效字符';
            } else {
              try {
                // 如果是JSON字符串，尝试解析并格式化
                const parsed = JSON.parse(log.details);
                details = JSON.stringify(parsed, null, 2);
              } catch (parseError) {
                // 如果不是JSON，直接使用字符串
                details = log.details;
              }
            }
          } else if (typeof log.details === 'object') {
            // 如果是对象，直接格式化
            details = JSON.stringify(log.details, null, 2);
          } else {
            details = String(log.details);
          }
        } catch (error) {
          // 如果解析失败，直接转换为字符串
          details = '详细信息解析失败';
        }
      }
      
      return {
        id: log.id.toString(),
        timestamp: log.created_at,
        user: log.user_id ? `用户${log.user_id}` : '系统',
        action: log.action || '未知操作',
        target: log.resource_type || '系统',
        details: details,
        type: getLogType(log.action),
        ip: log.ip_address || '未知'
      };
    });
    
    return mappedLogs;
  } catch (error) {
    console.error('获取活动日志失败:', error);
    throw error;
  }
}

/**
 * 根据操作类型确定日志类型
 */
function getLogType(action) {
  if (!action) return 'info';
  
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('error') || actionLower.includes('fail') || actionLower.includes('delete')) {
    return 'error';
  } else if (actionLower.includes('warning') || actionLower.includes('warn')) {
    return 'warning';
  } else if (actionLower.includes('success') || actionLower.includes('create') || actionLower.includes('update')) {
    return 'success';
  } else {
    return 'info';
  }
}

/**
 * 添加活动日志
 */
export async function addActivityLog(logData) {
  try {
    const { type, description, userId = null, details = null } = logData;
    
    await query(
      "INSERT INTO activity_logs (action, resource_type, user_id, details, created_at) VALUES (?, ?, ?, ?, NOW())",
      [type || 'unknown', description || 'activity', userId, details ? JSON.stringify(details) : null]
    );
    
    return true;
  } catch (error) {
    console.error('添加活动日志失败:', error);
    throw error;
  }
}

// ==================== 评论API ====================

/**
 * 获取指定博客的评论
 */
export async function getComments(blogId) {
  try {
    const comments = await query(`
      SELECT 
        id,
        blog_id,
        author_name,
        author_email,
        content,
        status,
        parent_id,
        ip_address,
        created_at,
        updated_at
      FROM comments 
      WHERE blog_id = ? AND status = 'approved'
      ORDER BY created_at DESC
    `, [blogId]);
    
    return comments.map(comment => ({
      id: comment.id.toString(),
      blogId: comment.blog_id.toString(),
      author: comment.author_name,
      email: comment.author_email,
      content: comment.content,
      status: comment.status,
      parentId: comment.parent_id ? comment.parent_id.toString() : null,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=3B82F6&color=fff&size=40`
    }));
  } catch (error) {
    console.error('获取评论失败:', error);
    throw error;
  }
}

/**
 * 创建新评论
 */
export async function createComment(commentData) {
  try {
    const { 
      blogId, 
      author, 
      email, 
      content, 
      parentId = null,
      ipAddress = null,
      userAgent = null
    } = commentData;
    
    const result = await query(`
      INSERT INTO comments (
        blog_id, 
        author_name, 
        author_email, 
        content, 
        parent_id,
        ip_address,
        user_agent,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', NOW())
    `, [blogId, author, email, content, parentId, ipAddress, userAgent]);
    
    // 更新博客的评论数量
    await query(`
      UPDATE blogs 
      SET comment_count = (
        SELECT COUNT(*) FROM comments 
        WHERE blog_id = ? AND status = 'approved'
      ) 
      WHERE id = ?
    `, [blogId, blogId]);
    
    return {
      id: result.insertId.toString(),
      blogId: blogId.toString(),
      author,
      email,
      content,
      parentId: parentId ? parentId.toString() : null,
      createdAt: new Date().toISOString(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=3B82F6&color=fff&size=40`
    };
  } catch (error) {
    console.error('创建评论失败:', error);
    throw error;
  }
}

/**
 * 获取评论数量
 */
export async function getCommentCount(blogId) {
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM comments 
      WHERE blog_id = ? AND status = 'approved'
    `, [blogId]);
    
    return result[0].count;
  } catch (error) {
    console.error('获取评论数量失败:', error);
    throw error;
  }
}

/**
 * 删除评论
 */
export async function deleteComment(id) {
  try {
    // 获取评论信息以便更新博客评论数
    const comment = await query('SELECT blog_id FROM comments WHERE id = ?', [id]);
    if (comment.length === 0) {
      throw new Error('评论不存在');
    }
    
    const blogId = comment[0].blog_id;
    
    // 删除评论
    await query('DELETE FROM comments WHERE id = ?', [id]);
    
    // 更新博客的评论数量
    await query(`
      UPDATE blogs 
      SET comment_count = (
        SELECT COUNT(*) FROM comments 
        WHERE blog_id = ? AND status = 'approved'
      ) 
      WHERE id = ?
    `, [blogId, blogId]);
    
    return true;
  } catch (error) {
    console.error('删除评论失败:', error);
    throw error;
  }
}

/**
 * 更新评论状态
 */
export async function updateCommentStatus(id, status) {
  try {
    // 获取评论信息
    const comment = await query('SELECT blog_id FROM comments WHERE id = ?', [id]);
    if (comment.length === 0) {
      throw new Error('评论不存在');
    }
    
    const blogId = comment[0].blog_id;
    
    // 更新评论状态
    await query('UPDATE comments SET status = ? WHERE id = ?', [status, id]);
    
    // 更新博客的评论数量
    await query(`
      UPDATE blogs 
      SET comment_count = (
        SELECT COUNT(*) FROM comments 
        WHERE blog_id = ? AND status = 'approved'
      ) 
      WHERE id = ?
    `, [blogId, blogId]);
    
    return true;
  } catch (error) {
    console.error('更新评论状态失败:', error);
    throw error;
  }
}

export async function getDashboardStats() {
  try {
    // 获取博客统计
    const blogStats = await getBlogStats();
    
    // 获取视频统计
    const videoStats = await getVideoStats();
    
    // 获取页面浏览统计（不同时间范围）
    const [todayPageViews, weeklyPageViews, monthlyPageViews, totalPageViews] = await Promise.all([
      getPageViewStats('1d'),  // 今日
      getPageViewStats('7d'),  // 本周
      getPageViewStats('30d'), // 本月
      getPageViewStats()       // 全部
    ]);
    
    // 获取用户统计
    const userStats = await getUserStats();
    
    // 获取评论统计
    const commentResult = await query("SELECT COUNT(*) as count FROM comments WHERE status = 'approved'");
    const totalComments = commentResult[0].count;
    
    // 获取视频播放统计
    const videoPlayResult = await query("SELECT COUNT(*) as count FROM video_plays");
    const totalVideoPlays = videoPlayResult[0]?.count || 0;
    
    // 获取视频总观看次数（从videos表的view_count字段）
    const videoViewsResult = await query("SELECT SUM(view_count) as total FROM videos");
    const totalVideoViews = videoViewsResult[0]?.total || 0;
    
    return {
      totalBlogs: blogStats.total,
      publishedBlogs: blogStats.published,
      draftBlogs: blogStats.draft,
      totalVideos: videoStats.total,
      publishedVideos: videoStats.published,
      draftVideos: videoStats.draft || 0,
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      todayViews: todayPageViews.totalViews,
      weeklyViews: weeklyPageViews.totalViews,
      monthlyViews: monthlyPageViews.totalViews,
      totalPageViews: totalPageViews.totalViews,
      uniqueVisitors: totalPageViews.uniqueVisitors,
      totalVideoViews: parseInt(totalVideoViews) || 0,
      totalComments: totalComments
    };
  } catch (error) {
    console.error('获取仪表板统计失败:', error);
    throw error;
  }
}