import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Eye,
  Clock,
  Globe,
  TrendingUp,
  Calendar,
  RefreshCw,
  Filter,
  Video,
  MessageCircle,
  ExternalLink,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface PageViewData {
  timestamp: string;
  data: {
    title: string;
    page: string;
    referrer?: string;
    userAgent?: string;
  };
}

interface PageViewsAnalyticsData {
  totalViews: number;
  uniquePages: number;
  avgViewsPerPage: number;
  topPages: Array<{ page: string; views: number; percentage: number }>;
  hourlyData: Array<{ hour: string; views: number }>;
  dailyData: Array<{ date: string; views: number }>;
  referrerData: Array<{ source: string; views: number }>;
  rawData: PageViewData[];
}

const PageViewsAnalytics: React.FC = () => {
  const [data, setData] = useState<PageViewsAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
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
    loadPageViewsData();
    const interval = setInterval(loadPageViewsData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadPageViewsData = async () => {
    try {
      setIsLoading(true);
      
      // 获取页面浏览数据
      const [pageViewsRes, hourlyRes, dailyRes, referrerRes] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_PAGE_VIEWS, { timeRange })),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_PAGE_VIEWS_HOURLY, { range: timeRange })).catch(() => null),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_PAGE_VIEWS_DAILY, { range: timeRange })).catch(() => null),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_PAGE_VIEWS_REFERRERS, { range: timeRange })).catch(() => null)
      ]);
      
      const pageViewsData = await pageViewsRes.json();
      
      // 使用后端返回的统计数据
      const totalViews = pageViewsData.totalViews || 0;
      const uniquePages = pageViewsData.topPages?.length || 0;
      
      const topPages = pageViewsData.topPages?.map((page: any) => ({
        page: page.title || page.url || '未知页面',
        views: page.views || 0,
        percentage: totalViews > 0 ? ((page.views || 0) / totalViews) * 100 : 0
      })) || [];

      // 尝试获取真实的时间数据，如果失败则使用基于总数的合理分布
      let hourlyData = [];
      let dailyData = [];
      let referrerData = [];

      // 处理小时数据
      if (hourlyRes && hourlyRes.ok) {
        const hourlyResult = await hourlyRes.json();
        hourlyData = hourlyResult.hourlyData || [];
      } else {
        // 如果没有小时数据，返回空数组而不是生成假数据
        hourlyData = [];
      }

      // 处理日期数据
      if (dailyRes && dailyRes.ok) {
        const dailyResult = await dailyRes.json();
        dailyData = dailyResult.dailyData || [];
      } else {
        // 如果没有日期数据，返回空数组而不是生成假数据
        dailyData = [];
      }

      // 处理来源数据
      if (referrerRes && referrerRes.ok) {
        const referrerResult = await referrerRes.json();
        referrerData = referrerResult.referrerData || [];
      } else {
        // 如果没有来源数据，返回空数组而不是生成假数据
        referrerData = [];
      }

      setData({
        totalViews,
        uniquePages,
        avgViewsPerPage: uniquePages > 0 ? totalViews / uniquePages : 0,
        topPages,
        hourlyData,
        dailyData,
        referrerData,
        rawData: [] // 不再需要原始数据
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载页面浏览数据失败:', error);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
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

      {/* 页面标题和控制 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">页面浏览分析</h1>
          <p className="text-gray-600 mt-1">详细的页面访问统计和用户行为分析</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="24h">最近24小时</option>
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
          </select>
          <div className="text-sm text-gray-500 whitespace-nowrap">
            最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
          </div>
          <button
            onClick={loadPageViewsData}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 mb-1">总浏览量</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{data?.totalViews || 0}</p>
            </div>
            <div className="p-2 lg:p-3 bg-blue-100 rounded-full ml-3 flex-shrink-0">
              <Eye className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 mb-1">独立页面</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{data?.uniquePages || 0}</p>
            </div>
            <div className="p-2 lg:p-3 bg-green-100 rounded-full ml-3 flex-shrink-0">
              <Globe className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 mb-1">平均访问量</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{Math.round(data?.avgViewsPerPage || 0)}</p>
              <p className="text-sm text-gray-500">每页面</p>
            </div>
            <div className="p-2 lg:p-3 bg-purple-100 rounded-full ml-3 flex-shrink-0">
              <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* 每日访问趋势 */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每日访问趋势</h3>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.dailyData || []}>
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
        </div>

        {/* 每小时访问分布 */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每小时访问分布</h3>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.hourlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#10B981" />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 热门页面排行 */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门页面排行</h3>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={600}>
            <BarChart 
              data={data?.topPages.slice(0, 5) || []} 
              layout="horizontal" 
              margin={{ left: 250, right: 40, top: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 11, fill: '#374151' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                dataKey="page" 
                type="category" 
                width={240} 
                tick={{ 
                  fontSize: 11, 
                  textAnchor: 'end',
                  fill: '#374151',
                  fontWeight: 500
                }}
                tickFormatter={(value) => {
                  // 更智能的文本截断，保留重要信息
                  if (value.length <= 32) return value;
                  
                  // 如果是URL，尝试提取有意义的部分
                  if (value.startsWith('/')) {
                    const parts = value.split('/').filter(Boolean);
                    if (parts.length > 0) {
                      const lastPart = parts[parts.length - 1];
                      if (lastPart.length > 28) {
                        return lastPart.substring(0, 25) + '...';
                      }
                      return lastPart;
                    }
                  }
                  
                  // 对于中文标题，按字符截断
                  return value.substring(0, 28) + '...';
                }}
                interval={0}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickMargin={10}
              />
              <Tooltip 
                formatter={(value, name) => [value, '访问次数']}
                labelFormatter={(label) => `页面: ${label}`}
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="views" 
                fill="#F59E0B" 
                radius={[0, 4, 4, 0]}
                stroke="#D97706"
                strokeWidth={1}
              />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 访问来源分布 */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">访问来源分布</h3>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.referrerData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.source} (${(entry.percentage || 0).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="views"
                >
                  {data?.referrerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">页面访问详情</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  页面标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  访问次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  占比
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  趋势
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.topPages.slice(0, 10).map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.page}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {page.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(page.percentage || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-500">暂无数据</span>
                    </div>
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

export default PageViewsAnalytics;