// 统计数据类型定义
export interface PageViewRecord {
  id: string;
  pageUrl: string;
  pageTitle: string;
  referrer?: string;
  sessionId: string;
  timestamp: string;
  userAgent?: string;
}

export interface VideoPlayRecord {
  id: string;
  videoId: string;
  videoTitle: string;
  playPosition: number;
  sessionId: string;
  timestamp: string;
  duration?: number;
}

export interface CommentRecord {
  id: string;
  contentId: string;
  contentType: 'blog' | 'video';
  commentLength: number;
  sessionId: string;
  timestamp: string;
}

export interface SessionRecord {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  firstVisit: string;
  lastActivity: string;
  pageViews: number;
}

// 统计数据结构
export interface PageViewStats {
  totalViews: number;
  uniqueVisitors: number;
  averageTimeOnPage: number;
  bounceRate: number;
  topPages: Array<{
    url: string;
    title: string;
    views: number;
    uniqueVisitors: number;
  }>;
}

export interface VideoStats {
  totalPlays: number;
  uniqueViewers: number;
  averageWatchTime: number;
  completionRate: number;
  topVideos: Array<{
    id: string;
    title: string;
    plays: number;
    completionRate: number;
  }>;
}

export interface CommentStats {
  totalComments: number;
  averageCommentsPerContent: number;
  engagementRate: number;
  activeCommenters: number;
  commentTrends: Array<{
    date: string;
    count: number;
  }>;
}

export interface AnalyticsOverview {
  totalPageViews: number;
  totalComments: number;
  totalVideoPlays: number;
  activeUsers: number;
  trends: {
    pageViews: number[];
    comments: number[];
    videoPlays: number[];
  };
}

// API请求/响应类型
export interface AnalyticsEvent {
  type: 'pageview' | 'videoplay' | 'comment';
  data: PageViewRecord | VideoPlayRecord | CommentRecord;
}

export interface BatchAnalyticsRequest {
  events: AnalyticsEvent[];
}

export interface AnalyticsQueryParams {
  timeRange?: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportRequest {
  dataTypes: string[];
  startDate: string;
  endDate: string;
  format: 'csv' | 'excel';
}