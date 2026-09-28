"""
llm.py — Wraps the Google Gemini API for grounded, citation-aware answer
generation over retrieved document chunks (report, Section 8.6).

Gemini is used because its free tier (Google AI Studio) needs no credit card
or billing setup, which suits a student project with no API budget. Only this
file decides which LLM is used; retrieval, reranking and the API layer are
LLM-agnostic.
"""
import time

from google import genai
from google.genai import types

from config import GEMINI_API_KEY, GEMINI_MODEL, GENERATION_TEMPERATURE, JUDGE_TEMPERATURE

_client = None


def get_llm_client():
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise EnvironmentError(
                "GEMINI_API_KEY not set. Get a free key at "
                "https://aistudio.google.com/apikey and add it to your .env file."
            )
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


SYSTEM_PROMPT = """You are BhashaRAG, a multilingual document question-answering assistant.

Rules:
1. Answer ONLY using the provided context chunks. Do not use outside knowledge.
2. If the answer is not contained in the context, say so clearly instead of guessing.
3. Respond in the same language the user asked the question in (English, Hindi, or Hinglish).
4. After your answer, list the sources you actually used, in the format:
   [Source: <document name>, Page <page number>]
"""


def _call_gemini(contents, system_instruction=None, max_output_tokens=2048,
                 temperature=GENERATION_TEMPERATURE, retries=3):
    """
    Single place that talks to Gemini. Retries with backoff because the free
    tier enforces per-minute rate limits (HTTP 429) — important when running
    the evaluation script, which makes many calls in a row.
    """
    client = get_llm_client()
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        max_output_tokens=max_output_tokens,
        temperature=temperature,
        # Skip "thinking" tokens: they count against max_output_tokens on
        # 2.5-series models and can leave short answers empty/truncated.
        thinking_config=types.ThinkingConfig(thinking_budget=0),
    )

    last_error = None
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL, contents=contents, config=config
            )
            return (response.text or "").strip()
        except Exception as e:  # rate limit, transient network error, etc.
            last_error = e
            if attempt < retries - 1:
                wait = 5 * (attempt + 1)
                print(f"[llm] Gemini call failed ({e}); retrying in {wait}s...")
                time.sleep(wait)
    raise RuntimeError(f"Gemini request failed after {retries} attempts: {last_error}")


def generate_text(prompt, max_output_tokens=512, temperature=JUDGE_TEMPERATURE):
    """Plain prompt -> text. Used by query expansion and the faithfulness judge."""
    return _call_gemini(prompt, max_output_tokens=max_output_tokens, temperature=temperature)


def build_context_block(chunks):
    parts = []
    for c in chunks:
        meta = c["metadata"]
        parts.append(f"[Document: {meta.get('source')}, Page {meta.get('page')}]\n{c['text']}")
    return "\n\n---\n\n".join(parts)


def generate_answer(question, chunks):
    """Generate a grounded answer to `question` using only the given `chunks`."""
    context = build_context_block(chunks)
    user_message = f"Context:\n{context}\n\nQuestion: {question}"
    return _call_gemini(user_message, system_instruction=SYSTEM_PROMPT, max_output_tokens=2048)
