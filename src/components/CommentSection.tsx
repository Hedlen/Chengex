import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { useComment } from '../contexts/CommentContext';
import { Comment, NewComment } from '../types/comment';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import CommentStats from './CommentStats';
import { useAnalytics } from '@/contexts/AnalyticsContext';

interface CommentSectionProps {
  blogId: string | number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ blogId }) => {
  const { t } = useTranslation();
  const { getComments, addComment, getCommentCount, loading } = useComment();
  const { trackComment } = useAnalytics();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 转换blogId为字符串
  const blogIdStr = String(blogId);

  // 加载评论
  const loadComments = async () => {
    try {
      const [blogComments, count] = await Promise.all([
        getComments(blogIdStr),
        getCommentCount(blogIdStr)
      ]);
      setComments(blogComments);
      setCommentCount(count);
    } catch (error) {
      console.error('加载评论失败:', error);
    }
  };

  // 初始加载评论
  useEffect(() => {
    loadComments();
  }, [blogIdStr]);

  // 处理评论提交
  const handleCommentSubmit = async (newComment: NewComment): Promise<void> => {
    setIsSubmitting(true);
    try {
      const comment = await addComment(blogIdStr, newComment);
      
      // 追踪评论事件
      trackComment(blogIdStr, 'blog', comment.content.length);
      
      // 更新本地状态
      setComments(prev => [comment, ...prev]);
      setCommentCount(prev => prev + 1);
      
      console.log('评论添加成功:', comment);
    } catch (error) {
      console.error('添加评论失败:', error);
      throw error; // 重新抛出错误，让表单组件处理
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* 评论区标题 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <MessageSquare size={24} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">评论区</h2>
                <CommentStats count={commentCount} className="text-text-secondary" />
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-primary-200 via-primary-100 to-transparent" />
          </div>

          {/* 评论表单 */}
          <div className="mb-8">
            <CommentForm 
              onSubmit={handleCommentSubmit}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* 评论列表 */}
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary">
                {commentCount > 0 ? `全部评论 (${commentCount})` : '评论列表'}
              </h3>
            </div>
            
            <CommentList 
              comments={comments}
              isLoading={loading[blogIdStr] || false}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommentSection;