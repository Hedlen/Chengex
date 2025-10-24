import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Eye, 
  TrendingUp, 
  Activity,
  RefreshCw,
  Video,
  MessageSquare,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataManager } from '@shared/api/dataManager';
import { DashboardStats, ActivityLog } from '@shared/types';
import '../styles/shared.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalBlogs: 0,
    totalUsers: 0,
    monthlyViews: 0,
    weeklyViews: 0,
    todayViews: 0,
    publishedVideos: 0,
    draftVideos: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    activeUsers: 0,
    // 新增字段
    totalPageViews: 0,
    uniqueVisitors: 0,
    totalVideoViews: 0,
    totalComments: 0
  });
  
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // 设置定时刷新，每30秒更新一次数据
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN');
  };

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Dashboard: 开始加载仪表板数据...');
      setLoading(true);
      const [dashboardStats, activityLogs] = await Promise.all([
        DataManager.getDashboardStats(),
        DataManager.getActivityLogs({ limit: 10 }) // 获取最近10条日志
      ]);
      
      console.log('✅ Dashboard: 成功获取仪表板统计数据:', dashboardStats);
      console.log('✅ Dashboard: 成功获取活动日志:', activityLogs);
      setStats(dashboardStats);
      setRecentLogs(activityLogs);
    } catch (error) {
      console.error('❌ Dashboard: 加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: '创建视频',
      description: '添加新的视频内容',
      icon: Video,
      action: () => navigate('/videos'),
      color: 'blue'
    },
    {
      title: '写博客',
      description: '创建新的博客文章',
      icon: FileText,
      action: () => navigate('/blogs'),
      color: 'green'
    },
    {
      title: '用户管理',
      description: '管理系统用户',
      icon: Users,
      action: () => navigate('/users'),
      color: 'purple'
    },
    {
      title: '数据分析',
      description: '查看详细统计',
      icon: BarChart3,
      action: () => navigate('/analytics'),
      color: 'orange'
    }
  ];

  if (loading) {
    return (
      <div className="container-padding">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" />
          <p className="loading-text">正在加载仪表板数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-padding">
      {/* 页面标题 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">仪表板</h1>
          <p className="page-subtitle">欢迎回来，这里是您的管理中心概览</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="action-button secondary"
        >
          <RefreshCw className="icon-sm mr-2" />
          刷新数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid mb-8">
        {/* 视频统计 */}
        <div className="stats-card card-hover">
          <div className="stats-card-header">
            <div className="stats-card-content">
              <p className="stats-card-title">视频内容</p>
              <p className="stats-card-value text-number">{formatNumber(stats.totalVideos || 0)}</p>
              <div className="stats-card-details">
                <p>已发布: {formatNumber(stats.publishedVideos || 0)}</p>
                <p>草稿: {formatNumber(stats.draftVideos || 0)}</p>
              </div>
            </div>
            <div className="stats-card-icon blue">
              <Video className="icon-lg text-blue-600" />
            </div>
          </div>
        </div>

        {/* 博客统计 */}
        <div className="stats-card card-hover">
          <div className="stats-card-header">
            <div className="stats-card-content">
              <p className="stats-card-title">博客文章</p>
              <p className="stats-card-value text-number">{formatNumber(stats.totalBlogs || 0)}</p>
              <div className="stats-card-details">
                <p>已发布: {formatNumber(stats.publishedBlogs || 0)}</p>
                <p>草稿: {formatNumber(stats.draftBlogs || 0)}</p>
              </div>
            </div>
            <div className="stats-card-icon green">
              <FileText className="icon-lg text-green-600" />
            </div>
          </div>
        </div>

        {/* 用户统计 */}
        <div className="stats-card card-hover">
          <div className="stats-card-header">
            <div className="stats-card-content">
              <p className="stats-card-title">用户管理</p>
              <p className="stats-card-value text-number">{formatNumber(stats.totalUsers || 0)}</p>
              <div className="stats-card-details">
                <p>活跃用户: {formatNumber(stats.activeUsers || 0)}</p>
                <p>总注册: {formatNumber(stats.totalUsers || 0)}</p>
              </div>
            </div>
            <div className="stats-card-icon purple">
              <Users className="icon-lg text-purple-600" />
            </div>
          </div>
        </div>

        {/* 浏览量统计 */}
        <div className="stats-card card-hover">
          <div className="stats-card-header">
            <div className="stats-card-content">
              <p className="stats-card-title">页面浏览量</p>
              <p className="stats-card-value text-number">{formatNumber(stats.totalPageViews || 0)}</p>
              <div className="stats-card-details">
                <p>独立访客: {formatNumber(stats.uniqueVisitors || 0)}</p>
                <p>今日: {formatNumber(stats.todayViews || 0)}</p>
              </div>
            </div>
            <div className="stats-card-icon orange">
              <Eye className="icon-lg text-orange-600" />
            </div>
          </div>
        </div>

        {/* 视频播放统计 */}
        <div className="stats-card card-hover">
          <div className="stats-card-header">
            <div className="stats-card-content">
              <p className="stats-card-title">视频播放量</p>
              <p className="stats-card-value text-number">{formatNumber(stats.totalVideoViews || 0)}</p>
              <div className="stats-card-details">
                <p>本周: {formatNumber(stats.weeklyViews || 0)}</p>
                <p>本月: {formatNumber(stats.monthlyViews || 0)}</p>
              </div>
            </div>
            <div className="stats-card-icon red">
              <Video className="icon-lg text-red-600" />
            </div>
          </div>
        </div>

        {/* 评论统计 */}
        <div className="stats-card card-hover">
          <div className="stats-card-header">
            <div className="stats-card-content">
              <p className="stats-card-title">用户评论</p>
              <p className="stats-card-value text-number">{formatNumber(stats.totalComments || 0)}</p>
              <div className="stats-card-details">
                <p>互动率: {stats.totalComments > 0 ? ((stats.totalComments / Math.max(stats.totalPageViews, 1)) * 100).toFixed(1) : '0'}%</p>
                <p>活跃度: 良好</p>
              </div>
            </div>
            <div className="stats-card-icon indigo">
              <MessageSquare className="icon-lg text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="content-grid">
        {/* 快速操作 */}
        <div className="content-section">
          <h3 className="section-header">
            <TrendingUp className="section-icon" />
            快速操作
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left group"
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                    <action.icon className={`icon-md text-${action.color}-600`} />
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                      {action.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ExternalLink className="icon-sm text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="content-section">
          <h3 className="section-header">
            <Activity className="section-icon" />
            最近活动
          </h3>
          <div className="space-y-3">
            {recentLogs.length > 0 ? (
              recentLogs.map((log, index) => (
                <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {log.username || '系统'}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="icon-sm mr-1" />
                        {new Date(log.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="status-indicator active">
                        {log.action}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无最近活动</p>
              </div>
            )}
          </div>
          
          {recentLogs.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => window.location.href = '/admin/logs'}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                查看所有活动 →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 系统状态指示器 */}
      <div className="mt-8">
        <div className="content-section">
          <h3 className="section-header">
            <Activity className="section-icon" />
            系统状态
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-green-800">API服务</span>
              </div>
              <span className="status-indicator active">正常</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-green-800">数据库</span>
              </div>
              <span className="status-indicator active">正常</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-green-800">文件存储</span>
              </div>
              <span className="status-indicator active">正常</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;