"""
make_test_set.py — Auto-generate the labeled evaluation set from YOUR indexed PDFs.

For each sampled chunk, the LLM writes one question (English / Hindi / Hinglish,
rotating) that the chunk answers. The chunk's (source PDF, page) becomes the
ground-truth label used by evaluate.py.

    python eval/make_test_set.py --n 18 --out eval/test_set.json

Run src/ingest.py first. IMPORTANT: skim the output and delete/fix any weak
questions — auto-generated data must be reviewed before you report numbers.
"""
import argparse, json, os, pickle, random, sys, time

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "src"))
from config import BM25_INDEX_PATH          # noqa: E402
from llm import generate_text                # noqa: E402

LANGS = [
    ("en", "English"),
    ("hi", "Hindi (Devanagari script)"),
    ("hinglish", "Hinglish (Hindi written in Roman/Latin letters, mixed with English words)"),
]
PROMPT = """Write ONE question in {lang} that can be answered using ONLY the passage below.
Rules: be specific; do NOT say "passage", "text", "document" or "according to"; do not copy whole
sentences; output only the question, nothing else.

Passage:
{chunk}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=18, help="number of questions")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "test_set.json"))
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--min_chars", type=int, default=200, help="skip very short chunks")
    args = ap.parse_args()

    if not os.path.exists(BM25_INDEX_PATH):
        sys.exit("No index found. Run: python src/ingest.py --reset")
    with open(BM25_INDEX_PATH, "rb") as f:
        corpus = [e for e in pickle.load(f) if len(e["text"]) >= args.min_chars]
    if not corpus:
        sys.exit("No chunks long enough to build questions from.")

    random.seed(args.seed)
    # spread across pages: at most one chunk per (source, page) first
    by_page = {}
    for e in corpus:
        by_page.setdefault((e["metadata"]["source"], e["metadata"]["page"]), []).append(e)
    pages = list(by_page)
    random.shuffle(pages)
    picks = [random.choice(by_page[k]) for k in pages][: args.n]

    items = []
    for i, e in enumerate(picks):
        code, name = LANGS[i % len(LANGS)]
        try:
            q = generate_text(PROMPT.format(lang=name, chunk=e["text"][:1500]),
                              max_output_tokens=120, temperature=0.4).strip().strip('"')
        except Exception as ex:
            print(f"  skipped chunk {e['id']}: {ex}"); continue
        if not q:
            continue
        items.append({"question": q, "language": code,
                      "expected_source": e["metadata"]["source"],
                      "expected_page": e["metadata"]["page"]})
        print(f"[{code}] p.{e['metadata']['page']}: {q}")
        time.sleep(1)   # gentle on the free-tier rate limit

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {len(items)} questions to {args.out}. Review them before evaluating.")
    if len(pages) < args.n:
        print(f"Note: only {len(pages)} distinct pages available, so fewer than --n questions.")


if __name__ == "__main__":
    main()
