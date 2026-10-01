🌏 BhashaRAG
Multilingual Retrieval-Augmented Generation for Indian Documents
Ask questions in English, Hindi, or Hinglish. Retrieve the right information from documents across languages and get grounded answers with sources.

BhashaRAG is a multilingual Retrieval-Augmented Generation (RAG) platform designed for querying Indian documents such as government schemes, policies, research papers, reports, and educational material.
The core problem it addresses is simple: important information may exist in one language while the user asks in another.
For example, an English government document can be queried in Hindi or Hinglish, with the system retrieving the relevant English content and generating a grounded response for the user.
Instead of directly sending a question to an LLM, BhashaRAG builds a retrieval pipeline that combines multilingual semantic search, keyword retrieval, query expansion, result fusion, and cross-encoder reranking before generating the final answer.
🎯 The Problem
A large amount of Indian policy, government, research, and educational information is available as PDFs.
Traditional document-Q&A systems often struggle with:
- English-only retrieval
- Hindi or Hinglish queries
- Queries that use different terminology from the document
- Exact keywords, names, numbers, and scheme terminology
- Irrelevant retrieved chunks
- Answers that are difficult to verify
Consider this example:
Document language: English
User query:
इस योजना के लिए पात्रता की क्या शर्तें हैं?

A conventional keyword-based system may struggle because the question and document use different languages.
BhashaRAG is designed to bridge that gap.
💡 The Solution
BhashaRAG treats multilingual document Q&A as a retrieval problem first and a generation problem second.
The system follows this pipeline:
                    User Question
                          │
                          ▼
                  Query Expansion
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
      Semantic Retrieval          BM25 Retrieval
             │                         │
             └────────────┬────────────┘
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

The important part is that the LLM is not responsible for finding the information.
The retrieval pipeline first identifies relevant evidence from the uploaded documents, and that evidence is then provided to the generation model.
✨ Key Features
🌐 Multilingual Q&A
Users can ask questions in:
- English
- Hindi
- Hinglish
The multilingual retrieval layer allows questions and documents to be handled across languages.
🔄 Cross-Lingual Retrieval
BhashaRAG can handle scenarios such as:
Document	Query	Retrieval
English	Hindi	Cross-lingual
English	Hinglish	Cross-lingual
Hindi	English	Cross-lingual
Hindi	Hindi	Same-language


For example:
English PDF
     ↓
Hindi Question
     ↓
Multilingual Retrieval
     ↓
Relevant English Passage
     ↓
Hindi Answer

🔎 Hybrid Retrieval
BhashaRAG does not depend on only vector similarity.
It combines:
Dense semantic retrieval
with
BM25 lexical retrieval
This gives the system two different ways of finding relevant information.
Semantic retrieval helps understand meaning, while BM25 helps preserve exact terminology, names, numbers, and keywords.
🎯 Cross-Encoder Reranking
Initial retrieval can return several potentially relevant chunks.
BhashaRAG applies a cross-encoder reranker to evaluate query–document relevance more precisely before sending context to the LLM.
Retrieved Candidates
        ↓
Cross-Encoder
        ↓
Relevant Context
        ↓
LLM

This makes the generation stage work with a smaller and more relevant context.
🧠 Query Expansion
The original user question can be expanded into alternative formulations before retrieval.
For example:
Original Query:

"What are the eligibility requirements?"

        ↓

Expanded Queries:

"Who is eligible?"
"What conditions must an applicant satisfy?"
"What are the qualification criteria?"

This helps retrieval when the wording used by the user differs from the wording used inside the document.
📚 PDF Knowledge Base
Users can upload PDF documents through the web interface.
The documents are processed into searchable chunks and indexed into the local retrieval system.
PDF
 ↓
Text Extraction
 ↓
Chunking
 ↓
Multilingual Embeddings
 ↓
Vector Index

Multiple documents can form a single searchable knowledge base.
📌 Grounded Answers
The LLM receives the retrieved document context along with the user's question.
The application can then return the answer together with the source information used during retrieval.
This makes the response easier to inspect and verify than a conventional chatbot response.
🔊 Voice Output
BhashaRAG also includes optional Sarvam Bulbul v3 text-to-speech integration.
A generated answer can be converted into speech, making the system more accessible for users who prefer listening to responses.
🧠 How BhashaRAG Works
1. Document Ingestion
The user uploads a PDF.
PDF
 ↓
Text Extraction

The extracted content becomes the foundation of the knowledge base.
2. Chunking
Large documents are divided into smaller overlapping chunks.
Large Document
      ↓
 ┌─────────────┐
 │ Chunk 1     │
 ├─────────────┤
 │ Chunk 2     │
 ├─────────────┤
 │ Chunk 3     │
 └─────────────┘

Overlap helps preserve information that spans chunk boundaries.
3. Multilingual Embeddings
Each chunk is converted into a vector representation using:
sentence-transformers/
paraphrase-multilingual-MiniLM-L12-v2

The user's question is embedded using the same multilingual representation.
This allows semantically related content to be matched even when the languages differ.
4. Hybrid Retrieval
The query is sent through two retrieval mechanisms:
                  Query
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   Dense Retrieval         BM25 Search
          │                   │
          └─────────┬─────────┘
                    ▼
                  RRF

The results are combined using Reciprocal Rank Fusion (RRF).
5. Reranking
The combined candidate set is passed through a cross-encoder reranker.
The reranker evaluates the relationship between:
Question ↔ Retrieved Passage

and prioritizes the most relevant passages.
6. Context Construction
The highest-ranked passages are assembled into the context supplied to the LLM.
Question
   +
Relevant Passages
   ↓
Context

7. Grounded Generation
Gemini receives:
System Instructions
+
User Question
+
Retrieved Context

and generates the final response.
8. Optional Voice Generation
If voice output is enabled:
Generated Answer
       ↓
Sarvam Bulbul v3
       ↓
Audio

The frontend can then play the generated response.
🏗️ Architecture
┌───────────────────────────────────────────────┐
│                 React Frontend                │
│             React + TypeScript + Vite        │
└──────────────────────┬────────────────────────┘
                       │
                       │ REST API
                       ▼
┌───────────────────────────────────────────────┐
│                  FastAPI Backend               │
├───────────────────────────────────────────────┤
│                                               │
│  PDF Ingestion          Query Pipeline        │
│       │                       │               │
│       ▼                       ▼               │
│   Text Parser          Query Expansion        │
│       │                       │               │
│       ▼               ┌───────┴────────┐      │
│    Chunking            │                │      │
│       │             Dense             BM25    │
│       ▼               │                │      │
│  Embeddings            └───────┬────────┘      │
│       │                        │               │
│       ▼                        ▼               │
│    ChromaDB             RRF Fusion             │
│                                │               │
│                                ▼               │
│                         Cross-Encoder          │
│                           Reranking             │
│                                │               │
│                                ▼               │
│                         Gemini LLM             │
│                                │               │
│                                ▼               │
│                       Grounded Response        │
│                                │               │
│                                ▼               │
│                         Sarvam TTS             │
│                                               │
└───────────────────────────────────────────────┘

🛠️ Technology Stack
Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Markdown
- Lucide React
Backend
- Python
- FastAPI
- Uvicorn
- pypdf
- Sentence Transformers
- ChromaDB
- BM25
- Cross-Encoder
AI
- Multilingual embeddings
- Query expansion
- Hybrid retrieval
- Reciprocal Rank Fusion
- Cross-encoder reranking
- Google Gemini
- Sarvam Bulbul v3
📁 Project Structure
BhashaRAG/
│
├── backend/
│   ├── data/
│   │
│   ├── eval/
│   │   ├── evaluate.py
│   │   ├── make_test_set.py
│   │   └── test_set.json
│   │
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
│   │
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   └── components/
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── README.md

🎯 What Makes This Project Different?
BhashaRAG is not simply:
PDF → LLM → Answer

Instead, it implements a complete retrieval pipeline:
PDF
 ↓
Chunking
 ↓
Multilingual Embeddings
 ↓
Dense Retrieval
 +
BM25
 ↓
RRF
 ↓
Cross-Encoder Reranking
 ↓
Context Construction
 ↓
Gemini
 ↓
Grounded Answer
 ↓
Optional Voice

This makes the project a practical demonstration of AI engineering and RAG system design, rather than just an LLM wrapper.
💼 Practical Use Cases
BhashaRAG can be adapted for:
🏛️ Government & Policy
Query government schemes, policies, notifications, and reports.
🎓 Education
Interact with textbooks, academic reports, study material, and institutional documents.
📑 Research
Search research papers and technical reports using natural-language questions.
⚖️ Legal & Regulatory Documents
Explore large collections of policies, regulations, and compliance documents.
🌾 Public Information
Make complex government and public-service documents easier to access in Indian languages.
🧪 Example
Document
An English government scheme guideline.
User
इस योजना के लिए पात्रता की क्या शर्तें हैं?

BhashaRAG
Hindi Query
     ↓
Multilingual Query Representation
     ↓
English Document Retrieval
     ↓
BM25 + Dense Retrieval
     ↓
RRF
     ↓
Reranking
     ↓
Relevant Scheme Sections
     ↓
Gemini
     ↓
Hindi Grounded Answer
     +
Document Sources

This is the central idea behind BhashaRAG:
The user should not have to speak the same language as the document to access its information.

🔐 Security
API credentials are stored locally through environment variables.
backend/.env

Sensitive credentials should never be committed to the repository.
The repository's .gitignore excludes .env and generated local artifacts.
🚧 Future Improvements
- Speech-to-text input
- OCR for scanned PDFs
- Better Indic-language evaluation
- Streaming responses
- Improved citation highlighting
- Conversation memory
- RAG evaluation dashboard
- Authentication and user workspaces
- Docker deployment
- Cloud deployment
- Additional Indic-language optimization
👨‍💻 Built With
BhashaRAG was built as an exploration of:
Multilingual AI + Retrieval-Augmented Generation + Backend Engineering + LLM Systems

The project focuses on building the retrieval and grounding infrastructure around an LLM rather than treating the LLM as the entire application.
⭐ BhashaRAG
Making Indian documents searchable across languages.
GitHub Repository
