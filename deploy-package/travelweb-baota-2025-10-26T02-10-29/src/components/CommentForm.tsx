import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, User, Mail, MessageSquare } from 'lucide-react';
import { CommentFormState, CommentFormErrors, NewComment } from '../types/comment';

interface CommentFormProps {
  onSubmit: (comment: NewComment) => Promise<void>;
  isSubmitting?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, isSubmitting = false }) => {
  const { t } = useTranslation();
  
  const [formState, setFormState] = useState<CommentFormState>({
    author: '',
    email: '',
    content: '',
    isSubmitting: false,
    errors: {}
  });

  // 表单验证
  const validateForm = (): CommentFormErrors => {
    const errors: CommentFormErrors = {};

    if (!formState.author.trim()) {
      errors.author = '请输入您的昵称';
    } else if (formState.author.trim().length < 2) {
      errors.author = '昵称至少需要2个字符';
    }

    if (!formState.email.trim()) {
      errors.email = '请输入您的邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    if (!formState.content.trim()) {
      errors.content = '请输入评论内容';
    } else if (formState.content.trim().length < 5) {
      errors.content = '评论内容至少需要5个字符';
    }

    return errors;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({ ...prev, errors }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

    try {
      await onSubmit({
        author: formState.author.trim(),
        email: formState.email.trim(),
        content: formState.content.trim()
      });

      // 重置表单
      setFormState({
        author: '',
        email: '',
        content: '',
        isSubmitting: false,
        errors: {}
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: { content: '评论提交失败，请重试' }
      }));
    }
  };

  // 处理输入变化
  const handleInputChange = (field: keyof Pick<CommentFormState, 'author' | 'email' | 'content'>) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState(prev => ({
        ...prev,
        [field]: e.target.value,
        errors: { ...prev.errors, [field]: undefined }
      }));
    };

  const isFormSubmitting = formState.isSubmitting || isSubmitting;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <MessageSquare size={20} className="text-primary-600" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary">发表评论</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 昵称和邮箱 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-text-primary mb-2">
              <User size={16} className="inline mr-2" />
              昵称 *
            </label>
            <input
              type="text"
              id="author"
              value={formState.author}
              onChange={handleInputChange('author')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                formState.errors.author 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
              placeholder="请输入您的昵称"
              disabled={isFormSubmitting}
            />
            {formState.errors.author && (
              <p className="mt-1 text-sm text-red-600">{formState.errors.author}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
              <Mail size={16} className="inline mr-2" />
              邮箱 *
            </label>
            <input
              type="email"
              id="email"
              value={formState.email}
              onChange={handleInputChange('email')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                formState.errors.email 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
              placeholder="请输入您的邮箱"
              disabled={isFormSubmitting}
            />
            {formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">{formState.errors.email}</p>
            )}
          </div>
        </div>

        {/* 评论内容 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-text-primary mb-2">
            评论内容 *
          </label>
          <textarea
            id="content"
            rows={4}
            value={formState.content}
            onChange={handleInputChange('content')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none ${
              formState.errors.content 
                ? 'border-red-300 bg-red-50' 
                : 'border-neutral-300 hover:border-neutral-400'
            }`}
            placeholder="请输入您的评论内容..."
            disabled={isFormSubmitting}
          />
          {formState.errors.content && (
            <p className="mt-1 text-sm text-red-600">{formState.errors.content}</p>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isFormSubmitting}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              isFormSubmitting
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 text-white hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {isFormSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send size={16} />
                发表评论
              </>
            )}
          </button>
        </div>
      </form>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-sm text-text-secondary">
          <span className="font-medium">温馨提示：</span>
          请文明发言，您的邮箱地址不会被公开显示。
        </p>
      </div>
    </div>
  );
};

export default CommentForm;