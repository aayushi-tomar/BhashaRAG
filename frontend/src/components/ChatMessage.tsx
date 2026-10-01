import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChatMessageItem } from "../types";
import { AudioPlayer } from "./AudioPlayer";
import { api } from "../api/client";
import {
  FileText,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageItem;
  onOpenUpload?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onOpenUpload,
}) => {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resolvedAudioUrl = api.resolveAudioUrl(message.audioUrl);

  return (
    <div
      className={`flex w-full mb-8 ${
        isAssistant ? "justify-start" : "justify-end"
      } animate-fade-in`}
    >
      <div
        className={`flex flex-col w-full ${
          isAssistant ? "max-w-3xl" : "max-w-xl ml-auto items-end"
        }`}
      >
        {/* User Query Bubble */}
        {!isAssistant ? (
          <div className="rounded-2xl px-4 py-2.5 bg-slate-200/80 dark:bg-white/[0.08] text-slate-900 dark:text-zinc-100 text-sm leading-relaxed indic-text">
            {message.content}
          </div>
        ) : (
          /* Assistant Answer Area */
          <div className="w-full">
            {/* Answer Header */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold tracking-tight text-slate-800 dark:text-zinc-200">
                  Synthesized Answer
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  title="Copy response"
                  aria-label="Copy response"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error or Content */}
            {message.is404NotIndexed ? (
              <div className="p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">
                      Knowledge base is not yet indexed
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-3">
                      Please upload PDF documents to the repository and click
                      Index Documents.
                    </p>
                    {onOpenUpload && (
                      <button
                        onClick={onOpenUpload}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <span>Open Repository</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : message.isError ? (
              <div className="p-3.5 rounded-xl bg-red-500/[0.05] border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <p className="font-semibold mb-0.5">Query Error</p>
                <p>{message.content}</p>
              </div>
            ) : (
              <div className="prose-bhasha indic-text text-sm leading-relaxed text-slate-800 dark:text-zinc-200">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}

            {/* Sources Row */}
            {isAssistant && message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  <span>Grounding Sources ({message.sources.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {message.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.06] text-xs font-medium hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
                      title={`${src.document} (Page ${src.page})`}
                    >
                      <span className="text-zinc-400 font-mono text-[10px]">
                        [{idx + 1}]
                      </span>
                      <span className="truncate max-w-[180px] sm:max-w-[240px]">
                        {src.document}
                      </span>
                      <span className="px-1 py-0.2 rounded bg-slate-200 dark:bg-white/[0.06] text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        p.{src.page}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Player */}
            {isAssistant && resolvedAudioUrl && (
              <AudioPlayer src={resolvedAudioUrl} autoPlay={false} />
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-1 px-1 text-[10px] font-mono text-zinc-400">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};
