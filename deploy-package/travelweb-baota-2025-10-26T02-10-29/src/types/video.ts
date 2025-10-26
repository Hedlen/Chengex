// 视频平台类型
export type VideoPlatform = 'youtube' | 'tiktok' | 'bilibili' | 'local';

// 视频分类
export type VideoCategory = 
  | '美食' 
  | '景点' 
  | '文化' 
  | '购物' 
  | '交通' 
  | '住宿' 
  | '娱乐' 
  | '历史' 
  | '自然' 
  | '节庆';

// 视频时长类型
export type VideoDuration = 'short' | 'medium' | 'long';

// 观看数量级别
export type VideoViews = 'low' | 'medium' | 'high';

// 发布时间范围
export type VideoPublishTime = 'today' | 'week' | 'month' | 'year';

// 排序方式
export type VideoSortBy = 'newest' | 'popular' | 'views' | 'likes' | 'duration';

// 视频标签
export interface VideoTag {
  id: string;
  name: string;
  color?: string;
}

// 视频统计信息
export interface VideoStats {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

// 视频创作者信息
export interface VideoCreator {
  id: string;
  name: string;
  avatar?: string;
  verified?: boolean;
  subscriberCount?: number;
}

// 视频基本信息
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number; // 秒
  platform: VideoPlatform;
  category: VideoCategory[];
  tags: VideoTag[];
  creator: VideoCreator;
  stats: VideoStats;
  publishedAt: string; // ISO 8601 格式
  updatedAt: string;
  featured?: boolean;
  location?: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  language?: string;
  quality?: '720p' | '1080p' | '4K';
  subtitles?: boolean;
}

// 用户交互信息
export interface UserInteraction {
  videoId: string;
  liked: boolean;
  bookmarked: boolean;
  watchProgress: number; // 0-100 百分比
  lastWatched?: string; // ISO 8601 格式
  rating?: number; // 1-5 星级
}

// 视频筛选条件
export interface VideoFilters {
  platform?: VideoPlatform;
  category?: VideoCategory;
  search?: string;
  tags?: string[];
  duration?: VideoDuration;
  views?: VideoViews;
  publishTime?: VideoPublishTime;
  sort?: VideoSortBy;
  featured?: boolean;
  hasSubtitles?: boolean;
  quality?: string[];
  creator?: string;
}

// 视频播放列表
export interface VideoPlaylist {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  thumbnail?: string;
}

// 视频搜索结果
export interface VideoSearchResult {
  videos: Video[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 视频推荐配置
export interface VideoRecommendationConfig {
  basedOnHistory: boolean;
  basedOnLikes: boolean;
  basedOnCategory: boolean;
  basedOnLocation: boolean;
  maxResults: number;
}

// 视频上传信息
export interface VideoUpload {
  file: File;
  title: string;
  description: string;
  category: VideoCategory[];
  tags: VideoTag[];
  thumbnail?: File;
  isPublic: boolean;
  location?: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

// 视频分析数据
export interface VideoAnalytics {
  videoId: string;
  totalViews: number;
  uniqueViews: number;
  averageWatchTime: number;
  completionRate: number;
  likeRate: number;
  shareRate: number;
  commentRate: number;
  viewsByDate: Array<{
    date: string;
    views: number;
  }>;
  viewsByLocation: Array<{
    location: string;
    views: number;
  }>;
  viewsByDevice: Array<{
    device: string;
    views: number;
  }>;
}

// 视频评论
export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  replies?: VideoComment[];
  parentId?: string;
}

// 视频举报
export interface VideoReport {
  id: string;
  videoId: string;
  userId: string;
  reason: string;
  description?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

// 视频收藏夹
export interface VideoCollection {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}