# Phantom Library V1.0

**Phantom Library** 是一个集成了 DeepSeek 大模型与 RAG（检索增强生成）技术的智能文献管理系统。它结合了现代化的 React 前端与高性能 FastAPI 后端，旨在为研究人员提供高效的论文阅读、管理与分析体验。

![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-green) ![AI](https://img.shields.io/badge/AI-DeepSeek_V3-blue)

---

## 🚀 核心功能

### 1. 智能文献管理
*   **多格式支持**：支持 PDF 文件本地上传及 Arxiv URL 直接导入。
*   **极速 OCR**：内置 RapidOCR 引擎，自动提取文档文本，支持扫描版 PDF。
*   **分类管理**：支持创建文件夹（Mission）对论文进行分类归档。

### 2. AI 辅助深度阅读
*   **智能摘要分析**：系统会自动阅读论文，并提取三大核心要素：
    *   **问题 (Problem)**：论文试图解决的核心痛点。
    *   **方案 (Solution)**：论文提出的方法或框架。
    *   **不足 (Weakness)**：当前方法的局限性或未来方向。
*   **沉浸式双屏阅读**：左侧阅读原文，右侧实时笔记与翻译。
*   **划词翻译**：在 PDF 中选中任意文本，即可获取基于上下文的精准翻译。

### 3. 全局知识库问答 (RAG)
*   **AI 助手**：内置智能对话助手，可回答关于文献库中任何论文的问题。
*   **全文检索**：基于 ChromaDB 向量数据库，系统能理解你的所有论文内容，提供跨文档的知识检索。
*   **联网搜索**：当本地知识不足时，系统可自动调用网络搜索补充信息。

### 4. 知识图谱可视化
*   **3D 关联网络**：将文献库可视化为 3D 节点网络。
*   **自动关联**：系统会根据论文的标签、内容相似度自动建立连接，帮助发现文献间的潜在联系。

### 5. 个性化体验
*   **主题切换**：内置多种 UI 风格主题（如标准红、皇室金、极客绿等）。
*   **系统监控**：实时显示 AI 响应延迟、OCR 处理速度等系统指标。

---

## 🛠️ 技术架构

*   **前端**：React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion
*   **后端**：Python FastAPI (Async), SQLModel (SQLite)
*   **AI/NLP**：DeepSeek API, Sentence-Transformers
*   **数据库**：ChromaDB (向量存储), SQLite (元数据)
*   **处理引擎**：RapidOCR, PyMuPDF

---

## 💻 快速开始

### 环境要求
*   **Python 3.10+**
*   **Node.js 18+**
*   **DeepSeek API Key** (需在 [deepseek.com](https://platform.deepseek.com) 申请)

### 1. 配置密钥
在项目根目录 `phantom-lib/` 下创建 `.env` 文件：
```ini
DEEPSEEK_API_KEY=sk-your-key-here
# 如需离线测试，可设置为 'mock-key'
```

### 2. 启动系统 (Windows)
直接双击运行根目录下的 **`start_phantom.bat`** 脚本。
*   自动启动后端服务 (Port 8000)
*   自动启动前端界面 (Port 5173)

### 3. 手动启动 (Linux/Mac)

**后端启动：**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**前端启动：**
```bash
npm install
npm run dev
```

访问地址：http://localhost:5173

---

## 📖 使用指南

1.  **导入论文**：点击左上角的 `+` 按钮或 `Infiltrate` 菜单，选择本地 PDF 或输入 Arxiv 链接。
2.  **阅读模式**：点击任意论文卡片进入阅读器。使用鼠标选中文本可触发翻译工具栏。
3.  **AI 分析**：在阅读界面点击 `Analysis` (眼睛图标) 触发深度分析。
4.  **知识图谱**：按 `Tab` 键或点击侧边栏 `Mind Palace` 按钮进入 3D 视图。
5.  **查看帮助**：点击左侧边栏底部的 `Guidebook` 查看详细操作说明。

---

## ⚠️ 常见问题

*   **白屏或无法加载**：请检查后端服务窗口是否报错，确保端口 8000 未被占用。
*   **AI 无响应**：请检查 `.env` 中的 API Key 是否正确，以及网络连接是否通畅。
*   **OCR 速度慢**：推荐安装 `onnxruntime-gpu` 以利用 NVIDIA 显卡加速处理。

---

**License**: MIT | **Version**: 1.0.0
