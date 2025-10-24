import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  target: string;
  details: string;
  type: 'info' | 'warning' | 'error' | 'success';
  ip?: string;
}

const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const logsPerPage = 20;

  // 安全的日期格式化函数
  const formatTimestamp = (timestamp: Date | string): string => {
    try {
      // 如果是字符串，先转换为Date对象
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      
      if (!date || isNaN(date.getTime())) {
        console.warn('无效的时间戳:', timestamp);
        return '无效日期';
      }
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      console.error('日期格式化失败:', error, '原始时间戳:', timestamp);
      return '格式化失败';
    }
  };

  // 从API加载活动日志数据
  useEffect(() => {
    const loadActivityLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITY_LOGS));
        const result = await response.json();
        
        if (result.success && result.data) {
          const logsData = result.data.map((log: any) => {
            return {
              ...log,
              // 保持timestamp为原始格式，让formatTimestamp函数处理
              timestamp: log.timestamp,
              // 确保所有必需字段都存在
              user: log.user || '未知用户',
              action: log.action || '未知操作',
              target: log.target || '未知目标',
              details: log.details || '无详细信息',
              type: log.type || 'info',
              ip: log.ip || '未知'
            };
          });
          setLogs(logsData);
          setFilteredLogs(logsData);
        } else {
          // 如果没有数据，设置为空数组
          setLogs([]);
          setFilteredLogs([]);
        }
      } catch (error) {
        console.error('加载活动日志失败:', error);
        setLogs([]);
        setFilteredLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivityLogs();
  }, []);

  // 过滤日志
  useEffect(() => {
    let filtered = logs;

    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, filterType, searchTerm]);

  // 分页逻辑
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      default:
        return 'ℹ';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">活动日志</h1>
        <p className="text-gray-600">查看系统活动记录和操作日志</p>
      </div>

      {/* 过滤和搜索 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索用户、操作或详情..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有类型</option>
              <option value="info">信息</option>
              <option value="success">成功</option>
              <option value="warning">警告</option>
              <option value="error">错误</option>
            </select>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-lg">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">总日志数</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-lg">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">成功操作</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.type === 'success').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-lg">⚠</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">警告</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.type === 'warning').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-lg">✗</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">错误</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.type === 'error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  目标
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP地址
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.target}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                      <span className="mr-1">{getTypeIcon(log.type)}</span>
                      {log.type === 'info' ? '信息' : 
                       log.type === 'success' ? '成功' : 
                       log.type === 'warning' ? '警告' : '错误'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{indexOfFirstLog + 1}</span> 到{' '}
                  <span className="font-medium">{Math.min(indexOfLastLog, filteredLogs.length)}</span> 条，
                  共 <span className="font-medium">{filteredLogs.length}</span> 条记录
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">上一页</span>
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">下一页</span>
                    →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;