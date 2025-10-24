// 缓存管理工具
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5分钟默认过期时间

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 过期时间（毫秒），默认5分钟
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiry: now + ttl
    };
    
    this.cache.set(key, item);
    
    // 同时保存到localStorage（如果数据可序列化）
    try {
      const serialized = JSON.stringify(item);
      localStorage.setItem(`cache_${key}`, serialized);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  get<T>(key: string): T | null {
    // 先从内存缓存获取
    let item = this.cache.get(key);
    
    // 如果内存中没有，尝试从localStorage获取
    if (!item) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          item = JSON.parse(stored);
          if (item) {
            this.cache.set(key, item);
          }
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }
    
    if (!item) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
    localStorage.removeItem(`cache_${key}`);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    
    // 清除localStorage中的缓存
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * 获取或设置缓存（如果不存在则执行获取函数）
   * @param key 缓存键
   * @param fetchFn 获取数据的函数
   * @param ttl 过期时间
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }
}

// 创建全局缓存实例
export const cache = new CacheManager();

// 视频相关的缓存键生成器
export const cacheKeys = {
  videos: 'videos_list',
  video: (id: string) => `video_${id}`,
  userInteractions: (userId: string) => `user_interactions_${userId}`,
  searchResults: (query: string) => `search_${encodeURIComponent(query)}`,
  filteredVideos: (filters: string) => `filtered_${encodeURIComponent(filters)}`,
  recommendations: (videoId: string) => `recommendations_${videoId}`,
  popularVideos: 'popular_videos',
  watchProgress: (videoId: string) => `watch_progress_${videoId}`
};

// 缓存时间常量（毫秒）
export const cacheTTL = {
  short: 1 * 60 * 1000,      // 1分钟
  medium: 5 * 60 * 1000,     // 5分钟
  long: 30 * 60 * 1000,      // 30分钟
  veryLong: 2 * 60 * 60 * 1000, // 2小时
  persistent: 24 * 60 * 60 * 1000 // 24小时
};

// 定期清理过期缓存
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000); // 每10分钟清理一次

export default cache;