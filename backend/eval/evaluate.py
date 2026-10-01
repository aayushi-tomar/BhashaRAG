"""
evaluate.py — The ablation study behind the project report's Evaluation
Plan (Section 9). Compares four retrieval configurations on a labeled test
set and reports Hit Rate@K, Mean Reciprocal Rank (MRR), and an LLM-as-judge
faithfulness score:

    A) dense vector search only                         (baseline)
    B) A + BM25 hybrid retrieval
    C) B + cross-encoder reranking
    D) C + query expansion                               (full system)

Usage (run from the eval/ directory, or adjust the path below):
    python eval/evaluate.py --test_set eval/test_set.json --k 5

Before running for real: fill in eval/test_set.json with actual questions
and the correct (source PDF filename, page number) pairs for documents you
have already indexed with src/ingest.py.
"""
import argparse
import json
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "src"))

from retrieve import dense_search, bm25_search, reciprocal_rank_fusion, rerank  # noqa: E402
from query_expansion import expand_query  # noqa: E402
from llm import generate_answer, generate_text  # noqa: E402

CONFIGS = ["A", "B", "C", "D"]
CONFIG_LABELS = {
    "A": "A: Dense vector only (baseline)",
    "B": "B: + BM25 hybrid retrieval",
    "C": "C: + Cross-encoder reranking",
    "D": "D: + Query expansion (full system)",
}


def load_test_set(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def is_hit(chunks, expected_source, expected_page, k):
    return any(
        c["metadata"].get("source") == expected_source and c["metadata"].get("page") == expected_page
        for c in chunks[:k]
    )


def reciprocal_rank(chunks, expected_source, expected_page):
    for rank, c in enumerate(chunks, start=1):
        if c["metadata"].get("source") == expected_source and c["metadata"].get("page") == expected_page:
            return 1.0 / rank
    return 0.0


def run_config(question, config, k):
    if config == "A":
        return dense_search(question, top_k=k)

    if config == "B":
        dense_hits = dense_search(question)
        bm25_hits = bm25_search(question)
        return reciprocal_rank_fusion([dense_hits, bm25_hits], top_k=k)

    if config == "C":
        dense_hits = dense_search(question)
        bm25_hits = bm25_search(question)
        fused = reciprocal_rank_fusion([dense_hits, bm25_hits])
        return rerank(question, fused, top_k=k)

    if config == "D":
        variants = expand_query(question)
        all_hits, seen = [], set()
        for v in variants:
            dense_hits = dense_search(v)
            bm25_hits = bm25_search(v)
            fused = reciprocal_rank_fusion([dense_hits, bm25_hits])
            for h in fused:
                if h["id"] not in seen:
                    seen.add(h["id"])
                    all_hits.append(h)
        return rerank(question, all_hits, top_k=k)

    raise ValueError(f"Unknown config: {config}")


def judge_faithfulness(question, answer, chunks):
    """LLM-as-judge: does the answer stick to the retrieved context? Returns 0-1, or None on error."""
    context = "\n\n".join(c["text"] for c in chunks)
    prompt = f"""You are grading whether an AI answer is fully grounded in the given context.

Context:
{context}

Question: {question}
Answer: {answer}

Reply with ONLY a single number from 0 to 1 (e.g. "0.8"), where 1 means the answer is entirely
supported by the context and 0 means it relies on outside knowledge or contradicts the context.
No words, no explanation — just the number."""
    try:
        text = generate_text(prompt, max_output_tokens=20, temperature=0.0)
        return max(0.0, min(1.0, float(text.strip().split()[0])))
    except Exception as e:
        print(f"[evaluate] faithfulness judge failed: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Run the BhashaRAG retrieval ablation study.")
    parser.add_argument("--test_set", default=os.path.join(os.path.dirname(__file__), "test_set.json"))
    parser.add_argument("--k", type=int, default=5, help="Cutoff K for Hit Rate@K / retrieved chunks used for generation.")
    parser.add_argument("--skip_generation", action="store_true", help="Skip LLM generation + faithfulness scoring (retrieval metrics only, faster/cheaper).")
    args = parser.parse_args()

    test_set = load_test_set(args.test_set)
    results = {c: {"hits": 0, "rr_sum": 0.0, "faithfulness_sum": 0.0, "faithfulness_n": 0, "n": 0} for c in CONFIGS}

    for item in test_set:
        question = item["question"]
        expected_source = item["expected_source"]
        expected_page = item["expected_page"]
        print(f"\nQuestion ({item.get('language', '?')}): {question}")

        for config in CONFIGS:
            chunks = run_config(question, config, k=max(args.k, 10))
            r = results[config]
            r["n"] += 1
            if is_hit(chunks, expected_source, expected_page, k=args.k):
                r["hits"] += 1
            r["rr_sum"] += reciprocal_rank(chunks, expected_source, expected_page)

            if not args.skip_generation:
                top = chunks[:args.k]
                answer = generate_answer(question, top)
                score = judge_faithfulness(question, answer, top)
                if score is not None:
                    r["faithfulness_sum"] += score
                    r["faithfulness_n"] += 1

            print(f"  [{config}] hit={is_hit(chunks, expected_source, expected_page, args.k)}  "
                  f"rr={reciprocal_rank(chunks, expected_source, expected_page):.2f}")

    print("\n" + "=" * 70)
    print(f"RESULTS (K={args.k}, n={len(test_set)} questions)")
    print("=" * 70)
    header = f"{'Configuration':<38}{'Hit Rate@K':<14}{'MRR':<10}{'Faithfulness':<12}"
    print(header)
    print("-" * len(header))
    for config in CONFIGS:
        r = results[config]
        n = r["n"] or 1
        faith = (r["faithfulness_sum"] / r["faithfulness_n"]) if r["faithfulness_n"] else float("nan")
        faith_str = f"{faith:.2f}" if faith == faith else "N/A"  # NaN check
        print(f"{CONFIG_LABELS[config]:<38}{r['hits']/n:<14.2f}{r['rr_sum']/n:<10.2f}{faith_str:<12}")


if __name__ == "__main__":
    main()
