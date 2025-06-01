// src/hooks/usePerformanceMonitor.js - Monitor app performance
import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';

export const usePerformanceMonitor = (screenName = 'Unknown') => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    screenName,
  });
  
  const startTime = useRef(Date.now());
  const renderStartTime = useRef(Date.now());
  const mounted = useRef(false);

  // Track screen load time
  useEffect(() => {
    const loadTime = Date.now() - startTime.current;
    
    setMetrics(prev => ({
      ...prev,
      loadTime,
    }));
    
    console.log(`⏱️ ${screenName} loaded in ${loadTime}ms`);
    
    // Report to analytics if needed
    if (loadTime > 2000) {
      console.warn(`⚠️ Slow load time for ${screenName}: ${loadTime}ms`);
    }
  }, [screenName]);

  // Track render time
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const renderTime = Date.now() - renderStartTime.current;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
      }));
      
      console.log(`🎨 ${screenName} rendered in ${renderTime}ms`);
      
      if (renderTime > 500) {
        console.warn(`⚠️ Slow render time for ${screenName}: ${renderTime}ms`);
      }
    }
  });

  // Monitor memory usage (approximation)
  useEffect(() => {
    const interval = setInterval(() => {
      // For React Native, we can approximate memory usage
      // In a real app, you'd use more specific memory monitoring
      const approximateMemory = performance?.memory?.usedJSHeapSize || 0;
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: approximateMemory,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Track app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log(`📱 App state changed to: ${nextAppState} on ${screenName}`);
      
      if (nextAppState === 'background') {
        logScreenExit();
      } else if (nextAppState === 'active') {
        startTime.current = Date.now();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [screenName]);

  const logScreenExit = useCallback(() => {
    const sessionTime = Date.now() - startTime.current;
    console.log(`👋 ${screenName} session ended after ${sessionTime}ms`);
    
    // Report session metrics
    const sessionMetrics = {
      screenName,
      sessionTime,
      loadTime: metrics.loadTime,
      renderTime: metrics.renderTime,
      timestamp: new Date().toISOString(),
    };
    
    console.log('📊 Session metrics:', sessionMetrics);
    
    // In a real app, send to analytics
    // Analytics.recordEvent('screen_session', sessionMetrics);
  }, [screenName, metrics]);

  // Manual performance tracking
  const trackOperation = useCallback((operationName, operation) => {
    return async (...args) => {
      const start = Date.now();
      
      try {
        const result = await operation(...args);
        const duration = Date.now() - start;
        
        console.log(`⚡ ${operationName} completed in ${duration}ms`);
        
        if (duration > 1000) {
          console.warn(`⚠️ Slow operation ${operationName}: ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ ${operationName} failed after ${duration}ms:`, error);
        throw error;
      }
    };
  }, []);

  // Track component re-renders
  const renderCounter = useRef(0);
  useEffect(() => {
    renderCounter.current += 1;
    
    if (renderCounter.current > 10) {
      console.warn(`⚠️ ${screenName} has re-rendered ${renderCounter.current} times`);
    }
  });

  return {
    metrics,
    trackOperation,
    logScreenExit,
  };
};

// Hook for tracking specific performance events
export const usePerformanceTimer = () => {
  const timers = useRef(new Map());

  const startTimer = useCallback((name) => {
    timers.current.set(name, Date.now());
    console.log(`⏱️ Started timer: ${name}`);
  }, []);

  const endTimer = useCallback((name, logLevel = 'info') => {
    const startTime = timers.current.get(name);
    if (!startTime) {
      console.warn(`⚠️ Timer ${name} was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    timers.current.delete(name);

    const message = `⏱️ ${name}: ${duration}ms`;
    
    if (logLevel === 'warn' || duration > 1000) {
      console.warn(message);
    } else {
      console.log(message);
    }

    return duration;
  }, []);

  const getTimer = useCallback((name) => {
    const startTime = timers.current.get(name);
    return startTime ? Date.now() - startTime : 0;
  }, []);

  return {
    startTimer,
    endTimer,
    getTimer,
  };
};

// Component wrapper for automatic performance monitoring
export const withPerformanceMonitor = (Component, screenName) => {
  return function PerformanceMonitoredComponent(props) {
    const { trackOperation } = usePerformanceMonitor(screenName);

    return <Component {...props} trackOperation={trackOperation} />;
  };
};

// Development-only performance overlay
export const PerformanceOverlay = ({ enabled = __DEV__ }) => {
  const [stats, setStats] = useState({
    fps: 0,
    memory: 0,
    renders: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = Date.now();
    let animationId;

    const updateStats = () => {
      frameCount++;
      const now = Date.now();
      
      if (now - lastTime >= 1000) {
        setStats(prev => ({
          ...prev,
          fps: frameCount,
          memory: Math.round((performance?.memory?.usedJSHeapSize || 0) / 1024 / 1024),
          renders: prev.renders + 1,
        }));
        
        frameCount = 0;
        lastTime = now;
      }
      
      animationId = requestAnimationFrame(updateStats);
    };

    updateStats();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 40,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 8,
      borderRadius: 4,
      zIndex: 9999,
    }}>
      <Text style={{ color: 'white', fontSize: 10, fontFamily: 'monospace' }}>
        FPS: {stats.fps}
      </Text>
      <Text style={{ color: 'white', fontSize: 10, fontFamily: 'monospace' }}>
        RAM: {stats.memory}MB
      </Text>
      <Text style={{ color: 'white', fontSize: 10, fontFamily: 'monospace' }}>
        Renders: {stats.renders}
      </Text>
    </View>
  );
};