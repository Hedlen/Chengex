import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, Share2 } from 'lucide-react';
import { Video, useVideo } from '../contexts/VideoContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';

interface VideoPlayerProps {
  video: Video;
  autoPlay?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onShare?: () => void;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  autoPlay = false,
  onProgress,
  onComplete,
  onShare,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // 使用VideoContext
  const { updateWatchProgress, userInteractions } = useVideo();
  
  // 使用AnalyticsContext
  const { trackVideoPlay } = useAnalytics();

  // 获取当前视频的观看进度
  const getUserProgress = useCallback(() => {
    const interaction = userInteractions.find(i => i.videoId === video.id);
    return interaction?.actions.watchProgress || 0;
  }, [userInteractions, video.id]);

  // 进度记忆功能
  const saveProgress = useCallback(async () => {
    if (videoRef.current && video.id && duration > 0) {
      const progress = (videoRef.current.currentTime / duration) * 100;
      await updateWatchProgress(video.id, progress);
      // 同时保存到localStorage作为备份
      localStorage.setItem(`video_progress_${video.id}`, videoRef.current.currentTime.toString());
    }
  }, [video.id, duration, updateWatchProgress]);

  const loadProgress = useCallback(() => {
    if (video.id && videoRef.current && duration > 0) {
      // 优先从VideoContext获取进度
      const contextProgress = getUserProgress();
      if (contextProgress > 0) {
        const timeFromProgress = (contextProgress / 100) * duration;
        if (timeFromProgress > 10) { // 只有超过10秒才恢复进度
          videoRef.current.currentTime = timeFromProgress;
          return;
        }
      }

      // 备用：从localStorage获取进度
      const savedProgress = localStorage.getItem(`video_progress_${video.id}`);
      if (savedProgress) {
        const progress = parseFloat(savedProgress);
        if (progress > 10) { // 只有超过10秒才恢复进度
          videoRef.current.currentTime = progress;
        }
      }
    }
  }, [video.id, duration, getUserProgress]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    videoRef.current.currentTime = newTime;
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    videoRef.current.currentTime = newTime;
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume]);

  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 当duration变化时加载进度
  useEffect(() => {
    if (duration > 0) {
      loadProgress();
    }
  }, [duration, loadProgress]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime;
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
      
      setCurrentTime(currentTime);
      onProgress?.(progress);
      
      // 每5秒保存一次进度
      if (Math.floor(currentTime) % 5 === 0) {
        saveProgress();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      // 追踪视频播放事件 - 使用props中的video对象
      console.log('🎥 VideoPlayer: handlePlay triggered for video:', { id: video.id, title: video.title });
      trackVideoPlay(video.id, video.title, 0);
    };
    
    const handlePause = () => setIsPlaying(false);
    
    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
      // 视频播放完成，清除进度记忆 - 使用props中的video对象
      if (video.id) {
        localStorage.removeItem(`video_progress_${video.id}`);
        updateWatchProgress(video.id, 100); // 标记为100%完成
      }
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('canplay', handleCanPlay);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [onProgress, onComplete, saveProgress, video.id, duration, updateWatchProgress]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
      <div 
        ref={containerRef}
        className={`relative bg-black rounded-lg overflow-hidden group ${className} ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src={video.url}
          poster={video.thumbnail}
          autoPlay={autoPlay}
          playsInline
          preload="metadata"
        />

        {/* 加载指示器 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* 播放覆盖层 */}
        {!isPlaying && !isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full hover:bg-white transition-colors">
              <Play className="text-black" size={32} />
            </div>
          </div>
        )}

        {/* 控制栏 */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* 进度条 */}
          <div 
            className="w-full h-2 bg-white/30 rounded-full cursor-pointer mb-4 group/progress"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-blue-500 rounded-full relative group-hover/progress:bg-blue-400 transition-colors"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 播放/暂停 */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              {/* 快退/快进 */}
              <button
                onClick={() => skipTime(-10)}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={() => skipTime(10)}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <SkipForward size={20} />
              </button>

              {/* 音量控制 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* 时间显示 */}
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* 播放速度设置 */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <Settings size={20} />
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-[120px]">
                    <div className="text-white text-sm mb-2">播放速度</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                          playbackRate === rate
                            ? 'bg-blue-500 text-white'
                            : 'text-white hover:bg-white/20'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 分享按钮 */}
              {onShare && (
                <button
                  onClick={onShare}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <Share2 size={20} />
                </button>
              )}

              {/* 全屏按钮 */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* 自定义样式 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #3b82f6;
              cursor: pointer;
            }
            .slider::-moz-range-thumb {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #3b82f6;
              cursor: pointer;
              border: none;
            }
          `
        }} />
      </div>
  );
};

export default VideoPlayer;