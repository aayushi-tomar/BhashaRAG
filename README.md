# BhashaRAG — full project (backend + frontend)

    BhashaRAG-Project/
    ├── backend/    Python: RAG pipeline + REST API (FastAPI)
    └── frontend/   React + Vite + Tailwind web app

## Run it (Windows, two terminals)

### Terminal 1 — backend
    cd backend
    python -m pip install -r requirements.txt
    copy .env.example .env          (then put your GEMINI_API_KEY in .env)
    python src/api.py               (API on http://localhost:8000, docs at /docs)

Free Gemini key (no card): https://aistudio.google.com/apikey
The first indexing run downloads the embedding model (a few minutes).

### Terminal 2 — frontend
    cd frontend
    npm install
    copy .env.example .env
    npm run dev                     (open http://localhost:5173)

### Use it
1. Open http://localhost:5173 — header should say "Engine Active".
2. Upload a PDF in the sidebar, click "Index Knowledge Base", wait.
3. Ask a question in English, Hindi or Hinglish.

## Command-line alternative (no frontend)
A sample PDF is included in backend/data/pdfs for a first test.

    cd backend
    python src/ingest.py --reset
    python src/query.py --question "What is the minimum age to apply?"

## Evaluation for the report
    cd backend
    python eval/make_test_set.py --n 18          (builds questions from your indexed PDFs; review them)
    python eval/evaluate.py --k 5 --skip_generation

See backend/README.md and frontend/README.md for details.
