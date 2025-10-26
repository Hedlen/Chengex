import React, { createContext, useContext, useCallback, useState } from 'react';
import { Comment, NewComment, CommentContextType } from '../types/comment';
import { DataManager } from '../../shared/api/dataManager';

// 创建Context
const CommentContext = createContext<CommentContextType | undefined>(undefined);

// Provider组件
export const CommentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [commentsCache, setCommentsCache] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // 获取指定博客的评论
  const getComments = useCallback(async (blogId: string): Promise<Comment[]> => {
    try {
      // 如果缓存中有数据且不在加载中，直接返回缓存
      if (commentsCache[blogId] && !loading[blogId]) {
        return commentsCache[blogId];
      }

      setLoading(prev => ({ ...prev, [blogId]: true }));
      
      const comments = await DataManager.getComments(blogId);
      
      // 更新缓存
      setCommentsCache(prev => ({ ...prev, [blogId]: comments }));
      
      return comments;
    } catch (error) {
      console.error('获取评论失败:', error);
      return commentsCache[blogId] || [];
    } finally {
      setLoading(prev => ({ ...prev, [blogId]: false }));
    }
  }, [commentsCache, loading]);

  // 添加新评论
  const addComment = useCallback(async (blogId: string, newComment: NewComment): Promise<Comment> => {
    try {
      const result = await DataManager.createComment({
        blogId,
        author: newComment.author,
        email: newComment.email,
        content: newComment.content,
        parentId: newComment.parentId
      });

      if (!result.success) {
        throw new Error(result.error || '创建评论失败');
      }

      const comment = result.data;
      
      // 更新本地缓存
      setCommentsCache(prev => ({
        ...prev,
        [blogId]: [comment, ...(prev[blogId] || [])]
      }));

      return comment;
    } catch (error) {
      console.error('添加评论失败:', error);
      throw new Error('添加评论失败: ' + (error as Error).message);
    }
  }, []);

  // 获取评论数量
  const getCommentCount = useCallback(async (blogId: string): Promise<number> => {
    try {
      // 优先从缓存获取
      if (commentsCache[blogId]) {
        return commentsCache[blogId].length;
      }
      
      // 从数据库获取
      return await DataManager.getCommentCount(blogId);
    } catch (error) {
      console.error('获取评论数量失败:', error);
      return 0;
    }
  }, [commentsCache]);

  // 删除评论
  const deleteComment = useCallback(async (commentId: string, blogId: string): Promise<void> => {
    try {
      const result = await DataManager.deleteComment(commentId);
      
      if (!result.success) {
        throw new Error(result.error || '删除评论失败');
      }

      // 更新本地缓存
      setCommentsCache(prev => ({
        ...prev,
        [blogId]: (prev[blogId] || []).filter(comment => comment.id !== commentId)
      }));
    } catch (error) {
      console.error('删除评论失败:', error);
      throw new Error('删除评论失败: ' + (error as Error).message);
    }
  }, []);

  // 更新评论状态
  const updateCommentStatus = useCallback(async (commentId: string, status: string, blogId: string): Promise<void> => {
    try {
      const result = await DataManager.updateCommentStatus(commentId, status);
      
      if (!result.success) {
        throw new Error(result.error || '更新评论状态失败');
      }

      // 更新本地缓存
      setCommentsCache(prev => ({
        ...prev,
        [blogId]: (prev[blogId] || []).map(comment => 
          comment.id === commentId ? { ...comment, status } : comment
        )
      }));
    } catch (error) {
      console.error('更新评论状态失败:', error);
      throw new Error('更新评论状态失败: ' + (error as Error).message);
    }
  }, []);

  // 清除缓存
  const clearCache = useCallback((blogId?: string) => {
    if (blogId) {
      setCommentsCache(prev => {
        const newCache = { ...prev };
        delete newCache[blogId];
        return newCache;
      });
    } else {
      setCommentsCache({});
    }
  }, []);

  // 刷新评论
  const refreshComments = useCallback(async (blogId: string): Promise<Comment[]> => {
    try {
      setLoading(prev => ({ ...prev, [blogId]: true }));
      
      const comments = await DataManager.getComments(blogId);
      
      // 更新缓存
      setCommentsCache(prev => ({ ...prev, [blogId]: comments }));
      
      return comments;
    } catch (error) {
      console.error('刷新评论失败:', error);
      return commentsCache[blogId] || [];
    } finally {
      setLoading(prev => ({ ...prev, [blogId]: false }));
    }
  }, [commentsCache]);

  const value: CommentContextType = {
    getComments,
    addComment,
    getCommentCount,
    deleteComment,
    updateCommentStatus,
    clearCache,
    refreshComments,
    loading
  };

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
};

// Hook for using comment context
export const useComment = (): CommentContextType => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComment must be used within a CommentProvider');
  }
  return context;
};

// 导出Context以供其他组件使用
export { CommentContext };