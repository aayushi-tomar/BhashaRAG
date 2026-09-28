import { UploadCloud, ArrowUpRight, Sparkles } from "lucide-react";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  documentCount: number;
  onOpenUpload: () => void;
}

const SAMPLE_PROMPTS = [
  {
    category: "Policy Provisions",
    title: "Eligibility criteria & beneficiary scope",
    query:
      "What are the main eligibility criteria and documentation requirements mentioned in the document?",
    lang: "English",
  },
  {
    category: "नीति विश्लेषण",
    title: "मुख्य उद्देश्य एवं वित्तीय आवंटन",
    query:
      "इस नीति/योजना के मुख्य उद्देश्य क्या हैं और वित्तीय आवंटन के क्या प्रावधान हैं?",
    lang: "हिंदी",
  },
  {
    category: "Procedural Guidance",
    title: "Application process & deadlines (Hinglish)",
    query:
      "Scheme ke financial provisions, implementation timeline aur application process kya hai?",
    lang: "Hinglish",
  },
  {
    category: "Regulatory Review",
    title: "Grievance redressal & monitoring framework",
    query:
      "What is the implementation timeline, redressal mechanism, and nodal authority designated?",
    lang: "English",
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  documentCount,
  onOpenUpload,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto my-auto animate-fade-in">
      {/* Subtle Emblem */}
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[11px] font-medium text-slate-600 dark:text-zinc-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Grounded Indic Intelligence & Retrieval</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 mb-2.5 font-sans">
        What document insights do you need?
      </h2>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-lg mb-8 leading-relaxed">
        Query Indian government acts, policy frameworks, and research papers in
        English, Hindi, and Hinglish with strict page citations and synthesized
        Indic audio.
      </p>

      {/* 0 Documents Subtle Banner */}
      {documentCount === 0 ? (
        <div className="w-full max-w-xl p-4 rounded-xl bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border border-amber-500/20 text-left mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200">
                No documents uploaded yet
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Upload your PDF documents in the sidebar, then click Index
                Knowledge Base to ground your questions.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenUpload}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Upload
          </button>
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            {SAMPLE_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.query)}
                className="group relative p-3.5 rounded-xl bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                    {item.category}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                  {item.title}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 indic-text leading-relaxed">
                  {item.query}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
