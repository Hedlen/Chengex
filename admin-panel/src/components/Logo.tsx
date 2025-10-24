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

  return (
    <img 
      src={logoSrc}
      alt="探索成都管理后台 - Explore Chengdu Admin"
      className={`${sizeClasses[size]} ${className} transition-all duration-300 hover:scale-105`}
    />
  );
};

// 侧边栏Logo组件
export const SidebarLogo: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  return (
    <div className="flex items-center justify-center p-4">
      {collapsed ? (
        <Logo variant="icon" size="small" />
      ) : (
        <Logo variant="simple" size="medium" />
      )}
    </div>
  );
};

// 登录页Logo组件
export const LoginLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center mb-8">
      <Logo variant="full" size="large" className="mb-2" />
    </div>
  );
};

export default Logo;