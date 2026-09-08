import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, TriangleAlert } from "lucide-react";

type Kind = "success" | "info" | "error";
interface Toast {
  id: number;
  kind: Kind;
  text: string;
}

const ToastCtx = createContext<{ push: (text: string, kind?: Kind) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Kind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, kind, text }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3600);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? TriangleAlert : Info;
            const color = t.kind === "success" ? "text-emerald-500" : t.kind === "error" ? "text-rose-500" : "text-sky-500";
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-slate-900/5 bg-white/95 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <p className="flex-1 text-sm text-slate-700">{t.text}</p>
                <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} className="text-slate-300 hover:text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
