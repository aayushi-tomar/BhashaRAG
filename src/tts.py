"""
tts.py — Optional voice output via the Sarvam AI text-to-speech API (Bulbul v3).

Written against Sarvam's current REST reference (docs.sarvam.ai):
  * POST https://api.sarvam.ai/text-to-speech, header `api-subscription-key`
  * body: text, target_language_code, speaker, model, pace
  * bulbul:v2 has been retired, so bulbul:v3 is used; speaker names are
    lowercase and must belong to the chosen model (default "shubh")
  * max 2500 characters per request -> long answers are split into chunks
    and the returned WAV pieces are joined into one file
  * response: {"audios": [<base64 WAV>]}

Fails soft: returns None if the key is missing or a request fails, so the app
keeps working without voice.
"""
import base64
import io
import os
import re
import wave

import requests

from config import SARVAM_API_KEY, SARVAM_MODEL, SARVAM_SPEAKER, BASE_DIR

TTS_URL = "https://api.sarvam.ai/text-to-speech"
MAX_CHARS = 2400  # API limit is 2500; keep a safety margin


def clean_for_speech(text):
    """Remove things that sound wrong when read aloud: citation lines, markdown."""
    text = re.sub(r"\[Source:[^\]]*\]", "", text)
    text = re.sub(r"[*_`#>]+", "", text)
    text = re.sub(r"^\s*[-•]\s+", "", text, flags=re.MULTILINE)
    return re.sub(r"\n{2,}", "\n", text).strip()


def split_text(text, limit=MAX_CHARS):
    """Split into chunks <= limit, preferring sentence ends (., ?, !, danda)."""
    chunks, current = [], ""
    for sent in re.split(r"(?<=[.!?।\n])\s+", text):
        if len(current) + len(sent) + 1 <= limit:
            current = f"{current} {sent}".strip()
        else:
            if current:
                chunks.append(current)
            while len(sent) > limit:  # a single huge sentence
                chunks.append(sent[:limit])
                sent = sent[limit:]
            current = sent
    if current:
        chunks.append(current)
    return chunks


def _join_wavs(wav_bytes_list):
    if len(wav_bytes_list) == 1:
        return wav_bytes_list[0]
    out = io.BytesIO()
    with wave.open(out, "wb") as w_out:
        for i, data in enumerate(wav_bytes_list):
            with wave.open(io.BytesIO(data), "rb") as w_in:
                if i == 0:
                    w_out.setparams(w_in.getparams())
                w_out.writeframes(w_in.readframes(w_in.getnframes()))
    return out.getvalue()


def synthesize_speech(text, language_code="hi-IN", speaker=None, model=None,
                      pace=1.0, output_path=None):
    """Convert `text` to speech, save a WAV file, return its path (or None)."""
    if not SARVAM_API_KEY:
        print("[tts] SARVAM_API_KEY not set — skipping voice output.")
        return None

    text = clean_for_speech(text)
    if not text:
        return None
    output_path = output_path or os.path.join(BASE_DIR, "data", "last_answer.wav")
    headers = {"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"}

    try:
        pieces = []
        for chunk in split_text(text):
            payload = {
                "text": chunk,
                "target_language_code": language_code,
                "speaker": (speaker or SARVAM_SPEAKER).lower(),
                "model": model or SARVAM_MODEL,
                "pace": pace,
            }
            r = requests.post(TTS_URL, headers=headers, json=payload, timeout=60)
            if r.status_code != 200:
                print(f"[tts] Sarvam returned {r.status_code}: {r.text[:300]}")
                return None
            pieces.append(base64.b64decode(r.json()["audios"][0]))

        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(_join_wavs(pieces))
        return output_path
    except Exception as e:
        print(f"[tts] Sarvam TTS request failed: {e}")
        return None
