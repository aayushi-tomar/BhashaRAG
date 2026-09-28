"""
query.py — Command-line entry point for asking BhashaRAG a question.

Full pipeline: query expansion -> hybrid retrieval per variant -> merge ->
cross-encoder rerank -> grounded generation with citations.

Examples:
    python src/query.py --question "What are the eligibility criteria?"
    python src/query.py --question "इस दस्तावेज़ का मुख्य उद्देश्य क्या है?"
    python src/query.py --question "Ye document kis baare me hai?" --no-expansion
"""
import argparse

from retrieve import multi_query_retrieve, rerank
from query_expansion import expand_query
from llm import generate_answer
from config import TOP_K_RERANKED


def answer_question(question, use_expansion=True, use_reranker=True, verbose=True):
    variants = expand_query(question) if use_expansion else [question]
    if verbose:
        print(f"Query variants used for retrieval: {variants}")

    all_hits = multi_query_retrieve(variants)

    top_chunks = (
        rerank(question, all_hits, top_k=TOP_K_RERANKED)
        if use_reranker else all_hits[:TOP_K_RERANKED]
    )

    if verbose:
        print("\nTop retrieved chunks:")
        for c in top_chunks:
            print(f"  - {c['metadata']['source']} (page {c['metadata']['page']})")

    return generate_answer(question, top_chunks)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ask BhashaRAG a question from the CLI.")
    parser.add_argument("--question", required=True, help="Your question in English, Hindi, or Hinglish.")
    parser.add_argument("--no-expansion", action="store_true", help="Disable query expansion.")
    parser.add_argument("--no-rerank", action="store_true", help="Disable cross-encoder reranking.")
    args = parser.parse_args()

    answer = answer_question(
        args.question,
        use_expansion=not args.no_expansion,
        use_reranker=not args.no_rerank,
    )
    print("\n=== Answer ===")
    print(answer)
