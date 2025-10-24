import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  showFallback?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  showFallback = true,
  className = '',
  onClick
}: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const baseClasses = `
    inline-flex items-center justify-center bg-gray-300 overflow-hidden
    ${sizeClasses[size]}
    ${shapeClasses[shape]}
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
  `;

  const renderContent = () => {
    if (src) {
      return (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            if (showFallback) {
              e.currentTarget.style.display = 'none';
            }
          }}
        />
      );
    }

    if (name && showFallback) {
      return (
        <span className="font-medium text-gray-700">
          {getInitials(name)}
        </span>
      );
    }

    if (showFallback) {
      return <User className="w-1/2 h-1/2 text-gray-500" />;
    }

    return null;
  };

  return (
    <div
      className={`${baseClasses} ${className}`}
      onClick={onClick}
    >
      {renderContent()}
    </div>
  );
}