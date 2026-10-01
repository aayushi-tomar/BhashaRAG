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

# Optional: kept for anyone who later switches back to Claude (see report,
# Section 7, Technology Stack) once they have API budget.
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# ---- Models ----
# Multilingual sentence embedding model — supports 50+ languages, which is
# what allows a Hindi question to retrieve an English passage (see report,
# Section 8.1).
EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# Multilingual cross-encoder reranker (supports Hindi and other Indic
# languages). Used to refine hybrid-retrieval candidates (report, 8.4).
# Override with the RERANKER_MODEL env var. bge-reranker-v2-m3 is the most
# accurate but large (~2 GB) and slow on CPU; a much lighter multilingual
# option (covers Hindi) is: cross-encoder/mmarco-mMiniLMv2-L12-H384-v1
RERANKER_MODEL_NAME = os.getenv("RERANKER_MODEL", "BAAI/bge-reranker-v2-m3")

# Gemini model used for grounded generation and query expansion.
# gemini-3.8-flash is on Google's free tier (no billing needed). If it's
# ever retired, check https://ai.google.dev for the current free-tier model
# name and update this one constant.
GEMINI_MODEL = "gemini-3.8-flash"

# Kept for reference / for switching back to Claude later.
CLAUDE_MODEL = "claude-3-5-haiku-20241022"

# ---- Sarvam text-to-speech (voice output) ----
# bulbul:v3 is Sarvam's current model. Speaker names are lowercase and MUST
# match the model version (v3 speakers don't work on v2 and vice-versa).
SARVAM_TTS_MODEL = "bulbul:v3"
SARVAM_TTS_SPEAKER = "shubh"     # documented default for bulbul:v3
SARVAM_TTS_MAX_CHARS = 1500      # per request (v3 allows 2500; kept lower for safety)
SARVAM_TTS_MAX_CHUNKS = 6        # cap on requests per answer

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
