import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  Play, TrendingUp, Calendar, Filter, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Clock, Video, Users, Star
} from 'lucide-react';
import { format } from 'date-fns';
import { usePageTracking } from '@/hooks/usePageTracking';
import { API_URLS } from '@/config/api';

interface VideoStatsData {
  videoId: string;
  title: string;
  category: string;
  plays: number;
  uniquePlays: number;
  avgWatchTime: number;
  completionRate: number;
  thumbnail?: string;
}

interface CategoryData {
  category: string;
  plays: number;
  videos: number;
  [key: string]: any;
}

interface TimeSeriesData {
  date: string;
  plays: number;
  uniquePlays: number;
}

const VideoStatsPage: React.FC = () => {
  const { t } = useTranslation();
  const [videoStats, setVideoStats] = useState<VideoStatsData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalUniquePlays, setTotalUniquePlays] = useState(0);
  const [playsTrend, setPlaysTrend] = useState(0);

  // 页面追踪
  usePageTracking('管理后台 - 视频统计');

  // 获取视频统计数据
  const fetchVideoStats = async () => {
    try {
      setIsLoading(true);
      
      // 获取视频统计
      const response = await fetch(`${API_URLS.ANALYTICS_VIDEOS}?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setVideoStats(data.videos || []);
        setCategoryData(data.categories || []);
        setTotalPlays(data.totalPlays || 0);
        setTotalUniquePlays(data.totalUniquePlays || 0);
        setPlaysTrend(data.trend || 0);
      }

      // 获取时间序列数据
      const timeSeriesResponse = await fetch(`/api/analytics/videos?period=${selectedPeriod}&groupBy=day`);
      if (timeSeriesResponse.ok) {
        const timeSeriesData = await timeSeriesResponse.json();
        setTimeSeriesData(timeSeriesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching video stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoStats();
  }, [selectedPeriod]);

  const periodOptions = [
    { value: '1d', label: '今天' },
    { value: '7d', label: '最近7天' },
    { value: '30d', label: '最近30天' },
    { value: '90d', label: '最近90天' }
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

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const exportData = () => {
    const csvContent = [
      ['视频ID', '标题', '分类', '播放量', '独立播放', '平均观看时长', '完成率'],
      ...videoStats.map(video => [
        video.videoId,
        video.title,
        video.category,
        video.plays.toString(),
        video.uniquePlays.toString(),
        formatDuration(video.avgWatchTime),
        `${video.completionRate}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `video-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 饼图颜色
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载视频统计数据中...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">视频统计</h1>
                <p className="mt-1 text-sm text-gray-500">
                  分析视频播放数据和用户观看行为
                </p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {periodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchVideoStats}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  刷新
                </button>
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 概览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-blue-50">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(playsTrend)}
                <span className={`text-sm font-medium ${getTrendColor(playsTrend)}`}>
                  {Math.abs(playsTrend)}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">总播放量</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(totalPlays)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-green-50">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">独立观看</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(totalUniquePlays)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-purple-50">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">视频总数</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {videoStats.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-orange-50">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">平均完成率</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {videoStats.length > 0 
                  ? (videoStats.reduce((sum, v) => sum + v.completionRate, 0) / videoStats.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 播放量趋势 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">播放量趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="plays" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="总播放量"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uniquePlays" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="独立播放"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 分类分布 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">分类播放分布</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }: any) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="plays"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 热门视频排行 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门视频排行</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">排名</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">视频</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">分类</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">播放量</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">独立播放</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">平均观看</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">完成率</th>
                </tr>
              </thead>
              <tbody>
                {videoStats.map((video, index) => (
                  <tr key={video.videoId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {video.thumbnail && (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-12 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{video.title}</p>
                          <p className="text-sm text-gray-500">ID: {video.videoId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {video.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {formatNumber(video.plays)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {formatNumber(video.uniquePlays)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {formatDuration(video.avgWatchTime)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        video.completionRate > 80 ? 'text-green-600' : 
                        video.completionRate > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {video.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStatsPage;