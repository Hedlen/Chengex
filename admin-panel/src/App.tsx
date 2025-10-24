import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VideoManagement from './pages/VideoManagement';
import BlogManagement from './pages/BlogManagement';
import BlogEditor from './pages/BlogEditor';
import UserManagement from './pages/UserManagement';
import DataManagement from './pages/DataManagement';
import SystemSettings from './pages/SystemSettings';
import AnalyticsPage from './pages/AnalyticsPage';
import PageViewsAnalytics from './pages/PageViewsAnalytics';
import VideoAnalytics from './pages/VideoAnalytics';
import CommentAnalytics from './pages/CommentAnalytics';
import ExternalVideoAnalytics from './pages/ExternalVideoAnalytics';
import ActivityLogsPage from './pages/ActivityLogsPage';
import DatabaseInfo from './pages/DatabaseInfo';
import './index.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <Routes>
          {/* 登录页面 */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 受保护的管理页面 */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* 仪表板 */}
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* 视频管理 */}
            <Route path="videos" element={<VideoManagement />} />
            
            {/* 博客管理 */}
            <Route path="blogs" element={<BlogManagement />} />
            
            {/* 博客编辑器 */}
            <Route path="blogs/editor" element={<BlogEditor />} />
            <Route path="blogs/editor/:id" element={<BlogEditor />} />
            
            {/* 用户管理 */}
            <Route path="users" element={<UserManagement />} />
            
            {/* 数据管理 */}
            <Route path="data" element={<DataManagement />} />
            
            {/* 统计分析 */}
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="analytics/pageviews" element={<PageViewsAnalytics />} />
            <Route path="analytics/videos" element={<VideoAnalytics />} />
            <Route path="analytics/comments" element={<CommentAnalytics />} />
            <Route path="analytics/external-videos" element={<ExternalVideoAnalytics />} />
            
            {/* 系统设置 */}
            <Route path="settings" element={<SystemSettings />} />
            
            {/* 活动日志 */}
            <Route path="logs" element={<ActivityLogsPage />} />
            
            {/* 数据库信息 */}
            <Route path="database" element={<DatabaseInfo />} />
            
            {/* 默认重定向到仪表板 */}
            <Route path="" element={<Navigate to="/dashboard" replace />} />
          </Route>
          
          {/* 根路径重定向 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;