// 外部视频追踪服务

import { 
  ExternalVideoTracker, 
  ReturnDetection, 
  UserWatchHistory,
  ExternalVideoTrackingConfig,
  PlatformCompletionRates
} from '../types/externalVideoTracking';
import { Video, VideoPlatform } from '../types/video';
import { API_URLS } from '../config/api';

// 默认配置
const DEFAULT_CONFIG: ExternalVideoTrackingConfig = {
  enabled: true,
  platformAverages: {
    youtube: {
      short: 0.75,
      medium: 0.45,
      long: 0.25
    },
    tiktok: {
      short: 0.85,
      medium: 0.60,
      long: 0.35
    },
    other: {
      short: 0.65,
      medium: 0.35,
      long: 0.20
    }
  },
  minTimeThreshold: 5000, // 5秒
  maxTimeThreshold: 1800000, // 30分钟
  confidenceFactors: {
    timeWeight: 0.4,
    platformWeight: 0.3,
    userHistoryWeight: 0.3
  }
};

class ExternalVideoTrackerService {
  private config: ExternalVideoTrackingConfig;
  private activeTrackers: Map<string, { startTime: number; videoId: string }> = new Map();
  private visibilityChangeHandler: (() => void) | null = null;

  constructor(config: Partial<ExternalVideoTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取会话ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('video_tracking_session');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('video_tracking_session', sessionId);
    }
    return sessionId;
  }

  /**
   * 获取用户ID（如果已登录）
   */
  private getUserId(): string | undefined {
    // 从localStorage或其他地方获取用户ID
    return localStorage.getItem('userId') || undefined;
  }

  /**
   * 检查视频是否为外部平台视频
   */
  private isExternalVideo(video: Video): boolean {
    return video.platform === 'youtube' || video.platform === 'tiktok';
  }

  /**
   * 提取视频时长（从URL或其他来源）
   */
  private getVideoDuration(video: Video): number {
    // 如果视频对象有duration属性，直接使用
    if (video.duration) {
      return video.duration;
    }

    // 根据平台设置默认时长
    switch (video.platform) {
      case 'tiktok':
        return 60; // TikTok视频通常较短
      case 'youtube':
        return 300; // YouTube视频默认5分钟
      default:
        return 180; // 默认3分钟
    }
  }

  /**
   * 追踪外部视频点击
   */
  public trackExternalVideoClick(video: Video): void {
    if (!this.config.enabled || !this.isExternalVideo(video)) {
      return;
    }

    const trackingData: ExternalVideoTracker = {
      videoId: video.id,
      platform: video.platform,
      clickTime: new Date(),
      userAgent: navigator.userAgent,
      referrer: window.location.href,
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    console.log('🎯 Tracking external video click:', trackingData);

    // 发送追踪数据到后端
    this.sendTrackingData('external_click', trackingData);

    // 设置返回检测
    this.setupReturnDetection(video);
  }

  /**
   * 追踪外部视频点击（新接口，兼容 AnalyticsContext）
   */
  public async trackClick(clickData: any): Promise<string> {
    const clickId = this.generateId();
    
    const trackingData = {
      ...clickData,
      id: clickId,
      clickTime: new Date(),
    };

    console.log('🎯 Tracking external video click (new interface):', trackingData);

    // 发送追踪数据到后端
    await this.sendTrackingData('external_click', trackingData);

    // 存储点击ID用于后续返回追踪
    this.activeTrackers.set(clickId, {
      startTime: Date.now(),
      videoId: clickData.videoId
    });

    return clickId;
  }

  /**
   * 追踪外部视频返回
   */
  public trackReturn(clickId: string): void {
    const tracker = this.activeTrackers.get(clickId);
    if (!tracker) {
      console.warn('No active tracker found for clickId:', clickId);
      return;
    }

    const timeSpent = Date.now() - tracker.startTime;
    
    const returnData = {
      id: this.generateId(),
      clickId,
      returnTime: new Date(),
      timeSpent,
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    console.log('↩️ Tracking external video return:', returnData);

    // 发送返回数据到后端
    this.sendTrackingData('external_return', returnData);

    // 清理追踪器
    this.activeTrackers.delete(clickId);
  }

  /**
   * 设置返回检测
   */
  private setupReturnDetection(video: Video): void {
    const startTime = Date.now();
    const trackerId = this.generateId();
    
    // 存储追踪器信息
    this.activeTrackers.set(trackerId, {
      startTime,
      videoId: video.id
    });

    // 清理之前的监听器
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    // 创建新的可见性变化处理器
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        this.handleUserReturn(trackerId, video);
      }
    };

    // 添加页面可见性监听
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // 设置超时清理
    setTimeout(() => {
      this.cleanupTracker(trackerId);
    }, this.config.maxTimeThreshold);
  }

  /**
   * 处理用户返回
   */
  private handleUserReturn(trackerId: string, video: Video): void {
    const tracker = this.activeTrackers.get(trackerId);
    if (!tracker) return;

    const timeSpent = Date.now() - tracker.startTime;
    
    // 检查时间阈值
    if (timeSpent < this.config.minTimeThreshold) {
      console.log('⏱️ Time spent too short, ignoring return event');
      this.cleanupTracker(trackerId);
      return;
    }

    const videoDuration = this.getVideoDuration(video);
    const estimatedWatchPercentage = this.calculateWatchPercentage(timeSpent, video, videoDuration);

    const returnData: ReturnDetection = {
      videoId: video.id,
      returnTime: new Date(),
      timeSpentExternal: timeSpent,
      estimatedWatchPercentage,
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    console.log('🔄 User returned from external platform:', returnData);

    // 发送返回数据
    this.sendTrackingData('user_return', returnData);

    // 清理追踪器
    this.cleanupTracker(trackerId);
  }

  /**
   * 计算观看百分比
   */
  private calculateWatchPercentage(timeSpent: number, video: Video, videoDuration: number): number {
    // 基础时间比例
    const timeRatio = Math.min(timeSpent / (videoDuration * 1000), 1);
    
    // 平台修正系数
    const platformFactor = this.config.platformAverages[video.platform] || 0.7;
    
    // 用户行为修正（这里简化处理，实际应该从用户历史获取）
    const userFactor = this.calculateUserFactor([]);
    
    // 综合预估
    const estimatedPercentage = Math.min(timeRatio * platformFactor * userFactor, 1);
    
    return Math.round(estimatedPercentage * 100) / 100; // 保留两位小数
  }

  /**
   * 计算用户行为修正系数
   */
  private calculateUserFactor(userHistory: UserWatchHistory[]): number {
    if (userHistory.length === 0) return 1;
    
    const avgCompletion = userHistory.reduce((sum, h) => sum + h.completionRate, 0) / userHistory.length;
    return Math.max(0.5, Math.min(1.5, avgCompletion));
  }

  /**
   * 发送追踪数据到后端
   */
  private async sendTrackingData(type: string, data: any): Promise<void> {
    try {
      const response = await fetch(API_URLS.ANALYTICS_EXTERNAL_VIDEOS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`✅ ${type} data sent successfully`);
    } catch (error) {
      console.error(`❌ Failed to send ${type} data:`, error);
      
      // 降级方案：存储到localStorage
      this.storeDataLocally(type, data);
    }
  }

  /**
   * 本地存储降级方案
   */
  private storeDataLocally(type: string, data: any): void {
    try {
      const key = `external_video_tracking_${type}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      // 限制本地存储数量
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
      console.log(`💾 ${type} data stored locally`);
    } catch (error) {
      console.error(`❌ Failed to store ${type} data locally:`, error);
    }
  }

  /**
   * 清理追踪器
   */
  private cleanupTracker(trackerId: string): void {
    this.activeTrackers.delete(trackerId);
    
    // 如果没有活跃的追踪器，移除事件监听器
    if (this.activeTrackers.size === 0 && this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  /**
   * 获取本地存储的追踪数据
   */
  public getLocalTrackingData(type: string): any[] {
    try {
      const key = `external_video_tracking_${type}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.error(`❌ Failed to get local ${type} data:`, error);
      return [];
    }
  }

  /**
   * 清理本地存储的追踪数据
   */
  public clearLocalTrackingData(type?: string): void {
    try {
      if (type) {
        localStorage.removeItem(`external_video_tracking_${type}`);
      } else {
        // 清理所有外部视频追踪数据
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('external_video_tracking_')
        );
        keys.forEach(key => localStorage.removeItem(key));
      }
      console.log('🧹 Local tracking data cleared');
    } catch (error) {
      console.error('❌ Failed to clear local tracking data:', error);
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ExternalVideoTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ External video tracking config updated:', this.config);
  }

  /**
   * 获取当前配置
   */
  public getConfig(): ExternalVideoTrackingConfig {
    return { ...this.config };
  }

  /**
   * 处理页面重新可见时的逻辑
   */
  public handlePageVisible(): void {
    if (!this.config.enabled) {
      return;
    }

    // 检查所有活跃的追踪器，看是否有用户返回
    this.activeTrackers.forEach((tracker, trackerId) => {
      const timeSpent = Date.now() - tracker.startTime;
      
      // 如果时间在合理范围内，认为用户可能看完了视频并返回
      if (timeSpent >= this.config.minTimeThreshold && timeSpent <= this.config.maxTimeThreshold) {
        // 这里可以添加更复杂的逻辑来判断用户是否真的看完了视频
        console.log(`🔄 User potentially returned from external video: ${tracker.videoId}`);
      }
    });
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    // 清理所有活跃的追踪器
    this.activeTrackers.clear();
    
    // 移除事件监听器
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    
    console.log('🗑️ External video tracker service destroyed');
  }
}

// 创建单例实例
export const externalVideoTracker = new ExternalVideoTrackerService();

// 导出类以便测试
export { ExternalVideoTrackerService };