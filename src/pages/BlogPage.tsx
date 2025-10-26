import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag, User, Search, ArrowRight, Eye, Heart } from 'lucide-react';
import { useBlog } from '../contexts/BlogContext';
import { usePageTracking } from '../hooks/usePageTracking';
import { categoryManager, CategoryWithCount } from '../utils/categoryManager';

const BlogPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { getPublishedPosts, loading: blogLoading, error: blogError } = useBlog();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 页面追踪
  usePageTracking(t('blog.hero.title'));

  const publishedPosts = getPublishedPosts();

  // 获取分类数据（包含博客数量统计）
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        console.log('🔍 BlogPage: 开始加载分类数据，语言:', i18n.language);
        
        // 如果BlogContext还在加载，等待一下
        if (blogLoading) {
          console.log('⏳ BlogPage: BlogContext还在加载中，等待博客数据...');
          setCategoriesLoading(false);
          return;
        }
        
        // 清除缓存以获取最新的分类数据
        categoryManager.clearCache();
        
        // 使用CategoryManager获取带计数的分类，使用当前语言设置
        const categoriesWithCount = await categoryManager.getCategoriesWithCount(publishedPosts, i18n.language);
        
        // 添加"全部"分类
        const allCategories = [
          { 
            id: 'all',
            name: t('blog.categories.all'),
            slug: 'all',
            count: publishedPosts.length,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            color: '#6B7280',
            icon: '📚'
          },
          ...categoriesWithCount.filter(cat => cat.isActive && cat.count > 0)
        ];
        setCategories(allCategories);
      } catch (error) {
        console.error('❌ BlogPage: 加载分类失败:', error);
        // 设置默认的"全部"分类
        setCategories([{
          id: 'all',
          name: t('blog.categories.all'),
          slug: 'all',
          count: publishedPosts.length,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          color: '#6B7280',
          icon: '📚'
        }]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [i18n.language, t, blogLoading, publishedPosts.length]); // 只依赖语言、翻译函数、加载状态和博客数量

  const filteredPosts = useMemo(() => {
    return publishedPosts.filter(post => {
      // 改进的分类匹配逻辑
      const matchesCategory = selectedCategory === 'all' || (() => {
        const selectedCat = categories.find(cat => cat.id === selectedCategory);
        if (!selectedCat) return false;
        
        // 支持多种分类字段匹配方式
        return (
          post.category === selectedCat.name ||
          post.category === selectedCat.id ||
          post.category === selectedCat.slug ||
          post.category_id === selectedCat.id ||
          // 数字类型的ID匹配
          (typeof post.category_id === 'string' && parseInt(post.category_id) === parseInt(selectedCat.id)) ||
          (typeof post.category_id === 'number' && post.category_id === parseInt(selectedCat.id))
        );
      })();
      
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [publishedPosts, selectedCategory, categories, searchTerm]);

  const featuredPost = publishedPosts[0];

  // 总的loading状态：BlogContext加载中 或 分类加载中
  const isLoading = blogLoading || categoriesLoading;

  // 如果有错误，显示错误信息
  if (blogError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">加载失败</h1>
          <p className="text-text-secondary mb-6">{blogError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-text-primary mb-6 animate-fade-in">
              {t('blog.hero.title')}
            </h1>
            <p className="text-xl text-text-secondary mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {t('blog.hero.subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
              <input
                type="text"
                placeholder={t('blog.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && !isLoading && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  {t('blog.featured.title')}
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="animate-slide-up">
                  <div className="relative overflow-hidden rounded-2xl">
                    <img
                      src={featuredPost.thumbnail || featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Featured%20blog%20post%20placeholder&image_size=landscape_16_9';
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-accent-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {t('blog.labels.featured')}
                    </div>
                  </div>
                </div>
                
                <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                      {featuredPost.category || t('blog.categories.uncategorized')}
                    </span>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{featuredPost.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{featuredPost.readTime || 5}{t('blog.labels.readTime')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-text-primary mb-4">
                    {featuredPost.title}
                  </h3>
                  
                  <p className="text-text-secondary mb-6 leading-relaxed">
                    {featuredPost.excerpt || featuredPost.content.substring(0, 150) + '...'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-text-secondary" />
                      <span className="text-sm text-text-secondary">{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        <span>{featuredPost.viewCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/blog/${featuredPost.id}`)}
                    className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                  >
                    {t('blog.labels.readFull')}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories and Posts */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Categories Filter */}
            <div className="flex flex-wrap gap-3 mb-12 justify-center">
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                  {t('common.loading')}
                </div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'bg-primary-500 text-white shadow-lg transform scale-105'
                        : 'bg-white text-text-primary hover:bg-primary-50 hover:shadow-md hover:transform hover:scale-102'
                    }`}
                    style={{
                      borderColor: selectedCategory === category.id ? category.color : 'transparent',
                      borderWidth: '2px'
                    }}
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span>{category.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedCategory === category.id 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-gray-100'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Posts Grid */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {t('common.loading')}
                </h3>
                <p className="text-text-secondary">
                  正在加载博客内容...
                </p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {t('blog.labels.noArticles')}
                </h3>
                <p className="text-text-secondary">
                  {t('blog.labels.noArticlesDesc')}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.thumbnail || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Blog%20post%20placeholder&image_size=landscape_16_9'}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Blog%20post%20placeholder&image_size=landscape_16_9';
                        }}
                      />
                      {/* 隐藏 culture 和 travel-guide 分类标签 */}
                      {(() => {
                        const category = categories.find(cat => 
                          cat.id === post.category || 
                          cat.name === post.category ||
                          cat.id === post.category_id ||
                          (typeof post.category_id === 'string' && parseInt(post.category_id) === parseInt(cat.id))
                        );
                        const categoryName = category 
                          ? category.name
                          : (post.category || t('blog.categories.uncategorized'));
                        
                        // 隐藏 culture 和 travel-guide 分类标签
                        if (categoryName === 'culture' || categoryName === 'travel-guide') {
                          return null;
                        }
                        
                        const categoryIcon = category?.icon || '📝';
                        
                        return (
                          <div className="absolute top-4 right-4 flex items-center gap-1 bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                            <span>{categoryIcon}</span>
                            <span>{categoryName}</span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-3 text-sm text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{post.readTime || 5}{t('blog.labels.readTime')}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-text-primary mb-3 line-clamp-2">
                        {i18n.language === 'en' 
                          ? (post.title_en || post.title)
                          : post.title
                        }
                        {i18n.language === 'en' && !post.title_en && (
                          <span className="ml-2 text-xs text-orange-500">(未翻译)</span>
                        )}
                      </h3>
                      
                      <p className="text-text-secondary mb-4 line-clamp-3 leading-relaxed">
                        {i18n.language === 'en' 
                          ? (post.excerpt_en || post.excerpt || (post.content_en || post.content).substring(0, 120) + '...')
                          : (post.excerpt || post.content.substring(0, 120) + '...')
                        }
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-text-secondary" />
                          <span className="text-sm text-text-secondary">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                          <div className="flex items-center gap-1">
                            <Eye size={14} />
                            <span>{post.viewCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{post.readTime || 5}{t('blog.labels.readTime')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/blog/${post.id}`);
                        }}
                        className="w-full mt-4 text-primary-600 hover:text-primary-700 font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        {t('blog.labels.readMore')}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {filteredPosts.length > 0 && !isLoading && (
              <div className="text-center mt-12">
                <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
                  {t('blog.labels.loadMore')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-secondary-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('blog.newsletter.title')}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              {t('blog.newsletter.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t('blog.newsletter.placeholder')}
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white outline-none"
              />
              <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-neutral-50 transition-all duration-300 hover:scale-105">
                {t('blog.newsletter.subscribe')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;