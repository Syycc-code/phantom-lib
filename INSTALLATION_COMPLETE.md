# 🎩 Phantom Library - 完整安装指南

## ✅ 所有问题已修复！

你的环境现在已经**完全配置好**，所有功能都可以使用了！

---

## 🚀 快速启动

### 启动方式

**推荐：一键启动**
```bash
双击 start_phantom.bat
```

或者手动启动：

**后端（终端1）：**
```bash
cd backend
uvicorn main:app --reload
```

**前端（终端2）：**
```bash
npm run dev
```

访问：http://localhost:5173

---

## 📦 完整功能列表（全部可用）

| 功能 | 状态 | 说明 |
|------|------|------|
| PDF 阅读器 | ✅ | 原生渲染，无限滚动 |
| OCR 文字识别 | ✅ | RapidOCR，支持图片和扫描件 |
| Mind Hack | ✅ | DeepSeek AI 智能分析 |
| 自动标签 | ✅ | 智能分类（CV/NLP/RL/NetSec） |
| 文档融合 | ✅ | 跨文档对比分析 |
| **RAG 聊天** | ✅ | **已启用！** 向量检索 + AI 对话 |

---

## 🔧 已解决的技术问题

### 1. onnxruntime DLL 错误
- **问题**：`DLL 初始化失败`
- **解决**：降级到 `onnxruntime==1.19.2`

### 2. PyTorch 兼容性问题
- **问题**：PyTorch 2.10.0 DLL 加载失败
- **解决**：使用 `torch==2.5.1+cpu` 版本

### 3. NumPy 版本冲突
- **问题**：NumPy 2.4.1 与旧库不兼容
- **解决**：降级到 `numpy<2.0` (1.26.4)

### 4. 缺失依赖
- **问题**：chromadb, sentence-transformers 等未安装
- **解决**：全部安装并锁定版本

---

## ⚙️ 首次启动注意事项

### 首次启动会发生什么？

后端首次启动时会：
1. **下载 AI 模型**（约 90MB）
   - 模型：`sentence-transformers/all-MiniLM-L6-v2`
   - 存储位置：`C:\Users\26320\.cache\huggingface\`
   - 时间：根据网速，可能需要 1-5 分钟

2. **初始化数据库**
   - 创建 `phantom_database.db`
   - 初始化向量数据库

### 启动日志示例（正常）

```
[PHANTOM] Loading Embedding Model...
Downloading model from HuggingFace...  [可能需要几分钟]
[PHANTOM] Embedding Model Ready.
INFO: Application startup complete.
```

---

## 🔑 可选配置

### DeepSeek API（AI 功能）

如果不配置，会使用模拟模式。要启用真实 AI：

1. 在项目根目录创建 `.env` 文件
2. 添加内容：
```env
DEEPSEEK_API_KEY=sk-your-key-here
```

---

## 📝 技术栈详情

### 后端依赖（已锁定版本）
```
onnxruntime==1.19.2
chromadb==1.4.1
sentence-transformers==5.2.0
numpy==1.26.4
torch==2.5.1+cpu
```

### 前端依赖
```
React 19.2.0
Vite 7.2.4
Tailwind CSS 4.1.18
react-pdf 10.3.0
```

---

## 🐛 常见问题

### Q: 首次启动很慢？
A: 正常，正在下载 AI 模型（仅第一次）

### Q: 看到 "RAG features disabled" 警告？
A: 检查：
1. 是否安装了 Visual C++ Redistributable
2. 是否降级了 NumPy (`pip install "numpy<2.0"`)
3. 是否重启了后端

### Q: 网络超时无法下载模型？
A: 可以手动下载或使用国内镜像：
```bash
export HF_ENDPOINT=https://hf-mirror.com
```

---

## 🎯 验证安装

运行测试脚本：
```bash
cd backend
python -c "from sentence_transformers import SentenceTransformer; import chromadb; print('All systems operational!')"
```

看到 `All systems operational!` 说明一切正常！

---

## 📊 性能优化建议

1. **启用开发者模式**（Windows）
   - 设置 → 更新和安全 → 开发者选项 → 开发者模式
   - 这样 HuggingFace 缓存会使用符号链接，节省磁盘空间

2. **使用 SSD**
   - 向量数据库性能依赖磁盘 I/O

3. **配置代理**（如果 HuggingFace 下载慢）
   ```bash
   set HF_ENDPOINT=https://hf-mirror.com
   ```

---

## 🎉 恭喜！

你的 **Phantom Library** 现在已经**完全可用**了！

所有功能，包括：
- ✅ PDF 阅读
- ✅ OCR 识别  
- ✅ AI 分析
- ✅ **RAG 聊天**（向量检索 + AI 对话）

都已经就绪！🚀

---

> *"Wake up, Get up, Get out there."*
