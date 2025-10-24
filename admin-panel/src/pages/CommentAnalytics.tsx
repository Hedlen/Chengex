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
  MessageCircle,
  Users,
  TrendingUp,
  Clock,
  Heart,
  RefreshCw,
  Calendar,
  ThumbsUp,
  AlertCircle,
  Star,
  BarChart3,
  Eye,
  Video,
  ExternalLink
} from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface CommentData {
  timestamp: string;
  data: {
    commentId: string;
    content: string;
    postId?: string;
    postTitle?: string;
    userId?: string;
    parentId?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
}

interface CommentAnalyticsData {
  totalComments: number;
  uniqueUsers: number;
  avgCommentsPerPost: number;
  responseRate: number;
  topPosts: Array<{ 
    postId: string; 
    title: string; 
    comments: number; 
    engagement: number;
  }>;
  hourlyData: Array<{ hour: string; comments: number }>;
  dailyData: Array<{ date: string; comments: number; replies: number }>;
  sentimentData: Array<{ sentiment: string; count: number; percentage: number }>;
  engagementData: Array<{ 
    postId: string; 
    title: string; 
    comments: number;
    avgLength: number;
  }>;
  rawData: CommentData[];
}

const CommentAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<CommentAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const analyticsNavigation = [
    { name: '概览', href: '/analytics', icon: BarChart3 },
    { name: '页面浏览', href: '/analytics/pageviews', icon: Eye },
    { name: '视频统计', href: '/analytics/videos', icon: Video },
    { name: '外部视频', href: '/analytics/external-videos', icon: ExternalLink },
    { name: '评论分析', href: '/analytics/comments', icon: MessageCircle },
  ];

  useEffect(() => {
    loadCommentAnalyticsData();
    const interval = setInterval(loadCommentAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadCommentAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS_COMMENTS));
      const result = await response.json();
      
      if (result.success && result.data) {
        const rawData: CommentData[] = result.data;
        
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

        // 处理评论统计
        const postStats = filteredData.reduce((acc: any, item) => {
          const postId = item.data?.postId || 'unknown';
          const title = item.data?.postTitle || '未知文章';
          const isReply = !!item.data?.parentId;
          const contentLength = item.data?.content?.length || 0;
          
          if (!acc[postId]) {
            acc[postId] = {
              postId,
              title,
              comments: 0,
              replies: 0,
              totalLength: 0,
              users: new Set()
            };
          }
          
          if (isReply) {
            acc[postId].replies += 1;
          } else {
            acc[postId].comments += 1;
          }
          
          acc[postId].totalLength += contentLength;
          if (item.data?.userId) {
            acc[postId].users.add(item.data.userId);
          }
          
          return acc;
        }, {});

        const userStats = filteredData.reduce((acc: any, item) => {
          if (item.data?.userId) {
            acc.add(item.data.userId);
          }
          return acc;
        }, new Set());

        const totalComments = filteredData.length;
        const uniqueUsers = userStats.size;
        const uniquePosts = Object.keys(postStats).length;
        const avgCommentsPerPost = totalComments / uniquePosts || 0;
        
        // 计算回复率
        const totalReplies = Object.values(postStats).reduce((sum: number, post: any) => sum + post.replies, 0);
        const responseRate = (totalReplies / totalComments) * 100 || 0;

        // 计算热门文章
        const topPosts = Object.values(postStats)
          .map((post: any) => ({
            postId: post.postId,
            title: post.title,
            comments: post.comments + post.replies,
            engagement: post.users.size
          }))
          .sort((a, b) => b.comments - a.comments);

        // 按小时统计
        const hourlyStats = filteredData.reduce((acc: any, item) => {
          const hour = new Date(item.timestamp).getHours();
          const hourKey = `${hour}:00`;
          
          acc[hourKey] = (acc[hourKey] || 0) + 1;
          
          return acc;
        }, {});

        const hourlyData = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          comments: hourlyStats[`${i}:00`] || 0
        }));

        // 按日期统计
        const dailyStats = filteredData.reduce((acc: any, item) => {
          const date = new Date(item.timestamp).toLocaleDateString('zh-CN');
          const isReply = !!item.data?.parentId;
          
          if (!acc[date]) {
            acc[date] = { comments: 0, replies: 0 };
          }
          
          if (isReply) {
            acc[date].replies += 1;
          } else {
            acc[date].comments += 1;
          }
          
          return acc;
        }, {});

        const dailyData = Object.entries(dailyStats)
          .map(([date, stats]: [string, any]) => ({ 
            date, 
            comments: stats.comments,
            replies: stats.replies
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 情感分析数据
        const sentimentStats = filteredData.reduce((acc: any, item) => {
          const sentiment = item.data?.sentiment || 'neutral';
          acc[sentiment] = (acc[sentiment] || 0) + 1;
          return acc;
        }, {});

        // 如果没有情感数据，返回空数组而不是生成假数据
        const sentimentData = Object.keys(sentimentStats).length > 0 
          ? Object.entries(sentimentStats)
              .map(([sentiment, count]: [string, any]) => ({
                sentiment: sentiment === 'positive' ? '积极' : 
                          sentiment === 'negative' ? '消极' : '中性',
                count,
                percentage: (count / totalComments) * 100
              }))
          : [];

        // 参与度数据
        const engagementData = Object.values(postStats)
          .map((post: any) => ({
            postId: post.postId,
            title: post.title,
            comments: post.comments + post.replies,
            avgLength: Math.round(post.totalLength / (post.comments + post.replies)) || 0
          }))
          .sort((a, b) => b.comments - a.comments);

        setData({
          totalComments,
          uniqueUsers,
          avgCommentsPerPost: Math.round(avgCommentsPerPost),
          responseRate: Math.round(responseRate),
          topPosts,
          hourlyData,
          dailyData,
          sentimentData,
          engagementData,
          rawData: filteredData
        });
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载评论分析数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

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
          <h1 className="text-2xl font-bold text-gray-900">评论统计分析</h1>
          <p className="text-gray-600 mt-1">用户评论互动数据、情感分析和参与度统计</p>
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
            onClick={loadCommentAnalyticsData}
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
              <p className="text-sm font-medium text-gray-600">总评论数</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalComments || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">活跃用户</p>
              <p className="text-3xl font-bold text-gray-900">{data?.uniqueUsers || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均评论数</p>
              <p className="text-3xl font-bold text-gray-900">{data?.avgCommentsPerPost || 0}</p>
              <p className="text-sm text-gray-500">每篇文章</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">回复率</p>
              <p className="text-3xl font-bold text-gray-900">{data?.responseRate || 0}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 每日评论趋势 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每日评论趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.dailyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="comments" 
                stackId="1"
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="replies" 
                stackId="1"
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 每小时评论分布 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每小时评论分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.hourlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="comments" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 热门文章评论排行 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门文章评论排行</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data?.topPosts.slice(0, 6) || []} 
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
                formatter={(value, name) => [value, '评论数']}
                labelFormatter={(label) => `文章: ${label}`}
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="comments" 
                fill="#F59E0B" 
                radius={[0, 4, 4, 0]}
                stroke="#D97706"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 评论情感分析 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">评论情感分析</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.sentimentData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.sentiment} (${(entry.percentage || 0).toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data?.sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 用户参与度分析 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">用户参与度分析</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.engagementData.slice(0, 10) || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="comments" fill="#3B82F6" name="评论数" />
            <Bar yAxisId="right" dataKey="avgLength" fill="#8B5CF6" name="平均长度" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">文章评论详细统计</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文章标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  评论数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  参与用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均长度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  活跃度
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.topPosts.slice(0, 10).map((post, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                    <div className="text-sm text-gray-500">ID: {post.postId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.comments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.engagement}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data?.engagementData.find(e => e.postId === post.postId)?.avgLength || 0} 字符
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      {post.comments > 10 ? (
                        <>
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-yellow-600">高</span>
                        </>
                      ) : post.comments > 5 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-600">中</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-gray-600">低</span>
                        </>
                      )}
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

export default CommentAnalytics;