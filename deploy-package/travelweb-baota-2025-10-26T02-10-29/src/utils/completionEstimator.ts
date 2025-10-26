import { 
  CompletionEstimator, 
  UserWatchHistory, 
  VideoCompletionEstimate, 
  PlatformCompletionRates,
  ExternalVideoTrackingRecord 
} from '../types/externalVideoTracking';

/**
 * 视频完播率预估算法
 * 基于用户停留时间、平台特性和历史行为预估完播率
 */
export class VideoCompletionEstimator implements CompletionEstimator {
  // 平台基础完播率数据（基于行业统计）
  private static readonly PLATFORM_BASE_RATES: PlatformCompletionRates = {
    youtube: {
      short: 0.75,    // 短视频（<60s）平均完播率75%
      medium: 0.45,   // 中等视频（1-10分钟）平均完播率45%
      long: 0.25      // 长视频（>10分钟）平均完播率25%
    },
    tiktok: {
      short: 0.85,    // TikTok短视频完播率更高
      medium: 0.60,   // 中等视频
      long: 0.35      // 长视频
    },
    other: {
      short: 0.65,
      medium: 0.35,
      long: 0.20
    }
  };

  // 时间阈值配置
  private static readonly TIME_THRESHOLDS = {
    SHORT_VIDEO: 60,      // 60秒以下为短视频
    MEDIUM_VIDEO: 600,    // 10分钟以下为中等视频
    MIN_WATCH_TIME: 5,    // 最小观看时间5秒
    MAX_CONFIDENCE: 0.9,  // 最大置信度
    MIN_CONFIDENCE: 0.3   // 最小置信度
  };

  /**
   * 预估视频完播率
   */
  estimateCompletion(
    timeSpent: number,
    videoDuration: number,
    platform: string,
    userHistory?: UserWatchHistory
  ): VideoCompletionEstimate {
    // 基础验证
    if (timeSpent < VideoCompletionEstimator.TIME_THRESHOLDS.MIN_WATCH_TIME) {
      return {
        id: `estimate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        videoId: 'unknown',
        platform: platform as any,
        date: new Date(),
        totalClicks: 0,
        estimatedViews: 0,
        estimatedCompletions: 0,
        estimatedCompletionRate: 0,
        confidence: VideoCompletionEstimator.TIME_THRESHOLDS.MIN_CONFIDENCE,
        confidenceScore: VideoCompletionEstimator.TIME_THRESHOLDS.MIN_CONFIDENCE,
        method: 'insufficient_time',
        factors: {
          timeSpent,
          videoDuration,
          platform,
          userBehaviorScore: 0
        },
        updatedAt: new Date()
      };
    }

    // 获取视频类型
    const videoType = this.getVideoType(videoDuration);
    
    // 获取平台基础完播率
    const platformRates = VideoCompletionEstimator.PLATFORM_BASE_RATES[platform as keyof PlatformCompletionRates] 
      || VideoCompletionEstimator.PLATFORM_BASE_RATES.other;
    const basePlatformRate = platformRates[videoType];

    // 计算时间比例
    const timeRatio = Math.min(timeSpent / videoDuration, 1.2); // 允许超过视频时长20%

    // 基于时间的完播率预估
    let timeBasedRate = this.calculateTimeBasedRate(timeRatio, videoType);

    // 用户行为调整
    const userBehaviorScore = userHistory ? this.calculateUserBehaviorScore(userHistory, platform) : 0.5;
    
    // 综合计算完播率
    const estimatedRate = this.combineEstimates(
      timeBasedRate,
      basePlatformRate,
      userBehaviorScore,
      timeRatio
    );

    // 计算置信度
    const confidence = this.calculateConfidence(timeSpent, videoDuration, userHistory);

    return {
      id: `estimate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoId: 'unknown',
      platform: platform as any,
      date: new Date(),
      totalClicks: 0,
      estimatedViews: 0,
      estimatedCompletions: 0,
      estimatedCompletionRate: Math.min(estimatedRate, 1.0),
      confidence,
      confidenceScore: confidence,
      method: 'hybrid_estimation',
      factors: {
        timeSpent,
        videoDuration,
        platform,
        timeRatio,
        basePlatformRate,
        userBehaviorScore,
        videoType
      },
      updatedAt: new Date()
    };
  }

  /**
   * 批量预估多个视频的完播率
   */
  batchEstimate(records: ExternalVideoTrackingRecord[]): VideoCompletionEstimate[] {
    return records.map(record => {
      const timeSpent = record.returnTime ? 
        (new Date(record.returnTime).getTime() - new Date(record.clickTime).getTime()) / 1000 : 0;
      
      return this.estimateCompletion(
        timeSpent,
        record.videoDuration || 60, // 默认60秒
        record.platform,
        record.userHistory?.[0] // 取第一个历史记录
      );
    });
  }

  /**
   * 根据视频时长确定视频类型
   */
  private getVideoType(duration: number): 'short' | 'medium' | 'long' {
    if (duration <= VideoCompletionEstimator.TIME_THRESHOLDS.SHORT_VIDEO) {
      return 'short';
    } else if (duration <= VideoCompletionEstimator.TIME_THRESHOLDS.MEDIUM_VIDEO) {
      return 'medium';
    } else {
      return 'long';
    }
  }

  /**
   * 基于时间比例计算完播率
   */
  private calculateTimeBasedRate(timeRatio: number, videoType: 'short' | 'medium' | 'long'): number {
    // 不同类型视频的时间-完播率曲线不同
    switch (videoType) {
      case 'short':
        // 短视频：线性关系更强
        return Math.min(timeRatio * 0.9, 1.0);
      
      case 'medium':
        // 中等视频：S型曲线
        if (timeRatio < 0.3) return timeRatio * 0.5;
        if (timeRatio < 0.7) return 0.15 + (timeRatio - 0.3) * 1.5;
        return 0.75 + (timeRatio - 0.7) * 0.8;
      
      case 'long':
        // 长视频：对数曲线
        return Math.min(Math.log(timeRatio + 1) / Math.log(2), 1.0);
      
      default:
        return timeRatio * 0.8;
    }
  }

  /**
   * 计算用户行为评分
   */
  private calculateUserBehaviorScore(history: UserWatchHistory, platform: string): number {
    if (!history.recentVideos || history.recentVideos.length === 0) {
      return 0.5; // 默认中等评分
    }

    const platformVideos = history.recentVideos.filter(v => v.platform === platform);
    if (platformVideos.length === 0) {
      return 0.5;
    }

    // 计算平均完播率
    const avgCompletionRate = platformVideos.reduce((sum, video) => {
      return sum + (video.completionRate || 0);
    }, 0) / platformVideos.length;

    // 计算观看频率评分
    const frequencyScore = Math.min(platformVideos.length / 10, 1.0);

    // 计算最近活跃度
    const now = Date.now();
    const recentActivity = platformVideos.filter(v => {
      const videoTime = new Date(v.watchTime).getTime();
      return (now - videoTime) < 7 * 24 * 60 * 60 * 1000; // 7天内
    }).length;
    const activityScore = Math.min(recentActivity / 5, 1.0);

    // 综合评分
    return (avgCompletionRate * 0.5 + frequencyScore * 0.3 + activityScore * 0.2);
  }

  /**
   * 综合多个因素计算最终完播率
   */
  private combineEstimates(
    timeBasedRate: number,
    basePlatformRate: number,
    userBehaviorScore: number,
    timeRatio: number
  ): number {
    // 权重分配
    const timeWeight = Math.min(timeRatio, 1.0) * 0.6;      // 时间因素权重最高
    const platformWeight = 0.25;                            // 平台基础权重
    const userWeight = 0.15;                                // 用户行为权重

    // 加权平均
    const weightedRate = (
      timeBasedRate * timeWeight +
      basePlatformRate * platformWeight +
      (userBehaviorScore * basePlatformRate) * userWeight
    );

    // 应用调整因子
    let adjustmentFactor = 1.0;
    
    // 如果停留时间很短，降低预估
    if (timeRatio < 0.1) {
      adjustmentFactor *= 0.5;
    }
    
    // 如果停留时间超过视频时长很多，可能是多次观看或暂停
    if (timeRatio > 1.5) {
      adjustmentFactor *= 1.2;
    }

    return Math.max(0, Math.min(weightedRate * adjustmentFactor, 1.0));
  }

  /**
   * 计算预估置信度
   */
  private calculateConfidence(
    timeSpent: number,
    videoDuration: number,
    userHistory?: UserWatchHistory
  ): number {
    let confidence = VideoCompletionEstimator.TIME_THRESHOLDS.MIN_CONFIDENCE;

    // 基于停留时间的置信度
    const timeRatio = timeSpent / videoDuration;
    if (timeRatio >= 0.8) {
      confidence += 0.4; // 观看时间充足
    } else if (timeRatio >= 0.5) {
      confidence += 0.3;
    } else if (timeRatio >= 0.2) {
      confidence += 0.2;
    }

    // 基于用户历史的置信度
    if (userHistory && userHistory.recentVideos && userHistory.recentVideos.length > 0) {
      const historyCount = userHistory.recentVideos.length;
      if (historyCount >= 10) {
        confidence += 0.2; // 充足的历史数据
      } else if (historyCount >= 5) {
        confidence += 0.1;
      }
    }

    // 基于视频时长的置信度调整
    if (videoDuration > 0) {
      if (videoDuration <= 60) {
        confidence += 0.1; // 短视频预估更准确
      } else if (videoDuration > 600) {
        confidence -= 0.1; // 长视频预估难度更大
      }
    }

    return Math.max(
      VideoCompletionEstimator.TIME_THRESHOLDS.MIN_CONFIDENCE,
      Math.min(confidence, VideoCompletionEstimator.TIME_THRESHOLDS.MAX_CONFIDENCE)
    );
  }

  /**
   * 获取平台基础完播率
   */
  static getPlatformBaseRates(): PlatformCompletionRates {
    return { ...VideoCompletionEstimator.PLATFORM_BASE_RATES };
  }

  /**
   * 更新平台基础完播率（用于机器学习优化）
   */
  static updatePlatformRates(platform: string, videoType: 'short' | 'medium' | 'long', rate: number): void {
    if (VideoCompletionEstimator.PLATFORM_BASE_RATES[platform as keyof PlatformCompletionRates]) {
      VideoCompletionEstimator.PLATFORM_BASE_RATES[platform as keyof PlatformCompletionRates][videoType] = rate;
    }
  }
}

// 导出单例实例
export const completionEstimator = new VideoCompletionEstimator();