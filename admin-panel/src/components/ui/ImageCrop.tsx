import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { RotateCw, Download, X, Crop as CropIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropProps {
  src: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  className?: string;
  initialCrop?: Crop;
}

const ImageCrop: React.FC<ImageCropProps> = ({
  src,
  onCropComplete,
  onCancel,
  aspectRatio,
  className,
  initialCrop
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 初始化裁剪区域
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    let newCrop: Crop;
    
    if (initialCrop) {
      newCrop = initialCrop;
    } else if (aspectRatio) {
      newCrop = makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        aspectRatio,
        width,
        height
      );
    } else {
      newCrop = centerCrop(
        {
          unit: '%',
          width: 80,
          height: 80,
        },
        width,
        height
      );
    }
    
    setCrop(newCrop);
  }, [aspectRatio, initialCrop]);

  // 生成裁剪后的图片
  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.imageSmoothingQuality = 'high';

    // 应用旋转和缩放
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.restore();

    // 转换为Base64编码，避免使用blob URL
    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageUrl);
  }, [completedCrop, rotation, scale, onCropComplete]);

  // 旋转图片
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // 重置所有设置
  const handleReset = useCallback(() => {
    setRotation(0);
    setScale(1);
    if (imgRef.current) {
      onImageLoad({ currentTarget: imgRef.current } as React.SyntheticEvent<HTMLImageElement>);
    }
  }, [onImageLoad]);

  // 下载裁剪后的图片
  const handleDownload = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cropped-image-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 0.9);
  }, [completedCrop]);

  return (
    <div className={cn('fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50', className)}>
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        {/* 头部工具栏 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <CropIcon className="mr-2" size={20} />
            图片裁剪
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 控制面板 */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">缩放:</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600">{scale.toFixed(1)}x</span>
          </div>

          <button
            onClick={handleRotate}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <RotateCw size={16} />
            <span>旋转</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            重置
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            <Download size={16} />
            <span>下载</span>
          </button>
        </div>

        {/* 裁剪区域 */}
        <div className="relative max-w-full max-h-96 overflow-auto border rounded-lg">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={50}
            minHeight={50}
          >
            <img
              ref={imgRef}
              src={src}
              alt="裁剪图片"
              onLoad={onImageLoad}
              style={{
                transform: `rotate(${rotation}deg) scale(${scale})`,
                maxWidth: '100%',
                maxHeight: '400px',
              }}
            />
          </ReactCrop>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={generateCroppedImage}
            disabled={!completedCrop}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            确认裁剪
          </button>
        </div>

        {/* 隐藏的canvas用于生成裁剪后的图片 */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageCrop;