import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useBlog } from '../contexts/BlogContext';
import { useVideo } from '../contexts/VideoContext';
import { 
  BarChart3, 
  FileText, 
  Video, 
  Users, 
  Settings, 
  Calendar,
  Eye,
  TrendingUp,
  MessageSquare,
  LogOut,
  Menu,
  X,
  PieChart,
  Activity,
  MousePointer
} from 'lucide-react';
import BlogManagement from '../components/admin/BlogManagement';
import VideoManagement from '../components/VideoManagement';
import PageViewsPage from './admin/PageViewsPage';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { posts } = useBlog();
  const { videos } = useVideo();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock data for bookings and messages
  const mockBookings = [
    { id: 1, customer: '张三', service: '成都三日游', amount: 2600, status: 'confirmed', date: '2024-01-15' },
    { id: 2, customer: 'John Smith', service: '美食文化体验', amount: 1200, status: 'pending', date: '2024-01-16' },
    { id: 3, customer: '李四', service: '大熊猫基地游览', amount: 800, status: 'completed', date: '2024-01-14' }
  ];

  const mockMessages = [
    { id: 1, name: '王五', email: 'wang@example.com', message: '想了解更多关于成都旅游的信息', date: '2024-01-15', status: 'unread' },
    { id: 2, name: 'Sarah', email: 'sarah@example.com', message: 'Great service! Thank you for the wonderful trip.', date: '2024-01-14', status: 'read' }
  ];

  const tabs = [
    { id: 'dashboard', name: t('admin.tabs.dashboard'), icon: BarChart3 },
    { id: 'posts', name: t('admin.tabs.posts'), icon: FileText },
    { id: 'videos', name: t('admin.tabs.videos'), icon: Video },
    { id: 'pageviews', name: '页面浏览统计', icon: Eye },
    { id: 'bookings', name: t('admin.tabs.bookings'), icon: Calendar },
    { id: 'messages', name: t('admin.tabs.messages'), icon: MessageSquare },
    { id: 'users', name: t('admin.tabs.users'), icon: Users },
    { id: 'settings', name: t('admin.tabs.settings'), icon: Settings }
  ];

  const handleLogout = () => {
    if (window.confirm(t('admin.confirmLogout'))) {
      logout();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
        <div className="text-sm text-gray-500">
          {t('admin.dashboard.lastUpdated')}: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.stats.totalBookings')}</p>
              <p className="text-2xl font-bold text-gray-900">¥2600</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+12% {t('admin.dashboard.stats.thisMonth')}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.stats.blogPosts')}</p>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              {posts.filter(p => p.status === 'published').length} {t('admin.dashboard.stats.published')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.stats.videoContent')}</p>
              <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              {videos.reduce((sum, v) => sum + v.views, 0)} {t('admin.dashboard.stats.totalViews')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.stats.unreadMessages')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockMessages.filter(m => m.status === 'unread').length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">{t('admin.dashboard.stats.needReply')}</span>
          </div>
        </div>
      </div>

      {/* Analytics Quick Access */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">数据分析</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/dashboard"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PieChart className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-blue-900">统计仪表板</p>
              <p className="text-sm text-blue-600">数据概览</p>
            </div>
          </Link>
          <Link
            to="/admin/analytics/views"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <MousePointer className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-900">浏览量统计</p>
              <p className="text-sm text-green-600">页面访问分析</p>
            </div>
          </Link>
          <Link
            to="/admin/analytics/videos"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Video className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-purple-900">视频统计</p>
              <p className="text-sm text-purple-600">播放数据分析</p>
            </div>
          </Link>
          <Link
            to="/admin/analytics/comments"
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <MessageSquare className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="font-medium text-orange-900">评论统计</p>
              <p className="text-sm text-orange-600">用户互动分析</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.recentBookings')}</h3>
          <div className="space-y-4">
            {mockBookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{booking.customer}</p>
                  <p className="text-sm text-gray-600">{booking.service}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">¥{booking.amount}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {t(`admin.bookingStatus.${booking.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.latestPosts')}</h3>
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                  <p className="text-sm text-gray-600">{post.date}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t('admin.bookingManagement')}</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.table.customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.table.service')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.table.date')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{booking.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {t(`admin.bookingStatus.${booking.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'posts':
        return <BlogManagement />;
      case 'videos':
        return <VideoManagement />;
      case 'pageviews':
        return <PageViewsPage />;
      case 'bookings':
        return renderBookings();
      case 'messages':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">消息管理</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">消息管理功能开发中...</p>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">用户管理功能开发中...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">系统设置功能开发中...</p>
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed top padding to account for navbar */}
      <div className="pt-16">
        <div className="flex">
          {/* Sidebar */}
          <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 lg:hidden">
              <h2 className="text-lg font-semibold text-gray-900">管理面板</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col h-full pt-16 lg:pt-0">
              <div className="flex-1 px-4 py-6 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  退出登录
                </button>
              </div>
            </div>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            {/* Mobile header */}
            <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">管理面板</h1>
                <div className="w-9" /> {/* Spacer */}
              </div>
            </div>

            {/* Content */}
            <main className="p-4 lg:p-8">
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;