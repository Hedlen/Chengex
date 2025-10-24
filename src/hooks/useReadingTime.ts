import { useEffect, useRef, useState } from 'react';
import { realTimeAnalytics } from '../services/realTimeAnalytics';

interface ReadingTimeData {
  startTime: number;
  totalTime: number;
  scrollDepth: number;
  isActive: boolean;
  lastActiveTime: number;
}

interface UseReadingTimeOptions {
  contentSelector?: string;
  minReadingTime?: number; // 最小阅读时间（秒）
  maxIdleTime?: number; // 最大空闲时间（毫秒）
  scrollThreshold?: number; // 滚动阈值百分比
}

/**
 * 阅读时间追踪Hook
 * 计算用户实际阅读时间，考虑页面可见性、滚动深度和用户活跃度
 */
export const useReadingTime = (
  blogId: string,
  options: UseReadingTimeOptions = {}
) => {
  const {
    contentSelector = '.prose, .article-content, .blog-content',
    minReadingTime = 10, // 最少10秒才算有效阅读
    maxIdleTime = 30000, // 30秒无活动视为离开
    scrollThreshold = 25 // 滚动超过25%才算开始阅读
  } = options;

  const [readingData, setReadingData] = useState<ReadingTimeData>({
    startTime: Date.now(),
    totalTime: 0,
    scrollDepth: 0,
    isActive: true,
    lastActiveTime: Date.now()
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const isTrackingRef = useRef(false);
  const contentLengthRef = useRef(0);

  // 计算预估阅读时间（基于内容长度）
  const calculateEstimatedReadingTime = (content: string): number => {
    const wordsPerMinute = 200; // 中文阅读速度约200字/分钟
    const wordCount = content.length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  // 获取内容长度
  const getContentLength = (): number => {
    const contentElement = document.querySelector(contentSelector);
    if (contentElement) {
      return contentElement.textContent?.length || 0;
    }
    return 0;
  };

  // 计算滚动深度
  const calculateScrollDepth = (): number => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const scrollableHeight = documentHeight - windowHeight;
    if (scrollableHeight <= 0) return 100;
    
    return Math.min(100, (scrollTop / scrollableHeight) * 100);
  };

  // 检查用户是否活跃
  const checkUserActivity = (): boolean => {
    const now = Date.now();
    return now - readingData.lastActiveTime < maxIdleTime;
  };

  // 更新活跃时间
  const updateActivity = () => {
    setReadingData(prev => ({
      ...prev,
      lastActiveTime: Date.now(),
      isActive: true
    }));
  };

  // 处理页面可见性变化
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setReadingData(prev => ({ ...prev, isActive: false }));
    } else {
      updateActivity();
    }
  };

  // 处理滚动事件
  const handleScroll = () => {
    const scrollDepth = calculateScrollDepth();
    setReadingData(prev => ({
      ...prev,
      scrollDepth: Math.max(prev.scrollDepth, scrollDepth)
    }));
    updateActivity();

    // 开始追踪（用户滚动超过阈值）
    if (!isTrackingRef.current && scrollDepth > scrollThreshold) {
      isTrackingRef.current = true;
      console.log(`📖 Started reading tracking for blog ${blogId}`);
    }
  };

  // 处理用户交互事件
  const handleUserInteraction = () => {
    updateActivity();
  };

  // 更新阅读时间
  const updateReadingTime = () => {
    if (!isTrackingRef.current) return;

    setReadingData(prev => {
      const now = Date.now();
      const isCurrentlyActive = checkUserActivity() && !document.hidden;
      
      if (isCurrentlyActive && prev.isActive) {
        return {
          ...prev,
          totalTime: prev.totalTime + 1000, // 每秒增加1000ms
          isActive: true
        };
      } else {
        return {
          ...prev,
          isActive: false
        };
      }
    });
  };

  // 获取阅读统计数据
  const getReadingStats = () => {
    const estimatedTime = calculateEstimatedReadingTime(
      document.querySelector(contentSelector)?.textContent || ''
    );
    
    const actualReadingTime = Math.floor(readingData.totalTime / 1000);
    const readingProgress = Math.min(100, (actualReadingTime / (estimatedTime * 60)) * 100);
    
    return {
      actualReadingTime, // 实际阅读时间（秒）
      estimatedReadingTime: estimatedTime, // 预估阅读时间（分钟）
      scrollDepth: readingData.scrollDepth, // 滚动深度百分比
      readingProgress, // 阅读进度百分比
      isValidReading: actualReadingTime >= minReadingTime && readingData.scrollDepth > scrollThreshold,
      contentLength: contentLengthRef.current
    };
  };

  // 发送阅读数据到服务器
  const sendReadingData = async () => {
    const stats = getReadingStats();
    
    if (!stats.isValidReading) {
      console.log(`📖 Reading time too short for blog ${blogId}, not sending data`);
      return;
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}/reading-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readingTime: stats.actualReadingTime,
          scrollDepth: stats.scrollDepth,
          readingProgress: stats.readingProgress,
          contentLength: stats.contentLength,
          sessionId: sessionStorage.getItem('sessionId') || 'anonymous',
          timestamp: Date.now()
        }),
      });

      if (response.ok) {
        console.log(`📖 Reading data sent for blog ${blogId}:`, stats);
        
        // 通知实时分析服务
        realTimeAnalytics.notifyReadingTimeUpdate(blogId, stats);
      }
    } catch (error) {
      console.error('Failed to send reading data:', error);
    }
  };

  useEffect(() => {
    // 获取内容长度
    contentLengthRef.current = getContentLength();

    // 设置事件监听器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousemove', handleUserInteraction, { passive: true });
    document.addEventListener('keydown', handleUserInteraction, { passive: true });
    document.addEventListener('click', handleUserInteraction, { passive: true });

    // 设置定时器更新阅读时间
    intervalRef.current = setInterval(updateReadingTime, 1000);

    // 页面卸载时发送数据
    const handleBeforeUnload = () => {
      sendReadingData();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // 清理事件监听器
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // 清理定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // 发送最终数据
      sendReadingData();
    };
  }, [blogId]);

  return {
    readingData,
    getReadingStats,
    sendReadingData,
    isTracking: isTrackingRef.current
  };
};

export default useReadingTime;