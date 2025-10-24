import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Server,
  Key,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Terminal,
  FileText,
  Settings
} from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface DatabaseInfo {
  connection: {
    host: string;
    port: number;
    database: string;
    user: string;
  };
  tables: {
    blogs: {
      total: number;
      published: number;
      draft: number;
    };
    videos: {
      total: number;
      published: number;
      active: number;
    };
    pageViews: {
      total: number;
      unique: number;
    };
    users: {
      total: number;
      active: number;
    };
  };
}

const DatabaseInfo: React.FC = () => {
  const navigate = useNavigate();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DATABASE_INFO));
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'API返回错误');
      }
      
      setDbInfo(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据库信息失败');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getConnectionString = () => {
    if (!dbInfo) return '';
    const { host, port, database, user } = dbInfo.connection;
    return `mysql://${user}:YOUR_PASSWORD@${host}:${port}/${database}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">加载数据库信息...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">加载失败</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={loadDatabaseInfo}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">数据库信息</h1>
              <p className="text-gray-600">数据库连接配置和管理信息</p>
            </div>
          </div>
          <button
            onClick={loadDatabaseInfo}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>刷新</span>
          </button>
        </div>

        {/* 连接信息卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">数据库连接信息</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 主机地址 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">主机地址</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm">
                  {dbInfo?.connection.host}
                </div>
                <button
                  onClick={() => copyToClipboard(dbInfo?.connection.host || '', 'host')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copiedField === 'host' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 端口 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">端口</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm">
                  {dbInfo?.connection.port}
                </div>
                <button
                  onClick={() => copyToClipboard(String(dbInfo?.connection.port || ''), 'port')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copiedField === 'port' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 数据库名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">数据库名</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm">
                  {dbInfo?.connection.database}
                </div>
                <button
                  onClick={() => copyToClipboard(dbInfo?.connection.database || '', 'database')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copiedField === 'database' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">用户名</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm">
                  {dbInfo?.connection.user}
                </div>
                <button
                  onClick={() => copyToClipboard(dbInfo?.connection.user || '', 'user')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copiedField === 'user' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 连接字符串 */}
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-gray-700">连接字符串</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm break-all">
                {getConnectionString()}
              </div>
              <button
                onClick={() => copyToClipboard(getConnectionString(), 'connection')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copiedField === 'connection' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              注意：请将 YOUR_PASSWORD 替换为实际的数据库密码
            </p>
          </div>
        </div>

        {/* 数据库统计 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Server className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">数据库统计</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 博客统计 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">博客数据</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">总数：</span>
                  <span className="font-semibold text-blue-900">{dbInfo?.tables.blogs.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">已发布：</span>
                  <span className="font-semibold text-blue-900">{dbInfo?.tables.blogs.published || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">草稿：</span>
                  <span className="font-semibold text-blue-900">{dbInfo?.tables.blogs.draft || 0}</span>
                </div>
              </div>
            </div>

            {/* 视频统计 */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">视频数据</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">总数：</span>
                  <span className="font-semibold text-green-900">{dbInfo?.tables.videos.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">已发布：</span>
                  <span className="font-semibold text-green-900">{dbInfo?.tables.videos.published || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">活跃：</span>
                  <span className="font-semibold text-green-900">{dbInfo?.tables.videos.active || 0}</span>
                </div>
              </div>
            </div>

            {/* 用户统计 */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">用户数据</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-orange-700">总数：</span>
                  <span className="font-semibold text-orange-900">{dbInfo?.tables.users?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">活跃：</span>
                  <span className="font-semibold text-orange-900">{dbInfo?.tables.users?.active || 0}</span>
                </div>
              </div>
            </div>

            {/* 页面浏览统计 */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">浏览数据</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-purple-700">总浏览量：</span>
                  <span className="font-semibold text-purple-900">{dbInfo?.tables.pageViews.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">独立访客：</span>
                  <span className="font-semibold text-purple-900">{dbInfo?.tables.pageViews.unique || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 管理工具 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">数据库管理</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* MySQL Workbench */}
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Terminal className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">MySQL Workbench</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                官方图形化数据库管理工具，支持查询、设计和管理。
              </p>
              <a
                href="https://dev.mysql.com/downloads/workbench/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                下载 MySQL Workbench →
              </a>
            </div>

            {/* phpMyAdmin */}
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-gray-900">phpMyAdmin</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                基于Web的MySQL管理工具，无需安装客户端。
              </p>
              <a
                href="https://www.phpmyadmin.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                了解 phpMyAdmin →
              </a>
            </div>

            {/* 命令行工具 */}
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <Terminal className="h-6 w-6 text-gray-600" />
                <h3 className="font-semibold text-gray-900">命令行工具</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                使用MySQL命令行客户端直接连接和管理数据库。
              </p>
              <div className="bg-gray-100 rounded p-2 font-mono text-xs">
                mysql -h {dbInfo?.connection.host} -P {dbInfo?.connection.port} -u {dbInfo?.connection.user} -p {dbInfo?.connection.database}
              </div>
            </div>
          </div>

          {/* 重要提示 */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">重要提示</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 数据库密码存储在环境变量中，请联系系统管理员获取</li>
                  <li>• 生产环境中请谨慎操作，建议先在测试环境中验证</li>
                  <li>• 定期备份数据库以防数据丢失</li>
                  <li>• 不要在代码中硬编码数据库密码</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseInfo;