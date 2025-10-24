import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Server,
  Shield,
  FileText,
  Globe,
  Key,
  Clock,
  HardDrive,
  Cpu,
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
  Users,
  Lock
} from 'lucide-react';
import { DataManager } from '@shared/api/dataManager';
import { SystemConfig } from '@shared/types';
import '../styles/shared.css';

const SystemSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    adminEmail: '',
    youtubeApiKey: '',
    tiktokApiKey: '',
    sessionTimeout: 30,
    enableRegistration: true,
    maintenanceMode: false,
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov']
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    youtube: false,
    tiktok: false
  });
  const [activeTab, setActiveTab] = useState('general');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const systemConfig = await DataManager.getSystemConfig();
      setConfig(systemConfig);
    } catch (error) {
      console.error('加载系统配置失败:', error);
      setSaveMessage({ type: 'error', text: '加载配置失败，请刷新页面重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      await DataManager.saveSystemConfig(config);
      setSaveMessage({ type: 'success', text: '配置保存成功！' });
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('保存系统配置失败:', error);
      setSaveMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleApiKeyVisibility = (type: 'youtube' | 'tiktok') => {
    setShowApiKeys(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const formatFileTypes = (types: string[]) => {
    return types.join(', ');
  };

  const parseFileTypes = (value: string) => {
    return value.split(',').map(type => type.trim()).filter(type => type.length > 0);
  };

  const tabs = [
    { id: 'general', name: '基本设置', icon: Globe },
    { id: 'api', name: 'API设置', icon: Key },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'file', name: '文件设置', icon: FileText },
    { id: 'status', name: '系统状态', icon: Server }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-title">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          </div>
          <p className="text-gray-600">管理系统的核心配置和功能设置</p>
        </div>
        <div className="page-header-actions">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="action-btn action-btn-primary"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存设置'}
          </button>
          <button
            onClick={loadConfig}
            disabled={isLoading}
            className="action-btn action-btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            重新加载
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {saveMessage && (
        <div className={`alert ${saveMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 设置内容 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* 基本设置 */}
        {activeTab === 'general' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本设置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">
                  网站名称
                </label>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  className="form-input"
                  placeholder="输入网站名称"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  管理员邮箱
                </label>
                <input
                  type="email"
                  value={config.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  className="form-input"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                网站描述
              </label>
              <textarea
                value={config.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                rows={3}
                className="form-input"
                placeholder="输入网站描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站URL
              </label>
              <input
                type="url"
                value={config.siteUrl}
                onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>
        )}

        {/* API设置 */}
        {activeTab === 'api' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API设置</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube API密钥
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.youtube ? 'text' : 'password'}
                    value={config.youtubeApiKey}
                    onChange={(e) => handleInputChange('youtubeApiKey', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="输入YouTube API密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('youtube')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showApiKeys.youtube ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  用于同步YouTube视频数据
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TikTok API密钥
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.tiktok ? 'text' : 'password'}
                    value={config.tiktokApiKey}
                    onChange={(e) => handleInputChange('tiktokApiKey', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="输入TikTok API密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('tiktok')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showApiKeys.tiktok ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  用于同步TikTok视频数据
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 安全设置 */}
        {activeTab === 'security' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">安全设置</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会话超时时间（分钟）
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={config.sessionTimeout}
                  onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用户无操作后自动退出的时间
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">允许用户注册</h4>
                    <p className="text-xs text-gray-500">开启后新用户可以自行注册账号</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableRegistration}
                    onChange={(e) => handleInputChange('enableRegistration', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">维护模式</h4>
                    <p className="text-xs text-gray-500">开启后网站将显示维护页面</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.maintenanceMode}
                    onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 文件设置 */}
        {activeTab === 'file' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">文件设置</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大文件大小（MB）
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxFileSize}
                  onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  单个文件上传的最大大小限制
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  允许的文件类型
                </label>
                <input
                  type="text"
                  value={formatFileTypes(config.allowedFileTypes)}
                  onChange={(e) => handleInputChange('allowedFileTypes', parseFileTypes(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="jpg, jpeg, png, gif, mp4, mov"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用逗号分隔多个文件类型
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 系统状态 */}
        {activeTab === 'status' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">系统状态</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium">服务器状态</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">正常运行</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium">API服务</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">正常</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">运行时间</span>
                  </div>
                  <span className="text-sm text-gray-600">2天 14小时</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Info className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">系统版本</span>
                  </div>
                  <span className="text-sm text-gray-600">v1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 保存按钮 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;