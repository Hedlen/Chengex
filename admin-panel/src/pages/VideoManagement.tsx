import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Play,
  Archive,
  CheckSquare,
  Square
} from 'lucide-react';
import { Video, ContentStatus, VideoPlatform } from '../../../shared/types';
import { DataManager } from '../../../shared/api/dataManager';
import { buildApiUrl, API_CONFIG } from '../config/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

// 播放率数据类型定义
interface PlaybackRateData {
  videoId: string;
  rate: number;
  isEstimated: boolean;
  hasData: boolean;
}

// 播放量数据类型定义
interface PlayCountData {
  videoId: string;
  count: number;
  hasData: boolean;
}



const VideoManagement: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('');
  const [platformFilter, setPlatformFilter] = useState<VideoPlatform | ''>('');
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 播放率相关状态
  const [playbackRates, setPlaybackRates] = useState<Map<string, PlaybackRateData>>(new Map());
  const [loadingRates, setLoadingRates] = useState(false);

  // 播放量相关状态
  const [playCounts, setPlayCounts] = useState<Map<string, PlayCountData>>(new Map());
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    platform: 'youtube' as VideoPlatform,
    status: 'draft' as ContentStatus,
    tags: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      loadPlaybackRates();
      loadPlayCounts();
    }
  }, [videos]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await DataManager.getVideos();
      setVideos(data);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载播放率数据
  const loadPlaybackRates = async () => {
    try {
      setLoadingRates(true);
      const ratesMap = new Map<string, PlaybackRateData>();

      // 尝试获取视频统计数据，如果端点不存在则使用默认值
      try {
        const videoStatsResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_VIDEOS));
        if (videoStatsResponse.ok) {
          const videoStatsData = await videoStatsResponse.json();
          // 处理视频统计数据（如果有的话）
          console.log('Video stats data:', videoStatsData);
        }
      } catch (error) {
        console.log('Analytics endpoints not available, using default values');
      }

      // 为所有视频设置默认值（因为详细的analytics端点暂时不可用）
      videos.forEach(video => {
        ratesMap.set(video.id, {
          videoId: video.id,
          rate: 0,
          isEstimated: false,
          hasData: false
        });
      });

      setPlaybackRates(ratesMap);
    } catch (error) {
      console.error('Failed to load playback rates:', error);
      // 设置默认值
      const defaultRatesMap = new Map<string, PlaybackRateData>();
      videos.forEach(video => {
        defaultRatesMap.set(video.id, {
          videoId: video.id,
          rate: 0,
          isEstimated: false,
          hasData: false
        });
      });
      setPlaybackRates(defaultRatesMap);
    } finally {
      setLoadingRates(false);
    }
  };

  // 加载播放量数据
  const loadPlayCounts = async () => {
    try {
      setLoadingCounts(true);
      const countsMap = new Map<string, PlayCountData>();

      // 尝试获取视频统计数据，如果端点不存在则使用默认值
      try {
        const videoStatsResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_VIDEOS));
        if (videoStatsResponse.ok) {
          const videoStatsData = await videoStatsResponse.json();
          // 处理视频统计数据（如果有的话）
          console.log('Video stats data for counts:', videoStatsData);
        }
      } catch (error) {
        console.log('Analytics endpoints not available for counts, using default values');
      }

      // 为所有视频设置默认值（因为详细的analytics端点暂时不可用）
      videos.forEach(video => {
        countsMap.set(video.id, {
          videoId: video.id,
          count: 0,
          hasData: false
        });
      });

      setPlayCounts(countsMap);
    } catch (error) {
      console.error('Failed to load play counts:', error);
      // 设置默认值
      const defaultCountsMap = new Map<string, PlayCountData>();
      videos.forEach(video => {
        defaultCountsMap.set(video.id, {
          videoId: video.id,
          count: 0,
          hasData: false
        });
      });
      setPlayCounts(defaultCountsMap);
    } finally {
      setLoadingCounts(false);
    }
  };

  // 播放率显示组件
  const PlaybackRateDisplay: React.FC<{ videoId: string }> = ({ videoId }) => {
    const rateData = playbackRates.get(videoId);
    
    if (loadingRates) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-xs text-gray-500">加载中...</span>
        </div>
      );
    }

    if (!rateData || !rateData.hasData) {
      return (
        <span className="text-xs text-gray-400">暂无数据</span>
      );
    }

    const rate = rateData.rate;
    let colorClass = '';
    
    if (rate >= 70) {
      colorClass = 'text-green-600 bg-green-50';
    } else if (rate >= 40) {
      colorClass = 'text-orange-600 bg-orange-50';
    } else {
      colorClass = 'text-red-600 bg-red-50';
    }

    return (
      <div className="flex items-center gap-1">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {rate.toFixed(1)}%
        </span>
        {rateData.isEstimated && (
          <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
            预估
          </span>
        )}
      </div>
    );
  };

  // 播放量显示组件
  const PlayCountDisplay: React.FC<{ videoId: string }> = ({ videoId }) => {
    const countData = playCounts.get(videoId);
    
    if (loadingCounts) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-xs text-gray-500">加载中...</span>
        </div>
      );
    }

    if (!countData || !countData.hasData) {
      return (
        <span className="text-xs text-gray-400">0次播放</span>
      );
    }

    const count = countData.count;
    
    // 格式化播放量显示
    const formatPlayCount = (count: number): string => {
      if (count === 0) return '0次播放';
      if (count < 1000) return `${count.toLocaleString()}次播放`;
      if (count < 1000000) return `${(count / 1000).toFixed(1)}K次播放`;
      return `${(count / 1000000).toFixed(1)}M次播放`;
    };

    return (
      <div className="flex items-center">
        <span className="text-sm text-gray-900 font-medium">
          {formatPlayCount(count)}
        </span>
      </div>
    );
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || video.status === statusFilter;
    const matchesPlatform = !platformFilter || video.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const handleSelectVideo = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVideos.length === filteredVideos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(filteredVideos.map(video => video.id));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = '标题不能为空';
    }
    
    if (!formData.url.trim()) {
      errors.url = 'URL不能为空';
    } else if (!isValidVideoUrl(formData.url)) {
      errors.url = '请输入有效的视频URL';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidVideoUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const tiktokRegex = /^(https?:\/\/)?(www\.)?tiktok\.com\/.+/;
    return youtubeRegex.test(url) || tiktokRegex.test(url);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      platform: 'youtube',
      status: 'draft',
      tags: ''
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const videoData: Omit<Video, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        url: formData.url.trim(),
        platform: formData.platform,
        status: formData.status,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        thumbnail: generateThumbnailUrl(formData.url, formData.platform),
        duration: '0',
        category: 'general',
        viewCount: 0,
        views: 0,
        likes: 0,
        shares: 0,
        createdBy: 'admin'
      };

      if (editingVideo) {
        await DataManager.saveVideo({ ...videoData, id: editingVideo.id });
      } else {
        await DataManager.saveVideo(videoData);
      }

      await loadVideos();
      setShowAddModal(false);
      setEditingVideo(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save video:', error);
    }
  };

  const generateThumbnailUrl = (url: string, platform: VideoPlatform) => {
    if (platform === 'youtube') {
      const videoId = extractYouTubeVideoId(url);
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    }
    return '';
  };

  const extractYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      url: video.url,
      platform: video.platform,
      status: video.status,
      tags: video.tags.join(', ')
    });
    setShowAddModal(true);
  };

  const handleDelete = async (videoId: string) => {
    try {
      const result = await DataManager.deleteVideo(videoId);
      if (result.success) {
        await loadVideos();
        setShowDeleteConfirm(null);
        console.log('视频删除成功:', result.message);
      } else {
        console.error('删除视频失败:', result.error);
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('删除失败: ' + (error as Error).message);
    }
  };

  const handleBatchStatusUpdate = async (status: ContentStatus) => {
    try {
      for (const videoId of selectedVideos) {
        const video = videos.find(v => v.id === videoId);
        if (video) {
          await DataManager.saveVideo({ ...video, status });
        }
      }
      await loadVideos();
      setSelectedVideos([]);
    } catch (error) {
      console.error('Failed to update video status:', error);
    }
  };

  const handleBatchDelete = async () => {
    try {
      let failedCount = 0;
      for (const videoId of selectedVideos) {
        const result = await DataManager.deleteVideo(videoId);
        if (!result.success) {
          console.error('删除视频失败:', videoId, result.error);
          failedCount++;
        }
      }
      
      await loadVideos();
      setSelectedVideos([]);
      
      if (failedCount > 0) {
        alert(`批量删除完成，但有 ${failedCount} 个视频删除失败`);
      } else {
        console.log('批量删除成功');
      }
    } catch (error) {
      console.error('Failed to delete videos:', error);
      alert('批量删除失败: ' + (error as Error).message);
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    const statusConfig = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-800' },
      published: { label: '已发布', className: 'bg-green-100 text-green-800' },
      archived: { label: '已归档', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status] || { label: '未知状态', className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPlatformBadge = (platform: VideoPlatform) => {
    const platformConfig = {
      youtube: { label: 'YouTube', className: 'bg-red-100 text-red-800' },
      tiktok: { label: 'TikTok', className: 'bg-black text-white' },
      bilibili: { label: 'Bilibili', className: 'bg-blue-100 text-blue-800' },
      local: { label: '本地', className: 'bg-gray-100 text-gray-800' }
    };

    const config = platformConfig[platform] || { label: '未知平台', className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">视频管理</h1>
        <p className="text-gray-600">管理YouTube和TikTok视频内容</p>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索视频标题或描述..."
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
                { value: '', label: '全部平台' },
                { value: 'youtube', label: 'YouTube' },
                { value: 'tiktok', label: 'TikTok' }
              ]}
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as VideoPlatform | '')}
              className="w-full sm:w-40"
            />
          </div>
          
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加视频
          </Button>
        </div>

        {/* 批量操作 */}
        {selectedVideos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                已选择 {selectedVideos.length} 个视频
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

      {/* 视频列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">暂无视频数据</p>
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
                      {selectedVideos.length === filteredVideos.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    视频信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平台
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     状态
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     播放量
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     播放率
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
                {filteredVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleSelectVideo(video.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedVideos.includes(video.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-12 w-20 object-cover rounded mr-4"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {video.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {video.description}
                          </div>
                          {video.tags.length > 0 && (
                            <div className="mt-1">
                              {video.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-1"
                                >
                                  {tag}
                                </span>
                              ))}
                              {video.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{video.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getPlatformBadge(video.platform)}
                    </td>
                    <td className="px-4 py-4">
                       {getStatusBadge(video.status)}
                     </td>
                     <td className="px-4 py-4">
                       <PlayCountDisplay videoId={video.id} />
                     </td>
                     <td className="px-4 py-4">
                       <PlaybackRateDisplay videoId={video.id} />
                     </td>
                     <td className="px-4 py-4 text-sm text-gray-500">
                       {new Date(video.createdAt).toLocaleDateString('zh-CN')}
                     </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(video.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(video)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setShowDeleteConfirm(video.id)}
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

      {/* 添加/编辑视频模态框 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingVideo(null);
          resetForm();
        }}
        title={editingVideo ? '编辑视频' : '添加视频'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="视频标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={formErrors.title}
            placeholder="请输入视频标题"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              视频描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="请输入视频描述"
            />
          </div>
          
          <Input
            label="视频URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            error={formErrors.url}
            placeholder="https://www.youtube.com/watch?v=... 或 https://www.tiktok.com/..."
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="平台"
              options={[
                { value: 'youtube', label: 'YouTube' },
                { value: 'tiktok', label: 'TikTok' }
              ]}
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as VideoPlatform })}
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
          
          <Input
            label="标签"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="用逗号分隔多个标签"
            helperText="例如：旅游,美食,攻略"
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingVideo(null);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button type="submit">
              {editingVideo ? '更新' : '添加'}
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
            确定要删除这个视频吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VideoManagement;