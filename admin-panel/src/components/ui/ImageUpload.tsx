import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  placeholder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onFileSelect,
  className,
  accept = 'image/*',
  maxSize = 5,
  disabled = false,
  placeholder = '点击上传或拖拽图片到此处'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return '请选择图片文件';
    }

    // 检查文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `文件大小不能超过 ${maxSize}MB`;
    }

    // 检查文件格式
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return '支持的格式：JPEG、PNG、GIF、WebP';
    }

    return null;
  }, [maxSize]);

  const handleFileSelect = useCallback(async (file: File) => {
    setError('');
    setIsLoading(true);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      // 清理之前的blob URL以避免内存泄漏
      if (value && value.startsWith('blob:')) {
        URL.revokeObjectURL(value);
      }
      
      // 如果提供了文件选择回调，优先使用回调处理（如裁剪功能）
      if (onFileSelect) {
        onFileSelect(file);
      } else {
        // 否则直接将文件转换为Base64编码
        const base64String = await convertFileToBase64(file);
        onChange(base64String);
      }
    } catch (err) {
      setError('文件处理失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [validateFile, onChange, onFileSelect, value]);

  // 将文件转换为Base64编码的辅助函数
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    console.log('ImageUpload clicked', { disabled, fileInputRef: fileInputRef.current });
    
    if (!disabled && fileInputRef.current) {
      console.log('Triggering file input click');
      try {
        fileInputRef.current.click();
        console.log('File input click triggered successfully');
      } catch (error) {
        console.error('Error triggering file input click:', error);
      }
    } else {
      console.log('Click blocked:', { disabled, hasRef: !!fileInputRef.current });
    }
  }, [disabled]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // 清理blob URL（如果存在）
    if (value && value.startsWith('blob:')) {
      URL.revokeObjectURL(value);
    }
    onChange('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange, value]);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setError('图片加载失败，请检查图片URL或重新上传');
    // Base64图片不需要清理，只有blob URL才需要
    if (value && value.startsWith('blob:')) {
      URL.revokeObjectURL(value);
      onChange('');
    }
  }, [value, onChange]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setError('');
  }, []);

  const handleImageLoadStart = useCallback(() => {
    setImageLoading(true);
    setError('');
  }, []);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    onChange(url);
    setError('');
  }, [onChange]);

  // 验证URL格式的辅助函数
  const isValidImageUrl = useCallback((url: string): boolean => {
    if (!url) return false;
    
    // 检查Base64格式图片
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    // 检查HTTP URL格式
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || url.includes('unsplash.com') || url.includes('images.');
    } catch {
      return false;
    }
  }, []);

  // 清理blob URL以防止内存泄漏（仅对blob URL有效）
  useEffect(() => {
    return () => {
      if (value && value.startsWith('blob:')) {
        URL.revokeObjectURL(value);
      }
    };
  }, [value]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {/* 拖拽上传区域 */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
          'hover:border-blue-400 hover:bg-blue-50',
          isDragging && 'border-blue-500 bg-blue-100',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-300 bg-red-50',
          value && !error && 'border-green-300 bg-green-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">处理中...</p>
          </div>
        ) : value && !error && isValidImageUrl(value) ? (
          <div className="relative group">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-xs text-gray-500">加载中...</span>
                </div>
              </div>
            )}
            <div className="flex justify-center items-center">
              <img
                src={value}
                alt="预览"
                className={cn(
                  "max-h-48 max-w-full w-auto h-auto rounded-lg object-contain transition-all duration-200",
                  "shadow-sm border border-gray-200",
                  imageLoading && "opacity-0"
                )}
                onError={handleImageError}
                onLoad={handleImageLoad}
                onLoadStart={handleImageLoadStart}
                style={{
                  maxHeight: '12rem',
                  maxWidth: '100%',
                  height: 'auto',
                  width: 'auto'
                }}
              />
            </div>
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
              type="button"
              title="删除图片"
            >
              <X size={14} />
            </button>
          </div>
        ) : error && value ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-8">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-red-700 mb-2">
                {error}
              </p>
              <div className="space-x-2">
                <button
                  onClick={handleRemove}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                  type="button"
                >
                  清除
                </button>
                <button
                  onClick={handleClick}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                  type="button"
                >
                  重新上传
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 py-8">
            <div className="p-3 bg-gray-100 rounded-full">
              {isDragging ? (
                <Upload className="h-8 w-8 text-blue-600" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                支持 JPEG、PNG、GIF、WebP 格式，最大 {maxSize}MB
              </p>
              <button
                onClick={handleClick}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                disabled={disabled}
              >
                选择文件
              </button>
            </div>
          </div>
        )}
      </div>

      {/* URL输入框 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          或输入图片URL
        </label>
        <input
          type="url"
          value={value || ''}
          onChange={handleUrlChange}
          placeholder="https://example.com/image.jpg 或 data:image/..."
          className={cn(
            'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500'
          )}
          disabled={disabled}
        />
        {value && !isValidImageUrl(value) && (
          <p className="text-xs text-amber-600">
            ⚠️ URL格式可能不正确，请确保是有效的图片链接
          </p>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;