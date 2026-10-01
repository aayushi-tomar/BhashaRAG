"""
tts.py — Optional voice output via the Sarvam AI text-to-speech API.

Sarvam's Bulbul models are tuned for Indian languages and accents.
Verified against the current Sarvam docs (docs.sarvam.ai):
  * endpoint  POST https://api.sarvam.ai/text-to-speech
  * header    api-subscription-key: <key>
  * body      {"text": str, "target_language_code": "hi-IN", "speaker": "shubh",
               "model": "bulbul:v3", "pace": 1.0}
  * response  {"audios": [<base64 WAV>, ...]}
  * limit     2500 chars per request on bulbul:v3 -> long answers are split
              into sentence-aligned chunks and the WAV pieces are joined.

This module fails soft: if the key is missing or a request fails, functions
return None so the rest of the app keeps working without voice.
"""
import base64
import io
import os
import re
import wave

import requests

from config import (
    SARVAM_API_KEY, SARVAM_TTS_MODEL, SARVAM_TTS_SPEAKER,
    SARVAM_TTS_MAX_CHARS, SARVAM_TTS_MAX_CHUNKS, BASE_DIR,
)

TTS_URL = "https://api.sarvam.ai/text-to-speech"


def clean_for_speech(text):
    """Strip markdown and citation lines so the voice reads only the answer."""
    text = re.sub(r"\[Source:[^\]]*\]", "", text)          # [Source: doc.pdf, Page 5]
    text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    text = re.sub(r"[*_#>`]+", "", text)                    # markdown emphasis/headers
    text = re.sub(r"^\s*[-•]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_text(text, max_chars=SARVAM_TTS_MAX_CHARS):
    """Split into <= max_chars pieces, breaking on sentence ends (incl. Hindi danda)."""
    sentences = re.split(r"(?<=[.!?।])\s+", text)
    chunks, cur = [], ""
    for sent in sentences:
        while len(sent) > max_chars:                        # pathological long sentence
            cut = sent.rfind(" ", 0, max_chars)
            cut = cut if cut > 0 else max_chars
            if cur:
                chunks.append(cur); cur = ""
            chunks.append(sent[:cut]); sent = sent[cut:].lstrip()
        if len(cur) + len(sent) + 1 > max_chars and cur:
            chunks.append(cur); cur = sent
        else:
            cur = f"{cur} {sent}".strip()
    if cur:
        chunks.append(cur)
    return chunks


def _join_wavs(wav_blobs):
    """Concatenate several WAV byte blobs (same format) into one WAV."""
    if len(wav_blobs) == 1:
        return wav_blobs[0]
    out = io.BytesIO()
    with wave.open(out, "wb") as w_out:
        for i, blob in enumerate(wav_blobs):
            with wave.open(io.BytesIO(blob), "rb") as w_in:
                if i == 0:
                    w_out.setparams(w_in.getparams())
                w_out.writeframes(w_in.readframes(w_in.getnframes()))
    return out.getvalue()


def synthesize_speech(
    text,
    language_code="hi-IN",
    speaker=SARVAM_TTS_SPEAKER,
    model=SARVAM_TTS_MODEL,
    pace=1.0,
    output_path=None,
):
    """Convert `text` to speech, save as WAV, return the path (or None on failure)."""
    if not SARVAM_API_KEY:
        print("[tts] SARVAM_API_KEY not set — skipping voice output.")
        return None

    spoken = clean_for_speech(text)
    if not spoken:
        return None
    chunks = split_text(spoken)[:SARVAM_TTS_MAX_CHUNKS]

    headers = {"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"}
    blobs = []
    try:
        for chunk in chunks:
            payload = {
                "text": chunk,
                "target_language_code": language_code,
                "speaker": speaker,
                "model": model,
                "pace": pace,
            }
            r = requests.post(TTS_URL, headers=headers, json=payload, timeout=60)
            if r.status_code != 200:
                print(f"[tts] Sarvam error {r.status_code}: {r.text[:200]}")
                return None
            blobs.append(base64.b64decode(r.json()["audios"][0]))

        audio = _join_wavs(blobs) if all(b[:4] == b"RIFF" for b in blobs) else blobs[0]

        output_path = output_path or os.path.join(BASE_DIR, "data", "audio", "last_answer.wav")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(audio)
        return output_path
    except Exception as e:
        print(f"[tts] Sarvam TTS request failed: {e}")
        return None
