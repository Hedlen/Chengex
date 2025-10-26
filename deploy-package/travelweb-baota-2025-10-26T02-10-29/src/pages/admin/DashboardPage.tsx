import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Eye, MessageSquare, Play, TrendingUp, Users, Calendar,
  ArrowUpRight, ArrowDownRight, Activity, Clock
} from 'lucide-react';
import { usePageTracking } from '@/hooks/usePageTracking';
import { API_URLS } from '@/config/api';

interface DashboardStats {
  totalPageViews: number;
  totalVideoPlays: number;
  totalComments: number;
  todayPageViews: number;
  todayVideoPlays: number;
  todayComments: number;
  pageViewTrend: number;
  videoPlayTrend: number;
  commentTrend: number;
}

interface ChartData {
  name: string;
  pageViews: number;
  videoPlays: number;
  comments: number;
  date: string;
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalPageViews: 0,
    totalVideoPlays: 0,
    totalComments: 0,
    todayPageViews: 0,
    todayVideoPlays: 0,
    todayComments: 0,
    pageViewTrend: 0,
    videoPlayTrend: 0,
    commentTrend: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 页面追踪
  usePageTracking('管理后台 - 统计仪表板');

  // 获取统计数据
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // 获取仪表板概览数据
      const response = await fetch(API_URLS.ANALYTICS_DASHBOARD);
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard API response:', data); // 调试日志
        
        // 映射后端数据到前端期望的格式
        const mappedStats: DashboardStats = {
          totalPageViews: data.totalPageViews || 0,
          totalVideoPlays: data.totalVideoPlays || 0,
          totalComments: data.totalComments || 0,
          todayPageViews: data.todayViews || 0,
          todayVideoPlays: 0, // 暂时设为0，后端还没有这个数据
          todayComments: 0,   // 暂时设为0，后端还没有这个数据
          pageViewTrend: 0,   // 暂时设为0，需要计算趋势
          videoPlayTrend: 0,  // 暂时设为0，需要计算趋势
          commentTrend: 0     // 暂时设为0，需要计算趋势
        };
        
        console.log('Mapped stats:', mappedStats); // 调试日志
        setStats(mappedStats);
      }

      // 获取图表数据（最近7天）
      const chartResponse = await fetch(`${API_URLS.ANALYTICS_PAGEVIEWS}?period=7d&groupBy=day`);
      if (chartResponse.ok) {
        const chartData = await chartResponse.json();
        setChartData(chartData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // 每30秒刷新一次数据
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 统计卡片数据
  const statCards = [
    {
      title: '总页面浏览量',
      value: stats.totalPageViews,
      todayValue: stats.todayPageViews,
      trend: stats.pageViewTrend,
      icon: Eye,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: '总视频播放量',
      value: stats.totalVideoPlays,
      todayValue: stats.todayVideoPlays,
      trend: stats.videoPlayTrend,
      icon: Play,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: '总评论数',
      value: stats.totalComments,
      todayValue: stats.todayComments,
      trend: stats.commentTrend,
      icon: MessageSquare,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: '活跃度指数',
      value: Math.round((stats.todayPageViews + stats.todayVideoPlays + stats.todayComments) / 3),
      todayValue: Math.round((stats.todayPageViews + stats.todayVideoPlays + stats.todayComments) / 3),
      trend: Math.round((stats.pageViewTrend + stats.videoPlayTrend + stats.commentTrend) / 3),
      icon: Activity,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    } else if (trend < 0) {
      return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    }
    return <div className="w-4 h-4" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">统计仪表板</h1>
                <p className="mt-1 text-sm text-gray-500">
                  实时监控网站数据和用户行为
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>最后更新: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(card.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(card.trend)}`}>
                      {Math.abs(card.trend)}%
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(card.value)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    今日: {formatNumber(card.todayValue)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 趋势图表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">7天数据趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="pageViews" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="页面浏览"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="videoPlays" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                    name="视频播放"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="comments" 
                    stackId="1"
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.6}
                    name="评论数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 柱状图 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">每日活动对比</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pageViews" fill="#3B82F6" name="页面浏览" />
                  <Bar dataKey="videoPlays" fill="#10B981" name="视频播放" />
                  <Bar dataKey="comments" fill="#8B5CF6" name="评论数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">查看页面统计</p>
                <p className="text-sm text-gray-500">详细的页面浏览数据</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Play className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">查看视频统计</p>
                <p className="text-sm text-gray-500">视频播放和互动数据</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">查看评论统计</p>
                <p className="text-sm text-gray-500">用户评论和互动分析</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;