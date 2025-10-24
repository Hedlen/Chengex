import React from 'react';
import { Heart, Bookmark, Share2, Eye, ThumbsUp, Youtube, UserPlus } from 'lucide-react';
import { useVideo } from '../contexts/VideoContext';
import { useTranslation } from 'react-i18next';

interface VideoInteractionButtonsProps {
  videoId: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'horizontal' | 'vertical';
  className?: string;
  showSocialButtons?: boolean;
}

export const VideoInteractionButtons: React.FC<VideoInteractionButtonsProps> = ({
  videoId,
  showLabels = true,
  size = 'md',
  variant = 'horizontal',
  className = '',
  showSocialButtons = false
}) => {
  const { t } = useTranslation();
  const { 
    likeVideo, 
    bookmarkVideo, 
    shareVideo, 
    userInteractions,
    videos 
  } = useVideo();

  const video = videos.find(v => v.id === videoId);
  const userInteraction = userInteractions.find(
    interaction => interaction.videoId === videoId
  );

  const isLiked = userInteraction?.actions.liked || false;
  const isBookmarked = userInteraction?.actions.bookmarked || false;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await likeVideo(videoId);
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await bookmarkVideo(videoId);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareVideo(videoId);
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

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const buttonClasses = `
    flex items-center gap-1 px-3 py-1 rounded-lg transition-all duration-200 
    ${sizeClasses[size]}
  `;

  const containerClasses = `
    flex ${variant === 'horizontal' ? 'flex-row' : 'flex-col'} 
    ${variant === 'horizontal' ? 'gap-2' : 'gap-1'} 
    ${className}
  `;

  if (!video) return null;

  return (
    <div className={containerClasses}>
      {/* 点赞按钮 */}
      <button
        onClick={handleLike}
        className={`
          ${buttonClasses}
          ${isLiked 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'hover:bg-red-50 text-red-600'
          }
        `}
        title={isLiked ? t('videos.interactions.tooltips.liked') : t('videos.interactions.tooltips.like')}
      >
        <Heart 
          size={iconSizes[size]} 
          className={isLiked ? 'fill-current' : ''} 
        />
        {showLabels && (
          <span>{isLiked ? t('videos.interactions.liked') : t('videos.interactions.like')}</span>
        )}
        {size !== 'sm' && (
          <span className="text-xs text-gray-500">
            {formatNumber(video.likes)}
          </span>
        )}
      </button>

      {/* 收藏按钮 */}
      <button
        onClick={handleBookmark}
        className={`
          ${buttonClasses}
          ${isBookmarked 
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
            : 'hover:bg-blue-50 text-blue-600'
          }
        `}
        title={isBookmarked ? t('videos.interactions.tooltips.bookmarked') : t('videos.interactions.tooltips.bookmark')}
      >
        <Bookmark 
          size={iconSizes[size]} 
          className={isBookmarked ? 'fill-current' : ''} 
        />
        {showLabels && (
          <span>{isBookmarked ? t('videos.interactions.bookmarked') : t('videos.interactions.bookmark')}</span>
        )}
      </button>

      {/* 分享按钮 */}
      <button
        onClick={handleShare}
        className={`
          ${buttonClasses}
          hover:bg-green-50 text-green-600
        `}
        title={t('videos.interactions.tooltips.share')}
      >
        <Share2 size={iconSizes[size]} />
        {showLabels && <span>{t('videos.interactions.share')}</span>}
        {size !== 'sm' && (
          <span className="text-xs text-gray-500">
            {formatNumber(video.shares)}
          </span>
        )}
      </button>

      {/* 观看数据（仅显示） */}
      {size !== 'sm' && (
        <div className={`
          flex items-center gap-1 px-3 py-1 text-gray-600 
          ${sizeClasses[size]}
        `}>
          <Eye size={iconSizes[size]} />
          {showLabels && <span>{t('videos.interactions.views')}</span>}
          <span className="text-xs text-gray-500">
            {formatNumber(video.views)}
          </span>
        </div>
      )}

      {/* 社交媒体订阅按钮 */}
      {showSocialButtons && video && (
        <>
          {/* YouTube 订阅按钮 */}
          {(video.platform === 'youtube' || !video.platform) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open('https://www.youtube.com/@chengdu-travel-guide', '_blank');
              }}
              className={`
                ${buttonClasses}
                bg-red-600 text-white hover:bg-red-700
              `}
              title={t('videos.interactions.tooltips.subscribe')}
            >
              <Youtube size={iconSizes[size]} />
              {showLabels && <span>{t('videos.interactions.subscribe')}</span>}
            </button>
          )}

          {/* TikTok 关注按钮 */}
          {(video.platform === 'tiktok' || !video.platform) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open('https://www.tiktok.com/@chengdu_travel_guide', '_blank');
              }}
              className={`
                ${buttonClasses}
                bg-black text-white hover:bg-gray-800
              `}
              title={t('videos.interactions.tooltips.follow')}
            >
              <UserPlus size={iconSizes[size]} />
              {showLabels && <span>{t('videos.interactions.follow')}</span>}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default VideoInteractionButtons;