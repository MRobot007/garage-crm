"use client";

import { forwardRef } from "react";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand to-teal-700 text-white shadow-md shadow-brand/25 hover:brightness-[1.08] disabled:opacity-50 disabled:shadow-none",
  secondary:
    "glass-soft text-ink hover:bg-white/70 disabled:opacity-50",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:brightness-110 disabled:opacity-50",
  ghost: "bg-transparent text-gray-600 hover:bg-white/60 hover:text-ink",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading,
      className,
      children,
      disabled,
      onMouseMove,
      onMouseLeave,
      ...rest
    },
    ref,
  ) {
    // Magnetic pull toward the cursor (desktop; skipped for reduced-motion).
    function handleMove(e: React.MouseEvent<HTMLButtonElement>) {
      const el = e.currentTarget;
      if (!disabled && !loading && !prefersReducedMotion()) {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * 0.12}px, ${my * 0.18}px)`;
      }
      onMouseMove?.(e);
    }
    function handleLeave(e: React.MouseEvent<HTMLButtonElement>) {
      e.currentTarget.style.transform = "";
      onMouseLeave?.(e);
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg font-medium transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...rest}
      >
        {variant === "primary" && <span className="fx-sheen" aria-hidden />}
        {loading && <Spinner size={size === "sm" ? 14 : 16} />}
        {children}
      </button>
    );
  },
);
