"""
app.py — OPTIONAL built-in Gradio interface (the React frontend + api.py is the main UI).
Requires:  pip install gradio


Run with:
    python src/app.py
Then open http://localhost:7860
"""
import os
import shutil

import gradio as gr

import ingest
import retrieve
from config import BASE_DIR
from query import answer_question
from tts import synthesize_speech

PDF_DIR = os.path.join(BASE_DIR, "data", "pdfs")


def upload_and_index(files, progress=gr.Progress()):
    if not files:
        return "⚠️ Please choose at least one PDF first."

    os.makedirs(PDF_DIR, exist_ok=True)
    for f in files:
        src = f if isinstance(f, str) else f.name      # gradio versions differ: path string vs file object
        shutil.copy(src, os.path.join(PDF_DIR, os.path.basename(src)))

    progress(0.2, desc="Parsing and indexing documents...")
    ingest.ingest_pdfs(PDF_DIR, reset=True, model=retrieve._load_embedding_model())
    retrieve.reload_indexes()
    progress(1.0, desc="Done")
    return f"✅ Indexed {len(files)} document(s). You can start asking questions below."


def chat_fn(message, history, use_expansion, use_rerank, voice_on, voice_lang):
    answer = answer_question(
        message, use_expansion=use_expansion, use_reranker=use_rerank, verbose=False
    )

    audio_path = None
    if voice_on:
        audio_path = synthesize_speech(answer, language_code=voice_lang)

    return answer, audio_path


with gr.Blocks(title="BhashaRAG") as demo:
    gr.Markdown("# 🌏 BhashaRAG — Multilingual RAG for Indian Documents")
    gr.Markdown(
        "Upload PDFs, then ask questions in English, Hindi, or Hinglish. "
        "Every answer is grounded in your documents and cited by page."
    )

    with gr.Row():
        file_input = gr.File(file_count="multiple", file_types=[".pdf"], label="Upload PDFs")
        index_btn = gr.Button("Index Documents", variant="primary")
    status_box = gr.Textbox(label="Status", interactive=False)
    index_btn.click(upload_and_index, inputs=[file_input], outputs=[status_box])

    gr.Markdown("---")

    with gr.Row():
        use_expansion = gr.Checkbox(value=True, label="Query expansion (cross-lingual recall)")
        use_rerank = gr.Checkbox(value=True, label="Cross-encoder reranking")
        voice_on = gr.Checkbox(value=False, label="Speak the answer (Sarvam AI)")
        voice_lang = gr.Dropdown(
            choices=["hi-IN", "en-IN", "bn-IN", "ta-IN", "te-IN", "mr-IN", "gu-IN", "kn-IN", "ml-IN", "pa-IN", "od-IN"],
            value="hi-IN", label="Voice language",
        )

    question_box = gr.Textbox(label="Ask a question", placeholder="e.g. पात्रता की शर्तें क्या हैं?")
    ask_btn = gr.Button("Ask", variant="primary")
    answer_box = gr.Textbox(label="Answer", lines=8, interactive=False)
    audio_box = gr.Audio(label="Spoken answer", type="filepath")

    ask_btn.click(
        lambda q, e, r, v, l: chat_fn(q, None, e, r, v, l),
        inputs=[question_box, use_expansion, use_rerank, voice_on, voice_lang],
        outputs=[answer_box, audio_box],
    )


if __name__ == "__main__":
    demo.launch()
