import React from 'react';
import { Play, Youtube, Music, Star, Clock, Eye, ThumbsUp, Share2, Sparkles, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Video } from '../contexts/VideoContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import VideoInteractionButtons from './VideoInteractionButtons';
import LazyImage from './LazyImage';

interface VideoCardProps {
  video: Video;
  variant?: 'featured' | 'grid' | 'list';
  showInteractions?: boolean;
  onClick?: (video: Video) => void;
  className?: string;
  showRecommendedBadge?: boolean;
  style?: React.CSSProperties;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  variant = 'grid',
  showInteractions = true,
  onClick,
  className = '',
  showRecommendedBadge = false,
  style
}) => {
  const { t } = useTranslation();
  const { trackExternalVideoClick } = useAnalytics();

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return t('videos.time.dayAgo', { count: 1 });
    if (diffDays < 7) return t('videos.time.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('videos.time.weeksAgo', { count: Math.floor(diffDays / 7) });
    if (diffDays < 365) return t('videos.time.monthsAgo', { count: Math.floor(diffDays / 30) });
    return t('videos.time.yearsAgo', { count: Math.floor(diffDays / 365) });
  };

  const getOptimizedThumbnail = (thumbnail: string): string => {
    if (video.platform === 'youtube' && video.url) {
      const videoId = video.url.split('v=')[1]?.split('&')[0];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    return thumbnail || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Video%20placeholder%20with%20play%20button&image_size=landscape_16_9';
  };

  // 检查是否为外部视频
  const isExternalVideo = (video: Video): boolean => {
    return video.platform === 'youtube' || video.platform === 'tiktok';
  };

  // 处理视频点击
  const handleClick = async (e: React.MouseEvent) => {
    // 如果是外部视频，进行追踪
    if (isExternalVideo(video) && video.url) {
      try {
        // 追踪外部视频点击
        const clickId = await trackExternalVideoClick(
          video.id,
          video.title,
          video.platform,
          video.url
        );
        
        console.log('🔗 External video click tracked:', { clickId, videoId: video.id });
        
        // 打开外部链接
        window.open(video.url, '_blank', 'noopener,noreferrer');
        
        // 阻止默认的onClick行为
        e.preventDefault();
        return;
      } catch (error) {
        console.error('Failed to track external video click:', error);
        // 即使追踪失败，仍然允许用户访问视频
        window.open(video.url, '_blank', 'noopener,noreferrer');
        e.preventDefault();
        return;
      }
    }
    
    // 对于本地视频或没有URL的视频，使用默认的onClick处理
    if (onClick) {
      onClick(video);
    }
  };

  // 渲染播放按钮，根据视频类型显示不同图标
  const renderPlayButton = (size: number = 24) => {
    if (isExternalVideo(video)) {
      return (
        <div className="flex items-center gap-1">
          <ExternalLink size={size * 0.7} />
          <Play size={size} />
        </div>
      );
    }
    return <Play size={size} />;
  };

  // Featured variant - 大卡片样式
  if (variant === 'featured') {
    return (
      <div
        className={`group cursor-pointer animate-slide-up bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
        onClick={handleClick}
        style={style}
      >
        <div className="relative overflow-hidden">
           <LazyImage
             src={getOptimizedThumbnail(video.thumbnail)}
             alt={video.title}
             className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
             placeholder={video.thumbnail}
           />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full">
              <div className="text-primary-600">
                {renderPlayButton(32)}
              </div>
            </div>
          </div>
          
          {/* 热门标签 */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Star className="h-3 w-3" />
            {t('videos.labels.popular')}
          </div>
          
          {/* 平台标识 */}
          <div className="absolute top-3 right-3">
            {video.platform === 'youtube' ? (
              <div className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Youtube className="h-3 w-3" />
                YouTube
                {isExternalVideo(video) && <ExternalLink className="h-3 w-3 ml-1" />}
              </div>
            ) : video.platform === 'tiktok' ? (
              <div className="bg-black text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Music className="h-3 w-3" />
                TikTok
                {isExternalVideo(video) && <ExternalLink className="h-3 w-3 ml-1" />}
              </div>
            ) : (
              <div className="bg-gray-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                {t('videos.platform.local')}
              </div>
            )}
          </div>
          
          {/* 时长 */}
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <Clock size={12} />
            {formatDuration(video.duration)}
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* 视频标题 */}
          <h3 className="text-lg font-bold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2">
            {video.title}
            {isExternalVideo(video) && (
              <ExternalLink className="inline-block ml-2 h-4 w-4 text-gray-500" />
            )}
          </h3>
          
          {/* 视频统计 */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye size={14} />
                <span>{formatNumber(video.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp size={14} />
                <span>{formatNumber(video.likes)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 size={14} />
                <span>{formatNumber(video.shares)}</span>
              </div>
            </div>
            <span className="text-xs">{formatDate(video.createdAt)}</span>
          </div>
          
          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {video.tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          {/* 交互按钮 */}
          {showInteractions && (
            <div className="pt-2 border-t border-gray-100">
              <VideoInteractionButtons 
                videoId={video.id} 
                size="md" 
                variant="horizontal"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // List variant - 列表样式
  if (variant === 'list') {
    return (
      <div
        className={`group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}
        onClick={handleClick}
        style={style}
      >
        <div className="flex gap-4 p-4">
          {/* 缩略图 */}
           <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden">
             <LazyImage
               src={getOptimizedThumbnail(video.thumbnail)}
               alt={video.title}
               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
               placeholder={video.thumbnail}
             />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-white">
                {renderPlayButton(20)}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
              {formatDuration(video.duration)}
            </div>
          </div>
          
          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2 mb-2 flex items-center gap-2">
                  {video.title}
                  {isExternalVideo(video) && (
                    <ExternalLink className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    <span>{formatNumber(video.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp size={12} />
                    <span>{formatNumber(video.likes)}</span>
                  </div>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-1">
                  {video.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 平台标识 */}
              <div className="ml-2 flex items-center gap-1">
                {video.platform === 'youtube' ? (
                  <>
                    <Youtube className="text-red-600" size={16} />
                    {isExternalVideo(video) && <ExternalLink className="text-gray-500" size={12} />}
                  </>
                ) : video.platform === 'tiktok' ? (
                  <>
                    <Music className="text-black" size={16} />
                    {isExternalVideo(video) && <ExternalLink className="text-gray-500" size={12} />}
                  </>
                ) : (
                  <div className="text-gray-600 text-xs">{t('videos.platform.local')}</div>
                )}
              </div>
            </div>
            
            {/* 交互按钮 */}
            {showInteractions && (
              <div className="mt-2">
                <VideoInteractionButtons 
                  videoId={video.id} 
                  size="sm" 
                  variant="horizontal"
                  showLabels={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid variant - 网格样式（默认）
  return (
    <div
      className={`group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}
      onClick={handleClick}
      style={style}
    >
      <div className="relative overflow-hidden">
         <LazyImage
           src={getOptimizedThumbnail(video.thumbnail)}
           alt={video.title}
           className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
           placeholder={video.thumbnail}
         />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full">
            <div className="text-primary-600">
              {renderPlayButton(24)}
            </div>
          </div>
        </div>
        
        {/* 推荐标签 */}
        {showRecommendedBadge && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            推荐
          </div>
        )}
        
        {/* 平台标识 */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {video.platform === 'youtube' ? (
            <>
              <Youtube className="text-red-600 bg-white rounded p-1" size={20} />
              {isExternalVideo(video) && (
                <ExternalLink className="text-gray-600 bg-white rounded p-1" size={16} />
              )}
            </>
          ) : video.platform === 'tiktok' ? (
            <>
              <Music className="text-black bg-white rounded p-1" size={20} />
              {isExternalVideo(video) && (
                <ExternalLink className="text-gray-600 bg-white rounded p-1" size={16} />
              )}
            </>
          ) : (
            <div className="bg-white text-gray-600 rounded px-2 py-1 text-xs">{t('videos.platform.local')}</div>
          )}
        </div>
        
        {/* 时长 */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
          {formatDuration(video.duration)}
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* 视频标题 */}
        <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2 flex items-start gap-2">
          <span className="flex-1">{video.title}</span>
          {isExternalVideo(video) && (
            <ExternalLink className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
          )}
        </h3>
        
        {/* 视频统计 */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>{formatNumber(video.views)}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp size={12} />
              <span>{formatNumber(video.likes)}</span>
            </div>
          </div>
          <span>{formatDate(video.createdAt)}</span>
        </div>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-1">
          {video.tags.slice(0, 2).map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
        
        {/* 交互按钮 */}
        {showInteractions && (
          <div className="pt-2">
            <VideoInteractionButtons 
              videoId={video.id} 
              size="sm" 
              variant="horizontal"
              showLabels={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;