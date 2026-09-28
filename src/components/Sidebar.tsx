import { useState, useRef } from "react";
import {
  FileText,
  UploadCloud,
  RefreshCw,
  Loader2,
  X,
  Layers,
  FileCheck2,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documents: string[];
  isLoadingDocs: boolean;
  onRefreshDocs: () => void;
  onUploadFiles: (files: File[]) => Promise<void>;
  isUploading: boolean;
  onIndexDocuments: (reset: boolean) => Promise<void>;
  isIndexing: boolean;
  indexedCount: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  documents,
  isLoadingDocs,
  onRefreshDocs,
  onUploadFiles,
  isUploading,
  onIndexDocuments,
  isIndexing,
  indexedCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [resetIndex, setResetIndex] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.toLowerCase().endsWith(".pdf"),
    );

    if (droppedFiles.length > 0) {
      onUploadFiles(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.name.toLowerCase().endsWith(".pdf"),
      );
      if (selectedFiles.length > 0) {
        onUploadFiles(selectedFiles);
      }
      e.target.value = "";
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 lg:w-80 bg-slate-50/95 dark:bg-[#0c0e14] border-r border-slate-200/90 dark:border-white/[0.06] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="px-4 py-3.5 border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-tight text-slate-800 dark:text-zinc-200">
              Knowledge Repository
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/[0.07] text-[10px] font-mono text-slate-600 dark:text-zinc-400">
              {documents.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefreshDocs}
              disabled={isLoadingDocs}
              className="p-1.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh repository"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingDocs ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-200 transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimalist Upload Area */}
        <div className="p-3 border-b border-slate-200/80 dark:border-white/[0.06]">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-amber-500 bg-amber-500/[0.06]"
                : "border-slate-300 dark:border-white/[0.1] hover:border-slate-400 dark:hover:border-white/[0.2] bg-white/60 dark:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0">
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                  {isUploading ? "Uploading..." : "Add PDF Documents"}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  Drop files or click to browse
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoadingDocs && documents.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-zinc-400 text-xs gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span>Fetching index...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 px-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center mx-auto mb-2.5 text-zinc-400">
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                No documents loaded
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[180px] mx-auto leading-relaxed">
                Add policy PDFs or research whitepapers to ground queries.
              </p>
            </div>
          ) : (
            documents.map((doc, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1] hover:bg-white dark:hover:bg-white/[0.04] transition-all"
              >
                <div className="w-6 h-6 rounded bg-red-500/[0.08] text-red-500 dark:text-red-400 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium text-slate-800 dark:text-zinc-300 truncate group-hover:text-slate-950 dark:group-hover:text-zinc-100 transition-colors"
                    title={doc}
                  >
                    {doc}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    PDF Document
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Index Action Panel */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.06] bg-white/50 dark:bg-[#08090d]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={resetIndex}
                onChange={(e) => setResetIndex(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500 h-3 w-3 bg-transparent border-zinc-300 dark:border-zinc-700"
              />
              <span>Full Re-index</span>
            </label>

            {indexedCount !== null && (
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <FileCheck2 className="w-3 h-3" />
                <span>{indexedCount} indexed</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onIndexDocuments(resetIndex)}
            disabled={isIndexing || documents.length === 0}
            className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              isIndexing || documents.length === 0
                ? "bg-slate-200/50 dark:bg-white/[0.03] text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-sm active:scale-[0.99]"
            }`}
          >
            {isIndexing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>Generating Embeddings...</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                <span>Index Knowledge Base</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
