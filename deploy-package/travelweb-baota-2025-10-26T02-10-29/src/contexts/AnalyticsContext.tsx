import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { ExternalVideoTrackerService } from '../utils/externalVideoTracker';
import { API_URLS, buildApiUrl } from '../config/api';
import { 
  ExternalClickData, 
  ReturnEventData, 
  ExternalVideoTrackingStats,
  VideoCompletionEstimate 
} from '../types/externalVideoTracking';
import { VideoPlatform } from '../types/video';

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

// 外部视频追踪记录
export interface ExternalVideoClickRecord {
  id: string;
  videoId: string;
  videoTitle: string;
  platform: string;
  externalUrl: string;
  sessionId: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
}

export interface ExternalVideoReturnRecord {
  id: string;
  clickId: string;
  returnTime: string;
  timeSpent: number;
  sessionId: string;
  estimatedCompletion?: VideoCompletionEstimate;
}

export interface AnalyticsStats {
  totalPageViews: number;
  totalComments: number;
  totalVideoPlays: number;
  activeUsers: number;
  trends: {
    pageViews: number[];
    comments: number[];
    videoPlays: number[];
  };
  // 新增外部视频统计
  externalVideoStats?: {
    totalClicks: number;
    totalReturns: number;
    averageTimeSpent: number;
    estimatedCompletionRate: number;
    platformBreakdown: Record<string, number>;
  };
}

export interface AnalyticsContextType {
  // 数据收集方法
  trackPageView: (pageUrl: string, pageTitle: string) => void;
  trackVideoPlay: (videoId: string, videoTitle: string, playPosition?: number) => void;
  trackComment: (contentId: string, contentType: 'blog' | 'video', commentLength: number) => void;
  
  // 外部视频追踪方法
  trackExternalVideoClick: (videoId: string, videoTitle: string, platform: string, externalUrl: string) => Promise<string>;
  trackExternalVideoReturn: (clickId: string) => void;
  getExternalVideoStats: (timeRange?: string) => Promise<ExternalVideoTrackingStats>;
  
  // 数据查询方法
  getAnalyticsStats: (timeRange?: string) => Promise<AnalyticsStats>;
  getPageViewStats: (timeRange?: string) => Promise<any>;
  getVideoStats: (timeRange?: string) => Promise<any>;
  getCommentStats: (timeRange?: string) => Promise<any>;
  
  // 状态
  isLoading: boolean;
  error: string | null;
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const eventQueue = useRef<Array<any>>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 外部视频追踪服务实例
  const externalVideoTracker = useRef<ExternalVideoTrackerService | null>(null);

  // 初始化外部视频追踪服务
  useEffect(() => {
    externalVideoTracker.current = new ExternalVideoTrackerService({
      apiEndpoint: '/api/analytics/external-video-tracking',
      enableLocalStorage: true,
      debounceTime: 1000
    });
  }, []);

  // 生成唯一ID
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 生成会话ID
  function generateSessionId(): string {
    const stored = localStorage.getItem('analytics_session_id');
    if (stored) {
      const session = JSON.parse(stored);
      // 检查会话是否过期（24小时）
      if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
        return session.id;
      }
    }
    
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics_session_id', JSON.stringify({
      id: newSessionId,
      timestamp: Date.now()
    }));
    return newSessionId;
  }

  // 批量发送数据到后端
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      setIsLoading(true);
      const response = await fetch(API_URLS.ANALYTICS_BATCH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to send analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to send analytics data');
      // 发送失败时重新加入队列
      eventQueue.current.unshift(...events);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 防抖的批量发送
  const debouncedFlush = useCallback(
    debounce(flushEvents, 2000, { maxWait: 10000 }),
    [flushEvents]
  );

  // 添加事件到队列
  const addToQueue = useCallback((event: any) => {
    eventQueue.current.push(event);
    console.log('📈 Event added to queue:', event.type, 'Queue size:', eventQueue.current.length);
    debouncedFlush();
  }, [debouncedFlush]);

  // 页面浏览追踪
  const trackPageView = useCallback((pageUrl: string, pageTitle: string) => {
    const record: PageViewRecord = {
      id: generateId(),
      pageUrl,
      pageTitle,
      referrer: document.referrer,
      sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    console.log('📊 Tracking page view:', { pageUrl, pageTitle });
    addToQueue({ type: 'pageview', data: record });
  }, [sessionId, generateId, addToQueue]);

  // 视频播放追踪
  const trackVideoPlay = useCallback((videoId: string, videoTitle: string, playPosition: number = 0) => {
    const record: VideoPlayRecord = {
      id: generateId(),
      videoId,
      videoTitle,
      playPosition,
      sessionId,
      timestamp: new Date().toISOString(),
    };

    console.log('🎥 Tracking video play:', { videoId, videoTitle, playPosition });
    addToQueue({ type: 'videoplay', data: record });
  }, [sessionId, generateId, addToQueue]);

  // 评论追踪
  const trackComment = useCallback((contentId: string, contentType: 'blog' | 'video', commentLength: number) => {
    const record: CommentRecord = {
      id: generateId(),
      contentId,
      contentType,
      commentLength,
      sessionId,
      timestamp: new Date().toISOString(),
    };

    addToQueue({ type: 'comment', data: record });
  }, [sessionId, generateId, addToQueue]);

  // 外部视频点击追踪
  const trackExternalVideoClick = useCallback(async (
    videoId: string, 
    videoTitle: string, 
    platform: string, 
    externalUrl: string
  ): Promise<string> => {
    if (!externalVideoTracker.current) {
      throw new Error('External video tracker not initialized');
    }

    const clickData: ExternalClickData = {
      id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoId,
      platform: platform as VideoPlatform,
      clickTime: new Date(),
      sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    console.log('🔗 Tracking external video click:', { videoId, platform, externalUrl });
    
    try {
      const clickId = await externalVideoTracker.current.trackClick(clickData);
      
      // 同时添加到常规事件队列
      const record: ExternalVideoClickRecord = {
        id: clickId,
        videoId,
        videoTitle,
        platform,
        externalUrl,
        sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };
      
      addToQueue({ type: 'external_video_click', data: record });
      return clickId;
    } catch (err) {
      console.error('Failed to track external video click:', err);
      throw err;
    }
  }, [sessionId, addToQueue]);

  // 外部视频返回追踪
  const trackExternalVideoReturn = useCallback((clickId: string) => {
    if (!externalVideoTracker.current) {
      console.warn('External video tracker not initialized');
      return;
    }

    console.log('↩️ Tracking external video return:', { clickId });
    
    try {
      externalVideoTracker.current.trackReturn(clickId);
      
      // 添加返回事件到队列
      const record: ExternalVideoReturnRecord = {
        id: generateId(),
        clickId,
        returnTime: new Date().toISOString(),
        timeSpent: 0, // 将由服务计算
        sessionId
      };
      
      addToQueue({ type: 'external_video_return', data: record });
    } catch (err) {
      console.error('Failed to track external video return:', err);
    }
  }, [sessionId, generateId, addToQueue]);

  // 获取外部视频统计
  const getExternalVideoStats = useCallback(async (timeRange: string = '7d'): Promise<ExternalVideoTrackingStats> => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URLS.ANALYTICS_EXTERNAL_VIDEOS}?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setError(null);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch external video stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取统计数据（扩展以包含外部视频统计）
  const getAnalyticsStats = useCallback(async (timeRange: string = '7d'): Promise<AnalyticsStats> => {
    try {
      setIsLoading(true);
      const [basicStats, externalVideoStats] = await Promise.all([
        fetch(`${API_URLS.ANALYTICS_DASHBOARD}?timeRange=${timeRange}`).then(res => res.json()),
        getExternalVideoStats(timeRange).catch(() => null) // 外部视频统计失败不影响基础统计
      ]);
      
      setError(null);
      return {
        ...basicStats,
        externalVideoStats: externalVideoStats ? {
          totalClicks: externalVideoStats.totalClicks,
          totalReturns: externalVideoStats.totalReturns,
          averageTimeSpent: externalVideoStats.averageTimeSpent,
          estimatedCompletionRate: externalVideoStats.averageCompletionRate,
          platformBreakdown: externalVideoStats.platformBreakdown
        } : undefined
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getExternalVideoStats]);

  // 获取页面浏览统计
  const getPageViewStats = useCallback(async (timeRange: string = '7d') => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URLS.ANALYTICS_PAGEVIEWS}?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setError(null);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch page view stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取视频统计
  const getVideoStats = useCallback(async (timeRange: string = '7d') => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URLS.ANALYTICS_VIDEOS}?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setError(null);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch video stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取评论统计
  const getCommentStats = useCallback(async (timeRange: string = '7d') => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URLS.ANALYTICS_COMMENTS}?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setError(null);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comment stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 页面卸载时发送剩余数据
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventQueue.current.length > 0) {
        // 使用 sendBeacon API 确保数据发送
        const events = [...eventQueue.current];
        const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/batch', blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  // 定期发送数据
  useEffect(() => {
    const interval = setInterval(() => {
      if (eventQueue.current.length > 0) {
        flushEvents();
      }
    }, 30000); // 每30秒发送一次

    return () => clearInterval(interval);
  }, [flushEvents]);

  // 页面可见性变化时处理外部视频返回检测
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && externalVideoTracker.current) {
        // 页面重新可见时，检测可能的外部视频返回
        externalVideoTracker.current.handlePageVisible();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const value: AnalyticsContextType = {
    trackPageView,
    trackVideoPlay,
    trackComment,
    trackExternalVideoClick,
    trackExternalVideoReturn,
    getAnalyticsStats,
    getPageViewStats,
    getVideoStats,
    getCommentStats,
    getExternalVideoStats,
    isLoading,
    error,
    sessionId,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsContext;