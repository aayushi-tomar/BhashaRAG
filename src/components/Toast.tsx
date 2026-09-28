import React from "react";
import { ToastMessage } from "../types";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform animate-slide-up ${
            t.type === "success"
              ? "bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100"
              : t.type === "error"
                ? "bg-red-50/95 border-red-200 text-red-900 dark:bg-red-950/90 dark:border-red-800 dark:text-red-100"
                : t.type === "warning"
                  ? "bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-100"
                  : "bg-slate-50/95 border-slate-200 text-slate-900 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
            {t.type === "error" && (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            {t.type === "warning" && (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
            {t.type === "info" && (
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <div className="flex-1 text-sm">
            <div className="font-semibold">{t.title}</div>
            {t.message && (
              <div className="mt-0.5 text-xs opacity-90">{t.message}</div>
            )}
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
