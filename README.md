# 🎩 Phantom Library (Phantom-Lib)

> *"The world is not as it should be. It's time to reform the academic distortions."*

**Phantom Library** is a hyper-stylized, immersive Reference Management System inspired by the UI aesthetics of **Persona 5**. It transforms the mundane task of managing academic papers into a tactical heist of knowledge.

![License](https://img.shields.io/badge/license-MIT-red) ![Status](https://img.shields.io/badge/status-Infiltration_Active-black)

---

## 🚀 Features (Cognitive Abilities)

### 👁️ Activate Third Eye (AI Analysis)
- **Intelligent Tagging**: Automatically scans paper titles and abstracts to detect domains (CV, NLP, RL, NetSec).
- **Truth Reveal**: Analyzes the "Shadow" (Problem), "Persona" (Solution), and "Weakness" (Flaw) of any paper (Simulated AI).
- **Visuals**: Results appear as styled "Calling Cards".

### 🎭 Infiltration Protocol (Import & Manage)
- **Bulk Upload**: Infiltrate local PDFs directly into the browser.
- **Steal Heart**: Add papers via URL/DOI (Simulation).
- **Safe Rooms**: Organize your intel into custom Folders (Missions).
- **Burn Evidence**: Delete unwanted papers or folders with a click.

### 🎨 Immersive Reading Mode
- **Sliding Viewer**: Read papers in a full-screen, slide-up overlay.
- **Native PDF Support**: Renders uploaded PDFs directly within the P5-styled shell.

### 💾 Cognitive Persistence
- **Auto-Save**: All changes (Tags, Folders, Papers) are instantly anchored to `localStorage`. The Palace remembers everything even after a refresh.

---

## 🛠️ Tech Stack (The Toolset)

- **Core**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Custom Fonts (`Fjalla One`, `Inter`)
- **Animation**: Framer Motion (Spring Physics)
- **Icons**: Lucide React
- **Backend (Optional)**: Python FastAPI (Included in `backend/` folder for future expansion)

---

## 🕹️ Quick Start (Begin Heist)

1.  **Clone the Palace:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/phantom-lib.git
    cd phantom-lib
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start Infiltration (Dev Server):**
    ```bash
    npm run dev
    ```

4.  **Open the Metaverse:**
    Navigate to `http://localhost:5173`.

---

## 📂 Project Structure

```
phantom-lib/
├── src/
│   ├── App.tsx          # The Core Logic (Brain)
│   ├── index.css        # The Visual Style (Skin)
│   └── main.tsx         # Entry Point
├── backend/             # (Optional) Python Backend
│   ├── main.py          # FastAPI Router
│   └── models.py        # SQLModel Schemas
└── ...
```

---

## ⚠️ Notes

- **PDF Persistence**: Due to browser security protections on `localStorage`, raw PDF files (Blobs) uploaded via "Bulk Import" **will not persist after a page refresh**. Only metadata (titles, tags) is saved. For permanent file storage, the Python backend must be activated.
- **AI Simulation**: The current "Third Eye" uses regex-based heuristic analysis for immediate feedback. Real DeepSeek API integration code is available in the `backend/` folder.

---

> *"Wake up, Get up, Get out there."*
