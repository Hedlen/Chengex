// 外部视频追踪相关类型定义

import { VideoPlatform } from './video';

// 外部视频追踪器接口
export interface ExternalVideoTracker {
  videoId: string;
  platform: VideoPlatform;
  clickTime: Date;
  userAgent: string;
  referrer: string;
  sessionId: string;
  userId?: string;
}

// 返回检测数据接口
export interface ReturnDetection {
  videoId: string;
  returnTime: Date;
  timeSpentExternal: number; // 毫秒
  estimatedWatchPercentage: number;
  sessionId: string;
  userId?: string;
}

// 用户观看历史接口
export interface UserWatchHistory {
  videoId: string;
  platform: VideoPlatform;
  completionRate: number; // 0-1
  watchTime: number; // 秒
  timestamp: Date;
  recentVideos?: Array<{
    videoId: string;
    platform: VideoPlatform;
    completionRate: number;
    watchTime: number;
    timestamp: Date;
  }>; // 最近观看的视频
}

// 完播率预估器接口
export interface CompletionEstimator {
  estimateCompletion(
    timeSpent: number,
    videoDuration: number,
    platform: string,
    userHistory?: UserWatchHistory
  ): VideoCompletionEstimate;
}

// 外部点击数据
export interface ExternalClickData {
  id: string;
  videoId: string;
  platform: VideoPlatform;
  clickTime: Date;
  userAgent: string;
  referrer: string;
  sessionId: string;
  userId?: string;
}

// 返回事件数据
export interface ReturnEventData {
  id: string;
  videoId: string;
  returnTime: Date;
  timeSpentExternal: number;
  estimatedWatchPercentage: number;
  sessionId: string;
  userId?: string;
}

// 增强的视频分析数据
export interface EnhancedVideoAnalytics {
  // 基础数据
  videoId: string;
  platform: VideoPlatform;
  
  // 交互数据
  clickCount: number;
  shareCount: number;
  likeCount: number;
  bookmarkCount: number;
  
  // 跳转数据
  externalClicks: ExternalClickData[];
  returnEvents: ReturnEventData[];
  
  // 预估数据
  estimatedViews: number;
  estimatedCompletions: number;
  estimatedWatchTime: number;
  confidenceScore: number; // 预估置信度 0-1
}

// 用户行为事件
export interface UserEvent {
  type: 'video_click' | 'external_redirect' | 'return' | 'page_leave';
  timestamp: Date;
  videoId?: string;
  platform?: VideoPlatform;
  metadata: Record<string, any>;
}

// 用户行为路径
export interface UserJourney {
  sessionId: string;
  userId?: string;
  events: UserEvent[];
  totalWatchTime: number;
  videosClicked: string[];
  externalPlatformTime: number;
}

// 外部视频统计记录
export interface ExternalVideoTrackingRecord {
  id: string;
  videoId: string;
  platform: VideoPlatform;
  userSession: string;
  clickTime: Date;
  returnTime?: Date;
  timeSpentExternal?: number; // 毫秒
  estimatedCompletionRate?: number;
  userAgent: string;
  referrer: string;
  createdAt: Date;
  videoDuration?: number; // 视频时长（秒）
  userHistory?: UserWatchHistory[]; // 用户观看历史
}

// 视频完播预估记录
export interface VideoCompletionEstimate {
  id: string;
  videoId: string;
  platform: VideoPlatform;
  date: Date;
  totalClicks: number;
  estimatedViews: number;
  estimatedCompletions: number;
  estimatedCompletionRate: number; // 预估完播率
  confidence: number; // 预估置信度
  confidenceScore: number; // 预估置信度
  method?: string;
  factors?: any;
  updatedAt: Date;
}

// 平台完播率配置
export interface PlatformCompletionRates {
  youtube: {
    short: number;
    medium: number;
    long: number;
  };
  tiktok: {
    short: number;
    medium: number;
    long: number;
  };
  other: {
    short: number;
    medium: number;
    long: number;
  };
}

// 外部视频追踪配置
export interface ExternalVideoTrackingConfig {
  enabled: boolean;
  platformAverages: PlatformCompletionRates;
  minTimeThreshold: number; // 最小时间阈值（毫秒）
  maxTimeThreshold: number; // 最大时间阈值（毫秒）
  apiEndpoint?: string;
  enableLocalStorage?: boolean;
  debounceTime?: number;
  confidenceFactors: {
    timeWeight: number;
    platformWeight: number;
    userHistoryWeight: number;
  };
}

// 外部视频追踪统计
export interface ExternalVideoTrackingStats {
  totalExternalClicks: number;
  totalReturnEvents: number;
  averageTimeSpent: number;
  estimatedCompletionRate: number;
  confidenceScore: number;
  platformBreakdown: Record<VideoPlatform, {
    clicks: number;
    returns: number;
    avgTimeSpent: number;
    estimatedCompletionRate: number;
  }>;
}