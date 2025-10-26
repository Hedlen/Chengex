import React from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className = ''
}: TabsProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const getTabClasses = (tab: Tab) => {
    const baseClasses = `
      font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
      ${sizeClasses[size]}
      ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `;

    const isActive = tab.id === activeTab;

    switch (variant) {
      case 'pills':
        return `
          ${baseClasses}
          rounded-lg
          ${isActive 
            ? 'bg-primary-600 text-white shadow-md' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }
        `;
      
      case 'underline':
        return `
          ${baseClasses}
          border-b-2 pb-2
          ${isActive 
            ? 'border-primary-600 text-primary-600' 
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }
        `;
      
      default:
        return `
          ${baseClasses}
          border border-gray-300 -mb-px
          ${isActive 
            ? 'bg-white text-primary-600 border-primary-600 border-b-white z-10' 
            : 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }
          ${tab === tabs[0] ? 'rounded-tl-lg' : ''}
          ${tab === tabs[tabs.length - 1] ? 'rounded-tr-lg' : ''}
        `;
    }
  };

  const getContainerClasses = () => {
    switch (variant) {
      case 'pills':
        return 'flex space-x-1 bg-gray-100 p-1 rounded-lg';
      
      case 'underline':
        return 'flex space-x-8 border-b border-gray-200';
      
      default:
        return 'flex';
    }
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className={getContainerClasses()}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={getTabClasses(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className={`mt-4 ${variant === 'default' ? 'border border-gray-300 border-t-0 rounded-b-lg p-4' : ''}`}>
        {activeTabContent}
      </div>
    </div>
  );
}