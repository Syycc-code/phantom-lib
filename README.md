# 🎩 Phantom Library V2.7 (Phantom-Lib)

> *"The world is not as it should be. It's time to reform the academic distortions."*

**Phantom Library** is a hyper-stylized, immersive Reference Management System inspired by the UI aesthetics of **Persona 5**. It transforms the mundane task of managing academic papers into a **tactical heist of knowledge**.

Unlike traditional tools, Phantom Library possesses **"Cognitive Awareness"** — it reads your papers, remembers them, and can search the global internet to answer your questions.

![License](https://img.shields.io/badge/license-MIT-red) ![Status](https://img.shields.io/badge/status-Infiltration_Active-black) ![AI](https://img.shields.io/badge/AI-DeepSeek_V3-blue)

---

## 🚀 Key Features (Cognitive Abilities)

### 🏪 Shadow Market (Black Market) **[NEW!]**
Trade your accumulated "Phantom Stats" for rare UI customizations.
*   **Theme Store**: Switch between **Phantom Red** (P5), **Royal Gold** (P5R), **Velvet Blue** (P3), and **Midnight Yellow** (P4).
*   **System Upgrades**: Purchase **Audio Visualizers**, **Threat Radars**, and **Hacker Terminals**.
*   **Sacrifice System**: Spending stats permanently reduces your attributes. Choose wisely.

### 🌐 Cognitive Translation (Split View) **[NEW!]**
A revolutionary way to digest foreign papers.
*   **Dual Sync**: Scroll the PDF, and the translation scrolls with you. Scroll the translation, and the PDF follows.
*   **Eager Decryption**: The system proactively translates the entire document in the background while you read.
*   **Neon Highlighting**: Select text in the PDF to instantly ignite the corresponding translated paragraph with a neon glow.

### 🧠 Mind Hack (RAG + Web Search)
*   **Cognitive Chat (Phantom IM)**: Talk to "Navi". Now features **SNS Style** and **Retro Terminal** skins.
*   **Local Memory**: The system indexes every PDF. It cites specific pages and paragraphs.
*   **Global Network Search**: Hacks into the public internet (DuckDuckGo) when local intel is insufficient.

### 📊 Tactical Support (System Monitor)
*   **Real-time HUD**: Displays AI Latency, OCR Speed, and System State.
*   **Audio Visualizer**: Visualize the rhythm of the metaverse (requires Shop unlock).
*   **Threat Radar**: Detects network anomalies via a rotating radar scan (requires Shop unlock).

### 👁️ Activate Third Eye (Turbo OCR)
*   **Rapid Scanning**: Uses `RapidOCR` + `PyMuPDF` to instantly digitize scanned PDFs.
*   **Intelligent Tagging**: Automatically detects paper domains.
*   **Truth Reveal**: Analyzes the "Shadow" (Problem), "Persona" (Solution), and "Weakness" (Flaw).

---

## 🛠️ Tech Stack (The Toolset)

*   **Frontend**: React 19 + TypeScript + Vite + Tailwind v4 + Framer Motion
*   **Backend**: Python FastAPI (Async with `asyncio` threading)
*   **AI Core**: DeepSeek API (`deepseek-chat`) + `duckduckgo-search`
*   **Memory**: ChromaDB (Vector Database) + `sentence-transformers`
*   **Vision**: RapidOCR (OnnxRuntime) + `PyMuPDF` (fitz)

---

## 🕹️ Quick Start (Begin Heist)

### Prerequisites
*   **Python 3.10+**
*   **Node.js 18+**
*   **DeepSeek API Key** (Get one at [platform.deepseek.com](https://platform.deepseek.com))

### 1. Configure Secrets
Create a `.env` file in the root `phantom-lib/` directory:
```ini
DEEPSEEK_API_KEY=sk-your-key-here
# Optional: Set to 'mock-key' to run in simulation mode (offline)
```

### 2. Launch the Palace (Windows)
Simply double-click **`start_phantom.bat`**.
*   It automatically installs Python dependencies.
*   It launches the Backend (Brain) on port 8000.
*   It launches the Frontend (Face) on port 5173.

### 3. Manual Launch (Linux/Mac)
**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**Frontend:**
```bash
npm install
npm run dev
```

---

## ⚠️ Cognitive Notes

*   **Performance**: To speed up OCR, ensure you have `onnxruntime-gpu` installed if you have an NVIDIA GPU. Otherwise, the system defaults to CPU mode.
*   **Privacy**: Your PDFs are processed locally. Only text snippets (for RAG) and queries are sent to DeepSeek/OpenAI compatible APIs.
*   **Theme Engine**: If themes don't apply immediately, restart the frontend (`npm run dev`) to trigger Tailwind's JIT compiler.

---

> *"Wake up, Get up, Get out there."*
