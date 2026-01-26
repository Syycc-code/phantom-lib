# 🔍 Phantom Library 性能监控方案

## 📊 监控目标

### 前端监控
- ⏱️ 组件渲染时间
- 📡 API请求耗时
- 🧠 内存使用情况
- 🎨 页面加载性能
- 🖱️ 用户交互响应时间

### 后端监控
- ⚡ API端点响应时间
- 🔬 OCR处理耗时
- 🤖 AI调用延迟
- 💾 数据库查询时间
- 📈 并发请求处理

---

## 🛠️ 方案1: 内置性能监控（推荐，易实现）

### 1.1 前端性能监控Hook

创建 `src/hooks/usePerformanceMonitor.ts`：

```typescript
/**
 * 性能监控Hook
 * 监控组件渲染、API调用等性能指标
 */

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'render' | 'api' | 'user-action' | 'resource';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // 最多保存1000条记录

  // 记录性能指标
  record(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // 限制记录数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 实时输出到控制台（可选）
    if (process.env.NODE_ENV === 'development') {
      this.logMetric(metric);
    }
  }

  // 格式化输出
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

  // 获取统计数据
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

  // 计算百分位数
  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // 导出性能报告
  exportReport() {
    const stats = this.getStats();
    const report = {
      timestamp: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      stats,
      recentMetrics: this.metrics.slice(-50) // 最近50条
    };

    // 下载为JSON文件
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phantom-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return report;
  }

  // 清空记录
  clear() {
    this.metrics = [];
  }
}

// 单例
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

// 导出性能监控器
export const performanceMonitor = monitor;

// 挂载到window方便调试
if (typeof window !== 'undefined') {
  (window as any).__PHANTOM_MONITOR__ = monitor;
}
```

---

### 1.2 使用示例

#### 监控组件渲染
```typescript
// 在任意组件中
import { useRenderMonitor } from '@/hooks/usePerformanceMonitor';

function App() {
  useRenderMonitor('App');
  
  return <div>...</div>;
}

function ReaderOverlay({ paper }: Props) {
  useRenderMonitor('ReaderOverlay');
  
  return <div>...</div>;
}
```

#### 监控API调用
```typescript
import { monitorAPI } from '@/hooks/usePerformanceMonitor';

// OCR处理
const processOCR = async (file: File) => {
  return monitorAPI('OCR_Scan', async () => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/scan_document', {
      method: 'POST',
      body: formData
    });
    return response.json();
  });
};

// Mind Hack
const handleMindHack = async (text: string) => {
  return monitorAPI('Mind_Hack', async () => {
    const response = await fetch('/api/mind_hack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode: 'decipher' })
    });
    return response.json();
  });
};
```

#### 监控用户操作
```typescript
import { monitorUserAction } from '@/hooks/usePerformanceMonitor';

// 按钮点击
<button onClick={() => {
  monitorUserAction('Upload_PDF', () => {
    fileInputRef.current?.click();
  });
}}>
  Upload
</button>

// 文件夹操作
const handleAddFolder = () => {
  monitorUserAction('Add_Folder', () => {
    const name = window.prompt("ENTER MISSION NAME:");
    if (name) {
      setFolders(prev => [...prev, { id: Date.now().toString(), name }]);
    }
  });
};
```

---

### 1.3 性能仪表盘组件

创建 `src/components/PerformanceDashboard.tsx`：

```typescript
/**
 * 性能监控仪表盘
 * 实时显示性能指标
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, X } from 'lucide-react';
import { performanceMonitor } from '@/hooks/usePerformanceMonitor';

export function PerformanceDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleExport = () => {
    performanceMonitor.exportReport();
  };

  const handleClear = () => {
    performanceMonitor.clear();
    setStats([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9998] bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
        title="Performance Monitor"
      >
        <Activity size={24} />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ x: -400 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 bottom-0 w-96 bg-black/95 text-white z-[9998] overflow-auto p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Activity size={20} />
          Performance Monitor
        </h3>
        <button onClick={() => setIsOpen(false)} className="hover:text-red-500">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.type} className="bg-white/10 p-3 rounded">
            <div className="text-sm font-bold mb-2 uppercase">{stat.type}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Count: {stat.count}</div>
              <div>Avg: {stat.avg.toFixed(2)}ms</div>
              <div>Min: {stat.min.toFixed(2)}ms</div>
              <div>Max: {stat.max.toFixed(2)}ms</div>
              <div>P95: {stat.p95.toFixed(2)}ms</div>
              <div>P99: {stat.p99.toFixed(2)}ms</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={handleExport}
          className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Export Report
        </button>
        <button
          onClick={handleClear}
          className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Clear Metrics
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <div>Press F12 to open DevTools</div>
        <div>Type: <code>__PHANTOM_MONITOR__.getStats()</code></div>
      </div>
    </motion.div>
  );
}
```

#### 在App.tsx中使用
```typescript
import { PerformanceDashboard } from './components/PerformanceDashboard';

function App() {
  return (
    <div>
      {/* 现有内容 */}
      
      {/* 性能监控仪表盘（仅开发环境） */}
      {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
    </div>
  );
}
```

---

## 🛠️ 方案2: 后端性能监控

### 2.1 FastAPI中间件监控

在 `backend/main.py` 添加：

```python
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('phantom_performance.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("phantom")

class PerformanceMiddleware(BaseHTTPMiddleware):
    """性能监控中间件"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # 记录请求开始
        logger.info(f"[START] {request.method} {request.url.path}")
        
        # 处理请求
        response = await call_next(request)
        
        # 计算耗时
        duration = (time.time() - start_time) * 1000  # 转换为毫秒
        
        # 记录结果
        status_emoji = "✅" if response.status_code < 400 else "❌"
        logger.info(
            f"{status_emoji} [{response.status_code}] "
            f"{request.method} {request.url.path} "
            f"- {duration:.2f}ms"
        )
        
        # 如果超过阈值，发出警告
        if duration > 5000:  # 5秒
            logger.warning(
                f"⚠️ SLOW REQUEST: {request.url.path} took {duration:.2f}ms"
            )
        
        # 添加响应头
        response.headers["X-Process-Time"] = str(duration)
        
        return response

# 添加中间件
app.add_middleware(PerformanceMiddleware)
```

### 2.2 详细的端点监控

```python
import functools
from typing import Callable

def monitor_performance(operation_name: str):
    """装饰器：监控函数执行时间"""
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            logger.info(f"🔬 [START] {operation_name}")
            
            try:
                result = await func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                logger.info(f"✅ [SUCCESS] {operation_name} - {duration:.2f}ms")
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                logger.error(f"❌ [ERROR] {operation_name} - {duration:.2f}ms - {str(e)}")
                raise
        
        return wrapper
    return decorator

# 使用示例
@app.post("/api/scan_document")
@monitor_performance("OCR_Document_Scan")
async def scan_document(file: UploadFile = File(...)):
    # ... OCR处理逻辑
    pass

@app.post("/api/mind_hack")
@monitor_performance("Mind_Hack_Analysis")
async def mind_hack(request: MindHackRequest):
    # ... Mind Hack逻辑
    pass
```

---

## 🛠️ 方案3: 浏览器DevTools（零配置）

### 3.1 Chrome Performance Profiler

**使用步骤**：
1. 打开应用 (http://localhost:5173)
2. 按F12打开DevTools
3. 切换到 **Performance** 标签
4. 点击 **Record** (●)
5. 执行要测试的操作（上传PDF、使用AI等）
6. 点击 **Stop**
7. 分析火焰图

**重点关注**：
- 🔴 红色区域：性能瓶颈
- ⏱️ Long Tasks：超过50ms的任务
- 🎨 Paint：渲染时间
- 📜 Scripting：JavaScript执行时间

### 3.2 React DevTools Profiler

**安装**：
```bash
# Chrome扩展商店搜索 "React Developer Tools"
```

**使用步骤**：
1. 安装扩展后刷新页面
2. 打开DevTools，切换到 **Profiler** 标签
3. 点击 **Record**
4. 执行操作
5. 点击 **Stop**
6. 查看组件渲染时间

**优化建议**：
- 黄色/红色组件：渲染耗时过长
- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useMemo` 和 `useCallback` 缓存计算结果

### 3.3 Network面板监控

**使用步骤**：
1. F12 → **Network** 标签
2. 勾选 **Preserve log**
3. 执行操作
4. 查看每个请求的耗时

**重点关注**：
- ⏱️ **Time**: 总耗时
- 🔵 **Waiting (TTFB)**: 服务器响应时间
- 🟢 **Content Download**: 下载时间

---

## 🛠️ 方案4: 第三方监控服务（生产环境推荐）

### 4.1 Sentry（错误和性能监控）

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0, // 100%采样
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

### 4.2 Vercel Analytics（如果部署到Vercel）

```bash
npm install @vercel/analytics
```

```typescript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

---

## 📊 推荐配置组合

### 开发环境
1. ✅ **方案1**: 内置性能监控（实时反馈）
2. ✅ **方案2**: 后端中间件监控（API耗时）
3. ✅ **方案3**: Chrome DevTools（深度分析）

### 生产环境
1. ✅ **方案4**: Sentry（错误监控 + 性能追踪）
2. ✅ **方案2**: 后端日志（持久化记录）

---

## 🎯 关键性能指标（KPI）

| 指标 | 目标值 | 当前预估 | 优化建议 |
|------|--------|----------|----------|
| **首屏加载** | < 2s | ~1.5s | ✅ 已优化 |
| **OCR扫描** | < 30s | ~60s | ⚠️ 需优化 |
| **Mind Hack** | < 5s | ~3s | ✅ 可接受 |
| **RAG聊天** | < 3s | ~2s | ✅ 良好 |
| **组件渲染** | < 16ms | ~10ms | ✅ 流畅 |

---

## 📝 使用流程

### 1. 开发时监控
```bash
# 启动应用
npm run dev

# 观察控制台输出的性能日志
# 点击左下角性能图标查看实时数据
```

### 2. 导出性能报告
```javascript
// 在浏览器控制台执行
__PHANTOM_MONITOR__.exportReport()
```

### 3. 分析瓶颈
- 查看 `phantom_performance.log`（后端）
- 查看导出的JSON报告（前端）
- 使用Chrome Performance分析具体操作

---

**创建时间**: 2026-01-26  
**适用版本**: Phantom Library v2.7
