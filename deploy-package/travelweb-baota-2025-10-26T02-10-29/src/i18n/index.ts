import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh', // 默认回退到中文
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // 增强的回退配置
    fallbackNS: 'translation',
    
    // 当翻译缺失时的处理
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`🔍 Missing translation key: ${key} for language: ${lng}`);
      // 返回 fallback 值或者 key 本身
      return fallbackValue || key;
    },
    
    // 解析缺失的键
    parseMissingKeyHandler: (key) => {
      console.warn(`🔍 Parsing missing key: ${key}`);
      return key;
    },
    
    // 当翻译缺失时，尝试使用其他语言的翻译
    saveMissing: false,
    
    // 更严格的键检查
    returnEmptyString: false,
    returnNull: false,
    
    // 当键不存在时返回键名而不是空字符串
    returnObjects: false,
  });

// 添加语言切换错误处理
i18n.on('languageChanged', (lng) => {
  console.log(`🌐 Language changed to: ${lng}`);
  
  // 验证语言是否有效
  if (!resources[lng as keyof typeof resources]) {
    console.warn(`⚠️ Language ${lng} not supported, falling back to zh`);
    i18n.changeLanguage('zh');
  }
});

// 添加翻译缺失的监听器
i18n.on('missingKey', (lng, namespace, key, res) => {
  console.warn(`🔍 Missing translation: ${key} in ${lng}/${namespace}`);
});

export default i18n;