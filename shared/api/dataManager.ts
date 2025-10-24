import { Video, Blog, AdminUser, SystemConfig, ActivityLog, DashboardStats, ApiResponse, Category } from '../types/index.js';
import { API_CONFIG, buildApiUrl } from '../../src/config/api';

// 数据管理器 - 处理所有数据操作
export class DataManager {

  // 视频数据操作
  static async getVideos(language?: string): Promise<Video[]> {
    try {
      const url = language ? buildApiUrl(`/api/videos?lang=${language}`) : buildApiUrl('/api/videos');
      console.log(`🔗 DataManager: 请求视频数据，URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      const data = await response.json();
      // API 直接返回数组，不是包装在 success/data 结构中
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('获取视频列表失败:', error);
      throw error;
    }
  }

  static async saveVideo(video: Video | Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse> {
    try {
      const videoId = 'id' in video ? video.id : undefined;
      const method = videoId ? 'PUT' : 'POST';
      const url = videoId ? buildApiUrl(`/api/videos/${videoId}`) : buildApiUrl('/api/videos');
      
      // 转换数据格式以匹配 API 期望的格式
      const apiVideo = {
        id: videoId,
        title: video.title,
        description: video.description,
        videoUrl: video.url,
        platform: video.platform || 'youtube',
        status: video.status || 'published',
        thumbnail: video.thumbnail,
        tags: Array.isArray(video.tags) ? JSON.stringify(video.tags) : video.tags,
        category_id: video.category,
        views: video.views || 0,
        duration: video.duration,
        created_at: 'createdAt' in video ? video.createdAt : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiVideo),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      // 如果API返回标准格式 { success, data, message, timestamp }，使用data字段
      // 否则使用整个result作为向后兼容
      const videoData = result.data || result;
      return { success: true, message: videoId ? '视频更新成功' : '视频创建成功', data: videoData };
    } catch (error) {
      console.error('保存视频失败:', error);
      return { success: false, error: '保存视频失败: ' + (error as Error).message };
    }
  }

  static async deleteVideo(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl(`/api/videos/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      return { success: true, message: '视频删除成功' };
    } catch (error) {
      console.error('删除视频失败:', error);
      return { success: false, error: '删除视频失败: ' + (error as Error).message };
    }
  }

  static async updateVideo(id: string, updates: Partial<Video>): Promise<ApiResponse> {
    try {
      // 转换数据格式以匹配 API 期望的格式
      const apiUpdates: any = {};
      
      if (updates.title !== undefined) apiUpdates.title = updates.title;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.url !== undefined) apiUpdates.videoUrl = updates.url;
      if (updates.platform !== undefined) apiUpdates.platform = updates.platform;
      if (updates.status !== undefined) apiUpdates.status = updates.status;
      if (updates.thumbnail !== undefined) apiUpdates.thumbnail = updates.thumbnail;
      if (updates.tags !== undefined) {
        apiUpdates.tags = Array.isArray(updates.tags) ? JSON.stringify(updates.tags) : updates.tags;
      }
      if (updates.category !== undefined) apiUpdates.category_id = updates.category;
      if (updates.views !== undefined) apiUpdates.views = updates.views;
      if (updates.duration !== undefined) apiUpdates.duration = updates.duration;
      if (updates.viewCount !== undefined) apiUpdates.views = updates.viewCount;
      
      // 总是更新 updated_at
      apiUpdates.updated_at = new Date().toISOString();

      const response = await fetch(buildApiUrl(`/api/videos/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiUpdates),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: '视频更新成功', data: result };
    } catch (error) {
      console.error('更新视频失败:', error);
      return { success: false, error: '更新视频失败: ' + (error as Error).message };
    }
  }

  // 博客数据操作
  static async getBlogs(language?: string): Promise<Blog[]> {
    try {
      const url = language ? buildApiUrl(`/api/blogs?lang=${language}`) : buildApiUrl('/api/blogs');
      console.log(`🔗 DataManager: 请求博客数据，URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      const result = await response.json();
      
      // 处理API响应格式：可能是直接数组或包装在 success/data 结构中
      let rawData;
      if (Array.isArray(result)) {
        // 直接返回数组格式
        rawData = result;
      } else if (result.success && Array.isArray(result.data)) {
        // 包装格式：{ success: true, data: [...] }
        rawData = result.data;
      } else if (result.data && Array.isArray(result.data)) {
        // 其他包装格式：{ data: [...] }
        rawData = result.data;
      } else {
        // 未知格式，返回空数组
        console.warn('DataManager: 未知的API响应格式:', result);
        rawData = [];
      }
      
      // 转换数据格式以匹配前端 Blog 类型
      const data: Blog[] = rawData.map((item: any) => ({
        id: String(item.id),
        title: item.title || '',
        content: item.content || '',
        excerpt: item.excerpt || '',
        title_en: item.title_en,
        content_en: item.content_en,
        excerpt_en: item.excerpt_en,
        status: item.status || 'draft',
        thumbnail: item.thumbnail || item.cover_image,
        featuredImage: item.featuredImage || item.cover_image,
        tags: (() => {
          // 处理标签数据格式
          if (Array.isArray(item.tags)) {
            return item.tags;
          } else if (typeof item.tags === 'string') {
            try {
              // 尝试解析JSON字符串
              const parsed = JSON.parse(item.tags);
              return Array.isArray(parsed) ? parsed : [item.tags];
            } catch {
              // 如果解析失败，按逗号分割
              return item.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
            }
          }
          return [];
        })(),
        tags_en: (() => {
          // 处理英文标签数据格式
          if (Array.isArray(item.tags_en)) {
            return item.tags_en;
          } else if (typeof item.tags_en === 'string') {
            try {
              const parsed = JSON.parse(item.tags_en);
              return Array.isArray(parsed) ? parsed : [item.tags_en];
            } catch {
              return item.tags_en.split(',').map((tag: string) => tag.trim()).filter(Boolean);
            }
          }
          return [];
        })(),
        category: item.category || item.category_name || 'tours', // 默认分类
        category_id: item.category_id || item.categoryId, // 添加category_id字段
        author: item.author || 'Admin',
        readTime: item.readTime || item.readingTime || Math.ceil((item.content || '').length / 200) || 1,
        viewCount: item.view_count || item.viewCount || item.views || 0,
        views: item.views || item.view_count || item.viewCount || 0,
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
        publishedAt: item.published_at || item.publishedAt
      }));
      
      console.log(`✅ DataManager: 成功获取并转换 ${data.length} 篇博客`);
      return data;
    } catch (error) {
      console.error('获取博客列表失败:', error);
      throw error;
    }
  }

  static async getBlog(id: string, language?: string): Promise<Blog | null> {
    try {
      const blogs = await this.getBlogs(language);
      // 确保ID比较时进行类型转换，因为API可能返回数字类型的ID
      return blogs.find(blog => String(blog.id) === String(id)) || null;
    } catch (error) {
      console.error('获取博客失败:', error);
      return null;
    }
  }

  static async saveBlog(blog: Blog | Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse> {
    try {
      let method = 'POST';
      let url = buildApiUrl('/api/blogs');
      let isUpdate = false;

      // 如果有ID，先检查博客是否真实存在于服务器
      const blogId = 'id' in blog ? blog.id : undefined;
      if (blogId) {
        try {
          const checkResponse = await fetch(buildApiUrl(`/api/blogs/${blogId}`));
          if (checkResponse.ok) {
            // 博客存在，使用PUT更新
            method = 'PUT';
            url = buildApiUrl(`/api/blogs/${blogId}`);
            isUpdate = true;
          }
          // 如果博客不存在（404），继续使用POST创建新博客
        } catch (checkError) {
          // 检查失败，默认创建新博客
          console.log('检查博客存在性失败，将创建新博客:', checkError);
        }
      }

      // 转换数据格式以匹配 API 期望的格式
      const apiBlog = {
        id: isUpdate ? blogId : undefined, // 新建时不发送ID
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        title_en: 'title_en' in blog ? blog.title_en : undefined,
        content_en: 'content_en' in blog ? blog.content_en : undefined,
        excerpt_en: 'excerpt_en' in blog ? blog.excerpt_en : undefined,
        author: blog.author,
        category: blog.category,
        tags: Array.isArray(blog.tags) ? JSON.stringify(blog.tags) : blog.tags,
        tags_en: 'tags_en' in blog && Array.isArray(blog.tags_en) ? JSON.stringify(blog.tags_en) : undefined,
        status: blog.status || 'published',
        featuredImage: blog.featuredImage,
        views: blog.views || 0,
        reading_time: blog.readTime,
        created_at: 'createdAt' in blog ? blog.createdAt : undefined,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiBlog),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      // 如果API返回标准格式 { success, data, message, timestamp }，使用data字段
      // 否则使用整个result作为向后兼容
      const blogData = result.data || result;
      return { success: true, message: isUpdate ? '博客更新成功' : '博客创建成功', data: blogData };
    } catch (error) {
      console.error('保存博客失败:', error);
      return { success: false, error: '保存博客失败: ' + (error as Error).message };
    }
  }

  static async deleteBlog(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl(`/api/blogs/${id}`), {
        method: 'DELETE',
      });

      // 404表示博客已经不存在，视为删除成功
      if (response.status === 404) {
        console.log(`博客 ${id} 已经不存在，视为删除成功`);
        return { success: true, message: '博客删除成功（博客已不存在）' };
      }

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      return { success: true, message: '博客删除成功' };
    } catch (error) {
      console.error('删除博客失败:', error);
      return { success: false, error: '删除博客失败: ' + (error as Error).message };
    }
  }

  static async incrementBlogViews(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl(`/api/blogs/${id}/views`), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: '博客浏览量更新成功', data: result };
    } catch (error) {
      console.error('更新博客浏览量失败:', error);
      return { success: false, error: '更新博客浏览量失败: ' + (error as Error).message };
    }
  }

  // 分类数据操作
  static async getCategories(language?: string): Promise<Category[]> {
    try {
      const url = language ? buildApiUrl(`/api/categories?lang=${language}`) : buildApiUrl('/api/categories');
      console.log(`🔗 DataManager: 请求分类数据，URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      const result = await response.json();
      
      // 处理API响应格式：可能是直接数组或包装在 success/data 结构中
      let data;
      if (Array.isArray(result)) {
        // 直接返回数组格式
        data = result;
      } else if (result.success && Array.isArray(result.data)) {
        // 包装格式：{ success: true, data: [...] }
        data = result.data;
      } else if (result.data && Array.isArray(result.data)) {
        // 其他包装格式：{ data: [...] }
        data = result.data;
      } else if (result.success && result.data) {
        // 单个对象包装格式，转换为数组
        data = [result.data];
      } else {
        // 未知格式，返回空数组
        console.warn('DataManager: 未知的分类API响应格式:', result);
        data = [];
      }
      
      console.log(`✅ DataManager: 成功获取 ${data.length} 个分类`);
      return data;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  }

  static async saveCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl('/api/categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: '分类创建成功', data: result };
    } catch (error) {
      console.error('创建分类失败:', error);
      return { success: false, error: '创建分类失败: ' + (error as Error).message };
    }
  }

  static async updateCategory(id: string, updates: Partial<Category>): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl(`/api/categories/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          icon: updates.icon
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: '分类更新成功', data: result };
    } catch (error) {
      console.error('更新分类失败:', error);
      return { success: false, error: '更新分类失败: ' + (error as Error).message };
    }
  }

  static async deleteCategory(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl(`/api/categories/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      return { success: true, message: '分类删除成功' };
    } catch (error) {
      console.error('删除分类失败:', error);
      return { success: false, error: '删除分类失败: ' + (error as Error).message };
    }
  }

  static async getCategoryStats(): Promise<Record<string, number>> {
    try {
      const [categories, blogs] = await Promise.all([
        this.getCategories(),
        this.getBlogs()
      ]);
      
      const stats: Record<string, number> = {};
      categories.forEach(category => {
        stats[category.name] = blogs.filter(blog => blog.category === category.name).length;
      });
      
      return stats;
    } catch (error) {
      console.error('获取分类统计失败:', error);
      return {};
    }
  }

  static async getBlogStats(blogId: string): Promise<{ viewCount: number } | null> {
    try {
      const blog = await this.getBlog(blogId);
      return blog ? { viewCount: blog.viewCount || 0 } : null;
    } catch (error) {
      console.error('获取博客统计失败:', error);
      return null;
    }
  }

  // 评论数据操作
  static async getComments(blogId: string): Promise<any[]> {
    try {
      const response = await fetch(buildApiUrl(`/api/comments/${blogId}`));
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }

  static async createComment(commentData: {
    blogId: string;
    author: string;
    email: string;
    content: string;
    parentId?: string;
  }): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl('/api/comments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: '评论创建成功', data: result };
    } catch (error) {
      console.error('创建评论失败:', error);
      return { success: false, error: '创建评论失败: ' + (error as Error).message };
    }
  }

  static async getCommentCount(blogId: string): Promise<number> {
    try {
      const response = await fetch(buildApiUrl(`/api/comments/${blogId}/count`));
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      const result = await response.json();
      return result.count || 0;
    } catch (error) {
      console.error('获取评论数量失败:', error);
      return 0;
    }
  }

  static async deleteComment(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl(`/api/comments/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      return { success: true, message: '评论删除成功' };
    } catch (error) {
      console.error('删除评论失败:', error);
      return { success: false, error: '删除评论失败: ' + (error as Error).message };
    }
  }

  static async updateCommentStatus(id: string, status: string): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl(`/api/comments/${id}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      return { success: true, message: '评论状态更新成功' };
    } catch (error) {
      console.error('更新评论状态失败:', error);
      return { success: false, error: '更新评论状态失败: ' + (error as Error).message };
    }
  }

  // 用户数据操作
  static async getUsers(filters?: any): Promise<AdminUser[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(buildApiUrl(`/api/users?${params}`));
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const result = await response.json();
      
      // 检查API返回格式：可能是直接数组或包装格式
      let users: any[];
      if (Array.isArray(result)) {
        // API直接返回数组
        users = result;
      } else if (result.success && Array.isArray(result.data)) {
        // API返回包装格式
        users = result.data;
      } else {
        throw new Error(result.error || '获取用户列表失败');
      }
      
      // 转换 API 数据格式以匹配 AdminUser 类型
      return users.map((user: any) => ({
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.role === 'admin' ? ['*'] : [],
        avatar: user.avatar,
        lastLogin: user.last_login,
        isActive: user.status === 'active',
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }));
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  static async saveUser(user: AdminUser): Promise<AdminUser> {
    try {
      const method = user.id ? 'PUT' : 'POST';
      const url = user.id ? buildApiUrl(`/api/users/${user.id}`) : buildApiUrl('/api/users');
      
      const userData = {
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.isActive ? 'active' : 'inactive'
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '保存用户失败');
      }

      // 转换返回的数据格式
      const savedUser = result.data;
      return {
        id: savedUser.id.toString(),
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
        permissions: savedUser.role === 'admin' ? ['*'] : [],
        avatar: savedUser.avatar,
        lastLogin: savedUser.last_login,
        isActive: savedUser.status === 'active',
        createdAt: savedUser.created_at,
        updatedAt: savedUser.updated_at
      };
    } catch (error) {
      console.error('保存用户失败:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl(`/api/users/${userId}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      return { success: true, message: '用户删除成功' };
    } catch (error) {
      console.error('删除用户失败:', error);
      return { success: false, error: '删除用户失败: ' + (error as Error).message };
    }
  }

  static async getSystemConfig(): Promise<SystemConfig> {
    try {
      const response = await fetch(buildApiUrl('/api/system-config'));
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取系统配置失败');
      }
    } catch (error) {
      console.error('获取系统配置失败:', error);
      // 返回默认配置
      return {
        siteName: '成都旅游网',
        siteDescription: '探索成都的美丽与魅力',
        siteUrl: 'https://chengdu-travel.com',
        adminEmail: 'admin@chengdu-travel.com',
        maxFileSize: 10485760, // 10MB
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
        sessionTimeout: 3600000, // 1 hour
        enableRegistration: false,
        maintenanceMode: false
      };
    }
  }

  static async saveSystemConfig(config: SystemConfig): Promise<ApiResponse> {
    try {
      const response = await fetch(buildApiUrl('/api/system-config'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: '系统配置保存成功', data: result };
    } catch (error) {
      console.error('保存系统配置失败:', error);
      return { success: false, error: '保存系统配置失败: ' + (error as Error).message };
    }
  }

  static async getActivityLogs(filters?: any): Promise<ActivityLog[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.action) params.append('action', filters.action);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(buildApiUrl(`/api/activity-logs?${params}`));
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取活动日志失败');
      }
    } catch (error) {
      console.error('获取活动日志失败:', error);
      return [];
    }
  }

  static async addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const response = await fetch(buildApiUrl('/api/activity-logs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...log,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error('添加活动日志失败:', error);
      // 不抛出错误，避免影响主要功能
    }
  }

  // 仪表板统计数据
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(buildApiUrl('/api/analytics/dashboard'));
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取仪表板统计失败');
      }
    } catch (error) {
      console.error('获取仪表板统计失败:', error);
      // 返回默认统计数据
      return {
        totalVideos: 0,
        publishedVideos: 0,
        draftVideos: 0,
        totalBlogs: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
        totalUsers: 0,
        activeUsers: 0,
        todayViews: 0,
        weeklyViews: 0,
        monthlyViews: 0,
        totalPageViews: 0,
        uniqueVisitors: 0,
        totalVideoViews: 0,
        totalComments: 0
      };
    }
  }
}