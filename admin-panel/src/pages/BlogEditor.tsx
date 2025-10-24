import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Settings, 
  Image as ImageIcon,
  FileText,
  Clock,
  Tag,
  Folder,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import MarkdownEditor from '../components/ui/MarkdownEditor';
import ImageUpload from '../components/ui/ImageUpload';
import ImageCrop from '../components/ui/ImageCrop';
import TableOfContents from '../components/ui/TableOfContents';
import TextFormatter from '../components/ui/TextFormatter';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { cn } from '../utils/cn';
import { DataManager } from '../../../shared/api/dataManager';
import { Blog, Category, ContentStatus } from '../../../shared/types';

interface BlogPost {
  id?: string;
  title: string;
  content: string;
  excerpt: string;
  // 英文字段
  title_en?: string;
  content_en?: string;
  excerpt_en?: string;
  featuredImage: string;
  category: string;
  tags: string[];
  tags_en?: string[];
  status: ContentStatus;
  readTime: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Draft {
  id: string;
  title: string;
  content: string;
  savedAt: string;
  isAutoSave: boolean;
}

const BlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // 博客文章状态
  const [blogPost, setBlogPost] = useState<BlogPost>({
    title: '',
    content: '',
    excerpt: '',
    title_en: '',
    content_en: '',
    excerpt_en: '',
    featuredImage: '',
    category: '',
    tags: [],
    tags_en: [],
    status: 'draft',
    readTime: 0,
    viewCount: 0
  });

  // UI状态
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [tagInput, setTagInput] = useState('');
  
  // 语言切换状态
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh');

  // 计算语言完成度
  const languageCompleteness = useMemo(() => {
    const zhComplete = !!(blogPost.title && blogPost.content);
    const enComplete = !!(blogPost.title_en && blogPost.content_en);
    return { zh: zhComplete, en: enComplete };
  }, [blogPost.title, blogPost.content, blogPost.title_en, blogPost.content_en]);

  // 草稿状态
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 分类选项
  const [categories, setCategories] = useState<Category[]>([]);

  // 计算阅读时间（基于字数）
  const readTime = useMemo(() => {
    const wordsPerMinute = 200;
    const words = blogPost.content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }, [blogPost.content]);

  // 生成摘要
  const generateExcerpt = useCallback((content: string) => {
    const plainText = content
      .replace(/[#*`_~\[\]()]/g, '') // 移除markdown符号
      .replace(/\n+/g, ' ') // 替换换行为空格
      .trim();
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  }, []);

  // 自动生成目录
  const generateTableOfContents = useCallback((content: string) => {
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    return headings.map((heading, index) => {
      const level = heading.match(/^#+/)?.[0].length || 1;
      const text = heading.replace(/^#+\s+/, '');
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return { level, text, id, index };
    });
  }, []);

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await DataManager.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    };
    loadCategories();
  }, []);

  // 加载博客文章数据
  useEffect(() => {
    if (isEditing && id) {
      const loadBlog = async () => {
        setIsLoading(true);
        try {
          const blog = await DataManager.getBlog(id);
          if (blog) {
            setBlogPost({
              id: blog.id,
              title: blog.title,
              content: blog.content,
              excerpt: blog.excerpt,
              title_en: blog.title_en || '',
              content_en: blog.content_en || '',
              excerpt_en: blog.excerpt_en || '',
              featuredImage: blog.featuredImage || '',
              category: blog.category,
              tags: blog.tags,
              tags_en: blog.tags_en || [],
              status: blog.status,
              readTime: blog.readTime || 0,
              viewCount: blog.viewCount || 0,
              createdAt: blog.createdAt,
              updatedAt: blog.updatedAt
            });
          } else {
            // 博客不存在，重定向到博客管理页面
            navigate('/blogs');
          }
        } catch (error) {
          console.error('加载博客失败:', error);
          navigate('/blogs');
        } finally {
          setIsLoading(false);
        }
      };
      loadBlog();
    }
  }, [isEditing, id, navigate]);

  // 自动保存
  const autoSave = useCallback(async () => {
    if (!blogPost.title.trim() && !blogPost.content.trim()) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // 这里应该调用API保存草稿
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      
      // 添加到草稿列表
      const newDraft: Draft = {
        id: Date.now().toString(),
        title: blogPost.title || '无标题',
        content: blogPost.content,
        savedAt: new Date().toISOString(),
        isAutoSave: true
      };
      setDrafts(prev => [newDraft, ...prev.slice(0, 9)]); // 保留最近10个草稿
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [blogPost.title, blogPost.content]);

  // 手动保存
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // 更新阅读时间和摘要
      const updatedPost = {
        ...blogPost,
        readTime,
        excerpt: blogPost.excerpt || generateExcerpt(blogPost.content),
        updatedAt: new Date().toISOString()
      };

      // 转换为Blog类型并保存
      const blogData: Blog = {
        id: updatedPost.id || '', // 不为新博客生成临时ID，让服务器分配
        title: updatedPost.title,
        content: updatedPost.content,
        excerpt: updatedPost.excerpt,
        title_en: updatedPost.title_en,
        content_en: updatedPost.content_en,
        excerpt_en: updatedPost.excerpt_en || (updatedPost.content_en ? generateExcerpt(updatedPost.content_en) : ''),
        author: 'Admin', // 默认作者
        featuredImage: updatedPost.featuredImage,
        category: updatedPost.category,
        tags: updatedPost.tags,
        tags_en: updatedPost.tags_en,
        status: updatedPost.status,
        readTime: updatedPost.readTime,
        viewCount: updatedPost.viewCount || 0,
        createdAt: updatedPost.createdAt || new Date().toISOString(),
        updatedAt: updatedPost.updatedAt
      };

      const result = await DataManager.saveBlog(blogData);
      
      if (result.success) {
        // 如果是新创建的博客，使用服务器返回的ID
        const savedBlogId = result.data?.id || blogData.id;
        setBlogPost({ ...updatedPost, id: savedBlogId });
        setLastSaved(new Date());
        setSaveStatus('saved');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('保存失败:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [blogPost, readTime, generateExcerpt]);

  // 发布文章
  const handlePublish = useCallback(async () => {
    if (!blogPost.title.trim() || !blogPost.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    setIsSaving(true);
    try {
      const publishedPost = {
        ...blogPost,
        status: 'published' as ContentStatus,
        readTime,
        excerpt: blogPost.excerpt || generateExcerpt(blogPost.content),
        updatedAt: new Date().toISOString()
      };

      // 转换为Blog类型并保存
      const blogData: Blog = {
        id: publishedPost.id || '', // 不为新博客生成临时ID，让服务器分配
        title: publishedPost.title,
        content: publishedPost.content,
        excerpt: publishedPost.excerpt,
        title_en: publishedPost.title_en,
        content_en: publishedPost.content_en,
        excerpt_en: publishedPost.excerpt_en || (publishedPost.content_en ? generateExcerpt(publishedPost.content_en) : ''),
        author: 'Admin', // 默认作者
        featuredImage: publishedPost.featuredImage,
        category: publishedPost.category,
        tags: publishedPost.tags,
        status: publishedPost.status,
        readTime: publishedPost.readTime,
        viewCount: publishedPost.viewCount || 0,
        createdAt: publishedPost.createdAt || new Date().toISOString(),
        updatedAt: publishedPost.updatedAt
      };

      const result = await DataManager.saveBlog(blogData);
      
      if (result.success) {
        // 如果是新创建的博客，使用服务器返回的ID
        const savedBlogId = result.data?.id || blogData.id;
        setBlogPost({ ...publishedPost, id: savedBlogId });
        alert('文章发布成功！');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [blogPost, readTime, generateExcerpt]);

  // 处理图片上传
  const handleImageUpload = useCallback((url: string) => {
    setBlogPost(prev => ({ ...prev, featuredImage: url }));
  }, []);

  const handleImageCrop = useCallback(async (file: File) => {
    try {
      // 将文件转换为Base64编码，避免使用blob URL
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCropImageSrc(reader.result);
          setShowImageCrop(true);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('文件读取失败:', error);
    }
  }, []);

  const handleCropComplete = useCallback((croppedUrl: string) => {
    setBlogPost(prev => ({ ...prev, featuredImage: croppedUrl }));
    setShowImageCrop(false);
    setCropImageSrc('');
  }, []);

  // 处理标签
  const handleAddTag = useCallback(() => {
    if (tagInput.trim()) {
      const currentTags = currentLanguage === 'zh' ? blogPost.tags : (blogPost.tags_en || []);
      if (!currentTags.includes(tagInput.trim())) {
        setBlogPost(prev => ({
          ...prev,
          [currentLanguage === 'zh' ? 'tags' : 'tags_en']: [...currentTags, tagInput.trim()]
        }));
        setTagInput('');
      }
    }
  }, [tagInput, blogPost.tags, blogPost.tags_en, currentLanguage]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const currentTags = currentLanguage === 'zh' ? blogPost.tags : (blogPost.tags_en || []);
    setBlogPost(prev => ({
      ...prev,
      [currentLanguage === 'zh' ? 'tags' : 'tags_en']: currentTags.filter(tag => tag !== tagToRemove)
    }));
  }, [blogPost.tags, blogPost.tags_en, currentLanguage]);

  const handleTagInputKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/blogs')}
            className="flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" />
            返回
          </Button>
          
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-500" />
            <h1 className="text-xl font-semibold">
              {isEditing ? '编辑文章' : '新建文章'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 保存状态指示器 */}
          {saveStatus && (
            <div className={cn(
              'flex items-center space-x-1 text-sm px-2 py-1 rounded',
              saveStatus === 'saving' && 'text-blue-600 bg-blue-50',
              saveStatus === 'saved' && 'text-green-600 bg-green-50',
              saveStatus === 'error' && 'text-red-600 bg-red-50'
            )}>
              {saveStatus === 'saving' && <Clock size={14} className="animate-spin" />}
              {saveStatus === 'saved' && <CheckCircle size={14} />}
              {saveStatus === 'error' && <AlertCircle size={14} />}
              <span>
                {saveStatus === 'saving' && '保存中...'}
                {saveStatus === 'saved' && '已保存'}
                {saveStatus === 'error' && '保存失败'}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={16} />
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center"
          >
            <Save size={16} className="mr-1" />
            保存
          </Button>

          <Button
            onClick={handlePublish}
            disabled={isSaving || !blogPost.title.trim() || !blogPost.content.trim()}
            className="flex items-center bg-green-600 hover:bg-green-700"
          >
            <Eye size={16} className="mr-1" />
            发布
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 主编辑区域 */}
        <div className="flex-1 flex flex-col">
          {/* 文章基本信息 */}
          <div className="p-4 border-b bg-gray-50 space-y-4">
            {/* 语言切换器 */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">编辑语言</h3>
              <div className="flex bg-white rounded-lg border p-1">
                <button
                  onClick={() => setCurrentLanguage('zh')}
                  className={cn(
                    'px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1',
                    currentLanguage === 'zh' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  <span>中文</span>
                  {languageCompleteness.zh && (
                    <CheckCircle size={12} className="text-green-400" />
                  )}
                </button>
                <button
                  onClick={() => setCurrentLanguage('en')}
                  className={cn(
                    'px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1',
                    currentLanguage === 'en' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  <span>English</span>
                  {languageCompleteness.en && (
                    <CheckCircle size={12} className="text-green-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 标题输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {currentLanguage === 'zh' ? '文章标题' : 'Article Title'}
              </label>
              <Input
                placeholder={currentLanguage === 'zh' ? "请输入文章标题..." : "Enter article title..."}
                value={currentLanguage === 'zh' ? blogPost.title : (blogPost.title_en || '')}
                onChange={(e) => setBlogPost(prev => ({ 
                  ...prev, 
                  [currentLanguage === 'zh' ? 'title' : 'title_en']: e.target.value 
                }))}
                className="text-lg font-medium"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={blogPost.category}
                onChange={(e) => setBlogPost(prev => ({ ...prev, category: e.target.value }))}
                options={[
                  { value: '', label: '选择分类' },
                  ...categories.map(category => ({ 
                    value: category.name, 
                    label: category.name 
                  }))
                ]}
              />

              <Select
                value={blogPost.status}
                onChange={(e) => setBlogPost(prev => ({ ...prev, status: e.target.value as ContentStatus }))}
                options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'published', label: '已发布' },
                  { value: 'archived', label: '已归档' }
                ]}
              />
            </div>

            {/* 标签输入 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder={currentLanguage === 'zh' ? "添加标签..." : "Add tags..."}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleAddTag} size="sm">
                  <Tag size={14} className="mr-1" />
                  {currentLanguage === 'zh' ? '添加' : 'Add'}
                </Button>
              </div>
              
              {((currentLanguage === 'zh' ? blogPost.tags : blogPost.tags_en) || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(currentLanguage === 'zh' ? blogPost.tags : blogPost.tags_en || []).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Markdown编辑器 */}
          <div className="flex-1 p-4">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                {currentLanguage === 'zh' ? '文章内容' : 'Article Content'}
              </label>
            </div>
            <MarkdownEditor
              value={currentLanguage === 'zh' ? blogPost.content : (blogPost.content_en || '')}
              onChange={(content) => setBlogPost(prev => ({ 
                ...prev, 
                [currentLanguage === 'zh' ? 'content' : 'content_en']: content 
              }))}
              onSave={autoSave}
              height={600}
              autoSave={true}
              autoSaveInterval={30000}
            />
          </div>
        </div>

        {/* 侧边栏 */}
        {showSettings && (
          <div className="w-80 border-l bg-white p-4 space-y-6 overflow-y-auto">
            {/* 封面图片 */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center">
                <ImageIcon size={16} className="mr-2" />
                封面图片
              </h3>
              <ImageUpload
                value={blogPost.featuredImage}
                onChange={handleImageUpload}
                onFileSelect={handleImageCrop}
                placeholder="上传封面图片"
              />
            </div>

            {/* 文章摘要 */}
            <div className="space-y-3">
              <h3 className="font-medium">
                {currentLanguage === 'zh' ? '文章摘要' : 'Article Excerpt'}
              </h3>
              <textarea
                placeholder={currentLanguage === 'zh' ? "请输入文章摘要，留空将自动生成..." : "Enter article excerpt, leave blank to auto-generate..."}
                value={currentLanguage === 'zh' ? blogPost.excerpt : (blogPost.excerpt_en || '')}
                onChange={(e) => setBlogPost(prev => ({ 
                  ...prev, 
                  [currentLanguage === 'zh' ? 'excerpt' : 'excerpt_en']: e.target.value 
                }))}
                className="w-full h-24 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const content = currentLanguage === 'zh' ? blogPost.content : blogPost.content_en;
                  const excerpt = content ? generateExcerpt(content) : '';
                  setBlogPost(prev => ({ 
                    ...prev, 
                    [currentLanguage === 'zh' ? 'excerpt' : 'excerpt_en']: excerpt
                  }));
                }}
                className="text-xs"
              >
                {currentLanguage === 'zh' ? '自动生成摘要' : 'Auto Generate Excerpt'}
              </Button>
            </div>

            {/* 文章统计 */}
            <div className="space-y-3">
              <h3 className="font-medium">文章统计</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>预计阅读时间:</span>
                  <span>{readTime} 分钟</span>
                </div>
                <div className="flex justify-between">
                  <span>浏览量:</span>
                  <span>{blogPost.viewCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>字数:</span>
                  <span>{blogPost.content.trim().split(/\s+/).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>字符数:</span>
                  <span>{blogPost.content.length}</span>
                </div>
              </div>
            </div>

            {/* 目录 */}
            <div className="space-y-3">
              <TableOfContents 
                content={blogPost.content}
                className="border border-gray-200 rounded-lg p-3"
              />
            </div>

            {/* 排版优化 */}
            <div className="space-y-3">
              <TextFormatter
                content={blogPost.content}
                onFormat={(formattedContent) => setBlogPost(prev => ({ ...prev, content: formattedContent }))}
                className="border border-gray-200 rounded-lg p-3"
              />
            </div>

            {/* 草稿历史 */}
            {drafts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">草稿历史</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {drafts.slice(0, 5).map((draft) => (
                    <div
                      key={draft.id}
                      className="p-2 border rounded text-xs hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setBlogPost(prev => ({
                          ...prev,
                          title: draft.title,
                          content: draft.content
                        }));
                      }}
                    >
                      <div className="font-medium truncate">{draft.title}</div>
                      <div className="text-gray-500">
                        {new Date(draft.savedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 图片裁剪模态框 */}
      {showImageCrop && cropImageSrc && (
        <ImageCrop
          src={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowImageCrop(false);
            setCropImageSrc('');
          }}
          aspectRatio={16 / 9}
        />
      )}
    </div>
  );
};

export default BlogEditor;