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
  ExternalLink,
  Youtube,
  Music,
  TrendingUp,
  Clock,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Eye,
  Video,
  MessageCircle
} from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface ExternalVideoStats {
  totalClicks: number;
  totalReturns: number;
  returnRate: number;
  averageTimeSpent: number;
  estimatedOverallCompletionRate: number;
  topExternalVideos: Array<{
    id: string;
    title: string;
    platform: string;
    clicks: number;
    returns: number;
    estimatedCompletionRate: number;
    averageTimeSpent: number;
  }>;
  platformStats: Array<{
    platform: string;
    clicks: number;
    returns: number;
    returnRate: number;
    estimatedCompletionRate: number;
    averageTimeSpent: number;
  }>;
}

interface CompletionEstimates {
  estimates: Array<{
    videoId: string;
    videoTitle: string;
    platform: string;
    totalClicks: number;
    totalReturns: number;
    returnRate: number;
    estimatedCompletionRate: number;
    averageTimeSpent: number;
    averageWatchPercentage: number;
    confidence: 'low' | 'medium' | 'high';
    sampleSize: number;
    dataQuality: 'no-data' | 'low' | 'medium' | 'high';
  }>;
  summary: {
    totalVideosTracked: number;
    averageCompletionRate: number;
    highConfidenceEstimates: number;
    mediumConfidenceEstimates: number;
    lowConfidenceEstimates: number;
  };
}

const ExternalVideoAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<ExternalVideoStats | null>(null);
  const [estimates, setEstimates] = useState<CompletionEstimates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState('7d');

  const analyticsNavigation = [
    { name: '概览', href: '/analytics', icon: BarChart3 },
    { name: '页面浏览', href: '/analytics/pageviews', icon: Eye },
    { name: '视频统计', href: '/analytics/videos', icon: Video },
    { name: '外部视频', href: '/analytics/external-videos', icon: ExternalLink },
    { name: '评论分析', href: '/analytics/comments', icon: MessageCircle },
  ];

  useEffect(() => {
    loadExternalVideoData();
  }, [timeRange]);

  const loadExternalVideoData = async () => {
    try {
      setIsLoading(true);
      
      const [statsRes, estimatesRes] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_EXTERNAL_VIDEOS, { timeRange })),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_EXTERNAL_VIDEOS_COMPLETION, { timeRange }))
      ]);

      const [statsData, estimatesData] = await Promise.all([
        statsRes.json(),
        estimatesRes.json()
      ]);

      setStats(statsData);
      setEstimates(estimatesData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载外部视频统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="h-5 w-5 text-red-600" />;
      case 'tiktok':
        return <Music className="h-5 w-5 text-black" />;
      default:
        return <ExternalLink className="h-5 w-5 text-gray-600" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const badges = {
      high: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '高置信度' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: Info, text: '中等置信度' },
      low: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, text: '低置信度' }
    };
    
    const badge = badges[confidence as keyof typeof badges] || badges.low;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getDataQualityBadge = (quality: string) => {
    const badges = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-orange-100 text-orange-800',
      'no-data': 'bg-gray-100 text-gray-800'
    };
    
    const qualityText = {
      high: '高质量',
      medium: '中等质量',
      low: '低质量',
      'no-data': '无数据'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[quality as keyof typeof badges] || badges['no-data']}`}>
        {qualityText[quality as keyof typeof qualityText] || '未知'}
      </span>
    );
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (isLoading && !stats) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">外部视频统计</h1>
          <p className="text-gray-600">外部平台视频跳转和完播率预估分析</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
          </select>
          <div className="text-sm text-gray-500">
            最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
          </div>
          <button
            onClick={loadExternalVideoData}
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
              <p className="text-sm font-medium text-gray-600">外部视频点击</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalClicks || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ExternalLink className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">用户返回</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalReturns || 0}</p>
              <p className="text-sm text-gray-500">返回率: {stats?.returnRate?.toFixed(1) || 0}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均观看时长</p>
              <p className="text-3xl font-bold text-gray-900">{formatTime(stats?.averageTimeSpent || 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">预估完播率</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.estimatedOverallCompletionRate?.toFixed(1) || 0}%</p>
              <p className="text-sm text-orange-500">预估数据</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 平台统计 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">平台统计</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.platformStats || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, clicks }) => `${platform}: ${clicks}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="clicks"
                >
                  {stats?.platformStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {stats?.platformStats?.map((platform, index) => (
              <div key={platform.platform} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(platform.platform)}
                  <div>
                    <p className="font-medium text-gray-900">{platform.platform}</p>
                    <p className="text-sm text-gray-500">
                      {platform.clicks} 点击 · {platform.returns} 返回
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {platform.estimatedCompletionRate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-sm text-gray-500">预估完播率</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 热门外部视频 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门外部视频</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  视频
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平台
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  点击数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  返回数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均观看时长
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  预估完播率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.topExternalVideos?.map((video, index) => (
                <tr key={video.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {video.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPlatformIcon(video.platform)}
                      <span className="ml-2 text-sm text-gray-900">{video.platform}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {video.clicks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {video.returns}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(video.averageTimeSpent || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-orange-600">
                      {video.estimatedCompletionRate?.toFixed(1) || 0}%
                    </span>
                    <span className="text-xs text-gray-500 ml-1">(预估)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 完播率预估详情 */}
      {estimates && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">完播率预估详情</h3>
            <div className="text-sm text-gray-500">
              共追踪 {estimates.summary.totalVideosTracked} 个视频
            </div>
          </div>
          
          {/* 预估摘要 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">平均完播率</p>
              <p className="text-2xl font-bold text-gray-900">
                {estimates.summary.averageCompletionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">高置信度预估</p>
              <p className="text-2xl font-bold text-green-900">
                {estimates.summary.highConfidenceEstimates}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">中等置信度预估</p>
              <p className="text-2xl font-bold text-yellow-900">
                {estimates.summary.mediumConfidenceEstimates}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">低置信度预估</p>
              <p className="text-2xl font-bold text-red-900">
                {estimates.summary.lowConfidenceEstimates}
              </p>
            </div>
          </div>

          {/* 详细预估表格 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    视频
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平台
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    样本大小
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    返回率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    预估完播率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平均观看比例
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    置信度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    数据质量
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estimates.estimates.map((estimate, index) => (
                  <tr key={estimate.videoId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {estimate.videoTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPlatformIcon(estimate.platform)}
                        <span className="ml-2 text-sm text-gray-900">{estimate.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estimate.sampleSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estimate.returnRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-orange-600">
                        {estimate.estimatedCompletionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(estimate.averageWatchPercentage || 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getConfidenceBadge(estimate.confidence)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getDataQualityBadge(estimate.dataQuality)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 数据说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">数据说明</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>外部视频完播率为预估数据，基于用户在外部平台的停留时间和返回行为计算</li>
                <li>置信度基于样本大小：50+为高置信度，20-49为中等置信度，&lt;20为低置信度</li>
                <li>数据质量反映时间数据和观看比例数据的完整性</li>
                <li>返回率 = 返回用户数 / 点击用户数</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalVideoAnalytics;