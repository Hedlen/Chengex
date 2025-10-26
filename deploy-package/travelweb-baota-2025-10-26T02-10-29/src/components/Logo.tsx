import React from 'react';

interface LogoProps {
  variant?: 'full' | 'simple' | 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  size = 'medium',
  className = '' 
}) => {
  const logoSrc = `/logo/logo-${variant}.svg`;
  
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-12', 
    large: 'h-16'
  };

  const responsiveClasses = variant === 'full' 
    ? 'hidden sm:block' 
    : variant === 'icon' 
    ? 'block sm:hidden' 
    : '';

  return (
    <img 
      src={logoSrc}
      alt="探索成都 - Explore Chengdu"
      className={`${sizeClasses[size]} ${responsiveClasses} ${className} transition-all duration-300 hover:scale-105`}
    />
  );
};

// 响应式Logo组合组件
export const ResponsiveLogo: React.FC<Omit<LogoProps, 'variant'>> = ({ 
  size = 'medium', 
  className = '' 
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* 桌面端显示完整Logo */}
      <Logo variant="full" size={size} className="hidden md:block" />
      {/* 平板端显示简化Logo */}
      <Logo variant="simple" size={size} className="hidden sm:block md:hidden" />
      {/* 移动端显示图标Logo */}
      <Logo variant="icon" size={size} className="block sm:hidden" />
    </div>
  );
};

export default Logo;