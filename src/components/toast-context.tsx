"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx.toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string, d?: number) => addToast("success", msg, d),
    error: (msg: string, d?: number) => addToast("error", msg, d),
    info: (msg: string, d?: number) => addToast("info", msg, d),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
              t.type === "success"
                ? "border-emerald-500/30 bg-slate-900/95 text-white shadow-emerald-500/20"
                : t.type === "error"
                  ? "border-rose-500/30 bg-slate-900/95 text-white shadow-rose-500/20"
                  : "border-cyan-500/30 bg-slate-900/95 text-white shadow-cyan-500/20"
            }`}
          >
            {t.type === "success" && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {t.type === "error" && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
            {t.type === "info" && <Info size={18} className="text-cyan-400 shrink-0" />}

            <p className="flex-1 text-[13px] font-medium leading-snug">{t.message}</p>

            <button
              onClick={() => removeToast(t.id)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

