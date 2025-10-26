import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, User, Eye, ArrowLeft, Tag } from 'lucide-react';
import { useBlog } from '../contexts/BlogContext';
import { CommentProvider } from '../contexts/CommentContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CommentSection from '../components/CommentSection';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useReadingTime } from '@/hooks/useReadingTime';

const BlogDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPostById, incrementViewCount } = useBlog();

  const post = id ? getPostById(id) : null;
  
  // 页面追踪 - 记录博客详情页面访问
  usePageTracking(post ? `${t('blog.detail.title')} - ${post.title}` : t('blog.detail.title'));

  // 阅读时间追踪
  const { readingData, getReadingStats, isTracking } = useReadingTime(id || '', {
    contentSelector: '.prose, .article-content',
    minReadingTime: 15, // 最少15秒才算有效阅读
    scrollThreshold: 20 // 滚动超过20%开始追踪
  });

  // 增加浏览量
  useEffect(() => {
    console.log('BlogDetailPage: useEffect triggered', { post: !!post, id, postId: post?.id });
    if (post && id) {
      console.log('BlogDetailPage: Calling incrementViewCount for blog', id);
      incrementViewCount(id);
    }
  }, [post, id, incrementViewCount]);

  // 直接显示分类名称，不再使用翻译键

  if (!post) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">{t('blog.notFound.title')}</h1>
          <p className="text-text-secondary mb-6">{t('blog.notFound.description')}</p>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            <ArrowLeft size={16} />
            {t('blog.notFound.backToBlog')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <CommentProvider>
      <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8 transition-colors"
            >
              <ArrowLeft size={16} />
              {t('blog.notFound.backToBlog')}
            </button>

            {/* Article Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* 隐藏 culture 和 travel-guide 分类标签和草稿标签 */}
                {post.category && post.category !== 'culture' && post.category !== 'travel-guide' && (
                  <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                    {post.category || t('blog.categories.uncategorized')}
                  </span>
                )}
                {/* 草稿标签已隐藏 */}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
                {i18n.language === 'en' 
                  ? (post.title_en || post.title)
                  : post.title
                }
                {i18n.language === 'en' && !post.title_en && (
                  <span className="ml-2 text-xs text-orange-500">(未翻译)</span>
                )}
              </h1>

              <div className="flex items-center justify-center gap-6 text-text-secondary">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{post.readTime || 5}{t('blog.labels.readTime')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  <span>{post.viewCount.toLocaleString()} {t('blog.labels.views')}</span>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative overflow-hidden rounded-2xl mb-12">
              <img
                src={post.thumbnail || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Blog%20post%20featured%20image&image_size=landscape_16_9'}
                alt={post.title}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Blog%20post%20featured%20image&image_size=landscape_16_9';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              {/* Article Excerpt */}
              {(i18n.language === 'en' ? (post.excerpt_en || post.excerpt) : post.excerpt) && (
                <div className="text-xl text-text-secondary leading-relaxed mb-8 p-6 bg-neutral-50 rounded-lg border-l-4 border-primary-500">
                  {i18n.language === 'en' 
                    ? (post.excerpt_en || post.excerpt)
                    : post.excerpt
                  }
                </div>
              )}

              {/* Article Content */}
              <div className="prose prose-lg max-w-none article-content">
                <MarkdownRenderer content={
                  i18n.language === 'en' 
                    ? (post.content_en || post.content)
                    : post.content
                } />
              </div>

              {/* Tags */}
              {(() => {
                const currentTags = i18n.language === 'en' 
                  ? (post.tags_en && post.tags_en.length > 0 ? post.tags_en : post.tags)
                  : post.tags;
                
                return currentTags && currentTags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-neutral-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Tag size={16} className="text-text-secondary" />
                      <span className="text-sm font-medium text-text-secondary">
                        {i18n.language === 'en' ? 'Tags' : '标签'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentTags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
               })()}

              {/* Article Footer */}
              <div className="mt-12 pt-8 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{post.author}</h4>
                      <p className="text-sm text-text-secondary">旅行博主</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-secondary">发布于</p>
                    <p className="font-medium text-text-primary">{post.date}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-12 text-center">
              <button
                onClick={() => navigate('/blog')}
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft size={16} />
                返回博客列表
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comment Section */}
      <CommentSection blogId={post.id} />
      </div>
    </CommentProvider>
  );
};

export default BlogDetailPage;