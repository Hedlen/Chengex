import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { DataManager } from '../../shared/api/dataManager';
import { realTimeAnalytics, AnalyticsEvent } from '../services/realTimeAnalytics';

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  // 英文字段
  title_en?: string;
  content_en?: string;
  excerpt_en?: string;
  author: string;
  date: string;
  status: 'published' | 'draft';
  viewCount: number; // 统一使用viewCount字段
  category: string;
  category_id?: string | number; // 添加category_id字段
  tags: string[];
  tags_en?: string[]; // 英文标签
  thumbnail?: string;
  image?: string; // 兼容旧数据
  readTime?: string; // 阅读时间
  createdAt: string;
  updatedAt: string;
  published?: boolean;
}

interface BlogContextType {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  addPost: (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePost: (id: number, post: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  publishPost: (id: number) => Promise<void>;
  unpublishPost: (id: number) => Promise<void>;
  getPostById: (id: number | string) => BlogPost | undefined;
  getPublishedPosts: () => BlogPost[];
  getPostCommentCount: (postId: number | string) => number;
  incrementViewCount: (id: number | string) => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

// 创建一个组件来提供翻译后的默认数据
const BlogProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const analyticsSubscriptions = useRef<Map<string, () => void>>(new Map());
  
  // 使用ref来防止重复加载
  const isLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // 使用ref来获取最新的posts状态
  const postsRef = useRef<BlogPost[]>([]);
  postsRef.current = posts;

  // 辅助函数：根据category_id获取分类名称
  const getCategoryNameById = async (categoryId: number | null): Promise<string> => {
    if (!categoryId) return 'tours'; // 默认分类
    
    try {
      const currentLanguage = i18n.language === 'en' ? 'en' : 'zh';
      const categories = await DataManager.getCategories(currentLanguage);
      const category = categories.find((cat: any) => cat.id === categoryId);
      return category ? category.slug || category.name : 'tours';
    } catch (error) {
      console.error('Error getting category name:', error);
      return 'tours';
    }
  };

  // 辅助函数：从数据库重新加载博客数据
  const reloadBlogsFromDatabase = async () => {
    try {
      console.log('Reloading blogs from database...');
      const currentLanguage = i18n.language === 'en' ? 'en' : 'zh';
      const blogs = await DataManager.getBlogs(currentLanguage);
      
      if (blogs && blogs.length > 0) {
        // 先获取所有分类数据
        const categories = await DataManager.getCategories(currentLanguage);
        const categoryMap = new Map();
        categories.forEach((cat: any) => {
          // 根据语言选择分类名称
          const categoryName = currentLanguage === 'en' && cat.name_en 
            ? cat.name_en 
            : cat.name;
          categoryMap.set(cat.id, cat.slug || categoryName);
        });
        
        const blogPosts: BlogPost[] = blogs.map((blog: any) => {
          // 根据category_id获取正确的分类名称
          const categorySlug = blog.category_id ? categoryMap.get(blog.category_id) : null;
          const finalCategory = categorySlug || 'travel-guide';
          
          // 根据语言选择显示内容
          let displayTitle = blog.title;
          let displayContent = blog.content;
          let displayExcerpt = blog.excerpt || '';
          
          // 处理标签数据格式
          let displayTags: string[] = [];
          if (Array.isArray(blog.tags)) {
            displayTags = blog.tags;
          } else if (typeof blog.tags === 'string') {
            try {
              // 尝试解析JSON字符串
              const parsed = JSON.parse(blog.tags);
              displayTags = Array.isArray(parsed) ? parsed : [blog.tags];
            } catch {
              // 如果解析失败，按逗号分割
              displayTags = blog.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
            }
          }
          
          if (currentLanguage === 'en') {
            displayTitle = blog.title_en || blog.title;
            displayContent = blog.content_en || blog.content;
            displayExcerpt = blog.excerpt_en || blog.excerpt || '';
            
            // 处理英文标签
            if (Array.isArray(blog.tags_en)) {
              displayTags = blog.tags_en;
            } else if (typeof blog.tags_en === 'string') {
              try {
                const parsed = JSON.parse(blog.tags_en);
                displayTags = Array.isArray(parsed) ? parsed : [blog.tags_en];
              } catch {
                displayTags = blog.tags_en.split(',').map((tag: string) => tag.trim()).filter(Boolean);
              }
            }
            // 如果没有英文标签，保持原有的中文标签
          }
          
          return {
            id: parseInt(blog.id) || Date.now(),
            title: displayTitle,
            content: displayContent,
            excerpt: displayExcerpt,
            author: blog.author || 'admin',
            date: blog.publishedAt || blog.createdAt || new Date().toISOString().split('T')[0],
            status: (blog.status === 'published' ? 'published' : 'draft') as 'published' | 'draft',
            viewCount: blog.viewsCount || blog.viewCount || blog.views || 0,
            category: finalCategory,
            tags: displayTags,
            thumbnail: blog.featuredImage || blog.thumbnail || blog.cover_image,
            readTime: blog.readTime,
            createdAt: blog.createdAt || new Date().toISOString(),
            updatedAt: blog.updatedAt || new Date().toISOString()
          };
        });
        
        setPosts(blogPosts);
        console.log('Successfully reloaded', blogPosts.length, 'blogs from database');
        return blogPosts;
      } else {
        setPosts([]);
        console.log('No blogs found in database, cleared local state');
        return [];
      }
    } catch (error) {
      console.error('Error reloading blogs from database:', error);
      throw error;
    }
  };

  // 使用翻译系统创建默认博客数据
  const getDefaultPosts = (): BlogPost[] => [
    {
      id: 1,
      title: t('blog.blogData.photography.title'),
      content: t('blog.blogData.photography.content'),
      excerpt: t('blog.blogData.photography.excerpt'),
      author: t('张导游'),
      date: '2024-01-15',
      status: 'published',
      viewCount: 1250,
      category: 'tours',
      tags: t('blog.blogData.photography.tags', { returnObjects: true }) as string[],
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Chengdu%20photography%20spots%20beautiful%20scenery&image_size=landscape_16_9',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      title: t('blog.blogData.cuisine.title'),
      content: t('blog.blogData.cuisine.content'),
      excerpt: t('blog.blogData.cuisine.excerpt'),
      author: t('张导游'),
      date: '2024-01-10',
      status: 'published',
      viewCount: 980,
      category: 'food',
      tags: t('blog.blogData.cuisine.tags', { returnObjects: true }) as string[],
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Sichuan%20cuisine%20culture%20traditional%20dishes&image_size=landscape_16_9',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z'
    },
    {
      id: 3,
      title: t('blog.blogData.metro.title'),
      content: t('blog.blogData.metro.content'),
      excerpt: t('blog.blogData.metro.excerpt'),
      author: t('张导游'),
      date: '2024-01-05',
      status: 'published',
      viewCount: 756,
      category: 'tips',
      tags: t('blog.blogData.metro.tags', { returnObjects: true }) as string[],
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Chengdu%20metro%20transportation%20guide&image_size=landscape_16_9',
      createdAt: '2024-01-05T14:00:00Z',
      updatedAt: '2024-01-05T14:00:00Z'
    }
  ];

  // 主要的数据加载函数
  const loadBlogData = async () => {
    // 防止重复加载
    if (isLoadingRef.current) {
      console.log('📚 BlogContext: 已在加载中，跳过重复请求');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      // 从数据库加载博客数据
      const currentLanguage = i18n.language === 'en' ? 'en' : 'zh';
      console.log(`📚 BlogContext: 加载博客数据，语言: ${currentLanguage}`);
      
      const blogs = await DataManager.getBlogs(currentLanguage);
      
      if (blogs && blogs.length > 0) {
        // 使用 reloadBlogsFromDatabase 函数来正确处理分类映射
        const blogPosts = await reloadBlogsFromDatabase();
        console.log('✅ BlogContext: 成功加载', blogPosts.length, '篇博客');
      } else {
        console.log('⚠️ BlogContext: 数据库中没有博客数据，使用默认数据');
        // 如果数据库中没有数据，使用默认数据
        const defaultPosts = getDefaultPosts();
        setPosts(defaultPosts);
        
        // 尝试将默认数据保存到数据库（不阻塞UI）
        try {
          for (const post of defaultPosts) {
            await DataManager.saveBlog({
              id: post.id.toString(),
              title: post.title,
              content: post.content,
              excerpt: post.excerpt || '',
              author: post.author,
              readTime: 1,
              viewCount: post.viewCount,
              views: post.viewCount,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              publishedAt: post.date,
              status: post.status,
              tags: post.tags,
              category: post.category,
              featuredImage: post.thumbnail || '',
              thumbnail: post.thumbnail || ''
            });
          }
          console.log('✅ BlogContext: 默认数据已保存到数据库');
        } catch (saveError) {
          console.warn('⚠️ BlogContext: 保存默认数据到数据库失败:', saveError);
          // 不影响UI显示，继续使用默认数据
        }
      }
    } catch (error) {
      console.error('❌ BlogContext: 加载博客数据失败:', error);
      setError('加载博客数据失败，正在使用本地数据');
      
      // 如果API加载失败，使用默认数据作为fallback
      const defaultPosts = getDefaultPosts();
      setPosts(defaultPosts);
      console.log('🔄 BlogContext: 使用默认数据作为fallback');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      hasInitializedRef.current = true;
    }
  };

  // 初始化加载数据
  useEffect(() => {
    if (!hasInitializedRef.current) {
      loadBlogData();
    }
  }, []); // 只在组件挂载时执行一次

  // 语言切换时重新加载数据
  useEffect(() => {
    if (hasInitializedRef.current) {
      console.log('🌐 BlogContext: 语言切换，重新加载数据');
      loadBlogData();
    }
  }, [i18n.language]); // 只依赖语言变化

  // 实时分析集成 - 暂时禁用以解决循环加载问题
  useEffect(() => {
    // 暂时禁用实时分析以解决循环加载问题
    console.log('📊 BlogContext: 暂时禁用实时分析以解决循环加载问题');
    realTimeAnalytics.disable();
    
    // 组件卸载时清理所有订阅
    return () => {
      analyticsSubscriptions.current.forEach(unsubscribe => unsubscribe());
      analyticsSubscriptions.current.clear();
      console.log('📊 BlogContext: 清理所有实时分析订阅');
    };
  }, []); // 只在组件挂载时执行一次

  // 注释掉原来的实时分析订阅逻辑
  /*
  useEffect(() => {
    // 为所有已发布的博客订阅实时分析
    const publishedPosts = posts.filter(post => post.status === 'published');
    
    publishedPosts.forEach(post => {
      const blogId = post.id.toString();
      
      // 如果还没有订阅这个博客，则订阅
      if (!analyticsSubscriptions.current.has(blogId)) {
        const unsubscribe = realTimeAnalytics.subscribe(blogId, (event: AnalyticsEvent) => {
          console.log(`📊 BlogContext: 收到博客 ${blogId} 的实时事件`, event);
          
          // 根据事件类型更新本地状态 - 使用函数式更新避免依赖当前posts状态
          if (event.type === 'view_increment' || event.type === 'stats_refresh') {
            // 使用 postsRef 获取最新状态，避免闭包问题
            const currentPosts = postsRef.current;
            const targetPost = currentPosts.find(p => p.id.toString() === blogId);
            
            // 只有当viewCount真的发生变化时才更新状态
            if (targetPost && targetPost.viewCount !== event.data.viewCount) {
              setPosts(prevPosts => 
                prevPosts.map(p => 
                  p.id.toString() === blogId 
                    ? { ...p, viewCount: event.data.viewCount || p.viewCount }
                    : p
                )
              );
              console.log(`📊 BlogContext: 更新博客 ${blogId} 的浏览量: ${targetPost.viewCount} -> ${event.data.viewCount}`);
            } else {
              console.log(`📊 BlogContext: 博客 ${blogId} 的浏览量无变化，跳过更新`);
            }
          }
        });
        
        analyticsSubscriptions.current.set(blogId, unsubscribe);
        console.log(`📊 BlogContext: 订阅博客 ${blogId} 的实时分析`);
      }
    });

    // 清理不再需要的订阅
    const currentBlogIds = new Set(publishedPosts.map(p => p.id.toString()));
    analyticsSubscriptions.current.forEach((unsubscribe, blogId) => {
      if (!currentBlogIds.has(blogId)) {
        unsubscribe();
        analyticsSubscriptions.current.delete(blogId);
        console.log(`📊 BlogContext: 取消订阅博客 ${blogId} 的实时分析`);
      }
    });

    // 组件卸载时清理所有订阅
    return () => {
      analyticsSubscriptions.current.forEach(unsubscribe => unsubscribe());
      analyticsSubscriptions.current.clear();
      console.log('📊 BlogContext: 清理所有实时分析订阅');
    };
  }, [posts.length, posts.map(p => p.id).join(','), posts.map(p => p.status).join(',')]); // 只在博客数量、ID或状态变化时重新订阅
  */

  const addPost = async (postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPost: BlogPost = {
        ...postData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // 保存到数据库
      await DataManager.saveBlog({
        id: newPost.id.toString(),
        title: newPost.title,
        content: newPost.content,
        excerpt: newPost.excerpt || '',
        author: newPost.author,
        readTime: 1,
        viewCount: newPost.viewCount,
        views: newPost.viewCount,
        createdAt: newPost.createdAt,
        updatedAt: newPost.updatedAt,
        publishedAt: newPost.date,
        status: newPost.status,
        tags: newPost.tags,
        category: newPost.category,
        featuredImage: newPost.thumbnail || '',
        thumbnail: newPost.thumbnail || ''
      });
      
      // 保存成功后，重新从数据库加载数据以确保同步
      await reloadBlogsFromDatabase();
    } catch (error) {
      console.error('Error adding blog post:', error);
      throw error;
    }
  };

  const updatePost = async (id: number, postData: Partial<BlogPost>) => {
    try {
      const existingPost = posts.find(post => post.id === id);
      if (!existingPost) {
        throw new Error('Post not found');
      }
      
      const updatedPost = { ...existingPost, ...postData, updatedAt: new Date().toISOString() };
      
      // 保存到数据库
      await DataManager.saveBlog({
        id: updatedPost.id.toString(),
        title: updatedPost.title,
        content: updatedPost.content,
        excerpt: updatedPost.excerpt || '',
        author: updatedPost.author,
        readTime: 1,
        viewCount: updatedPost.viewCount,
        views: updatedPost.viewCount,
        createdAt: updatedPost.createdAt,
        updatedAt: updatedPost.updatedAt,
        publishedAt: updatedPost.date,
        status: updatedPost.status,
        tags: updatedPost.tags,
        category: updatedPost.category,
        featuredImage: updatedPost.thumbnail || '',
        thumbnail: updatedPost.thumbnail || ''
      });
      
      // 更新成功后，重新从数据库加载数据以确保同步
      await reloadBlogsFromDatabase();
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  };

  const deletePost = async (id: number) => {
    try {
      // 从数据库删除
      await DataManager.deleteBlog(id.toString());
      
      // 删除成功后，重新从数据库加载数据以确保同步
      await reloadBlogsFromDatabase();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  };

  const publishPost = async (id: number) => {
    await updatePost(id, { status: 'published' });
  };

  const unpublishPost = async (id: number) => {
    await updatePost(id, { status: 'draft' });
  };

  const getPostById = (id: number | string) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    return posts.find(post => post.id === numericId);
  };

  const getPublishedPosts = () => {
    return posts.filter(post => post.status === 'published');
  };

  const getPostCommentCount = (postId: number | string): number => {
    // TODO: 实现从数据库获取评论数量
    // 暂时返回0，等待评论系统重构完成
    return 0;
  };

  const incrementViewCount = async (id: number | string) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    // 生成或获取会话ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    
    // 检查会话存储，防止重复计数（使用时间戳进行更精确的控制）
    const viewedKey = `blog_viewed_${numericId}`;
    const viewedData = sessionStorage.getItem(viewedKey);
    
    if (viewedData) {
      const { timestamp } = JSON.parse(viewedData);
      const timeDiff = Date.now() - timestamp;
      
      // 如果在30分钟内已经查看过，不重复计数
      if (timeDiff < 30 * 60 * 1000) {
        console.log(`📖 Blog ${numericId} already viewed in this session (${Math.round(timeDiff / 1000)}s ago)`);
        return;
      }
    }
    
    try {
      // 使用DataManager的incrementBlogViews方法
      console.log(`📖 Calling DataManager.incrementBlogViews for blog ${numericId}`);
      const result = await DataManager.incrementBlogViews(numericId.toString());
      console.log(`📖 DataManager.incrementBlogViews result:`, result);
      
      // 标记为已查看（会话级别，包含时间戳）
      sessionStorage.setItem(viewedKey, JSON.stringify({
        timestamp: Date.now(),
        sessionId: sessionId,
        blogId: numericId
      }));
      
      // 更新本地状态
      const updatedPosts = posts.map(post => 
        post.id === numericId 
          ? { ...post, viewCount: (post.viewCount || 0) + 1 }
          : post
      );
      
      setPosts(updatedPosts);
      console.log(`📖 Blog ${numericId} view count incremented successfully`);
      
      // 通知实时分析服务
      const newViewCount = (posts.find(p => p.id === numericId)?.viewCount || 0) + 1;
      realTimeAnalytics.notifyViewIncrement(numericId.toString(), newViewCount);
      
      // 记录到分析系统
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: `Blog ${numericId}`,
          page_location: window.location.href,
          custom_parameters: {
            content_type: 'blog',
            content_id: numericId.toString()
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error incrementing blog view count:', error);
      // 如果API调用失败，不更新本地状态，也不标记为已查看
      // 这样用户刷新页面时还可以重试
    }
  };

  const value: BlogContextType = {
    posts,
    loading,
    error,
    addPost,
    updatePost,
    deletePost,
    publishPost,
    unpublishPost,
    getPostById,
    getPublishedPosts,
    getPostCommentCount,
    incrementViewCount,
  };

  return (
    <BlogContext.Provider value={value}>
      {children}
    </BlogContext.Provider>
  );
};

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BlogProviderInner>
      {children}
    </BlogProviderInner>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};