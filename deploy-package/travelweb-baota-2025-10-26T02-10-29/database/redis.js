// Redis缓存管理器
import Redis from 'ioredis';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// Redis连接配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 1000,
  maxRetriesPerRequest: 0, // 禁用重试
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 1000, // 减少连接超时
  commandTimeout: 1000, // 减少命令超时
  enableOfflineQueue: false, // 禁用离线队列
  enableReadyCheck: false, // 禁用就绪检查
  maxRetriesPerRequest: null, // 禁用请求重试
  db: 0
};

// 创建Redis实例
let redis = null;
let isConnected = false;

// 内存缓存作为备选方案
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

/**
 * 初始化Redis连接
 */
export async function initRedis() {
  try {
    redis = new Redis(redisConfig);
    
    redis.on('connect', () => {
      console.log('✅ Redis连接成功');
      isConnected = true;
    });
    
    redis.on('error', (err) => {
      console.log('⚠️ Redis不可用，使用内存缓存:', err.message);
      isConnected = false;
      // 静默处理错误，不再重连
      if (redis) {
        redis.disconnect();
        redis = null;
      }
    });
    
    redis.on('close', () => {
      console.log('📦 使用内存缓存模式');
      isConnected = false;
    });
    
    // 设置连接超时
    const connectTimeout = setTimeout(() => {
      if (!isConnected && redis) {
        console.log('⚠️ Redis连接超时，切换到内存缓存模式');
        redis.disconnect();
        redis = null;
      }
    }, 2000);
    
    // 测试连接
    try {
      await redis.ping();
      clearTimeout(connectTimeout);
      console.log('🎯 Redis连接测试成功');
      return redis;
    } catch (pingError) {
      clearTimeout(connectTimeout);
      console.log('📦 Redis不可用，使用内存缓存模式');
      if (redis) {
        redis.disconnect();
        redis = null;
      }
      return null;
    }
  } catch (error) {
    console.log('📦 Redis初始化失败，使用内存缓存模式');
    // 不抛出错误，允许系统在没有Redis的情况下运行
    return null;
  }
}

/**
 * 获取Redis实例
 */
export function getRedis() {
  return redis;
}

/**
 * 检查Redis连接状态
 */
export function isRedisConnected() {
  return isConnected && redis && redis.status === 'ready';
}

/**
 * 关闭Redis连接
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    isConnected = false;
    console.log('🔌 Redis连接已关闭');
  }
}

// 缓存管理器类
export class CacheManager {
  constructor() {
    this.redis = null;
    this.defaultTTL = 300; // 5分钟默认过期时间
  }

  /**
   * 初始化缓存管理器
   */
  async init() {
    this.redis = await initRedis();
    return this.redis !== null;
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} value 缓存值
   * @param {number} ttl 过期时间（秒）
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.isAvailable()) {
        const serialized = JSON.stringify(value);
        await this.redis.setex(key, ttl, serialized);
        console.log(`✅ Redis缓存设置成功: ${key}`);
        return true;
      } else {
        // 使用内存缓存作为备选方案
        const serialized = JSON.stringify(value);
        memoryCache.set(key, serialized);
        memoryCacheExpiry.set(key, Date.now() + ttl * 1000);
        console.log(`✅ 内存缓存设置成功: ${key}`);
        return true;
      }
    } catch (error) {
      console.error('❌ 缓存设置失败:', error.message);
      // 降级到内存缓存
      try {
        const serialized = JSON.stringify(value);
        memoryCache.set(key, serialized);
        memoryCacheExpiry.set(key, Date.now() + ttl * 1000);
        console.log(`✅ 降级到内存缓存: ${key}`);
        return true;
      } catch (fallbackError) {
        console.error('❌ 内存缓存也失败:', fallbackError.message);
        return false;
      }
    }
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   */
  async get(key) {
    try {
      if (this.isAvailable()) {
        const cached = await this.redis.get(key);
        if (cached) {
          console.log(`✅ Redis缓存命中: ${key}`);
          return JSON.parse(cached);
        }
      } else {
        // 检查内存缓存
        const expiry = memoryCacheExpiry.get(key);
        if (expiry && Date.now() < expiry) {
          const value = memoryCache.get(key);
          if (value) {
            console.log(`✅ 内存缓存命中: ${key}`);
            return JSON.parse(value);
          }
        } else if (expiry) {
          // 过期了，清理
          memoryCache.delete(key);
          memoryCacheExpiry.delete(key);
        }
      }
      
      console.log(`❌ 缓存未命中: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ 缓存获取失败:', error.message);
      // 尝试内存缓存
      try {
        const expiry = memoryCacheExpiry.get(key);
        if (expiry && Date.now() < expiry) {
          const value = memoryCache.get(key);
          if (value) {
            console.log(`✅ 降级到内存缓存命中: ${key}`);
            return JSON.parse(value);
          }
        }
      } catch (fallbackError) {
        console.error('❌ 内存缓存获取也失败:', fallbackError.message);
      }
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   */
  async del(key) {
    try {
      let success = false;
      
      if (this.isAvailable()) {
        await this.redis.del(key);
        console.log(`✅ Redis缓存删除成功: ${key}`);
        success = true;
      }
      
      // 同时删除内存缓存
      if (memoryCache.has(key)) {
        memoryCache.delete(key);
        memoryCacheExpiry.delete(key);
        console.log(`✅ 内存缓存删除成功: ${key}`);
        success = true;
      }
      
      return success;
    } catch (error) {
      console.error('❌ 缓存删除失败:', error.message);
      // 尝试删除内存缓存
      try {
        if (memoryCache.has(key)) {
          memoryCache.delete(key);
          memoryCacheExpiry.delete(key);
          console.log(`✅ 降级删除内存缓存: ${key}`);
          return true;
        }
      } catch (fallbackError) {
        console.error('❌ 内存缓存删除也失败:', fallbackError.message);
      }
      return false;
    }
  }

  /**
   * 批量删除缓存
   * @param {string} pattern 匹配模式
   */
  async delPattern(pattern) {
    let success = false;
    
    // 尝试从Redis删除
    if (this.isAvailable()) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          console.log(`✅ Redis批量删除缓存成功: ${pattern} (${keys.length}个键)`);
        }
        success = true;
      } catch (error) {
        console.error('❌ Redis批量删除缓存失败:', error.message);
      }
    }
    
    // 同时清除内存缓存中匹配的键
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const keysToDelete = [];
      
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }
      
      if (keysToDelete.length > 0) {
        keysToDelete.forEach(key => {
          memoryCache.delete(key);
          memoryCacheExpiry.delete(key);
        });
        console.log(`✅ 内存缓存批量删除成功: ${pattern} (${keysToDelete.length}个键)`);
        success = true;
      }
    } catch (error) {
      console.error('❌ 内存缓存批量删除失败:', error.message);
    }
    
    return success;
  }

  /**
   * 检查缓存是否存在
   * @param {string} key 缓存键
   */
  async exists(key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('检查缓存存在性失败:', error.message);
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   * @param {string} key 缓存键
   * @param {number} ttl 过期时间（秒）
   */
  async expire(key, ttl) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('设置缓存过期时间失败:', error.message);
      return false;
    }
  }

  /**
   * 获取缓存剩余过期时间
   * @param {string} key 缓存键
   */
  async ttl(key) {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error('获取缓存过期时间失败:', error.message);
      return -1;
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    try {
      const stats = {
        redis: {
          connected: isConnected,
          keyCount: 0,
          memoryInfo: null
        },
        memory: {
          keyCount: memoryCache.size,
          activeKeys: 0
        }
      };
      
      if (isConnected) {
        try {
          const info = await redis.info('memory');
          const keyCount = await redis.dbsize();
          stats.redis.keyCount = keyCount;
          stats.redis.memoryInfo = info;
        } catch (error) {
          console.error('❌ 获取Redis统计失败:', error.message);
          stats.redis.connected = false;
        }
      }
      
      // 统计未过期的内存缓存键
      const now = Date.now();
      for (const [key, expiry] of memoryCacheExpiry.entries()) {
        if (now < expiry) {
          stats.memory.activeKeys++;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('❌ 获取缓存统计失败:', error.message);
      return {
        redis: { connected: false, error: error.message },
        memory: { keyCount: memoryCache.size, activeKeys: 0 }
      };
    }
  }

  /**
   * 清空所有缓存
   */
  async flushAll() {
    try {
      let success = false;
      
      if (this.isAvailable()) {
        await this.redis.flushdb();
        console.log('✅ Redis缓存清空成功');
        success = true;
      }
      
      // 清空内存缓存
      memoryCache.clear();
      memoryCacheExpiry.clear();
      console.log('✅ 内存缓存清空成功');
      
      return true; // 至少内存缓存清空成功
    } catch (error) {
      console.error('❌ 清空缓存失败:', error.message);
      // 尝试清空内存缓存
      try {
        memoryCache.clear();
        memoryCacheExpiry.clear();
        console.log('✅ 降级清空内存缓存');
        return true;
      } catch (fallbackError) {
        console.error('❌ 内存缓存清空也失败:', fallbackError.message);
        return false;
      }
    }
  }

  /**
   * 检查Redis是否可用
   */
  isAvailable() {
    return this.redis && isRedisConnected();
  }
}

// 创建全局缓存管理器实例
export const cacheManager = new CacheManager();

// 缓存键生成器
export const cacheKeys = {
  // 博客相关
  blog: (id, language = 'zh') => `blog:${id}:${language}`,
  blogs: (filters) => `blogs:${JSON.stringify(filters)}`,
  blogStats: () => 'blog:stats',
  
  // 视频相关
  video: (id, language = 'zh') => `video:${id}:${language}`,
  videos: (filters) => `videos:${JSON.stringify(filters)}`,
  videoStats: () => 'video:stats',
  
  // 分类相关
  categories: (language = 'zh') => `categories:${language}`,
  
  // 评论相关
  comments: (blogId) => `comments:${blogId}`,
  commentCount: (blogId) => `comment_count:${blogId}`,
  
  // 用户相关
  user: (id) => `user:${id}`,
  users: (filters) => `users:${JSON.stringify(filters)}`,
  
  // 分析数据
  analytics: (type, range) => `analytics:${type}:${range}`,
  pageViews: (range) => `page_views:${range}`,
  
  // 仪表板
  dashboard: () => 'dashboard:stats',
  
  // 活动日志
  activityLogs: (filters) => `activity_logs:${JSON.stringify(filters)}`
};

// 缓存时间常量（秒）
export const cacheTTL = {
  short: 60,           // 1分钟
  medium: 300,         // 5分钟
  long: 1800,          // 30分钟
  veryLong: 7200,      // 2小时
  daily: 86400,        // 24小时
  weekly: 604800       // 7天
};

export default cacheManager;