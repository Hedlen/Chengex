import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  MessageCircle, TrendingUp, Calendar, Filter, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Clock, User, Heart, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { usePageTracking } from '@/hooks/usePageTracking';
import { API_URLS } from '@/config/api';

interface CommentStatsData {
  blogId: string;
  blogTitle: string;
  comments: number;
  uniqueCommenters: number;
  avgCommentsPerDay: number;
  lastCommentDate: string;
}

interface AuthorData {
  author: string;
  comments: number;
  blogs: number;
  avgLength: number;
}

interface TimeSeriesData {
  date: string;
  comments: number;
  uniqueCommenters: number;
}

interface HourlyData {
  hour: number;
  comments: number;
}

const CommentStatsPage: React.FC = () => {
  const { t } = useTranslation();
  const [commentStats, setCommentStats] = useState<CommentStatsData[]>([]);
  const [authorData, setAuthorData] = useState<AuthorData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [totalComments, setTotalComments] = useState(0);
  const [totalCommenters, setTotalCommenters] = useState(0);
  const [commentsTrend, setCommentsTrend] = useState(0);
  const [avgCommentsPerBlog, setAvgCommentsPerBlog] = useState(0);

  // 页面追踪
  usePageTracking('管理后台 - 评论统计');

  // 获取评论统计数据
  const fetchCommentStats = async () => {
    try {
      setIsLoading(true);
      
      // 获取评论统计
      const response = await fetch(`${API_URLS.ANALYTICS_COMMENTS}?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setCommentStats(data.blogs || []);
        setAuthorData(data.authors || []);
        setTotalComments(data.totalComments || 0);
        setTotalCommenters(data.totalCommenters || 0);
        setCommentsTrend(data.trend || 0);
        setAvgCommentsPerBlog(data.avgCommentsPerBlog || 0);
      }

      // 获取时间序列数据
      const timeSeriesResponse = await fetch(`/api/analytics/comments?period=${selectedPeriod}&groupBy=day`);
      if (timeSeriesResponse.ok) {
        const timeSeriesData = await timeSeriesResponse.json();
        setTimeSeriesData(timeSeriesData.data || []);
      }

      // 获取小时分布数据
      const hourlyResponse = await fetch(`/api/analytics/comments?period=${selectedPeriod}&groupBy=hour`);
      if (hourlyResponse.ok) {
        const hourlyData = await hourlyResponse.json();
        setHourlyData(hourlyData.data || []);
      }
    } catch (error) {
      console.error('Error fetching comment stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommentStats();
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
      ['博客ID', '博客标题', '评论数', '独立评论者', '日均评论', '最后评论时间'],
      ...commentStats.map(blog => [
        blog.blogId,
        blog.blogTitle,
        blog.comments.toString(),
        blog.uniqueCommenters.toString(),
        blog.avgCommentsPerDay.toFixed(2),
        blog.lastCommentDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comment-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
          <p className="text-gray-600">加载评论统计数据中...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">评论统计</h1>
                <p className="mt-1 text-sm text-gray-500">
                  分析用户评论数据和互动行为
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
                  onClick={fetchCommentStats}
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
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(commentsTrend)}
                <span className={`text-sm font-medium ${getTrendColor(commentsTrend)}`}>
                  {Math.abs(commentsTrend)}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">总评论数</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(totalComments)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-green-50">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">评论用户</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(totalCommenters)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-purple-50">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">平均每篇</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {avgCommentsPerBlog.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-orange-50">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">活跃博客</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {commentStats.filter(blog => blog.comments > 0).length}
              </p>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 评论趋势 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">评论趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="comments" 
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    name="评论数"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uniqueCommenters" 
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.3}
                    name="评论用户"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 小时分布 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">评论时间分布</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                  />
                  <Bar 
                    dataKey="comments" 
                    fill="#8B5CF6"
                    name="评论数"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 活跃评论者和热门博客 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 活跃评论者 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">活跃评论者</h3>
            <div className="space-y-4">
              {authorData.slice(0, 10).map((author, index) => (
                <div key={author.author} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{author.author}</p>
                      <p className="text-sm text-gray-500">
                        在 {author.blogs} 篇博客中评论
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{author.comments} 条</p>
                    <p className="text-sm text-gray-500">
                      平均 {author.avgLength} 字
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 热门博客 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">评论最多的博客</h3>
            <div className="space-y-4">
              {commentStats.slice(0, 10).map((blog, index) => (
                <div key={blog.blogId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{blog.blogTitle}</p>
                      <p className="text-sm text-gray-500">
                        {blog.uniqueCommenters} 位用户参与
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{blog.comments} 条</p>
                    <p className="text-sm text-gray-500">
                      日均 {blog.avgCommentsPerDay.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 详细数据表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">博客评论详情</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">博客标题</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">评论数</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">评论用户</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">日均评论</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">最后评论</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {commentStats.map((blog) => (
                  <tr key={blog.blogId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{blog.blogTitle}</p>
                        <p className="text-sm text-gray-500">ID: {blog.blogId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {blog.comments}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {blog.uniqueCommenters}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {blog.avgCommentsPerDay.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {blog.lastCommentDate ? format(new Date(blog.lastCommentDate), 'yyyy-MM-dd HH:mm') : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        blog.comments > 10 ? 'bg-green-100 text-green-700' :
                        blog.comments > 5 ? 'bg-yellow-100 text-yellow-700' :
                        blog.comments > 0 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {blog.comments > 10 ? '热门' :
                         blog.comments > 5 ? '活跃' :
                         blog.comments > 0 ? '普通' : '无评论'}
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

export default CommentStatsPage;