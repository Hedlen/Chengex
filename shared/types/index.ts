// 共享类型定义

// 基础类型定义
export type ContentStatus = 'draft' | 'published' | 'archived';
export type UserRole = 'admin' | 'editor' | 'viewer';
export type VideoPlatform = 'youtube' | 'tiktok' | 'bilibili' | 'local';

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  platform: VideoPlatform;
  status: ContentStatus;
  thumbnail?: string;
  duration?: string | number;
  tags: string[];
  category: string;
  viewCount: number;
  views?: number;
  likes?: number;
  shares?: number;
  quality?: string;
  language?: string;
  location?: string;
  season?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  // 英文字段
  title_en?: string;
  content_en?: string;
  excerpt_en?: string;
  status: ContentStatus;
  thumbnail?: string;
  featuredImage?: string;
  tags: string[];
  tags_en?: string[];
  category: string;
  category_id?: string | number; // 添加category_id字段
  author: string;
  readTime?: number;
  viewCount?: number;
  views?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  // 英文字段
  name_en?: string;
  description_en?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  youtubeApiKey?: string;
  tiktokApiKey?: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  enableRegistration: boolean;
  maintenanceMode: boolean;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  type?: string;
  description?: string;
  resource?: string;
  resourceId?: string;
  details?: string | object;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalVideos: number;
  publishedVideos: number;
  draftVideos: number;
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalUsers: number;
  activeUsers: number;
  todayViews: number;
  weeklyViews: number;
  monthlyViews: number;
  // 添加与AnalyticsPage一致的指标
  totalPageViews: number;
  uniqueVisitors: number;
  totalVideoViews: number;
  totalComments: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}