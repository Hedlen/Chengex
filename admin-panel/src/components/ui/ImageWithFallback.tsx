import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface ImageWithFallbackProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  srcSet?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = '',
  className,
  fallbackSrc,
  placeholder,
  onLoad,
  onError,
  style,
  loading = 'lazy',
  sizes,
  srcSet,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // 验证图片URL是否有效
  const isValidImageUrl = useCallback((url?: string): boolean => {
    if (!url) return false;
    
    // 检查Base64格式图片
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    // 检查HTTP URL格式
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || 
             url.includes('unsplash.com') || 
             url.includes('images.') ||
             url.includes('cdn.') ||
             url.includes('amazonaws.com');
    } catch {
      return false;
    }
  }, []);

  // 当src改变时重置状态
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setIsLoading(true);
      setHasError(false);
    }
  }, [src, currentSrc]);

  // 处理图片加载成功
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // 处理图片加载失败
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    // 如果当前使用的是主图片且有fallback，尝试使用fallback
    if (currentSrc === src && fallbackSrc && fallbackSrc !== src) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(false);
      return;
    }
    
    onError?.();
  }, [currentSrc, src, fallbackSrc, onError]);

  // 如果没有有效的图片源，显示占位符
  if (!isValidImageUrl(currentSrc)) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg',
          'border border-gray-200',
          className
        )}
        style={style}
      >
        {placeholder || (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <svg 
              className="w-8 h-8 mb-2 text-gray-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <span className="text-xs text-gray-400">暂无图片</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={style}>
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-xs text-gray-500">加载中...</span>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          {placeholder || (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <svg 
                className="w-8 h-8 mb-2 text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <span className="text-xs text-red-500">图片加载失败</span>
            </div>
          )}
        </div>
      )}

      {/* 实际图片 */}
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-contain transition-opacity duration-200',
          (isLoading || hasError) && 'opacity-0'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        sizes={sizes}
        srcSet={srcSet}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block'
        }}
      />
    </div>
  );
};

export default ImageWithFallback;