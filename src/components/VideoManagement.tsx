import React, { useState } from 'react';
import { Plus, Edit, Trash2, Play, Save, X, Video, Calendar, AlertCircle, CheckCircle, Eye, Archive, FileText, Send } from 'lucide-react';
import { useVideo, Video as VideoType } from '../contexts/VideoContext';
import ConfirmDialog from './ConfirmDialog';

const VideoManagement = () => {
  const { 
    videos, 
    addVideo, 
    updateVideo, 
    deleteVideo, 
    publishVideo, 
    archiveVideo, 
    draftVideo, 
    batchUpdateStatus, 
    getVideosByStatus 
  } = useVideo();
  const [isEditing, setIsEditing] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    thumbnail: '',
    platform: 'youtube' as 'youtube' | 'tiktok',
    description: '',
    status: 'draft' as 'draft' | 'published' | 'archived'
  });

  const platforms = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (formData.title.length < 3) {
      newErrors.title = '标题至少需要3个字符';
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = '视频链接不能为空';
    } else if (!isValidVideoUrl(formData.url)) {
      newErrors.url = '请输入有效的YouTube或TikTok链接';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '描述不能超过500个字符';
    }

    if (formData.thumbnail && !isValidUrl(formData.thumbnail)) {
      newErrors.thumbnail = '请输入有效的缩略图URL';
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

  const isValidVideoUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const tiktokRegex = /^(https?:\/\/)?(www\.)?tiktok\.com\/.+/;
    return youtubeRegex.test(url) || tiktokRegex.test(url);
  };

  const extractVideoId = (url: string): string => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) return youtubeMatch[1];
    
    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/);
    if (tiktokMatch) return tiktokMatch[1];
    
    return '';
  };

  const generateThumbnail = (url: string, platform: string): string => {
    if (platform === 'youtube') {
      const videoId = extractVideoId(url);
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    }
    return '';
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEdit = (video: VideoType) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail || '',
      platform: video.platform,
      description: video.description || '',
      status: video.status || 'draft'
    });
    setIsEditing(true);
    setErrors({});
    setSuccessMessage('');
  };

  const handleAdd = () => {
    setEditingVideo(null);
    setFormData({
      title: '',
      url: '',
      thumbnail: '',
      platform: 'youtube',
      description: '',
      status: 'draft'
    });
    setIsEditing(true);
    setErrors({});
    setSuccessMessage('');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const videoData = {
        title: formData.title.trim(),
        url: formData.url.trim(),
        platform: formData.platform,
        description: formData.description.trim(),
        thumbnail: formData.thumbnail.trim() || generateThumbnail(formData.url, formData.platform) || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(formData.title + ' video thumbnail')}&image_size=landscape_16_9`,
        category: [],
        tags: [],
        duration: 0,
        views: editingVideo?.views || 0,
        likes: editingVideo?.likes || 0,
        shares: editingVideo?.shares || 0,
        status: formData.status as 'draft' | 'published' | 'archived',
        metadata: {
          quality: 'HD' as const,
          language: 'zh' as const
        }
      };

      if (editingVideo) {
        updateVideo(editingVideo.id, videoData);
        showSuccess('视频更新成功！');
      } else {
        addVideo(videoData);
        showSuccess('视频添加成功！');
      }

      setIsEditing(false);
      setEditingVideo(null);
    } catch (error) {
      setErrors({ general: '保存失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingVideo(null);
    setErrors({});
    setSuccessMessage('');
    setFormData({
      title: '',
      url: '',
      thumbnail: '',
      platform: 'youtube',
      description: '',
      status: 'draft'
    });
  };

  const handleDelete = (id: string) => {
    const video = videos.find(v => v.id === id);
    if (!video) return;

    setConfirmDialog({
      isOpen: true,
      title: '删除视频',
      message: `确定要删除视频"${video.title}"吗？此操作无法撤销。`,
      type: 'danger',
      onConfirm: () => {
        deleteVideo(id);
        showSuccess('视频删除成功！');
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-detect platform from URL
    if (field === 'url' && value) {
      if (value.includes('youtube.com') || value.includes('youtu.be')) {
        setFormData(prev => ({ ...prev, platform: 'youtube' }));
      } else if (value.includes('tiktok.com')) {
        setFormData(prev => ({ ...prev, platform: 'tiktok' }));
      }
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 状态管理方法
  const handleStatusChange = (videoId: string, newStatus: 'draft' | 'published' | 'archived') => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const statusLabels = {
      draft: '草稿',
      published: '发布',
      archived: '归档'
    };

    const confirmMessages = {
      published: `确定要发布视频"${video.title}"吗？发布后将在网站上公开显示。`,
      archived: `确定要归档视频"${video.title}"吗？归档后将不再在网站上显示。`,
      draft: `确定要将视频"${video.title}"设为草稿吗？设为草稿后将不在网站上显示。`
    };

    setConfirmDialog({
      isOpen: true,
      title: `${statusLabels[newStatus]}视频`,
      message: confirmMessages[newStatus],
      type: newStatus === 'archived' ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          switch (newStatus) {
            case 'published':
              await publishVideo(videoId);
              showSuccess('视频已发布！');
              break;
            case 'archived':
              await archiveVideo(videoId);
              showSuccess('视频已归档！');
              break;
            case 'draft':
              await draftVideo(videoId);
              showSuccess('视频已设为草稿！');
              break;
          }
        } catch (error) {
          setErrors({ general: '状态更新失败，请重试' });
        }
      }
    });
  };

  const handleBatchStatusChange = (newStatus: 'draft' | 'published' | 'archived') => {
    if (selectedVideos.length === 0) {
      setErrors({ general: '请先选择要操作的视频' });
      return;
    }

    const statusLabels = {
      draft: '草稿',
      published: '发布',
      archived: '归档'
    };

    const confirmMessages = {
      published: `确定要批量发布选中的 ${selectedVideos.length} 个视频吗？发布后将在网站上公开显示。`,
      archived: `确定要批量归档选中的 ${selectedVideos.length} 个视频吗？归档后将不再在网站上显示。`,
      draft: `确定要将选中的 ${selectedVideos.length} 个视频设为草稿吗？设为草稿后将不在网站上显示。`
    };

    setConfirmDialog({
      isOpen: true,
      title: `批量${statusLabels[newStatus]}视频`,
      message: confirmMessages[newStatus],
      type: newStatus === 'archived' ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          const count = selectedVideos.length;
          await batchUpdateStatus(selectedVideos, newStatus);
          setSelectedVideos([]);
          showSuccess(`已批量更新 ${count} 个视频的状态！`);
        } catch (error) {
          setErrors({ general: '批量操作失败，请重试' });
        }
      }
    });
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSelectAll = () => {
    const filteredVideoIds = getFilteredVideos().map(video => video.id);
    setSelectedVideos(prev => 
      prev.length === filteredVideoIds.length ? [] : filteredVideoIds
    );
  };

  // 获取筛选后的视频
  const getFilteredVideos = () => {
    if (statusFilter === 'all') {
      return videos;
    }
    return getVideosByStatus(statusFilter);
  };

  // 获取状态显示信息
  const getStatusInfo = (status: 'draft' | 'published' | 'archived') => {
    switch (status) {
      case 'draft':
        return { label: '草稿', color: 'bg-gray-100 text-gray-800', icon: FileText };
      case 'published':
        return { label: '已发布', color: 'bg-green-100 text-green-800', icon: Eye };
      case 'archived':
        return { label: '已归档', color: 'bg-yellow-100 text-yellow-800', icon: Archive };
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingVideo ? '编辑视频' : '添加视频'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
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
                  视频标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="请输入视频标题"
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
                  平台
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => handleInputChange('platform', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {platforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  视频链接 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.url ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.url}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">支持YouTube和TikTok链接</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  缩略图URL
                </label>
                <input
                  type="url"
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
                  视频描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="请输入视频描述"
                  maxLength={500}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">{formData.description.length}/500</p>
              </div>

              {/* Preview */}
              {formData.url && isValidVideoUrl(formData.url) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预览
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{formData.title || '未命名视频'}</p>
                    <p className="text-xs text-gray-500 mt-1">{formData.platform === 'youtube' ? 'YouTube' : 'TikTok'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">视频管理</h2>
        <button
          onClick={handleAdd}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          添加视频
        </button>
      </div>

      {/* 筛选和批量操作 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* 状态筛选 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">状态筛选:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published' | 'archived')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </div>

            {/* 选择统计 */}
            {selectedVideos.length > 0 && (
              <div className="text-sm text-gray-600">
                已选择 {selectedVideos.length} 个视频
              </div>
            )}
          </div>

          {/* 批量操作 */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {selectedVideos.length === getFilteredVideos().length ? '取消全选' : '全选'}
            </button>
            
            {selectedVideos.length > 0 && (
              <>
                <button
                  onClick={() => handleBatchStatusChange('published')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  批量发布
                </button>
                <button
                  onClick={() => handleBatchStatusChange('archived')}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors flex items-center gap-1"
                >
                  <Archive className="h-3 w-3" />
                  批量归档
                </button>
                <button
                  onClick={() => handleBatchStatusChange('draft')}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  批量草稿
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredVideos().map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Video%20placeholder&image_size=landscape_16_9';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play className="h-12 w-12 text-white" />
              </div>
              
              {/* 选择框 */}
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedVideos.includes(video.id)}
                  onChange={() => handleVideoSelect(video.id)}
                  className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
              </div>
              
              {/* 平台标识 */}
              <div className="absolute top-2 right-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                  video.platform === 'youtube' ? 'bg-red-100 text-red-800' : 'bg-pink-100 text-pink-800'
                }`}>
                  {video.platform === 'youtube' ? 'YouTube' : 'TikTok'}
                </span>
              </div>
              
              {/* 状态标识 */}
              <div className="absolute bottom-2 left-2">
                {(() => {
                  const statusInfo = getStatusInfo(video.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {video.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(video.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>

              {video.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {video.description}
                </p>
              )}

              {/* 状态操作按钮 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {video.status !== 'published' && (
                  <button
                    onClick={() => handleStatusChange(video.id, 'published')}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    发布
                  </button>
                )}
                {video.status !== 'archived' && (
                  <button
                    onClick={() => handleStatusChange(video.id, 'archived')}
                    className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors flex items-center gap-1"
                  >
                    <Archive className="h-3 w-3" />
                    归档
                  </button>
                )}
                {video.status !== 'draft' && (
                  <button
                    onClick={() => handleStatusChange(video.id, 'draft')}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    草稿
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-100 text-primary-700 px-3 py-1 rounded text-sm font-medium hover:bg-primary-200 transition-colors flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  观看
                </a>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(video)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
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

      {getFilteredVideos().length === 0 && (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {videos.length === 0 ? '暂无视频' : `暂无${statusFilter === 'all' ? '' : getStatusInfo(statusFilter as any).label}视频`}
          </h3>
          <p className="text-gray-500 mb-4">
            {videos.length === 0 ? '开始添加您的第一个视频' : '尝试切换其他状态筛选'}
          </p>
          {videos.length === 0 && (
            <button
              onClick={handleAdd}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              添加视频
            </button>
          )}
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default VideoManagement;