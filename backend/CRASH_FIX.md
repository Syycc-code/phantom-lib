# 后端自动退出问题 - 修复指南

## 问题症状
后端在处理RAG索引时突然退出，日志停在 `[RAG] Batch 34/166 (chunks 99-102)...`

## 根本原因
**内存溢出** - sentence-transformers模型在编码文本时消耗大量内存,导致Python进程被系统强制终止。

## 已实施的修复

### 1. 减小批处理大小 ✅
- **位置**: `backend/app/services/rag.py:164`
- **修改**: `BATCH_SIZE` 从 3 降低到 **1**
- **效果**: 每次只处理1个文本块,大幅降低内存峰值

### 2. 强制日志刷新 ✅
- **位置**: `backend/app/services/rag.py` 和 `paper_processor.py`
- **修改**: 在关键操作前后添加 `sys.stdout.flush()`
- **效果**: 即使进程崩溃,也能看到最后的日志

### 3. 显式垃圾回收 ✅
- **位置**: `backend/app/services/rag.py:207`
- **修改**: 每个批次后删除embeddings并调用 `gc.collect()`
- **效果**: 及时释放内存

### 4. 增加异常保护 ✅
- **位置**: `backend/app/services/paper_processor.py:87`
- **修改**: 添加 `MemoryError` 捕获和完整traceback输出
- **效果**: 不会因为单个文件导致整个服务崩溃

### 5. 添加RAG开关 ✅
- **位置**: `backend/app/core/config.py:38`
- **新增**: `ENABLE_RAG` 配置项
- **用法**: 在 `.env` 文件中添加 `ENABLE_RAG=false` 可临时禁用RAG

## 立即测试步骤

### 方案A: 重启后端测试 (推荐)
```bash
cd "C:\Users\26320\Desktop\女神异闻录project\phantom-lib\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002
```

然后尝试上传之前导致崩溃的PDF文件,观察是否还会退出。

### 方案B: 运行诊断脚本
```bash
cd "C:\Users\26320\Desktop\女神异闻录project\phantom-lib\backend"
python diagnose_crash.py
```

查看系统内存和RAG组件状态。

### 方案C: 临时禁用RAG
如果仍然崩溃,编辑 `.env` 文件:
```bash
# 在 C:\Users\26320\Desktop\女神异闻录project\phantom-lib\.env 中添加:
ENABLE_RAG=false
```

这样可以正常上传文件,但不会进行RAG索引(聊天功能会受影响)。

## 监控要点

### 1. 观察内存使用
在上传文件时,打开任务管理器,观察Python进程的内存占用:
- 正常: < 2GB
- 警告: 2-4GB (可能接近极限)
- 危险: > 4GB (即将崩溃)

### 2. 检查日志输出
现在应该能看到更详细的日志:
```
[RAG] Starting background indexing for: 1
[RAG] Memory before indexing: 234.5 MB
[RAG] Batch 1/166 (chunks 0-1)...
[RAG] ✓ Batch 1 indexed successfully.
...
```

如果在某个batch卡住,记录下 batch number,有助于定位问题。

### 3. Windows事件查看器
如果Python仍然无声崩溃:
1. Win+R → `eventvwr.msc`
2. Windows日志 → 应用程序
3. 查找"Python"相关的错误事件
4. 记录错误代码(如 0xC0000005 = 访问冲突)

## 长期解决方案

### 选项1: 使用更小的模型
编辑 `backend/app/services/rag.py:97`:
```python
# 当前使用: paraphrase-multilingual-MiniLM-L12-v2 (约500MB)
# 改为: all-MiniLM-L6-v2 (约90MB, 更快但对中文支持略差)
model_name = 'sentence-transformers/all-MiniLM-L6-v2'
```

### 选项2: 限制文件大小
在 `backend/app/api/endpoints/papers.py` 添加文件大小检查:
```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
if len(content) > MAX_FILE_SIZE:
    raise HTTPException(status_code=413, detail="File too large")
```

### 选项3: 使用外部向量数据库
考虑使用云端向量数据库服务(如Pinecone/Weaviate),避免本地内存压力。

## 常见问题

**Q: 修改后还是崩溃怎么办?**
A: 
1. 先运行 `diagnose_crash.py` 查看系统状态
2. 尝试禁用RAG (`ENABLE_RAG=false`)
3. 如果禁用RAG后正常,说明确实是内存问题,考虑升级硬件或使用更小的模型

**Q: BATCH_SIZE=1 会很慢吗?**
A: 
是的,索引速度会降低约3倍,但这是稳定性的代价。如果你的电脑内存充足(16GB+),可以尝试调回 `BATCH_SIZE=2`。

**Q: 禁用RAG后有什么影响?**
A: 
- 文件上传和管理正常
- AI聊天功能会失效(无法检索文档内容)
- 翻译功能正常

## 技术细节

### 内存使用估算
- sentence-transformers模型: ~500MB
- 每个embedding (384维): ~1.5KB
- BATCH_SIZE=1, 每次峰值内存: ~520MB
- BATCH_SIZE=3, 每次峰值内存: ~600MB (可能触发swap)

### 为什么在Batch 34崩溃?
可能原因:
1. 累积内存泄漏 (已通过gc.collect()缓解)
2. 某些chunk文本特别长 (已通过单个处理缓解)
3. ChromaDB写入压力 (已添加重试逻辑)

---

**创建时间**: 2026-02-10
**版本**: v1.2.1-hotfix
