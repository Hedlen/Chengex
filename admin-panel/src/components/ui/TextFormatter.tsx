import React from 'react';
import { Type, AlignLeft, Zap } from 'lucide-react';

interface TextFormatterProps {
  content: string;
  onFormat: (formattedContent: string) => void;
  className?: string;
}

const TextFormatter: React.FC<TextFormatterProps> = ({
  content,
  onFormat,
  className = ''
}) => {
  // 格式化中文标点符号
  const formatPunctuation = (text: string): string => {
    return text
      // 中文标点符号后添加适当空格
      .replace(/([，。！？；：])\s*/g, '$1 ')
      // 英文标点符号后确保有空格
      .replace(/([,.!?;:])\s*/g, '$1 ')
      // 括号前后添加空格
      .replace(/\s*([（(])\s*/g, ' $1')
      .replace(/\s*([）)])\s*/g, '$1 ')
      // 引号处理
      .replace(/\s*([""''])\s*/g, ' $1 ')
      // 清理多余空格
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 格式化段落间距
  const formatParagraphs = (text: string): string => {
    return text
      // 确保段落之间有空行
      .replace(/\n\s*\n/g, '\n\n')
      // 清理行首行尾空格
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // 确保标题前后有空行
      .replace(/\n(#{1,6}\s+[^\n]+)\n/g, '\n\n$1\n\n')
      // 确保列表前后有空行
      .replace(/\n([*+-]\s+[^\n]+)/g, '\n\n$1')
      .replace(/\n(\d+\.\s+[^\n]+)/g, '\n\n$1')
      // 清理多余空行
      .replace(/\n{3,}/g, '\n\n');
  };

  // 格式化代码块
  const formatCodeBlocks = (text: string): string => {
    return text
      // 确保代码块前后有空行
      .replace(/\n```/g, '\n\n```')
      .replace(/```\n/g, '```\n\n')
      // 确保行内代码前后有适当空格
      .replace(/([^\s])`([^`]+)`([^\s])/g, '$1 `$2` $3');
  };

  // 格式化链接和图片
  const formatLinksAndImages = (text: string): string => {
    return text
      // 确保链接前后有适当空格
      .replace(/([^\s])\[([^\]]+)\]\(([^)]+)\)([^\s])/g, '$1 [$2]($3) $4')
      // 确保图片前后有空行
      .replace(/\n!\[([^\]]*)\]\(([^)]+)\)\n/g, '\n\n![$1]($2)\n\n');
  };

  // 格式化表格
  const formatTables = (text: string): string => {
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableRow = line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|');
      
      if (isTableRow && !inTable) {
        // 表格开始，前面加空行
        if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() !== '') {
          formattedLines.push('');
        }
        inTable = true;
      } else if (!isTableRow && inTable) {
        // 表格结束，后面加空行
        inTable = false;
        formattedLines.push(line);
        if (line.trim() !== '') {
          formattedLines.push('');
        }
        continue;
      }

      formattedLines.push(line);
    }

    return formattedLines.join('\n');
  };

  // 综合格式化
  const formatAll = () => {
    let formatted = content;
    
    // 应用所有格式化规则
    formatted = formatPunctuation(formatted);
    formatted = formatParagraphs(formatted);
    formatted = formatCodeBlocks(formatted);
    formatted = formatLinksAndImages(formatted);
    formatted = formatTables(formatted);
    
    // 最终清理
    formatted = formatted
      .replace(/\n{3,}/g, '\n\n') // 清理多余空行
      .trim(); // 去除首尾空白
    
    onFormat(formatted);
  };

  // 仅格式化标点符号
  const formatPunctuationOnly = () => {
    const formatted = formatPunctuation(content);
    onFormat(formatted);
  };

  // 仅格式化段落
  const formatParagraphsOnly = () => {
    const formatted = formatParagraphs(content);
    onFormat(formatted);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
        <Type size={16} />
        <span>排版优化</span>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={formatAll}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
        >
          <Zap size={14} />
          <span>一键优化排版</span>
        </button>
        
        <button
          onClick={formatPunctuationOnly}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
        >
          <Type size={14} />
          <span>优化标点符号</span>
        </button>
        
        <button
          onClick={formatParagraphsOnly}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
        >
          <AlignLeft size={14} />
          <span>优化段落间距</span>
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mt-3 p-2 bg-gray-50 rounded">
        <p className="font-medium mb-1">优化内容包括：</p>
        <ul className="space-y-1">
          <li>• 标点符号规范化</li>
          <li>• 段落间距调整</li>
          <li>• 代码块格式化</li>
          <li>• 链接和图片间距</li>
          <li>• 表格格式优化</li>
        </ul>
      </div>
    </div>
  );
};

export default TextFormatter;