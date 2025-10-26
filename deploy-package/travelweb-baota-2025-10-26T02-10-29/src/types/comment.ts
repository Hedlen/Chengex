// 评论系统类型定义

export interface Comment {
  id: string;
  blogId: string;
  author: string;
  email: string;
  content: string;
  status?: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
  avatar?: string;
}

export interface NewComment {
  author: string;
  email: string;
  content: string;
  parentId?: string;
}

export interface CommentContextType {
  // 获取指定博客的评论列表
  getComments: (blogId: string) => Promise<Comment[]>;
  
  // 添加新评论
  addComment: (blogId: string, comment: NewComment) => Promise<Comment>;
  
  // 获取评论数量
  getCommentCount: (blogId: string) => Promise<number>;
  
  // 删除评论
  deleteComment: (commentId: string, blogId: string) => Promise<void>;
  
  // 更新评论状态
  updateCommentStatus: (commentId: string, status: string, blogId: string) => Promise<void>;
  
  // 清除缓存
  clearCache: (blogId?: string) => void;
  
  // 刷新评论
  refreshComments: (blogId: string) => Promise<Comment[]>;
  
  // 加载状态
  loading: Record<string, boolean>;
}

// 评论表单验证错误类型
export interface CommentFormErrors {
  author?: string;
  email?: string;
  content?: string;
}

// 评论表单状态类型
export interface CommentFormState {
  author: string;
  email: string;
  content: string;
  isSubmitting: boolean;
  errors: CommentFormErrors;
}