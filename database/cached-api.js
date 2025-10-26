// 带缓存的数据库API包装器
import * as dbApi from './api.js';
import { cacheManager, cacheKeys, cacheTTL } from './redis.js';

// 初始化缓存管理器
let cacheInitialized = false;

async function ensureCacheInitialized() {
  if (!cacheInitialized) {
    await cacheManager.init();
    cacheInitialized = true;
  }
}

// ==================== 博客API（带缓存） ====================

/**
 * 获取所有博客（带缓存）
 */
export async function getBlogs(filters = {}) {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.blogs(filters);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getBlogs(filters);
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.medium);
  
  return result;
}

/**
 * 根据ID获取博客详情（带缓存）
 */
export async function getBlogById(id, language = 'zh') {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.blog(id, language);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  const result = await dbApi.getBlogById(id, language);
  
  // 缓存结果
  if (result) {
    await cacheManager.set(cacheKey, result, cacheTTL.long);
  }
  
  return result;
}

/**
 * 创建新博客（清除相关缓存）
 */
export async function createBlog(blogData) {
  await ensureCacheInitialized();
  
  const result = await dbApi.createBlog(blogData);
  
  // 清除相关缓存
  await invalidateBlogCaches();
  
  return result;
}

/**
 * 更新博客（清除相关缓存）
 */
export async function updateBlog(id, blogData) {
  await ensureCacheInitialized();
  
  const result = await dbApi.updateBlog(id, blogData);
  
  // 清除相关缓存
  await invalidateBlogCaches(id);
  
  return result;
}

/**
 * 删除博客（清除相关缓存）
 */
export async function deleteBlog(id) {
  await ensureCacheInitialized();
  
  const result = await dbApi.deleteBlog(id);
  
  // 清除相关缓存
  await invalidateBlogCaches(id);
  
  return result;
}

/**
 * 获取博客统计（带缓存）
 */
export async function getBlogStats() {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.blogStats();
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getBlogStats();
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.medium);
  
  return result;
}

// ==================== 视频API（带缓存） ====================

/**
 * 获取所有视频（带缓存）
 */
export async function getVideos(filters = {}) {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.videos(filters);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getVideos(filters);
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.medium);
  
  return result;
}

/**
 * 根据ID获取视频详情（带缓存）
 */
export async function getVideoById(id, language = 'zh') {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.video(id, language);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getVideoById(id, language);
  
  // 缓存结果
  if (result) {
    await cacheManager.set(cacheKey, result, cacheTTL.long);
  }
  
  return result;
}

/**
 * 创建新视频（清除相关缓存）
 */
export async function createVideo(videoData) {
  await ensureCacheInitialized();
  
  const result = await dbApi.createVideo(videoData);
  
  // 清除相关缓存
  await invalidateVideoCaches();
  
  return result;
}

/**
 * 更新视频（清除相关缓存）
 */
export async function updateVideo(id, videoData) {
  await ensureCacheInitialized();
  
  const result = await dbApi.updateVideo(id, videoData);
  
  // 清除相关缓存
  await invalidateVideoCaches(id);
  
  return result;
}

/**
 * 删除视频（清除相关缓存）
 */
export async function deleteVideo(id) {
  await ensureCacheInitialized();
  
  const result = await dbApi.deleteVideo(id);
  
  // 清除相关缓存
  await invalidateVideoCaches(id);
  
  return result;
}

/**
 * 获取视频统计（带缓存）
 */
export async function getVideoStats() {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.videoStats();
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getVideoStats();
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.medium);
  
  return result;
}

// ==================== 评论API（带缓存） ====================

/**
 * 获取评论列表（带缓存）
 */
export async function getComments(blogId, filters = {}) {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.comments(blogId);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getComments(blogId, filters);
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.short);
  
  return result;
}

/**
 * 获取评论数量（带缓存）
 */
export async function getCommentCount(blogId) {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.commentCount(blogId);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getCommentCount(blogId);
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.short);
  
  return result;
}

/**
 * 创建新评论（清除相关缓存）
 */
export async function createComment(commentData) {
  await ensureCacheInitialized();
  
  const result = await dbApi.createComment(commentData);
  
  // 清除相关缓存
  await invalidateCommentCaches(commentData.blog_id);
  
  return result;
}

/**
 * 更新评论状态（清除相关缓存）
 */
export async function updateCommentStatus(id, status) {
  await ensureCacheInitialized();
  
  const result = await dbApi.updateCommentStatus(id, status);
  
  // 获取评论信息以清除相关缓存
  const comment = await dbApi.getCommentById(id);
  if (comment) {
    await invalidateCommentCaches(comment.blog_id);
  }
  
  return result;
}

/**
 * 删除评论（清除相关缓存）
 */
export async function deleteComment(id) {
  await ensureCacheInitialized();
  
  // 获取评论信息以清除相关缓存
  const comment = await dbApi.getCommentById(id);
  
  const result = await dbApi.deleteComment(id);
  
  if (comment) {
    await invalidateCommentCaches(comment.blog_id);
  }
  
  return result;
}

// ==================== 用户API（带缓存） ====================

/**
 * 获取用户列表（带缓存）
 */
export async function getUsers(filters = {}) {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.users(filters);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getUsers(filters);
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.medium);
  
  return result;
}

/**
 * 根据ID获取用户详情（带缓存）
 */
export async function getUserById(id) {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.user(id);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getUserById(id);
  
  // 缓存结果
  if (result) {
    await cacheManager.set(cacheKey, result, cacheTTL.long);
  }
  
  return result;
}

/**
 * 创建新用户（清除相关缓存）
 */
export async function createUser(userData) {
  await ensureCacheInitialized();
  
  const result = await dbApi.createUser(userData);
  
  // 清除相关缓存
  await invalidateUserCaches();
  
  return result;
}

/**
 * 更新用户（清除相关缓存）
 */
export async function updateUser(id, userData) {
  await ensureCacheInitialized();
  
  const result = await dbApi.updateUser(id, userData);
  
  // 清除相关缓存
  await invalidateUserCaches(id);
  
  return result;
}

/**
 * 删除用户（清除相关缓存）
 */
export async function deleteUser(id) {
  await ensureCacheInitialized();
  
  const result = await dbApi.deleteUser(id);
  
  // 清除相关缓存
  await invalidateUserCaches(id);
  
  return result;
}

// ==================== 活动日志API ====================

/**
 * 获取活动日志（带缓存）
 */
export async function getActivityLogs(filters = {}) {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.activityLogs(filters);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getActivityLogs(filters);
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.short);
  
  return result;
}

/**
 * 添加活动日志（不缓存）
 */
export async function addActivityLog(logData) {
  await ensureCacheInitialized();
  
  const result = await dbApi.addActivityLog(logData);
  
  // 清除活动日志缓存
  await cacheManager.delPattern('activity_logs:*');
  
  return result;
}

// ==================== 仪表板API（带缓存） ====================

/**
 * 获取仪表板统计（带缓存）
 */
export async function getDashboardStats() {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.dashboard();
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getDashboardStats();
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.medium);
  
  return result;
}

// ==================== 分析API（带缓存） ====================

/**
 * 记录页面浏览（不缓存，但清理相关缓存）
 */
export async function recordPageView(pageUrl, pageTitle, sessionId, userAgent = '', referrer = '') {
  await ensureCacheInitialized();
  
  const result = await dbApi.recordPageView(pageUrl, pageTitle, sessionId, userAgent, referrer);
  
  // 清理页面浏览统计相关缓存
  await invalidatePageViewCaches();
  
  return result;
}

/**
 * 记录视频播放（不缓存）
 */
export async function recordVideoPlay(videoId, sessionId, userAgent = '', watchDuration = 0, completionRate = 0, platform = 'web', ipAddress = '') {
  return await dbApi.recordVideoPlay(videoId, sessionId, userAgent, watchDuration, completionRate, platform, ipAddress);
}

/**
 * 获取页面浏览统计（带缓存）
 */
export async function getPageViewStats(timeRange = '7d') {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.pageViews(timeRange);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getPageViewStats(timeRange);
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.medium);
  
  return result;
}

// ==================== 缓存失效辅助函数 ====================

/**
 * 清除博客相关缓存
 */
async function invalidateBlogCaches(blogId = null) {
  await cacheManager.delPattern('blogs:*');
  await cacheManager.del(cacheKeys.blogStats());
  await cacheManager.del(cacheKeys.dashboard());
  
  if (blogId) {
    await cacheManager.del(cacheKeys.blog(blogId));
    await cacheManager.del(cacheKeys.comments(blogId));
    await cacheManager.del(cacheKeys.commentCount(blogId));
  }
}

/**
 * 清除视频相关缓存
 */
async function invalidateVideoCaches(videoId = null) {
  await cacheManager.delPattern('videos:*');
  await cacheManager.del(cacheKeys.videoStats());
  await cacheManager.del(cacheKeys.dashboard());
  
  if (videoId) {
    await cacheManager.del(cacheKeys.video(videoId));
  }
}

/**
 * 清除评论相关缓存
 */
async function invalidateCommentCaches(blogId) {
  await cacheManager.del(cacheKeys.comments(blogId));
  await cacheManager.del(cacheKeys.commentCount(blogId));
  await cacheManager.del(cacheKeys.dashboard());
}

/**
 * 清除用户相关缓存
 */
async function invalidateUserCaches(userId = null) {
  await cacheManager.delPattern('users:*');
  await cacheManager.del(cacheKeys.dashboard());
  
  if (userId) {
    await cacheManager.del(cacheKeys.user(userId));
  }
}

/**
 * 清除页面浏览相关缓存
 */
async function invalidatePageViewCaches() {
  await cacheManager.delPattern('page_views:*');
  await cacheManager.del(cacheKeys.dashboard());
}

// ==================== 缓存管理API ====================

/**
 * 获取缓存统计信息
 */
export async function getCacheStats() {
  await ensureCacheInitialized();
  return await cacheManager.getStats();
}

/**
 * 清空所有缓存
 */
export async function clearAllCache() {
  await ensureCacheInitialized();
  return await cacheManager.flushAll();
}

/**
 * 预热缓存
 */
export async function warmupCache() {
  await ensureCacheInitialized();
  
  try {
    // 预热博客数据
    await getBlogs({ limit: 20 });
    await getBlogStats();
    
    // 预热视频数据
    await getVideos({ limit: 20 });
    await getVideoStats();
    
    // 预热仪表板数据
    await getDashboardStats();
  } catch (error) {
    console.error('缓存预热失败:', error);
  }
}

// ==================== 分类API（带缓存） ====================

/**
 * 获取所有分类（带缓存）
 */
export async function getCategories(language = 'zh') {
  await ensureCacheInitialized();
  
  const cacheKey = cacheKeys.categories(language);
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 从数据库获取
  const result = await dbApi.getCategories(language);
  
  // 缓存结果
  await cacheManager.set(cacheKey, result, cacheTTL.long);
  
  return result;
}

// 导出其他不需要缓存的API函数
export { 
  incrementBlogViews,
  incrementVideoViews,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getSystemConfig,
  saveSystemConfig,
  updateSystemConfigItem,
  getUserStats,
  getBlogReadingStats,
  recordBlogReadingTime
} from './api.js';