import { AdminUser } from '@shared/types';

// JWT Token 工具函数
export const tokenUtils = {
  // 获取Token
  getToken(): string | null {
    return localStorage.getItem('adminToken');
  },

  // 设置Token
  setToken(token: string): void {
    localStorage.setItem('adminToken', token);
  },

  // 移除Token
  removeToken(): void {
    localStorage.removeItem('adminToken');
  },

  // 验证Token是否有效
  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  },

  // 获取Token载荷
  getTokenPayload(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  },

  // 检查Token是否即将过期（30分钟内）
  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = this.getTokenPayload(token);
      if (!payload) return true;
      
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      return timeUntilExpiry < 30 * 60; // 30分钟
    } catch {
      return true;
    }
  }
};

// 用户权限检查
export const permissionUtils = {
  // 检查用户是否有特定权限
  hasPermission(user: AdminUser, permission: string): boolean {
    if (!user || !user.permissions) return false;
    
    // 超级管理员拥有所有权限
    if (user.permissions.includes('*')) return true;
    
    // 检查具体权限
    return user.permissions.includes(permission);
  },

  // 检查用户是否有任一权限
  hasAnyPermission(user: AdminUser, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  },

  // 检查用户是否有所有权限
  hasAllPermissions(user: AdminUser, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  },

  // 获取用户角色权限映射
  getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*'], // 超级管理员
      'editor': [
        'videos:read', 'videos:write', 'videos:delete',
        'blogs:read', 'blogs:write', 'blogs:delete',
        'dashboard:read'
      ],
      'viewer': [
        'videos:read', 'blogs:read', 'dashboard:read'
      ]
    };

    return rolePermissions[role] || [];
  }
};

// 会话管理
export const sessionUtils = {
  // 获取会话信息
  getSession(): { user: AdminUser; token: string } | null {
    try {
      const token = tokenUtils.getToken();
      const userData = localStorage.getItem('adminUser');
      
      if (!token || !userData) return null;
      
      if (!tokenUtils.isTokenValid(token)) {
        this.clearSession();
        return null;
      }
      
      return {
        user: JSON.parse(userData),
        token
      };
    } catch {
      this.clearSession();
      return null;
    }
  },

  // 设置会话
  setSession(user: AdminUser, token: string): void {
    tokenUtils.setToken(token);
    localStorage.setItem('adminUser', JSON.stringify(user));
  },

  // 清除会话
  clearSession(): void {
    tokenUtils.removeToken();
    localStorage.removeItem('adminUser');
  },

  // 刷新会话（延长过期时间）
  refreshSession(): boolean {
    const session = this.getSession();
    if (!session) return false;

    try {
      // 创建新的Token
      const tokenPayload = {
        userId: session.user.id,
        username: session.user.username,
        role: session.user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
      };

      const newToken = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
                      btoa(JSON.stringify(tokenPayload)) + '.' +
                      btoa('signature');

      this.setSession(session.user, newToken);
      return true;
    } catch {
      return false;
    }
  }
};

// 密码工具
export const passwordUtils = {
  // 验证密码强度
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('密码长度至少8位');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    
    if (!/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // 生成随机密码
  generatePassword(length: number = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
};

// API请求拦截器
export const apiUtils = {
  // 获取带认证头的请求配置
  getAuthHeaders(): Record<string, string> {
    const token = tokenUtils.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // 处理API响应
  async handleApiResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      // Token过期或无效，清除会话
      sessionUtils.clearSession();
      window.location.href = '/login';
      throw new Error('认证失败，请重新登录');
    }
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || '请求失败');
    }
    
    return response.json();
  }
};