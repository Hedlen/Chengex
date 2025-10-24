import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { API_URLS } from '@/config/api';
import { useDataSync } from './DataSyncContext';
import { cache, cacheKeys, cacheTTL } from '../utils/cache';
import { DataManager } from '../../shared/api/dataManager';
import i18n from '../i18n';

// 扩展的视频数据模型
export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  platform: 'youtube' | 'tiktok';
  category: string[];
  tags: string[];
  duration: number; // 秒
  views: number;
  likes: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  // 用户交互状态
  isLiked?: boolean;
  isBookmarked?: boolean;
  metadata: {
    quality: 'HD' | '4K' | 'SD';
    language: 'zh' | 'en';
    location?: string;
    season?: string;
  };
}

// 用户交互数据模型
export interface UserInteraction {
  userId: string;
  videoId: string;
  actions: {
    viewed: boolean;
    liked: boolean;
    shared: boolean;
    bookmarked: boolean;
    watchProgress: number; // 0-100
    lastWatchTime: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 视频筛选条件
export interface VideoFilters {
  platform?: 'youtube' | 'tiktok' | 'all';
  category?: string;
  tags?: string[];
  search?: string;
  sort?: 'latest' | 'popular' | 'views' | 'likes';
  duration?: 'short' | 'medium' | 'long'; // <5min, 5-15min, >15min
  views?: 'low' | 'medium' | 'high'; // <1000, 1000-10000, >10000
  publishTime?: 'today' | 'week' | 'month' | 'year'; // 今天、本周、本月、本年
}

// 分页信息
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// 同步数据模型
export interface SyncData {
  id: string;
  type: 'video' | 'blog' | 'service';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  version: number;
  checksum: string;
}

interface VideoContextType {
  // 视频数据
  videos: Video[];
  filteredVideos: Video[];
  loading: boolean;
  error: string | null;
  
  // 筛选和分页
  filters: VideoFilters;
  pagination: PaginationInfo;
  
  // 用户交互数据
  userInteractions: UserInteraction[];
  
  // 同步状态
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: string | null;
  
  // 视频操作
  fetchVideos: (filters?: VideoFilters) => Promise<void>;
  addVideo: (video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateVideo: (id: string, video: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  getVideoById: (id: string) => Video | undefined;
  
  // 用户交互操作
  likeVideo: (videoId: string) => Promise<void>;
  bookmarkVideo: (videoId: string) => Promise<void>;
  shareVideo: (videoId: string, platform?: string) => Promise<void>;
  updateWatchProgress: (videoId: string, progress: number) => Promise<void>;
  
  // 筛选和搜索
  setFilters: (filters: Partial<VideoFilters>) => void;
  searchVideos: (query: string) => Promise<void>;
  clearFilters: () => void;
  
  // 推荐功能
  getRecommendedVideos: (videoId: string, limit?: number) => Video[];
  getPopularVideos: (limit?: number) => Video[];
  
  // 数据同步
  syncData: () => Promise<void>;
  getSyncStatus: () => { status: string; lastSync: string | null };
  
  // 视频状态管理
  publishVideo: (id: string) => Promise<void>;
  archiveVideo: (id: string) => Promise<void>;
  draftVideo: (id: string) => Promise<void>;
  batchUpdateStatus: (ids: string[], status: 'draft' | 'published' | 'archived') => Promise<void>;
  getVideosByStatus: (status: 'draft' | 'published' | 'archived') => Video[];
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 获取数据同步上下文
  const dataSync = useDataSync();
  
  // 使用useTranslation钩子来正确监听语言变化
  const { t, i18n: i18nInstance } = useTranslation();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<VideoFilters>({
    platform: 'all',
    sort: 'latest'
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [userInteractions, setUserInteractions] = useState<UserInteraction[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  // 使用ref来获取最新的videos状态
  const videosRef = useRef<Video[]>([]);
  videosRef.current = videos;

  // 模拟当前用户ID
  const currentUserId = 'user-123';

  // 解析duration字符串为秒数
  const parseDuration = (duration: string | number): number => {
    if (typeof duration === 'number') return duration;
    if (!duration) return 0;
    
    // 解析 "10:34" 格式
    const parts = duration.toString().split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    
    // 如果是纯数字字符串，直接转换
    const num = parseInt(duration.toString());
    return isNaN(num) ? 0 : num;
  };

  const loadDataFromStorage = useCallback(async () => {
    try {
      setLoading(true);
      
      // 从数据库加载视频数据
      const currentLanguage = i18nInstance.language === 'en' ? 'en' : 'zh';
      console.log(`🎬 VideoContext: 加载视频数据，语言: ${currentLanguage}`);
      console.log(`🔍 VideoContext: i18nInstance.language = ${i18nInstance.language}`);
      
      const videos = await DataManager.getVideos(currentLanguage);
      console.log(`📊 VideoContext: 从API获取到 ${videos?.length || 0} 个视频`);
      
      if (videos && videos.length > 0) {
        console.log(`📝 VideoContext: 第一个视频标题: ${videos[0]?.title}`);
        
        // 转换数据格式为Video接口格式
        const videoData: Video[] = videos.map((video: any) => {
          // 根据当前语言选择正确的标签
          let tags: string[] = [];
          if (currentLanguage === 'en' && video.tags_en && Array.isArray(video.tags_en)) {
            tags = video.tags_en;
          } else if (video.tags && Array.isArray(video.tags)) {
            tags = video.tags;
          }
          
          return {
            id: video.id.toString(),
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnail: video.thumbnail,
            platform: video.platform,
            category: Array.isArray(video.category) ? video.category : [video.category || 'general'],
            tags: tags,
            duration: parseDuration(video.duration),
            views: video.views || 0,
            likes: video.likes || 0,
            shares: video.shares || 0,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
            status: video.status || 'published',
            metadata: {
              quality: video.quality || 'HD',
              language: currentLanguage,
              location: video.location,
              season: video.season
            }
          };
        });
        
        setVideos(videoData);
        console.log(`✅ VideoContext: 设置了 ${videoData.length} 个视频到状态`);
        console.log(`📝 VideoContext: 设置后第一个视频标题: ${videoData[0]?.title}`);
      } else {
        // 如果数据库中没有数据，使用默认数据
        initializeDefaultVideos();
        setLoading(false);
        return;
      }
      
      // 加载用户交互数据 (暂时保留缓存，后续可以移到数据库)
      let cachedInteractions = cache.get<UserInteraction[]>(cacheKeys.userInteractions('default'));
      if (cachedInteractions) {
        setUserInteractions(cachedInteractions);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      initializeDefaultVideos();
    }
  }, [i18nInstance.language]);

  // Load data from localStorage on mount
  useEffect(() => {
    loadDataFromStorage();
  }, [loadDataFromStorage]);

  // Reload data when language changes
  useEffect(() => {
    console.log(`🌐 VideoContext: 语言变化检测到，当前语言: ${i18nInstance.language}`);
    loadDataFromStorage();
  }, [i18nInstance.language, loadDataFromStorage]);

  // Save data to localStorage when videos or interactions change
  useEffect(() => {
    saveDataToStorage();
  }, [videos, userInteractions]);

  // Apply filters whenever videos or filters change
  useEffect(() => {
    applyFilters();
  }, [videos, filters]);

  // 设置数据同步监听器和定时刷新
  useEffect(() => {
    // 监听同步事件
    const unsubscribeSyncEvent = dataSync.onSyncEvent((event) => {
      if (event.type === 'video') {
        handleSyncEvent(event);
      }
    });

    // 监听连接状态变化
    const unsubscribeConnection = dataSync.onConnectionChange((status) => {
      if (status === 'connected') {
        // 连接成功后尝试同步数据
        syncData();
      }
    });

    // 监听同步错误
    const unsubscribeError = dataSync.onError((error) => {
      setError(`同步错误: ${error.message}`);
      setSyncStatus('error');
    });

    // 自动连接（仅在WebSocket启用时）
    if (!dataSync.isConnected && dataSync.connectionStatus !== 'disconnected') {
      dataSync.connect();
    }

    return () => {
      unsubscribeSyncEvent();
      unsubscribeConnection();
      unsubscribeError();
    };
  }, [dataSync]);

  // 处理同步事件
  const handleSyncEvent = (event: any) => {
    switch (event.action) {
      case 'create':
        if (event.data && !videos.find(v => v.id === event.data.id)) {
          setVideos(prev => [...prev, event.data]);
        }
        break;
      case 'update':
        if (event.data) {
          setVideos(prev => prev.map(video =>
            video.id === event.data.id ? { ...video, ...event.data } : video
          ));
        }
        break;
      case 'delete':
        if (event.data?.id) {
          setVideos(prev => prev.filter(video => video.id !== event.data.id));
        }
        break;
      case 'sync':
        if (event.data?.videos) {
          setVideos(event.data.videos);
        }
        break;
    }
  };

  const saveDataToStorage = () => {
    try {
      // 更新缓存 (保留缓存以提高性能)
      cache.set(cacheKeys.videos, videos, cacheTTL.long);
      cache.set(cacheKeys.userInteractions('default'), userInteractions, cacheTTL.medium);
    } catch (error) {
      console.error('Error saving data to cache:', error);
    }
  };

  const initializeDefaultVideos = () => {
    const defaultVideos: Video[] = [
      {
        id: '1',
        title: 'Big Buck Bunny (Creative Commons Demo)',
        description: 'Blender Foundation开源动画短片，采用Creative Commons Attribution许可证，适合公开演示使用。这是一个关于友善兔子的幽默故事。',
        url: 'https://www.youtube.com/watch?v=YE7VzlLtp-4',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Big%20Buck%20Bunny%20animated%20rabbit%20character%20in%20forest%20setting%20Blender%20Foundation%20open%20movie&image_size=landscape_16_9',
        platform: 'youtube',
        category: ['演示', '动画'],
        tags: ['开源', '动画', 'Creative Commons', '演示', 'Blender'],
        duration: 596,
        views: 15420,
        likes: 892,
        shares: 156,
        status: 'published',
        metadata: {
          quality: 'HD',
          language: 'en',
          location: 'Blender Foundation',
          season: '四季'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: '大熊猫基地游览指南',
        description: '成都大熊猫繁育研究基地完整游览攻略，最佳观赏时间和拍照技巧。了解大熊猫的生活习性，感受国宝的魅力。',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Giant%20pandas%20playing%20in%20bamboo%20forest%20at%20Chengdu%20research%20base%20with%20visitors%20watching&image_size=landscape_16_9',
        platform: 'youtube',
        category: ['景点介绍', '旅游攻略'],
        tags: ['成都', '大熊猫', '动物园', '攻略', '拍照'],
        duration: 360,
        views: 12350,
        likes: 567,
        shares: 89,
        status: 'published',
        metadata: {
          quality: '4K',
          language: 'zh',
          location: '成都大熊猫基地',
          season: '春夏'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: '锦里古街夜景',
        description: '锦里古街夜晚的迷人景色，传统建筑与现代灯光的完美融合。感受古蜀文化的魅力，体验成都的夜生活。',
        url: 'https://www.tiktok.com/@example/video/123456789',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Chinese%20ancient%20street%20Jinli%20at%20night%20with%20red%20lanterns%20and%20traditional%20architecture&image_size=portrait_16_9',
        platform: 'tiktok',
        category: ['景点介绍', '夜生活'],
        tags: ['成都', '锦里', '古街', '夜景', '传统文化'],
        duration: 180,
        views: 8900,
        likes: 445,
        shares: 67,
        status: 'published',
        metadata: {
          quality: 'HD',
          language: 'zh',
          location: '锦里古街',
          season: '四季'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        title: '宽窄巷子深度游',
        description: '带您深入了解成都最具特色的历史文化街区，感受老成都的韵味。探索宽巷子、窄巷子、井巷子的不同魅力。',
        url: 'https://www.youtube.com/watch?v=example4',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Chengdu%20Kuanzhai%20Alley%20traditional%20architecture%20with%20tourists%20and%20tea%20houses&image_size=landscape_16_9',
        platform: 'youtube',
        category: ['景点介绍', '文化体验'],
        tags: ['成都', '宽窄巷子', '历史', '文化', '茶馆'],
        duration: 420,
        views: 9876,
        likes: 321,
        shares: 45,
        status: 'published',
        metadata: {
          quality: 'HD',
          language: 'zh',
          location: '宽窄巷子',
          season: '四季'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        title: '四川火锅制作工艺',
        description: '探索正宗四川火锅的制作工艺和文化内涵，了解火锅底料的秘密，体验地道的成都火锅文化。',
        url: 'https://www.tiktok.com/@example/video/567890',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Sichuan%20hotpot%20cooking%20process%20with%20red%20spicy%20broth%20and%20ingredients&image_size=portrait_16_9',
        platform: 'tiktok',
        category: ['美食', '文化体验'],
        tags: ['四川', '火锅', '制作', '工艺', '文化'],
        duration: 240,
        views: 7654,
        likes: 298,
        shares: 78,
        status: 'published',
        metadata: {
          quality: 'HD',
          language: 'zh',
          location: '成都',
          season: '四季'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    
    // 设置视频状态并保存到数据库
    setVideos(defaultVideos);
    
    // 立即保存默认数据到数据库
    const saveDefaultVideos = async () => {
      for (const video of defaultVideos) {
        try {
          await DataManager.saveVideo({
            id: video.id,
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnail: video.thumbnail,
            platform: video.platform,
            category: video.category.join(','),
            tags: video.tags,
            duration: video.duration.toString(),
            viewCount: video.views,
            views: video.views,
            likes: video.likes,
            shares: video.shares,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
            createdBy: 'admin',
            status: video.status,
            quality: video.metadata.quality,
            language: video.metadata.language,
            location: video.metadata.location,
            season: video.metadata.season
          });
        } catch (error) {
          console.error('Error saving default video to database:', error);
        }
      }
      
      // 更新缓存
      cache.set(cacheKeys.videos, defaultVideos, cacheTTL.long);
    };
    
    saveDefaultVideos();
  };

  const applyFilters = useCallback(() => {
    let filtered = [...videos];

    // 状态筛选 - 前端网站只显示已发布的视频
    filtered = filtered.filter(video => video.status === 'published');

    // 平台筛选
    if (filters.platform && filters.platform !== 'all') {
      filtered = filtered.filter(video => video.platform === filters.platform);
    }

    // 分类筛选
    if (filters.category) {
      filtered = filtered.filter(video => 
        video.category.includes(filters.category!)
      );
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(video =>
        filters.tags!.some(tag => video.tags.includes(tag))
      );
    }

    // 搜索筛选
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description.toLowerCase().includes(searchLower) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 时长筛选
    if (filters.duration) {
      filtered = filtered.filter(video => {
        switch (filters.duration) {
          case 'short':
            return video.duration < 300; // <5分钟
          case 'medium':
            return video.duration >= 300 && video.duration <= 900; // 5-15分钟
          case 'long':
            return video.duration > 900; // >15分钟
          default:
            return true;
        }
      });
    }

    // 观看次数筛选
    if (filters.views) {
      filtered = filtered.filter(video => {
        switch (filters.views) {
          case 'low':
            return video.views < 1000;
          case 'medium':
            return video.views >= 1000 && video.views <= 10000;
          case 'high':
            return video.views > 10000;
          default:
            return true;
        }
      });
    }

    // 发布时间筛选
    if (filters.publishTime) {
      const now = new Date();
      const videoDate = new Date();
      
      filtered = filtered.filter(video => {
        const createdDate = new Date(video.createdAt);
        
        switch (filters.publishTime) {
          case 'today':
            return createdDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createdDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return createdDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return createdDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // 排序
    if (filters.sort) {
      filtered.sort((a, b) => {
        switch (filters.sort) {
          case 'latest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'popular':
            return (b.views + b.likes) - (a.views + a.likes);
          case 'views':
            return b.views - a.views;
          case 'likes':
            return b.likes - a.likes;
          default:
            return 0;
        }
      });
    }

    setFilteredVideos(filtered);
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      pages: Math.ceil(filtered.length / prev.limit)
    }));
  }, [videos, filters]);

  const fetchVideos = async (newFilters?: VideoFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      if (newFilters) {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
      }
      
      // 从数据库重新加载视频数据
      const currentLanguage = i18n.language === 'en' ? 'en' : 'zh';
      const videos = await DataManager.getVideos(currentLanguage);
      
      if (videos && videos.length > 0) {
        const videoData: Video[] = videos.map((video: any) => {
          // 根据当前语言选择正确的标签
          let tags: string[] = [];
          if (currentLanguage === 'en' && video.tags_en && Array.isArray(video.tags_en)) {
            tags = video.tags_en;
          } else if (video.tags && Array.isArray(video.tags)) {
            tags = video.tags;
          }
          
          return {
            id: video.id.toString(),
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnail: video.thumbnail,
            platform: video.platform,
            category: Array.isArray(video.category) ? video.category : [video.category || 'general'],
            tags: tags,
            duration: parseDuration(video.duration),
            views: video.views || 0,
            likes: video.likes || 0,
            shares: video.shares || 0,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
            status: video.status || 'published',
            metadata: {
              quality: video.quality || 'HD',
              language: video.language || 'zh',
              location: video.location,
              season: video.season
            }
          };
        });
        
        setVideos(videoData);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取视频失败');
    } finally {
      setLoading(false);
    }
  };

  const addVideo = async (videoData: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVideo: Video = {
      ...videoData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      // 保存到数据库
      await DataManager.saveVideo({
        id: newVideo.id,
        title: newVideo.title,
        description: newVideo.description,
        url: newVideo.url,
        thumbnail: newVideo.thumbnail,
        platform: newVideo.platform,
        category: newVideo.category.join(','),
        tags: newVideo.tags,
        duration: newVideo.duration.toString(),
        viewCount: newVideo.views,
        views: newVideo.views,
        likes: newVideo.likes,
        shares: newVideo.shares,
        createdAt: newVideo.createdAt,
        updatedAt: newVideo.updatedAt,
        createdBy: 'admin',
        status: newVideo.status,
        quality: newVideo.metadata.quality,
        language: newVideo.metadata.language,
        location: newVideo.metadata.location,
        season: newVideo.metadata.season
      });
      
      // 更新本地状态
      setVideos(prev => [...prev, newVideo]);
      
      // 推送同步事件
      await dataSync.pushEvent({
        type: 'video',
        action: 'create',
        data: newVideo
      });
    } catch (error) {
      console.error('Failed to add video:', error);
      throw error;
    }
  };

  const updateVideo = async (id: string, videoData: Partial<Video>) => {
    const updatedVideo = { ...videoData, updatedAt: new Date().toISOString() };
    
    try {
      // 获取当前视频数据
      const currentVideo = videos.find(v => v.id === id);
      if (!currentVideo) {
        throw new Error('Video not found');
      }
      
      const mergedVideo = { ...currentVideo, ...updatedVideo };
      
      // 更新数据库
      await DataManager.updateVideo(id, {
        title: mergedVideo.title,
        description: mergedVideo.description,
        url: mergedVideo.url,
        thumbnail: mergedVideo.thumbnail,
        platform: mergedVideo.platform,
        category: mergedVideo.category.join(','),
        tags: mergedVideo.tags,
        duration: mergedVideo.duration.toString(),
        views: mergedVideo.views,
        likes: mergedVideo.likes,
        shares: mergedVideo.shares,
        updatedAt: mergedVideo.updatedAt,
        status: mergedVideo.status,
        quality: mergedVideo.metadata.quality,
        language: mergedVideo.metadata.language,
        location: mergedVideo.metadata.location,
        season: mergedVideo.metadata.season
      });
      
      // 更新本地状态
      setVideos(prev => prev.map(video => 
        video.id === id 
          ? { ...video, ...updatedVideo }
          : video
      ));
      
      // 推送同步事件
      await dataSync.pushEvent({
        type: 'video',
        action: 'update',
        data: { id, ...updatedVideo }
      });
    } catch (error) {
      console.error('Failed to update video:', error);
      throw error;
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      // 从数据库删除
      await DataManager.deleteVideo(id);
      
      // 更新本地状态
      setVideos(prev => prev.filter(video => video.id !== id));
      
      // 推送同步事件
      await dataSync.pushEvent({
        type: 'video',
        action: 'delete',
        data: { id }
      });
    } catch (error) {
      console.error('Failed to delete video:', error);
      throw error;
    }
  };

  const getVideoById = (id: string) => {
    return videos.find(video => video.id === id);
  };

  // 用户交互功能
  const getUserInteraction = (videoId: string): UserInteraction | undefined => {
    return userInteractions.find(
      interaction => interaction.userId === currentUserId && interaction.videoId === videoId
    );
  };

  const updateUserInteraction = (videoId: string, updates: Partial<UserInteraction['actions']>) => {
    const existingInteraction = getUserInteraction(videoId);
    const now = new Date().toISOString();

    if (existingInteraction) {
      setUserInteractions(prev => prev.map(interaction =>
        interaction.userId === currentUserId && interaction.videoId === videoId
          ? {
              ...interaction,
              actions: { ...interaction.actions, ...updates },
              updatedAt: now
            }
          : interaction
      ));
    } else {
      const newInteraction: UserInteraction = {
        userId: currentUserId,
        videoId,
        actions: {
          viewed: false,
          liked: false,
          shared: false,
          bookmarked: false,
          watchProgress: 0,
          lastWatchTime: now,
          ...updates
        },
        createdAt: now,
        updatedAt: now
      };
      setUserInteractions(prev => [...prev, newInteraction]);
    }
  };

  const likeVideo = async (videoId: string) => {
    const interaction = getUserInteraction(videoId);
    const isLiked = interaction?.actions.liked || false;
    
    // 更新用户交互
    updateUserInteraction(videoId, { liked: !isLiked });
    
    // 更新视频点赞数
    setVideos(prev => prev.map(video =>
      video.id === videoId
        ? { ...video, likes: video.likes + (isLiked ? -1 : 1) }
        : video
    ));
  };

  const bookmarkVideo = async (videoId: string) => {
    const interaction = getUserInteraction(videoId);
    const isBookmarked = interaction?.actions.bookmarked || false;
    
    updateUserInteraction(videoId, { bookmarked: !isBookmarked });
  };

  const shareVideo = async (videoId: string, platform?: string) => {
    updateUserInteraction(videoId, { shared: true });
    
    // 更新视频分享数
    setVideos(prev => prev.map(video =>
      video.id === videoId
        ? { ...video, shares: video.shares + 1 }
        : video
    ));
  };

  const updateWatchProgress = async (videoId: string, progress: number) => {
    updateUserInteraction(videoId, { 
      watchProgress: progress,
      lastWatchTime: new Date().toISOString(),
      viewed: progress > 10 // 观看超过10%算作已观看
    });

    // 如果是首次观看，增加观看数
    const interaction = getUserInteraction(videoId);
    if (!interaction?.actions.viewed && progress > 10) {
      try {
        // 更新数据库中的观看数
        const currentVideo = getVideoById(videoId);
        if (currentVideo) {
          await DataManager.updateVideo(videoId, { 
            views: currentVideo.views + 1 
          });
        }
        
        // 更新本地状态
        setVideos(prev => prev.map(video =>
          video.id === videoId
            ? { ...video, views: video.views + 1 }
            : video
        ));
      } catch (error) {
        console.error('更新观看数失败:', error);
      }
    }
  };

  const setFilters = (newFilters: Partial<VideoFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const searchVideos = async (query: string) => {
    // 检查缓存中是否有搜索结果
    const cacheKey = cacheKeys.searchResults(query);
    const cachedResults = cache.get<Video[]>(cacheKey);
    
    if (cachedResults) {
      setFilteredVideos(cachedResults);
    } else {
      setFilters({ search: query });
    }
  };

  const clearFilters = () => {
    setFiltersState({
      platform: 'all',
      sort: 'latest'
    });
  };

  // 推荐功能
  const getRecommendedVideos = (videoId: string, limit = 4): Video[] => {
    const currentVideo = getVideoById(videoId);
    if (!currentVideo) return [];

    // 基于标签和分类的推荐算法
    const recommended = videos
      .filter(video => video.id !== videoId && video.status === 'published')
      .map(video => {
        let score = 0;
        
        // 相同分类加分
        const commonCategories = video.category.filter(cat => 
          currentVideo.category.includes(cat)
        );
        score += commonCategories.length * 3;
        
        // 相同标签加分
        const commonTags = video.tags.filter(tag => 
          currentVideo.tags.includes(tag)
        );
        score += commonTags.length * 2;
        
        // 相同平台加分
        if (video.platform === currentVideo.platform) {
          score += 1;
        }
        
        return { video, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.video);

    return recommended;
  };

  const getPopularVideos = (limit = 10): Video[] => {
    return videos
      .filter(video => video.status === 'published')
      .sort((a, b) => (b.views + b.likes) - (a.views + a.likes))
      .slice(0, limit);
  };

  // 数据同步功能
  const syncData = async () => {
    setSyncStatus('syncing');
    try {
      // 使用DataSync进行强制同步
      await dataSync.forcSync();
      
      setLastSyncTime(new Date().toISOString());
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      setError('数据同步失败');
    }
  };

  const getSyncStatus = () => ({
    status: syncStatus,
    lastSync: lastSyncTime,
    connectionStatus: dataSync.connectionStatus,
    isConnected: dataSync.isConnected,
    syncQueue: dataSync.syncQueue.length,
    syncErrors: dataSync.syncErrors.length
  });

  // 视频状态管理方法
  const publishVideo = async (id: string) => {
    await updateVideo(id, { status: 'published' });
  };

  const archiveVideo = async (id: string) => {
    await updateVideo(id, { status: 'archived' });
  };

  const draftVideo = async (id: string) => {
    await updateVideo(id, { status: 'draft' });
  };

  const batchUpdateStatus = async (ids: string[], status: 'draft' | 'published' | 'archived') => {
    for (const id of ids) {
      await updateVideo(id, { status });
    }
  };

  const getVideosByStatus = (status: 'draft' | 'published' | 'archived'): Video[] => {
    return videos.filter(video => video.status === status);
  };

  return (
    <VideoContext.Provider value={{
      // 视频数据
      videos,
      filteredVideos,
      loading,
      error,
      
      // 筛选和分页
      filters,
      pagination,
      
      // 用户交互数据
      userInteractions,
      
      // 同步状态
      syncStatus,
      lastSyncTime,
      
      // 视频操作
      fetchVideos,
      addVideo,
      updateVideo,
      deleteVideo,
      getVideoById,
      
      // 用户交互操作
      likeVideo,
      bookmarkVideo,
      shareVideo,
      updateWatchProgress,
      
      // 筛选和搜索
      setFilters,
      searchVideos,
      clearFilters,
      
      // 推荐功能
      getRecommendedVideos,
      getPopularVideos,
      
      // 数据同步
      syncData,
      getSyncStatus,
      
      // 视频状态管理
      publishVideo,
      archiveVideo,
      draftVideo,
      batchUpdateStatus,
      getVideosByStatus,
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};