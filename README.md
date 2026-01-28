# 🎩 Phantom Library V2.8 (女神异闻录文献管理系统) 

> *"这个世界本不该如此。是时候改写学术的歪曲了。"*

**Phantom Library** 是一个基于《女神异闻录5》UI美学打造的超风格化、沉浸式文献管理系统，它将管理学术论文的平凡任务转变为一场**知识的盗梦**。

与传统工具不同，Phantom Library 拥有**"认知感知"** — 它会阅读您的论文、记住它们，并能搜索全球互联网来回答您的问题。

![License](https://img.shields.io/badge/license-MIT-red) ![Status](https://img.shields.io/badge/status-入侵进行中-black) ![AI](https://img.shields.io/badge/AI-DeepSeek_V3-blue)

---

## 🚀 核心功能（认知能力）

### 🃏 思维殿堂（塔罗牌网络）**[重磅更新!]**
将您的知识网络可视化为大阿卡纳塔罗牌阵列。
*   **愚者核心**：中央固定的 "0. The Fool" 卡牌代表您自己（无限可能）。
*   **论文卡牌化**：每篇论文自动分配一张不重复的塔罗牌（从 I. The Magician 到 XXI. The World）。
*   **羁绊连线**：
    *   强羁绊（红色实线）：两篇论文有相同 Tag 时自动产生强烈连接。
    *   弱羁绊（灰色虚线）：所有知识都与中央"愚者"相连。
*   **物理交互**：卡牌会在力的作用下自然漂浮、排斥和吸引。

### 🏪 黑暗市场（系统商店）
用您积累的 "Phantom Stats" 交易稀有 UI 定制。
*   **主题商城**：在 **Persona 红**、**皇家金**、**天鹅绒蓝** 和 **午夜黄** 之间切换。
*   **系统升级**：购买 **音频可视化器**、**威胁雷达** 和 **黑客终端** 皮肤。
*   **献祭系统**：永久消耗属性来获得力量。请明智选择。

### 🌐 认知翻译（分屏视图）
一种革命性的外文论文消化方式。
*   **双轴同步**：滚动 PDF，翻译条同步跟随。滚动翻译，PDF 随之移动。
*   **主动解密**：系统在您阅读时，后台主动翻译整个文档。
*   **霓虹高亮**：在 PDF 中选择文本，立即点燃对应翻译段落，发出霓虹光效。

### 🧠 思想入侵（RAG + 全网搜索）
*   **认知聊天（Phantom IM）**：与 "Navi" 对话。现支持 **SNS 风格** 和 **复古终端** 皮肤。
*   **本地记忆**：系统自动索引每篇 PDF。可引用特定页面和段落。
*   **全球网络搜索**：当本地情报不足时，侵入公共互联网。

### 📊 战术支援（系统监控）
*   **实时 HUD**：显示 AI 延迟、OCR 速度和系统状态。
*   **音频可视化器**：将元宇宙的节奏可视化（需商店解锁）。
*   **威胁雷达**：通过旋转雷达扫描检测网络异常（需商店解锁）。

### 👁️ 启动第三只眼（极速 OCR）
*   **快速扫描**：使用 `RapidOCR` + `PyMuPDF` 即时数字化扫描 PDF。
*   **智能标签**：自动检测论文领域。
*   **真相揭露**：分析 "Shadow"（问题）、"Persona"（解决方案）和 "Weakness"（缺陷）。

---

## 🛠️ 技术栈（盗梦工具箱）

*   **前端**：React 19 + TypeScript + Vite + Tailwind v4 + Framer Motion
*   **后端**：Python FastAPI（Async with `asyncio` 多线程）
*   **AI 核心**：DeepSeek API (`deepseek-chat`) + `duckduckgo-search`
*   **记忆**：ChromaDB（向量数据库）+ `sentence-transformers`
*   **视觉**：RapidOCR（OnnxRuntime）+ `PyMuPDF`（fitz）

---

## 🕹️ 快速开始（潜入认知殿堂）

### 环境要求
*   **Python 3.10+**
*   **Node.js 18+**
*   **DeepSeek API Key**（在 [platform.deepseek.com](https://platform.deepseek.com) 获取）

### 1. 配置密钥
在 `phantom-lib/` 根目录创建 `.env` 文件：
```ini
DEEPSEEK_API_KEY=sk-your-key-here
# 可选：设为 'mock-key' 以模拟模式运行（离线）
```

### 2. 启动殿堂（Windows）
双击 **`start_phantom.bat`** 即可。
*   自动安装 Python 依赖
*   在端口 8000 启动后端（大脑）
*   在端口 5173 启动前端（界面）

### 3. 手动启动（Linux/Mac）
**后端：**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**前端：**
```bash
npm install
npm run dev
```

---

## ⚠️ 认知笔记

*   **性能优化**：若您拥有 NVIDIA GPU，请安装 `onnxruntime-gpu` 加速 OCR。否则系统默认使用 CPU 模式。
*   **隐私保护**：您的 PDF 在本地处理。仅将文本片段（用于 RAG）和查询发送给 DeepSeek/OpenAI 兼容的 API。
*   **主题引擎**：如果主题未能立即应用，请重启前端（`npm run dev`）以触发 Tailwind 的即时编译。

---

## 🎮 操作指南

| 功能 | 快捷键/操作 |
|------|---------------|
| 打开思维殿堂 | `Tab` 键 |
| 进入商店 | 点击左下角 **SHOP** 图标 |
| 上传论文 | 点击左上角 **+** 按钮 |
| 开始聊天 | 点击右下角手机图标 |
| AI 分析 | 选中论文后点击 **THIRD EYE** |

---

## 🔧 常见问题解决

### Q: 白屏/页面空白？
**A**: 检查浏览器控制台（F12）是否有错误。可能是：
1. 前端未正确启动
2. TypeScript 编译错误
3. 后端 API 连接失败

### Q: RAG 功能无法使用？
**A**: 确保：
1. 安装了完整依赖：`pip install chromadb sentence-transformers`
2. CPU 版 PyTorch 已正确安装
3. 没有使用 `--reload` 参数启动后端

### Q: 上传文件失败？
**A**: 检查：
1. 文件格式是否为 PDF
2. 文件大小是否过大（建议 < 50MB）
3. 后端控制台是否有错误信息

---

> *"醒来，起来，走出那里。"*

**License**: MIT | **Version**: 2.8 | **Made with ❤️ by Phantom Thieves**