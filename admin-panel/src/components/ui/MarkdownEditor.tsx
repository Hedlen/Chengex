import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Code, 
  Table,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  className?: string;
  height?: number;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  readOnly?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onSave,
  className,
  height = 500,
  placeholder = '开始编写你的博客内容...',
  autoSave = true,
  autoSaveInterval = 30000, // 30秒
  readOnly = false
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<any>(null);

  // 计算字数和字符数
  const stats = useMemo(() => {
    const text = value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split('\n').length;
    
    return { words, chars, charsNoSpaces, lines };
  }, [value]);

  useEffect(() => {
    setWordCount(stats.words);
    setCharCount(stats.chars);
  }, [stats]);

  // 自动保存
  useEffect(() => {
    if (!autoSave || !onSave) return;

    const timer = setInterval(() => {
      if (value.trim()) {
        onSave();
        setLastSaved(new Date());
      }
    }, autoSaveInterval);

    return () => clearInterval(timer);
  }, [autoSave, autoSaveInterval, onSave, value]);

  // 插入文本的辅助函数
  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    if (readOnly) return;
    
    // 直接在当前光标位置插入文本
    const textToInsert = placeholder;
    const newText = value + before + textToInsert + after;
    onChange(newText);
    
    // 尝试获取编辑器的textarea并设置焦点
    setTimeout(() => {
      const textarea = document.querySelector('.w-md-editor-text-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newCursorPos = newText.length - after.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 100);
  }, [value, onChange, readOnly]);

  // 工具栏按钮配置
  const toolbarButtons = [
    {
      icon: Bold,
      title: '粗体',
      action: () => insertText('**', '**', '粗体文本')
    },
    {
      icon: Italic,
      title: '斜体',
      action: () => insertText('*', '*', '斜体文本')
    },
    {
      icon: Heading1,
      title: '一级标题',
      action: () => insertText('# ', '', '一级标题')
    },
    {
      icon: Heading2,
      title: '二级标题',
      action: () => insertText('## ', '', '二级标题')
    },
    {
      icon: Heading3,
      title: '三级标题',
      action: () => insertText('### ', '', '三级标题')
    },
    {
      icon: List,
      title: '无序列表',
      action: () => insertText('- ', '', '列表项')
    },
    {
      icon: ListOrdered,
      title: '有序列表',
      action: () => insertText('1. ', '', '列表项')
    },
    {
      icon: Link,
      title: '链接',
      action: () => insertText('[', '](url)', '链接文本')
    },
    {
      icon: Image,
      title: '图片',
      action: () => insertText('![', '](image-url)', '图片描述')
    },
    {
      icon: Code,
      title: '代码块',
      action: () => insertText('```\n', '\n```', '代码内容')
    },
    {
      icon: Table,
      title: '表格',
      action: () => insertText('| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| ', ' | | |\n', '内容')
    }
  ];

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
      setLastSaved(new Date());
    }
  }, [onSave]);

  const togglePreview = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const formatLastSaved = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '刚刚保存';
    if (minutes < 60) return `${minutes}分钟前保存`;
    return date.toLocaleTimeString();
  }, []);

  return (
    <div className={cn(
      'border border-gray-300 rounded-lg overflow-hidden',
      isFullscreen && 'fixed inset-0 z-50 bg-white',
      className
    )}>
      {/* 自定义工具栏 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              onClick={button.action}
              title={button.title}
              disabled={readOnly}
              className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <button.icon size={16} />
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {/* 统计信息 */}
          <div className="text-sm text-gray-600 hidden md:block">
            {stats.words} 词 · {stats.chars} 字符 · {stats.lines} 行
          </div>

          {/* 保存状态 */}
          {lastSaved && (
            <div className="text-xs text-gray-500 hidden sm:block">
              {formatLastSaved(lastSaved)}
            </div>
          )}

          {/* 控制按钮 */}
          <button
            onClick={togglePreview}
            title={isPreviewMode ? '显示编辑器' : '仅预览'}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
          >
            {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏模式'}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          {onSave && (
            <button
              onClick={handleSave}
              title="保存"
              disabled={readOnly}
              className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Markdown编辑器 */}
      <div className="relative">
        <MDEditor
          ref={editorRef}
          value={value || ''}
          onChange={(val) => {
            if (!readOnly) {
              onChange(val || '');
            }
          }}
          preview={isPreviewMode ? 'preview' : 'edit'}
          hideToolbar
          visibleDragbar={false}
          height={isFullscreen ? window.innerHeight - 100 : height}
          data-color-mode="light"
          textareaProps={{
            placeholder,
            style: {
              fontSize: 14,
              lineHeight: 1.6,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            },
            readOnly,
            disabled: readOnly
          }}
        />
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-t text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>字数: {stats.words}</span>
          <span>字符: {stats.chars}</span>
          <span>行数: {stats.lines}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {autoSave && (
            <span className="text-green-600">自动保存已开启</span>
          )}
          {readOnly && (
            <span className="text-orange-600">只读模式</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;