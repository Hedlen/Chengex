import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DataManager } from '../../shared/api/dataManager';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock admin credentials - in a real app, this would be handled by a backend
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用sessionStorage保留会话管理（符合技术架构要求）
  const getSessionToken = (): string | null => {
    return sessionStorage.getItem('auth_token');
  };

  const setSessionToken = (token: string): void => {
    sessionStorage.setItem('auth_token', token);
  };

  const removeSessionToken = (): void => {
    sessionStorage.removeItem('auth_token');
  };

  // 验证会话token并获取用户信息
  const validateSession = async (): Promise<User | null> => {
    const token = getSessionToken();
    if (!token) {
      return null;
    }

    try {
      // 这里应该调用后端API验证token，暂时使用模拟逻辑
      // 在实际实现中，应该有一个 /api/auth/validate 端点
      if (token === 'admin_session_token') {
        const adminUser: User = {
          id: '1',
          username: 'admin',
          role: 'admin',
          email: 'admin@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return adminUser;
      }
      return null;
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  };

  // 初始化时验证会话
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        const validatedUser = await validateSession();
        setUser(validatedUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : '认证初始化失败');
        console.error('Auth initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const adminUser: User = {
          id: '1',
          username: 'admin',
          role: 'admin',
          email: 'admin@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // 生成会话token（在实际应用中应该由后端生成）
        const sessionToken = 'admin_session_token';
        
        setUser(adminUser);
        setSessionToken(sessionToken);

        // 记录登录活动
        try {
          await DataManager.addActivityLog({
            action: 'login',
            type: 'login',
            description: `用户 ${adminUser.username} 登录系统`,
            userId: adminUser.id,
            details: { loginMethod: 'password', userAgent: navigator.userAgent }
          });
        } catch (logError) {
          console.warn('Failed to log activity:', logError);
          // 不影响登录流程
        }

        return true;
      }

      setError('用户名或密码错误');
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      console.error('Login failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      // 记录登出活动到数据库
      if (user) {
        try {
          await DataManager.addActivityLog({
            action: 'logout',
            type: 'logout',
            description: `用户 ${user.username} 登出系统`,
            userId: user.id,
            details: { logoutMethod: 'manual', userAgent: navigator.userAgent }
          });
        } catch (logError) {
          console.error('记录登出活动失败:', logError);
          // 不影响登出流程
        }
      }

      setUser(null);
      removeSessionToken();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登出失败');
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};