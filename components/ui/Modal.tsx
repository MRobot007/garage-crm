"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";
import { cn, prefersReducedMotion } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock scroll + animate in + move focus.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (panel && backdrop) {
      if (prefersReducedMotion()) {
        panel.style.opacity = "1";
        backdrop.style.opacity = "1";
      } else {
        anime({ targets: backdrop, opacity: [0, 1], duration: 160, easing: "linear" });
        anime({
          targets: panel,
          opacity: [0, 1],
          translateY: [12, 0],
          scale: [0.98, 1],
          duration: 220,
          easing: "easeOutCubic",
        });
      }
    }
    // Focus the first focusable control.
    const focusable = panel?.querySelector<HTMLElement>(
      "input, select, textarea, button, [tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus();

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-slate-900/40 opacity-0 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className={cn(
          "glass-strong relative z-10 my-8 w-full rounded-2xl opacity-0",
          SIZES[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-white/50 px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-white/60 hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-white/50 bg-white/30 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
