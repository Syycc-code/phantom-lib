# 🎩 Phantom Library (Phantom-Lib)

> *"The world is not as it should be. It's time to reform the academic distortions."*

**Phantom Library** is a hyper-stylized, immersive Reference Management System inspired by the UI aesthetics of **Persona 5**. It transforms the mundane task of managing academic papers into a tactical heist of knowledge.

![License](https://img.shields.io/badge/license-MIT-red) ![Status](https://img.shields.io/badge/status-Infiltration_Active-black)

---

## 🚀 Features (Cognitive Abilities)

### 🧠 Mind Hack (Contextual AI)
- **Select-to-Analyze**: Highlight ANY text inside a PDF or document.
- **Phantom Menu**: A jagged menu appears instantly above your selection.
- **Decipher**: DeepSeek AI analyzes the "subtext", "metaphors", and "hidden intent" of the selected text (Chinese output).
- **Translate**: Instantly translates complex academic jargon into human-readable Chinese.
- **Draggable Window**: Analysis results appear in a floating, scrollable window that you can move aside to keep reading.

### 👁️ Activate Third Eye (Auto-Tagging)
- **Intelligent Tagging**: Automatically scans paper titles and abstracts to detect domains (CV, NLP, RL, NetSec).
- **Truth Reveal**: Analyzes the "Shadow" (Problem), "Persona" (Solution), and "Weakness" (Flaw) of any paper.

### 📜 Immersive Reader (Infinite Scroll)
- **Native PDF Engine**: Renders uploaded PDFs directly in the app using `react-pdf`.
- **Infinite Scroll**: Read long papers seamlessly without clicking "Next Page".
- **Text Layer**: Full text selection support, enabling the "Mind Hack" on standard PDFs.

### 🎭 Infiltration Protocol
- **Bulk Upload**: Infiltrate local PDFs (`.pdf`) or cognitive data (`.txt`, `.md`, `.json`) directly.
- **Safe Rooms**: Organize your intel into custom Folders (Missions).
- **Burn Evidence**: Delete unwanted papers or folders with a click.

---

## 🛠️ Tech Stack (The Toolset)

- **Frontend**: React 19 + TypeScript + Vite + Tailwind v4
- **Visuals**: Framer Motion (Spring Physics) + Custom P5 Fonts
- **PDF Engine**: React-PDF (Mozilla PDF.js)
- **Backend**: Python FastAPI (Handles DeepSeek API calls)
- **Persistence**: `localStorage` (Metadata) + Blob URLs (Session Files)

---

## 🕹️ Quick Start (Begin Heist)

### Option A: The Ignition Key (Windows One-Click)
1.  Locate `start_phantom.bat` in the root folder.
2.  **Double-click it**.
3.  The system will launch both the Brain (Backend) and the Face (Frontend) automatically.

### Option B: Manual Infiltration

1.  **Start the Brain (Backend):**
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```

2.  **Start the Face (Frontend):**
    ```bash
    # Open a new terminal
    npm install
    npm run dev
    ```

3.  **Access the Palace:**
    Navigate to `http://localhost:5173`.

---

## ⚠️ Cognitive Notes

-   **DeepSeek Key**: To enable real AI analysis, create a `.env` file in `phantom-lib/` with `DEEPSEEK_API_KEY=your_key_here`. If missing, the system uses a built-in simulation mode.
-   **File Persistence**: Due to browser security, **PDF files uploaded via Bulk Import will disappear if you refresh the page**. Only the metadata (titles, tags, notes) persists.

---

> *"Wake up, Get up, Get out there."*
