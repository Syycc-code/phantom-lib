# 🎩 Phantom Library V2.0 (Phantom-Lib)

> *"The world is not as it should be. It's time to reform the academic distortions."*

**Phantom Library** is a hyper-stylized, immersive Reference Management System inspired by the UI aesthetics of **Persona 5**. It transforms the mundane task of managing academic papers into a **tactical heist of knowledge**.

Unlike traditional tools, Phantom Library possesses **"Cognitive Awareness"** — it reads your papers, remembers them, and can search the global internet to answer your questions.

![License](https://img.shields.io/badge/license-MIT-red) ![Status](https://img.shields.io/badge/status-Infiltration_Active-black) ![AI](https://img.shields.io/badge/AI-DeepSeek_V3-blue)

---

## 🚀 Key Features (Cognitive Abilities)

### 🧠 Mind Hack (RAG + Web Search)
*   **Cognitive Chat**: Talk to "Navi" (The System AI). Ask questions about your papers.
*   **Local Memory (RAG)**: The system indexes every PDF you upload. It can cite specific pages and paragraphs from your local library.
*   **Global Network Search**: If the local database lacks answers, the system automatically hacks into the public internet (DuckDuckGo) to retrieve the latest intel.
*   **DeepSeek-V3 Integration**: Powered by the cutting-edge DeepSeek V3 model for nuanced, context-aware reasoning.

### 📊 Tactical Support (System Monitor)
*   **Real-time HUD**: A draggable, transparent "hacker" panel displays system vitals.
*   **Latency Tracking**: Monitors AI response time (Latency) and OCR processing speed.
*   **Visual Feedback**: Watch the system state shift from `IDLE` to `THINKING` or `SEARCHING` with dynamic animations.

### 👁️ Activate Third Eye (Turbo OCR)
*   **Rapid Scanning**: Uses `RapidOCR` + `PyMuPDF` to instantly digitize scanned PDFs.
*   **Intelligent Tagging**: Automatically detects paper domains (CV, NLP, RL, NetSec).
*   **Truth Reveal**: Analyzes the "Shadow" (Problem), "Persona" (Solution), and "Weakness" (Flaw) of any paper.

### 🎨 Phantom Aesthetic (Juicy UI)
*   **Kinetic UI**: Menus slam open, cards tilt and distort on hover (`skewX`), and interactions have "weight".
*   **Immersive Reader**: Integrated PDF reader with infinite scroll and dark mode compatibility.
*   **Sound Effects**: Satisfying SFX for every click, select, and level up.

---

## 🛠️ Tech Stack (The Toolset)

*   **Frontend**: React 19 + TypeScript + Vite + Tailwind v4 + Framer Motion
*   **Backend**: Python FastAPI (Async)
*   **AI Core**: DeepSeek API (`deepseek-chat`) + `duckduckgo-search`
*   **Memory**: ChromaDB (Vector Database) + `sentence-transformers`
*   **Vision**: RapidOCR (OnnxRuntime)

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
python -m uvicorn main:app --reload
```

**Frontend:**
```bash
npm install
npm run dev
```

---

## ⚠️ Cognitive Notes

*   **Initial Boot**: The first time you run the backend, it will download the Embedding Model (~200MB) from HuggingFace (via mirror). This may take a minute.
*   **Performance**: To speed up OCR, ensure you have `onnxruntime-gpu` installed if you have an NVIDIA GPU.
*   **Privacy**: Your PDFs are processed locally. Only text snippets (for RAG) and queries are sent to DeepSeek/OpenAI compatible APIs.

---

> *"Wake up, Get up, Get out there."*
