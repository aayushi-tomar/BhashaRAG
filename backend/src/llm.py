"""
llm.py – Gemini-powered generation for BhashaRAG.

This module handles:
- Gemini client creation
- Gemini text generation
- Retry/backoff for temporary Gemini failures
- Grounded answer generation from retrieved document chunks
"""

import time

from google import genai
from google.genai import types

from config import GEMINI_API_KEY, GEMINI_MODEL


# -------------------------------------------------------------------
# Gemini client
# -------------------------------------------------------------------

_client = None


def get_llm_client():
    """Create and reuse the Gemini client."""

    global _client

    if _client is None:
        if not GEMINI_API_KEY:
            raise EnvironmentError(
                "GEMINI_API_KEY not set. "
                "Get a free key at https://aistudio.google.com/apikey "
                "and add it to your .env file."
            )

        _client = genai.Client(api_key=GEMINI_API_KEY)

    return _client


# -------------------------------------------------------------------
# System prompt
# -------------------------------------------------------------------

SYSTEM_PROMPT = """You are BhashaRAG, a multilingual document
question-answering assistant.

Rules:

1. Answer ONLY using the provided context chunks.
   Do not use outside knowledge.

2. If the answer is not contained in the context,
   say so clearly instead of guessing.

3. Respond in the same language the user asked the question in
   (English, Hindi, or Hinglish).

4. After your answer, list the sources you actually used
   in this format:

[Source: <document name>, Page <page number>]
"""


# -------------------------------------------------------------------
# Gemini request
# -------------------------------------------------------------------

def _call_gemini(
    contents,
    system_instruction=None,
    max_output_tokens=2048,
    temperature=0.2,
    retries=3,
):
    """
    Send a request to Gemini.

    Temporary Gemini failures such as 503 are retried using
    exponential backoff.
    """

    client = get_llm_client()

    # Keep the configuration minimal for compatibility with
    # the current Gemini model.
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        max_output_tokens=max_output_tokens,
    )

    last_error = None

    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=config,
            )

            return (response.text or "").strip()

        except Exception as e:
            last_error = e

            # Exponential backoff:
            # 5 seconds → 10 seconds → 20 seconds
            wait = 5 * (2 ** attempt)

            print(
                f"[llm] Gemini call failed ({e}); "
                f"retrying in {wait}s..."
            )

            if attempt < retries - 1:
                time.sleep(wait)

    raise RuntimeError(
        f"Gemini request failed after {retries} attempts: {last_error}"
    )


# -------------------------------------------------------------------
# Simple text generation
# -------------------------------------------------------------------

def generate_text(
    prompt,
    max_output_tokens=512,
    temperature=0.0,
):
    """
    Generate plain text using Gemini.

    Used by query expansion and other lightweight generation tasks.
    """

    return _call_gemini(
        prompt,
        max_output_tokens=max_output_tokens,
        temperature=temperature,
    )


# -------------------------------------------------------------------
# Context builder
# -------------------------------------------------------------------

def build_context_block(chunks):
    """
    Convert retrieved document chunks into a grounded context block.
    """

    parts = []

    for chunk in chunks:
        metadata = chunk["metadata"]

        source = metadata.get("source", "Unknown document")
        page = metadata.get("page", "Unknown")

        text = chunk["text"]

        parts.append(
            f"[Document: {source}, Page {page}]\n{text}"
        )

    return "\n\n---\n\n".join(parts)


# -------------------------------------------------------------------
# Grounded answer generation
# -------------------------------------------------------------------

def generate_answer(question, chunks):
    """
    Generate a grounded answer to a question using only
    the retrieved document chunks.
    """

    context = build_context_block(chunks)

    user_message = f"""Context:

{context}

Question:

{question}
"""

    return _call_gemini(
        user_message,
        system_instruction=SYSTEM_PROMPT,
        max_output_tokens=2048,
        temperature=0.2,
        retries=3,
    )