"""
ingest.py — Indexing phase of BhashaRAG.

Parses PDFs -> chunks text with overlap -> embeds each chunk with a
multilingual sentence-transformer -> stores embeddings in ChromaDB, and
saves a parallel BM25 corpus (tokenized chunk text) used later for hybrid
retrieval in retrieve.py.

Run directly:
    python src/ingest.py --pdf_dir data/pdfs --reset
"""
import os
import re
import pickle
import argparse
from pathlib import Path

import chromadb
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

from config import (
    EMBEDDING_MODEL_NAME, CHROMA_DB_DIR, CHROMA_COLLECTION_NAME,
    CHUNK_SIZE, CHUNK_OVERLAP, BM25_INDEX_PATH, BASE_DIR,
)


def extract_pages(pdf_path):
    """Return a list of (page_number, text) tuples for a PDF file."""
    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            pages.append((i + 1, text))
    return pages


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """
    Overlapping character-based chunker that prefers to break on a space
    near the target boundary, so words aren't split mid-token. This keeps
    each retrieval unit small and precise while overlap prevents important
    context from being lost across a chunk boundary (report, Section 8.2).
    """
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        if end < length:
            boundary = text.rfind(" ", start + int(chunk_size * 0.5), end)
            if boundary != -1:
                end = boundary
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= length:
            break
        start = max(end - overlap, start + 1)
    return chunks


_PUNCTUATION = ",.!?;:()[]{}\"'“”‘’।—-–…"


def simple_tokenize(text):
    """
    Script-agnostic tokenizer: split on whitespace, then strip surrounding
    punctuation from each token. This is safer than a \\w+ regex for Indic
    scripts, where combining vowel marks (matras) are NOT in Python's \\w
    character class and would otherwise cause words like "परीक्षण" to be
    incorrectly split into fragments ("पर", "क", "षण"), silently wrecking
    BM25 keyword matching for Hindi text.
    """
    tokens = []
    for raw in text.lower().split():
        tok = raw.strip(_PUNCTUATION)
        if tok:
            tokens.append(tok)
    return tokens


def ingest_pdfs(pdf_dir, reset=False, model=None, batch_size=64):
    """
    Index every PDF in `pdf_dir`. Returns the number of chunks indexed.

    reset=True  -> wipe the vector store + BM25 corpus first (full re-index)
    reset=False -> add/update these PDFs and KEEP everything already indexed
    model       -> optionally pass an already-loaded SentenceTransformer so the
                   API process doesn't load a second copy into memory.
    """
    os.makedirs(CHROMA_DB_DIR, exist_ok=True)

    pdf_paths = sorted(Path(pdf_dir).glob("*.pdf"))
    if not pdf_paths:
        print(f"No PDFs found in {pdf_dir}. Add some and re-run.")
        return 0

    if model is None:
        print(f"Loading embedding model: {EMBEDDING_MODEL_NAME} ...")
        model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    if reset:
        try:
            client.delete_collection(CHROMA_COLLECTION_NAME)
        except Exception:
            pass
        if os.path.exists(BM25_INDEX_PATH):
            os.remove(BM25_INDEX_PATH)
    collection = client.get_or_create_collection(CHROMA_COLLECTION_NAME)

    # Keep previously indexed chunks (reset=False), keyed by id so re-indexing
    # the same PDF replaces its chunks instead of duplicating them.
    corpus = {}
    if not reset and os.path.exists(BM25_INDEX_PATH):
        with open(BM25_INDEX_PATH, "rb") as f:
            corpus = {e["id"]: e for e in pickle.load(f)}

    total = 0
    for pdf_path in pdf_paths:
        print(f"Processing {pdf_path.name} ...")
        entries = []
        for page_num, page_text in extract_pages(pdf_path):
            for chunk_idx, chunk in enumerate(chunk_text(page_text)):
                entries.append({
                    "id": f"{pdf_path.stem}_p{page_num}_c{chunk_idx}",
                    "tokens": simple_tokenize(chunk),
                    "text": chunk,
                    "metadata": {"source": pdf_path.name, "page": page_num, "chunk_index": chunk_idx},
                })
        if not entries:
            print(f"  (no extractable text in {pdf_path.name} - scanned PDF? OCR needed)")
            continue

        # drop this PDF's old chunks before adding the fresh ones
        corpus = {k: v for k, v in corpus.items() if v["metadata"]["source"] != pdf_path.name}

        for i in range(0, len(entries), batch_size):
            batch = entries[i:i + batch_size]
            embeddings = model.encode([e["text"] for e in batch], normalize_embeddings=True).tolist()
            collection.upsert(
                ids=[e["id"] for e in batch],
                embeddings=embeddings,
                documents=[e["text"] for e in batch],
                metadatas=[e["metadata"] for e in batch],
            )
        for e in entries:
            corpus[e["id"]] = e
        total += len(entries)

    with open(BM25_INDEX_PATH, "wb") as f:
        pickle.dump(list(corpus.values()), f)

    print(f"\nIndexed {total} new chunk(s); {len(corpus)} chunk(s) in the knowledge base.")
    print(f"ChromaDB persisted at: {CHROMA_DB_DIR}")
    print(f"BM25 corpus saved at:  {BM25_INDEX_PATH}")
    return total


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest PDFs into BhashaRAG.")
    parser.add_argument("--pdf_dir", default=os.path.join(BASE_DIR, "data", "pdfs"), help="Directory containing PDF files.")
    parser.add_argument("--reset", action="store_true", help="Reset the existing collection before ingesting.")
    args = parser.parse_args()
    ingest_pdfs(args.pdf_dir, reset=args.reset)
