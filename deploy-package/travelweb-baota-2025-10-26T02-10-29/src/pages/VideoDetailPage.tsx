import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, ThumbsUp, Share2, Bookmark, Calendar, Clock, ExternalLink, Youtube, Music, UserPlus, Heart } from 'lucide-react';
import { useVideo, Video } from '../contexts/VideoContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import VideoPlayer from '../components/VideoPlayer';
import VideoInteractionButtons from '../components/VideoInteractionButtons';

const VideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { videos, likeVideo, bookmarkVideo, shareVideo } = useVideo();
  const { trackExternalVideoClick } = useAnalytics();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [watchProgress, setWatchProgress] = useState(0);

  useEffect(() => {
    if (!id) return;
    
    const foundVideo = videos.find(v => v.id === id);
    if (foundVideo) {
      setVideo(foundVideo);
      
      const related = videos
        .filter(v => v.id !== id)
        .slice(0, 6);
      setRelatedVideos(related);
    }
  }, [id, videos]);

  // 检查是否为外部视频
  const isExternalVideo = (video: Video): boolean => {
    return video.platform === 'youtube' || video.platform === 'tiktok';
  };

  // 处理外部视频跳转
  const handleExternalVideoClick = async () => {
    console.log('🎯 handleExternalVideoClick called for video:', video?.id);
    
    if (!video || !video.url) {
      console.log('❌ No video or URL found');
      return;
    }
    
    try {
      console.log('🔗 Calling trackExternalVideoClick with:', {
        videoId: video.id,
        title: video.title,
        platform: video.platform,
        url: video.url
      });
      
      // 追踪外部视频点击
      const clickId = await trackExternalVideoClick(
        video.id,
        video.title,
        video.platform,
        video.url
      );
      
      console.log('✅ External video click tracked from detail page:', { clickId, videoId: video.id });
      
      // 打开外部链接
      window.open(video.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('❌ Failed to track external video click:', error);
      // 即使追踪失败，仍然允许用户访问视频
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1天前';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`;
    return `${Math.ceil(diffDays / 30)}个月前`;
  };

  const handleProgress = (progress: number) => {
    setWatchProgress(progress);
  };

  const handleLike = async () => {
    if (!video) return;
    try {
      await likeVideo(video.id);
      setVideo(prev => prev ? {
        ...prev,
        likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
        isLiked: !prev.isLiked
      } : null);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleBookmark = async () => {
    if (!video) return;
    try {
      await bookmarkVideo(video.id);
      setVideo(prev => prev ? {
        ...prev,
        isBookmarked: !prev.isBookmarked
      } : null);
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  const handleShare = async () => {
    if (!video) return;
    try {
      await shareVideo(video.id);
      const url = `${window.location.origin}/videos/${video.id}`;
      await navigator.clipboard.writeText(url);
      alert('链接已复制到剪贴板');
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">视频未找到</h2>
          <button
            onClick={() => navigate('/videos')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            返回视频列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/videos')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回视频列表</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* 外部视频提示和跳转按钮 */}
            {isExternalVideo(video) && video.url ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {video.platform === 'youtube' ? (
                        <Youtube className="text-red-600" size={24} />
                      ) : (
                        <Music className="text-black" size={24} />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {video.platform === 'youtube' ? 'YouTube' : 'TikTok'} 视频
                        </h3>
                        <p className="text-sm text-gray-600">
                          此视频托管在 {video.platform === 'youtube' ? 'YouTube' : 'TikTok'} 平台上
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleExternalVideoClick}
                    className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    <ExternalLink size={20} />
                    <span>前往观看</span>
                  </button>
                </div>
                
                <div className="mt-4 p-4 bg-white/50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>提示：</strong>点击"前往观看"将在新标签页中打开 {video.platform === 'youtube' ? 'YouTube' : 'TikTok'} 视频。
                    我们会追踪您的观看行为以提供更好的推荐服务。
                  </p>
                  
                  {/* 社交媒体订阅/关注按钮 */}
                  <div className="flex flex-wrap gap-3">
                    {video.platform === 'youtube' && (
                      <button
                        onClick={() => window.open('https://www.youtube.com/@chengdu-travel-guide', '_blank')}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <Youtube size={16} />
                        <span>订阅频道</span>
                      </button>
                    )}
                    
                    {video.platform === 'tiktok' && (
                      <button
                        onClick={() => window.open('https://www.tiktok.com/@chengdu_travel_guide', '_blank')}
                        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        <UserPlus size={16} />
                        <span>关注账号</span>
                      </button>
                    )}
                    
                    {/* 通用社交媒体按钮 */}
                    <button
                      onClick={() => window.open('https://www.instagram.com/chengdu_travel_guide', '_blank')}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors text-sm font-medium"
                    >
                      <Heart size={16} />
                      <span>Instagram</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <VideoPlayer
                  video={video}
                  onProgress={handleProgress}
                  onShare={handleShare}
                  className="aspect-video"
                />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 flex-1">{video.title}</h1>
                {isExternalVideo(video) && (
                  <div className="flex items-center gap-2 ml-4">
                    <ExternalLink className="text-gray-500" size={20} />
                    <span className="text-sm text-gray-500">外部视频</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye size={16} />
                    <span>{formatNumber(video.views)} 次观看</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  {/* 平台标识 */}
                  <div className="flex items-center gap-1">
                    {video.platform === 'youtube' ? (
                      <>
                        <Youtube className="text-red-600" size={16} />
                        <span className="text-sm">YouTube</span>
                      </>
                    ) : video.platform === 'tiktok' ? (
                      <>
                        <Music className="text-black" size={16} />
                        <span className="text-sm">TikTok</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">本地视频</span>
                    )}
                  </div>
                </div>
                
                <VideoInteractionButtons
                  videoId={video.id}
                  size="lg"
                  showLabels={true}
                  showSocialButtons={true}
                />
              </div>

              {/* 外部视频额外信息 */}
              {isExternalVideo(video) && video.url && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">外部链接信息</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>平台：</strong>{video.platform === 'youtube' ? 'YouTube' : 'TikTok'}</p>
                    <p><strong>链接：</strong>
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 ml-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleExternalVideoClick();
                        }}
                      >
                        {video.url.length > 50 ? `${video.url.substring(0, 50)}...` : video.url}
                        <ExternalLink className="inline ml-1" size={12} />
                      </a>
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">视频描述</h3>
                <div className="text-gray-700">
                  {video.description || '暂无描述'}
                </div>
              </div>

              {video.tags.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {/* 只有非外部视频才显示播放进度 */}
            {!isExternalVideo(video) && watchProgress > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">播放进度</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${watchProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{Math.round(watchProgress)}% 已观看</p>
              </div>
            )}

            {/* 外部视频观看提示 */}
            {isExternalVideo(video) && (
              <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">观看统计</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">视频类型：</span>
                    <span className="font-medium">外部视频</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">托管平台：</span>
                    <span className="font-medium">{video.platform === 'youtube' ? 'YouTube' : 'TikTok'}</span>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <p>💡 外部视频的观看进度将通过智能算法进行预估，以提供更准确的推荐服务。</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">相关视频</h3>
              
              {relatedVideos.length > 0 ? (
                <div className="space-y-4">
                  {relatedVideos.map((relatedVideo) => (
                    <div
                      key={relatedVideo.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/videos/${relatedVideo.id}`)}
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={relatedVideo.thumbnail}
                            alt={relatedVideo.title}
                            className="w-24 h-16 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                            {Math.floor(relatedVideo.duration / 60)}:{(relatedVideo.duration % 60).toString().padStart(2, '0')}
                          </div>
                          {/* 外部视频标识 */}
                          {isExternalVideo(relatedVideo) && (
                            <div className="absolute top-1 right-1">
                              <ExternalLink className="text-white bg-black/50 rounded p-0.5" size={12} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1 flex items-start gap-1">
                            <span className="flex-1">{relatedVideo.title}</span>
                            {isExternalVideo(relatedVideo) && (
                              <ExternalLink className="text-gray-400 flex-shrink-0 mt-0.5" size={12} />
                            )}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatNumber(relatedVideo.views)} 观看</span>
                            <span>•</span>
                            <span>{formatDate(relatedVideo.createdAt)}</span>
                            {isExternalVideo(relatedVideo) && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  {relatedVideo.platform === 'youtube' ? (
                                    <Youtube size={10} className="text-red-600" />
                                  ) : (
                                    <Music size={10} className="text-black" />
                                  )}
                                  外部
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">暂无相关视频</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;