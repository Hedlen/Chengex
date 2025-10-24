import React, { useMemo } from 'react';
import { Hash, ChevronRight } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
  anchor: string;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  onItemClick?: (anchor: string) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  className = '',
  onItemClick
}) => {
  // 解析Markdown内容，提取标题
  const tocItems = useMemo(() => {
    if (!content) return [];

    const lines = content.split('\n');
    const items: TocItem[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const anchor = text
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留中文、英文、数字、空格和连字符
          .replace(/\s+/g, '-') // 空格替换为连字符
          .replace(/-+/g, '-') // 多个连字符合并为一个
          .replace(/^-|-$/g, ''); // 去除首尾连字符
        
        items.push({
          id: `heading-${index}`,
          text,
          level,
          anchor: anchor || `heading-${index}`
        });
      }
    });

    return items;
  }, [content]);

  const handleItemClick = (anchor: string) => {
    if (onItemClick) {
      onItemClick(anchor);
    } else {
      // 默认行为：滚动到对应位置
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (tocItems.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <Hash size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无目录</p>
        <p className="text-xs mt-1">添加标题后将自动生成目录</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
        <Hash size={16} />
        <span>目录</span>
      </div>
      
      <nav className="space-y-1">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.anchor)}
            className={`
              w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 transition-colors
              ${item.level === 1 ? 'font-medium text-gray-900' : ''}
              ${item.level === 2 ? 'text-gray-700 ml-3' : ''}
              ${item.level === 3 ? 'text-gray-600 ml-6' : ''}
              ${item.level === 4 ? 'text-gray-500 ml-9' : ''}
              ${item.level === 5 ? 'text-gray-500 ml-12' : ''}
              ${item.level === 6 ? 'text-gray-500 ml-15' : ''}
            `}
          >
            <div className="flex items-center gap-1">
              {item.level > 1 && (
                <ChevronRight size={12} className="opacity-50" />
              )}
              <span className="truncate">{item.text}</span>
            </div>
          </button>
        ))}
      </nav>
      
      {tocItems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            共 {tocItems.length} 个标题
          </div>
        </div>
      )}
    </div>
  );
};

export default TableOfContents;