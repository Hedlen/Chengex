import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  FileText,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  Archive,
  Play
} from 'lucide-react';
import { Blog, ContentStatus, Category } from '../../../shared/types';
import { DataManager } from '../../../shared/api/dataManager';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ImageWithFallback from '../components/ui/ImageWithFallback';

// 分类翻译映射
const categoryTranslations: Record<string, string> = {
  'all': '全部',
  'tours': '旅游攻略',
  'culture': '文化体验',
  'food': '美食推荐',
  'tips': '旅行贴士',
  'scenery': '风景名胜',
  'life': '生活方式'
};

const BlogManagement: React.FC = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // 语言切换状态
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    status: 'draft' as ContentStatus,
    tags: '',
    featuredImage: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadBlogs(), loadCategories(), loadCategoryStats()]);
  };

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await DataManager.getBlogs();
      setBlogs(data);
    } catch (error) {
      console.error('Failed to load blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await DataManager.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const stats = await DataManager.getCategoryStats();
      setCategoryStats(stats);
    } catch (error) {
      console.error('Failed to load category stats:', error);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || blog.status === statusFilter;
    const matchesCategory = !categoryFilter || blog.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });



  const handleSelectBlog = (blogId: string) => {
    setSelectedBlogs(prev => 
      prev.includes(blogId) 
        ? prev.filter(id => id !== blogId)
        : [...prev, blogId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBlogs.length === filteredBlogs.length) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(filteredBlogs.map(blog => blog.id));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = '标题不能为空';
    }
    
    if (!formData.content.trim()) {
      errors.content = '内容不能为空';
    }
    
    if (!formData.category.trim()) {
      errors.category = '分类不能为空';
    }
    
    // 验证图片URL格式
    if (formData.featuredImage.trim()) {
      try {
        new URL(formData.featuredImage);
        if (!/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(formData.featuredImage)) {
          errors.featuredImage = '请输入有效的图片URL（支持jpg、png、gif、webp、svg格式）';
        }
      } catch {
        errors.featuredImage = '请输入有效的URL格式';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      status: 'draft',
      tags: '',
      featuredImage: ''
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // 根据分类名称找到对应的category_id
      const selectedCategory = categories.find(cat => cat.name === formData.category.trim());
      const categoryId = selectedCategory ? selectedCategory.id : undefined;
      
      const blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 200) + '...',
        author: 'Admin', // 默认作者
        category: formData.category.trim(), // 保留category字段用于兼容
        category_id: categoryId, // 添加category_id字段
        status: formData.status,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        featuredImage: formData.featuredImage.trim(),
        readTime: Math.ceil(formData.content.length / 1000), // 估算阅读时间
        viewCount: 0
      };

      if (editingBlog) {
        await DataManager.saveBlog({ ...blogData, id: editingBlog.id });
      } else {
        await DataManager.saveBlog(blogData);
      }

      await loadBlogs();
      await loadCategoryStats(); // 重新加载分类统计
      setShowAddModal(false);
      setEditingBlog(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save blog:', error);
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    
    // 根据 category_id 找到对应的分类名称
    const category = categories.find(cat => {
      const catId = typeof cat.id === 'string' ? parseInt(cat.id) : cat.id;
      const blogCatId = typeof blog.category_id === 'string' ? parseInt(blog.category_id) : blog.category_id;
      return catId === blogCatId;
    });
    
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category: category ? category.name : '',
      status: blog.status,
      tags: blog.tags.join(', '),
      featuredImage: blog.featuredImage || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (blogId: string) => {
    console.log('handleDelete 被调用，blogId:', blogId);
    
    // 添加加载状态
    setLoading(true);
    
    try {
      console.log('开始调用 DataManager.deleteBlog...');
      const result = await DataManager.deleteBlog(blogId);
      console.log('DataManager.deleteBlog 返回结果:', result);
      
      if (result.success) {
        console.log('删除成功，开始重新加载数据...');
        
        // 先关闭确认对话框
        setShowDeleteConfirm(null);
        
        // 重新加载数据
        await Promise.all([loadBlogs(), loadCategoryStats()]);
        
        console.log('数据重新加载完成');
        
        // 显示成功消息
        console.log('博客删除成功:', result.message);
      } else {
        console.error('删除博客失败:', result.error);
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete blog:', error);
      alert('删除失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchStatusUpdate = async (status: ContentStatus) => {
    try {
      for (const blogId of selectedBlogs) {
        const blog = blogs.find(b => b.id === blogId);
        if (blog) {
          await DataManager.saveBlog({ ...blog, status });
        }
      }
      await loadBlogs();
      setSelectedBlogs([]);
    } catch (error) {
      console.error('Failed to update blog status:', error);
    }
  };

  const handleBatchDelete = async () => {
    try {
      let failedCount = 0;
      for (const blogId of selectedBlogs) {
        const result = await DataManager.deleteBlog(blogId);
        if (!result.success) {
          console.error('删除博客失败:', blogId, result.error);
          failedCount++;
        }
      }
      
      await loadBlogs();
      await loadCategoryStats(); // 重新加载分类统计
      setSelectedBlogs([]);
      
      if (failedCount > 0) {
        alert(`批量删除完成，但有 ${failedCount} 个博客删除失败`);
      } else {
        console.log('批量删除成功');
      }
    } catch (error) {
      console.error('Failed to delete blogs:', error);
      alert('批量删除失败: ' + (error as Error).message);
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    const statusConfig = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-800' },
      published: { label: '已发布', className: 'bg-green-100 text-green-800' },
      archived: { label: '已归档', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">博客管理</h1>
            <p className="text-gray-600">管理旅游博客文章内容</p>
          </div>
          
          {/* 语言切换器 */}
          <div className="flex bg-white rounded-lg border p-1 shadow-sm">
            <button
              onClick={() => setCurrentLanguage('zh')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentLanguage === 'zh' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setCurrentLanguage('en')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentLanguage === 'en' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索文章标题或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              options={[
                { value: '', label: '全部状态' },
                { value: 'draft', label: '草稿' },
                { value: 'published', label: '已发布' },
                { value: 'archived', label: '已归档' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContentStatus | '')}
              className="w-full sm:w-40"
            />
            
            <Select
              options={[
                { value: '', label: '全部分类' },
                ...categories.map(cat => ({ 
                  value: cat.name, 
                  label: `${cat.name} (${categoryStats[cat.name] || 0})` 
                }))
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
          
          <Button onClick={() => navigate('/blogs/editor')}>
            <Plus className="h-4 w-4 mr-2" />
            创建文章
          </Button>
        </div>

        {/* 批量操作 */}
        {selectedBlogs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                已选择 {selectedBlogs.length} 篇文章
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBatchStatusUpdate('published')}
                >
                  <Play className="h-4 w-4 mr-1" />
                  批量发布
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBatchStatusUpdate('archived')}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  批量归档
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  批量删除
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 博客列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无博客文章</p>
            <Button className="mt-4" onClick={() => navigate('/blogs/editor')}>
              创建第一篇文章
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectedBlogs.length === filteredBlogs.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    文章信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBlogs.map((blog, index) => (
                    <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleSelectBlog(blog.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedBlogs.includes(blog.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start">
                        <ImageWithFallback
                          src={blog.featuredImage}
                          alt={blog.title}
                          className="h-16 w-24 object-cover rounded mr-4 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {currentLanguage === 'zh' 
                              ? blog.title 
                              : (blog.title_en || blog.title)
                            }
                            {currentLanguage === 'en' && !blog.title_en && (
                              <span className="ml-2 text-xs text-orange-500">(未翻译)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {truncateText(
                              currentLanguage === 'zh' 
                                ? blog.excerpt 
                                : (blog.excerpt_en || blog.excerpt), 
                              100
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              阅读时间: {blog.readTime}分钟
                            </span>
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              浏览: {blog.viewCount || 0}
                            </span>
                          </div>
                          {blog.tags.length > 0 && (
                            <div className="mt-2">
                              {blog.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-1"
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </span>
                              ))}
                              {blog.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{blog.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                        {(() => {
                          if (!blog.category_id) return '未分类';
                          
                          // 支持数字和字符串类型的ID匹配
                          const category = categories.find(cat => {
                            const catId = typeof cat.id === 'string' ? parseInt(cat.id) : cat.id;
                            const blogCatId = typeof blog.category_id === 'string' ? parseInt(blog.category_id) : blog.category_id;
                            return catId === blogCatId;
                          });
                          
                          if (category) {
                            // 根据当前语言显示分类名称
                            return currentLanguage === 'en' && category.name_en 
                              ? category.name_en 
                              : category.name;
                          }
                          
                          return categoryTranslations[blog.category] || blog.category || '未知分类';
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(blog.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {(() => {
                        try {
                          const date = new Date(blog.createdAt);
                          if (isNaN(date.getTime())) {
                            console.warn('Invalid date for blog:', blog.id, blog.createdAt);
                            return '日期无效';
                          }
                          return date.toLocaleDateString('zh-CN');
                        } catch (error) {
                          console.error('Date parsing error for blog:', blog.id, error);
                          return '日期错误';
                        }
                      })()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/blogs/editor/${blog.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setShowDeleteConfirm(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 添加/编辑博客模态框 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingBlog(null);
          resetForm();
        }}
        title={editingBlog ? '编辑文章' : '创建文章'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="文章标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={formErrors.title}
            placeholder="请输入文章标题"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="分类"
              options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              error={formErrors.category}
              placeholder="选择分类"
            />
            
            <Select
              label="状态"
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'published', label: '已发布' },
                { value: 'archived', label: '已归档' }
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
            />
          </div>
          
          <div>
            <Input
              label="特色图片URL"
              value={formData.featuredImage}
              onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
              helperText="可选，用于文章封面展示"
              error={formErrors.featuredImage}
            />
            {formData.featuredImage && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图片预览
                </label>
                <ImageWithFallback
                  src={formData.featuredImage}
                  alt="图片预览"
                  className="h-32 w-48 object-cover rounded border"
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              文章摘要
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="简短描述文章内容（可选，如不填写将自动生成）"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              文章内容 *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="请输入文章内容..."
            />
            {formErrors.content && (
              <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>
            )}
          </div>
          
          <Input
            label="标签"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="用逗号分隔多个标签"
            helperText="例如：旅游攻略,美食,住宿"
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingBlog(null);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button type="submit">
              {editingBlog ? '更新' : '创建'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要删除这篇文章吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                console.log('取消删除按钮被点击');
                setShowDeleteConfirm(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                console.log('删除确认按钮被点击，showDeleteConfirm:', showDeleteConfirm);
                if (showDeleteConfirm) {
                  console.log('调用 handleDelete，blogId:', showDeleteConfirm);
                  handleDelete(showDeleteConfirm);
                } else {
                  console.log('❌ showDeleteConfirm 为空，无法删除');
                }
              }}
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BlogManagement;