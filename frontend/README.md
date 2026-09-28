# BhashaRAG — Multilingual Indic Document Q&A Platform

> Grounded multilingual document Q&A interface for Indian policy, government schemes, and research PDFs. Ask in **English**, **Hindi (Devanagari)**, or **Hinglish** with page-level citations and synthesized Indic voice responses.

---

## 🌟 Key Features

- **Multilingual questions**: ask in English, Hindi (Devanagari), or Hinglish (validated languages; the embedding model covers 50+ languages, but other Indian languages are not yet benchmarked).
- **Grounded Page Citations**: Precision source attribution chips with document name and page number (`📄 doc.pdf · p.4`).
- **Spoken Voice Output**: optional audio player with speed controls (`1.0x` to `2.0x`); the voice language can be any of 11 Sarvam AI languages (`hi-IN`, `en-IN`, `bn-IN`, `ta-IN`, `te-IN`, `mr-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `od-IN`).
- **Unified Query Composer**: per-question toggles for **Query Expansion** (alternate phrasings and translations), **Reranking** (cross-encoder), and **Voice**.
- **Knowledge Repository**: Drag-and-drop PDF ingestion, live document list, and one-click embedding indexing.
- **Enterprise UI Design**: Classy obsidian palette, dark/light mode toggle, and responsive mobile drawer.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Custom Typography (`Inter` + `Noto Sans Devanagari`)
- **Icons**: Lucide React
- **Markdown**: React Markdown

---

## 🚀 Getting Started

### 1. Start the backend
See `../backend/README.md` (`python src/api.py`, port 8000).

### 2. Install dependencies (from this `frontend/` folder)
```bash
npm install
```

### 3. Configure Backend URL
Copy `.env.example` to `.env` (Windows: `copy .env.example .env`):
```bash
cp .env.example .env
```
Ensure `VITE_API_BASE_URL` points to your backend:
```ini
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Run development server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 5. Build for production
```bash
npm run build
```

---

## 📡 Backend API Integration

The frontend connects directly to the following endpoints:

| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Backend connectivity check |
| `/api/documents` | `GET` | Fetches uploaded PDF document list |
| `/api/upload` | `POST` | Multipart upload for multiple PDFs (`files`) |
| `/api/index?reset=true` | `POST` | Generates document embeddings & updates knowledge base |
| `/api/query` | `POST` | Sends question with expansion, reranking & TTS parameters |

---

## 📄 License
MIT License
