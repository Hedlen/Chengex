import React, { useState, useEffect } from 'react';
import {
  ConnectionStatus as Status,
  ConnectionTestResult,
  connectionMonitor,
  formatConnectionStatus,
  getConnectionStatusColor,
  getConnectionStatusIcon,
  testConnectionWithRetry,
  getDatabaseInfo,
  DatabaseInfo
} from '../config/database';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  className = ''
}) => {
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  useEffect(() => {
    // 添加连接状态监听器
    const handleConnectionChange = (result: ConnectionTestResult) => {
      setConnectionResult(result);
      
      // 如果连接成功，获取数据库详细信息
      if (result.status === Status.CONNECTED && result.databaseInfo) {
        setDatabaseInfo(result.databaseInfo);
      }
    };

    connectionMonitor.addListener(handleConnectionChange);
    
    // 启动连接监控
    connectionMonitor.start();

    // 组件卸载时清理
    return () => {
      connectionMonitor.removeListener(handleConnectionChange);
    };
  }, []);

  const handleManualTest = async () => {
    setIsLoading(true);
    try {
      const result = await testConnectionWithRetry();
      setConnectionResult(result);
      
      if (result.status === Status.CONNECTED) {
        const dbInfo = await getDatabaseInfo();
        setDatabaseInfo(dbInfo);
      }
    } catch (error) {
      console.error('手动测试连接失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: Status) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case Status.CONNECTED:
        return `${baseClass} bg-green-100 text-green-800`;
      case Status.DISCONNECTED:
        return `${baseClass} bg-gray-100 text-gray-800`;
      case Status.CONNECTING:
        return `${baseClass} bg-blue-100 text-blue-800`;
      case Status.ERROR:
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const formatResponseTime = (responseTime?: number) => {
    if (!responseTime) return '未知';
    return `${responseTime}ms`;
  };

  if (!connectionResult) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">检测连接状态...</span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* 简单状态显示 */}
      <div className="flex items-center space-x-2">
        <span className="text-lg">
          {getConnectionStatusIcon(connectionResult.status)}
        </span>
        <span className={getStatusBadgeClass(connectionResult.status)}>
          {formatConnectionStatus(connectionResult.status)}
        </span>
        
        {connectionResult.responseTime && (
          <span className="text-xs text-gray-500">
            {formatResponseTime(connectionResult.responseTime)}
          </span>
        )}
        
        <button
          onClick={handleManualTest}
          disabled={isLoading}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {isLoading ? '测试中...' : '重新测试'}
        </button>
        
        {showDetails && (
          <button
            onClick={() => setShowDetailPanel(!showDetailPanel)}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            {showDetailPanel ? '隐藏详情' : '显示详情'}
          </button>
        )}
      </div>

      {/* 错误信息显示 */}
      {connectionResult.status === Status.ERROR && connectionResult.message && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <strong>连接错误:</strong> {connectionResult.message}
          {connectionResult.error && (
            <div className="mt-1 text-xs text-red-600">
              错误详情: {connectionResult.error}
            </div>
          )}
        </div>
      )}

      {/* 详细信息面板 */}
      {showDetails && showDetailPanel && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">连接详情</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* 连接状态信息 */}
            <div>
              <h5 className="font-medium text-gray-700 mb-2">连接状态</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">状态:</span>
                  <span className={getConnectionStatusColor(connectionResult.status)}>
                    {formatConnectionStatus(connectionResult.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">响应时间:</span>
                  <span>{formatResponseTime(connectionResult.responseTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">最后检测:</span>
                  <span>{formatTimestamp(connectionResult.timestamp)}</span>
                </div>
              </div>
            </div>

            {/* 数据库信息 */}
            {databaseInfo && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">数据库信息</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">类型:</span>
                    <span className="font-mono text-xs">{databaseInfo.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">主机:</span>
                    <span className="font-mono text-xs">{databaseInfo.host}:{databaseInfo.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">数据库:</span>
                    <span className="font-mono text-xs">{databaseInfo.database}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">状态:</span>
                    <span className={databaseInfo.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
                      {databaseInfo.status}
                    </span>
                  </div>
                  {databaseInfo.connectionCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">连接数:</span>
                      <span>{databaseInfo.connectionCount}</span>
                    </div>
                  )}
                  {databaseInfo.lastConnected && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">最后连接:</span>
                      <span className="text-xs">{new Date(databaseInfo.lastConnected).toLocaleString('zh-CN')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleManualTest}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '重新测试连接'}
            </button>
            
            <button
              onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/api/health`, '_blank')}
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              打开健康检查
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;