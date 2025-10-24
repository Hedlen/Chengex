import { DataManager } from '../../shared/api/dataManager';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  count?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithCount extends Category {
  count: number;
}

export class CategoryManager {
  private static instance: CategoryManager;
  private categories: Category[] = [];
  private categoriesCache: Map<string, Category[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): CategoryManager {
    if (!CategoryManager.instance) {
      CategoryManager.instance = new CategoryManager();
    }
    return CategoryManager.instance;
  }

  /**
   * 获取默认分类列表
   */
  private getDefaultCategories(): Category[] {
    return [
      {
        id: 'tours',
        name: '旅游攻略',
        slug: 'tours',
        description: '旅游景点推荐和攻略',
        color: '#3B82F6',
        icon: '🗺️',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'food',
        name: '美食推荐',
        slug: 'food',
        description: '当地美食和餐厅推荐',
        color: '#EF4444',
        icon: '🍽️',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'culture',
        name: '文化体验',
        slug: 'culture',
        description: '文化活动和体验分享',
        color: '#8B5CF6',
        icon: '🎭',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tips',
        name: '旅行贴士',
        slug: 'tips',
        description: '实用的旅行建议和技巧',
        color: '#10B981',
        icon: '💡',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'accommodation',
        name: '住宿推荐',
        slug: 'accommodation',
        description: '酒店和民宿推荐',
        color: '#F59E0B',
        icon: '🏨',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'transportation',
        name: '交通指南',
        slug: 'transportation',
        description: '交通方式和路线指南',
        color: '#6366F1',
        icon: '🚗',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'announcement',
        name: '公告',
        slug: 'announcement',
        description: '网站公告和重要通知',
        color: '#DC2626',
        icon: '📢',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(language: string): boolean {
    const expiry = this.cacheExpiry.get(language);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * 获取分类列表（带缓存）
   */
  public async getCategories(language: string = 'zh'): Promise<Category[]> {
    const cacheKey = language;
    
    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      const cached = this.categoriesCache.get(cacheKey);
      if (cached) {
        console.log('📦 CategoryManager: 使用缓存的分类数据');
        return cached;
      }
    }

    try {

      
      // 尝试从DataManager获取
      let categories: Category[];
      try {
        const apiCategories = await DataManager.getCategories(language);
        categories = apiCategories.map(cat => ({
          id: cat.id || cat.name,
          name: cat.name,
          slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          isActive: cat.isActive !== false,
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString()
        }));
      } catch (error) {
        console.warn('⚠️ CategoryManager: API获取失败，使用默认分类', error);
        categories = this.getDefaultCategories();
      }

      // 确保至少有基本分类
      if (categories.length === 0) {
        categories = this.getDefaultCategories();
      }

      // 更新缓存
      this.categoriesCache.set(cacheKey, categories);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);


      return categories;
    } catch (error) {
      console.error('❌ CategoryManager: 获取分类失败', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * 获取带博客数量的分类列表
   */
  public async getCategoriesWithCount(posts: any[], language: string = 'zh'): Promise<CategoryWithCount[]> {
    const categories = await this.getCategories(language);
    

    
    return categories.map(category => {
      // 改进的分类匹配逻辑，支持多种字段匹配方式
      const count = posts.filter(post => {
        // 确保 category.id 和 post.category_id 都转换为数字进行比较
        const categoryId = typeof category.id === 'string' ? parseInt(category.id) : category.id;
        const postCategoryId = typeof post.category_id === 'string' ? parseInt(post.category_id) : post.category_id;
        const postCategoryIdAlt = typeof post.categoryId === 'string' ? parseInt(post.categoryId) : post.categoryId;
        
        // 检查多种可能的分类字段
        const matches = (
          // 通过分类ID匹配（数字比较）
          (postCategoryId !== null && postCategoryId !== undefined && postCategoryId === categoryId) ||
          (postCategoryIdAlt !== null && postCategoryIdAlt !== undefined && postCategoryIdAlt === categoryId) ||
          // 通过分类名称匹配
          post.category === category.name ||
          post.category === category.slug ||
          // 通过分类slug匹配
          post.category_slug === category.slug ||
          // 字符串形式的ID匹配
          post.category_id === category.id ||
          post.categoryId === category.id ||
          post.category === category.id
        );
        
        return matches;
      }).length;

      return {
        ...category,
        count
      };
    }); // 返回所有分类，让调用方决定是否过滤
  }

  /**
   * 根据ID或名称查找分类
   */
  public async findCategory(identifier: string, language: string = 'zh'): Promise<Category | undefined> {
    const categories = await this.getCategories(language);
    return categories.find(cat => 
      cat.id === identifier || 
      cat.name === identifier || 
      cat.slug === identifier
    );
  }

  /**
   * 获取分类的显示名称
   */
  public async getCategoryDisplayName(identifier: string, language: string = 'zh'): Promise<string> {
    const category = await this.findCategory(identifier, language);
    return category ? category.name : identifier;
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.categoriesCache.clear();
    this.cacheExpiry.clear();
    console.log('🗑️ CategoryManager: 缓存已清除');
  }

  /**
   * 验证分类是否存在
   */
  public async validateCategory(identifier: string, language: string = 'zh'): Promise<boolean> {
    const category = await this.findCategory(identifier, language);
    return !!category && category.isActive;
  }

  /**
   * 获取分类的颜色
   */
  public async getCategoryColor(identifier: string, language: string = 'zh'): Promise<string> {
    const category = await this.findCategory(identifier, language);
    return category?.color || '#6B7280';
  }

  /**
   * 获取分类的图标
   */
  public async getCategoryIcon(identifier: string, language: string = 'zh'): Promise<string> {
    const category = await this.findCategory(identifier, language);
    return category?.icon || '📝';
  }
}

// 导出单例实例
export const categoryManager = CategoryManager.getInstance();