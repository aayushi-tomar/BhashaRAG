# 🌏   BhashaRAG

### Multilingual Retrieval-Augmented Generation for Indian Documents

> **Ask questions in English, Hindi, or Hinglish — retrieve relevant
> information from documents across languages and get grounded answers
> with sources.**

BhashaRAG is a full-stack multilingual RAG platform for querying Indian
documents such as government schemes, policy documents, research
material, reports, and educational content.

The project addresses a practical problem: **the language used by a user
does not always match the language used by the document they need to
understand.**

For example, a user can ask a Hindi or Hinglish question about an
English PDF. BhashaRAG uses multilingual embeddings and a hybrid
retrieval pipeline to find relevant passages before Gemini generates the
final grounded response.

------------------------------------------------------------------------

## 🎯 Problem

A large amount of Indian public and institutional information is
distributed through PDFs. Conventional document-Q&A systems can struggle
when:

- the query and document use different languages
- users ask questions in Hindi or Hinglish
- exact names, numbers, or terminology matter
- semantic search alone retrieves noisy results
- generated answers need to be traceable to source documents

BhashaRAG addresses these problems by combining **multilingual
retrieval, lexical search, result fusion, reranking, and grounded
generation**.

------------------------------------------------------------------------

## 💡 Solution

Instead of sending a question directly to an LLM, BhashaRAG follows a
retrieval-first architecture:

``` text
User Question
      │
      ▼
Query Expansion
      │
      ├───────────────┐
      ▼               ▼
Dense Retrieval    BM25 Retrieval
      │               │
      └───────┬───────┘
              ▼
      Reciprocal Rank Fusion
              │
              ▼
      Cross-Encoder Reranking
              │
              ▼
       Relevant Context
              │
              ▼
          Gemini LLM
              │
              ▼
   Grounded Answer + Sources
              │
              ▼
        Optional TTS
```

The LLM is used for reasoning and response generation, while the
retrieval pipeline is responsible for finding the supporting evidence.

------------------------------------------------------------------------

# ✨ Key Features

## 🌐 Multilingual Question Answering

Ask questions in:

- English
- Hindi
- Hinglish

The multilingual embedding layer allows semantically related content to
be retrieved even when the query and document are written in different
languages.

### Example

**Document:** English government scheme PDF

**Question:**

> इस योजना के लिए पात्रता की क्या शर्तें हैं?

BhashaRAG can retrieve the relevant English passages and use them as
evidence for the generated response.

------------------------------------------------------------------------

## 🔄 Cross-Lingual Retrieval

| Document | Query    | Retrieval     |
|----------|----------|---------------|
| English  | Hindi    | Cross-lingual |
| English  | Hinglish | Cross-lingual |
| Hindi    | English  | Cross-lingual |
| Hindi    | Hindi    | Same-language |

The goal is to let users access information without requiring them to
communicate in the document’s original language.

------------------------------------------------------------------------

## 🔎 Hybrid Retrieval

BhashaRAG combines:

**Dense semantic retrieval** — captures meaning and semantic similarity.

**BM25 lexical retrieval** — captures exact terminology, names, numbers,
identifiers, and keywords.

The results are combined using **Reciprocal Rank Fusion (RRF)**.

``` text
Dense Retrieval ──┐
                  ├──► RRF ──► Candidate Set
BM25 Retrieval ───┘
```

------------------------------------------------------------------------

## 🎯 Cross-Encoder Reranking

Initial retrieval is designed to find a broad candidate set. A
cross-encoder then evaluates query–passage relevance more precisely
before generation.

``` text
Retrieved Candidates
        │
        ▼
Cross-Encoder
        │
        ▼
Relevant Passages
        │
        ▼
LLM Context
```

------------------------------------------------------------------------

## 🧠 Query Expansion

The original question can be expanded into alternative formulations
before retrieval.

Example:

``` text
Original:
What are the eligibility requirements?

Expanded:
- Who is eligible?
- What conditions must an applicant satisfy?
- What are the qualification criteria?
```

This helps when the user’s wording differs from the terminology used
inside the document.

------------------------------------------------------------------------

## 📚 PDF Knowledge Base

Users can upload PDF documents through the web interface.

``` text
PDF
 │
 ▼
Text Extraction
 │
 ▼
Chunking
 │
 ▼
Multilingual Embeddings
 │
 ▼
ChromaDB
```

The resulting knowledge base can then be queried through the
application.

------------------------------------------------------------------------

## 📌 Grounded Answers

The final answer is generated using retrieved document context.

The response can include source information such as:

- document name
- page information
- retrieved source passages

This makes the answer easier to inspect and verify.

------------------------------------------------------------------------

## 🔊 Optional Voice Output

BhashaRAG integrates **Sarvam Bulbul v3** for text-to-speech.

``` text
Generated Answer
       │
       ▼
Sarvam Bulbul v3
       │
       ▼
Audio Response
```

------------------------------------------------------------------------

# 🏗️ Architecture

``` text
┌─────────────────────────────────────────────────┐
│                  React Frontend                 │
│             TypeScript + Vite + UI             │
└───────────────────────┬─────────────────────────┘
                        │
                        │ REST API
                        ▼
┌─────────────────────────────────────────────────┐
│                  FastAPI Backend                 │
│                                                 │
│  PDF Ingestion          Query Pipeline          │
│       │                       │                 │
│       ▼                       ▼                 │
│   Text/Chunking        Query Expansion          │
│       │                       │                 │
│       ▼                 ┌─────┴─────┐           │
│ Multilingual            │           │           │
│ Embeddings          Dense Search   BM25         │
│       │                   │           │          │
│       ▼                   └─────┬─────┘          │
│    ChromaDB                    │                 │
│                                ▼                 │
│                         RRF Fusion               │
│                                │                 │
│                                ▼                 │
│                       Cross-Encoder              │
│                          Reranking               │
│                                │                 │
│                                ▼                 │
│                           Gemini                 │
│                                │                 │
│                                ▼                 │
│                       Grounded Response         │
│                                │                 │
│                                ▼                 │
│                           Sarvam TTS             │
└─────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 🧠 RAG Pipeline

### 1. Document Ingestion

A PDF is uploaded and converted into extracted text.

``` text
PDF → Extracted Text
```

### 2. Chunking

The extracted text is divided into smaller overlapping chunks so
relevant sections can be retrieved efficiently.

### 3. Multilingual Embeddings

Document chunks are embedded using:

``` text
sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

The same multilingual representation is used for queries.

### 4. Dense Retrieval

The query is compared with document vectors stored in ChromaDB.

### 5. BM25 Retrieval

A parallel lexical search finds passages containing important terms and
exact terminology.

### 6. Reciprocal Rank Fusion

Dense and BM25 results are combined into a unified candidate list.

### 7. Cross-Encoder Reranking

Candidate passages are reranked based on query–document relevance.

### 8. Context Construction

The strongest passages are assembled into the context supplied to
Gemini.

### 9. Grounded Generation

Gemini generates the response using the user’s question and retrieved
evidence.

### 10. Optional Voice Generation

The answer can be passed to Sarvam Bulbul v3 to produce audio.

------------------------------------------------------------------------

# 🛠️ Technology Stack

| Layer             | Technology                            |
|-------------------|---------------------------------------|
| Frontend          | React, TypeScript, Vite               |
| Styling           | Tailwind CSS                          |
| Backend           | Python, FastAPI, Uvicorn              |
| PDF Processing    | pypdf                                 |
| Embeddings        | Sentence Transformers                 |
| Embedding Model   | paraphrase-multilingual-MiniLM-L12-v2 |
| Vector Database   | ChromaDB                              |
| Keyword Retrieval | BM25                                  |
| Result Fusion     | Reciprocal Rank Fusion                |
| Reranking         | Cross-Encoder                         |
| LLM               | Google Gemini                         |
| Text-to-Speech    | Sarvam Bulbul v3                      |

------------------------------------------------------------------------

# 📁 Project Structure

``` text
BhashaRAG/
│
├── backend/
│   ├── data/
│   ├── eval/
│   │   ├── evaluate.py
│   │   ├── make_test_set.py
│   │   └── test_set.json
│   ├── src/
│   │   ├── api.py
│   │   ├── app.py
│   │   ├── config.py
│   │   ├── ingest.py
│   │   ├── llm.py
│   │   ├── query.py
│   │   ├── query_expansion.py
│   │   ├── retrieve.py
│   │   └── tts.py
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── README.md
```

------------------------------------------------------------------------

# 🚀 Getting Started

## Prerequisites

Install:

- Python 3.10+
- Node.js 18+
- npm
- Git

You also need API keys for the external AI services used by your
configuration.

## 1. Clone

``` bash
git clone https://github.com/aayushi-tomar/BhashaRAG.git
cd BhashaRAG
```

## 2. Backend

``` powershell
python -m venv .venv
.venv\Scriptsctivate
cd backend
pip install -r requirements.txt
```

## 3. Environment Variables

Create:

``` text
backend/.env
```

using:

``` text
backend/.env.example
```

Example:

``` env
GEMINI_API_KEY=your_gemini_api_key
SARVAM_API_KEY=your_sarvam_api_key

# Optional
RERANKER_MODEL=BAAI/bge-reranker-v2-m3
SARVAM_SPEAKER=shubh
```

> **Never commit `.env` or API keys to GitHub.**

## 4. Start Backend

From `backend`:

``` powershell
python src/api.py
```

Backend:

``` text
http://localhost:8000
```

API documentation:

``` text
http://localhost:8000/docs
```

## 5. Start Frontend

Open another terminal:

``` powershell
cd BhashaRAGrontend
npm install
npm run dev
```

Frontend:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

# 🖥️ Using BhashaRAG

### Step 1 — Add a PDF

Upload a document using **Add PDF Documents**.

### Step 2 — Index the Knowledge Base

Run the indexing process so the document becomes searchable.

### Step 3 — Ask a Question

Examples:

``` text
What are the eligibility requirements?
```

``` text
इस योजना के लिए कौन पात्र है?
```

``` text
Is scheme ke liye kaun eligible hai?
```

### Step 4 — Review the Answer

The system retrieves relevant passages, generates a grounded response,
and provides source information.

### Step 5 — Voice

Enable voice output when an audio response is desired.

------------------------------------------------------------------------

# 🔌 API

### Health

``` http
GET /api/health
```

### Documents

``` http
GET /api/documents
```

### Query

``` http
POST /api/query
```

For the complete interactive API schema:

``` text
http://localhost:8000/docs
```

------------------------------------------------------------------------

# 🧪 Evaluation

The repository includes an evaluation module:

``` text
backend/eval/
```

with:

``` text
evaluate.py
make_test_set.py
test_set.json
```

This provides a foundation for evaluating retrieval and answer quality
independently from the web interface.

------------------------------------------------------------------------

# 🎯 Use Cases

### 🏛️ Government & Public Policy

Query schemes, guidelines, notifications, and policy documents.

### 🎓 Education

Search textbooks, study material, reports, and academic documents.

### 🔬 Research

Query research papers and technical reports using natural language.

### 📑 Regulatory Documents

Explore large collections of policies, rules, and compliance material.

### 🌾 Public Information

Make complex documents more accessible to users who prefer Indian
languages.

------------------------------------------------------------------------

# 🔬 Engineering Highlights

BhashaRAG demonstrates practical AI-engineering concepts:

- Retrieval-Augmented Generation
- Multilingual embeddings
- Cross-lingual retrieval
- Hybrid search
- BM25
- Reciprocal Rank Fusion
- Cross-encoder reranking
- Query expansion
- Vector databases
- FastAPI backend architecture
- React + TypeScript frontend
- LLM grounding
- Source attribution
- Text-to-speech integration

The main engineering focus is **building the retrieval and grounding
system around the LLM**, rather than treating the LLM itself as the
entire application.

------------------------------------------------------------------------

# 🚧 Limitations

- LLM generation depends on external API availability and quota.
- Large reranker models can be resource-intensive on CPU.
- PDF extraction quality depends on the source document.
- Scanned/image-only PDFs require OCR for reliable text extraction.
- Retrieval quality depends on chunking, embedding, and reranking
  configuration.
- Voice output requires a valid Sarvam API key.

------------------------------------------------------------------------

# 🛣️ Roadmap

- [ ] Speech-to-text input
- [ ] OCR for scanned PDFs
- [ ] Streaming responses
- [ ] Improved citation highlighting
- [ ] Conversation memory
- [ ] Multilingual RAG evaluation benchmarks
- [ ] Retrieval evaluation dashboard
- [ ] Authentication and user workspaces
- [ ] Docker deployment
- [ ] Cloud deployment
- [ ] Additional Indic-language optimization

------------------------------------------------------------------------

# 🔐 Security

API keys are stored locally in:

``` text
backend/.env
```

Keep `.env` ignored by Git and never commit credentials.

If a key is accidentally exposed, revoke it and generate a replacement.

------------------------------------------------------------------------

# 👨‍💻 Author

**Aayushi Tomar**

Computer Science Student interested in:

- Backend Engineering
- AI Engineering
- Generative AI
- LLM Systems
- Retrieval-Augmented Generation
- Multilingual AI

------------------------------------------------------------------------

## ⭐ BhashaRAG

> **Making Indian documents searchable across languages.**

[GitHub Repository](https://github.com/aayushi-tomar/BhashaRAG)
