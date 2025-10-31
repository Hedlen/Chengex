// API配置文件
export const API_CONFIG = {
  // 生产环境API基础URL - 管理后台独立部署时指向主网站API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002',
  
  // API端点
  ENDPOINTS: {
    // 认证相关
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    
    // 活动日志
    ACTIVITY_LOGS: '/api/activity-logs',
    
    // 视频相关
    VIDEOS: '/api/videos',
    VIDEOS_SYNC: '/api/videos/sync',
    
    // 博客相关
    BLOGS: '/api/blogs',
    
    // 分析相关
    ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
    ANALYTICS_COMMENTS: '/api/analytics/comments',
    ANALYTICS_VIDEOS: '/api/analytics/videos',
    ANALYTICS_BLOGS: '/api/analytics/blogs',
    ANALYTICS_PAGE_VIEWS: '/api/analytics/page-views',
    ANALYTICS_PAGE_VIEWS_HOURLY: '/api/analytics/page-views/hourly',
    ANALYTICS_PAGE_VIEWS_DAILY: '/api/analytics/page-views/daily',
    ANALYTICS_PAGE_VIEWS_REFERRERS: '/api/analytics/page-views/referrers',
    ANALYTICS_EXTERNAL_VIDEOS: '/api/analytics/external-videos',
    ANALYTICS_EXTERNAL_VIDEOS_COMPLETION: '/api/analytics/external-videos/completion-estimates',
    
    // 数据库相关
    DATABASE_INFO: '/api/database/info',
    
    // 系统配置
    SYSTEM_CONFIG: '/api/system/config',
    
    // 用户管理
    USERS: '/api/users',
    
    // 分类管理
    CATEGORIES: '/api/categories'
  }
};

/**
 * 构建完整的API URL
 * @param endpoint API端点
 * @param params 查询参数
 * @returns 完整的API URL
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  let url = `${baseUrl}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

/**
 * 获取API请求的默认配置
 * @param options 额外的请求选项
 * @returns 请求配置
 */
export const getApiConfig = (options: RequestInit = {}): RequestInit => {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
};

/**
 * 发送API请求的通用方法
 * @param endpoint API端点
 * @param options 请求选项
 * @returns Promise<Response>
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const config = getApiConfig(options);
  
  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};

/**
 * 发送GET请求
 * @param endpoint API端点
 * @param params 查询参数
 * @returns Promise<any>
 */
export const apiGet = async (endpoint: string, params?: Record<string, string>): Promise<any> => {
  const url = buildApiUrl(endpoint, params);
  const response = await fetch(url, getApiConfig());
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }
  
  return response.json();
};

/**
 * 发送POST请求
 * @param endpoint API端点
 * @param data 请求数据
 * @returns Promise<any>
 */
export const apiPost = async (endpoint: string, data?: any): Promise<any> => {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, getApiConfig({
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }));
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }
  
  return response.json();
};

/**
 * 发送PUT请求
 * @param endpoint API端点
 * @param data 请求数据
 * @returns Promise<any>
 */
export const apiPut = async (endpoint: string, data?: any): Promise<any> => {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, getApiConfig({
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }));
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }
  
  return response.json();
};

/**
 * 发送DELETE请求
 * @param endpoint API端点
 * @returns Promise<any>
 */
export const apiDelete = async (endpoint: string): Promise<any> => {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, getApiConfig({
    method: 'DELETE',
  }));
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }
  
  return response.json();
};