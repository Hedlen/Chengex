import { DataManager } from '../../shared/api/dataManager';

export interface RealTimeStats {
  blogId: string;
  viewCount: number;
  readingTime: number;
  scrollDepth: number;
  uniqueVisitors: number;
  lastUpdated: string;
}

export interface AnalyticsEvent {
  type: 'view_increment' | 'reading_time_update' | 'stats_refresh';
  blogId: string;
  data: any;
  timestamp: string;
}

export class RealTimeAnalyticsService {
  private static instance: RealTimeAnalyticsService;
  private subscribers: Map<string, Set<(event: AnalyticsEvent) => void>> = new Map();
  private globalSubscribers: Set<(event: AnalyticsEvent) => void> = new Set();
  private statsCache: Map<string, RealTimeStats> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastStatsCache: Map<string, any> = new Map();
  private isEnabled = true; // 添加启用/禁用标志
  
  // 增加轮询间隔，减少频繁刷新
  private readonly POLLING_INTERVAL = 120000; // 改为120秒（2分钟），进一步减少频率
  private readonly MIN_UPDATE_INTERVAL = 10000; // 最小更新间隔10秒，防止过于频繁的更新

  private constructor() {}

  public static getInstance(): RealTimeAnalyticsService {
    if (!RealTimeAnalyticsService.instance) {
      RealTimeAnalyticsService.instance = new RealTimeAnalyticsService();
    }
    return RealTimeAnalyticsService.instance;
  }

  /**
   * Subscribe to real-time analytics events
   */
  public subscribe(blogId: string, callback: (event: AnalyticsEvent) => void): () => void {
    if (!this.subscribers.has(blogId)) {
      this.subscribers.set(blogId, new Set());
    }
    
    this.subscribers.get(blogId)!.add(callback);
    console.log(`📊 RealTimeAnalytics: Subscribed to real-time data for blog ${blogId}`);

    // Start polling if not already started
    this.startPolling();

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(blogId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(blogId);
          console.log(`📊 RealTimeAnalytics: 取消订阅博客 ${blogId}`);
        }
      }

      // 如果没有订阅者了，停止轮询
      if (this.subscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  /**
   * 全局订阅所有博客的实时分析事件
   */
  public subscribeGlobal(callback: (event: AnalyticsEvent) => void): () => void {
    this.globalSubscribers.add(callback);
    console.log('📊 RealTimeAnalytics: 全局订阅实时数据');

    // 开始轮询（如果还没开始）
    this.startPolling();

    // 返回取消订阅函数
    return () => {
      this.globalSubscribers.delete(callback);
      console.log('📊 RealTimeAnalytics: 取消全局订阅');

      // 如果没有订阅者了，停止轮询
      if (this.subscribers.size === 0 && this.globalSubscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  /**
   * 发布事件给订阅者
   */
  private publish(blogId: string, event: AnalyticsEvent): void {
    const subscribers = this.subscribers.get(blogId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('📊 RealTimeAnalytics: 事件回调错误', error);
        }
      });
    }

    // 发布给全局订阅者
    this.globalSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('📊 RealTimeAnalytics: 全局事件回调错误', error);
      }
    });
  }

  /**
   * 启用实时分析
   */
  public enable(): void {
    this.isEnabled = true;
    console.log('📊 RealTimeAnalytics: 已启用实时分析');
    if (this.subscribers.size > 0 || this.globalSubscribers.size > 0) {
      this.startPolling();
    }
  }

  /**
   * 禁用实时分析
   */
  public disable(): void {
    this.isEnabled = false;
    this.stopPolling();
    console.log('📊 RealTimeAnalytics: 已禁用实时分析');
  }

  /**
   * 检查是否启用
   */
  public isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 开始轮询统计数据
   */
  public startPolling(): void {
    if (this.isPolling || !this.isEnabled) return;

    this.isPolling = true;
    console.log('📊 RealTimeAnalytics: 开始轮询统计数据');

    this.pollingInterval = setInterval(async () => {
      if (this.isEnabled) {
        await this.refreshAllStats();
      }
    }, this.POLLING_INTERVAL);

    // 立即执行一次（如果启用）
    if (this.isEnabled) {
      this.refreshAllStats();
    }
  }

  /**
   * 停止轮询
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('📊 RealTimeAnalytics: 停止轮询统计数据');
    }
  }

  /**
   * 刷新所有订阅的博客统计数据
   */
  private async refreshAllStats(): Promise<void> {
    const blogIds = Array.from(this.subscribers.keys()).filter(id => id !== '*');
    
    for (const blogId of blogIds) {
      try {
        await this.refreshBlogStats(blogId);
      } catch (error) {
        console.error(`📊 RealTimeAnalytics: 刷新博客 ${blogId} 统计失败`, error);
      }
    }
  }

  /**
   * 刷新单个博客的统计数据
   */
  private async refreshBlogStats(blogId: string): Promise<void> {
    try {
      // 检查是否在最小更新间隔内
      const lastUpdateKey = `last_update_${blogId}`;
      const lastUpdate = this.lastStatsCache.get(lastUpdateKey);
      const now = Date.now();
      
      if (lastUpdate && (now - lastUpdate) < this.MIN_UPDATE_INTERVAL) {
        console.log(`📊 RealTimeAnalytics: 跳过博客 ${blogId} 的更新，距离上次更新时间过短`);
        return;
      }

      console.log(`📊 RealTimeAnalytics: 刷新博客 ${blogId} 的统计数据`);
      
      // 获取实时统计数据
      const stats = await DataManager.getBlogStats(blogId);
      
      if (stats) {
        const currentStats = {
          viewCount: stats.viewCount || 0,
          readTime: 0, // 暂时设为0，等待后端API支持
          scrollDepth: 0, // 暂时设为0，等待后端API支持
          uniqueVisitors: 0 // 暂时设为0，等待后端API支持
        };

        // 检查数据是否有变化
        const cacheKey = `stats_${blogId}`;
        const cachedStats = this.lastStatsCache.get(cacheKey);
        
        const hasChanged = !cachedStats || 
          cachedStats.viewCount !== currentStats.viewCount ||
          cachedStats.readTime !== currentStats.readTime ||
          cachedStats.scrollDepth !== currentStats.scrollDepth ||
          cachedStats.uniqueVisitors !== currentStats.uniqueVisitors;

        if (hasChanged) {
          // 更新缓存
          this.lastStatsCache.set(cacheKey, currentStats);
          this.lastStatsCache.set(lastUpdateKey, now);
          
          // 发布事件
          this.publish(blogId, {
            type: 'stats_refresh',
            blogId,
            data: currentStats,
            timestamp: now.toString()
          });
          
          console.log(`📊 RealTimeAnalytics: 博客 ${blogId} 统计数据已更新`, currentStats);
        } else {
          console.log(`📊 RealTimeAnalytics: 博客 ${blogId} 统计数据无变化，跳过更新`);
        }
      }
    } catch (error) {
      console.error(`📊 RealTimeAnalytics: 刷新博客 ${blogId} 统计失败`, error);
    }
  }

  /**
   * 手动触发浏览量增加事件
   */
  public notifyViewIncrement(blogId: string, newViewCount: number): void {
    const event: AnalyticsEvent = {
      type: 'view_increment',
      blogId,
      data: { viewCount: newViewCount },
      timestamp: new Date().toISOString()
    };

    this.publish(blogId, event);

    // 更新缓存
    const cachedStats = this.statsCache.get(blogId);
    if (cachedStats) {
      this.statsCache.set(blogId, {
        ...cachedStats,
        viewCount: newViewCount,
        lastUpdated: new Date().toISOString()
      });
    }

    console.log(`📊 RealTimeAnalytics: 博客 ${blogId} 浏览量增加到 ${newViewCount}`);
  }

  /**
   * 手动触发阅读时间更新事件
   */
  public notifyReadingTimeUpdate(blogId: string, readingData: any): void {
    const event: AnalyticsEvent = {
      type: 'reading_time_update',
      blogId,
      data: readingData,
      timestamp: new Date().toISOString()
    };

    this.publish(blogId, event);
    console.log(`📊 RealTimeAnalytics: 博客 ${blogId} 阅读时间数据更新`, readingData);
  }

  /**
   * 获取缓存的统计数据
   */
  public getCachedStats(blogId: string): RealTimeStats | null {
    return this.statsCache.get(blogId) || null;
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.statsCache.clear();
    this.lastStatsCache.clear();
    console.log('📊 RealTimeAnalytics: 缓存已清除');
  }

  /**
   * 获取所有活跃的订阅
   */
  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscribers.keys());
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.stopPolling();
    this.subscribers.clear();
    this.globalSubscribers.clear();
    this.statsCache.clear();
    this.lastStatsCache.clear();
    console.log('📊 RealTimeAnalytics: 服务已销毁');
  }
}

// 导出单例实例
export const realTimeAnalytics = RealTimeAnalyticsService.getInstance();