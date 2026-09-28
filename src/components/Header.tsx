import { Sun, Moon, Trash2, Menu, X, FileText } from "lucide-react";
import { API_BASE_URL } from "../api/client";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onClearChat: () => void;
  hasMessages: boolean;
  backendOnline: boolean | null;
  documentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isDarkMode,
  setIsDarkMode,
  onClearChat,
  hasMessages,
  backendOnline,
  documentCount,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-white/70 dark:bg-[#0c0e14]/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.06] transition-colors">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all md:hidden"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-amber-500/20 to-amber-600/10 dark:from-amber-500/15 dark:to-amber-500/5 border border-amber-500/30 dark:border-amber-500/20 shadow-sm">
            <span className="text-sm font-bold bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">
              भा
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100 font-sans">
              Bhasha
              <span className="text-amber-600 dark:text-amber-500">RAG</span>
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-medium tracking-wide uppercase text-zinc-400 dark:text-zinc-500">
              Intelligence Studio
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* API Telemetry Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-tight border transition-all ${
            backendOnline === true
              ? "bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : backendOnline === false
                ? "bg-red-500/[0.07] text-red-600 dark:text-red-400 border-red-500/20"
                : "bg-zinc-500/[0.07] text-zinc-500 dark:text-zinc-400 border-zinc-500/20"
          }`}
          title={
            backendOnline === true
              ? `Backend API reachable at ${API_BASE_URL}`
              : backendOnline === false
                ? "Backend API unreachable"
                : "Checking API status..."
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendOnline === true
                ? "bg-emerald-500 animate-pulse"
                : backendOnline === false
                  ? "bg-red-500"
                  : "bg-zinc-400"
            }`}
          />
          <span className="text-[11px] font-sans font-medium">
            {backendOnline === true
              ? "Engine Active"
              : backendOnline === false
                ? "Engine Offline"
                : "Connecting"}
          </span>
        </div>

        {/* Mobile Documents Count */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="inline-flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08]"
        >
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          <span>{documentCount}</span>
        </button>

        {/* Clear Chat */}
        {hasMessages && (
          <button
            type="button"
            onClick={onClearChat}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Dark/Light Toggle */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          title={isDarkMode ? "Light appearance" : "Dark appearance"}
          aria-label="Toggle appearance"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600" />
          )}
        </button>
      </div>
    </header>
  );
};
