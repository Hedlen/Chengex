import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BlogProvider } from './contexts/BlogContext';
import { VideoProvider } from './contexts/VideoContext';
import { DataSyncProvider } from './contexts/DataSyncContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ServicesPage from './pages/ServicesPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import VideoPage from './pages/VideoPage';
import VideoDetailPage from './pages/VideoDetailPage';
import AdminPage from './pages/AdminPage';
import './i18n';

export default function App() {
  useEffect(() => {
    console.log('🚀 App 组件已加载');
    
    // 添加全局测试函数
    (window as any).testLanguageSwitch = () => {
      // 查找语言切换按钮
      const buttons = document.querySelectorAll('button');
      const langButton = Array.from(buttons).find(btn => {
        const text = btn.textContent?.trim();
        return text === 'EN' || text === '中文' || btn.getAttribute('aria-label') === 'Switch Language';
      });
      
      if (langButton) {
        const currentText = langButton.textContent?.trim();
        console.log(`🔄 找到语言切换按钮: "${currentText}"`);
        (langButton as HTMLButtonElement).click();
        console.log('✅ 已点击语言切换按钮');
        
        // 等待一下再检查变化
        setTimeout(() => {
          const newText = langButton.textContent?.trim();
          console.log(`🌐 按钮文本变化: "${currentText}" -> "${newText}"`);
        }, 500);
      } else {
        console.log('❌ 未找到语言切换按钮');
        console.log('📋 页面上的所有按钮:', Array.from(buttons).map(btn => btn.textContent?.trim()));
      }
    };
  }, []);

  return (
    <DataSyncProvider enableWebSocket={false}>
      <AnalyticsProvider>
        <AuthProvider>
          <VideoProvider>
            <BlogProvider>
              <Router>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:id" element={<BlogDetailPage />} />
                    <Route path="/videos" element={<VideoPage />} />
                    <Route path="/videos/:id" element={<VideoDetailPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Routes>
                </main>
                <Toaster position="top-right" />
                </div>
              </Router>
            </BlogProvider>
          </VideoProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </DataSyncProvider>
  );
}
