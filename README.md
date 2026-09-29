# 🌏 BhashaRAG — Multilingual RAG for Indian Documents

> **Ask questions in English, Hindi, or Hinglish over your PDFs with accurate, source-cited answers.**

BhashaRAG is a multilingual Retrieval-Augmented Generation (RAG) application that allows users to upload PDF documents and interact with them naturally in **English, Hindi, or Hinglish**. Unlike traditional "Chat with PDF" projects that are limited to English, BhashaRAG performs **cross-lingual retrieval**, enabling users to ask questions in one language and retrieve relevant information from documents written in another.

Whether you're reading government reports, research papers, policy documents, or educational material, BhashaRAG grounds every response with **page-level citations** to minimize hallucinations and improve trustworthiness.

---

## ✨ Features

* 🌍 **Multilingual Question Answering**

  * Ask questions in English, Hindi, or Hinglish.
  * Works even if the document is written in a different language.

* 🔎 **Cross-Lingual Semantic Search**

  * Hindi questions can retrieve English document sections.
  * English questions can retrieve Hindi document sections.

* 📄 **Chat with Multiple PDFs**

  * Upload one or more PDFs.
  * Query all documents together.

* 📌 **Source Citations**

  * Every answer includes the exact page/chunk used.
  * Easy to verify generated responses.

* ⚡ **Fast Local Vector Search**

  * ChromaDB stores embeddings locally.
  * No database setup required.

* 🎯 **Grounded Responses**

  * The LLM only answers using retrieved document context.
  * Significantly reduces hallucinations.

* 💻 **Simple Web Interface**

  * Upload PDFs.
  * Chat in your preferred language.
  * View cited sources.

---


# Why BhashaRAG?

Most open-source PDF chat applications:

* only support English
* fail on Hindi documents
* cannot answer Hindi questions from English PDFs
* provide answers without citations

BhashaRAG addresses these limitations by combining **multilingual embeddings**, **vector search**, and **LLM grounding**.

### Example

**Document Language:** English

**User asks (Hindi):**

> भारत सरकार द्वारा पात्रता की क्या शर्तें बताई गई हैं?

The system retrieves the correct English chunks and generates an answer in Hindi with citations.

---

# Architecture

```text
                     ┌────────────────────┐
                     │     PDF Files      │
                     └─────────┬──────────┘
                               │
                        Text Extraction
                               │
                               ▼
                    Text Chunking (Overlap)
                               │
                               ▼
                Multilingual Embedding Model
                               │
                               ▼
                     Chroma Vector Database
                               ▲
                               │
                 User Question (Any Language)
                               │
                Same Embedding Model
                               │
                               ▼
                   Similarity Search (Top-K)
                               │
                               ▼
                  Retrieved Context Chunks
                               │
                               ▼
                     Claude / OpenAI LLM
                               │
                               ▼
                Grounded Answer + Citations
```

---

# Tech Stack

| Component       | Technology                            |
| --------------- | ------------------------------------- |
| Language        | Python                                |
| UI              | Gradio                                |
| PDF Parsing     | pypdf                                 |
| Chunking        | Recursive Text Splitter               |
| Embeddings      | sentence-transformers                 |
| Embedding Model | paraphrase-multilingual-MiniLM-L12-v2 |
| Vector Database | ChromaDB                              |
| LLM             | Claude 3.5 Haiku                      |
| Environment     | python-dotenv                         |

---

# Project Structure

```text
multilingual-rag/
│
├── README.md
├── requirements.txt
├── .env.example
│
├── src/
│   ├── ingest.py
│   ├── retrieve.py
│   ├── llm.py
│   ├── query.py
│   └── app.py
│
├── data/
│   ├── pdfs/
│   └── chroma_db/
│
├── assets/
│   ├── demo.gif
│   └── screenshots/
│
└── LICENSE
```

---

# Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/BhashaRAG.git

cd BhashaRAG
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env
```

Add your API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

---

# Running the Project

## 1. Index PDFs

Place your PDFs inside:

```text
data/pdfs/
```

Run:

```bash
python src/ingest.py --pdf_dir data/pdfs
```

This will:

* Parse PDFs
* Split into chunks
* Generate multilingual embeddings
* Store embeddings inside ChromaDB

---

## 2. Ask Questions (CLI)

English:

```bash
python src/query.py --question "What are the eligibility criteria?"
```

Hindi:

```bash
python src/query.py --question "इस दस्तावेज़ का मुख्य उद्देश्य क्या है?"
```

Hinglish:

```bash
python src/query.py --question "Ye document kis baare me hai?"
```

---

## 3. Launch Web UI

```bash
python src/app.py
```

Open:

```text
http://localhost:7860
```

Upload PDFs and start chatting.

---

# Example Queries

### English

```
Summarize this document.
```

```
What are the eligibility requirements?
```

```
List all important deadlines.
```

---

### Hindi

```
मुख्य निष्कर्ष क्या हैं?
```

```
इस दस्तावेज़ में पात्रता की शर्तें क्या हैं?
```

```
इस नीति का उद्देश्य क्या है?
```

---

### Hinglish

```
Is document ka summary batao.
```

```
Important points kya hain?
```

```
Eligibility criteria explain karo.
```

---

# Cross-Lingual Retrieval Example

| Document    | User Question | Answer Language |
| ----------- | ------------- | --------------- |
| English PDF | Hindi         | Hindi           |
| English PDF | Hinglish      | Hinglish        |
| Hindi PDF   | English       | English         |
| Hindi PDF   | Hindi         | Hindi           |

---

# How It Works

### Step 1 — PDF Parsing

The application extracts text from uploaded PDF files.

↓

### Step 2 — Chunking

Large documents are split into overlapping chunks to preserve context.

↓

### Step 3 — Embedding Generation

Each chunk is converted into a multilingual embedding using:

```
paraphrase-multilingual-MiniLM-L12-v2
```

↓

### Step 4 — Vector Storage

Embeddings are stored inside ChromaDB for efficient semantic search.

↓

### Step 5 — Retrieval

The user query is embedded using the same model.

Top-K most similar chunks are retrieved.

↓

### Step 6 — Generation

Retrieved chunks are passed to Claude along with the user's question.

Claude is instructed to answer **only using the retrieved context**.

↓

### Step 7 — Citations

The response includes:

* page number
* chunk number
* source document

---

# Example Output

**Question**

> What are the eligibility criteria?

**Answer**

```
Applicants must be at least 18 years old and
should possess a valid government-issued identity proof.

Source:
Page 5
Document: Government_Guidelines.pdf
```

---

# Performance

* Supports 50+ languages
* Fast semantic retrieval
* Persistent local vector database
* Low inference cost
* Works on CPU

---

# Limitations

* Image-only PDFs require OCR.
* Retrieval quality depends on chunk size.
* Very large document collections may require hybrid retrieval.
* Currently optimized for English and Hindi.

---

# Future Improvements

* OCR support using Tesseract
* Hybrid BM25 + Vector Search
* Cross-Encoder Reranking
* Streaming Responses
* Conversation Memory
* Metadata Filtering
* GitHub Repository Ingestion
* Audio Question Support
* Indic Language Expansion
* Retrieval Evaluation Dashboard

---

# Use Cases

* Government Schemes
* Legal Documents
* Research Papers
* College Notes
* Healthcare Guidelines
* Company Policies
* Educational PDFs
* Financial Reports

---

# Why This Project Matters

Most student RAG projects stop at "Chat with PDF."

BhashaRAG focuses on a practical challenge encountered in multilingual environments: retrieving relevant information across languages while grounding every response in the original source. By combining multilingual embeddings, semantic retrieval, and citation-based generation, the project demonstrates techniques that are directly applicable to document intelligence systems used in enterprises and AI startups.

---

# Contributing

Contributions are welcome!

If you'd like to improve BhashaRAG:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

# License

This project is licensed under the MIT License.

---

# Acknowledgements

* Anthropic Claude
* Sentence Transformers
* ChromaDB
* Gradio
* Hugging Face
* PyPDF

---

## ⭐ If you found this project useful, consider giving it a star!

It helps others discover the project and supports future development.
