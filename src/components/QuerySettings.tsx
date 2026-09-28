import React, { useState } from "react";
import {
  Volume2,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../types";

interface QuerySettingsProps {
  useExpansion: boolean;
  setUseExpansion: (val: boolean) => void;
  useReranker: boolean;
  setUseReranker: (val: boolean) => void;
  voice: boolean;
  setVoice: (val: boolean) => void;
  voiceLang: string;
  setVoiceLang: (lang: string) => void;
}

export const QuerySettings: React.FC<QuerySettingsProps> = ({
  useExpansion,
  setUseExpansion,
  useReranker,
  setUseReranker,
  voice,
  setVoice,
  voiceLang,
  setVoiceLang,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const selectedLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === voiceLang) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Query Expansion Micro-toggle */}
      <button
        type="button"
        onClick={() => setUseExpansion(!useExpansion)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          useExpansion
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
        }`}
        title="Generates alternate phrasings/translations of the question to improve cross-lingual retrieval"
      >
        <Sparkles className="w-3 h-3" />
        <span>Expansion</span>
      </button>

      {/* Reranker Micro-toggle */}
      <button
        type="button"
        onClick={() => setUseReranker(!useReranker)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          useReranker
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
        }`}
        title="Applies cross-encoder semantic reranking"
      >
        <SlidersHorizontal className="w-3 h-3" />
        <span>Rerank</span>
      </button>

      {/* Voice Toggle */}
      <button
        type="button"
        onClick={() => setVoice(!voice)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          voice
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
        }`}
        title="Synthesizes spoken audio response"
      >
        <Volume2 className="w-3 h-3" />
        <span>Voice</span>
      </button>

      {/* Voice Language Selector */}
      {voice && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all"
          >
            <span>{selectedLang.label}</span>
            <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
          </button>

          {langDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setLangDropdownOpen(false)}
              />
              <div className="absolute left-0 bottom-full mb-1.5 z-50 w-56 max-h-60 overflow-y-auto bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/[0.1] rounded-xl shadow-elevated p-1 text-xs backdrop-blur-xl">
                <div className="px-2 py-1 font-mono text-[10px] text-zinc-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.04] mb-1">
                  Indic Voice Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setVoiceLang(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      voiceLang === lang.code
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs">
                        {lang.label}{" "}
                        <span className="text-zinc-400 text-[11px]">
                          ({lang.nativeLabel})
                        </span>
                      </span>
                    </div>
                    {voiceLang === lang.code && (
                      <Check className="w-3 h-3 text-amber-500" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
