"""
query_expansion.py — Multi-query retrieval for cross-lingual robustness.

Cross-lingual retrieval is harder than same-language retrieval because
embedding alignment across languages is imperfect (report, Section 8.5).
This module asks the LLM to generate a few alternate phrasings/translations
of the user's question; retrieve.py then retrieves for every variant and
merges the results, increasing the chance of matching the correct passage.
"""
import json
import re

from llm import generate_text
from config import NUM_QUERY_VARIANTS

EXPANSION_PROMPT = """You expand search queries for a multilingual document retrieval system.
Given the user's question below, produce {n} alternative phrasings that preserve the original
meaning. Include at least one English phrasing and one Hindi phrasing regardless of the input
language, so cross-lingual retrieval has the best chance of matching relevant passages.

Respond ONLY with a JSON array of strings — no preamble, no markdown fences, no explanation.

Question: {question}
"""


def _extract_json_array(text):
    """Best-effort extraction of a JSON array from a possibly-messy LLM response."""
    text = text.strip()
    match = re.search(r"\[.*\]", text, flags=re.DOTALL)
    if match:
        text = match.group(0)
    return json.loads(text)


def expand_query(question, n=NUM_QUERY_VARIANTS):
    """Return [original_question, *variants]. Falls back to just the original on any error."""
    prompt = EXPANSION_PROMPT.format(n=n, question=question)

    try:
        text = generate_text(prompt, max_output_tokens=400, temperature=0.3)
        variants = _extract_json_array(text)
        variants = [v for v in variants if isinstance(v, str) and v.strip()]
        # de-duplicate while preserving order, original question always first
        seen = {question.strip().lower()}
        result = [question]
        for v in variants:
            key = v.strip().lower()
            if key not in seen:
                seen.add(key)
                result.append(v)
        return result
    except Exception as e:
        print(f"[query_expansion] falling back to original query only: {e}")
        return [question]
