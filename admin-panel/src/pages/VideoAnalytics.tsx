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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Play,
  Clock,
  Users,
  TrendingUp,
  Video,
  RefreshCw,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface VideoPlayData {
  timestamp: string;
  data: {
    videoId: string;
    title: string;
    duration?: number;
    currentTime?: number;
    userId?: string;
  };
}

interface VideoAnalyticsData {
  totalPlays: number;
  uniqueVideos: number;
  totalWatchTime: number;
  avgWatchTime: number;
  topVideos: Array<{ 
    videoId: string; 
    title: string; 
    plays: number; 
    watchTime: number;
    engagement: number;
  }>;
  hourlyData: Array<{ hour: string; plays: number; watchTime: number }>;
  dailyData: Array<{ date: string; plays: number; watchTime: number }>;
  engagementData: Array<{ 
    videoId: string; 
    title: string; 
    completionRate: number; 
    avgWatchTime: number;
  }>;
  rawData: VideoPlayData[];
}

const VideoAnalytics: React.FC = () => {
  const [data, setData] = useState<VideoAnalyticsData | null>(null);
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
    loadVideoAnalyticsData();
    const interval = setInterval(loadVideoAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadVideoAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_VIDEOS));
      const result = await response.json();
      
      if (result.success && result.data) {
        const rawData: VideoPlayData[] = result.data;
        
        // 过滤时间范围
        const now = new Date();
        const filteredData = rawData.filter(item => {
          const itemDate = new Date(item.timestamp);
          const diffHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
          
          switch (timeRange) {
            case '24h':
              return diffHours <= 24;
            case '7d':
              return diffHours <= 24 * 7;
            case '30d':
              return diffHours <= 24 * 30;
            default:
              return true;
          }
        });

        // 处理视频统计
        const videoStats = filteredData.reduce((acc: any, item) => {
          const videoId = item.data?.videoId || 'unknown';
          const title = item.data?.title || '未知视频';
          const watchTime = item.data?.currentTime || 0;
          
          if (!acc[videoId]) {
            acc[videoId] = {
              videoId,
              title,
              plays: 0,
              totalWatchTime: 0,
              watchTimes: []
            };
          }
          
          acc[videoId].plays += 1;
          acc[videoId].totalWatchTime += watchTime;
          acc[videoId].watchTimes.push(watchTime);
          
          return acc;
        }, {});

        const totalPlays = filteredData.length;
        const uniqueVideos = Object.keys(videoStats).length;
        const totalWatchTime = Object.values(videoStats).reduce((sum: number, video: any) => sum + video.totalWatchTime, 0);
        const avgWatchTime = totalWatchTime / totalPlays || 0;

        // 计算热门视频
        const topVideos = Object.values(videoStats)
          .map((video: any) => ({
            videoId: video.videoId,
            title: video.title,
            plays: video.plays,
            watchTime: video.totalWatchTime,
            engagement: (video.totalWatchTime / video.plays) || 0
          }))
          .sort((a, b) => b.plays - a.plays);

        // 按小时统计
        const hourlyStats = filteredData.reduce((acc: any, item) => {
          const hour = new Date(item.timestamp).getHours();
          const hourKey = `${hour}:00`;
          const watchTime = item.data?.currentTime || 0;
          
          if (!acc[hourKey]) {
            acc[hourKey] = { plays: 0, watchTime: 0 };
          }
          
          acc[hourKey].plays += 1;
          acc[hourKey].watchTime += watchTime;
          
          return acc;
        }, {});

        const hourlyData = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          plays: hourlyStats[`${i}:00`]?.plays || 0,
          watchTime: Math.round((hourlyStats[`${i}:00`]?.watchTime || 0) / 60) // 转换为分钟
        }));

        // 按日期统计
        const dailyStats = filteredData.reduce((acc: any, item) => {
          const date = new Date(item.timestamp).toLocaleDateString('zh-CN');
          const watchTime = item.data?.currentTime || 0;
          
          if (!acc[date]) {
            acc[date] = { plays: 0, watchTime: 0 };
          }
          
          acc[date].plays += 1;
          acc[date].watchTime += watchTime;
          
          return acc;
        }, {});

        const dailyData = Object.entries(dailyStats)
          .map(([date, stats]: [string, any]) => ({ 
            date, 
            plays: stats.plays,
            watchTime: Math.round(stats.watchTime / 60) // 转换为分钟
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 计算参与度数据
        const engagementData = Object.values(videoStats)
          .map((video: any) => {
            const avgWatchTime = video.totalWatchTime / video.plays;
            const estimatedDuration = 300; // 假设平均视频时长5分钟
            const completionRate = Math.min((avgWatchTime / estimatedDuration) * 100, 100);
            
            return {
              videoId: video.videoId,
              title: video.title,
              completionRate,
              avgWatchTime: Math.round(avgWatchTime)
            };
          })
          .sort((a, b) => b.completionRate - a.completionRate);

        setData({
          totalPlays,
          uniqueVideos,
          totalWatchTime: Math.round(totalWatchTime / 60), // 转换为分钟
          avgWatchTime: Math.round(avgWatchTime),
          topVideos,
          hourlyData,
          dailyData,
          engagementData,
          rawData: filteredData
        });
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载视频分析数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (isLoading && !data) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

      {/* 页面标题和控制 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">视频统计分析</h1>
          <p className="text-gray-600 mt-1">视频播放数据、观看时长和用户参与度分析</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">最近24小时</option>
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
          </select>
          <div className="text-sm text-gray-500">
            最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
          </div>
          <button
            onClick={loadVideoAnalyticsData}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总播放次数</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalPlays || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Play className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">视频数量</p>
              <p className="text-3xl font-bold text-gray-900">{data?.uniqueVideos || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Video className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总观看时长</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalWatchTime || 0}</p>
              <p className="text-sm text-gray-500">分钟</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均观看时长</p>
              <p className="text-3xl font-bold text-gray-900">{formatTime(data?.avgWatchTime || 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 每日播放趋势 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每日播放趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.dailyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="plays" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 每小时播放分布 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每小时播放分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.hourlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="plays" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 热门视频排行 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门视频排行</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data?.topVideos.slice(0, 6) || []} 
              layout="horizontal"
              margin={{ left: 180, right: 30, top: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="title" 
                type="category" 
                width={160}
                tick={{ 
                  fontSize: 10, 
                  textAnchor: 'end',
                  fill: '#374151'
                }}
                tickFormatter={(value) => {
                  if (value.length <= 20) return value;
                  return value.substring(0, 18) + '...';
                }}
                interval={0}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                formatter={(value, name) => [value, '播放次数']}
                labelFormatter={(label) => `视频: ${label}`}
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="plays" 
                fill="#F59E0B" 
                radius={[0, 4, 4, 0]}
                stroke="#D97706"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 视频参与度分析 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">视频参与度分析</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.engagementData.slice(0, 8) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completionRate" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 观看时长趋势 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">观看时长趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data?.dailyData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="watchTime" 
              stroke="#EF4444" 
              strokeWidth={2}
              dot={{ fill: '#EF4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">视频详细统计</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  视频标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  播放次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  观看时长
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  参与度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  趋势
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.topVideos.slice(0, 10).map((video, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{video.title}</div>
                    <div className="text-sm text-gray-500">ID: {video.videoId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {video.plays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(video.watchTime / 60)} 分钟
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(video.engagement)}
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

export default VideoAnalytics;