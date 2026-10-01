"""
retrieve.py — Query-phase retrieval for BhashaRAG.

Implements the three techniques described in the project report as the
core "technical depth" contribution:
  1. Hybrid retrieval  — dense vector search (semantic) + BM25 (exact/keyword)
  2. Reciprocal Rank Fusion — merges the two ranked lists (Cormack et al., 2009)
  3. Cross-encoder reranking — precisely re-scores the fused shortlist
       before it is handed to the LLM (report, Section 8.3-8.4)
"""
import os
import pickle

import chromadb
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, CrossEncoder

from config import (
    EMBEDDING_MODEL_NAME, RERANKER_MODEL_NAME, CHROMA_DB_DIR,
    CHROMA_COLLECTION_NAME, TOP_K_DENSE, TOP_K_BM25, TOP_K_FUSED,
    TOP_K_RERANKED, RRF_K, BM25_INDEX_PATH, MAX_RERANK_CANDIDATES,
)
from ingest import simple_tokenize

# Lazily-loaded singletons so the (heavy) models are only ever loaded once
# per process, regardless of how many times retrieval functions are called.
_embedding_model = None
_reranker_model = None
_reranker_failed = False
_bm25_index = None
_bm25_corpus = None
_chroma_collection = None


def _load_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _embedding_model


def _load_reranker_model():
    global _reranker_model
    if _reranker_model is None:
        _reranker_model = CrossEncoder(RERANKER_MODEL_NAME)
    return _reranker_model


def _load_chroma_collection():
    global _chroma_collection
    if _chroma_collection is None:
        client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        _chroma_collection = client.get_or_create_collection(CHROMA_COLLECTION_NAME)
    return _chroma_collection


def _load_bm25():
    global _bm25_index, _bm25_corpus
    if _bm25_index is None:
        if not os.path.exists(BM25_INDEX_PATH):
            raise FileNotFoundError(
                f"BM25 corpus not found at {BM25_INDEX_PATH}. Run ingest.py first."
            )
        with open(BM25_INDEX_PATH, "rb") as f:
            _bm25_corpus = pickle.load(f)
        tokenized = [entry["tokens"] for entry in _bm25_corpus]
        _bm25_index = BM25Okapi(tokenized)
    return _bm25_index, _bm25_corpus


def reload_indexes():
    """
    Drop cached Chroma/BM25 objects. MUST be called after re-indexing in the
    same process (the API does this) - otherwise queries keep hitting the old,
    deleted collection or the stale BM25 corpus.
    """
    global _bm25_index, _bm25_corpus, _chroma_collection
    _bm25_index = _bm25_corpus = _chroma_collection = None


def dense_search(query, top_k=TOP_K_DENSE):
    """Dense vector similarity search against ChromaDB."""
    model = _load_embedding_model()
    collection = _load_chroma_collection()
    count = collection.count()
    if count == 0:
        return []
    query_embedding = model.encode(query, normalize_embeddings=True).tolist()
    results = collection.query(query_embeddings=[query_embedding], n_results=min(top_k, count))

    ids = results.get("ids", [[]])[0]
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    return [
        {"id": cid, "text": doc, "metadata": meta, "rank": rank + 1}
        for rank, (cid, doc, meta) in enumerate(zip(ids, docs, metas))
    ]


def bm25_search(query, top_k=TOP_K_BM25):
    """Sparse keyword search via BM25 — catches exact terms dense search can miss."""
    bm25, corpus = _load_bm25()
    tokens = simple_tokenize(query)
    scores = bm25.get_scores(tokens)
    ranked_idx = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    return [
        {
            "id": corpus[idx]["id"], "text": corpus[idx]["text"],
            "metadata": corpus[idx]["metadata"], "rank": rank + 1,
        }
        for rank, idx in enumerate(ranked_idx)
    ]


def reciprocal_rank_fusion(result_lists, k=RRF_K, top_k=TOP_K_FUSED):
    """
    Merge several ranked hit lists into one using Reciprocal Rank Fusion:
    score(doc) = sum over lists of 1 / (k + rank_in_that_list).
    A chunk that ranks well in either (or both) lists rises to the top.
    """
    scores, items = {}, {}
    for hits in result_lists:
        for hit in hits:
            scores[hit["id"]] = scores.get(hit["id"], 0.0) + 1.0 / (k + hit["rank"])
            items[hit["id"]] = hit

    fused_ids = sorted(scores, key=lambda i: scores[i], reverse=True)[:top_k]
    return [items[i] for i in fused_ids]


def rerank(query, candidates, top_k=TOP_K_RERANKED):
    """
    Cross-encoder reranking: scores (query, passage) pairs jointly for precision.
    If the reranker model cannot be loaded (e.g. no internet for the download),
    fall back to the fused ranking instead of failing the whole request.
    """
    global _reranker_failed
    if not candidates:
        return []
    candidates = candidates[:MAX_RERANK_CANDIDATES]
    if _reranker_failed:
        return candidates[:top_k]
    try:
        reranker = _load_reranker_model()
        scores = reranker.predict([[query, c["text"]] for c in candidates])
    except Exception as e:
        _reranker_failed = True
        print(f"[retrieve] Reranker unavailable ({e}); using fused ranking instead.")
        return candidates[:top_k]
    scored = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [c for c, _ in scored[:top_k]]


def hybrid_retrieve(query, use_reranker=True, top_k=TOP_K_RERANKED):
    """Convenience wrapper: dense + BM25 -> RRF fusion -> (optional) rerank."""
    dense_hits = dense_search(query)
    bm25_hits = bm25_search(query)
    fused = reciprocal_rank_fusion([dense_hits, bm25_hits])

    if use_reranker:
        return rerank(query, fused, top_k=top_k)
    return fused[:top_k]


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Quick manual retrieval test.")
    parser.add_argument("--query", required=True)
    parser.add_argument("--no-rerank", action="store_true")
    args = parser.parse_args()

    hits = hybrid_retrieve(args.query, use_reranker=not args.no_rerank)
    for h in hits:
        print(f"[{h['metadata']['source']} p{h['metadata']['page']}] {h['text'][:150]}...")
