# BhashaRAG backend — multilingual RAG for Indian documents

Ask questions in English, Hindi or Hinglish over PDFs. Pipeline: overlapping
chunks -> multilingual embeddings (ChromaDB) + BM25 -> Reciprocal Rank Fusion
-> cross-encoder reranking -> query expansion -> Gemini grounded answer with
page citations -> optional Sarvam AI voice.

## Setup
    python -m pip install -r requirements.txt
    copy .env.example .env      (add GEMINI_API_KEY; SARVAM_API_KEY is optional)

Free Gemini key (no credit card): https://aistudio.google.com/apikey
The first indexing run downloads two models (embeddings + reranker) — a few minutes.

## Start the API (used by the React frontend)
    python src/api.py           -> http://localhost:8000   (interactive docs: /docs)

Endpoints: GET /api/health · GET /api/documents · POST /api/upload ·
POST /api/index?reset=true · POST /api/query

## Or use the command line
A sample PDF (data/pdfs/Sample_Scheme_Guidelines.pdf) is included for a quick test.

    python src/ingest.py --reset
    python src/query.py --question "What is the minimum age to apply?"
    python src/query.py --question "आवेदन के लिए कौन से दस्तावेज़ चाहिए?"
    python src/query.py --question "Scheme me kitne rupaye milte hain?"

Flags: --no-expansion, --no-rerank

## Evaluation (ablation study for the report)
    python eval/make_test_set.py --n 18     # builds eval/test_set.json from YOUR indexed PDFs
    (open eval/test_set.json and delete/fix weak questions)
    python eval/evaluate.py --k 5 --skip_generation    # retrieval metrics only, fast
    python eval/evaluate.py --k 5                      # + faithfulness (uses more Gemini calls)

Compares: A dense only · B + BM25 · C + reranking · D + query expansion.
The test_set.json that ships with the project matches the included sample PDF
and is only for checking that the scripts run — use make_test_set.py on your
real documents for the numbers you put in the report.

## Layout
    src/config.py          models, paths, tunable constants
    src/ingest.py          PDF -> chunks -> embeddings + BM25 index
    src/retrieve.py        dense + BM25 + RRF + reranker
    src/query_expansion.py multi-query expansion
    src/llm.py             Gemini wrapper (the only LLM-specific file)
    src/query.py           CLI
    src/api.py             REST API for the frontend
    src/tts.py             Sarvam AI voice output
    src/app.py             optional Gradio UI (pip install gradio)
    eval/                  make_test_set.py, evaluate.py, test_set.json

No model is trained from scratch: pretrained embedding and reranker models plus
the Gemini LLM, with the engineering effort in the retrieval/grounding pipeline.
