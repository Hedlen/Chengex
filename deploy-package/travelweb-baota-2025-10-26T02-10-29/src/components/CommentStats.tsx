import React from 'react';
import { MessageSquare } from 'lucide-react';

interface CommentStatsProps {
  count: number;
  className?: string;
}

const CommentStats: React.FC<CommentStatsProps> = ({ count, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MessageSquare size={16} />
      <span>{count.toLocaleString()} 条评论</span>
    </div>
  );
};

export default CommentStats;