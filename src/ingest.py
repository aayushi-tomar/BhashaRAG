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


def ingest_pdfs(pdf_dir, reset=False):
    os.makedirs(CHROMA_DB_DIR, exist_ok=True)

    print(f"Loading embedding model: {EMBEDDING_MODEL_NAME} ...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    if reset:
        try:
            client.delete_collection(CHROMA_COLLECTION_NAME)
        except Exception:
            pass
    collection = client.get_or_create_collection(CHROMA_COLLECTION_NAME)

    bm25_corpus = []  # list of {id, tokens, text, metadata}

    pdf_paths = sorted(Path(pdf_dir).glob("*.pdf"))
    if not pdf_paths:
        print(f"No PDFs found in {pdf_dir}. Add some and re-run.")
        return

    for pdf_path in pdf_paths:
        print(f"Processing {pdf_path.name} ...")
        ids, texts, metas = [], [], []
        for page_num, page_text in extract_pages(pdf_path):
            for chunk_idx, chunk in enumerate(chunk_text(page_text)):
                ids.append(f"{pdf_path.stem}_p{page_num}_c{chunk_idx}")
                texts.append(chunk)
                metas.append({"source": pdf_path.name, "page": page_num, "chunk_index": chunk_idx})

        if not texts:
            print(f"  (no extractable text in {pdf_path.name} — scanned PDF? OCR is not supported yet)")
            continue

        # Embed in batches — far faster than one chunk at a time.
        embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32,
                                  show_progress_bar=False).tolist()
        for i in range(0, len(ids), 500):  # keep each Chroma insert small
            collection.upsert(
                ids=ids[i:i + 500], embeddings=embeddings[i:i + 500],
                documents=texts[i:i + 500], metadatas=metas[i:i + 500],
            )
        for cid, text, meta in zip(ids, texts, metas):
            bm25_corpus.append({"id": cid, "tokens": simple_tokenize(text), "text": text, "metadata": meta})
        print(f"  {len(texts)} chunks")

    with open(BM25_INDEX_PATH, "wb") as f:
        pickle.dump(bm25_corpus, f)

    print(f"\nIngested {len(bm25_corpus)} chunks from {len(pdf_paths)} PDF(s).")
    print(f"ChromaDB persisted at: {CHROMA_DB_DIR}")
    print(f"BM25 corpus saved at:  {BM25_INDEX_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest PDFs into BhashaRAG.")
    parser.add_argument("--pdf_dir", default=os.path.join(BASE_DIR, "data", "pdfs"), help="Directory containing PDF files.")
    parser.add_argument("--reset", action="store_true", help="Reset the existing collection before ingesting.")
    args = parser.parse_args()
    ingest_pdfs(args.pdf_dir, reset=args.reset)
