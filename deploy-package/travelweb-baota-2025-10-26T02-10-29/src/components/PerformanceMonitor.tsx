import React, { useEffect, useState, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  networkRequests: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showOverlay?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  showOverlay = false,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    networkRequests: 0
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let animationId: number;
    let fpsInterval: NodeJS.Timeout;

    // FPS 监控
    const measureFPS = () => {
      frameCountRef.current++;
      animationId = requestAnimationFrame(measureFPS);
    };

    // 每秒计算 FPS
    fpsInterval = setInterval(() => {
      const fps = frameCountRef.current;
      frameCountRef.current = 0;
      
      setMetrics(prev => {
        const newMetrics = { ...prev, fps };
        onMetricsUpdate?.(newMetrics);
        return newMetrics;
      });
    }, 1000);

    // 内存使用监控
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        
        setMetrics(prev => {
          const newMetrics = { ...prev, memoryUsage };
          onMetricsUpdate?.(newMetrics);
          return newMetrics;
        });
      }
    };

    // 页面加载时间
    const measureLoadTime = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        setMetrics(prev => {
          const newMetrics = { ...prev, loadTime };
          onMetricsUpdate?.(newMetrics);
          return newMetrics;
        });
      }
    };

    // 网络请求监控
    const measureNetworkRequests = () => {
      const resources = performance.getEntriesByType('resource');
      const networkRequests = resources.length;
      
      setMetrics(prev => {
        const newMetrics = { ...prev, networkRequests };
        onMetricsUpdate?.(newMetrics);
        return newMetrics;
      });
    };

    measureFPS();
    measureMemory();
    measureLoadTime();
    measureNetworkRequests();

    const memoryInterval = setInterval(measureMemory, 5000);
    const networkInterval = setInterval(measureNetworkRequests, 10000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(fpsInterval);
      clearInterval(memoryInterval);
      clearInterval(networkInterval);
    };
  }, [enabled, onMetricsUpdate]);

  // 渲染时间监控
  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    setMetrics(prev => {
      const newMetrics = { ...prev, renderTime };
      onMetricsUpdate?.(newMetrics);
      return newMetrics;
    });
  });

  if (!enabled || !showOverlay) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm font-mono z-50">
      <div className="space-y-1">
        <div>FPS: {metrics.fps}</div>
        <div>Memory: {metrics.memoryUsage}MB</div>
        <div>Load: {metrics.loadTime.toFixed(2)}ms</div>
        <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
        <div>Requests: {metrics.networkRequests}</div>
      </div>
    </div>
  );
};

// Hook for using performance metrics
export const usePerformanceMetrics = (enabled = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    networkRequests: 0
  });

  const updateMetrics = (newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
  };

  return { metrics, updateMetrics };
};

// Performance utilities
export const performanceUtils = {
  // 测量函数执行时间
  measureFunction: <T extends any[], R>(
    fn: (...args: T) => R,
    name?: string
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (name) {
        console.log(`${name} took ${end - start} milliseconds`);
      }
      
      return result;
    };
  },

  // 测量异步函数执行时间
  measureAsyncFunction: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    name?: string
  ) => {
    return async (...args: T): Promise<R> => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      if (name) {
        console.log(`${name} took ${end - start} milliseconds`);
      }
      
      return result;
    };
  },

  // 防抖函数
  debounce: <T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  // 节流函数
  throttle: <T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ) => {
    let lastCall = 0;
    return (...args: T) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }
};