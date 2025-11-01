// API配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD 
      ? '' // 生产环境使用相对路径，自动使用当前域名
      : 'http://localhost:3002'
  ),
  ENDPOINTS: {
    VIDEOS: '/api/videos',
    BLOGS: '/api/blogs',
    CATEGORIES: '/api/categories',
    COMMENTS: '/api/comments',
    USERS: '/api/users',
    ANALYTICS: '/api/analytics',
    SYSTEM_CONFIG: '/api/system-config',
    ACTIVITY_LOGS: '/api/activity-logs'
  }
};

// 构建完整的API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// 常用的API URL
export const API_URLS = {
  // 分析相关
  ANALYTICS_BATCH: buildApiUrl('/api/analytics/batch'),
  ANALYTICS_DASHBOARD: buildApiUrl('/api/analytics/dashboard'),
  ANALYTICS_PAGEVIEWS: buildApiUrl('/api/analytics/page-views'),
  ANALYTICS_VIDEOS: buildApiUrl('/api/analytics/videos'),
  ANALYTICS_COMMENTS: buildApiUrl('/api/analytics/comments'),
  ANALYTICS_EXTERNAL_VIDEOS: buildApiUrl('/api/analytics/external-video-tracking'),
  
  // 内容相关
  VIDEOS: buildApiUrl('/api/videos'),
  BLOGS: buildApiUrl('/api/blogs'),
  CATEGORIES: buildApiUrl('/api/categories'),
  COMMENTS: buildApiUrl('/api/comments'),
  
  // 用户和系统
  USERS: buildApiUrl('/api/users'),
  SYSTEM_CONFIG: buildApiUrl('/api/system-config'),
  ACTIVITY_LOGS: buildApiUrl('/api/activity-logs')
};