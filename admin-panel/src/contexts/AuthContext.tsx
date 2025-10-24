import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '@shared/types';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 检查认证状态
  const checkAuth = () => {
    try {
      // 在真实应用中，这里应该调用API验证token
      // 目前暂时保持简单的本地验证
      const token = sessionStorage.getItem('adminToken');
      const userData = sessionStorage.getItem('adminUser');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      } else {
        // 开发模式自动登录
        if (import.meta.env.DEV) {
          const devUserData: AdminUser = {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
            permissions: ['*'],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const devToken = 'dev-admin-session-token';
          sessionStorage.setItem('adminToken', devToken);
          sessionStorage.setItem('adminUser', JSON.stringify(devUserData));
          setUser(devUserData);
          console.log('Development mode: Auto-logged in as admin');
        }
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminUser');
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // 在真实应用中，这里应该调用登录API
      // 目前使用简单的硬编码验证
      if (username === 'admin' && password === 'admin123') {
        const userData: AdminUser = {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          permissions: ['*'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const token = 'admin-session-token';

        // 使用sessionStorage而不是localStorage
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminUser', JSON.stringify(userData));
        
        setUser(userData);
        
        // 记录登录日志到API
        try {
          await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITY_LOGS), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'login',
              description: '管理员登录成功',
              userId: userData.id,
              details: { username: userData.username }
            }),
          });
        } catch (logError) {
          console.warn('记录登录日志失败:', logError);
        }
        
        return { success: true };
      } else {
        return { success: false, error: '用户名或密码错误' };
      }
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, error: '登录过程中发生错误' };
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      // 记录登出日志到API
      if (user) {
        try {
          await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITY_LOGS), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'logout',
              description: '管理员登出',
              userId: user.id,
              details: { username: user.username }
            }),
          });
        } catch (logError) {
          console.warn('记录登出日志失败:', logError);
        }
      }
      
      // 清除认证数据
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminUser');
      setUser(null);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};