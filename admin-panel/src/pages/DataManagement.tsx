import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Database, 
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Trash2,
  Copy,
  Video,
  Users,
  Eye
} from 'lucide-react';
import { DataManager } from '@shared/api/dataManager';
import { DashboardStats } from '@shared/types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { buildApiUrl, API_CONFIG } from '../config/api';
import '../styles/shared.css';

interface DataStats {
  videos: number;
  blogs: number;
  users: number;
  totalViews: number;
  publishedVideos: number;
  draftVideos: number;
  publishedBlogs: number;
  draftBlogs: number;
  activeUsers: number;
  totalSize: string;
  lastBackup: string;
  lastSync: string;
}

const DataManagement: React.FC = () => {
  const [stats, setStats] = useState<DataStats>({
    videos: 0,
    blogs: 0,
    users: 0,
    totalViews: 0,
    publishedVideos: 0,
    draftVideos: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    activeUsers: 0,
    totalSize: '0 MB',
    lastBackup: '从未备份',
    lastSync: '从未同步'
  });
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [backing, setBacking] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [exportType, setExportType] = useState<'all' | 'videos' | 'blogs' | 'users'>('all');

  useEffect(() => {
    loadStats();
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN');
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // 获取仪表板统计数据，确保与仪表板页面一致
      const dashboardStats: DashboardStats = await DataManager.getDashboardStats();
      
      // 计算数据大小（基于实际数据量）
      const totalItems = (dashboardStats.totalVideos || 0) + (dashboardStats.totalBlogs || 0) + (dashboardStats.totalUsers || 0);
      const estimatedSizeKB = totalItems * 2.5; // 假设每条记录约2.5KB
      const estimatedSizeMB = estimatedSizeKB / 1024;
      
      let sizeDisplay: string;
      if (estimatedSizeMB >= 1) {
        sizeDisplay = `${estimatedSizeMB.toFixed(1)} MB`;
      } else {
        sizeDisplay = `${estimatedSizeKB.toFixed(1)} KB`;
      }

      // 备份和同步时间现在由数据库管理
      const lastBackup = '从未备份'; // 可以从API获取
      const lastSync = '从未同步'; // 可以从API获取

      setStats({
        videos: dashboardStats.totalVideos || 0,
        blogs: dashboardStats.totalBlogs || 0,
        users: dashboardStats.totalUsers || 0,
        totalViews: dashboardStats.totalPageViews || 0, // 修复：使用正确的总页面浏览量字段
        publishedVideos: dashboardStats.publishedVideos || 0,
        draftVideos: dashboardStats.draftVideos || 0,
        publishedBlogs: dashboardStats.publishedBlogs || 0,
        draftBlogs: dashboardStats.draftBlogs || 0,
        activeUsers: dashboardStats.activeUsers || 0,
        totalSize: sizeDisplay,
        lastBackup,
        lastSync
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      // 实际调用同步API
      await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.VIDEOS_SYNC), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // 同步时间现在由数据库管理
      const now = new Date().toLocaleString('zh-CN');
      
      // 重新加载统计数据
      await loadStats();
      
      // 记录活动日志
      await DataManager.addActivityLog({
        userId: 'admin',
        username: '管理员',
        action: 'data_sync',
        details: '执行数据同步操作',

      });
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBacking(true);
      
      // 模拟备份过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 备份时间现在由数据库管理
      const now = new Date().toLocaleString('zh-CN');
      
      await loadStats();
      
      // 记录活动日志
      await DataManager.addActivityLog({
        userId: 'admin',
        username: '管理员',
        action: 'data_backup',
        details: '执行数据备份操作'
      });
      
    } catch (error) {
      console.error('Backup failed:', error);
    } finally {
      setBacking(false);
    }
  };

  const handleExport = async () => {
    try {
      let data: any;
      let filename: string;
      
      switch (exportType) {
        case 'videos':
          data = await DataManager.getVideos();
          filename = 'videos_export.json';
          break;
        case 'blogs':
          data = await DataManager.getBlogs();
          filename = 'blogs_export.json';
          break;
        case 'users':
          data = await DataManager.getUsers();
          filename = 'users_export.json';
          break;
        default:
          const [videos, blogs, users] = await Promise.all([
            DataManager.getVideos(),
            DataManager.getBlogs(),
            DataManager.getUsers()
          ]);
          data = { videos, blogs, users };
          filename = 'all_data_export.json';
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      
      // 记录活动日志
      await DataManager.addActivityLog({
        userId: 'admin',
        username: '管理员',
        action: 'data_export',
        details: `导出${exportType === 'all' ? '所有' : exportType}数据`
      });
      
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      // 这里应该调用实际的导入API
      console.log('Importing data:', data);
      
      setShowImportModal(false);
      setImportFile(null);
      await loadStats();
      
      // 记录活动日志
      await DataManager.addActivityLog({
        userId: 'admin',
        username: '管理员',
        action: 'data_import',
        details: `导入数据文件: ${importFile.name}`
      });
      
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleClearData = async (type: 'videos' | 'blogs' | 'users' | 'all') => {
    if (!confirm(`确定要清空${type === 'all' ? '所有' : type}数据吗？此操作无法撤销！`)) {
      return;
    }

    try {
      if (type === 'videos' || type === 'all') {
        const videos = await DataManager.getVideos();
        for (const video of videos) {
          await DataManager.deleteVideo(video.id);
        }
      }

      if (type === 'blogs' || type === 'all') {
        const blogs = await DataManager.getBlogs();
        for (const blog of blogs) {
          await DataManager.deleteBlog(blog.id);
        }
      }

      if (type === 'users' || type === 'all') {
        const users = await DataManager.getUsers();
        // 保留至少一个管理员账户
        const adminUsers = users.filter(u => u.role === 'admin');
        const usersToDelete = type === 'all' && adminUsers.length > 1 
          ? users.filter(u => !(u.role === 'admin' && u.username === 'admin'))
          : users.filter(u => u.role !== 'admin');
        
        for (const user of usersToDelete) {
          await DataManager.deleteUser(user.id);
        }
      }

      await loadStats();
      
      // 记录活动日志
      await DataManager.addActivityLog({
        userId: 'admin',
        username: '管理员',
        action: 'data_clear',
        details: `清空${type}数据`
      });
      
    } catch (error) {
      console.error('Clear data failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-600">正在加载数据统计...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据管理</h1>
          <p className="text-gray-600">管理和维护系统数据，执行备份和同步操作</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </button>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 视频统计 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">视频数据</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatNumber(stats.videos)}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>已发布: {formatNumber(stats.publishedVideos)}</p>
                <p>草稿: {formatNumber(stats.draftVideos)}</p>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 博客统计 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">博客数据</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatNumber(stats.blogs)}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>已发布: {formatNumber(stats.publishedBlogs)}</p>
                <p>草稿: {formatNumber(stats.draftBlogs)}</p>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* 用户统计 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">用户数据</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatNumber(stats.users)}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>活跃用户: {formatNumber(stats.activeUsers)}</p>
                <p>总注册: {formatNumber(stats.users)}</p>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 浏览量统计 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">总浏览量</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatNumber(stats.totalViews)}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>数据大小: {stats.totalSize}</p>
                <p>最后同步: {stats.lastSync}</p>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 操作面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 数据导入导出 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            数据导入导出
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                导入数据
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowExportModal(true)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                导出数据
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              支持JSON格式的数据文件导入导出
            </p>
          </div>
        </div>

        {/* 备份恢复 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Copy className="h-5 w-5 mr-2" />
            备份恢复
          </h3>
          <div className="space-y-4">
            <Button
              onClick={handleBackup}
              loading={backing}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              创建备份
            </Button>
            <div className="text-sm text-gray-500">
              <p>上次备份：{stats.lastBackup}</p>
              <p className="mt-1">备份包含所有系统数据和配置</p>
            </div>
          </div>
        </div>
      </div>

      {/* 同步状态 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <RefreshCw className="h-5 w-5 mr-2" />
          数据同步
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">上次同步：{stats.lastSync}</p>
            <p className="text-xs text-gray-500 mt-1">
              同步主站点和管理后台的数据状态
            </p>
          </div>
          <Button
            onClick={handleSync}
            loading={syncing}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            立即同步
          </Button>
        </div>
      </div>

      {/* 数据清理 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Trash2 className="h-5 w-5 mr-2 text-red-600" />
          数据清理
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-800">危险操作</p>
              <p className="text-sm text-red-700 mt-1">
                以下操作将永久删除数据，请谨慎操作
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleClearData('videos')}
          >
            清空视频
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleClearData('blogs')}
          >
            清空博客
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleClearData('users')}
          >
            清空用户
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleClearData('all')}
          >
            清空所有
          </Button>
        </div>
      </div>

      {/* 导入数据模态框 */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
        }}
        title="导入数据"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择数据文件
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          
          {importFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                已选择文件：{importFile.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                大小：{(importFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">注意</p>
                <p className="text-sm text-yellow-700 mt-1">
                  导入数据将覆盖现有的同类数据，请确保备份重要数据
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile}
            >
              导入
            </Button>
          </div>
        </div>
      </Modal>

      {/* 导出数据模态框 */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出数据"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择导出类型
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">全部数据</option>
              <option value="videos">仅视频数据</option>
              <option value="blogs">仅博客数据</option>
              <option value="users">仅用户数据</option>
            </select>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              将导出为JSON格式文件，可用于数据备份或迁移
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(false)}
            >
              取消
            </Button>
            <Button onClick={handleExport}>
              导出
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;