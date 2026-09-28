import React, { useState, useEffect, useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { QuerySettings } from "./QuerySettings";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  useExpansion: boolean;
  setUseExpansion: (val: boolean) => void;
  useReranker: boolean;
  setUseReranker: (val: boolean) => void;
  voice: boolean;
  setVoice: (val: boolean) => void;
  voiceLang: string;
  setVoiceLang: (lang: string) => void;
}

const PLACEHOLDER_HINTS = [
  "Ask in English, Hindi, or Hinglish...",
  "पात्रता की शर्तें और लाभ क्या हैं? (What are the eligibility criteria?)",
  "Scheme ke key implementation guidelines kya hain?",
  "What are the budget allocations and timelines?",
  "योजना के तहत आवेदन और सत्यापन प्रक्रिया क्या है?",
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  useExpansion,
  setUseExpansion,
  useReranker,
  setUseReranker,
  voice,
  setVoice,
  voiceLang,
  setVoiceLang,
}) => {
  const [inputText, setInputText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_HINTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-1">
      {/* Unified Executive Composer */}
      <div className="relative rounded-2xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/[0.08] shadow-elevated focus-within:border-slate-400 dark:focus-within:border-white/[0.2] transition-all p-3">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER_HINTS[placeholderIndex]}
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none min-h-[44px] max-h-48 leading-relaxed indic-text px-1"
        />

        {/* Integrated Composer Footer */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100 dark:border-white/[0.04]">
          {/* Left Controls */}
          <QuerySettings
            useExpansion={useExpansion}
            setUseExpansion={setUseExpansion}
            useReranker={useReranker}
            setUseReranker={setUseReranker}
            voice={voice}
            setVoice={setVoice}
            voiceLang={voiceLang}
            setVoiceLang={setVoiceLang}
          />

          {/* Right Action: Send */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!inputText.trim() || isLoading}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              inputText.trim() && !isLoading
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-95 shadow-sm"
                : "bg-slate-100 dark:bg-white/[0.05] text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
            }`}
            title="Send inquiry (Enter)"
            aria-label="Send inquiry"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
        <span>BhashaRAG Multilingual Model</span>
        <span>Enter ↵ to send</span>
      </div>
    </div>
  );
};
