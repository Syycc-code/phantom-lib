# 🔧 网络连接问题解决方案

## ⚠️ 问题描述
使用VPN时，前端调用后端API出现：
- 长时间连接不上
- `Failed to fetch` 错误
- 特别是OCR和AI功能（`/api/scan_document`, `/api/mind_hack`, `/api/chat`）

---

## 🎯 解决方案（按优先级排序）

### 方案1: 修改localhost为具体IP（推荐）⭐⭐⭐⭐⭐

**原理**：VPN通常不会干扰 `localhost`，但可能干扰 `127.0.0.1`

#### 步骤：

1. **修改 `vite.config.ts`**：
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // ✅ 改为 localhost（不是127.0.0.1）
        changeOrigin: true,
        secure: false,                     // ✅ 新增：允许不安全连接
        ws: true,                          // ✅ 新增：支持WebSocket
        timeout: 300000,
        proxyTimeout: 300000,
      }
    }
  }
})
```

2. **确保后端绑定正确**：
启动后端时使用：
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### 方案2: VPN排除本地流量（最彻底）⭐⭐⭐⭐⭐

**原理**：让VPN不处理localhost流量

#### 根据VPN软件操作：

**Clash/ClashX**:
```yaml
# 在配置文件中添加
bypass:
  - localhost
  - 127.0.0.1
  - ::1
```

**V2Ray/V2RayN**:
```json
{
  "routing": {
    "rules": [
      {
        "type": "field",
        "ip": ["127.0.0.0/8"],
        "outboundTag": "direct"
      }
    ]
  }
}
```

**Shadowsocks**:
- 设置 > 系统代理模式 > PAC模式
- 编辑PAC文件，添加：
```javascript
if (host == "localhost" || host == "127.0.0.1") return "DIRECT";
```

**常规VPN（如NordVPN、ExpressVPN）**:
- 设置 > Split Tunneling（分流）
- 添加排除：`localhost`, `127.0.0.1`

---

### 方案3: 关闭VPN测试（临时方案）⭐⭐⭐

**步骤**：
1. 暂时关闭VPN
2. 测试文档解读和AI功能
3. 如果正常 → 确认是VPN问题
4. 应用方案1或方案2

---

### 方案4: 增加Fetch超时处理（补充方案）⭐⭐⭐⭐

**原理**：给前端fetch请求添加明确的超时和重试机制

创建 `src/utils/fetch.ts`：
```typescript
/**
 * 带超时和重试的Fetch封装
 */

interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export async function fetchWithTimeout(
  url: string, 
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 60000, retries = 2, ...fetchOptions } = options;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok && i < retries) {
        console.warn(`请求失败，尝试重试 (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries) throw error;
      console.warn(`网络错误，尝试重试 (${i + 1}/${retries}): ${error}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw new Error('Max retries reached');
}
```

**使用示例**（在App.tsx中）：
```typescript
import { fetchWithTimeout } from './utils/fetch';

// OCR处理
const processOCR = async (file: File, paperId: number) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetchWithTimeout('/api/scan_document', {
      method: 'POST',
      body: formData,
      timeout: 120000,  // 2分钟超时
      retries: 2        // 重试2次
    });
    
    if (!response.ok) throw new Error("Scan Failed");
    const data = await response.json();
    // ... 处理结果
  } catch (e) {
    console.error('OCR处理失败:', e);
    // ... 错误处理
  }
};

// AI Mind Hack
const handleAction = async (type: 'DECIPHER' | 'TRANSLATE') => {
  try {
    const response = await fetchWithTimeout('/api/mind_hack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: selectionMenu.text, mode: type.toLowerCase() }),
      timeout: 30000,   // 30秒超时
      retries: 1
    });
    
    const data = await response.json();
    // ... 处理结果
  } catch (e) {
    console.error('Mind Hack失败:', e);
    // ... 错误处理
  }
};
```

---

### 方案5: 后端添加健康检查端点⭐⭐⭐

**原理**：快速诊断后端连接状态

在 `backend/main.py` 添加：
```python
@app.get("/health")
async def health_check():
    """健康检查端点 - 无需VPN即可访问"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "message": "Phantom Backend Online"
    }

@app.get("/api/ping")
async def ping():
    """快速ping测试"""
    return {"pong": True}
```

前端测试连接：
```typescript
// 在App.tsx的useEffect中添加
useEffect(() => {
  const checkBackend = async () => {
    try {
      const response = await fetch('/api/ping');
      const data = await response.json();
      if (data.pong) {
        console.log('✅ 后端连接正常');
      }
    } catch (e) {
      console.error('❌ 后端连接失败:', e);
      alert('警告：无法连接到后端服务，请检查：\n1. 后端是否启动\n2. VPN是否干扰本地连接');
    }
  };
  
  checkBackend();
}, []);
```

---

## 🔍 诊断步骤

### 1. 检查后端是否运行
```bash
# 检查8000端口是否被占用
netstat -ano | findstr :8000

# 或使用PowerShell
Get-NetTCPConnection -LocalPort 8000
```

### 2. 测试后端连接（不通过Vite代理）
打开浏览器，直接访问：
```
http://localhost:8000/health
http://127.0.0.1:8000/health
```

如果都能访问 → VPN干扰了Vite代理  
如果都不能访问 → 后端未启动或端口被占用  
如果localhost能访问但127.0.0.1不能 → VPN干扰了IP解析

### 3. 检查VPN配置
```bash
# Windows - 查看路由表
route print | findstr 127.0.0.1

# 查看代理设置
netsh winhttp show proxy
```

### 4. 查看浏览器控制台
打开DevTools（F12） → Network标签 → 查看失败请求的详细信息：
- Status: 如果是0或空 → 请求未发出（VPN拦截）
- Status: 502/504 → 代理超时
- Status: ERR_CONNECTION_REFUSED → 后端未运行

---

## 📋 推荐配置组合

### 配置A：完全绕过VPN（推荐用于开发）
1. ✅ 方案1：修改vite.config.ts使用localhost
2. ✅ 方案2：VPN排除localhost流量
3. ✅ 方案5：添加健康检查

### 配置B：保留VPN + 优化超时（推荐用于需要VPN访问外网API）
1. ✅ 方案1：修改vite.config.ts
2. ✅ 方案4：添加Fetch超时处理
3. ✅ 方案5：添加健康检查

---

## ⚡ 快速修复（5分钟内解决）

**最快的解决方法**：

1. **修改vite.config.ts**：
```bash
cd C:/Users/26320/Desktop/女神异闻录project/phantom-lib
code vite.config.ts
```

将第14行改为：
```typescript
target: 'http://localhost:8000',  // 从127.0.0.1改为localhost
```

2. **重启前端开发服务器**：
```bash
# Ctrl+C 停止
npm run dev
```

3. **测试**：
上传文档或使用AI功能，应该能正常工作

---

## 🎯 预期效果

修复后应该能够：
- ✅ OCR扫描文档不超时
- ✅ Mind Hack功能正常响应
- ✅ RAG聊天正常工作
- ✅ 融合功能正常

---

## 📞 仍然无法解决？

如果以上方案都不行，检查：

1. **防火墙设置**
   - Windows防火墙可能阻止了本地端口
   - 临时关闭防火墙测试

2. **杀毒软件**
   - 某些杀毒软件会拦截localhost请求
   - 添加项目文件夹到白名单

3. **端口冲突**
   - 8000端口被其他程序占用
   - 改用8001或其他端口

4. **网络代理设置**
   - 系统级代理可能影响
   - 检查：设置 > 网络和Internet > 代理

---

**最后更新**: 2026-01-26  
**适用版本**: Phantom Library v2.7
