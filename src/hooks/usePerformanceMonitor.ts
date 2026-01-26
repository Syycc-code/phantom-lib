/**
 * 性能监控Hook
 * 监控组件渲染、API调用等性能指标
 */

import { useEffect, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'render' | 'api' | 'user-action' | 'resource';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;

  record(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    if (import.meta.env.DEV) {
      this.logMetric(metric);
    }
  }

  private logMetric(metric: PerformanceMetric) {
    const emoji = {
      render: '🎨',
      api: '📡',
      'user-action': '🖱️',
      resource: '📦'
    }[metric.type];

    const color = metric.duration > 1000 ? 'red' : 
                  metric.duration > 500 ? 'orange' : 'green';

    console.log(
      `%c${emoji} [${metric.type.toUpperCase()}] ${metric.name}`,
      `color: ${color}; font-weight: bold`,
      `${metric.duration.toFixed(2)}ms`,
      metric.metadata || ''
    );
  }

  getStats() {
    const byType = this.metrics.reduce((acc, m) => {
      if (!acc[m.type]) acc[m.type] = [];
      acc[m.type].push(m.duration);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(byType).map(([type, durations]) => ({
      type,
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99)
    }));
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  exportReport() {
    const stats = this.getStats();
    const report = {
      timestamp: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      stats,
      recentMetrics: this.metrics.slice(-50)
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phantom-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return report;
  }

  clear() {
    this.metrics = [];
  }

  getAllMetrics() {
    return this.metrics;
  }
}

const monitor = new PerformanceMonitor();

// 组件渲染监控Hook
export function useRenderMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const duration = performance.now() - startTime.current;
    
    monitor.record({
      name: componentName,
      duration,
      timestamp: Date.now(),
      type: 'render',
      metadata: { renderCount: renderCount.current }
    });

    startTime.current = performance.now();
  });
}

// API调用监控
export function monitorAPI<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  return apiCall()
    .then(result => {
      const duration = performance.now() - startTime;
      monitor.record({
        name: apiName,
        duration,
        timestamp: Date.now(),
        type: 'api',
        metadata: { status: 'success' }
      });
      return result;
    })
    .catch(error => {
      const duration = performance.now() - startTime;
      monitor.record({
        name: apiName,
        duration,
        timestamp: Date.now(),
        type: 'api',
        metadata: { status: 'error', error: error.message }
      });
      throw error;
    });
}

// 用户操作监控
export function monitorUserAction(actionName: string, action: () => void) {
  const startTime = performance.now();
  action();
  const duration = performance.now() - startTime;
  
  monitor.record({
    name: actionName,
    duration,
    timestamp: Date.now(),
    type: 'user-action'
  });
}

export const performanceMonitor = monitor;

// 挂载到window方便调试
if (typeof window !== 'undefined') {
  (window as any).__PHANTOM_MONITOR__ = monitor;
}
