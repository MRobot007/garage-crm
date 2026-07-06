"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import anime from "animejs";
import { prefersReducedMotion } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const KIND_STYLES: Record<ToastKind, string> = {
  success: "border-l-4 border-ok",
  error: "border-l-4 border-bad",
  info: "border-l-4 border-brand",
};

const KIND_ICON: Record<ToastKind, string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => remove(id), 3800);
    },
    [remove],
  );

  const api: ToastApi = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="no-print pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    anime({
      targets: el,
      translateX: [24, 0],
      opacity: [0, 1],
      duration: 260,
      easing: "easeOutQuad",
    });
  }, []);

  return (
    <div
      ref={ref}
      role="status"
      className={`glass-strong pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 opacity-0 ${KIND_STYLES[toast.kind]}`}
    >
      <span
        aria-hidden
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
          toast.kind === "success"
            ? "bg-ok"
            : toast.kind === "error"
              ? "bg-bad"
              : "bg-brand"
        }`}
      >
        {KIND_ICON[toast.kind]}
      </span>
      <p className="flex-1 text-sm text-ink">{toast.message}</p>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="shrink-0 text-gray-400 hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
