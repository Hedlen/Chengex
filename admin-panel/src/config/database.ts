// 数据库连接配置和测试功能
import { API_CONFIG } from './api';

// 连接状态枚举
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error'
}

// 数据库信息接口
export interface DatabaseInfo {
  type: string;
  host: string;
  port: number;
  database: string;
  status: string;
  connectionCount?: number;
  lastConnected?: string;
}

// 连接测试结果接口
export interface ConnectionTestResult {
  status: ConnectionStatus;
  message: string;
  timestamp: number;
  responseTime?: number;
  databaseInfo?: DatabaseInfo;
  error?: string;
}

// 数据库连接配置
export const DATABASE_CONFIG = {
  // 健康检查端点
  HEALTH_CHECK_ENDPOINT: import.meta.env.VITE_API_HEALTH_CHECK || '/api/health',
  
  // 数据库信息端点
  DATABASE_INFO_ENDPOINT: import.meta.env.VITE_API_DATABASE_INFO || '/api/database/info',
  
  // 连接测试间隔（毫秒）
  CHECK_INTERVAL: parseInt(import.meta.env.VITE_CONNECTION_CHECK_INTERVAL) || 30000,
  
  // 连接超时时间（毫秒）
  TIMEOUT: parseInt(import.meta.env.VITE_CONNECTION_TIMEOUT) || 10000,
  
  // 重试次数
  RETRY_COUNT: parseInt(import.meta.env.VITE_CONNECTION_RETRY_COUNT) || 3,
  
  // 重试间隔（毫秒）
  RETRY_DELAY: parseInt(import.meta.env.VITE_CONNECTION_RETRY_DELAY) || 2000,
};

/**
 * 测试 API 服务器连接
 */
export const testApiConnection = async (): Promise<ConnectionTestResult> => {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DATABASE_CONFIG.TIMEOUT);
    
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${DATABASE_CONFIG.HEALTH_CHECK_ENDPOINT}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        status: ConnectionStatus.CONNECTED,
        message: 'API 服务器连接正常',
        timestamp: Date.now(),
        responseTime,
        databaseInfo: data.database,
      };
    } else {
      return {
        status: ConnectionStatus.ERROR,
        message: `API 服务器响应错误: ${response.status} ${response.statusText}`,
        timestamp: Date.now(),
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      return {
        status: ConnectionStatus.ERROR,
        message: '连接超时',
        timestamp: Date.now(),
        responseTime,
        error: 'Connection timeout',
      };
    }
    
    return {
      status: ConnectionStatus.ERROR,
      message: `连接失败: ${error.message}`,
      timestamp: Date.now(),
      responseTime,
      error: error.message,
    };
  }
};

/**
 * 获取数据库详细信息
 */
export const getDatabaseInfo = async (): Promise<DatabaseInfo | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DATABASE_CONFIG.TIMEOUT);
    
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${DATABASE_CONFIG.DATABASE_INFO_ENDPOINT}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return data.database || data;
    } else {
      console.error('获取数据库信息失败:', response.status, response.statusText);
      return null;
    }
  } catch (error: any) {
    console.error('获取数据库信息错误:', error.message);
    return null;
  }
};

/**
 * 带重试的连接测试
 */
export const testConnectionWithRetry = async (retryCount = DATABASE_CONFIG.RETRY_COUNT): Promise<ConnectionTestResult> => {
  let lastResult: ConnectionTestResult;
  
  for (let i = 0; i <= retryCount; i++) {
    lastResult = await testApiConnection();
    
    if (lastResult.status === ConnectionStatus.CONNECTED) {
      return lastResult;
    }
    
    // 如果不是最后一次尝试，等待后重试
    if (i < retryCount) {
      await new Promise(resolve => setTimeout(resolve, DATABASE_CONFIG.RETRY_DELAY));
    }
  }
  
  return lastResult!;
};

/**
 * 连接状态监控类
 */
export class ConnectionMonitor {
  private intervalId: number | null = null;
  private listeners: ((result: ConnectionTestResult) => void)[] = [];
  private lastResult: ConnectionTestResult | null = null;
  
  /**
   * 开始监控
   */
  start(): void {
    if (this.intervalId) {
      this.stop();
    }
    
    // 立即执行一次测试
    this.performTest();
    
    // 设置定期测试
    this.intervalId = window.setInterval(() => {
      this.performTest();
    }, DATABASE_CONFIG.CHECK_INTERVAL);
  }
  
  /**
   * 停止监控
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * 添加状态变化监听器
   */
  addListener(callback: (result: ConnectionTestResult) => void): void {
    this.listeners.push(callback);
    
    // 如果有最新结果，立即通知
    if (this.lastResult) {
      callback(this.lastResult);
    }
  }
  
  /**
   * 移除监听器
   */
  removeListener(callback: (result: ConnectionTestResult) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * 获取最新的连接状态
   */
  getLastResult(): ConnectionTestResult | null {
    return this.lastResult;
  }
  
  /**
   * 手动执行连接测试
   */
  async performTest(): Promise<ConnectionTestResult> {
    const result = await testApiConnection();
    this.lastResult = result;
    
    // 通知所有监听器
    this.listeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('连接状态监听器执行错误:', error);
      }
    });
    
    return result;
  }
}

// 全局连接监控实例
export const connectionMonitor = new ConnectionMonitor();

/**
 * 格式化连接状态显示文本
 */
export const formatConnectionStatus = (status: ConnectionStatus): string => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return '已连接';
    case ConnectionStatus.DISCONNECTED:
      return '未连接';
    case ConnectionStatus.CONNECTING:
      return '连接中';
    case ConnectionStatus.ERROR:
      return '连接错误';
    default:
      return '未知状态';
  }
};

/**
 * 获取连接状态对应的颜色
 */
export const getConnectionStatusColor = (status: ConnectionStatus): string => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return 'text-green-600';
    case ConnectionStatus.DISCONNECTED:
      return 'text-gray-500';
    case ConnectionStatus.CONNECTING:
      return 'text-blue-600';
    case ConnectionStatus.ERROR:
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
};

/**
 * 获取连接状态对应的图标
 */
export const getConnectionStatusIcon = (status: ConnectionStatus): string => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return '🟢';
    case ConnectionStatus.DISCONNECTED:
      return '⚪';
    case ConnectionStatus.CONNECTING:
      return '🔵';
    case ConnectionStatus.ERROR:
      return '🔴';
    default:
      return '⚪';
  }
};