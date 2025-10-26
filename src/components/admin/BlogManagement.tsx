import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Save, X, FileText, Calendar, Tag, User, AlertCircle, CheckCircle, Folder } from 'lucide-react';
import { useBlog, BlogPost } from '../../contexts/BlogContext';
import { useTranslation } from 'react-i18next';
import { categoryManager, Category } from '../../utils/categoryManager';
import { realTimeAnalytics, AnalyticsEvent } from '../../services/realTimeAnalytics';
import i18n from '../../i18n';

const BlogManagement = () => {
  const { t } = useTranslation();
  const { posts, addPost, updatePost, deletePost, publishPost, unpublishPost } = useBlog();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [realTimeStats, setRealTimeStats] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    category: 'tours',
    tags: '',
    thumbnail: ''
  });

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await categoryManager.getCategories(i18n.language);
        setCategories(categoriesData.filter(cat => cat.isActive));
        console.log('📦 BlogManagement: 加载分类数据成功', categoriesData);
      } catch (error) {
        console.error('❌ BlogManagement: 加载分类数据失败', error);
      }
    };

    loadCategories();
  }, [i18n.language]);

  // 订阅实时分析事件
  useEffect(() => {
    const handleAnalyticsEvent = (event: AnalyticsEvent) => {
      if (event.type === 'view_increment' || event.type === 'stats_refresh') {
        setRealTimeStats(prev => ({
          ...prev,
          [event.blogId]: event.data.viewCount || event.data.views || 0
        }));
      }
    };

    const unsubscribe = realTimeAnalytics.subscribeGlobal(handleAnalyticsEvent);

    return () => {
      unsubscribe();
    };
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (formData.title.length < 5) {
      newErrors.title = '标题至少需要5个字符';
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '内容不能为空';
    } else if (formData.content.length < 50) {
      newErrors.content = '内容至少需要50个字符';
    }
    
    if (!formData.author.trim()) {
      newErrors.author = '作者不能为空';
    } else if (formData.author.length < 2) {
      newErrors.author = '作者姓名至少需要2个字符';
    }

    if (formData.excerpt && formData.excerpt.length > 200) {
      newErrors.excerpt = '摘要不能超过200个字符';
    }

    if (formData.thumbnail && !isValidUrl(formData.thumbnail)) {
      newErrors.thumbnail = '请输入有效的URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      author: post.author,
      category: post.category,
      tags: post.tags.join(', '),
      thumbnail: post.thumbnail || ''
    });
    setIsEditing(true);
    setErrors({});
    setSuccessMessage('');
  };

  const handleAdd = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      author: '',
      category: 'tours',
      tags: '',
      thumbnail: ''
    });
    setIsEditing(true);
    setErrors({});
    setSuccessMessage('');
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        author: formData.author.trim(),
        date: new Date().toLocaleDateString('zh-CN'),
        status: 'draft' as const,
        viewCount: editingPost?.viewCount || 0,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        thumbnail: formData.thumbnail.trim() || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(formData.title + ' ' + formData.category)}&image_size=landscape_16_9`
      };

      if (editingPost) {
        updatePost(editingPost.id, postData);
        showSuccess('文章更新成功！');
      } else {
        addPost(postData);
        showSuccess('文章创建成功！');
      }

      setIsEditing(false);
      setEditingPost(null);
    } catch (error) {
      setErrors({ general: '保存失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingPost(null);
    setErrors({});
    setSuccessMessage('');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('确定要删除这篇文章吗？此操作无法撤销。')) {
      deletePost(id);
      showSuccess('文章删除成功！');
    }
  };

  const handleToggleStatus = (post: BlogPost) => {
    if (post.status === 'published') {
      unpublishPost(post.id);
      showSuccess('文章已取消发布！');
    } else {
      publishPost(post.id);
      showSuccess('文章发布成功！');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingPost ? '编辑文章' : '新建文章'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {isLoading ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              取消
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{errors.general}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文章标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="请输入文章标题"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作者 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.author ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="请输入作者姓名"
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.author}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">选择文章所属的分类</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入标签，用逗号分隔"
                />
                <p className="mt-1 text-xs text-gray-500">用逗号分隔多个标签，例如：旅游, 美食, 攻略</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  缩略图URL
                </label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.thumbnail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="留空将自动生成"
                />
                {errors.thumbnail && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.thumbnail}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文章摘要
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.excerpt ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="请输入文章摘要"
                  maxLength={200}
                />
                {errors.excerpt && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.excerpt}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">{formData.excerpt.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文章内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={12}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="请输入文章内容"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.content}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">至少需要50个字符，当前：{formData.content.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">博客管理</h2>
        <button
          onClick={handleAdd}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新建文章
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {post.thumbnail && (
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Blog%20post%20placeholder&image_size=landscape_16_9';
                }}
              />
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {post.status === 'published' ? '已发布' : '草稿'}
                </span>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {realTimeStats[post.id.toString()] || post.viewCount || 0}
                  </span>
                  {realTimeStats[post.id.toString()] && realTimeStats[post.id.toString()] !== post.viewCount && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-1">
                      实时
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {post.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
                <Calendar className="h-4 w-4 ml-2" />
                <span>{post.date}</span>
                {/* 隐藏 culture 和 travel-guide 分类标签 */}
                {(() => {
                  const categoryName = categories.find(cat => cat.id === post.category || cat.name === post.category)?.name || post.category;
                  if (categoryName === 'culture' || categoryName === 'travel-guide') {
                    return null;
                  }
                  return (
                    <>
                      <Folder className="h-4 w-4 ml-2" />
                      <span>{categoryName}</span>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{post.tags.length - 2}</span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {post.excerpt || post.content}
              </p>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(post)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    post.status === 'published'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {post.status === 'published' ? '取消发布' : '发布'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文章</h3>
          <p className="text-gray-500 mb-4">开始创建您的第一篇博客文章</p>
          <button
            onClick={handleAdd}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            新建文章
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;