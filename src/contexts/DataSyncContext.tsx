import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { SyncData } from './VideoContext';

// 连接状态枚举
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// 同步事件类型
export interface SyncEvent {
  id: string;
  type: 'video' | 'blog' | 'service' | 'user';
  action: 'create' | 'update' | 'delete' | 'sync';
  data: any;
  timestamp: string;
  source: 'local' | 'remote';
}

// 错误信息接口
export interface SyncError {
  id: string;
  message: string;
  timestamp: string;
  type: 'connection' | 'sync' | 'validation';
  retryCount: number;
}

// 同步统计信息
export interface SyncStats {
  totalEvents: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncTime: string | null;
  averageLatency: number;
}

// DataSync上下文接口
interface DataSyncContextType {
  // 连接状态
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  lastHeartbeat: string | null;
  
  // 同步状态
  syncStatus: 'idle' | 'syncing' | 'error';
  syncQueue: SyncEvent[];
  syncErrors: SyncError[];
  syncStats: SyncStats;
  
  // 连接管理
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // 数据同步
  pushEvent: (event: Omit<SyncEvent, 'id' | 'timestamp' | 'source'>) => Promise<void>;
  forcSync: () => Promise<void>;
  clearSyncQueue: () => void;
  
  // 错误处理
  clearErrors: () => void;
  retryFailedSync: (errorId: string) => Promise<void>;
  
  // 事件监听
  onSyncEvent: (callback: (event: SyncEvent) => void) => () => void;
  onConnectionChange: (callback: (status: ConnectionStatus) => void) => () => void;
  onError: (callback: (error: SyncError) => void) => () => void;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

interface DataSyncProviderProps {
  children: React.ReactNode;
  wsEndpoint?: string;
  authToken?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  enableOfflineQueue?: boolean;
  enableWebSocket?: boolean; // 新增：是否启用WebSocket连接
}

export const DataSyncProvider: React.FC<DataSyncProviderProps> = ({
  children,
  wsEndpoint = import.meta.env.PROD 
    ? `wss://${window.location.host}/api/sync`  // 生产环境使用当前域名的wss
    : 'ws://localhost:3002/api/sync',           // 开发环境使用localhost
  authToken,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
  heartbeatInterval = 30000,
  enableOfflineQueue = true,
  enableWebSocket = process.env.NODE_ENV === 'production' // 默认只在生产环境启用
}) => {
  // 状态管理
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [syncQueue, setSyncQueue] = useState<SyncEvent[]>([]);
  const [syncErrors, setSyncErrors] = useState<SyncError[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalEvents: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncTime: null,
    averageLatency: 0
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const eventCallbacksRef = useRef<((event: SyncEvent) => void)[]>([]);
  const connectionCallbacksRef = useRef<((status: ConnectionStatus) => void)[]>([]);
  const errorCallbacksRef = useRef<((error: SyncError) => void)[]>([]);

  // 计算连接状态
  const isConnected = connectionStatus === 'connected';

  // 加载离线队列
  useEffect(() => {
    if (enableOfflineQueue) {
      loadOfflineQueue();
    }
  }, [enableOfflineQueue]);

  // 保存离线队列
  useEffect(() => {
    if (enableOfflineQueue) {
      saveOfflineQueue();
    }
  }, [syncQueue, enableOfflineQueue]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // 加载离线队列
  const loadOfflineQueue = () => {
    try {
      const savedQueue = localStorage.getItem('travel-sync-queue');
      if (savedQueue) {
        setSyncQueue(JSON.parse(savedQueue));
      }
    } catch (error) {
      console.error('Error loading offline sync queue:', error);
    }
  };

  // 保存离线队列
  const saveOfflineQueue = () => {
    try {
      localStorage.setItem('travel-sync-queue', JSON.stringify(syncQueue));
    } catch (error) {
      console.error('Error saving offline sync queue:', error);
    }
  };

  // 创建WebSocket连接
  const createConnection = useCallback(() => {
    // 如果禁用WebSocket，直接返回
    if (!enableWebSocket) {
      console.log('WebSocket disabled in development mode');
      setConnectionStatus('disconnected');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const url = authToken ? `${wsEndpoint}?token=${authToken}` : wsEndpoint;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        startHeartbeat();
        processOfflineQueue();
        
        // 通知连接状态变化
        connectionCallbacksRef.current.forEach(callback => callback('connected'));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        stopHeartbeat();
        
        // 通知连接状态变化
        connectionCallbacksRef.current.forEach(callback => callback('disconnected'));
        
        // 自动重连
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        
        // 只在启用WebSocket时才报告错误
        if (enableWebSocket) {
          const syncError: SyncError = {
            id: Date.now().toString(),
            message: 'WebSocket连接错误',
            timestamp: new Date().toISOString(),
            type: 'connection',
            retryCount: 0
          };
          
          addSyncError(syncError);
          
          // 通知错误
          errorCallbacksRef.current.forEach(callback => callback(syncError));
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [wsEndpoint, authToken, maxReconnectAttempts, enableWebSocket]);

  // 处理接收到的消息
  const handleIncomingMessage = (data: any) => {
    if (data.type === 'heartbeat') {
      setLastHeartbeat(new Date().toISOString());
      return;
    }

    if (data.type === 'sync') {
      const syncEvent: SyncEvent = {
        ...data,
        source: 'remote',
        timestamp: data.timestamp || new Date().toISOString()
      };

      // 通知事件监听器
      eventCallbacksRef.current.forEach(callback => callback(syncEvent));
      
      // 更新统计信息
      updateSyncStats(true);
    }
  };

  // 开始心跳检测
  const startHeartbeat = () => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, heartbeatInterval);
  };

  // 停止心跳检测
  const stopHeartbeat = () => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  };

  // 安排重连
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionStatus('reconnecting');
    reconnectAttemptsRef.current++;

    const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      createConnection();
    }, delay);
  };

  // 处理离线队列
  const processOfflineQueue = async () => {
    if (syncQueue.length === 0) return;

    setSyncStatus('syncing');
    
    try {
      for (const event of syncQueue) {
        await sendSyncEvent(event);
      }
      
      setSyncQueue([]);
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      console.error('Error processing offline queue:', error);
    }
  };

  // 发送同步事件
  const sendSyncEvent = async (event: SyncEvent): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        wsRef.current.send(JSON.stringify(event));
        updateSyncStats(true);
        resolve();
      } catch (error) {
        updateSyncStats(false);
        reject(error);
      }
    });
  };

  // 更新同步统计
  const updateSyncStats = (success: boolean) => {
    setSyncStats(prev => ({
      ...prev,
      totalEvents: prev.totalEvents + 1,
      successfulSyncs: success ? prev.successfulSyncs + 1 : prev.successfulSyncs,
      failedSyncs: success ? prev.failedSyncs : prev.failedSyncs + 1,
      lastSyncTime: new Date().toISOString()
    }));
  };

  // 添加同步错误
  const addSyncError = (error: SyncError) => {
    setSyncErrors(prev => [...prev, error]);
  };

  // 公共方法
  const connect = () => {
    if (enableWebSocket) {
      createConnection();
    } else {
      console.log('WebSocket connection disabled');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  };

  const reconnect = () => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    createConnection();
  };

  const pushEvent = async (eventData: Omit<SyncEvent, 'id' | 'timestamp' | 'source'>) => {
    const event: SyncEvent = {
      ...eventData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      source: 'local'
    };

    if (isConnected) {
      try {
        await sendSyncEvent(event);
      } catch (error) {
        if (enableOfflineQueue) {
          setSyncQueue(prev => [...prev, event]);
        }
        throw error;
      }
    } else if (enableOfflineQueue) {
      setSyncQueue(prev => [...prev, event]);
    } else {
      throw new Error('Not connected and offline queue disabled');
    }
  };

  const forcSync = async () => {
    if (!isConnected) {
      throw new Error('Not connected');
    }

    setSyncStatus('syncing');
    
    try {
      // 发送强制同步请求
      await sendSyncEvent({
        id: Date.now().toString(),
        type: 'video',
        action: 'sync',
        data: { force: true },
        timestamp: new Date().toISOString(),
        source: 'local'
      });
      
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  const clearSyncQueue = () => {
    setSyncQueue([]);
  };

  const clearErrors = () => {
    setSyncErrors([]);
  };

  const retryFailedSync = async (errorId: string) => {
    const error = syncErrors.find(e => e.id === errorId);
    if (!error) return;

    // 移除错误记录
    setSyncErrors(prev => prev.filter(e => e.id !== errorId));
    
    // 重试连接或同步
    if (error.type === 'connection') {
      reconnect();
    }
  };

  // 事件监听器
  const onSyncEvent = (callback: (event: SyncEvent) => void) => {
    eventCallbacksRef.current.push(callback);
    
    return () => {
      eventCallbacksRef.current = eventCallbacksRef.current.filter(cb => cb !== callback);
    };
  };

  const onConnectionChange = (callback: (status: ConnectionStatus) => void) => {
    connectionCallbacksRef.current.push(callback);
    
    return () => {
      connectionCallbacksRef.current = connectionCallbacksRef.current.filter(cb => cb !== callback);
    };
  };

  const onError = (callback: (error: SyncError) => void) => {
    errorCallbacksRef.current.push(callback);
    
    return () => {
      errorCallbacksRef.current = errorCallbacksRef.current.filter(cb => cb !== callback);
    };
  };

  return (
    <DataSyncContext.Provider value={{
      // 连接状态
      connectionStatus,
      isConnected,
      lastHeartbeat,
      
      // 同步状态
      syncStatus,
      syncQueue,
      syncErrors,
      syncStats,
      
      // 连接管理
      connect,
      disconnect,
      reconnect,
      
      // 数据同步
      pushEvent,
      forcSync,
      clearSyncQueue,
      
      // 错误处理
      clearErrors,
      retryFailedSync,
      
      // 事件监听
      onSyncEvent,
      onConnectionChange,
      onError,
    }}>
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};