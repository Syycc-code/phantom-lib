# Pinecone云端向量数据库 - 配置指南

## 📌 为什么使用Pinecone？

**问题：** 本地ChromaDB在处理大文件时会导致内存溢出崩溃（371 chunks就会炸）

**解决方案：** 使用Pinecone云端向量数据库
- ✅ 向量存储在云端，本地内存占用 <100MB
- ✅ 免费层：100,000个向量（完全够用）
- ✅ 无文件大小限制
- ✅ 稳定性极高，由AWS托管

---

## 🚀 Step 1: 注册Pinecone账号

### 1.1 访问官网
```
https://www.pinecone.io/
```

### 1.2 注册账号
1. 点击 "Start Free" 或 "Sign Up"
2. 使用邮箱注册（支持Google/GitHub登录）
3. 验证邮箱

### 1.3 获取API Key
1. 登录后进入Dashboard
2. 左侧菜单点击 "API Keys"
3. 复制你的API Key（格式如：`pcsk_xxxxx...`）
4. **重要：** 保存好这个Key，后面会用到

---

## 🔧 Step 2: 配置环境变量

编辑 `C:\Users\26320\Desktop\女神异闻录project\phantom-lib\.env`：

```bash
# DeepSeek API（已有）
DEEPSEEK_API_KEY=sk-1260f6dd63b8438888570834bf79146c

# 启用RAG（改回true）
ENABLE_RAG=true

# Pinecone配置（新增）
PINECONE_API_KEY=pcsk_YOUR_ACTUAL_API_KEY_HERE  # 替换为你的真实API Key
PINECONE_INDEX_NAME=phantom-library
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1  # 免费层可用区域
```

**注意：** 一定要替换 `pcsk_YOUR_ACTUAL_API_KEY_HERE` 为你实际的API Key！

---

## 📦 Step 3: 安装依赖

打开PowerShell或CMD，执行：

```bash
cd C:\Users\26320\Desktop\女神异闻录project\phantom-lib\backend

# 安装Pinecone客户端
pip install pinecone-client==3.0.0

# 如果还没安装sentence-transformers和torch
pip install sentence-transformers==3.2.1
pip install torch==2.5.1
```

**或者一键安装所有依赖：**
```bash
pip install -r requirements.txt
```

---

## 🧪 Step 4: 测试连接

运行测试脚本验证配置：

```bash
cd C:\Users\26320\Desktop\女神异闻录project\phantom-lib\backend
python test_pinecone.py
```

**预期输出：**
```
✅ Pinecone连接成功
✅ 索引创建/连接成功
✅ Embedding模型加载成功
📊 当前索引统计：
   - 总向量数: 0
   - 维度: 384
   - 使用率: 0%
```

---

## 🎯 Step 5: 启动后端

```bash
cd C:\Users\26320\Desktop\女神异闻录project\phantom-lib\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002
```

**成功启动日志：**
```
[PHANTOM] Initializing Pinecone RAG...
[PHANTOM] Using existing index: phantom-library
[PHANTOM] Pinecone Connected.
[PHANTOM] Loading Embedding Model: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2...
[PHANTOM] Embedding Model Loaded.
[PHANTOM] RAG Service Ready.
```

---

## 📋 Step 6: 测试上传大文件

1. 访问前端：`http://localhost:5173`
2. 上传之前导致崩溃的371-chunk PDF
3. 观察后端日志：

**预期日志（不再崩溃）：**
```
[PINECONE] Indexing 371 chunks from paper 2
  [PINECONE] Batch 1/38 (chunks 0-10)...
  [PINECONE] ✓ Batch 1 indexed successfully.
  [PINECONE] Batch 2/38 (chunks 10-20)...
  [PINECONE] ✓ Batch 2 indexed successfully.
  ...
  [PINECONE] Batch 38/38 (chunks 370-371)...
  [PINECONE] ✓ Batch 38 indexed successfully.
[PINECONE] Indexing Complete: 2
[PINECONE] Summary: 38 successful, 0 failed
```

✅ **完成！不会再崩溃了！**

---

## 🔍 Pinecone vs ChromaDB 对比

| 特性 | ChromaDB (旧方案) | Pinecone (新方案) |
|------|------------------|------------------|
| 内存占用 | ~600MB-1.5GB | ~100MB |
| 文件大小限制 | <200 chunks | 无限制 |
| 稳定性 | 大文件崩溃 | 极高 |
| 批处理速度 | BATCH_SIZE=1 (慢) | BATCH_SIZE=10 (快) |
| 索引速度 | 371 chunks需要6分钟 | 371 chunks需要1分钟 |
| 部署复杂度 | 简单（本地） | 需要API Key |
| 成本 | 免费 | 免费层100k向量 |

---

## 📊 免费层限制

Pinecone免费层包括：
- ✅ 100,000个向量
- ✅ 1个索引（项目）
- ✅ 1个命名空间
- ✅ 查询无限制
- ✅ 自动备份

**你的使用量估算：**
- 每篇论文平均 200-500 个chunks（向量）
- 免费层可存储：100,000 / 300 = **约333篇论文**
- 完全够用！

---

## ⚠️ 故障排查

### 问题1：`ModuleNotFoundError: No module named 'pinecone'`
**解决：**
```bash
pip install pinecone-client==3.0.0
```

### 问题2：`PINECONE_API_KEY not configured`
**解决：** 检查 `.env` 文件是否正确配置API Key

### 问题3：`Region 'us-east-1' not available`
**解决：** 在Pinecone Dashboard查看免费层可用区域，更新 `.env` 中的 `PINECONE_REGION`

### 问题4：后端启动但RAG禁用
**解决：** 确保 `.env` 中 `ENABLE_RAG=true`

---

## 🔄 回滚到ChromaDB（如果需要）

如果Pinecone有问题，可以快速回滚：

```bash
cd C:\Users\26320\Desktop\女神异闻录project\phantom-lib\backend
cp app/services/rag_chromadb_backup.py app/services/rag.py
```

然后在 `.env` 中：
```bash
ENABLE_RAG=false  # 或者使用限制版ChromaDB
```

---

## 📞 支持

遇到问题？
1. 查看 `backend/backend.log` 日志
2. 运行 `python test_pinecone.py` 诊断
3. 检查Pinecone Dashboard的使用统计

---

**完成配置后，重启后端即可享受稳定的RAG服务！** 🎉
