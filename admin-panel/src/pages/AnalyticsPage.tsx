import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Eye,
  Users,
  Video,
  MessageCircle,
  TrendingUp,
  Calendar,
  RefreshCw,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { DataManager } from '@shared/api/dataManager';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitors: number;
  totalVideoViews: number;
  totalComments: number;
  pageViewsData: Array<{ date: string; views: number }>;
  topPages: Array<{ page: string; views: number }>;
  videoStats: Array<{ title: string; views: number }>;
}

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  const analyticsNavigation = [
    { name: '概览', href: '/analytics', icon: BarChart3 },
    { name: '页面浏览', href: '/analytics/pageviews', icon: Eye },
    { name: '视频统计', href: '/analytics/videos', icon: Video },
    { name: '外部视频', href: '/analytics/external-videos', icon: ExternalLink },
    { name: '评论分析', href: '/analytics/comments', icon: MessageCircle },
  ];

  useEffect(() => {
    loadAnalyticsData();
    // 每30秒自动刷新数据
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // 使用统一的数据源 - DataManager.getDashboardStats()
      const [dashboardStats, pageViewsRes, videosRes, blogsRes] = await Promise.all([
        DataManager.getDashboardStats(),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_PAGE_VIEWS)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_VIDEOS)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_BLOGS))
      ]);

      // 添加调试日志
      console.log('Dashboard Stats:', dashboardStats);
      console.log('Dashboard Stats totalPageViews:', dashboardStats.totalPageViews);

      const [pageViews, videos, blogs] = await Promise.all([
        pageViewsRes.json(),
        videosRes.json(),
        blogsRes.json()
      ]);

      console.log('PageViews API:', pageViews);
      console.log('Videos API:', videos);
      console.log('Blogs API:', blogs);

      // 处理页面浏览数据 - 修复数据结构访问
      const pageViewsData: Array<{ date: string; views: number }> = [];
      const topPages = pageViews.topPages?.slice(0, 5).map((page: any) => ({
        page: page.title || page.url || '未知页面',
        views: page.views || 0
      })) || [];

      // 如果有真实的日期数据，使用真实数据；否则返回空数组
      if (pageViews.dailyData && pageViews.dailyData.length > 0) {
        pageViews.dailyData.slice(-7).forEach((item: any) => {
          pageViewsData.push({
            date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            views: item.views || 0
          });
        });
      }

      setData({
        totalPageViews: dashboardStats.totalPageViews || 0,
        uniqueVisitors: dashboardStats.uniqueVisitors || 1,
        totalVideoViews: dashboardStats.totalVideoViews || 0,
        totalComments: dashboardStats.totalComments || 0,
        pageViewsData: pageViewsData,
        topPages,
        videoStats: videos.topVideos?.slice(0, 5) || []
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (isLoading && !data) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 导航标签 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {analyticsNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="text-gray-600">网站访问和用户行为分析</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
          </div>
          <button
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">页面浏览量</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalPageViews || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">独立访客</p>
              <p className="text-3xl font-bold text-gray-900">{data?.uniqueVisitors || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">视频播放</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalVideoViews || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">评论数量</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalComments || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <MessageCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 页面浏览趋势 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">页面浏览趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.pageViewsData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 热门页面 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门页面</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data?.topPages.slice(0, 6) || []}
              margin={{ left: 20, right: 20, top: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="page" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ 
                  fontSize: 11, 
                  fill: '#374151'
                }}
                tickFormatter={(value) => {
                  if (value.length <= 18) return value;
                  return value.substring(0, 15) + '...';
                }}
                interval={0}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickMargin={8}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#374151' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                formatter={(value, name) => [value, '访问次数']}
                labelFormatter={(label) => `页面: ${label}`}
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="views" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
                stroke="#059669"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 页面访问详情 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">页面访问详情</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  页面
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  访问次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  占比
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.topPages.map((page, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {page.page}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {page.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((page.views / (data?.totalPageViews || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;