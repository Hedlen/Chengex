import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Clock, User } from 'lucide-react';
import { Comment } from '../types/comment';

interface CommentListProps {
  comments: Comment[];
  isLoading?: boolean;
}

const CommentList: React.FC<CommentListProps> = ({ comments, isLoading = false }) => {
  const { t } = useTranslation();

  // 格式化时间
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return '刚刚';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}分钟前`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}小时前`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}天前`;
      } else {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return '未知时间';
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-neutral-200 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-neutral-200 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 bg-neutral-200 rounded w-20" />
                  <div className="h-3 bg-neutral-200 rounded w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-full" />
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 空状态
  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-neutral-200 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={24} className="text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-2">暂无评论</h3>
        <p className="text-text-secondary">
          成为第一个评论的人吧！分享您的想法和感受。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="bg-white rounded-xl p-6 border border-neutral-200 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-start gap-4">
            {/* 头像 */}
            <div className="flex-shrink-0">
              {comment.avatar ? (
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full border-2 border-primary-100"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center ${comment.avatar ? 'hidden' : ''}`}>
                <User size={20} className="text-primary-600" />
              </div>
            </div>

            {/* 评论内容 */}
            <div className="flex-1 min-w-0">
              {/* 评论者信息 */}
              <div className="flex items-center gap-3 mb-3">
                <h4 className="font-semibold text-text-primary truncate">
                  {comment.author}
                </h4>
                <div className="flex items-center gap-1 text-text-secondary text-sm">
                  <Clock size={14} />
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
              </div>

              {/* 评论文本 */}
              <div className="text-text-secondary leading-relaxed">
                <p className="whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;