import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // 自定义组件配置
  const components = {
    // 标题组件
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold mb-6 text-text-primary border-b border-neutral-200 pb-3">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold mb-5 text-text-primary border-b border-neutral-100 pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-medium mb-4 text-text-primary">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-medium mb-3 text-text-primary">
        {children}
      </h4>
    ),
    h5: ({ children }: any) => (
      <h5 className="text-base font-medium mb-3 text-text-primary">
        {children}
      </h5>
    ),
    h6: ({ children }: any) => (
      <h6 className="text-sm font-medium mb-2 text-text-primary">
        {children}
      </h6>
    ),

    // 段落组件
    p: ({ children }: any) => (
      <p className="mb-4 leading-relaxed text-text-secondary">
        {children}
      </p>
    ),

    // 引用块组件
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary-500 pl-6 py-4 mb-6 bg-primary-50 rounded-r-lg italic text-text-secondary">
        {children}
      </blockquote>
    ),

    // 代码组件
    code: ({ children, className }: any) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-neutral-100 px-2 py-1 rounded text-sm font-mono text-primary-700 border">
          {children}
        </code>
      ) : (
        <code className={className}>{children}</code>
      );
    },

    // 代码块组件
    pre: ({ children }: any) => (
      <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg mb-6 overflow-x-auto border">
        {children}
      </pre>
    ),

    // 列表组件
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-text-secondary pl-4">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-text-secondary pl-4">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed">
        {children}
      </li>
    ),

    // 链接组件
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-700 underline decoration-primary-300 hover:decoration-primary-500 transition-colors"
      >
        {children}
      </a>
    ),

    // 图片组件
    img: ({ src, alt }: any) => (
      <div className="mb-6">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto rounded-lg shadow-md border border-neutral-200"
          loading="lazy"
        />
        {alt && (
          <p className="text-sm text-text-secondary text-center mt-2 italic">
            {alt}
          </p>
        )}
      </div>
    ),

    // 表格组件
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border border-neutral-200 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-neutral-50">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-neutral-200">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-neutral-50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-neutral-200">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-sm text-text-secondary">
        {children}
      </td>
    ),

    // 分隔线组件
    hr: () => (
      <hr className="my-8 border-t border-neutral-200" />
    ),

    // 强调组件
    strong: ({ children }: any) => (
      <strong className="font-semibold text-text-primary">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-text-secondary">
        {children}
      </em>
    ),
  };

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;