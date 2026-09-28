"""
config.py — Central configuration for BhashaRAG.

Keeping every model name, path, and tunable constant in one place makes the
system easy to explain in a viva: every design number below is referenced
in the project report's Methodology section.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ---- API keys ----
# Google Gemini (free tier, no credit card required) — used for generation
# and query expansion. Get a key at https://aistudio.google.com/apikey
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# ---- Models ----
# Multilingual sentence embedding model — supports 50+ languages, which is
# what allows a Hindi question to retrieve an English passage (see report,
# Section 8.1).
EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# Multilingual cross-encoder reranker (supports Hindi and other Indic
# languages). Used to refine hybrid-retrieval candidates (report, 8.4).
# Default is a light multilingual model (covers Hindi, ~120 MB). For maximum
# accuracy set RERANKER_MODEL=BAAI/bge-reranker-v2-m3 in .env (~2 GB, slow on CPU).
RERANKER_MODEL_NAME = os.getenv("RERANKER_MODEL", "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")

# Gemini model used for grounded generation and query expansion.
# gemini-2.5-flash is on Google's free tier (no billing needed). If it's
# ever retired, check https://ai.google.dev for the current free-tier model
# name and update this one constant.
GEMINI_MODEL = "gemini-2.5-flash"

# ---- Generation settings (report, Section 8.7) ----
GENERATION_TEMPERATURE = 0.2   # grounded answer generation
EXPANSION_TEMPERATURE = 0.3    # query expansion (a little variety in phrasings)
JUDGE_TEMPERATURE = 0.0        # faithfulness judge (deterministic)

# ---- Storage ----
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_DB_DIR = os.path.join(BASE_DIR, "data", "chroma_db")
CHROMA_COLLECTION_NAME = "bhasharag_docs"
BM25_INDEX_PATH = os.path.join(CHROMA_DB_DIR, "bm25_corpus.pkl")

# ---- Chunking ----
CHUNK_SIZE = 800        # characters per chunk
CHUNK_OVERLAP = 150     # character overlap between consecutive chunks

# ---- Retrieval ----
TOP_K_DENSE = 20        # candidates pulled from dense vector search
TOP_K_BM25 = 20         # candidates pulled from BM25 keyword search
TOP_K_FUSED = 15        # candidates kept after Reciprocal Rank Fusion
MAX_RERANK_CANDIDATES = 20  # cap on pairs scored by the cross-encoder (bounds latency)
TOP_K_RERANKED = 5      # final chunks passed to the LLM after reranking
RRF_K = 60              # standard RRF damping constant (Cormack et al., 2009)

# ---- Query expansion ----
NUM_QUERY_VARIANTS = 3  # alternate phrasings generated per question

# ---- Sarvam text-to-speech ----
# bulbul:v2 is retired by Sarvam; v3 speakers are lowercase (e.g. shubh, priya,
# ritu, aditya, neha, rahul, pooja). Change with the SARVAM_SPEAKER env var.
SARVAM_MODEL = "bulbul:v3"
SARVAM_SPEAKER = os.getenv("SARVAM_SPEAKER", "shubh")
