import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/contexts/AnalyticsContext';

/**
 * 页面追踪Hook
 * 自动追踪页面浏览量，带防重复机制
 */
export const usePageTracking = (pageTitle?: string) => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();
  const sessionKey = 'page_views_session';
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname;
    
    // 获取当前会话已访问的页面
    const visitedPages = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
    
    // 生成页面唯一标识（路径 + 时间戳的10分钟间隔，减少重复追踪但允许合理的重新访问）
    const currentTime = new Date();
    const tenMinuteInterval = Math.floor(currentTime.getMinutes() / 10);
    const pageKey = `${currentPath}_${currentTime.getHours()}_${tenMinuteInterval}`;
    
    // 如果这个页面在当前10分钟间隔内已经访问过，不重复计算
    if (visitedPages[pageKey]) {
      return;
    }

    // 获取页面标题
    const title = pageTitle || document.title || '未知页面';
    
    // 追踪页面浏览
    trackPageView(currentPath, title);
    
    // 记录已访问的页面
    visitedPages[pageKey] = {
      timestamp: Date.now(),
      title: title
    };
    
    // 清理超过24小时的记录
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    Object.keys(visitedPages).forEach(key => {
      if (visitedPages[key].timestamp < oneDayAgo) {
        delete visitedPages[key];
      }
    });
    
    sessionStorage.setItem(sessionKey, JSON.stringify(visitedPages));
  }, [location.pathname, pageTitle, trackPageView]);
};

export default usePageTracking;