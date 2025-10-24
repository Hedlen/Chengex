import { useTranslation } from 'react-i18next';
import { Globe, AlertCircle } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 支持的语言列表
  const supportedLanguages = ['zh', 'en'];

  // 获取当前语言，确保是支持的语言
  const getCurrentLanguage = useCallback(() => {
    const currentLang = i18n.language;
    return supportedLanguages.includes(currentLang) ? currentLang : 'zh';
  }, [i18n.language]);

  // 获取下一个语言
  const getNextLanguage = useCallback(() => {
    const currentLang = getCurrentLanguage();
    return currentLang === 'zh' ? 'en' : 'zh';
  }, [getCurrentLanguage]);

  // 语言切换处理函数
  const toggleLanguage = useCallback(async () => {
    if (isChanging) return; // 防止重复点击

    const currentLang = getCurrentLanguage();
    const newLang = getNextLanguage();
    
    setIsChanging(true);
    setError(null);

    try {
      console.log(`🌐 语言切换: ${currentLang} -> ${newLang}`);
      
      // 执行语言切换
      await i18n.changeLanguage(newLang);
      
      // 验证切换是否成功
      setTimeout(() => {
        const actualLang = i18n.language;
        if (actualLang !== newLang) {
          console.warn(`⚠️ 语言切换未完全成功: 期望 ${newLang}, 实际 ${actualLang}`);
          setError('语言切换可能未完全生效');
        } else {
          console.log(`✅ 语言切换成功: ${actualLang}`);
        }
        setIsChanging(false);
      }, 100);
      
    } catch (err) {
      console.error('❌ 语言切换失败:', err);
      setError('语言切换失败，请重试');
      setIsChanging(false);
      
      // 尝试回退到默认语言
      try {
        await i18n.changeLanguage('zh');
      } catch (fallbackErr) {
        console.error('❌ 回退到默认语言也失败:', fallbackErr);
      }
    }
  }, [i18n, getCurrentLanguage, getNextLanguage, isChanging]);

  // 监听语言变化事件
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      console.log(`🔄 语言已变更为: ${lng}`);
      setError(null);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // 获取显示文本
  const getDisplayText = useCallback(() => {
    const currentLang = getCurrentLanguage();
    return currentLang === 'zh' ? 'EN' : '中文';
  }, [getCurrentLanguage]);

  return (
    <div className="relative">
      <button
        onClick={toggleLanguage}
        disabled={isChanging}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
          ${isChanging 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-primary-50 hover:bg-primary-100 text-primary-600 hover:text-primary-700 hover:scale-105'
          }
          ${error ? 'border border-red-200' : ''}
        `}
        aria-label={`Switch Language to ${getNextLanguage().toUpperCase()}`}
        title={isChanging ? '正在切换语言...' : `切换到${getNextLanguage() === 'en' ? '英文' : '中文'}`}
      >
        {isChanging ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
            <span className="font-medium text-sm">切换中...</span>
          </>
        ) : error ? (
          <>
            <AlertCircle size={18} className="text-red-500" />
            <span className="font-medium text-red-600">重试</span>
          </>
        ) : (
          <>
            <Globe size={18} />
            <span className="font-medium">
              {getDisplayText()}
            </span>
          </>
        )}
      </button>
      
      {/* 错误提示 */}
      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded shadow-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;